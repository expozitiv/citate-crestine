import type { CollectionConfig } from 'payload'

import { revalidateContent } from '@/lib/revalidate'
import { normalize, slugify } from '@/lib/slug'
import { ensureUniqueSlug } from '@/lib/uniqueSlug'

import { authenticatedOnly, publicRead } from './access'

export const Autori: CollectionConfig = {
  slug: 'autori',
  labels: {
    singular: 'Autor',
    plural: 'Autori',
  },
  admin: {
    useAsTitle: 'nume',
    defaultColumns: ['nume', 'ani', 'slug', 'updatedAt'],
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
          data.slug = await ensureUniqueSlug(req.payload, 'autori', base, originalDoc?.id)
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
        description: 'Se generează automat din nume. URL: /autori/[slug]',
      },
    },
    {
      name: 'ani',
      label: 'Ani (ex. 1834–1892)',
      type: 'text',
      admin: {
        description: 'Afișat lângă descrieri: „1834–1892 · …”',
      },
    },
    {
      name: 'descriereScurta',
      label: 'Descriere scurtă',
      type: 'text',
      admin: {
        description: 'Pe pagina citatului: ex. „predicator baptist, Londra”',
      },
    },
    {
      name: 'descriere',
      label: 'Descriere (pagina autorului)',
      type: 'text',
      admin: {
        description: 'Ex. „«prințul predicatorilor» · pastor al Metropolitan Tabernacle, Londra”',
      },
    },
    {
      name: 'biografie',
      label: 'Biografie',
      type: 'textarea',
    },
    {
      name: 'imagine',
      label: 'Imagine (portret)',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'website',
      label: 'Website / URL',
      type: 'text',
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
