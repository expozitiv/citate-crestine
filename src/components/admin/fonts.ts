import { Crimson_Pro, Fira_Sans, Fraunces } from 'next/font/google'

/* Tipografia contractului vizual (globals.css), încărcată și în admin —
   variabilele se aplică pe <html> prin htmlProps în layout-ul (payload). */

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

export const adminFontVars = `${fraunces.variable} ${crimson.variable} ${fira.variable}`
