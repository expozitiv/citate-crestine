'use client'

import React, { useState } from 'react'

/** Formularul Kit (ex-ConvertKit) al editurii — doar adresa de POST și câmpul `email_address`. */
const KIT_URL = 'https://app.kit.com/forms/10039266/subscriptions'

type Stare = 'gata' | 'trimite' | 'succes' | 'eroare'

const MESAJ: Partial<Record<Stare, string>> = {
  succes: 'Mulțumim! Verifică emailul pentru a confirma abonarea.',
  eroare: 'Nu s-a putut trimite. Încearcă din nou sau scrie-ne la contact@magnagratia.org.',
}

/**
 * Abonare la newsletter, desenată în stilul site-ului (fără scriptul și
 * stilurile Kit). Trimite în fundal și confirmă pe loc; fără JavaScript,
 * formularul face POST clasic la Kit, care afișează propria confirmare.
 */
export const NewsletterForm = ({ compact = false }: { compact?: boolean }) => {
  const [stare, setStare] = useState<Stare>('gata')

  const trimite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    if (stare === 'trimite') return
    setStare('trimite')
    try {
      const raspuns = await fetch(KIT_URL, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      const json: { status?: string } | null = await raspuns.json().catch(() => null)
      if (raspuns.ok && json?.status !== 'failed' && json?.status !== 'error') {
        setStare('succes')
        form.reset()
      } else {
        setStare('eroare')
      }
    } catch {
      setStare('eroare')
    }
  }

  return (
    <div className={`abonare${compact ? ' abonare--compact' : ''}`}>
      <div className="abonare__text">
        <div className="abonare__titlu">Fii primul care află!</div>
        <div className="abonare__descriere">
          Abonează-te cu adresa de email și te anunțăm când publicăm ceva nou.
        </div>
      </div>
      <form
        className="abonare__form"
        action={KIT_URL}
        method="post"
        onSubmit={(e) => void trimite(e)}
        aria-label="Abonare la citate pe email"
      >
        <div className="abonare__camp">
          <input
            type="email"
            name="email_address"
            placeholder="Adresa ta de email…"
            autoComplete="email"
            required
            aria-label="Adresa de email"
            disabled={stare === 'trimite'}
          />
          <button type="submit" disabled={stare === 'trimite'} aria-busy={stare === 'trimite'}>
            {stare === 'trimite' ? 'se trimite…' : 'abonează-mă'}
          </button>
        </div>
        {MESAJ[stare] && (
          <div
            className={`abonare__mesaj${stare === 'eroare' ? ' abonare__mesaj--eroare' : ''}`}
            role="status"
            aria-live="polite"
          >
            {MESAJ[stare]}
          </div>
        )}
      </form>
    </div>
  )
}
