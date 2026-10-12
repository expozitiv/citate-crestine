/**
 * Portretele autorilor: optimizare web + upload în Payload (colecția `media`, stocată în Supabase)
 * + legare la `autor.imagine`.
 *
 * Intrare: backups/portrete-candidati.json (generat în sesiunea de căutare; câmpul `local` =
 *          fișierul original din backups/portrete-src/) și, opțional, data-dump/poze/<slug>.<ext>
 *          pentru poze primite direct (au prioritate față de candidați).
 *
 * Optimizare: decupaj pătrat (strategia „attention” a sharp — se centrează pe față), 480×480,
 *             JPEG progresiv, mozjpeg, calitate 82, fără metadate → ~15–35 KB.
 *             480 = lățimea variantei `medalion` din Media.ts; medalionul afișat are 140–168 px,
 *             deci 480 acoperă și ecranele 3x.
 *
 * Idempotent: un autor care are deja `imagine` este sărit, cu excepția celor din REPROCESEAZA
 *             (portretele vechi, neoptimizate), care primesc un media nou, iar cel vechi se șterge.
 *
 * Rulare:  npm run import:portrete                    (dry-run: doar procesează în backups/portrete-out/)
 *          IMPORT_CONFIRM=1 npm run import:portrete   (upload + legare)
 *          RESPINSE=39,41 … (ID-uri de autor excluse)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'

const DRY_RUN = process.env.IMPORT_CONFIRM !== '1'
const RESPINSE = new Set((process.env.RESPINSE ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean))
/** Autori cu portret vechi, neoptimizat, care se reprocesează din `media/` (originalele locale). */
const REPROCESEAZA: Record<string, string> = {
  'charles-h-spurgeon': 'media/spurgeon-portrait_orig.jpg',
  'james-smith': 'media/smithjames.jpg',
}
const LATURA = 480
const CALITATE = 82
/** Decupaje manuale (px în originalul din portrete-src) acolo unde strategia automată prinde cadrul/textul gravurii. */
const DECUPAJ: Record<string, { left: number; top: number; size: number }> = {
  'thomas-goodwin': { left: 170, top: 140, size: 440 },
  'william-gouge': { left: 60, top: 40, size: 270 },
  'thomas-brooks': { left: 50, top: 115, size: 200 },
}
/** Surse alternative (fișier din portrete-src) acolo unde candidatul ales nu e un portret. */
const SURSA_ALTERNATIVA: Record<string, string> = {
  'john-macduff': '27.jpg', // varianta Wikipedia e o semnătură, nu un portret → gracequotes
  'thomas-hooker': '59.jpg', // varianta Wikipedia e o scenă istorică → gracequotes
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dirname, '..')
const fisierCandidati = path.join(root, 'backups/portrete-candidati.json')
const dirSursa = path.join(root, 'backups/portrete-src')
const dirPoze = path.join(root, 'data-dump/poze')
const dirOut = path.join(root, 'backups/portrete-out')
mkdirSync(dirOut, { recursive: true })

type Candidat = { id: number; nume: string; slug: string; sursa: string | null; local?: string | null; pagina?: string | null }
const candidati: Candidat[] = JSON.parse(readFileSync(fisierCandidati, 'utf8'))

/** Pozele primite direct: data-dump/poze/<slug>.(jpg|jpeg|png|webp) */
const pozeDirecte = new Map<string, string>()
if (existsSync(dirPoze)) {
  for (const f of readdirSync(dirPoze)) {
    const m = f.match(/^(.+)\.(jpe?g|png|webp)$/i)
    if (m) pozeDirecte.set(m[1], path.join(dirPoze, f))
  }
}

const optimizeaza = async (sursa: string, slug: string): Promise<{ fisier: string; bytes: number }> => {
  const fisier = path.join(dirOut, `${slug}.jpg`)
  const d = DECUPAJ[slug]
  let img = sharp(sursa).rotate() // respectă EXIF orientation
  if (d) img = img.extract({ left: d.left, top: d.top, width: d.size, height: d.size })
  await img
    .resize(LATURA, LATURA, { fit: 'cover', position: sharp.strategy.attention, withoutEnlargement: false })
    .jpeg({ quality: CALITATE, progressive: true, mozjpeg: true })
    .toFile(fisier)
  return { fisier, bytes: statSync(fisier).size }
}

