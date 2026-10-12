/**
 * Import idempotent al antologiei MAGNA GRATIA din
 *   data-dump/Citate-MAGNA-GRATIA-COMPLET-final.xlsx  (Nr | Citat | Autor | Titlu | Link | Tema)
 *   data-dump/Bio-AUTORI.xlsx                          (Autor | Bio)
 *
 * Reguli (decise cu editorul, 12 oct 2026):
 *  - autori compuși „A, B” → autorul citatului și al cărții este A; B apare în descrierea cărții;
 *  - antologii (mai mulți autori pe aceeași carte) → cartea primește primul autor din fișier,
 *    ceilalți în descrierea cărții; fiecare citat păstrează autorul real al rândului;
 *  - variante de nume unificate: „J. C. Ryle” → „J.C. Ryle”, „Jonathan D. Leeman” → „Jonathan Leeman”;
 *  - duplicatele absolute (text normalizat) nu se importă — nici față de bază, nici în interiorul fișierului;
 *  - cărțile se identifică după link; cele existente primesc doar `url` (+ `numeComplet` dacă lipsește);
 *  - temele: separate prin „,” sau „;”, prima literă mare, create doar dacă lipsesc;
 *  - bio: „(1834–1892) - text” → ani = „1834–1892”, descriere = „text”; nu suprascrie câmpuri existente.
 *
 * Rulare:  npm run import:excel                    (dry-run implicit: raport, fără scrieri)
 *          IMPORT_CONFIRM=1 npm run import:excel   (import real)
 * Notă: `payload run` nu transmite flag-uri scriptului, de aceea comutatorul este variabilă de mediu.
 */
