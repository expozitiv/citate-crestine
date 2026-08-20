import config from '@payload-config'
import { getPayload, type Payload, type PaginatedDocs, type Where } from 'payload'

import { normalize } from './slug'

export const getPayloadClient = (): Promise<Payload> => getPayload({ config })

/** Câte citate pe pagină în listele publice (temă, autor, carte, căutare). */
export const PAGE_SIZE = 20

/* ------------------------------------------------------------------ */
/* Tipuri minime pentru documentele folosite pe frontend               */
/* ------------------------------------------------------------------ */

export type MediaDoc = {
  id: number
  url?: string | null
  alt?: string | null
  sizes?: {
    medalion?: { url?: string | null }
  }
}

export type AutorDoc = {
  id: number
  nume: string
  slug: string
  ani?: string | null
  descriereScurta?: string | null
  descriere?: string | null
  biografie?: string | null
  imagine?: MediaDoc | number | null
  website?: string | null
}

export type CarteDoc = {
  id: number
  nume: string
  slug: string
  autor: AutorDoc | number
  url?: string | null
  an?: number | null
  editura?: string | null
  numeComplet?: string | null
}

export type TemaDoc = {
  id: number
  nume: string
  slug: string
  descriere?: string | null
}

export type CitatDoc = {
  id: number
  text: string
  slug: string
  autor: AutorDoc | number
  carte?: CarteDoc | number | null
  teme?: (TemaDoc | number)[] | null
  referinta?: string | null
  createdAt: string
}

export type TemaCuNumar = TemaDoc & { numar: number }

/* ------------------------------------------------------------------ */
/* Interogări                                                          */
/* ------------------------------------------------------------------ */

export const getCitatBySlug = async (slug: string): Promise<CitatDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'citate',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2, // populează și autor.imagine (medalionul de pe pagina citatului)
  })
  return (res.docs[0] as CitatDoc | undefined) ?? null
}

/** Hash determinist (FNV-1a) pentru citatul zilei. */
const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Data curentă în fusul orar al României, ca YYYY-MM-DD. */
export const todayBucharest = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date())

/** Miezul nopții curent (ora României), ca timestamp ISO cu offset (+02:00/+03:00). */
const startOfDayBucharest = (): string => {
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bucharest',
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')!.value // „GMT+03:00”
  return `${todayBucharest()}T00:00:00.000${offset.replace('GMT', '')}`
}

/**
 * Citatul zilei: determinist pe zi (seed = data), stabil între request-uri.
 * Selecția se face doar dintre citatele create înainte de miezul nopții curent,
 * ca adăugările de pe parcursul zilei să nu schimbe citatul deja afișat —
 * ele intră în „bazinul” de mâine. Pagina e cache-uită prin ISR.
 */
export const getCitatulZilei = async (): Promise<CitatDoc | null> => {
  const payload = await getPayloadClient()
  let where: Where | undefined = { createdAt: { less_than: startOfDayBucharest() } }
  let { totalDocs } = await payload.count({ collection: 'citate', where })
  if (totalDocs === 0) {
    // Bază nouă, cu toate citatele create azi — folosim întreaga antologie.
    where = undefined
    totalDocs = (await payload.count({ collection: 'citate' })).totalDocs
    if (totalDocs === 0) return null
  }
  const index = fnv1a(todayBucharest()) % totalDocs
  const res = await payload.find({
    collection: 'citate',
    where,
    sort: 'id',
    limit: 1,
    page: index + 1,
    depth: 2, // populează și autor.imagine (medalionul din hero)
  })
  return (res.docs[0] as CitatDoc | undefined) ?? null
}

/** Selecție „Din antologie” pe homepage: cele mai recente citate. */
export const getDinAntologie = async (limit = 5): Promise<CitatDoc[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'citate',
    sort: '-createdAt',
    limit,
    depth: 1,
  })
  return res.docs as CitatDoc[]
}

/** Toate temele cu numărul de citate asociate (un singur query SQL agregat). */
export const getTemeCuNumar = async (): Promise<TemaCuNumar[]> => {
  const payload = await getPayloadClient()
  const teme = (
    await payload.find({ collection: 'teme', limit: 0, pagination: false, depth: 0 })
  ).docs as TemaDoc[]

  const counts = new Map<number, number>()
  try {
    const db = (payload.db as { drizzle?: { execute: (q: unknown) => Promise<{ rows: unknown[] }> } })
      .drizzle
    if (db) {
      const { sql } = await import('@payloadcms/db-postgres/drizzle')
      const result = await db.execute(
        sql`SELECT teme_id AS id, COUNT(*)::int AS numar FROM citate_rels WHERE path = 'teme' AND teme_id IS NOT NULL GROUP BY teme_id`,
      )
      for (const row of result.rows as { id: number; numar: number }[]) {
        counts.set(Number(row.id), Number(row.numar))
      }
    }
  } catch {
    // Fallback (ex. schema încă goală): fără contoare.
  }

  return teme
    .map((t) => ({ ...t, numar: counts.get(t.id) ?? 0 }))
    .sort((a, b) => a.nume.localeCompare(b.nume, 'ro'))
}

