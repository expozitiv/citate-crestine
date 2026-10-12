import Link from 'next/link'
import React from 'react'

/** Buton mare, mereu vizibil în vârful barei laterale: înapoi la panoul de bord (/admin). */
export function NavAcasa() {
  return (
    <div className="cc-nav-acasa">
      <Link className="cc-nav-acasa__link" href="/admin">
        <span className="cc-nav-acasa__eticheta">Citate creștine</span>
        <span className="cc-nav-acasa__titlu">Panoul de bord</span>
      </Link>
    </div>
  )
}
