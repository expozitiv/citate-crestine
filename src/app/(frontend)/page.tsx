import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { CitatInLista, Dinkus, TemeLinkuri } from '@/components/Citate'
import { HomeHeader } from '@/components/SiteHeader'
import { getCitatulZilei, getDinAntologie, getTemePopulare } from '@/lib/data'
import { autorDoc, carteDoc, dataLunga, dataScurta, imagineUrl, temeDocs } from '@/lib/format'

/* Read-heavy: pagină statică, regenerată la 10 minute (citatul zilei se
   schimbă la miezul nopții) și invalidată la orice modificare din Admin. */
export const revalidate = 600

export const metadata: Metadata = { alternates: { canonical: '/' } }

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/* WebSite + SearchAction — caseta de căutare din rezultatele Google. */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Citate creștine',
  url: SERVER_URL,
  inLanguage: 'ro',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SERVER_URL}/cautare?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default async function Homepage() {
  const [citatulZilei, temePopulare, dinAntologie] = await Promise.all([
    getCitatulZilei(),
    getTemePopulare(8),
    getDinAntologie(5),
  ])

  const autorZilei = citatulZilei ? autorDoc(citatulZilei) : null
  const carteZilei = citatulZilei ? carteDoc(citatulZilei) : null
  const portretZilei = autorZilei ? imagineUrl(autorZilei.imagine) : null

  return (
    <>
      <HomeHeader />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {citatulZilei && (
          <section className="citat-zilei-banda">
            <div className="citat-zilei wrap">
              <div className="antet-hairline citat-zilei__antet">
                <div className="eticheta">
                  CITATUL ZILEI · <span className="doar-i-desktop">{dataLunga()}</span>
                  <span className="doar-i-mobil">{dataScurta()}</span>
                </div>
              </div>
              <div className="ghilimea" aria-hidden="true">
                „
              </div>
              <blockquote className="citat-zilei__text">
                <Link href={`/${citatulZilei.slug}`}>{citatulZilei.text}</Link>
              </blockquote>
              <div className="filet" />
              {autorZilei && (
                <div className="citat-zilei__autor-bloc">
                  {portretZilei && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portretZilei}
                      alt={autorZilei.nume}
                      className="medalion citat-zilei__medalion"
                      width={60}
                      height={60}
                    />
                  )}
                  <div className="citat-zilei__autor">
                    —{' '}
                    <Link href={`/autori/${autorZilei.slug}`} className="link-serif">
                      {autorZilei.nume}
                    </Link>
                  </div>
                </div>
              )}
              {carteZilei && (
                <div className="citat-zilei__sursa">
                  <Link href={`/carti/${carteZilei.slug}`}>
                    {carteZilei.nume}
                    {carteZilei.an ? `, ${carteZilei.an}` : ''}
                  </Link>
                </div>
              )}
              <div className="citat-zilei__teme">
                <TemeLinkuri teme={temeDocs(citatulZilei)} />
              </div>
            </div>
          </section>
        )}

        <section className="banda-subiecte">
          <div className="banda-subiecte__inner wrap">
            <div className="banda-subiecte__antet">
              <h2 className="banda-subiecte__titlu" style={{ margin: 0 }}>
                Subiecte
              </h2>
              <Link href="/teme" className="banda-subiecte__index">
                tot indexul tematic →
              </Link>
            </div>
            <div className="banda-subiecte__grid">
              {temePopulare.map((tema) => (
                <div key={tema.id} className="banda-subiecte__item">
                  <Link href={`/teme/${tema.slug}`}>{tema.nume}</Link>
                  <span className="banda-subiecte__numar">{tema.numar}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {dinAntologie.length > 0 && (
          <section className="antologie wrap">
            <div className="eticheta antologie__eticheta">DIN ANTOLOGIE</div>
            {dinAntologie.map((citat, i) => (
              <React.Fragment key={citat.id}>
                {i > 0 && <Dinkus />}
                <CitatInLista citat={citat} />
              </React.Fragment>
            ))}
            <div className="mai-multe">
              <Link href="/teme">mai multe citate →</Link>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
