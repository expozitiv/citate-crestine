import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/data'
import { CHEIE_MEDIA_KIT, urlSemnatR2 } from '@/lib/r2'

/**
 * Descărcarea media kit-ului (vezi /admin/media-kit) — doar pentru utilizatorii
 * autentificați în admin. Verifică sesiunea Payload (cookie) și redirecționează
 * către un URL semnat R2 valabil 5 minute; fișierul nu trece prin funcția Vercel
 * (limita de 4,5 MB). Segmentul static are prioritate față de catch-all-ul Payload.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<NextResponse> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ eroare: 'Neautentificat' }, { status: 401 })
  }

  const url = await urlSemnatR2(CHEIE_MEDIA_KIT, 'media-kit-citate-crestine.zip')
  if (!url) {
    return NextResponse.json({ eroare: 'Stocarea R2 nu este configurată' }, { status: 503 })
  }

  return NextResponse.redirect(url, {
    status: 307,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
