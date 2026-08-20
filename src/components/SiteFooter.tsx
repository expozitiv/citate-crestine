import Link from 'next/link'
import React from 'react'

import { NAV_LINKS } from './nav'

/**
 * Footer negru standard: bară verde 3px, logo + tagline, citat central + ✠,
 * nav small-caps, bara de credits pe 3 coloane și rândul de copyright.
 * Pe mobil: varianta condensată, centrată (macheta 3a/3b).
 */
export const SiteFooter = () => (
  <footer className="footer">
    <div className="footer__bara" />

    {/* Desktop */}
    <div className="footer__principal wrap">
      <div className="footer__stanga">
        <div className="footer__logo">
          Citate <em>creștine</em>
        </div>
        <div className="footer__tagline">O antologie teologică în limba română</div>
      </div>
      <div className="footer__centru">
        <div className="footer__citat">
          „Harul este singura speranță
          <br />
          pentru această lume căzută.”
        </div>
        <div className="footer__cruce">✠</div>
      </div>
      <nav className="footer__nav" aria-label="Meniu footer">
        {NAV_LINKS.map((l) => (
          <Link key={l.key} href={l.href}>
            {l.label}
          </Link>
        ))}
        <a href="https://www.magnagratia.org/" className="auriu" rel="noopener">
          magnagratia.org
        </a>
      </nav>
    </div>
    <div className="footer__credite-outer">
      <div className="footer__credite wrap">
        <span>O INIȚIATIVĂ ASOCIATĂ EDITURII MAGNA GRATIA</span>
        <span>TRADUCERI FOLOSITE CU PERMISIUNE</span>
        <span>
          REALIZAT DE{' '}
          <a href="https://expozitiv.ro" className="auriu" rel="noopener">
            STUDIO EXPOZITIV
          </a>
        </span>
      </div>
    </div>
    <div className="footer__copyright wrap">
      citatecrestine.ro · Asociația Magna Gratia | Copyright © 2005–2026
      <br />
      Toate drepturile privind acest website și publicațiile postate pe el sunt rezervate.
    </div>

    {/* Mobil — condensat, centrat */}
    <div className="footer__mobil">
      <div className="footer__logo">
        Citate <em>creștine</em>
      </div>
      <div className="footer__cruce">✠</div>
      <nav className="footer__mobil-nav" aria-label="Meniu footer">
        {NAV_LINKS.map((l) => (
          <Link key={l.key} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="footer__mobil-copyright">
        citatecrestine.ro · Asociația Magna Gratia | © 2005–2026
        <br />
        Realizat de{' '}
        <a href="https://expozitiv.ro" className="auriu" rel="noopener">
          Studio Expozitiv
        </a>
      </div>
    </div>
  </footer>
)
