import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Atribuire, Paginare } from '@/components/Citate'
import { SiteHeader } from '@/components/SiteHeader'
import { sorteazaDupaFamilie } from '@/lib/autori'
import {
  getAutorBySlug,
  getAutoriCuNumar,
  getCartiByAutor,
  getCitateByAutor,
  getCoautoriIds,
  type AutorCuNumar,
  type CarteDoc,
} from '@/lib/data'
import { imagineUrl, numarRo } from '@/lib/format'

/** Câți „alți autori” recomandăm sub sursele autorului. */
const ALTI_AUTORI = 6

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

/**
 * „Alți autori în antologie”: întâi coautorii din aceleași volume (antologii,
 * cărți scrise în doi), apoi cei mai citați autori — cel mult ALTI_AUTORI, fără repetări.
 */
const alegeAltiAutori = (
  toti: AutorCuNumar[],
  curent: number,
  coautoriIds: number[],
): AutorCuNumar[] => {
  const dupaId = new Map(toti.map((a) => [a.id, a]))
  const alesi: AutorCuNumar[] = []
  const vazuti = new Set<number>([curent])
  const adauga = (a: AutorCuNumar | undefined) => {
    if (!a || vazuti.has(a.id) || a.numar === 0 || alesi.length >= ALTI_AUTORI) return
    vazuti.add(a.id)
    alesi.push(a)
  }
  for (const id of coautoriIds) adauga(dupaId.get(id))
  for (const a of [...toti].sort((x, y) => y.numar - x.numar)) adauga(a)
  return alesi
}

export async function AutorView({ slug, pagina }: { slug: string; pagina: number }) {
  const autor = await getAutorBySlug(slug)
  if (!autor) notFound()

  const [totiAutorii, citate, carti, coautoriIds] = await Promise.all([
    getAutoriCuNumar(),
    getCitateByAutor(autor.id, pagina),
    getCartiByAutor(autor.id),
    getCoautoriIds(autor.id),
  ])
  if (pagina > 1 && citate.docs.length === 0) notFound()

  const portret = imagineUrl(autor.imagine)

  /* Vecinii alfabetici (după numele de familie), ca răsfoirea unei antologii. */
  const index = sorteazaDupaFamilie(totiAutorii.filter((a) => a.numar > 0))
  const pozitie = index.findIndex((a) => a.id === autor.id)
  const anterior = pozitie > 0 ? index[pozitie - 1] : null
  const urmator = pozitie >= 0 && pozitie < index.length - 1 ? index[pozitie + 1] : null

  const altiAutori = alegeAltiAutori(totiAutorii, autor.id, coautoriIds)

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
        {index.length > 1 && (
          <div className="linie-hair">
            <nav className="nav-vecini wrap" aria-label="Autori vecini în index">
              <span className="nav-vecini__lateral">
                {anterior && (
                  <Link href={`/autori/${anterior.slug}`} rel="prev">
                    ‹ {anterior.nume}
                  </Link>
                )}
              </span>
              <Link href="/autori" className="nav-vecini__index">
                autorii antologiei
              </Link>
              <span className="nav-vecini__lateral nav-vecini__lateral--dreapta">
                {urmator && (
                  <Link href={`/autori/${urmator.slug}`} rel="next">
                    {urmator.nume} ›
                  </Link>
                )}
              </span>
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

        {(carti.length > 0 || altiAutori.length > 0) && (
          <section className="banda-surse">
            <div className="banda-surse__inner wrap">
              {carti.length > 0 && (
                <>
                  <div className="eticheta banda-surse__eticheta">SURSELE ANTOLOGIEI</div>
                  <div className="banda-surse__grid">
                    {carti.map((carte) => (
                      <SursaCarte key={carte.id} carte={carte} />
                    ))}
                  </div>
                </>
              )}
              {altiAutori.length > 0 && (
                <div className={`alti-autori${carti.length > 0 ? ' alti-autori--separat' : ''}`}>
                  <div className="alti-autori__antet">
                    <span className="eticheta">ALȚI AUTORI ÎN ANTOLOGIE</span>
                    <Link href="/autori" className="alti-autori__index">
                      toți autorii →
                    </Link>
                  </div>
                  <div className="alti-autori__grid">
                    {altiAutori.map((alt) => (
                      <div key={alt.id} className="alti-autori__item">
                        <Link href={`/autori/${alt.slug}`} className="link-serif">
                          {alt.nume}
                        </Link>
                        <span className="alti-autori__numar">
                          {numarRo(alt.numar)} {alt.numar === 1 ? 'citat' : 'citate'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