import { appendFileSync, mkdirSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import { normalize } from '../src/lib/slug'
import config from '../src/payload.config'

// Pachetul xlsx este CJS; sub ESM, `import * as XLSX` nu expune readFile.
const XLSX = createRequire(import.meta.url)('xlsx') as typeof import('xlsx')

const DRY_RUN = process.env.IMPORT_CONFIRM !== '1'
const CONCURRENTA = 6

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fisierCitate = path.resolve(dirname, '../data-dump/Citate-MAGNA-GRATIA-COMPLET-final.xlsx')
const fisierBio = path.resolve(dirname, '../data-dump/Bio-AUTORI.xlsx')
const dirLog = path.resolve(dirname, '../backups')
mkdirSync(dirLog, { recursive: true })
const fisierLog = path.join(dirLog, `import-excel-${DRY_RUN ? 'dry-run' : 'run'}.log`)
const log = (msg: string): void => {
  console.log(msg)
  appendFileSync(fisierLog, msg + '\n')
}
appendFileSync(fisierLog, `\n===== ${new Date().toISOString()} ${DRY_RUN ? 'DRY-RUN' : 'RUN'} =====\n`)

/* --- Curățare text ---------------------------------------------------------- */

const curata = (v: unknown): string =>
  String(v ?? '')
    .replace(/[şŞţŢ]/g, (c) => ({ ş: 'ș', Ş: 'Ș', ţ: 'ț', Ţ: 'Ț' })[c] as string)
    .replace(/[​‌‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const ALIAS_AUTOR: Record<string, string> = {
  'j. c. ryle': 'J.C. Ryle',
  'jonathan d. leeman': 'Jonathan Leeman',
}

/** „A, B” → ['A', 'B'], cu aliasuri aplicate. */
const autoriDinCelula = (v: unknown): string[] =>
  curata(v)
    .split(',')
    .map((s) => curata(s))
    .filter(Boolean)
    .map((s) => ALIAS_AUTOR[normalize(s)] ?? s)

const temeDinCelula = (v: unknown): string[] =>
  curata(v)
    .split(/[,;]/)
    .map((s) => curata(s))
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))

/** „Titlu. Subtitlu” → { nume: 'Titlu', numeComplet: 'Titlu. Subtitlu' }. Nu desparte „67. Articolele…”. */
const despartTitlu = (titlu: string): { nume: string; numeComplet?: string } => {
  const idx = titlu.indexOf('. ')
  if (idx < 0) return { nume: titlu }
  const inainte = titlu.slice(0, idx)
  if (inainte.length < 3 || /^\d+$/.test(inainte)) return { nume: titlu }
  return { nume: inainte, numeComplet: titlu }
}

/** „(1834–1892) - text” → { ani, descriere }. */
const despartBio = (bio: string): { ani?: string; descriere: string } => {
  const m = bio.match(/^\((.+?)\)\s*[-–—]\s*(.+)$/)
  if (m && /\d/.test(m[1])) return { ani: m[1].trim(), descriere: m[2].trim() }
  return { descriere: bio }
}

/* --- Citire Excel ----------------------------------------------------------- */

type Rand = { nr: number; text: string; autor: string; coautori: string[]; titlu: string; link: string; teme: string[] }

const foaie = (fisier: string): unknown[][] => {
  const wb = XLSX.readFile(fisier, { cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null })
}

const randuri: Rand[] = []
for (const r of foaie(fisierCitate).slice(1)) {
  if (!r || r[1] == null || curata(r[1]) === '') continue
  const [primul, ...rest] = autoriDinCelula(r[2])
  randuri.push({
    nr: Number(r[0]),
    text: curata(r[1]),
    autor: primul,
    coautori: rest,
    titlu: curata(r[3]),
    link: curata(r[4]),
    teme: temeDinCelula(r[5]),
  })
}
log(`Citit ${randuri.length} rânduri din ${path.basename(fisierCitate)}`)

const bio = new Map<string, string>()
for (const r of foaie(fisierBio).slice(1)) {
  const nume = curata(r?.[0])
  const text = curata(r?.[1])
  if (!nume || !text) continue
  const canonic = ALIAS_AUTOR[normalize(nume)] ?? nume
  if (!bio.has(normalize(canonic))) bio.set(normalize(canonic), text)
}
log(`Citit ${bio.size} biografii din ${path.basename(fisierBio)}`)

/* --- Agregare: autori, cărți, teme ------------------------------------------ */

const autoriNecesari = new Map<string, string>() // cheie normalizată → nume afișat
for (const r of randuri) {
  if (!autoriNecesari.has(normalize(r.autor))) autoriNecesari.set(normalize(r.autor), r.autor)
}

type Carte = { link: string; titlu: string; autor: string; coautori: string[]; nr: number }
const carti = new Map<string, Carte>()
for (const r of randuri) {
  let c = carti.get(r.link)
  if (!c) {
    c = { link: r.link, titlu: r.titlu, autor: r.autor, coautori: [], nr: 0 }
    carti.set(r.link, c)
  }
  c.nr++
  for (const a of [r.autor, ...r.coautori]) {
    if (normalize(a) !== normalize(c.autor) && !c.coautori.some((x) => normalize(x) === normalize(a))) {
      c.coautori.push(a)
    }
  }
}

const temeNecesare = new Map<string, string>()
for (const r of randuri) {
  for (const t of r.teme) if (!temeNecesare.has(normalize(t))) temeNecesare.set(normalize(t), t)
}

/* --- Existentul din bază ----------------------------------------------------- */

const payload = await getPayload({ config })

const toate = async <T extends 'autori' | 'carti' | 'teme' | 'citate'>(
  collection: T,
  select: Record<string, true>,
): Promise<Record<string, unknown>[]> => {
  const res = await payload.find({ collection, limit: 0, pagination: false, depth: 0, select: select as never })
  return res.docs as Record<string, unknown>[]
}

const autoriMap = new Map<string, number>()
const autoriExistenti = new Map<number, Record<string, unknown>>()
for (const a of await toate('autori', { nume: true, ani: true, descriere: true })) {
  autoriMap.set(normalize(a.nume as string), a.id as number)
  autoriExistenti.set(a.id as number, a)
}

const cartiDupaUrl = new Map<string, number>()
const cartiDupaAutorNume = new Map<string, Record<string, unknown>>()
const idAutor = (v: unknown): number => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number))
for (const c of await toate('carti', { nume: true, numeComplet: true, autor: true, url: true })) {
  if (c.url) cartiDupaUrl.set(curata(c.url).replace(/\/?$/, '/'), c.id as number)
  const a = idAutor(c.autor)
  cartiDupaAutorNume.set(`${a}::${normalize(c.nume as string)}`, c)
  if (c.numeComplet) cartiDupaAutorNume.set(`${a}::${normalize(c.numeComplet as string)}`, c)
}

