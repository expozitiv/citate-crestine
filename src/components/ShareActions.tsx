'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * Acțiunile paginii citatului:
 * - „distribuie ↗” — Web Share API nativ; fallback popover (copiază link,
 *   WhatsApp / Facebook / X) unde API-ul nu există;
 * - „copiază textul” / „copiază linkul” — clipboard + confirmare discretă
 *   (eticheta devine „copiat” timp de 2s).
 */
export const ShareActions = ({
  text,
  autor,
  url,
}: {
  text: string
  autor: string
  url: string
}) => {
  const [copiatText, setCopiatText] = useState(false)
  const [copiatLink, setCopiatLink] = useState(false)
  const [popover, setPopover] = useState(false)
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
                void copiaza(url, setCopiatLink)
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
          onClick={() => void copiaza(url, setCopiatLink)}
        >
          {copiatLink ? 'copiat' : 'copiază linkul'}
        </button>
      </span>
    </div>
  )
}
