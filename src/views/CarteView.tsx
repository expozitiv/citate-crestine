import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { CitatInLista, Dinkus, Paginare } from '@/components/Citate'
import { SiteHeader } from '@/components/SiteHeader'
import { getCarteBySlug, getCitateByCarte } from '@/lib/data'
import { numarRo } from '@/lib/format'

export async function metadataCarte(slug: string, pagina: number): Promise<Metadata> {
  const carte = await getCarteBySlug(slug)
  if (!carte) return {}
  const autor = typeof carte.autor === 'object' ? carte.autor : null
  const sufix = pagina > 1 ? ` (pagina ${pagina})` : ''
  return {
    title: `${carte.nume}${autor ? ` — ${autor.nume}` : ''}${sufix}`,
    description: `Citate din volumul „${carte.nume}”${autor ? ` de ${autor.nume}` : ''}${carte.editura ? `, ${carte.editura}` : ''} — antologia Citate creștine.`,
    alternates: {
      canonical: pagina > 1 ? `/carti/${carte.slug}/pagina/${pagina}` : `/carti/${carte.slug}`,
    },
  }
}

/** Pagina cărții: titlu, autor, editură/an, URL-ul extern al sursei, citatele. */
export async function CarteView({ slug, pagina }: { slug: string; pagina: number }) {
  const carte = await getCarteBySlug(slug)
  if (!carte) notFound()

  const autor = typeof carte.autor === 'object' ? carte.autor : null
  const citate = await getCitateByCarte(carte.id, pagina)
  if (pagina > 1 && citate.docs.length === 0) notFound()

  return (
    <>
      <SiteHeader />
      <main>
        <div className="linie-hair">
          <section className="antet-pagina wrap">
            <h1 className="antet-pagina__titlu" style={{ margin: 0, fontStyle: 'italic' }}>
              {carte.numeComplet || carte.nume}
            </h1>
            <div className="antet-pagina__descriere">
              {autor && (
                <>
                  de{' '}
                  <Link href={`/autori/${autor.slug}`} className="link-serif">
                    {autor.nume}
                  </Link>
                </>
              )}
              {[carte.editura, carte.an].filter(Boolean).length > 0 && (
                <> · {[carte.editura, carte.an].filter(Boolean).join(', ')}</>
              )}
            </div>
            {carte.url && (
              <div className="antet-pagina__descriere" style={{ marginTop: 4 }}>
                <a href={carte.url} rel="noopener" target="_blank" className="link-carte">
                  vezi sursa →
                </a>
              </div>
            )}
            <div className="antet-pagina__contor">
              {numarRo(citate.totalDocs)} {citate.totalDocs === 1 ? 'CITAT' : 'CITATE'}
            </div>
          </section>
        </div>

        <section className="continut-lista lista-citate">
          {citate.docs.map((citat, i) => (
            <React.Fragment key={citat.id}>
              {i > 0 && <Dinkus />}
              <CitatInLista citat={citat} arataAutor={false} arataCarte={false} />
            </React.Fragment>
          ))}
          {citate.docs.length === 0 && (
            <p className="fara-rezultate">Nu există încă citate din această carte.</p>
          )}
          <Paginare cale={`/carti/${carte.slug}`} pagina={pagina} totalPagini={citate.totalPages} />
        </section>
      </main>
    </>
  )
}