/** Temele cele mai bogate, pentru banda verde „Subiecte” de pe homepage. */
export const getTemePopulare = async (limit = 8): Promise<TemaCuNumar[]> => {
  const toate = await getTemeCuNumar()
  return [...toate].sort((a, b) => b.numar - a.numar).slice(0, limit)
}

export const getTemaBySlug = async (slug: string): Promise<TemaDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'teme',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as TemaDoc | undefined) ?? null
}

export const getCitateByTema = async (
  temaId: number,
  page = 1,
): Promise<PaginatedDocs<CitatDoc>> => {
  const payload = await getPayloadClient()
  return (await payload.find({
    collection: 'citate',
    where: { teme: { in: [temaId] } },
    sort: 'textNorm',
    limit: PAGE_SIZE,
    page,
    depth: 1,
  })) as PaginatedDocs<CitatDoc>
}

export const getAutori = async (): Promise<AutorDoc[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'autori',
    sort: 'numeNorm',
    limit: 0,
    pagination: false,
    depth: 1,
  })
  return res.docs as AutorDoc[]
}

export const getAutorBySlug = async (slug: string): Promise<AutorDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'autori',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return (res.docs[0] as AutorDoc | undefined) ?? null
}

export const getCitateByAutor = async (
  autorId: number,
  page = 1,
  limit = PAGE_SIZE,
): Promise<PaginatedDocs<CitatDoc>> => {
  const payload = await getPayloadClient()
  return (await payload.find({
    collection: 'citate',
    where: { autor: { equals: autorId } },
    sort: 'textNorm',
    limit,
    page,
    depth: 1,
  })) as PaginatedDocs<CitatDoc>
}

export const countCitateByAutor = async (autorId: number): Promise<number> => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: 'citate',
    where: { autor: { equals: autorId } },
  })
  return totalDocs
}

export const getCartiByAutor = async (autorId: number): Promise<CarteDoc[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'carti',
    where: { autor: { equals: autorId } },
    sort: 'an',
    limit: 0,
    pagination: false,
    depth: 0,
  })
  return res.docs as CarteDoc[]
}

export const getCarti = async (): Promise<CarteDoc[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'carti',
    sort: 'numeNorm',
    limit: 0,
    pagination: false,
    depth: 1,
  })
  return res.docs as CarteDoc[]
}

export const getCarteBySlug = async (slug: string): Promise<CarteDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'carti',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return (res.docs[0] as CarteDoc | undefined) ?? null
}

export const getCitateByCarte = async (
  carteId: number,
  page = 1,
): Promise<PaginatedDocs<CitatDoc>> => {
  const payload = await getPayloadClient()
  return (await payload.find({
    collection: 'citate',
    where: { carte: { equals: carteId } },
    sort: 'textNorm',
    limit: PAGE_SIZE,
    page,
    depth: 1,
  })) as PaginatedDocs<CitatDoc>
}

/**
 * Citate înrudite pentru banda „Alte citate despre …”: aceeași primă temă,
 * excluzând citatul curent; fallback pe același autor dacă citatul n-are teme.
 */
export const getCitateInrudite = async (citat: CitatDoc, limit = 3): Promise<CitatDoc[]> => {
  const payload = await getPayloadClient()
  const primaTema = (citat.teme ?? [])[0]
  const temaId = typeof primaTema === 'object' ? primaTema?.id : primaTema
  const autorId = typeof citat.autor === 'object' ? citat.autor.id : citat.autor

  const where: Where = temaId
    ? { and: [{ teme: { in: [temaId] } }, { id: { not_equals: citat.id } }] }
    : { and: [{ autor: { equals: autorId } }, { id: { not_equals: citat.id } }] }

  const res = await payload.find({
    collection: 'citate',
    where,
    sort: 'textNorm',
    limit,
    depth: 1,
  })
  return res.docs as CitatDoc[]
}

/**
 * Căutare: acoperă textul citatului, autorul, cartea și temele
 * (implementare PostgreSQL prin câmpuri normalizate, insensibilă la diacritice).
 */
export const searchCitate = async (
  query: string,
  page = 1,
): Promise<PaginatedDocs<CitatDoc>> => {
  const payload = await getPayloadClient()
  const qn = normalize(query)
  return (await payload.find({
    collection: 'citate',
    where: {
      or: [
        { textNorm: { like: qn } },
        { 'autor.numeNorm': { like: qn } },
        { 'carte.numeNorm': { like: qn } },
        { 'teme.numeNorm': { like: qn } },
      ],
    },
    sort: 'textNorm',
    limit: PAGE_SIZE,
    page,
    depth: 1,
  })) as PaginatedDocs<CitatDoc>
}

export const countCitate = async (): Promise<number> => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({ collection: 'citate' })
  return totalDocs
}
