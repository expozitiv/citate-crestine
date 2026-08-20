import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Dinkus, LinkCarte, TemeLinkuri } from '@/components/Citate'
import { ShareActions } from '@/components/ShareActions'
import { SiteHeader } from '@/components/SiteHeader'
import { getCitatBySlug, getCitateInrudite } from '@/lib/data'
import { autorDoc, carteDoc, imagineUrl, temeDocs } from '@/lib/format'
import { RESERVED_SLUGS } from '@/lib/slug'

export const revalidate = 3600

/* Paginile citatelor (~22.000) se generează la cerere și se cache-uiesc (ISR). */
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const trunchiat = (text: string, max: number): string => {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return {}
  const citat = await getCitatBySlug(slug)
  if (!citat) return {}
  const autor = autorDoc(citat)
  return {
    title: trunchiat(citat.text, 60),
    description: `${trunchiat(citat.text, 155)}${autor ? ` — ${autor.nume}` : ''}`,
    alternates: { canonical: `/${citat.slug}` },
    openGraph: {
      title: trunchiat(citat.text, 60),
      description: `${trunchiat(citat.text, 155)}${autor ? ` — ${autor.nume}` : ''}`,
      url: `/${citat.slug}`,
      type: 'article',
    },
  }
}

export default async function PaginaCitat({ params }: Props) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) notFound()

  const citat = await getCitatBySlug(slug)
  if (!citat) notFound()

  const autor = autorDoc(citat)
  const carte = carteDoc(citat)
  const teme = temeDocs(citat)
  const primaTema = teme[0]
  const inrudite = await getCitateInrudite(citat, 3)
  const portret = autor ? imagineUrl(autor.imagine) : null
  const url = `${SERVER_URL}/${citat.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    text: citat.text,
    url,
    ...(autor ? { spokenByCharacter: { '@type': 'Person', name: autor.nume } } : {}),
    ...(carte ? { isPartOf: { '@type': 'Book', name: carte.nume } } : {}),
  }

  return (
    <>
      <SiteHeader mobileSearch={false} />
      <main>
        <article className="pagina-citat">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <nav className="breadcrumb" aria-label="Breadcrumb">
            {primaTema ? (
              <>
                <Link href={`/teme/${primaTema.slug}`}>
                  {primaTema.nume.toLocaleLowerCase('ro')}
                </Link>{' '}
                <span className="sep">·</span> citat
              </>
            ) : (
              'citat'
            )}
          </nav>
          <div className="ghilimea" aria-hidden="true">
            „
          </div>
          <blockquote className="pagina-citat__text" style={{ margin: 0 }}>
            {citat.text}
          </blockquote>
          <div className="filet" />
          {autor && (
            <div className="pagina-citat__autor-bloc">
              {portret && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portret}
                  alt={autor.nume}
                  className="medalion pagina-citat__medalion"
                  width={78}
                  height={78}
                />
              )}
              <div>
                <div className="pagina-citat__autor">
                  —{' '}
                  <Link href={`/autori/${autor.slug}`} className="link-serif">
                    {autor.nume}
                  </Link>
                </div>
                {(autor.ani || autor.descriereScurta) && (
                  <div className="pagina-citat__autor-descriere">
                    {[autor.ani, autor.descriereScurta].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}
          {carte && (
            <div className="pagina-citat__sursa">
              din volumul{' '}
              {carte.url ? (
                <a href={carte.url} className="link-carte" rel="noopener" target="_blank">
                  {carte.nume}
                </a>
              ) : (
                <Link href={`/carti/${carte.slug}`} className="link-carte">
                  {carte.nume}
                </Link>
              )}
              {carte.editura ? `, ${carte.editura}` : ''}
              {carte.an ? `, ${carte.an}` : ''}
              {carte.url && (
                <Link
                  href={`/carti/${carte.slug}`}
                  className="pagina-citat__sursa-intern"
                  title="Toate citatele din această carte"
                  aria-label="Toate citatele din această carte"
                >
                  {/* Fleuron „carte deschisă cu pagini în evantai” — vezi design handoff */}
                  <svg
                    viewBox="0 0 16 16"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M8 3.4 C6.6 2.1 4.3 1.8 1.9 2.6 V11.5 C4.3 10.7 6.6 11 8 12.3 C9.4 11 11.7 10.7 14.1 11.5 V2.6 C11.7 1.8 9.4 2.1 8 3.4 Z" />
                    <path d="M8 3.4 V12.3" />
                    <path d="M8 5.6 C7 4.8 5.5 4.6 3.9 5" />
                    <path d="M8 5.6 C9 4.8 10.5 4.6 12.1 5" />
                  </svg>
                </Link>
              )}
            </div>
          )}
          {teme.length > 0 && (
            <div className="pagina-citat__teme">
              <TemeLinkuri teme={teme} />
            </div>
          )}
          <ShareActions text={citat.text} autor={autor?.nume ?? 'Citate creștine'} url={url} />
        </article>

        {inrudite.length > 0 && (
          <section className="banda-inrudite">
            <div className="banda-inrudite__continut">
              <div className="antet-hairline">
                <div className="eticheta">
                  ALTE CITATE{primaTema ? ` DESPRE ${primaTema.nume.toLocaleUpperCase('ro')}` : ''}
                </div>
              </div>
              {inrudite.map((c, i) => {
                const carteInrudita = carteDoc(c)
                const autorInrudit = autorDoc(c)
                return (
                  <React.Fragment key={c.id}>
                    {i > 0 && <Dinkus />}
                    <article>
                      <div className="citat-lista__text">
                        <Link href={`/${c.slug}`}>{c.text}</Link>
                      </div>
                      <div className="citat-lista__atribuire">
                        {carteInrudita ? (
                          <LinkCarte carte={carteInrudita} />
                        ) : autorInrudit ? (
                          <>— {autorInrudit.nume}</>
                        ) : null}
                      </div>
                    </article>
                  </React.Fragment>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
