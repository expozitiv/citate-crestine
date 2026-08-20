import type { Metadata } from 'next'

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

export const metadata: Metadata = {
  metadataBase: new URL(SERVER_URL),
  title: {
    default: 'Citate creștine — o antologie teologică în limba română',
    template: '%s — Citate creștine',
  },
  description:
    'O antologie teologică în limba română: peste 20.000 de citate curate, organizate pe subiecte și autori. O inițiativă asociată editurii MAGNA GRATIA.',
  openGraph: {
    siteName: 'Citate creștine',
    locale: 'ro_RO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${crimson.variable} ${fira.variable}`}>
      <body>
        <div className="bara-verde-sus" />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
