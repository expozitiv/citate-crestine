'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import React from 'react'

/**
 * Vercel Web Analytics — doar pe site-ul public. Trimite date numai pe
 * deploy-urile de pe Vercel cu Web Analytics activat; pe `next dev` nu face nimic.
 * `beforeSend` elimină vizualizările paginilor de administrare / API, în caz că
 * sunt deschise pe domeniul public. (Componentă client: `beforeSend` e o funcție
 * și nu poate fi pasată dintr-un Server Component.)
 */
const faraAdmin = (event: BeforeSendEvent): BeforeSendEvent | null => {
  const { pathname } = new URL(event.url)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) return null
  return event
}

export const VercelAnalytics = () => <Analytics beforeSend={faraAdmin} />
