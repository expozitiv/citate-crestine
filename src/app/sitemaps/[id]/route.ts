import { notFound } from 'next/navigation'

import { numarChunkuri, sitemapCitate, sitemapStatic, urlsetXml } from '@/lib/sitemap'

export const revalidate = 3600

/** Sitemap-urile individuale: 0 = static + colecții mici; 1..n = citate. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isInteger(id) || id < 0) notFound()

  const chunks = await numarChunkuri()
  if (id > chunks) notFound()

  const intrari = id === 0 ? await sitemapStatic() : await sitemapCitate(id)

  return new Response(urlsetXml(intrari), {
    headers: { 'Content-Type': 'application/xml' },
  })
}
