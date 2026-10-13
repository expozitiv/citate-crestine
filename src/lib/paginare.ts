/**
 * Câte citate pe pagină în listele publice (temă, autor, carte, căutare).
 * Ținut separat de `data.ts` ca să poată fi importat și din hook-urile
 * colecțiilor (via `revalidate.ts`) fără a trage `@payload-config` în ciclu.
 */
export const PAGE_SIZE = 20
