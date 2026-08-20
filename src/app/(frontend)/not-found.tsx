import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Pagină negăsită',
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pagina-simpla" style={{ textAlign: 'center' }}>
          <h1>Pagină negăsită</h1>
          <p>
            Pagina căutată nu există sau a fost mutată. Poți încerca{' '}
            <Link href="/cautare">o căutare</Link> sau să răsfoiești{' '}
            <Link href="/teme">indexul tematic</Link>.
          </p>
        </section>
      </main>
    </>
  )
}
