import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'
import { getCitateByTema, getTemeCuNumar, type TemaCuNumar } from '@/lib/data'
import { autorDoc, carteDoc } from '@/lib/format'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Indexul tematic',
  description:
    'Toate subiectele antologiei: citate teologice organizate alfabetic pe teme — harul, credința, rugăciunea, crucea lui Hristos și multe altele.',
  alternates: { canonical: '/teme' },
}

/** Litera de secțiune (cu diacritice: Î și Ș sunt litere distincte, ca în machetă). */
const litera = (nume: string): string => nume.charAt(0).toLocaleLowerCase('ro')

export default async function IndexulTematic() {
  const teme = (await getTemeCuNumar()).filter((t) => t.numar > 0)

  const grupuri = new Map<string, TemaCuNumar[]>()
  for (const tema of teme) {
    const l = litera(tema.nume)
    const list = grupuri.get(l) ?? []
    list.push(tema)
    grupuri.set(l, list)
  }
  const litere = [...grupuri.keys()]

  /* Citatul recomandat: din tema cea mai bogată. */
  const temaRecomandata = [...teme].sort((a, b) => b.numar - a.numar)[0]
  const citatRecomandat = temaRecomandata
    ? (await getCitateByTema(temaRecomandata.id, 1)).docs[0]
    : null
  const autorRecomandat = citatRecomandat ? autorDoc(citatRecomandat) : null
  const carteRecomandata = citatRecomandat ? carteDoc(citatRecomandat) : null

  return (
    <>
      <SiteHeader activ="subiecte" searchPlaceholder="Caută un subiect…" />
      <main>
        <section className="tema-hero">
          <div className="tema-hero__inner wrap">
            <h1 className="tema-hero__titlu" style={{ margin: 0 }}>
              Indexul tematic
            </h1>
            <div className="tema-hero__descriere">
              Fiecare citat este un punct de plecare într-un act de meditare — un apel la gândire,
              credință și meditare creștină.
            </div>
            {litere.length > 0 && (
              <nav className="alfabet" aria-label="Index alfabetic">
                {litere.map((l, i) => (
                  <a key={l} href={`#litera-${i}`} className={i === 0 ? 'activ' : undefined}>
                    {l}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>

        {litere.map((l, i) => (
          <section key={l} id={`litera-${i}`} className="sectiune-litera wrap">
            <div className="sectiune-litera__litera" aria-hidden="true">
              {l.toLocaleUpperCase('ro')}
            </div>
            <div className="sectiune-litera__grid">
              {grupuri.get(l)!.map((tema) => (
                <div key={tema.id} className="sectiune-litera__item">
                  <Link href={`/teme/${tema.slug}`}>{tema.nume}</Link>
                  <span className="sectiune-litera__numar">{tema.numar}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {citatRecomandat && temaRecomandata && (
          <section className="citat-recomandat">
            <div className="eticheta citat-recomandat__eticheta">
              DIN SUBIECTUL „{temaRecomandata.nume.toLocaleUpperCase('ro')}”
            </div>
            <div className="citat-recomandat__text">
              <Link href={`/${citatRecomandat.slug}`}>{citatRecomandat.text}</Link>
            </div>
            <div className="citat-recomandat__atribuire">
              {autorRecomandat ? `— ${autorRecomandat.nume}` : ''}
              {carteRecomandata ? (
                <>
                  {' · '}
                  <Link href={`/carti/${carteRecomandata.slug}`} style={{ fontStyle: 'italic' }}>
                    {carteRecomandata.nume}
                  </Link>
                  {carteRecomandata.an ? `, ${carteRecomandata.an}` : ''}
                </>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
