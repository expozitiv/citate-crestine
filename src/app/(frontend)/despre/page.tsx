import type { Metadata } from 'next'

import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Despre',
  description:
    'Despre Citate creștine — o antologie teologică în limba română, inițiativă asociată editurii MAGNA GRATIA.',
  alternates: { canonical: '/despre' },
}

export default function PaginaDespre() {
  return (
    <>
      <SiteHeader activ="despre" />
      <main>
        <section className="pagina-simpla">
          <h1>Despre</h1>
          <p>
            <strong>Citate creștine</strong> este o antologie teologică în limba română: o colecție
            curată de peste 20.000 de citate, organizate pe subiecte și autori, gândită ca punct de
            plecare pentru gândire, credință și meditare creștină.
          </p>
          <p>
            Site-ul este o inițiativă asociată editurii{' '}
            <a href="https://www.magnagratia.org/" rel="noopener">
              MAGNA GRATIA
            </a>
            . Traducerile sunt folosite cu permisiune, iar fiecare citat își păstrează trimiterea
            către volumul din care provine.
          </p>
          <p>
            Fiecare citat este menit să fie în sine un punct de plecare într-un act de meditare la
            ideea lui centrală — antologia se răsfoiește, nu se citește ca o carte obișnuită.
          </p>
        </section>
      </main>
    </>
  )
}
