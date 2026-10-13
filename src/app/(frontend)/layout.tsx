import type { Metadata } from 'next'

import { GoogleTagManager } from '@next/third-parties/google'
import { Crimson_Pro, Fira_Sans, Fraunces } from 'next/font/google'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'

import './globals.css'

/* Tipografia contractului vizual — cu diacritice românești corecte (latin-ext) */
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

const crimson = Crimson_Pro({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
})

const fira = Fira_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-fira',
  display: 'swap',
})

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * Google Tag Manager — containerul editurii. Doar pe build-ul de producție
 * (nu pe `next dev`), ca traficul de dezvoltare să nu intre în statistici.
 * `NEXT_PUBLIC_GTM_ID` gol dezactivează complet.
 */
const GTM_ID =
  process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-5J68Q38T') : ''

export const metadata: Metadata = {
  metadataBase: new URL(SERVER_URL),
  title: {
    default: 'Citate creștine — o antologie teologică în limba română',
    template: '%s — Citate creștine',
  },
  description:
    'O antologie teologică în limba română: peste 20.000 de citate curate, organizate pe subiecte și autori. O inițiativă a Editurii MAGNA GRATIA.',
  openGraph: {
    siteName: 'Citate creștine',
    locale: 'ro_RO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${crimson.variable} ${fira.variable}`}>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      <body>
        <div className="bara-verde-sus" />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
