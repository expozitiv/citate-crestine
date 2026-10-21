/**
 * Măsoară octeții trimiși de Postgres către aplicație (= „Shared Pooler Egress” Supabase,
 * fără overhead TLS) pentru fiecare tip de pagină, rulând exact apelurile din rutele reale.
 *   DATABASE_URI=postgresql://…:5433/… npx payload run scripts/egress/masurare.ts
 * Rezultatul: JSON pe stdout (ultima linie).
 */
import net from 'node:net'

const tinta = new URL(process.env.DATABASE_URI!)
const contor = { jos: 0, sus: 0, interogari: 0 }
/** DEDUP=1: generateMetadata + pagina citesc documentul o singură dată (React cache). */
const DEDUP = process.env.DEDUP === '1'

/** Proxy TCP care numără octeții server → client și mesajele ReadyForQuery ('Z'). */
const server = net.createServer((client) => {
  const pg = net.connect(Number(tinta.port), tinta.hostname)
  let rest = Buffer.alloc(0)
  pg.on('data', (buf: Buffer) => {
    contor.jos += buf.length
    rest = Buffer.concat([rest, buf])
    while (rest.length >= 5) {
      const len = rest.readInt32BE(1)
      if (rest.length < 1 + len) break
      if (rest[0] === 0x5a) contor.interogari++
      rest = rest.subarray(1 + len)
    }
    client.write(buf)
  })
  client.on('data', (buf: Buffer) => {
    contor.sus += buf.length
    pg.write(buf)
  })
  client.on('close', () => pg.destroy())
  pg.on('close', () => client.destroy())
  client.on('error', () => pg.destroy())
  pg.on('error', () => client.destroy())
})
await new Promise<void>((r) => server.listen(5499, '127.0.0.1', r))
const prin = new URL(tinta)
prin.port = '5499'
process.env.DATABASE_URI = prin.toString()

const d = await import('../../src/lib/data')
const s = await import('../../src/lib/sitemap')
const payload = await d.getPayloadClient()

const masoara = async (fn: () => Promise<unknown>) => {
  contor.jos = 0
  contor.sus = 0
  contor.interogari = 0
  await fn()
  return { octeti: contor.jos, interogari: contor.interogari }
}

/** Media pe un eșantion de documente, ca să nu depindem de un singur citat/autor. */
const medie = async <T>(elemente: T[], fn: (e: T) => Promise<unknown>) => {
  let octeti = 0
  let interogari = 0
  for (const e of elemente) {
    const r = await masoara(() => fn(e))
    octeti += r.octeti
    interogari += r.interogari
  }
  return { octeti: Math.round(octeti / elemente.length), interogari: interogari / elemente.length }
}

const esantion = async (collection: 'citate' | 'autori' | 'carti' | 'teme', n: number) =>
  (
    await payload.find({ collection, limit: n, sort: 'id', depth: 0, select: { slug: true } as never })
  ).docs.map((x) => x as unknown as { id: number; slug: string })

// încălzire: init Payload, pull schema etc. nu se contorizează
await d.countCitate()

const citate = (await esantion('citate', 2000)).filter((_, i) => i % 40 === 0)
const autori = (await esantion('autori', 450)).filter((_, i) => i % 15 === 0)
const carti = (await esantion('carti', 1800)).filter((_, i) => i % 60 === 0)
const teme = (await esantion('teme', 250)).filter((_, i) => i % 10 === 0)

const rezultat = {
  // generateMetadata + pagina (src/app/(frontend)/[slug]/page.tsx)
  citat: await medie(citate, async (c) => {
    if (!DEDUP) await d.getCitatBySlug(c.slug)
    const citat = await d.getCitatBySlug(c.slug)
    if (citat) await d.getCitateInrudite(citat)
  }),
  // opengraph-image + /imagine
  citatOg: await medie(citate, (c) => d.getCitatBySlug(c.slug)),
  // src/views/AutorView.tsx (metadata + pagină)
  autor: await medie(autori, async (a) => {
    if (!DEDUP) await d.getAutorBySlug(a.slug)
    const autor = await d.getAutorBySlug(a.slug)
    if (!autor) return
    await Promise.all([
      d.getAutoriCuNumar(),
      d.getCitateByAutor(autor.id, 1),
      d.getCartiByAutor(autor.id),
      d.getCoautoriIds(autor.id),
    ])
  }),
  // src/views/CarteView.tsx
  carte: await medie(carti, async (c) => {
    if (!DEDUP) await d.getCarteBySlug(c.slug)
    const carte = await d.getCarteBySlug(c.slug)
    if (carte) await d.getCitateByCarte(carte.id, 1)
  }),
  // src/views/TemaView.tsx
  tema: await medie(teme, async (t) => {
    if (!DEDUP) await d.getTemaBySlug(t.slug)
    const tema = await d.getTemaBySlug(t.slug)
    if (tema) await d.getCitateByTema(tema.id, 1)
  }),
  home: await masoara(() =>
    Promise.all([d.getCitatulZilei(), d.getDinAntologie(), d.getTemePopulare()]),
  ),
  indexAutori: await masoara(() => d.getAutoriCuNumar()),
  indexCarti: await masoara(() => d.getCarti()),
  indexTeme: await masoara(async () => {
    const t = await d.getTemeCuNumar()
    await d.getCitateByTema(t[0].id, 1)
  }),
  sitemapStatic: await masoara(async () => {
    await s.numarChunkuri()
    await s.sitemapStatic()
  }),
  sitemapCitate: await masoara(async () => {
    await s.numarChunkuri()
    await s.sitemapCitate(1)
  }),
  cautare: await medie(['har', 'credinta', 'rugaciune', 'sfintenia'], (q) => d.searchCitate(q)),
}

// numărul de pagini ISR pe tip (pentru o trecere completă a crawlerelor)
const sql = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, number>[] }> } }).drizzle
const { sql: tag } = await import('@payloadcms/db-postgres/drizzle')
const pagini = (
  await sql.execute(
    tag`select
      (select count(*) from citate)::int as citat,
      (select coalesce(sum(ceil(n/20.0)),0) from (select count(*) n from citate group by autor_id) x)::int as autor,
      (select count(*) from carti)::int + (select coalesce(sum(greatest(ceil(n/20.0)-1,0)),0) from (select count(*) n from citate where carte_id is not null group by carte_id) x)::int as carte,
      (select count(*) from teme)::int + (select coalesce(sum(greatest(ceil(n/20.0)-1,0)),0) from (select count(*) n from citate_rels where path='teme' group by teme_id) x)::int as tema`,
  )
).rows[0]

console.log(JSON.stringify({ rezultat, pagini }))
server.close()
process.exit(0)
