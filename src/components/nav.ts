/** Navigația principală: Citate · Subiecte · Autori · Despre · Susține (extern) */
export const NAV_LINKS = [
  { href: '/', label: 'citate', key: 'citate', extern: false },
  { href: '/teme', label: 'subiecte', key: 'subiecte', extern: false },
  { href: '/autori', label: 'autori', key: 'autori', extern: false },
  { href: '/despre', label: 'despre', key: 'despre', extern: false },
  { href: 'https://www.magnagratia.org/donatii', label: 'susține', key: 'sustine', extern: true },
] as const

export type NavKey = (typeof NAV_LINKS)[number]['key']

/**
 * Atributele comune pentru un link de meniu: extern → tab nou + clasa
 * `nav-sustine` (accent auriu discret, separat de restul navigației).
 */
export const navLinkProps = (l: (typeof NAV_LINKS)[number], className?: string) => ({
  className: [className, l.extern ? 'nav-sustine' : undefined].filter(Boolean).join(' ') || undefined,
  ...(l.extern ? { target: '_blank', rel: 'noopener' } : {}),
})
