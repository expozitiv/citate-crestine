import type { CollectionConfig } from 'payload'

import { revalidateContent } from '@/lib/revalidate'
import { normalize, slugify } from '@/lib/slug'
import { ensureUniqueSlug } from '@/lib/uniqueSlug'

import { authenticatedOnly, publicRead } from './access'

export const Carti: CollectionConfig = {
  slug: 'carti',
  labels: {
    singular: 'Carte',
    plural: 'Cărți',
  },
  admin: {
    useAsTitle: 'nume',
    defaultColumns: ['nume', 'autor', 'an', 'editura', 'updatedAt'],
    listSearchableFields: ['nume', 'slug'],
    group: 'Antologie',
  },
  access: {
    read: publicRead,
    create: authenticatedOnly,
    update: authenticatedOnly,
    delete: authenticatedOnly,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data
        if (data.nume) {
          data.numeNorm = normalize(data.nume)
        }
        if (operation === 'create' || (data.slug !== undefined && !data.slug)) {
          const base = data.slug ? slugify(data.slug) : slugify(data.nume || '')
          data.slug = await ensureUniqueSlug(req.payload, 'carti', base, originalDoc?.id)
        } else if (data.slug) {
          data.slug = slugify(data.slug)
        }
        return data
      },
    ],
    afterChange: [() => revalidateContent()],
    afterDelete: [() => revalidateContent()],
  },
  fields: [
    {
      name: 'nume',
      label: 'Nume',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Se generează automat din nume. URL: /carti/[slug]',
      },
    },
    {
      name: 'autor',
      label: 'Autor',
      type: 'relationship',
      relationTo: 'autori',
      required: true,
      index: true,
    },
    {
      name: 'url',
      label: 'URL extern',
      type: 'text',
      admin: {
        description:
          'Link către pagina cărții la editură (ex. magnagratia.org) sau către sursa externă (ex. spurgeongems.org). Afișat pe pagina cărții.',
      },
    },
    {
      name: 'an',
      label: 'Anul apariției',
      type: 'number',
      admin: {
        description: 'Afișat în atribuiri: „Totul prin har, 2020”',
      },
    },
    {
      name: 'editura',
      label: 'Editura',
      type: 'text',
      admin: {
        description: 'Ex. MAGNA GRATIA — afișat pe pagina citatului: „din volumul …, MAGNA GRATIA, 2020”',
      },
    },
    {
      name: 'numeComplet',
      label: 'Nume complet (lista surselor)',
      type: 'text',
      admin: {
        description:
          'Opțional — titlul complet afișat în banda „Sursele antologiei” (ex. „Roua dimineții. Meditații devoționale…”).',
      },
    },
    {
      name: 'numeNorm',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
      },
    },
  ],
}
