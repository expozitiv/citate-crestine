import type { Metadata } from 'next'

import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact — Citate creștine, o inițiativă asociată editurii MAGNA GRATIA.',
  alternates: { canonical: '/contact' },
}

export default function PaginaContact() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pagina-simpla">
          <h1>Contact</h1>
          <p>
            Pentru întrebări, sugestii sau semnalarea unei erori într-un citat, ne puteți scrie la{' '}
            <a href="mailto:contact@magnagratia.org">contact@magnagratia.org</a>.
          </p>
          <p>
            Editura MAGNA GRATIA
            <br />
            Str. Liliacului nr. 26, Dascălu-Ilfov 077075
            <br />
            <a href="https://www.magnagratia.org/" rel="noopener">
              www.magnagratia.org
            </a>
          </p>
        </section>
      </main>
    </>
  )
}
