import { iconImage } from '@/lib/icon'

/** Favicon 32×32 — vezi `src/lib/icon.tsx`. */
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return iconImage(size.width)
}
