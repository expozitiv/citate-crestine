/** Navigația principală: Citate · Subiecte · Autori · Despre */
export const NAV_LINKS = [
  { href: '/', label: 'citate', key: 'citate' },
  { href: '/teme', label: 'subiecte', key: 'subiecte' },
  { href: '/autori', label: 'autori', key: 'autori' },
  { href: '/despre', label: 'despre', key: 'despre' },
] as const

export type NavKey = (typeof NAV_LINKS)[number]['key']
