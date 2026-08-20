import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import React from 'react'

import { CitatInLista, Dinkus, Paginare } from '@/components/Citate'
import { SiteHeader } from '@/components/SiteHeader'
import { getCitateByTema, getTemaBySlug } from '@/lib/data'
import { numarRo } from '@/lib/format'

/**
 * Pagina temei (README 2c — „Pagina temei”): titlul temei mare, descriere
 * scurtă, contor de citate, lista în ritmul standard, paginare discretă.
 */
export async function metadataTema(slug: string, pagina: number): Promise<Metadata> {
  const tema = await getTemaBySlug(slug)
  if (!tema) return {}
  const sufix = pagina > 1 ? ` (pagina ${pagina})` : ''
  return {
    title: `Citate despre ${tema.nume.toLocaleLowerCase('ro')}${sufix}`,
    description:
      tema.descriere ||
      `Citate teologice despre ${tema.nume.toLocaleLowerCase('ro')} — din antologia Citate creștine.`,
    alternates: {
      canonical: pagina > 1 ? `/teme/${tema.slug}/pagina/${pagina}` : `/teme/${tema.slug}`,
    },
  }
}

export async function TemaView({ slug, pagina }: { slug: string; pagina: number }) {
  const tema = await getTemaBySlug(slug)
  if (!tema) notFound()

  const citate = await getCitateByTema(tema.id, pagina)
  if (pagina > 1 && citate.docs.length === 0) notFound()

  return (
    <>
      <SiteHeader activ="subiecte" />
      <main>
        <div className="linie-hair">
          <section className="antet-pagina wrap">
            <h1 className="antet-pagina__titlu" style={{ margin: 0 }}>
              {tema.nume}
            </h1>
            {tema.descriere && <div className="antet-pagina__descriere">{tema.descriere}</div>}
            <div className="antet-pagina__contor">
              {numarRo(citate.totalDocs)} {citate.totalDocs === 1 ? 'CITAT' : 'CITATE'}
            </div>
          </section>
        </div>

        <section className="continut-lista lista-citate">
          {citate.docs.map((citat, i) => (
            <React.Fragment key={citat.id}>
              {i > 0 && <Dinkus />}
              <CitatInLista citat={citat} arataTema={false} />
            </React.Fragment>
          ))}
          {citate.docs.length === 0 && (
            <p className="fara-rezultate">Nu există încă citate pentru acest subiect.</p>
          )}
          <Paginare cale={`/teme/${tema.slug}`} pagina={pagina} totalPagini={citate.totalPages} />
        </section>
      </main>
    </>
  )
}
