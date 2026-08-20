/**
 * Utilitare pentru slug-uri și normalizare de text (diacritice românești).
 * Slug-urile trebuie să fie stabile și unice — vezi SPECIFICATII-TEHNICE.md / SEO.
 */

/** Elimină diacriticele (ș→s, ț→t, ă→a, â→a, î→i etc.) și normalizează spațiile. */
export const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Transformă un text în slug URL-safe. */
export const slugify = (value: string): string =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Slug pentru un citat: primele cuvinte semnificative, limitat la ~70 caractere. */
export const quoteSlug = (text: string): string => {
  const full = slugify(text)
  if (full.length <= 70) return full
  const cut = full.slice(0, 70)
  const lastDash = cut.lastIndexOf('-')
  return lastDash > 30 ? cut.slice(0, lastDash) : cut
}

/** Slug-uri rezervate care nu pot fi folosite de pagina individuală a citatului (`/[slug]`). */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'autori',
  'carti',
  'teme',
  'cautare',
  'despre',
  'contact',
  'citate',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  'media',
  'next',
  '_next',
])
