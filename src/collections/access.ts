import type { Access } from 'payload'

/** Conținutul public poate fi citit fără autentificare. */
export const publicRead: Access = () => true

/** Create/update/delete doar pentru utilizatorii autentificați din Payload. */
export const authenticatedOnly: Access = ({ req: { user } }) => Boolean(user)
