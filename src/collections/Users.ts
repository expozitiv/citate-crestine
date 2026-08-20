import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Utilizator',
    plural: 'Utilizatori',
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Administrare',
  },
  access: {
    // Doar utilizatorii autentificați pot gestiona conturile.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'nume',
      label: 'Nume',
      type: 'text',
    },
  ],
}
