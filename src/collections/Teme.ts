import type { CollectionConfig } from 'payload'

import { revalidateContent } from '@/lib/revalidate'
import { normalize, slugify } from '@/lib/slug'
import { ensureUniqueSlug } from '@/lib/uniqueSlug'

import { authenticatedOnly, publicRead } from './access'

export const Teme: CollectionConfig = {
  slug: 'teme',
  labels: {
    singular: 'Temă',
    plural: 'Teme',
  },
  admin: {
    useAsTitle: 'nume',
    defaultColumns: ['nume', 'slug', 'updatedAt'],
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
          data.slug = await ensureUniqueSlug(req.payload, 'teme', base, originalDoc?.id)
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
        description: 'Se generează automat din nume. URL: /teme/[slug]',
      },
    },
    {
      name: 'descriere',
      label: 'Descriere',
      type: 'textarea',
      admin: {
        description: 'Opțional — afișată sub titlul temei.',
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
