import { getCitatBySlug } from '@/lib/data'
import { autorDoc } from '@/lib/format'
import { citatOgImage, OG_CONTENT_TYPE, OG_SIZE, siteOgImage } from '@/lib/og'
import { RESERVED_SLUGS } from '@/lib/slug'

/** Cardul OG al citatului: textul + autorul, în paleta site-ului. */
export const alt = 'Citat din antologia Citate creștine'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return siteOgImage()
  const citat = await getCitatBySlug(slug)
  if (!citat) return siteOgImage()
  return citatOgImage(citat.text, autorDoc(citat)?.nume)
}
