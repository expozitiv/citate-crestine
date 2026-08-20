import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'
import { countCitateByAutor, getAutori } from '@/lib/data'
import { imagineUrl, numarRo } from '@/lib/format'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Autorii antologiei',
  description: 'Autorii citați în antologia Citate creștine.',
  alternates: { canonical: '/autori' },
}

export default async function PaginaAutori() {
  const autori = await getAutori()
  const detalii = await Promise.all(
    autori.map(async (autor) => ({ autor, numar: await countCitateByAutor(autor.id) })),
  )

  return (
    <>
      <SiteHeader activ="autori" />
      <main>
        <div className="linie-hair">
          <section className="antet-pagina wrap">
            <h1 className="antet-pagina__titlu" style={{ margin: 0 }}>
              Autorii antologiei
            </h1>
            <div className="antet-pagina__descriere">
              Fiecare autor, cu sursele și citatele lui — ca într-o antologie tipărită.
            </div>
          </section>
        </div>

        <section className="continut-lista">
          {detalii.map(({ autor, numar }, i) => {
            const portret = imagineUrl(autor.imagine)
            return (
              <React.Fragment key={autor.id}>
                {i > 0 && <div className="hairline-citat" style={{ margin: '34px 0' }} />}
                <article className="autor-card">
                  {portret && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portret}
                      alt={autor.nume}
                      className="medalion autor-card__medalion"
                      width={96}
                      height={96}
                    />
                  )}
                  <div>
                    <h2 className="autor-card__nume">
                      <Link href={`/autori/${autor.slug}`} className="link-serif">
                        {autor.nume}
                      </Link>
                    </h2>
                    {(autor.ani || autor.descriere) && (
                      <div className="autor-card__descriere">
                        {[autor.ani, autor.descriere].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="autor-card__contor">
                      {numarRo(numar)} {numar === 1 ? 'CITAT' : 'CITATE'}
                    </div>
                  </div>
                </article>
              </React.Fragment>
            )
          })}
          {detalii.length === 0 && (
            <p className="fara-rezultate">Nu există încă autori în antologie.</p>
          )}
        </section>
      </main>
    </>
  )
}
