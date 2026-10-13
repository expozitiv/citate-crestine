import type { CollectionConfig } from 'payload'

import { authenticatedOnly, publicRead } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Fișier media',
    plural: 'Media',
  },
  admin: {
    group: 'Administrare',
  },
  access: {
    // Fișierele (medalioanele autorilor) sunt servite prin /api/media/file/*,
    // care respectă acest `read` — blocarea lui ar rupe imaginile de pe site.
    read: publicRead,
    create: authenticatedOnly,
    update: authenticatedOnly,
    delete: authenticatedOnly,
  },
  upload: {
    // O singură variantă redimensionată (medalioanele se decupează prin CSS,
    // ca în machete) — evităm salvarea mai multor variante inutile.
    imageSizes: [
      {
        name: 'medalion',
        width: 480,
        withoutEnlargement: true,
      },
    ],
    mimeTypes: ['image/*'],
    staticDir: 'media',
    // Fișierele sunt servite prin /api/media/file/* (Payload citește din S3 la fiecare
    // cerere). Fără Cache-Control, CDN-ul Vercel nu le reține și fiecare afișare a unui
    // portret descarcă fișierul din Supabase (egress). Numele fișierelor sunt unice
    // (Payload adaugă sufix la coliziuni), deci cache-ul lung e sigur.
    modifyResponseHeaders: ({ headers }) => {
      headers.set(
        'Cache-Control',
        'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
      )
      return headers
    },
  },
  fields: [
    {
      name: 'alt',
      label: 'Text alternativ',
      type: 'text',
      required: true,
    },
  ],
}