const payload = await getPayload({ config })

/**
 * Plugin-ul S3 nu trimite Cache-Control la upload, iar Supabase răspunde atunci cu
 * `cache-control: no-cache` — browserul re-descarcă medalionul la fiecare vizită.
 * Rescriem metadatele obiectului (copie peste el însuși) cu cache lung; numele de
 * fișier e unic per upload, deci `immutable` e sigur.
 */
const s3 = process.env.S3_BUCKET
  ? new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
    })
  : null
const seteazaCache = async (filename: string): Promise<void> => {
  if (!s3) return
  const Bucket = process.env.S3_BUCKET!
  await s3.send(
    new CopyObjectCommand({
      Bucket,
      Key: filename,
      CopySource: `/${Bucket}/${encodeURIComponent(filename)}`,
      MetadataDirective: 'REPLACE',
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
}

const autori = (
  await payload.find({ collection: 'autori', limit: 0, pagination: false, depth: 0, select: { nume: true, slug: true, imagine: true } as never })
).docs as { id: number; nume: string; slug: string; imagine?: number | { id: number } | null }[]
const idImagine = (v: unknown): number | null => (typeof v === 'object' && v ? (v as { id: number }).id : typeof v === 'number' ? v : null)

let procesate = 0
let urcate = 0
let sarite = 0
let esuate = 0
let totalBytes = 0

for (const autor of autori) {
  const imagineVeche = idImagine(autor.imagine)
  const reproceseaza = REPROCESEAZA[autor.slug]
  if (RESPINSE.has(autor.id)) {
    sarite++
    continue
  }
  if (imagineVeche && !reproceseaza) {
    sarite++
    continue
  }

  const cand = candidati.find((c) => c.id === autor.id)
  const sursa =
    pozeDirecte.get(autor.slug) ??
    (reproceseaza ? path.join(root, reproceseaza) : undefined) ??
    (SURSA_ALTERNATIVA[autor.slug] ? path.join(dirSursa, SURSA_ALTERNATIVA[autor.slug]) : undefined) ??
    (cand?.local ? path.join(dirSursa, cand.local) : undefined)
  if (!sursa || !existsSync(sursa)) {
    continue
  }

  try {
    const { fisier, bytes } = await optimizeaza(sursa, autor.slug)
    procesate++
    totalBytes += bytes
    const eticheta = pozeDirecte.has(autor.slug) ? 'poze/' : reproceseaza ? 'reprocesat' : (cand?.sursa ?? '?')
    console.log(`${DRY_RUN ? '[dry] ' : ''}${autor.nume} ← ${eticheta} → ${Math.round(bytes / 1024)} KB`)
    if (DRY_RUN) continue

    const media = await payload.create({
      collection: 'media',
      filePath: fisier,
      data: { alt: autor.nume },
      depth: 0,
    })
    await payload.update({ collection: 'autori', id: autor.id, data: { imagine: media.id as number }, depth: 0 })
    const m = media as { filename?: string; sizes?: { medalion?: { filename?: string } } }
    for (const f of [m.filename, m.sizes?.medalion?.filename]) {
      if (!f) continue
      try {
        await seteazaCache(f)
      } catch (e) {
        console.warn(`  ! cache-control pe ${f}: ${(e as Error).message.split('\n')[0]}`)
      }
    }
    if (imagineVeche) {
      try {
        await payload.delete({ collection: 'media', id: imagineVeche, depth: 0 })
      } catch (e) {
        console.warn(`  ! media vechi ${imagineVeche} nu s-a putut șterge: ${(e as Error).message}`)
      }
    }
    urcate++
  } catch (e) {
    esuate++
    console.warn(`! ${autor.nume}: ${(e as Error).message.split('\n')[0]}`)
  }
}

console.log(
  `${DRY_RUN ? 'DRY-RUN' : 'Gata'}: ${procesate} procesate (${Math.round(totalBytes / 1024)} KB total, medie ${procesate ? Math.round(totalBytes / procesate / 1024) : 0} KB), ${urcate} urcate, ${sarite} sărite (au deja imagine / respinse), ${esuate} eșuate.`,
)
process.exit(0)
