'use client'

import React from 'react'

import { CHEIE_TEMA } from '@/lib/tema'

/**
 * Comutator luminos ↔ întunecat. Implicit site-ul urmează setarea dispozitivului
 * (scriptul din layout); un clic fixează tema opusă. Dacă alegerea coincide cu cea
 * a dispozitivului, preferința se șterge — site-ul revine la comportamentul automat.
 * Iconița (lună pe tema luminoasă, soare pe cea întunecată) se alege din CSS după
 * `html[data-theme]`, deci markup-ul e identic pe server și client (fără mismatch).
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const comuta = () => {
    const root = document.documentElement
    const noua = root.dataset.theme === 'dark' ? 'light' : 'dark'
    const sistem = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    try {
      if (noua === sistem) localStorage.removeItem(CHEIE_TEMA)
      else localStorage.setItem(CHEIE_TEMA, noua)
    } catch {
      // stocare blocată (navigare privată) — tema se aplică doar pe pagina curentă
    }
    root.dataset.theme = noua
  }

  return (
    <button
      type="button"
      className={`tema-toggle ${className}`.trim()}
      onClick={comuta}
      aria-label="Comută tema luminoasă / întunecată"
      title="Temă luminoasă / întunecată"
    >
      <svg className="tema-toggle__luna" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg className="tema-toggle__soare" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  )
}
