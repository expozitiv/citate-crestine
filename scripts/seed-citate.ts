/**
 * Import idempotent al antologiei din docs/citate.json (~5.100 obiecte:
 * { Citat, Autor, Carte, Subiecte[] }).
 *
 * Faza 1: upsert autori, cărți (per autor) și teme unice din JSON,
 *         construind hărți nume normalizat → id.
 * Faza 2: create citate cu ID-urile din hărți; temele ca array de ID-uri.
 *
 * Idempotent: încarcă întâi tot ce există (autori/cărți/teme/citate) și
 * creează doar ce lipsește — rulabil repetat fără dubluri.
 *
 * Rulare: npm run seed:citate  (sau: npx payload run scripts/seed-citate.ts)
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import { normalize } from '../src/lib/slug'
import config from '../src/payload.config'

type Intrare = {
  Citat: string
  Autor: string
  Carte?: string | null
  Subiecte?: string[] | null
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fisier = path.resolve(dirname, '../docs/citate.json')

const intrari: Intrare[] = JSON.parse(await readFile(fisier, 'utf8'))
console.log(`Citit ${intrari.length} intrări din docs/citate.json`)

const payload = await getPayload({ config })

/** Cheie de potrivire tolerantă la diacritice, majuscule și spații. */
const cheie = (s: string): string => normalize(s)

/** Cheie pentru cărți — unice per (autor, titlu). */
const cheieCarte = (autorId: number, titlu: string): string => `${autorId}::${cheie(titlu)}`

/* --- Încarcă existentul (pentru idempotență) ----------------------------- */

const toate = async <T extends 'autori' | 'carti' | 'teme' | 'citate'>(
  collection: T,
  select: Record<string, true>,
): Promise<Record<string, unknown>[]> => {
  const res = await payload.find({
    collection,
    limit: 0,
    pagination: false,
    depth: 0,
    select: select as never,
  })
  return res.docs as Record<string, unknown>[]
}

const autoriMap = new Map<string, number>()
for (const a of await toate('autori', { nume: true })) {
  autoriMap.set(cheie(a.nume as string), a.id as number)
}

const cartiMap = new Map<string, number>()
for (const c of await toate('carti', { nume: true, numeComplet: true, autor: true })) {
  const autorId = typeof c.autor === 'object' && c.autor ? (c.autor as { id: number }).id : (c.autor as number)
  cartiMap.set(cheieCarte(autorId, c.nume as string), c.id as number)
  if (c.numeComplet) {
    cartiMap.set(cheieCarte(autorId, c.numeComplet as string), c.id as number)
  }
}

const temeMap = new Map<string, number>()
for (const t of await toate('teme', { nume: true })) {
  temeMap.set(cheie(t.nume as string), t.id as number)
}

const citateExistente = new Set<string>()
for (const c of await toate('citate', { textNorm: true })) {
  if (c.textNorm) citateExistente.add(c.textNorm as string)
}

console.log(
  `Existente: ${autoriMap.size} autori, ${temeMap.size} teme, ${citateExistente.size} citate`,
)

/* --- Faza 1: autori, cărți, teme unice din JSON --------------------------- */

for (const i of intrari) {
  const numeAutor = i.Autor?.trim()
  if (!numeAutor) continue
  if (!autoriMap.has(cheie(numeAutor))) {
    const doc = await payload.create({
      collection: 'autori',
      data: { nume: numeAutor },
      depth: 0,
    })
    autoriMap.set(cheie(numeAutor), doc.id as number)
    console.log(`+ autor: ${numeAutor}`)
  }
}

for (const i of intrari) {
  const numeAutor = i.Autor?.trim()
  const numeCarte = i.Carte?.trim()
  if (!numeAutor || !numeCarte) continue
  const autorId = autoriMap.get(cheie(numeAutor))
  if (!autorId) continue
  if (!cartiMap.has(cheieCarte(autorId, numeCarte))) {
    const doc = await payload.create({
      collection: 'carti',
      data: { nume: numeCarte, autor: autorId },
      depth: 0,
    })
    cartiMap.set(cheieCarte(autorId, numeCarte), doc.id as number)
    console.log(`+ carte: ${numeCarte} (${numeAutor})`)
  }
}

for (const i of intrari) {
  for (const subiect of i.Subiecte ?? []) {
    const nume = subiect?.trim()
    if (!nume || temeMap.has(cheie(nume))) continue
    // Subiectele din JSON sunt cu literă mică; temele existente au inițială mare.
    const numeAfisat = nume.charAt(0).toUpperCase() + nume.slice(1)
    const doc = await payload.create({
      collection: 'teme',
      data: { nume: numeAfisat },
      depth: 0,
    })
    temeMap.set(cheie(nume), doc.id as number)
    console.log(`+ temă: ${numeAfisat}`)
  }
}

/* --- Faza 2: citate -------------------------------------------------------- */

let create = 0
let sarite = 0
let esuate = 0

for (const [idx, i] of intrari.entries()) {
  const text = i.Citat?.replace(/\s+/g, ' ').trim()
  const numeAutor = i.Autor?.trim()
  if (!text || !numeAutor) {
    console.warn(`! intrarea ${idx} fără text sau autor — sărită`)
    esuate++
    continue
  }

  // Aceeași normalizare ca hook-ul beforeValidate (textNorm) — evită dublurile
  // la re-rulare și dublurile din interiorul JSON-ului.
  const textCheie = normalize(text)
  if (citateExistente.has(textCheie)) {
    sarite++
    continue
  }

  const autorId = autoriMap.get(cheie(numeAutor))!
  const numeCarte = i.Carte?.trim()
  const carteId = numeCarte ? cartiMap.get(cheieCarte(autorId, numeCarte)) : undefined
  const temeIds = (i.Subiecte ?? [])
    .map((s) => temeMap.get(cheie(s?.trim() ?? '')))
    .filter((id): id is number => typeof id === 'number')

  try {
    await payload.create({
      collection: 'citate',
      data: {
        text,
        autor: autorId,
        carte: carteId,
        teme: temeIds.length ? temeIds : undefined,
      },
      depth: 0,
    })
    citateExistente.add(textCheie)
    create++
  } catch (e) {
    console.warn(`! citatul ${idx} („${text.slice(0, 60)}…”):`, (e as Error).message)
    esuate++
  }

  if ((create + sarite + esuate) % 100 === 0) {
    console.log(`… ${create + sarite + esuate}/${intrari.length} (create: ${create}, sărite: ${sarite})`)
  }
}

console.log(
  `Gata: ${create} citate create, ${sarite} existente (sărite), ${esuate} eșuate/sărite cu avertisment.`,
)
process.exit(0)
