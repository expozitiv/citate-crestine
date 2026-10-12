import { getCitatBySlug } from '@/lib/data'
import { autorDoc, carteDoc } from '@/lib/format'
import { citatShareImage } from '@/lib/og'
import { RESERVED_SLUGS } from '@/lib/slug'

/**
 * `/[slug]/imagine` — imaginea pătrată (1080×1080) a citatului, pentru
 * butonul „distribuie imaginea” de pe pagina citatului. Generată la cerere
 * și cache-uită pe CDN (vezi antetele din `citatShareImage`).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return new Response('Not found', { status: 404 })
  const citat = await getCitatBySlug(slug)
  if (!citat) return new Response('Not found', { status: 404 })
  return citatShareImage(citat.text, autorDoc(citat)?.nume, carteDoc(citat)?.nume, citat.slug)
}
