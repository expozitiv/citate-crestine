import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload, type PaginatedDocs, type Where } from 'payload'
import { cache } from 'react'

import { PAGE_SIZE } from './paginare'
import { TAG_AUTORI_CU_NUMAR } from './revalidate'
import { normalize } from './slug'

export { PAGE_SIZE }

export const getPayloadClient = (): Promise<Payload> => getPayload({ config })

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
  descriere?: string | null
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

export type AutorCuNumar = AutorDoc & { numar: number }

/* ------------------------------------------------------------------ */
/* Interogări                                                          */
/* ------------------------------------------------------------------ */

/**
 * Câmpurile unui citat afișat într-o listă (Citate.tsx, banda „Alte citate”, homepage).
 * Fără `textNorm` (dublura textului, doar pentru căutare) și fără câmpurile neafișate —
 * fiecare octet citit din bază e egress Supabase, înmulțit cu miile de pagini ISR.
 */
const SELECT_CITAT_LISTA = { text: true, slug: true, autor: true, carte: true, teme: true } as const

// Funcțiile `…BySlug` sunt învelite în `cache` (React): `generateMetadata` și pagina le apelează
// cu același slug în aceeași randare, iar fără memoizare interogarea rula de două ori.
export const getCitatBySlug = cache(async (slug: string): Promise<CitatDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'citate',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2, // populează și autor.imagine (medalionul de pe pagina citatului)
  })
  return (res.docs[0] as CitatDoc | undefined) ?? null
})

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
 * Bazinul zilnic: citatele create înainte de miezul nopții curent (ora
 * României), ca adăugările de pe parcursul zilei să nu schimbe selecțiile deja
 * afișate — ele intră în bazinul de mâine. Pe o bază nouă, cu toate citatele
 * create azi, se folosește întreaga antologie.
 */
const bazinZilei = async (
  payload: Payload,
): Promise<{ where: Where | undefined; totalDocs: number }> => {
  let where: Where | undefined = { createdAt: { less_than: startOfDayBucharest() } }
  let { totalDocs } = await payload.count({ collection: 'citate', where })
  if (totalDocs === 0) {
    where = undefined
    totalDocs = (await payload.count({ collection: 'citate' })).totalDocs
  }
  return { where, totalDocs }
}

/** Indicele (0-based, în bazin sortat după id) al citatului zilei. */
const indiceCitatulZilei = (totalDocs: number): number => fnv1a(todayBucharest()) % totalDocs

/** Al n-lea citat din bazin, în ordinea id-ului. */
const citatLaIndice = async (
  payload: Payload,
  where: Where | undefined,
  index: number,
  depth: number,
): Promise<CitatDoc | null> => {
  const res = await payload.find({
    collection: 'citate',
    where,
    sort: 'id',
    limit: 1,
    page: index + 1,
    depth,
    ...(depth === 1 ? { select: SELECT_CITAT_LISTA } : {}),
  })
  return (res.docs[0] as CitatDoc | undefined) ?? null
}

/**
 * Citatul zilei: determinist pe zi (seed = data), stabil între request-uri.
 * Pagina e cache-uită prin ISR.
 */
export const getCitatulZilei = async (): Promise<CitatDoc | null> => {
  const payload = await getPayloadClient()
  const { where, totalDocs } = await bazinZilei(payload)
  if (totalDocs === 0) return null
  // depth 2: populează și autor.imagine (medalionul din hero)
  return citatLaIndice(payload, where, indiceCitatulZilei(totalDocs), 2)
}

/**
 * Selecția „Din antologie” de pe homepage: `limit` citate distincte, aceleași
 * toată ziua și altele a doua zi (seed = data + contor), din același bazin ca
 * citatul zilei și fără citatul zilei. Ordinea e cea dată de hash.
 */
export const getDinAntologie = async (limit = 5): Promise<CitatDoc[]> => {
  const payload = await getPayloadClient()
  const { where, totalDocs } = await bazinZilei(payload)
  const disponibile = Math.min(limit, Math.max(totalDocs - 1, 0))
  if (disponibile === 0) return []

  const ziua = todayBucharest()
  const excluse = new Set<number>([indiceCitatulZilei(totalDocs)])
  const indici: number[] = []
  for (let k = 0; indici.length < disponibile; k++) {
    let index = fnv1a(`${ziua}#${k}`) % totalDocs
    while (excluse.has(index)) index = (index + 1) % totalDocs
    excluse.add(index)
    indici.push(index)
  }

  const citate = await Promise.all(indici.map((i) => citatLaIndice(payload, where, i, 1)))
  return citate.filter((c): c is CitatDoc => c !== null)
}

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => unknown

/**
 * Rulează un SELECT agregat direct pe Postgres (prin drizzle) — pentru contoare
 * pe care Payload le-ar obține doar cu câte un query per document.
 * La eroare (ex. schema încă goală) întoarce listă goală.
 */
const sqlRows = async <T>(query: (sql: SqlTag) => unknown): Promise<T[]> => {
  const payload = await getPayloadClient()
  try {
    const db = (payload.db as { drizzle?: { execute: (q: unknown) => Promise<{ rows: unknown[] }> } })
      .drizzle
    if (!db) return []
    const { sql } = await import('@payloadcms/db-postgres/drizzle')
    const result = await db.execute(query(sql as unknown as SqlTag))
    return result.rows as T[]
  } catch {
    return []
  }
}

