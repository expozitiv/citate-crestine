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
