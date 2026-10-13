import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'
import { literaAutor, numeIndex, sorteazaDupaFamilie } from '@/lib/autori'
import { getAutoriCuNumar, type AutorCuNumar } from '@/lib/data'
import { numarRo } from '@/lib/format'

export const revalidate = 2592000 // 30 de zile; modificările din admin invalidează țintit (lib/revalidate.ts)

export const metadata: Metadata = {
  title: 'Autorii antologiei',
  description:
    'Indexul autorilor citați în antologia Citate creștine — de la puritani și reformatori la predicatori și teologi contemporani.',
  alternates: { canonical: '/autori' },
}

const CEI_MAI_CITATI = 8

/**
 * Indexul autorilor (același model ca indexul tematic): bandă verde cu alfabet,
 * secțiuni pe litera numelui de familie, „Familie, Prenume” și numărul de citate.
 */
export default async function PaginaAutori() {
  const autori = sorteazaDupaFamilie((await getAutoriCuNumar()).filter((a) => a.numar > 0))

  const grupuri = new Map<string, AutorCuNumar[]>()
  for (const autor of autori) {
    const l = literaAutor(autor.nume)
    const list = grupuri.get(l) ?? []
    list.push(autor)
    grupuri.set(l, list)
  }
  const litere = [...grupuri.keys()]

  const ceiMaiCitati = [...autori].sort((a, b) => b.numar - a.numar).slice(0, CEI_MAI_CITATI)
  const totalCitate = autori.reduce((s, a) => s + a.numar, 0)

  return (
    <>
      <SiteHeader activ="autori" searchPlaceholder="Caută un autor…" />
      <main>
        <section className="tema-hero">
          <div className="tema-hero__inner wrap">
            <h1 className="tema-hero__titlu" style={{ margin: 0 }}>
              Autorii antologiei
            </h1>
            <div className="tema-hero__descriere">
              {numarRo(autori.length)} de autori și {numarRo(totalCitate)} de citate — de la
              puritani și reformatori la predicatori și teologi de azi, așezați după numele de
              familie, ca într-o antologie tipărită.
            </div>
            {litere.length > 0 && (
              <nav className="alfabet" aria-label="Index alfabetic">
                {litere.map((l, i) => (
                  <a key={l} href={`#litera-${l}`} className={i === 0 ? 'activ' : undefined}>
                    {l.toLocaleLowerCase('ro')}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>

        {ceiMaiCitati.length > 0 && (
          <section className="linie-hair">
            <div className="autori-top wrap">
              <div className="eticheta autori-top__eticheta">CEI MAI CITAȚI</div>
              <div className="autori-top__lista">
                {ceiMaiCitati.map((autor) => (
                  <Link key={autor.id} href={`/autori/${autor.slug}`} className="autori-top__item">
                    <span className="autori-top__nume">{autor.nume}</span>
                    <span className="autori-top__numar">{numarRo(autor.numar)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {litere.map((l) => (
          <section key={l} id={`litera-${l}`} className="sectiune-litera wrap">
            <div className="sectiune-litera__litera" aria-hidden="true">
              {l}
            </div>
            <div className="sectiune-litera__grid">
              {grupuri.get(l)!.map((autor) => (
                <div key={autor.id} className="sectiune-litera__item">
                  <span>
                    <Link href={`/autori/${autor.slug}`}>{numeIndex(autor.nume)}</Link>
                    {autor.ani && <span className="sectiune-litera__ani"> {autor.ani}</span>}
                  </span>
                  <span className="sectiune-litera__numar">{numarRo(autor.numar)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {autori.length === 0 && (
          <p className="fara-rezultate">Nu există încă autori în antologie.</p>
        )}
      </main>
    </>
  )
}
