import { NextResponse, type NextRequest } from 'next/server'

/**
 * Filtru înaintea rutării: adresele care nu pot fi slug-uri valide (conțin
 * puncte, majuscule, caractere speciale — ex. `/wp-login.php`, `/.env`) primesc
 * 404 direct, fără să ajungă la ruta ISR `/[slug]`. Altfel, fiecare asemenea
 * cerere a unui bot ar randa și ar scrie în cache o pagină 404 (un „ISR Write”
 * pe Vercel). Slug-urile reale sunt generate de `slugify` → doar `[a-z0-9-]`.
 */

const SEGMENT_VALID = /^[a-z0-9-]+$/

/** Prefixe tratate de Next / Vercel / Payload, lăsate să treacă neatinse. */
const PREFIXE_INTERNE = new Set([
  '_next',
  '_vercel',
  'api',
  'admin',
  'media',
  'sitemaps',
  '.well-known',
])

/** Fișierele de la rădăcină generate de Next (metadata routes). */
const FISIER_RADACINA =
  /^(sitemap\.xml|robots\.txt|favicon\.ico|icon|apple-icon|opengraph-image|twitter-image|manifest)(\.[a-z0-9]+)?$/

export function proxy(request: NextRequest): NextResponse {
  const segmente = request.nextUrl.pathname.split('/').filter(Boolean)
  if (segmente.length === 0) return NextResponse.next()
  if (PREFIXE_INTERNE.has(segmente[0])) return NextResponse.next()
  if (segmente.length === 1 && FISIER_RADACINA.test(segmente[0])) return NextResponse.next()
  if (segmente.every((s) => SEGMENT_VALID.test(s))) return NextResponse.next()

  return new NextResponse('Not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/|api/|admin).*)'],
}
