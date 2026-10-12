import Link from 'next/link'
import React from 'react'

/** Link către manualul editorului, sub grupurile de colecții din bara laterală a admin-ului. */
export function NavManual() {
  return (
    <div className="cc-nav-manual">
      <Link className="cc-nav-manual__link" href="/admin/manual">
        Manualul editorului
      </Link>
    </div>
  )
}
