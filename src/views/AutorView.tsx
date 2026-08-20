import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Atribuire, Paginare } from '@/components/Citate'
import { SiteHeader } from '@/components/SiteHeader'
import {
  countCitateByAutor,
  getAutorBySlug,
  getAutori,
  getCartiByAutor,
  getCitateByAutor,
  type CarteDoc,
} from '@/lib/data'
import { imagineUrl, numarRo } from '@/lib/format'

export async function metadataAutor(slug: string, pagina: number): Promise<Metadata> {
  const autor = await getAutorBySlug(slug)
  if (!autor) return {}
  const sufix = pagina > 1 ? ` (pagina ${pagina})` : ''
  return {
    title: `Citate de ${autor.nume}${sufix}`,
    description: `Citate teologice de ${autor.nume}${autor.ani ? ` (${autor.ani})` : ''} — din antologia Citate creștine.`,
    alternates: {
      canonical: pagina > 1 ? `/autori/${autor.slug}/pagina/${pagina}` : `/autori/${autor.slug}`,
    },
  }
}

/** Titlul unei cărți în banda „Sursele antologiei”:
 *  cărțile editurii → pagina cărții; sursele externe → link extern. */
const SursaCarte = ({ carte }: { carte: CarteDoc }) => {
  const titlu = carte.numeComplet || carte.nume
  const sufix = [carte.editura, carte.an].filter(Boolean).join(', ')
  const inner = <span style={{ fontStyle: 'italic' }}>{titlu}</span>

  return (
    <div>
      {carte.editura || !carte.url ? (
        <Link href={`/carti/${carte.slug}`} className="link-carte">
          {titlu}
        </Link>
      ) : (
        <a href={carte.url} className="link-carte" rel="noopener" target="_blank">
          {inner}
        </a>
      )}
      {sufix ? `, ${sufix}` : ''}
    </div>
  )
}

export async function AutorView({ slug, pagina }: { slug: string; pagina: number }) {
  const autor = await getAutorBySlug(slug)
  if (!autor) notFound()

  const [totiAutorii, citate, carti] = await Promise.all([
    getAutori(),
    getCitateByAutor(autor.id, pagina),
    getCartiByAutor(autor.id),
  ])
  if (pagina > 1 && citate.docs.length === 0) notFound()

  const portret = imagineUrl(autor.imagine)
  const altiAutori = totiAutorii.filter((a) => a.id !== autor.id)
  const altiAutoriDetalii = await Promise.all(
    altiAutori.map(async (a) => ({
      autor: a,
      numar: await countCitateByAutor(a.id),
      carti: await getCartiByAutor(a.id),
    })),
  )

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: autor.nume,
    url: `${serverUrl}/autori/${autor.slug}`,
    ...(autor.descriereScurta ? { description: autor.descriereScurta } : {}),
    ...(portret ? { image: portret.startsWith('http') ? portret : `${serverUrl}${portret}` } : {}),
    ...(autor.website ? { sameAs: [autor.website] } : {}),
  }

  return (
    <>
      <SiteHeader activ="autori" />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {totiAutorii.length > 1 && (
          <div className="linie-hair doar-desktop">
            <nav className="banda-autori wrap" aria-label="Autori">
              <span className="banda-autori__eticheta">autori:</span>
              {totiAutorii.map((a) => (
                <Link
                  key={a.id}
                  href={`/autori/${a.slug}`}
                  className={a.id === autor.id ? 'nav-activ' : undefined}
                >
                  {a.nume.toLocaleLowerCase('ro')}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <div className="linie-hair">
          <section className="autor-hero wrap">
            {portret && (
              <div className="autor-hero__medalion-inel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portret}
                  alt={autor.nume}
                  className="autor-hero__medalion"
                  width={168}
                  height={168}
                />
              </div>
            )}
            <h1 className="autor-hero__nume" style={{ marginBottom: 0 }}>
              {autor.nume}
            </h1>
            {(autor.ani || autor.descriere) && (
              <div className="autor-hero__descriere">
                {[autor.ani, autor.descriere].filter(Boolean).join(' · ')}
              </div>
            )}
            <div className="autor-hero__statistici">
              {numarRo(citate.totalDocs)} {citate.totalDocs === 1 ? 'CITAT' : 'CITATE'}
              {carti.length > 0 && (
                <> · {numarRo(carti.length)} {carti.length === 1 ? 'SURSĂ' : 'SURSE'}</>
              )}
            </div>
          </section>
        </div>

        <section className="continut-lista lista-citate">
          <div className="antet-lista">
            <h2 className="antet-lista__titlu" style={{ margin: 0 }}>
              Citate
            </h2>
            <div className="antet-lista__nota">ordonate alfabetic, ca în antologie</div>
          </div>
          {citate.docs.map((citat, i) => (
            <React.Fragment key={citat.id}>
              {i > 0 && <div className="hairline-citat" />}
              <article>
                <div className="citat-lista__text">
                  <Link href={`/${citat.slug}`}>{citat.text}</Link>
                </div>
                <Atribuire citat={citat} arataAutor={false} />
              </article>
            </React.Fragment>
          ))}
          {citate.docs.length === 0 && (
            <p className="fara-rezultate">Nu există încă citate pentru acest autor.</p>
          )}
          <Paginare
            cale={`/autori/${autor.slug}`}
            pagina={pagina}
            totalPagini={citate.totalPages}
          />
        </section>

        {carti.length > 0 && (
          <section className="banda-surse">
            <div className="banda-surse__inner wrap">
              <div className="eticheta banda-surse__eticheta">SURSELE ANTOLOGIEI</div>
              <div className="banda-surse__grid">
                {carti.map((carte) => (
                  <SursaCarte key={carte.id} carte={carte} />
                ))}
              </div>
              {altiAutoriDetalii.map(({ autor: alt, numar, carti: cartiAlt }) => {
                const portretAlt = imagineUrl(alt.imagine)
                const carteAlt = cartiAlt[0]
                return (
                  <div key={alt.id} className="alt-autor">
                    {portretAlt && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portretAlt}
                        alt={alt.nume}
                        className="alt-autor__medalion"
                        width={52}
                        height={52}
                      />
                    )}
                    <div>
                      <span className="alt-autor__eticheta">alt autor în antologie</span>{' '}
                      &nbsp;{' '}
                      <Link href={`/autori/${alt.slug}`} className="link-serif">
                        {alt.nume}
                      </Link>
                      {numar > 0 && carteAlt ? (
                        <>
                          {' '}
                          — {numarRo(numar)} {numar === 1 ? 'citat' : 'citate'} din{' '}
                          <Link href={`/carti/${carteAlt.slug}`} className="link-carte">
                            {carteAlt.numeComplet || carteAlt.nume}
                          </Link>
                          {carteAlt.editura ? `, ${carteAlt.editura}` : ''}
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
