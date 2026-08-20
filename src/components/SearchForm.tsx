'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Sugestii = {
  citate: { text: string; slug: string; autor: string | null }[]
  teme: { nume: string; slug: string }[]
  autori: { nume: string; slug: string }[]
  total?: number
}

const GOALE: Sugestii = { citate: [], teme: [], autori: [] }

/** Teaser scurt pentru un citat în dropdown, tăiat la limită de cuvânt. */
const teaser = (text: string, max = 90): string => {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`
}

/**
 * Câmpul de căutare: input serif italic + buton verde plin „caută”, lipite.
 * Formular GET către /cautare (funcționează fără JavaScript); cu JavaScript,
 * afișează sugestii live (citate · subiecte · autori) în timp ce tastezi.
 */
export const SearchForm = ({
  compact = false,
  defaultValue = '',
  placeholder = 'Caută în 20.000+ de citate…',
}: {
  compact?: boolean
  defaultValue?: string
  placeholder?: string
}) => {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)
  const [sugestii, setSugestii] = useState<Sugestii>(GOALE)
  const [deschis, setDeschis] = useState(false)
  const rootRef = useRef<HTMLFormElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const areRezultate =
    sugestii.citate.length > 0 || sugestii.teme.length > 0 || sugestii.autori.length > 0

  /* Sugestii cu debounce; cererile vechi se anulează. */
  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) {
      setSugestii(GOALE)
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/sugestii?q=${encodeURIComponent(text)}`, {
          signal: ctrl.signal,
        })
        if (res.ok) {
          setSugestii((await res.json()) as Sugestii)
          setDeschis(true)
        }
      } catch {
        // cerere anulată sau eșuată — păstrăm starea curentă
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  /* Închidere la click în afară */
  useEffect(() => {
    if (!deschis) return
    const inchide = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setDeschis(false)
    }
    document.addEventListener('mousedown', inchide)
    return () => document.removeEventListener('mousedown', inchide)
  }, [deschis])

  const cautaTot = () => {
    setDeschis(false)
    router.push(`/cautare?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form
      ref={rootRef}
      action="/cautare"
      method="get"
      className={`searchform${compact ? ' searchform--compact' : ''}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        cautaTot()
      }}
    >
      <div className={compact ? 'searchbox searchbox--compact' : 'searchbox'}>
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setDeschis(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDeschis(false)
          }}
          placeholder={placeholder}
          aria-label="Caută în citate"
          aria-expanded={deschis && areRezultate}
          autoComplete="off"
        />
        <button type="submit">caută</button>
      </div>

      {deschis && q.trim().length >= 2 && (
        <div className="sugestii" role="listbox">
          {sugestii.autori.length > 0 && (
            <div className="sugestii__grup">
              <div className="sugestii__eticheta">AUTORI</div>
              {sugestii.autori.map((a) => (
                <Link
                  key={a.slug}
                  href={`/autori/${a.slug}`}
                  className="sugestii__item"
                  onClick={() => setDeschis(false)}
                >
                  {a.nume}
                </Link>
              ))}
            </div>
          )}
          {sugestii.teme.length > 0 && (
            <div className="sugestii__grup">
              <div className="sugestii__eticheta">SUBIECTE</div>
              {sugestii.teme.map((t) => (
                <Link
                  key={t.slug}
                  href={`/teme/${t.slug}`}
                  className="sugestii__item sugestii__item--sc"
                  onClick={() => setDeschis(false)}
                >
                  {t.nume.toLocaleLowerCase('ro')}
                </Link>
              ))}
            </div>
          )}
          {sugestii.citate.length > 0 && (
            <div className="sugestii__grup">
              <div className="sugestii__eticheta">CITATE</div>
              {sugestii.citate.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="sugestii__item sugestii__item--citat"
                  onClick={() => setDeschis(false)}
                >
                  {teaser(c.text)}
                  {c.autor && <span className="sugestii__autor"> — {c.autor}</span>}
                </Link>
              ))}
            </div>
          )}
          {areRezultate ? (
            <button type="button" className="sugestii__toate" onClick={cautaTot}>
              toate rezultatele{typeof sugestii.total === 'number' ? ` (${sugestii.total})` : ''} →
            </button>
          ) : (
            <div className="sugestii__nimic">Niciun rezultat pentru „{q.trim()}”</div>
          )}
        </div>
      )}
    </form>
  )
}
