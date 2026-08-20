import { numarChunkuri, SERVER_URL } from '@/lib/sitemap'

export const revalidate = 3600

/** Indexul de sitemap-uri: trimite către /sitemaps/0 … /sitemaps/n. */
export async function GET(): Promise<Response> {
  const chunks = await numarChunkuri()
  const ids = Array.from({ length: chunks + 1 }, (_, i) => i)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ids.map((id) => `  <sitemap><loc>${SERVER_URL}/sitemaps/${id}</loc></sitemap>`).join('\n')}
</sitemapindex>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
