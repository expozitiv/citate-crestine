# citatecrestine.ro — Citate creștine

Site românesc de citate teologice curate (~22.000 de citate), asociat editurii
[MAGNA GRATIA](https://www.magnagratia.org/). O singură aplicație
**Next.js 16 + Payload CMS 3**, cu **PostgreSQL (Supabase)** și un singur deploy
pe **Vercel**.

Design-ul este contractual: vezi `design_handoff_citatecrestine/README.md` și
machetele (`citatecrestine-mock.html`). Orice abatere vizuală = bug.

## Arhitectură

| Componentă | Rol |
|---|---|
| Next.js (App Router, RSC) | frontend public, ISR, SEO |
| Payload CMS 3 | modele de date, admin (`/admin`), API (`/api`), autentificare, validări |
| Supabase PostgreSQL | baza de date (Payload gestionează schema) |
| Supabase Storage (S3) | imaginile autorilor (opțional; local `./media` în dev) |

Colecții: **Citate** (text, slug, autor, carte opțională, teme M:N, referință) ·
**Autori** (nume, slug, ani, descrieri, biografie, imagine, website) ·
**Cărți** (nume, slug, autor, URL extern, an, editură, nume complet) ·
**Teme** (nume, slug, descriere) · Media · Utilizatori.

Rute publice: `/` · `/[slug]` (pagina citatului, cu slug-uri rezervate protejate) ·
`/teme`, `/teme/[slug]`, `/teme/[slug]/pagina/[n]` · `/autori`, `/autori/[slug]`(+paginare) ·
`/carti`, `/carti/[slug]`(+paginare) · `/cautare` · `/despre` · `/contact` ·
`/sitemap.xml` (+`/sitemaps/[id]`) · `/robots.txt`.

### Performanță / cache

Paginile publice sunt statice cu ISR (revalidate 1h; homepage 10min pentru
citatul zilei). Orice modificare din Payload Admin invalidează tot cache-ul de
rute (`revalidatePath('/', 'layout')` din hook-urile colecțiilor) — predictibil
și corect pentru un site read-heavy cu modificări rare. Paginarea listelor este
pe segmente de rută (`/pagina/2`), nu pe query string, ca paginile să rămână
cache-uibile. Doar `/cautare` este dinamică.

### Căutare

PostgreSQL, prin câmpuri normalizate fără diacritice (`textNorm`, `numeNorm`),
întreținute automat din hook-uri — căutarea acoperă text, autor, carte și teme,
insensibilă la diacritice (ex. „sfintenia” găsește „sfințenia”). Fără servicii
externe.

## Dezvoltare locală

```bash
# 1. Postgres local
docker compose up -d

# 2. Variabile de mediu
cp .env.example .env   # completează PAYLOAD_SECRET etc.

# 3. Instalare + pornire
npm install
npm run dev            # http://localhost:3000, admin: /admin
```

La prima accesare a `/admin` creezi utilizatorul administrator. Schema DB este
gestionată de Payload (push automat în dev).

Date demo din machete (autori, cărți, teme, citate + portrete):

```bash
npm run seed:design
```

## Deploy (Vercel + Supabase — $0/lună)

1. **Supabase**: creează proiectul → copiază connection string-ul
   *Transaction pooler* (port 6543) → `DATABASE_URI`.
2. (Opțional, pentru imagini) Storage → creează un bucket public `media` →
   Project Settings → Storage → *S3 access keys* → completează `S3_*` în Vercel.
3. **Vercel**: importă repo-ul; setează env vars din `.env.example`
   (`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL=https://citatecrestine.ro`,
   `S3_*`). Build command implicit (`next build`).
4. Pentru producție, generează migrații în loc de push:
   `npx payload migrate:create` local → commit → `npx payload migrate` la deploy
   (sau lasă push-ul din dev să fi creat schema înainte de primul deploy).

## Backup

Independent de aplicație (pe lângă backup-urile Supabase):

```bash
npm run backup:db      # pg_dump → ./backups/citate-<timestamp>.dump
```

## Import (~22.000 citate) — pas următor

Conținutul brut există în `design_handoff_citatecrestine/content/`
(`spurgeon-quotes.txt` — ~5.000 de citate numerotate, cu marcaje de sursă `(1)`–`(10)`
și index tematic la final; `citate-batch2.txt` — 107 citate James Smith).
Mecanismul de import batch (idempotent, cu dedupe și raportare de erori) urmează
să fie implementat conform SPECIFICATII-TEHNICE.md — schema și relațiile sunt
deja pregătite pentru el.

## Scripturi

| Comandă | Rol |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run generate:types` | regenerare `src/payload-types.ts` |
| `npm run generate:importmap` | regenerare import map admin |
| `npm run seed:design` | date demo din machete |
| `npm run backup:db` | backup PostgreSQL |
| `node scripts/shot.mjs out.png URL [w] [h]` | screenshot pentru verificare vizuală |
