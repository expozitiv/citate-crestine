import type { AutorDoc, CarteDoc, CitatDoc, MediaDoc, TemaDoc } from './data'

/** „5.001” — separator de mii românesc. */
export const numarRo = (n: number): string => new Intl.NumberFormat('ro-RO').format(n)

/** „MARȚI, 18 AUGUST 2026” — banda meta de pe homepage. */
export const dataLunga = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('ro-RO', {
    timeZone: 'Europe/Bucharest',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase()

/** „18 AUGUST” — eticheta „CITATUL ZILEI · 18 AUGUST”. */
export const dataScurta = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'long',
  })
    .format(date)
    .toUpperCase()

export const autorDoc = (citat: CitatDoc): AutorDoc | null =>
  typeof citat.autor === 'object' ? citat.autor : null

export const carteDoc = (citat: CitatDoc): CarteDoc | null =>
  citat.carte && typeof citat.carte === 'object' ? citat.carte : null

export const temeDocs = (citat: CitatDoc): TemaDoc[] =>
  (citat.teme ?? []).filter((t): t is TemaDoc => typeof t === 'object')

export const imagineUrl = (imagine: AutorDoc['imagine']): string | null => {
  if (!imagine || typeof imagine !== 'object') return null
  const media = imagine as MediaDoc
  return media.sizes?.medalion?.url || media.url || null
}
