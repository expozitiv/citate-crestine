import { countCitate, getPayloadClient } from './data'

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
export const SITEMAP_CHUNK = 5000

type Intrare = { url: string; lastModified?: string }

const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const urlsetXml = (intrari: Intrare[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${intrari
  .map(
    (i) =>
      `  <url><loc>${xmlEscape(i.url)}</loc>${i.lastModified ? `<lastmod>${new Date(i.lastModified).toISOString()}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`

export const numarChunkuri = async (): Promise<number> => {
  try {
    const total = await countCitate()
    return Math.max(1, Math.ceil(total / SITEMAP_CHUNK))
  } catch {
    return 1
  }
}

/** Sitemap-ul 0: paginile statice + teme + autori + cărți. */
export const sitemapStatic = async (): Promise<Intrare[]> => {
  const payload = await getPayloadClient()
  const statice: Intrare[] = ['', '/teme', '/autori', '/carti', '/despre', '/contact'].map(
    (cale) => ({ url: `${SERVER_URL}${cale}` }),
  )

  const [teme, autori, carti] = await Promise.all([
    payload.find({
      collection: 'teme',
      limit: 0,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'autori',
      limit: 0,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'carti',
      limit: 0,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
  ])

  return [
    ...statice,
    ...teme.docs.map((t) => ({ url: `${SERVER_URL}/teme/${t.slug}`, lastModified: t.updatedAt })),
    ...autori.docs.map((a) => ({
      url: `${SERVER_URL}/autori/${a.slug}`,
      lastModified: a.updatedAt,
    })),
    ...carti.docs.map((c) => ({ url: `${SERVER_URL}/carti/${c.slug}`, lastModified: c.updatedAt })),
  ]
}

/** Sitemap-urile 1..n: citatele, în tranșe de câte 5.000. */
export const sitemapCitate = async (id: number): Promise<Intrare[]> => {
  const payload = await getPayloadClient()
  const citate = await payload.find({
    collection: 'citate',
    sort: 'id',
    limit: SITEMAP_CHUNK,
    page: id,
    depth: 0,
    select: { slug: true, updatedAt: true },
  })
  return citate.docs.map((c) => ({ url: `${SERVER_URL}/${c.slug}`, lastModified: c.updatedAt }))
}