const temeMap = new Map<string, number>()
for (const t of await toate('teme', { nume: true })) temeMap.set(normalize(t.nume as string), t.id as number)

const citateExistente = new Set<string>()
for (const c of await toate('citate', { textNorm: true })) if (c.textNorm) citateExistente.add(c.textNorm as string)

log(`Existente în bază: ${autoriMap.size} autori, ${cartiDupaUrl.size} cărți cu url, ${temeMap.size} teme, ${citateExistente.size} citate`)

/* --- Faza 1: autori ---------------------------------------------------------- */

let autoriCreati = 0
let autoriActualizati = 0
for (const [cheie, nume] of autoriNecesari) {
  const b = bio.get(cheie)
  const date = b ? despartBio(b) : undefined
  const idExistent = autoriMap.get(cheie)
  if (idExistent) {
    const ex = autoriExistenti.get(idExistent)!
    const patch: Record<string, string> = {}
    if (date?.ani && !ex.ani) patch.ani = date.ani
    if (date?.descriere && !ex.descriere) patch.descriere = date.descriere
    if (Object.keys(patch).length) {
      log(`~ autor: ${nume} ← ${JSON.stringify(patch)}`)
      if (!DRY_RUN) await payload.update({ collection: 'autori', id: idExistent, data: patch, depth: 0 })
      autoriActualizati++
    }
    continue
  }
  const data = { nume, ...(date?.ani ? { ani: date.ani } : {}), ...(date ? { descriere: date.descriere } : {}) }
  if (!b) log(`! autor fără bio: ${nume}`)
  if (!DRY_RUN) {
    const doc = await payload.create({ collection: 'autori', data, depth: 0 })
    autoriMap.set(cheie, doc.id as number)
  } else {
    autoriMap.set(cheie, -1)
  }
  autoriCreati++
}
log(`Autori: ${autoriCreati} creați, ${autoriActualizati} actualizați (din ${autoriNecesari.size} necesari)`)

/* --- Faza 2: cărți ----------------------------------------------------------- */

const carteId = new Map<string, number>() // link → id
let cartiCreate = 0
let cartiActualizate = 0
for (const c of carti.values()) {
  const autorId = autoriMap.get(normalize(c.autor))!
  const { nume, numeComplet } = despartTitlu(c.titlu)
  const descriere = c.coautori.length
    ? c.coautori.length > 2
      ? `Volum colectiv. Autori: ${[c.autor, ...c.coautori].join(', ')}.`
      : `Scrisă împreună cu ${c.coautori.join(' și ')}.`
    : undefined

  const linkKey = c.link.replace(/\/?$/, '/')
  let id = cartiDupaUrl.get(linkKey)
  const existenta =
    cartiDupaAutorNume.get(`${autorId}::${normalize(nume)}`) ??
    (numeComplet ? cartiDupaAutorNume.get(`${autorId}::${normalize(numeComplet)}`) : undefined)
  if (!id && existenta) id = existenta.id as number

  if (id) {
    const ex = existenta ?? {}
    const patch: Record<string, string> = {}
    if (curata(ex.url).replace(/\/?$/, '/') !== linkKey) patch.url = c.link
    if (numeComplet && !ex.numeComplet) patch.numeComplet = numeComplet
    if (Object.keys(patch).length) {
      log(`~ carte: ${nume} ← ${JSON.stringify(patch)}`)
      if (!DRY_RUN) await payload.update({ collection: 'carti', id, data: patch, depth: 0 })
      cartiActualizate++
    }
    carteId.set(c.link, id)
    continue
  }

  const data = { nume, numeComplet, autor: autorId, url: c.link, editura: 'MAGNA GRATIA', descriere }
  if (descriere) log(`+ carte (coautori): ${nume} — ${c.autor} · ${descriere}`)
  if (!DRY_RUN) {
    const doc = await payload.create({ collection: 'carti', data, depth: 0 })
    carteId.set(c.link, doc.id as number)
  } else {
    carteId.set(c.link, -1)
  }
  cartiCreate++
}
log(`Cărți: ${cartiCreate} create, ${cartiActualizate} actualizate (din ${carti.size} în fișier)`)

