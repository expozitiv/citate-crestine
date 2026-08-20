import Link from 'next/link'
import React from 'react'

import type { CitatDoc, TemaDoc } from '@/lib/data'
import { autorDoc, carteDoc, temeDocs } from '@/lib/format'

/** Dinkus `* * *` — separatorul editorial dintre citate. */
export const Dinkus = () => <div className="dinkus">*&nbsp;*&nbsp;*</div>

/** Linkuri de teme small-caps verzi, separate cu „ · ”. */
export const TemeLinkuri = ({ teme }: { teme: TemaDoc[] }) => (
  <span className="teme-linkuri">
    {teme.map((t, i) => (
      <React.Fragment key={t.id}>
        {i > 0 && <span className="sep"> · </span>}
        <Link href={`/teme/${t.slug}`}>{t.nume.toLocaleLowerCase('ro')}</Link>
      </React.Fragment>
    ))}
  </span>
)

/** Titlul cărții — întotdeauna link intern către pagina cărții (regulă editorială). */
export const LinkCarte = ({
  carte,
  cuAn = true,
}: {
  carte: { nume: string; slug: string; an?: number | null }
  cuAn?: boolean
}) => (
  <>
    <Link href={`/carti/${carte.slug}`} style={{ fontStyle: 'italic' }}>
      {carte.nume}
    </Link>
    {cuAn && carte.an ? `, ${carte.an}` : null}
  </>
)

/**
 * Atribuirea unui citat în liste: „— Autor · Carte, an · temă”.
 * Dacă citatul n-are carte, doar autorul (regulă editorială din README).
 */
export const Atribuire = ({
  citat,
  arataAutor = true,
  arataCarte = true,
  arataTema = true,
}: {
  citat: CitatDoc
  arataAutor?: boolean
  arataCarte?: boolean
  arataTema?: boolean
}) => {
  const autor = autorDoc(citat)
  const carte = carteDoc(citat)
  const teme = temeDocs(citat)
  const primaTema = teme[0]

  const parts: React.ReactNode[] = []
  if (arataAutor && autor) {
    parts.push(<React.Fragment key="autor">— {autor.nume}</React.Fragment>)
  }
  if (arataCarte && carte) {
    parts.push(<LinkCarte key="carte" carte={carte} />)
  }
  if (arataTema && primaTema) {
    parts.push(
      <Link key="tema" href={`/teme/${primaTema.slug}`} className="atribuire-tema">
        {primaTema.nume.toLocaleLowerCase('ro')}
      </Link>,
    )
  }
  if (parts.length === 0) return null

  return (
    <div className="citat-lista__atribuire">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' · '}
          {p}
        </React.Fragment>
      ))}
    </div>
  )
}

/** Un citat în ritmul standard al listelor: text Fraunces → atribuire. */
export const CitatInLista = ({
  citat,
  arataAutor = true,
  arataCarte = true,
  arataTema = true,
}: {
  citat: CitatDoc
  arataAutor?: boolean
  arataCarte?: boolean
  arataTema?: boolean
}) => (
  <article>
    <div className="citat-lista__text">
      <Link href={`/${citat.slug}`}>{citat.text}</Link>
    </div>
    <Atribuire citat={citat} arataAutor={arataAutor} arataCarte={arataCarte} arataTema={arataTema} />
  </article>
)

/**
 * Paginare discretă (nu infinite scroll).
 * mod="path" → /cale/pagina/2 (pagini statice, ISR); mod="query" → ?q=…&pagina=2 (căutare).
 */
export const Paginare = ({
  cale,
  pagina,
  totalPagini,
  mod = 'path',
  query,
}: {
  cale: string
  pagina: number
  totalPagini: number
  mod?: 'path' | 'query'
  query?: Record<string, string>
}) => {
  if (totalPagini <= 1) return null

  const href = (p: number) => {
    if (mod === 'path') {
      return p > 1 ? `${cale}/pagina/${p}` : cale
    }
    const params = new URLSearchParams(query)
    if (p > 1) params.set('pagina', String(p))
    else params.delete('pagina')
    const qs = params.toString()
    return qs ? `${cale}?${qs}` : cale
  }

  return (
    <nav className="paginare" aria-label="Paginare">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)}>← anterioară</Link>
      ) : (
        <span className="inactiv">← anterioară</span>
      )}
      <span>
        pagina {pagina} din {totalPagini}
      </span>
      {pagina < totalPagini ? (
        <Link href={href(pagina + 1)}>următoarea →</Link>
      ) : (
        <span className="inactiv">următoarea →</span>
      )}
    </nav>
  )
}
