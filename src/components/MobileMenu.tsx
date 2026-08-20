'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { NAV_LINKS } from './nav'
import { SearchForm } from './SearchForm'

/**
 * Header mobil complet: logo + hamburger (două linii 24×2px), meniul
 * dedesubt, apoi căutarea full-width — conform machetelor 3a/3b.
 */
export const MobileHeader = ({
  searchDefault = '',
  showSearch = true,
}: {
  searchDefault?: string
  showSearch?: boolean
}) => {
  const [deschis, setDeschis] = useState(false)

  return (
    <>
      <div className="header-mobil">
        <Link href="/" className="header-mobil__logo">
          Citate <em>creștine</em>
        </Link>
        <button
          type="button"
          className="hamburger"
          aria-label={deschis ? 'Închide meniul' : 'Deschide meniul'}
          aria-expanded={deschis}
          onClick={() => setDeschis((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
      {deschis && (
        <nav className="meniu-mobil" aria-label="Meniu principal">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setDeschis(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setDeschis(false)}>
            contact
          </Link>
        </nav>
      )}
      {showSearch && (
        <div className="cautare-mobil">
          <SearchForm defaultValue={searchDefault} placeholder="Caută în 20.000+ de citate…" />
        </div>
      )}
    </>
  )
}
