import { ImageResponse } from 'next/og'
import React from 'react'

import { crimsonFont } from './og'

/**
 * Iconițele site-ului (favicon 32×32, apple-icon 180×180): pătrat crem cu
 * ghilimeaua deschisă „ în verde — același motiv ca pe cardurile OG.
 * Generate de Next la build prin `src/app/icon.tsx` și `src/app/apple-icon.tsx`.
 */

const FOND = '#fbf7f1'
const VERDE = '#2f5c41'

export const iconImage = async (
  dim: number,
  reglaj: { scara?: number; ridicare?: number } = {},
): Promise<ImageResponse> => {
  const font = await crimsonFont('„')
  // Ghilimeaua jos-stânga e un glif mic, așezat sub linia de bază: o scalăm
  // peste cutie și o ridicăm, ca să umple optic pătratul.
  const scara = reglaj.scara ?? 2
  const ridicare = reglaj.ridicare ?? 0.7
  const marime = Math.round(dim * scara)
  const bara = dim >= 120 ? Math.round(dim * 0.07) : 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: FOND,
          fontFamily: 'Crimson Pro, Georgia, serif',
          overflow: 'hidden',
        }}
      >
        {bara > 0 && <div style={{ height: bara, background: VERDE, display: 'flex' }} />}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: VERDE,
            fontSize: marime,
            lineHeight: 1,
            marginTop: Math.round(-marime * ridicare),
          }}
        >
          „
        </div>
      </div>
    ),
    {
      width: dim,
      height: dim,
      fonts: font
        ? [{ name: 'Crimson Pro', data: font, weight: 500 as const, style: 'normal' as const }]
        : undefined,
    },
  )
}
