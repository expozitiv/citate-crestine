import type { Payload } from 'payload'

import { RESERVED_SLUGS } from './slug'

/**
 * Garantează unicitatea unui slug într-o colecție: dacă slug-ul de bază e
 * ocupat (sau rezervat de o rută statică), adaugă un sufix numeric (-2, -3…).
 */
export const ensureUniqueSlug = async (
  payload: Payload,
  collection: 'autori' | 'carti' | 'citate' | 'teme',
  base: string,
  currentId?: number | string,
): Promise<string> => {
  const clean = base || 'fara-titlu'
  let candidate = RESERVED_SLUGS.has(clean) ? `${clean}-1` : clean
  let suffix = 2

  for (;;) {
    const existing = await payload.find({
      collection,
      where: {
        and: [
          { slug: { equals: candidate } },
          ...(currentId ? [{ id: { not_equals: currentId } }] : []),
        ],
      },
      limit: 1,
      depth: 0,
      select: {},
    })
    if (existing.totalDocs === 0) return candidate
    candidate = `${clean}-${suffix}`
    suffix += 1
  }
}
