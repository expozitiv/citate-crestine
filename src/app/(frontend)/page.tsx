import Link from 'next/link'
import React from 'react'

import { CitatInLista, Dinkus, TemeLinkuri } from '@/components/Citate'
import { HomeHeader } from '@/components/SiteHeader'
import { getCitatulZilei, getDinAntologie, getTemePopulare } from '@/lib/data'
import { autorDoc, carteDoc, dataScurta, temeDocs } from '@/lib/format'

/* Read-heavy: pagină statică, regenerată la 10 minute (citatul zilei se
   schimbă la miezul nopții) și invalidată la orice modificare din Admin. */
export const revalidate = 600

export default async function Homepage() {
  const [citatulZilei, temePopulare, dinAntologie] = await Promise.all([
    getCitatulZilei(),
    getTemePopulare(8),
    getDinAntologie(5),
  ])

  const autorZilei = citatulZilei ? autorDoc(citatulZilei) : null
  const carteZilei = citatulZilei ? carteDoc(citatulZilei) : null

  return (
    <>
      <HomeHeader />
      <main>
        {citatulZilei && (
          <section className="citat-zilei wrap">
            <div className="ghilimea" aria-hidden="true">
              „
            </div>
            <div className="eticheta citat-zilei__eticheta">CITATUL ZILEI · {dataScurta()}</div>
            <blockquote className="citat-zilei__text">
              <Link href={`/${citatulZilei.slug}`}>{citatulZilei.text}</Link>
            </blockquote>
            <div className="filet" />
            {autorZilei && (
              <div className="citat-zilei__autor">
                —{' '}
                <Link href={`/autori/${autorZilei.slug}`} className="link-serif">
                  {autorZilei.nume}
                </Link>
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
