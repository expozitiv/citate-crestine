import { iconImage } from '@/lib/icon'

/** Apple touch icon 180×180 — vezi `src/lib/icon.tsx`. */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return iconImage(size.width)
}
