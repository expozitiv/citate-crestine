import type { Metadata } from 'next'

import React from 'react'

import { CitatInLista, Dinkus, Paginare } from '@/components/Citate'
import { SiteHeader } from '@/components/SiteHeader'
import { searchCitate } from '@/lib/data'
import { numarRo } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Căutare',
  description: 'Caută în peste 20.000 de citate — după cuvânt, subiect, autor sau carte.',
  alternates: { canonical: '/cautare' },
  robots: { index: false },
}

type Props = {
  searchParams: Promise<{ q?: string; pagina?: string }>
}

export default async function PaginaCautare({ searchParams }: Props) {
  const { q = '', pagina: paginaParam } = await searchParams
  const query = q.trim()
  const pagina = Math.max(1, Number(paginaParam) || 1)

  const rezultate = query ? await searchCitate(query, pagina) : null

  return (
    <>
      <SiteHeader searchDefault={query} searchPlaceholder="Caută…" />
      <main>
        <div className="linie-hair">
          <section className="antet-pagina wrap">
            <h1 className="antet-pagina__titlu" style={{ margin: 0 }}>
              Căutare
            </h1>
            {query ? (
              <>
                <div className="antet-pagina__descriere">rezultate pentru „{query}”</div>
                {rezultate && (
                  <div className="antet-pagina__contor">
                    {numarRo(rezultate.totalDocs)}{' '}
                    {rezultate.totalDocs === 1 ? 'REZULTAT' : 'REZULTATE'}
                  </div>
                )}
              </>
            ) : (
              <div className="antet-pagina__descriere">
                Caută în întreaga antologie — după cuvânt, subiect, autor sau carte.
              </div>
            )}
          </section>
        </div>

        <section className="continut-lista lista-citate">
          {rezultate?.docs.map((citat, i) => (
            <React.Fragment key={citat.id}>
              {i > 0 && <Dinkus />}
              <CitatInLista citat={citat} />
            </React.Fragment>
          ))}
          {query && rezultate?.docs.length === 0 && (
            <p className="fara-rezultate">
              Niciun rezultat pentru „{query}”. Încearcă un alt cuvânt sau răsfoiește{' '}
              <a href="/teme">indexul tematic</a>.
            </p>
          )}
          {rezultate && (
            <Paginare
              cale="/cautare"
              mod="query"
              query={{ q: query }}
              pagina={pagina}
              totalPagini={rezultate.totalPages}
            />
          )}
        </section>
      </main>
    </>
  )
}
