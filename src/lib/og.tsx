import { ImageResponse } from 'next/og'
import React from 'react'

/**
 * Cardurile Open Graph (1200×630) — paleta editorială a site-ului:
 * fond crem, bară verde sus, citat în serif, atribuire, semnătura site-ului.
 * Generate la cerere și cache-uite de Next împreună cu pagina (ISR).
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const FOND = '#fbf7f1'
const VERDE = '#2f5c41'
const TEXT = '#1d1b18'
const TEXT_SURSE = '#4d4638'
const TEXT_SECUNDAR = '#79715f'
const HAIRLINE = '#e2d9c9'

/**
 * Crimson Pro (subsetat exact pe caracterele cardului, cu diacritice) —
 * fontul implicit al satori nu acoperă ș/ț. La eșec se randează cu fallback.
 */
const crimsonFont = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@500&text=${encodeURIComponent(text)}`,
      )
    ).text()
    const url = css.match(/url\((https:[^)]+)\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}

const raspuns = async (element: React.ReactElement, textFolosit: string) => {
  const font = await crimsonFont(textFolosit)
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts: font
      ? [{ name: 'Crimson Pro', data: font, weight: 500 as const, style: 'normal' as const }]
      : undefined,
  })
}

const trunchiat = (text: string, max: number): string => {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`
}

/** Cardul unui citat: ghilimea, textul, autorul, semnătura site-ului. */
export const citatOgImage = async (
  text: string,
  autor?: string | null,
): Promise<ImageResponse> => {
  const citat = trunchiat(text, 280)
  const marime = citat.length > 180 ? 44 : citat.length > 100 ? 52 : 60
  const tot = `„”—·${citat}${autor ?? ''}CITATE CREȘTINEcitatecrestine.ro`

  return raspuns(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: FOND,
        fontFamily: 'Crimson Pro, Georgia, serif',
      }}
    >
      <div style={{ height: 14, background: VERDE, display: 'flex' }} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 90px',
        }}
      >
        <div style={{ fontSize: 110, lineHeight: 0.6, color: VERDE, display: 'flex' }}>„</div>
        <div
          style={{
            fontSize: marime,
            lineHeight: 1.25,
            color: TEXT,
            marginTop: 24,
            display: 'flex',
          }}
        >
          {citat}
        </div>
        {autor && (
          <div
            style={{
              fontSize: 32,
              color: TEXT_SURSE,
              marginTop: 36,
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            — {autor}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '26px 90px',
          borderTop: `1px solid ${HAIRLINE}`,
          fontSize: 26,
          color: TEXT_SECUNDAR,
        }}
      >
        <div style={{ display: 'flex', letterSpacing: 3 }}>CITATE CREȘTINE</div>
        <div style={{ display: 'flex', color: VERDE }}>citatecrestine.ro</div>
      </div>
    </div>,
    tot,
  )
}

/** Cardul implicit al site-ului (homepage, liste, pagini fără card propriu). */
export const siteOgImage = async (): Promise<ImageResponse> => {
  const titlu = 'Citate creștine'
  const subtitlu = 'O antologie teologică în limba română'
  const tot = `„✠${titlu}${subtitlu}citatecrestine.ro`

  return raspuns(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: FOND,
        fontFamily: 'Crimson Pro, Georgia, serif',
      }}
    >
      <div style={{ height: 14, background: VERDE, display: 'flex' }} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 96, color: TEXT, display: 'flex' }}>{titlu}</div>
        <div style={{ fontSize: 36, color: TEXT_SECUNDAR, marginTop: 18, display: 'flex' }}>
          {subtitlu}
        </div>
        <div style={{ fontSize: 44, color: VERDE, marginTop: 40, display: 'flex' }}>✠</div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '26px 0',
          borderTop: `1px solid ${HAIRLINE}`,
          fontSize: 26,
          color: VERDE,
        }}
      >
        citatecrestine.ro
      </div>
    </div>,
    tot,
  )
}
