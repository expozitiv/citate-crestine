import { revalidatePath } from 'next/cache'

/**
 * Strategie de cache predictibilă (vezi SPECIFICATII-TEHNICE.md / Performanță):
 * paginile publice sunt statice cu ISR (revalidate la nivel de pagină), iar
 * orice modificare din Payload Admin (create/update/delete pe orice colecție
 * de conținut) invalidează întregul cache de rute. Site-ul e read-heavy cu
 * modificări rare, deci invalidarea globală e simplă, ieftină și corectă.
 */
export const revalidateContent = (): void => {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // În afara runtime-ului Next (ex. scripturi `payload run`) nu există cache de invalidat.
  }
}
