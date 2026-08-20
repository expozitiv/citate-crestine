import Link from 'next/link'
import React from 'react'

import { dataLunga } from '@/lib/format'

import { MobileHeader } from './MobileMenu'
import { NAV_LINKS, type NavKey } from './nav'
import { SearchForm } from './SearchForm'

/**
 * Header-ul interior (paginile citat / teme / autori / cărți / căutare):
 * logo stânga, nav + căutare compactă dreapta; pe mobil logo + hamburger.
 */
export const SiteHeader = ({
  activ,
  searchDefault = '',
  searchPlaceholder = 'Caută…',
  mobileSearch = true,
}: {
  activ?: NavKey
  searchDefault?: string
  searchPlaceholder?: string
  mobileSearch?: boolean
}) => (
  <header>
    <div className="linie-dubla doar-desktop">
      <div className="header-interior wrap">
      <Link href="/" className="logo">
        Citate <em>creștine</em>
      </Link>
      <nav className="header-interior__nav" aria-label="Meniu principal">
        {NAV_LINKS.map((l) => (
          <Link key={l.key} href={l.href} className={activ === l.key ? 'nav-activ' : undefined}>
            {l.label}
          </Link>
        ))}
          <SearchForm compact defaultValue={searchDefault} placeholder={searchPlaceholder} />
        </nav>
      </div>
    </div>
    <MobileHeader searchDefault={searchDefault} showSearch={mobileSearch} />
  </header>
)

/**
 * Header-ul paginii principale: banda meta (dată · ✠ · despre/contact),
 * masthead centrat cu logo mare, tagline, nav și căutarea proeminentă.
 */
export const HomeHeader = () => (
  <header>
    <div className="linie-hair doar-desktop">
      <div className="metaband wrap">
      <span className="metaband__data">{dataLunga()}</span>
      <span className="metaband__cruce">✠</span>
        <span className="metaband__linkuri">
          <Link href="/despre">DESPRE</Link>
          <Link href="/contact">CONTACT</Link>
        </span>
      </div>
    </div>
    <div className="masthead wrap">
      <div className="masthead__logo">
        <Link href="/">
          Citate <em>creștine</em>
        </Link>
      </div>
      <div className="masthead__tagline">O ANTOLOGIE TEOLOGICĂ ÎN LIMBA ROMÂNĂ</div>
      <nav className="masthead__nav" aria-label="Meniu principal">
        {NAV_LINKS.map((l) => (
          <Link key={l.key} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
    <div className="linie-dubla doar-desktop">
      <div className="masthead-search wrap">
        <SearchForm placeholder="Caută în 20.000+ de citate — cuvânt, subiect sau autor…" />
      </div>
    </div>
    <MobileHeader />
  </header>
)
