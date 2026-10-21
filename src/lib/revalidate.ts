import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
  Where,
} from 'payload'

import { PAGE_SIZE } from './paginare'

/**
 * Strategie de cache (vezi README / Performanță): paginile publice sunt statice
 * cu ISR de lungă durată (30 de zile), iar hook-urile colecțiilor invalidează
 * ȚINTIT doar paginile pe care documentul salvat apare efectiv. Invalidarea
 * globală (`revalidatePath('/', 'layout')`) rămâne pentru cazurile în care un
 * document se vede pe zeci de mii de pagini (ex. redenumirea unui autor) și
 * pentru endpoint-ul manual `/api/revalidate`.
 *
 * Motivul: pe Vercel fiecare regenerare a unei pagini ISR este un „ISR Write”
 * contorizat; cu ~25.000 de intrări (citate + liste cu paginare), o invalidare
 * globală la fiecare salvare din admin epuiza rapid cota lunară.
 *
 * Cardurile OG (`/[slug]/opengraph-image`) și sitemap-urile sunt rute dinamice
 * (fără `generateStaticParams`), nu ISR — nu au ce invalida.
 */

type Rel = number | string | { id: number | string } | null | undefined
type ColectieCuSlug = 'autori' | 'carti' | 'teme'
type DocCuSlug = { id: number; slug?: string | null }

/** Invalidează o cale; în afara runtime-ului Next (ex. `payload run`) nu există cache. */
const cale = (path: string, type?: 'page' | 'layout'): void => {
  try {
    revalidatePath(path, type)
  } catch {
    // Fără store Next (scripturi CLI) — nimic de invalidat.
  }
}

/**
 * Tag-ul listei tuturor autorilor cu numărul de citate (`getAutoriCuNumar`, cache-ul de date
 * Next). Se schimbă când se adaugă / mută / șterge un citat sau se modifică un autor.
 */
export const TAG_AUTORI_CU_NUMAR = 'autori-cu-numar'

/** Expiră imediat lista autorilor, ca pagina regenerată imediat după să vadă contoarele noi. */
const autoriCuNumar = (): void => {
  try {
    revalidateTag(TAG_AUTORI_CU_NUMAR, { expire: 0 })
  } catch {
    // Fără store Next (scripturi CLI) — nimic de invalidat.
  }
}

/** Invalidarea întregului cache de rute (și a listei autorilor, care nu ține de o rută). */
export const revalidateContent = (): void => {
  autoriCuNumar()
  cale('/', 'layout')
}

const relId = (v: Rel): number | null => {
  if (v == null) return null
  const id = typeof v === 'object' ? v.id : v
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

const relIds = (v: Rel | Rel[]): number[] => {
  const lista = Array.isArray(v) ? v : [v]
  const ids = lista.map(relId).filter((x): x is number => x !== null)
  return Array.from(new Set(ids))
}

/** Valoarea unui câmp, cu relațiile reduse la id — ca să poată fi comparată. */
const valoare = (doc: Record<string, unknown>, camp: string): unknown => {
  const v = doc[camp]
  if (v && typeof v === 'object' && 'id' in (v as object)) return (v as { id: unknown }).id
  return v ?? null
}

const campuriSchimbate = (
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown>,
  campuri: string[],
): boolean => campuri.some((c) => String(valoare(doc, c)) !== String(valoare(previousDoc, c)))

const slugDupaId = async (
  req: PayloadRequest,
  collection: ColectieCuSlug,
  id: number,
): Promise<string | null> => {
  try {
    const doc = (await req.payload.findByID({
      collection,
      id,
      depth: 0,
      select: { slug: true },
      req,
    })) as DocCuSlug | null
    return doc?.slug ?? null
  } catch {
    return null
  }
}

const numarCitate = async (req: PayloadRequest, where: Where): Promise<number> => {
  try {
    return (await req.payload.count({ collection: 'citate', where, req })).totalDocs
  } catch {
    return 0
  }
}

/** Plafon de pagini `/pagina/n` invalidate per listă (peste → avertisment, restul expiră ISR). */
const MAX_PAGINI = 100

/**
 * Pagina 1 + paginile `/pagina/2..n` ale unei liste. `n` este calculat din
 * numărul de citate, +1 pentru pagina care poate dispărea la o ștergere.
 */
const caiLista = (baza: string, totalCitate: number): string[] => {
  const pagini = Math.ceil(totalCitate / PAGE_SIZE) + 1
  if (pagini > MAX_PAGINI) {
    console.warn(`[revalidate] ${baza}: ${pagini} pagini, invalidez doar primele ${MAX_PAGINI}`)
  }
  const cai = [baza]
  for (let n = 2; n <= Math.min(pagini, MAX_PAGINI); n++) cai.push(`${baza}/pagina/${n}`)
  return cai
}

const caiAutor = async (req: PayloadRequest, id: number, slug?: string | null) => {
  const s = slug ?? (await slugDupaId(req, 'autori', id))
  if (!s) return []
  return caiLista(`/autori/${s}`, await numarCitate(req, { autor: { equals: id } }))
}

const caiCarte = async (req: PayloadRequest, id: number, slug?: string | null) => {
  const s = slug ?? (await slugDupaId(req, 'carti', id))
  if (!s) return []
  return caiLista(`/carti/${s}`, await numarCitate(req, { carte: { equals: id } }))
}

const caiTema = async (req: PayloadRequest, id: number, slug?: string | null) => {
  const s = slug ?? (await slugDupaId(req, 'teme', id))
  if (!s) return []
  return caiLista(`/teme/${s}`, await numarCitate(req, { teme: { in: [id] } }))
}

const invalideaza = (cai: Iterable<string>): void => {
  for (const c of new Set(cai)) cale(c)
}

/* ------------------------------------------------------------------ */
/* Citate                                                              */
/* ------------------------------------------------------------------ */

type CitatHook = {
  slug?: string | null
  autor?: Rel
  carte?: Rel
  teme?: Rel[] | null
}

/**
 * Un citat apare pe: pagina lui, listele autorului / cărții / temelor lui (cu
 * paginare), home („Din antologie”) și indexurile cu contoare. Benzile „Alte
 * citate despre …” de pe celelalte pagini de citat se refac la expirarea ISR —
 * e acceptabil să rămână câteva zile în urmă.
 */
const caiCitat = async (
  req: PayloadRequest,
  doc: CitatHook,
  previousDoc?: CitatHook | null,
): Promise<string[]> => {
  const cai: string[] = ['/', '/autori', '/carti', '/teme']

  for (const slug of new Set([doc.slug, previousDoc?.slug].filter(Boolean) as string[])) {
    cai.push(`/${slug}`)
  }
  for (const id of relIds([doc.autor, previousDoc?.autor])) cai.push(...(await caiAutor(req, id)))
  for (const id of relIds([doc.carte, previousDoc?.carte])) cai.push(...(await caiCarte(req, id)))
  for (const id of relIds([...(doc.teme ?? []), ...(previousDoc?.teme ?? [])])) {
    cai.push(...(await caiTema(req, id)))
  }
  return cai
}

export const citatAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  autoriCuNumar()
  try {
    invalideaza(await caiCitat(req, doc, previousDoc))
  } catch {
    revalidateContent()
  }
  return doc
}

