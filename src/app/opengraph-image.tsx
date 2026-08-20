import { OG_CONTENT_TYPE, OG_SIZE, siteOgImage } from '@/lib/og'

/** Cardul OG implicit — orice pagină fără card propriu îl moștenește. */
export const alt = 'Citate creștine — o antologie teologică în limba română'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return siteOgImage()
}
