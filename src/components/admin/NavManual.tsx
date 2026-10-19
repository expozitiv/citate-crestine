import Link from 'next/link'
import React from 'react'

/** Linkuri către manualul editorului și media kit, sub grupurile de colecții din bara laterală a admin-ului. */
export function NavManual() {
  return (
    <div className="cc-nav-manual">
      <Link className="cc-nav-manual__link" href="/admin/manual">
        Manualul editorului
      </Link>
      <Link className="cc-nav-manual__link" href="/admin/media-kit">
        Media kit
      </Link>
    </div>
  )
}