/* --- Faza 3: teme ------------------------------------------------------------ */

let temeCreate = 0
const temeNoi: string[] = []
for (const [cheie, nume] of temeNecesare) {
  if (temeMap.has(cheie)) continue
  temeNoi.push(nume)
  if (!DRY_RUN) {
    const doc = await payload.create({ collection: 'teme', data: { nume }, depth: 0 })
    temeMap.set(cheie, doc.id as number)
  } else {
    temeMap.set(cheie, -1)
  }
  temeCreate++
}
log(`Teme: ${temeCreate} create (din ${temeNecesare.size} în fișier)`)
if (DRY_RUN && temeNoi.length) log(`  teme noi: ${temeNoi.join(' | ')}`)

/* --- Faza 4: citate ---------------------------------------------------------- */

const deCreat: Rand[] = []
let dubluriFisier = 0
let dubluriBaza = 0
const vazute = new Set<string>()
for (const r of randuri) {
  const cheie = normalize(r.text)
  if (citateExistente.has(cheie)) {
    dubluriBaza++
    continue
  }
  if (vazute.has(cheie)) {
    dubluriFisier++
    log(`- dublură în fișier (nr ${r.nr}, ${r.autor}): ${r.text.slice(0, 70)}…`)
    continue
  }
  vazute.add(cheie)
  deCreat.push(r)
}
log(`Citate: ${deCreat.length} de creat, ${dubluriBaza} existente în bază, ${dubluriFisier} dubluri în fișier`)

let create = 0
let esuate = 0
const esecuri: Rand[] = []

const creeaza = async (r: Rand): Promise<void> => {
  await payload.create({
    collection: 'citate',
    data: {
      text: r.text,
      autor: autoriMap.get(normalize(r.autor))!,
      carte: carteId.get(r.link),
      teme: r.teme.map((t) => temeMap.get(normalize(t))!).filter((id) => typeof id === 'number'),
    },
    depth: 0,
    context: { import: true },
  })
}

if (!DRY_RUN) {
  let i = 0
  const lucrator = async (): Promise<void> => {
    for (;;) {
      const idx = i++
      if (idx >= deCreat.length) return
      const r = deCreat[idx]
      try {
        await creeaza(r)
        create++
      } catch (e) {
        esecuri.push(r)
        log(`! nr ${r.nr}: ${(e as Error).message.split('\n')[0]}`)
      }
      const total = create + esecuri.length
      if (total % 500 === 0) console.log(`… ${total}/${deCreat.length} (create: ${create}, eșuate: ${esecuri.length})`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENTA }, lucrator))

  // A doua încercare, secvențial (coliziuni de slug la rulare concurentă).
  for (const r of esecuri) {
    try {
      await creeaza(r)
      create++
    } catch (e) {
      esuate++
      log(`!! nr ${r.nr} eșuat definitiv: ${(e as Error).message.split('\n')[0]}`)
    }
  }
}

log(
  DRY_RUN
    ? `DRY-RUN gata. S-ar crea: ${autoriCreati} autori, ${cartiCreate} cărți, ${temeCreate} teme, ${deCreat.length} citate.`
    : `Gata: ${create} citate create, ${esuate} eșuate. Jurnal: ${fisierLog}`,
)
process.exit(0)
