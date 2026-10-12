'use client'

import React, { useEffect, useRef, useState } from 'react'

type StareImagine = 'gata' | 'genereaza' | 'eroare'

const ETICHETA_IMAGINE: Record<StareImagine, string> = {
  gata: 'distribuie imaginea',
  genereaza: 'se generează…',
  eroare: 'nu s-a putut genera',
}

/**
 * Acțiunile paginii citatului:
 * - „distribuie ↗” — Web Share API nativ; fallback popover (copiază link,
 *   WhatsApp / Facebook / X) unde API-ul nu există;
 * - „copiază textul” — clipboard + confirmare discretă (eticheta devine
 *   „copiat” timp de 2s);
 * - „distribuie imaginea” — cere PNG-ul pătrat generat de `/[slug]/imagine`
 *   și îl trimite în share sheet-ul nativ (mobil) sau îl descarcă (desktop).
 */
export const ShareActions = ({
  text,
  autor,
  url,
  slug,
}: {
  text: string
  autor: string
  url: string
  slug: string
}) => {
  const [copiatText, setCopiatText] = useState(false)
  const [popover, setPopover] = useState(false)
  const [imagine, setImagine] = useState<StareImagine>('gata')
  const popoverRef = useRef<HTMLDivElement>(null)

  const textIntreg = `„${text}” — ${autor}`

  useEffect(() => {
    if (!popover) return
    const inchide = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(false)
      }
    }
    document.addEventListener('mousedown', inchide)
    return () => document.removeEventListener('mousedown', inchide)
  }, [popover])

  const distribuie = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Citate creștine', text: textIntreg, url })
      } catch {
        // utilizatorul a anulat — nimic de făcut
      }
    } else {
      setPopover((v) => !v)
    }
  }

  const copiaza = async (continut: string, set: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(continut)
      set(true)
      setTimeout(() => set(false), 2000)
    } catch {
      // clipboard indisponibil — nimic de făcut
    }
  }

  const descarca = (blob: Blob, nume: string) => {
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = nume
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  const distribuieImagine = async () => {
    if (imagine === 'genereaza') return
    setImagine('genereaza')
    try {
      const raspuns = await fetch(`/${slug}/imagine`)
      if (!raspuns.ok) throw new Error(`HTTP ${raspuns.status}`)
      const blob = await raspuns.blob()
      const nume = `citat-${slug}.png`
      const fisier = new File([blob], nume, { type: 'image/png' })
      setImagine('gata')

      if (navigator.canShare?.({ files: [fisier] })) {
        try {
          await navigator.share({ files: [fisier], title: 'Citate creștine', text: textIntreg })
        } catch (e) {
          // anulat de utilizator — nimic de făcut; orice altă eroare
          // (ex. activarea de utilizator a expirat pe Safari) → descărcăm
          if (!(e instanceof DOMException && e.name === 'AbortError')) descarca(blob, nume)
        }
      } else {
        descarca(blob, nume)
      }
    } catch {
      setImagine('eroare')
      setTimeout(() => setImagine('gata'), 2500)
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(textIntreg)

  return (
    <div className="pagina-citat__actiuni">
      <span className="popover-ancora" ref={popoverRef}>
        <button type="button" className="buton-plin" onClick={distribuie}>
          distribuie<span className="sageata">↗</span>
        </button>
        {popover && (
          <span className="popover">
            <button
              type="button"
              onClick={() => {
                void copiaza(url, () => undefined)
                setPopover(false)
              }}
            >
              copiază linkul
            </button>
            <a
              href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href={`https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
          </span>
        )}
      </span>
      <span className="pagina-citat__actiuni-rand">
        <button
          type="button"
          className="buton-outline"
          onClick={() => void copiaza(textIntreg, setCopiatText)}
        >
          {copiatText ? 'copiat' : 'copiază textul'}
        </button>
        <button
          type="button"
          className="buton-outline buton-outline--stins"
          onClick={() => void distribuieImagine()}
          disabled={imagine === 'genereaza'}
          aria-busy={imagine === 'genereaza'}
        >
          {ETICHETA_IMAGINE[imagine]}
        </button>
      </span>
    </div>
  )
}