export const citatAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  autoriCuNumar()
  try {
    invalideaza(await caiCitat(req, doc))
  } catch {
    revalidateContent()
  }
  return doc
}

/* ------------------------------------------------------------------ */
/* Autori                                                              */
/* ------------------------------------------------------------------ */

/** Câmpurile autorului afișate pe paginile citatelor și în atribuiri. */
const AUTOR_PE_CITAT = ['nume', 'slug', 'ani', 'descriereScurta', 'imagine']

export const autorAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  autoriCuNumar()
  try {
    if (operation === 'update' && previousDoc && campuriSchimbate(doc, previousDoc, AUTOR_PE_CITAT)) {
      // Numele / portretul apar pe toate citatele lui — invalidare globală.
      revalidateContent()
      return doc
    }
    invalideaza(['/', '/autori', ...(await caiAutor(req, doc.id, doc.slug))])
  } catch {
    revalidateContent()
  }
  return doc
}

export const autorAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateContent()
  return doc
}

/* ------------------------------------------------------------------ */
/* Cărți                                                               */
/* ------------------------------------------------------------------ */

/** Câmpurile cărții afișate pe paginile citatelor și în atribuiri. */
const CARTE_PE_CITAT = ['nume', 'slug', 'an', 'editura', 'url', 'autor']

export const carteAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  try {
    if (operation === 'update' && previousDoc && campuriSchimbate(doc, previousDoc, CARTE_PE_CITAT)) {
      revalidateContent()
      return doc
    }
    // Titlul complet / descrierea apar pe pagina cărții și în banda „Sursele
    // antologiei” de pe paginile autorului.
    const cai = ['/carti', ...(await caiCarte(req, doc.id, doc.slug))]
    for (const id of relIds([doc.autor, previousDoc?.autor])) cai.push(...(await caiAutor(req, id)))
    invalideaza(cai)
  } catch {
    revalidateContent()
  }
  return doc
}

export const carteAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateContent()
  return doc
}

/* ------------------------------------------------------------------ */
/* Teme                                                                */
/* ------------------------------------------------------------------ */

/** Câmpurile temei afișate pe paginile citatelor și în atribuiri. */
const TEMA_PE_CITAT = ['nume', 'slug']

export const temaAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  try {
    if (operation === 'update' && previousDoc && campuriSchimbate(doc, previousDoc, TEMA_PE_CITAT)) {
      revalidateContent()
      return doc
    }
    invalideaza(['/', '/teme', ...(await caiTema(req, doc.id, doc.slug))])
  } catch {
    revalidateContent()
  }
  return doc
}

export const temaAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateContent()
  return doc
}
