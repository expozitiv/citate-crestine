import Link from 'next/link'
import React from 'react'

/** Logo „Citate creștine” — Fraunces 560, „creștine” italic 480 colorat. */
export const Logo = ({ className = 'logo' }: { className?: string }) => (
  <Link href="/" className={className}>
    Citate <em>creștine</em>
  </Link>
)
