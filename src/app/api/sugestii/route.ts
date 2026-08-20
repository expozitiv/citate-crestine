import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/data'
import { normalize } from '@/lib/slug'

/**
 * Sugestii live pentru căutare (dropdown-ul de sub câmp, în timp ce tastezi).
 * Segmentul static /api/sugestii are prioritate față de catch-all-ul Payload
 * /api/[...slug]. Răspunsurile sunt cache-uite pe CDN per interogare.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const qn = normalize(q)

  if (qn.length < 2) {
    return NextResponse.json({ citate: [], teme: [], autori: [] })
  }

  const payload = await getPayloadClient()

  const [citate, teme, autori] = await Promise.all([
    payload.find({
      collection: 'citate',
      where: { textNorm: { like: qn } },
      limit: 5,
      depth: 1,
      sort: 'textNorm',
      select: { text: true, slug: true, autor: true },
    }),
    payload.find({
      collection: 'teme',
      where: { numeNorm: { like: qn } },
      limit: 3,
      depth: 0,
      sort: 'numeNorm',
      select: { nume: true, slug: true },
    }),
    payload.find({
      collection: 'autori',
      where: { numeNorm: { like: qn } },
      limit: 2,
      depth: 0,
      sort: 'numeNorm',
      select: { nume: true, slug: true },
    }),
  ])

  const body = {
    citate: citate.docs.map((c) => ({
      text: c.text as string,
      slug: c.slug as string,
      autor:
        c.autor && typeof c.autor === 'object' ? ((c.autor as { nume?: string }).nume ?? null) : null,
    })),
    teme: teme.docs.map((t) => ({ nume: t.nume as string, slug: t.slug as string })),
    autori: autori.docs.map((a) => ({ nume: a.nume as string, slug: a.slug as string })),
    total: citate.totalDocs,
  }

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
