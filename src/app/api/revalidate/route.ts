import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Revalidare manuală a întregului cache ISR — de folosit după importuri
 * externe (ex. seed-uri rulate local pe aceeași bază), care nu pot invalida
 * cache-ul de pe Vercel. Protejat cu REVALIDATE_TOKEN (vezi .env.example).
 *
 * Apel: GET/POST /api/revalidate?token=... sau header Authorization: Bearer ...
 * Segmentul static /api/revalidate are prioritate față de catch-all-ul Payload.
 */
const handler = (req: Request): NextResponse => {
  const secret = process.env.REVALIDATE_TOKEN
  const token =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    new URL(req.url).searchParams.get('token')

  if (!secret || token !== secret) {
    return NextResponse.json({ revalidated: false }, { status: 401 })
  }

  revalidatePath('/', 'layout')
  return NextResponse.json({ revalidated: true })
}

export { handler as GET, handler as POST }