/** Toate temele cu numărul de citate asociate (un singur query SQL agregat). */
export const getTemeCuNumar = async (): Promise<TemaCuNumar[]> => {
  const payload = await getPayloadClient()
  const teme = (
    await payload.find({
      collection: 'teme',
      limit: 0,
      pagination: false,
      depth: 0,
      // indexul și banda „Subiecte” afișează doar numele și numărul de citate
      select: { nume: true, slug: true },
    })
  ).docs as TemaDoc[]

  const counts = new Map<number, number>()
  const rows = await sqlRows<{ id: number; numar: number }>(
    (sql) =>
      sql`SELECT teme_id AS id, COUNT(*)::int AS numar FROM citate_rels WHERE path = 'teme' AND teme_id IS NOT NULL GROUP BY teme_id`,
  )
  for (const row of rows) counts.set(Number(row.id), Number(row.numar))

  return teme
    .map((t) => ({ ...t, numar: counts.get(t.id) ?? 0 }))
    .sort((a, b) => a.nume.localeCompare(b.nume, 'ro'))
}

/** Temele cele mai bogate, pentru banda verde „Subiecte” de pe homepage. */
export const getTemePopulare = async (limit = 8): Promise<TemaCuNumar[]> => {
  const toate = await getTemeCuNumar()
  return [...toate].sort((a, b) => b.numar - a.numar).slice(0, limit)
}

export const getTemaBySlug = cache(async (slug: string): Promise<TemaDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'teme',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as TemaDoc | undefined) ?? null
})

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
    select: SELECT_CITAT_LISTA,
  })) as PaginatedDocs<CitatDoc>
}

export const getAutori = async (): Promise<AutorDoc[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'autori',
    sort: 'numeNorm',
    limit: 0,
    pagination: false,
    depth: 0,
    // Indexul și „Alți autori” afișează doar numele, anii și numărul de citate; lista e citită
    // pe fiecare pagină de autor, deci biografiile tuturor autorilor erau egress inutil.
    select: { nume: true, slug: true, ani: true },
  })
  return res.docs as AutorDoc[]
}

/** Toți autorii cu numărul de citate (un singur query agregat), ordonați după nume. */
const citesteAutoriCuNumar = async (): Promise<AutorCuNumar[]> => {
  const autori = await getAutori()
  const counts = new Map<number, number>()
  const rows = await sqlRows<{ id: number; numar: number }>(
    (sql) => sql`SELECT autor_id AS id, COUNT(*)::int AS numar FROM citate GROUP BY autor_id`,
  )
  // `sqlRows` întoarce [] la eroare; un rezultat fără contoare nu trebuie să ajungă în cache.
  if (autori.length > 0 && rows.length === 0) throw new Error('contoarele autorilor lipsesc')
  for (const row of rows) counts.set(Number(row.id), Number(row.numar))
  return autori.map((a) => ({ ...a, numar: counts.get(a.id) ?? 0 }))
}

/**
 * Lista e aceeași pe toate cele ~1.300 de pagini de autor (indexul A–Z, „Alți autori”), deci
 * stă în cache-ul de date Next (persistă între cereri și deploy-uri) în loc să fie citită din
 * bază la fiecare regenerare. Invalidată de hook-urile citatelor și autorilor (revalidate.ts).
 */
const autoriCuNumarCache = unstable_cache(citesteAutoriCuNumar, ['autori-cu-numar'], {
  tags: [TAG_AUTORI_CU_NUMAR],
  // Ca ISR-ul paginilor (30 de zile): un `revalidate` mai scurt aici l-ar scurta și pe al
  // fiecărei pagini care folosește lista (Next ia minimul) → mai multe regenerări, nu mai puține.
  revalidate: 2592000,
})

export const getAutoriCuNumar = async (): Promise<AutorCuNumar[]> => {
  try {
    return await autoriCuNumarCache()
  } catch {
    // În afara runtime-ului Next (scripturi `payload run`) nu există cache de date.
    return citesteAutoriCuNumar()
  }
}

/**
 * ID-urile autorilor care au citate în aceleași volume ca autorul dat
 * (antologii, cărți scrise în doi), ordonați după numărul de citate comune.
 */
export const getCoautoriIds = async (autorId: number): Promise<number[]> => {
  const rows = await sqlRows<{ id: number }>(
    (sql) =>
      sql`SELECT autor_id AS id, COUNT(*)::int AS numar FROM citate
          WHERE autor_id <> ${autorId}
            AND carte_id IN (SELECT DISTINCT carte_id FROM citate WHERE autor_id = ${autorId} AND carte_id IS NOT NULL)
          GROUP BY autor_id ORDER BY numar DESC`,
  )
  return rows.map((r) => Number(r.id))
}

export const getAutorBySlug = cache(async (slug: string): Promise<AutorDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'autori',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return (res.docs[0] as AutorDoc | undefined) ?? null
})

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
    select: SELECT_CITAT_LISTA,
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
    select: { nume: true, slug: true, numeComplet: true, editura: true, an: true, url: true, autor: true },
  })
  return res.docs as CarteDoc[]
}

export const getCarteBySlug = cache(async (slug: string): Promise<CarteDoc | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'carti',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return (res.docs[0] as CarteDoc | undefined) ?? null
})

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
    select: SELECT_CITAT_LISTA,
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
    select: SELECT_CITAT_LISTA,
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
    select: SELECT_CITAT_LISTA,
  })) as PaginatedDocs<CitatDoc>
}

export const countCitate = async (): Promise<number> => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({ collection: 'citate' })
  return totalDocs
}
