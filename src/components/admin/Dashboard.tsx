import type { AdminViewServerProps } from 'payload'

import Link from 'next/link'
import React from 'react'

import type { Autori, Carti } from '@/payload-types'

const nrRo = new Intl.NumberFormat('ro-RO')

const dataRo = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
})

function scurteaza(text: string, max = 160): string {
  if (text.length <= max) return text
  const taiat = text.slice(0, max)
  return `${taiat.slice(0, Math.max(taiat.lastIndexOf(' '), 60))}…`
}

/* Filtru pre-completat în list view (formatul generat de UI-ul Payload). */
function filtruLista(colectie: string, camp: string): string {
  return `/admin/collections/${colectie}?where[or][0][and][0][${camp}][exists]=false`
}

export async function Dashboard({ payload, user }: AdminViewServerProps) {
  const [citate, autori, carti, teme, faraCarte, faraTeme, autoriFaraImagine, ultimele] =
    await Promise.all([
      payload.count({ collection: 'citate' }),
      payload.count({ collection: 'autori' }),
      payload.count({ collection: 'carti' }),
      payload.count({ collection: 'teme' }),
      payload.count({ collection: 'citate', where: { carte: { exists: false } } }),
      payload.count({ collection: 'citate', where: { teme: { exists: false } } }),
      payload.count({ collection: 'autori', where: { imagine: { exists: false } } }),
      payload.find({
        collection: 'citate',
        sort: '-updatedAt',
        limit: 5,
        depth: 1,
        select: { text: true, slug: true, autor: true, carte: true, updatedAt: true },
      }),
    ])

  const statistici = [
    { eticheta: 'Citate', numar: citate.totalDocs, colectie: 'citate' },
    { eticheta: 'Autori', numar: autori.totalDocs, colectie: 'autori' },
    { eticheta: 'Cărți', numar: carti.totalDocs, colectie: 'carti' },
    { eticheta: 'Teme', numar: teme.totalDocs, colectie: 'teme' },
  ]

  const indicatori = [
    {
      eticheta: 'citate fără carte (sursă)',
      numar: faraCarte.totalDocs,
      href: filtruLista('citate', 'carte'),
    },
    {
      eticheta: 'citate fără teme',
      numar: faraTeme.totalDocs,
      href: filtruLista('citate', 'teme'),
    },
    {
      eticheta: 'autori fără imagine',
      numar: autoriFaraImagine.totalDocs,
      href: filtruLista('autori', 'imagine'),
    },
  ]

  const colectii = [
    { eticheta: 'Citate', href: '/admin/collections/citate' },
    { eticheta: 'Autori', href: '/admin/collections/autori' },
    { eticheta: 'Cărți', href: '/admin/collections/carti' },
    { eticheta: 'Teme', href: '/admin/collections/teme' },
    { eticheta: 'Media', href: '/admin/collections/media' },
    { eticheta: 'Utilizatori', href: '/admin/collections/users' },
  ]

  const numeUtilizator = user?.nume || user?.email?.split('@')[0]

  return (
    <div className="cc-dash">
      <header className="cc-dash__antet">
        <p className="cc-dash__eticheta">Citate creștine — panou de administrare</p>
        <h1 className="cc-dash__titlu">
          Bine ai venit{numeUtilizator ? `, ${numeUtilizator}` : ''}!
        </h1>
        <p className="cc-dash__subtitlu">
          Antologia numără {nrRo.format(citate.totalDocs)} de citate, din{' '}
          {nrRo.format(autori.totalDocs)} de autori și {nrRo.format(carti.totalDocs)} de cărți,
          organizate pe {nrRo.format(teme.totalDocs)} de teme.
        </p>
        <div className="cc-dash__filet" aria-hidden="true" />
      </header>

      <div className="cc-dash__statistici">
        {statistici.map((stat) => (
          <Link
            className="cc-dash__stat"
            href={`/admin/collections/${stat.colectie}`}
            key={stat.colectie}
          >
            <span className="cc-dash__stat-numar">{nrRo.format(stat.numar)}</span>
            <span className="cc-dash__stat-eticheta">{stat.eticheta}</span>
          </Link>
        ))}
      </div>

      <div className="cc-dash__actiuni">
        <Link className="cc-dash__buton cc-dash__buton--plin" href="/admin/collections/citate/create">
          Adaugă citat
        </Link>
        <Link className="cc-dash__buton cc-dash__buton--outline" href="/admin/collections/autori/create">
          Adaugă autor
        </Link>
        <Link className="cc-dash__buton cc-dash__buton--outline" href="/admin/collections/carti/create">
          Adaugă carte
        </Link>
      </div>

      <div className="cc-dash__coloane">
        <section className="cc-dash__sectiune" aria-labelledby="cc-dash-ultimele">
          <h2 className="cc-dash__sectiune-titlu" id="cc-dash-ultimele">
            Ultimele citate
          </h2>
          {ultimele.docs.length === 0 ? (
            <p className="cc-dash__gol">Niciun citat încă — adaugă primul.</p>
          ) : (
            <ul className="cc-dash__lista-citate">
              {ultimele.docs.map((citat) => {
                const autor = citat.autor as Autori | null
                const carte = citat.carte as Carti | null | undefined
                return (
                  <li className="cc-dash__citat" key={citat.id}>
                    <Link className="cc-dash__citat-text" href={`/admin/collections/citate/${citat.id}`}>
                      {scurteaza(citat.text)}
                    </Link>
                    <p className="cc-dash__citat-atribuire">
                      {autor?.nume ?? 'fără autor'}
                      {carte?.nume ? <em> · {carte.nume}</em> : null}
                      {citat.updatedAt ? (
                        <span className="cc-dash__citat-data">
                          {' — '}
                          {dataRo.format(new Date(citat.updatedAt))}
                        </span>
                      ) : null}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="cc-dash__coloana-secundara">
          <section className="cc-dash__sectiune" aria-labelledby="cc-dash-calitate">
            <h2 className="cc-dash__sectiune-titlu" id="cc-dash-calitate">
              Calitatea conținutului
            </h2>
            <ul className="cc-dash__indicatori">
              {indicatori.map((indicator) => (
                <li key={indicator.eticheta}>
                  {indicator.numar === 0 ? (
                    <span className="cc-dash__indicator cc-dash__indicator--ok">
                      <span className="cc-dash__indicator-numar">✓</span>
                      <span>{indicator.eticheta}</span>
                    </span>
                  ) : (
                    <Link className="cc-dash__indicator" href={indicator.href}>
                      <span className="cc-dash__indicator-numar">{nrRo.format(indicator.numar)}</span>
                      <span>{indicator.eticheta}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="cc-dash__sectiune" aria-labelledby="cc-dash-colectii">
            <h2 className="cc-dash__sectiune-titlu" id="cc-dash-colectii">
              Colecții
            </h2>
            <nav className="cc-dash__colectii">
              {colectii.map((colectie) => (
                <Link className="cc-dash__colectie" href={colectie.href} key={colectie.href}>
                  {colectie.eticheta}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </div>
    </div>
  )
}
