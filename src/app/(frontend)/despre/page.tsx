import type { Metadata } from 'next'

import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Despre',
  description:
    'Despre Citate creștine — o antologie teologică în limba română, inițiativă a Editurii MAGNA GRATIA.',
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
            Site-ul este o inițiativă a{' '}
            <a href="https://www.magnagratia.org/" rel="noopener">
              Editurii MAGNA GRATIA
            </a>
            . Traducerile sunt folosite cu permisiune, iar fiecare citat își păstrează trimiterea
            către volumul din care provine.
          </p>
          <p>
            Fiecare citat este menit să fie în sine un punct de plecare într-un act de meditare la
            ideea lui centrală — antologia se răsfoiește, nu se citește ca o carte obișnuită.
          </p>

          <h2>Cum să folosești corect acest website</h2>
          <p className="pagina-simpla__lead">
            Cititorul este rugat să respecte drepturile de autor și să preia corect citarea.
          </p>

          <h3>În lucrări scrise</h3>
          <p>
            Se va respecta citarea potrivit normelor de citare impuse prin natura lucrării. De
            regulă, citarea va avea forma: Prenume Nume autor, <em>Titlul cărții</em>, editură,
            loc, an, p. sau pp.
          </p>
          <div className="exemplu">
            <div className="eticheta">Exemplu</div>
            <p>
              Ichabod Spencer, <em>Silește-i să intre</em>, Editura MAGNA GRATIA, Dascălu, 2015,
              p. 358.
            </p>
          </div>

          <h3>În social media sau alte forme de citare pe internet</h3>
          <p>
            Citarea pe care o recomandăm ar trebui să ia forma următoare: citat, Prenume Nume
            autor, <em>Titlul cărții</em>, editură, hyperlink.
          </p>
          {/* TODO: exemplul de mai jos e incomplet — textul primit de la editor s-a oprit la
              „Duhul Sfân…”; de completat cu citatul întreg, autorul, titlul și linkul. */}
          <div className="exemplu">
            <div className="eticheta">Exemplu</div>
            <p>
              „Marile doctrine ale creștinismului sunt adevărurile pe care Duhul Sfânt…”, Prenume
              Nume autor, <em>Titlul cărții</em>, Editura MAGNA GRATIA,{' '}
              <a href="https://citatecrestine.ro/">https://citatecrestine.ro/…</a>
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
