import type { CollectionConfig } from 'payload'

import { revalidateContent } from '@/lib/revalidate'
import { normalize, quoteSlug, slugify } from '@/lib/slug'
import { ensureUniqueSlug } from '@/lib/uniqueSlug'

import { authenticatedOnly } from './access'

export const Citate: CollectionConfig = {
  slug: 'citate',
  labels: {
    singular: 'Citat',
    plural: 'Citate',
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'autor', 'carte', 'teme', 'updatedAt'],
    listSearchableFields: ['text', 'slug', 'textNorm'],
    group: 'Antologie',
    pagination: {
      defaultLimit: 25,
    },
  },
  access: {
    read: authenticatedOnly,
    create: authenticatedOnly,
    update: authenticatedOnly,
    delete: authenticatedOnly,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data
        if (data.text) {
          data.text = data.text.replace(/\s+/g, ' ').trim()
          data.textNorm = normalize(data.text)
        }
        if (operation === 'create' || (data.slug !== undefined && !data.slug)) {
          const base = data.slug ? slugify(data.slug) : quoteSlug(data.text || '')
          data.slug = await ensureUniqueSlug(req.payload, 'citate', base, originalDoc?.id)
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
      name: 'text',
      label: 'Textul citatului',
      type: 'textarea',
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
        description: 'Se generează automat din text. URL: /[slug]',
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
      name: 'carte',
      label: 'Carte (sursă)',
      type: 'relationship',
      relationTo: 'carti',
      index: true,
      admin: {
        description: 'Opțional — sursa citatului. Lista se filtrează după autorul selectat.',
      },
      // Backoffice: după selectarea autorului se pot alege doar cărțile lui.
      filterOptions: ({ siblingData }) => {
        const autor = (siblingData as { autor?: number | string })?.autor
        if (autor) {
          return { autor: { equals: autor } }
        }
        return true
      },
    },
    {
      name: 'teme',
      label: 'Teme',
      type: 'relationship',
      relationTo: 'teme',
      hasMany: true,
      index: true,
    },
    {
      name: 'referinta',
      label: 'Pagină / referință în carte',
      type: 'text',
    },
    {
      name: 'textNorm',
      type: 'textarea',
      index: true,
      admin: {
        hidden: true,
      },
    },
  ],
}
