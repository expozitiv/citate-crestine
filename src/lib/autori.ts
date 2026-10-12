/**
 * Indexarea autorilor după numele de familie, ca într-o antologie tipărită:
 * „Charles H. Spurgeon” → familie „Spurgeon”, afișat „Spurgeon, Charles H.”, litera „S”.
 */
import { normalize } from './slug'

const SUFIXE = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii'])

/** Nume colective (organizații), care nu se inversează. */
const esteColectiv = (nume: string): boolean => /ministries|institute|seminary|biseric/i.test(nume)

export const numeDeFamilie = (nume: string): string => {
  const curat = nume.trim()
  if (esteColectiv(curat)) return curat
  const parti = curat.split(/\s+/)
  let i = parti.length - 1
  while (i > 0 && SUFIXE.has(parti[i].toLowerCase())) i--
  return parti[i]
}

/** „Spurgeon, Charles H.” — forma de index. Numele colective rămân neschimbate. */
export const numeIndex = (nume: string): string => {
  const familie = numeDeFamilie(nume)
  if (familie === nume.trim()) return familie
  const parti = nume.trim().split(/\s+/)
  const idx = parti.lastIndexOf(familie)
  const rest = [...parti.slice(0, idx), ...parti.slice(idx + 1)].join(' ')
  return rest ? `${familie}, ${rest}` : familie
}

/** Litera de secțiune în index (fără diacritice, majusculă). */
export const literaAutor = (nume: string): string =>
  normalize(numeDeFamilie(nume)).charAt(0).toLocaleUpperCase('ro')

/** Cheie de sortare: familie, apoi restul numelui. */
export const cheieSortare = (nume: string): string => normalize(numeIndex(nume))

export const sorteazaDupaFamilie = <T extends { nume: string }>(autori: T[]): T[] =>
  [...autori].sort((a, b) => cheieSortare(a.nume).localeCompare(cheieSortare(b.nume), 'ro'))
