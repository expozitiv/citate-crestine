/**
 * Copiază fișierele colecției `media` din bucket-ul Supabase Storage în bucket-ul public
 * Cloudflare R2, cu aceleași chei (Payload le găsește după `filename`, deci nimic din bază
 * nu se schimbă). Vezi docs/migrare-media-r2.md pentru ordinea pașilor.
 *
 * Idempotent: un obiect care există deja în R2 cu aceeași mărime e sărit, deci scriptul se
 * poate rula de mai multe ori (o dată înainte de comutare, încă o dată imediat după, pentru
 * fișierele încărcate între timp).
 *
 *   node scripts/migrare-media-r2.mjs              (dry-run: doar listează ce ar copia)
 *   MIGRARE_CONFIRM=1 node scripts/migrare-media-r2.mjs
 *   MIGRARE_VERIFICA=1 node scripts/migrare-media-r2.mjs   (compară cele două bucket-uri)
 *
 * Sursa:      SUPABASE_S3_BUCKET, SUPABASE_S3_ENDPOINT, SUPABASE_S3_REGION,
 *             SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY
 * Destinația: R2_ACCOUNT_ID, R2_MEDIA_BUCKET, R2_MEDIA_ACCESS_KEY_ID, R2_MEDIA_SECRET_ACCESS_KEY
 *             (token R2 „Object Read & Write” limitat la bucket-ul media)
 */
import process from 'node:process'

import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { config } from 'dotenv'

config()

const DRY_RUN = process.env.MIGRARE_CONFIRM !== '1'
const VERIFICA = process.env.MIGRARE_VERIFICA === '1'

const necesare = [
  'SUPABASE_S3_BUCKET',
  'SUPABASE_S3_ENDPOINT',
  'SUPABASE_S3_ACCESS_KEY_ID',
  'SUPABASE_S3_SECRET_ACCESS_KEY',
  'R2_ACCOUNT_ID',
  'R2_MEDIA_BUCKET',
  'R2_MEDIA_ACCESS_KEY_ID',
  'R2_MEDIA_SECRET_ACCESS_KEY',
]
const lipsa = necesare.filter((v) => !process.env[v])
if (lipsa.length) {
  console.error(`Lipsesc din mediu / .env: ${lipsa.join(', ')}`)
  process.exit(1)
}

const env = process.env
const sursa = {
  bucket: env.SUPABASE_S3_BUCKET,
  client: new S3Client({
    endpoint: env.SUPABASE_S3_ENDPOINT,
    region: env.SUPABASE_S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
      secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
    },
  }),
}
const dest = {
  bucket: env.R2_MEDIA_BUCKET,
  client: new S3Client({
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: env.R2_MEDIA_ACCESS_KEY_ID,
      secretAccessKey: env.R2_MEDIA_SECRET_ACCESS_KEY,
    },
  }),
}

/** Toate obiectele unui bucket: cheie → mărime. */
const listeaza = async ({ client, bucket }) => {
  const obiecte = new Map()
  let ContinuationToken
  do {
    const r = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }))
    for (const o of r.Contents ?? []) {
      // Supabase listează și „folderul” gol `.emptyFolderPlaceholder`.
      if (o.Key && !o.Key.endsWith('.emptyFolderPlaceholder')) obiecte.set(o.Key, o.Size ?? 0)
    }
    ContinuationToken = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (ContinuationToken)
  return obiecte
}

const dinSursa = await listeaza(sursa)
const dinDest = await listeaza(dest)
const totalOcteti = [...dinSursa.values()].reduce((a, b) => a + b, 0)
console.log(
  `Supabase: ${dinSursa.size} obiecte (${(totalOcteti / 1024 / 1024).toFixed(1)} MB) · R2: ${dinDest.size} obiecte`,
)

if (VERIFICA) {
  const lipsesc = [...dinSursa].filter(([k, m]) => dinDest.get(k) !== m)
  const doarInR2 = [...dinDest.keys()].filter((k) => !dinSursa.has(k))
  for (const [k] of lipsesc) console.log(`  lipsește / diferă în R2: ${k}`)
  for (const k of doarInR2) console.log(`  doar în R2 (încărcat după comutare): ${k}`)
  console.log(lipsesc.length ? `NU e complet: ${lipsesc.length} diferențe.` : 'OK — R2 conține tot.')
  process.exit(lipsesc.length ? 1 : 0)
}

const deCopiat = [...dinSursa].filter(([k, m]) => dinDest.get(k) !== m)
console.log(`De copiat: ${deCopiat.length}${DRY_RUN ? ' (dry-run — MIGRARE_CONFIRM=1 pentru copiere)' : ''}`)

let erori = 0
for (const [cheie, marime] of deCopiat) {
  if (DRY_RUN) {
    console.log(`  ${cheie} (${marime} B)`)
    continue
  }
  try {
    const obiect = await sursa.client.send(new GetObjectCommand({ Bucket: sursa.bucket, Key: cheie }))
    const corp = Buffer.from(await obiect.Body.transformToByteArray())
    await dest.client.send(
      new PutObjectCommand({
        Bucket: dest.bucket,
        Key: cheie,
        Body: corp,
        ContentType: obiect.ContentType,
        // Numele fișierelor sunt unice (Payload adaugă sufix la coliziuni) → cache lung, sigur.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    const verificare = await dest.client.send(new HeadObjectCommand({ Bucket: dest.bucket, Key: cheie }))
    if (verificare.ContentLength !== marime) throw new Error(`mărime ${verificare.ContentLength} ≠ ${marime}`)
    console.log(`  ✓ ${cheie}`)
  } catch (err) {
    erori++
    console.error(`  ✗ ${cheie}: ${err.message}`)
  }
}

if (erori) {
  console.error(`${erori} erori — rulează din nou (obiectele copiate deja sunt sărite).`)
  process.exit(1)
}
console.log(DRY_RUN ? 'Gata (dry-run).' : 'Gata.')
