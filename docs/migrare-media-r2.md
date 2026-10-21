# Audit: mutarea imaginilor din Supabase Storage în Cloudflare R2

Stare: propunere (branch `audit/media-r2`). Codul din branch nu schimbă nimic în producție
până nu se setează variabilele de mediu descrise mai jos.

## 1. Cum se servesc imaginile azi

```
browser ──> citatecrestine.ro/api/media/file/<fișier>   (src-ul <img> din HTML-ul ISR)
              │
              ├─ HIT în CDN-ul Vercel ──> răspuns din cache (fără cost Supabase)
              │
              └─ MISS ──> funcția Vercel (Payload, storage-s3 getFile)
                            ├─ HeadObject  pe Supabase  (operație, nu egress)
                            └─ GetObject   pe Supabase  ──> EGRESS contorizat
```

- `src/payload.config.ts`: `s3Storage({ collections: { media: true } })`, fără
  `generateFileURL` / `disablePayloadAccessControl` → `media.url` este mereu
  `/api/media/file/<filename>`, adică **orice imagine trece prin Vercel**.
- `src/collections/Media.ts`: din 13 oct (`e0ef171`) răspunsul are
  `s-maxage=31536000`, deci CDN-ul Vercel ar trebui să rețină fișierele.
- Fișierele: un portret per autor, în două variante (originalul + `medalion` 480 px),
  ~15–35 KB fiecare → tot bucket-ul are probabil sub 10 MB.

## 2. De unde poate veni egress-ul „aiurea”

Ordonate după cât de probabil contează:

1. **Egress-ul bazei de date, nu al imaginilor.** Supabase pune la „Egress” și traficul
   Postgres → Vercel. Fiecare regenerare ISR (≈25.000 de pagini; citatul cu `depth: 2`,
   listele cu `depth: 1`, sitemap-urile, `getTemePopulare` cu `pagination: false`) trage date
   din bază. Dacă acesta domină, mutarea imaginilor în R2 **nu** scade semnificativ factura.
   → De verificat primul (vezi §3).
2. **Miss-uri în CDN-ul Vercel.** Cache-ul e per regiune și, pentru răspunsurile funcțiilor,
   legat de deployment: după fiecare deploy, fiecare portret se descarcă din nou din Supabase,
   în fiecare regiune în care e cerut. Cu multe deploy-uri pe zi și trafic de boți din multe
   regiuni, asta se adună (dar rămâne mic dacă bucket-ul are ~10 MB).
3. **Istoric dinaintea cache-ului.** Până pe 13 oct nu exista `Cache-Control` → fiecare
   afișare a unui portret era egress. Dacă ciclul de facturare include zilele dinainte,
   cifra curentă e umflată de perioada aceea și va scădea oricum.
4. **Admin-ul** (lista Media cu miniaturi) și scripturile locale (`import-portrete`, backup) —
   marginal.

Estimare de ordin de mărime: chiar și 1.000 de miss-uri complete pe zi × ~30 KB ≈ 1 GB/lună.
Planul gratuit Supabase include 5 GB egress. Dacă vezi mult peste, sursa e aproape sigur (1)
sau cache-ul nu funcționează (verificabil cu `x-vercel-cache`, §3).

**Oricum**, mutarea în R2 merită: egress-ul R2 e gratuit, imaginile ies complet din calea
funcției Vercel (mai puține invocări, mai puțin „Fast Data Transfer”) și Supabase rămâne doar
bază de date.

## 3. Faza 0 — măsurare (înainte de orice)

- Supabase → *Organization → Usage → Egress*: împărțirea pe **Database / Storage / Cached**.
- Vercel → *Observability*: invocări pe `/api/media/file/[...]` și rata de cache.
- Test rapid (de 2 ori la rând):
  ```bash
  curl -sI https://citatecrestine.ro/api/media/file/<un-fisier>-480x480.jpg | grep -i 'x-vercel-cache\|cache-control'
  ```
  A doua oară trebuie `x-vercel-cache: HIT`. Dacă e mereu `MISS`, cache-ul nu prinde și
  asta e cauza; R2 o rezolvă oricum.

## 4. Planul fără întrerupere

Principiul: **Payload găsește fișierele după `filename`, nu după URL** (URL-ul e calculat la
citire, în hook-ul `afterRead`). Deci: copiem obiectele cu aceleași chei, schimbăm bucket-ul din
spatele adaptorului, iar ruta `/api/media/file/*` continuă să funcționeze pentru HTML-ul ISR
deja generat (care poate trăi până la 30 de zile). Nicio migrare de bază de date.

### Faza 1 — pregătire în Cloudflare (impact: zero)

1. R2 → *Create bucket* `citate-crestine-media` (separat de bucket-ul privat al media kit-ului).
2. Bucket → *Settings → Custom Domains* → `media.citatecrestine.ro`.
   Necesită ca zona `citatecrestine.ro` să fie în același cont Cloudflare (DNS la Cloudflare).
   Nu folosi `r2.dev` în producție (e limitat ca rată și fără cache CDN).
3. *Caching → Cache Rules* pentru `media.citatecrestine.ro`: *Eligible for cache*,
   Edge TTL 1 an, Browser TTL 1 an. (Fișierele încărcate din Payload nu primesc
   `Cache-Control` de la adaptor; regula acoperă asta. Numele sunt unice → sigur.)
4. R2 → *Manage API tokens* → token **Object Read & Write** limitat la `citate-crestine-media`.

### Faza 2 — copiere (impact: zero)

Pune în `.env` local cheile Supabase actuale ca `SUPABASE_S3_*` și cele noi ca `R2_MEDIA_*`
(lista exactă e în antetul `scripts/migrare-media-r2.mjs`), apoi:

```bash
npm run migrare:media-r2                          # dry-run: ce ar copia
MIGRARE_CONFIRM=1 npm run migrare:media-r2        # copiere (idempotent, cu verificare de mărime)
MIGRARE_VERIFICA=1 npm run migrare:media-r2       # trebuie să spună „OK — R2 conține tot.”
curl -sI https://media.citatecrestine.ro/<un-fisier>.jpg   # 200, cf-cache-status la a doua cerere: HIT
```

Din acest moment: **nu se încarcă portrete noi** până după Faza 3 (sau rulezi copierea din nou
imediat după comutare — scriptul copiază doar ce lipsește).

### Faza 3 — comutarea adaptorului (impact: zero; fără cod)

În Vercel → *Environment Variables (Production)*:

| Variabilă | Valoare nouă |
|---|---|
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | `citate-crestine-media` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | tokenul R2 din Faza 1 |

Redeploy. Vercel mută traficul pe noul deployment doar după build reușit → nu există moment
fără imagini. Toate URL-urile `/api/media/file/*` (din orice pagină, veche sau nouă) citesc de
acum din R2. **Egress-ul Storage în Supabase devine 0.**

Apoi: `MIGRARE_VERIFICA=1 npm run migrare:media-r2` (ar trebui să nu lipsească nimic) și un test
în admin: încarcă o imagine de probă, verifică că apare, șterge-o.

Notă: adaptorul trimite `ACL` doar dacă opțiunea `acl` e setată — nu e, deci e compatibil R2.
`forcePathStyle: true` funcționează și cu R2.

### Faza 4 — URL-uri directe (merge branch + `MEDIA_PUBLIC_URL`)

Merge `audit/media-r2`, apoi în Vercel `MEDIA_PUBLIC_URL=https://media.citatecrestine.ro` și
redeploy. Efect:

- paginile randate de acum înainte au `src="https://media.citatecrestine.ro/..."` —
  servite de CDN-ul Cloudflare, fără funcție Vercel;
- paginile ISR randate înainte păstrează `/api/media/file/*`, care rămâne activ (din R2) —
  se actualizează singure la regenerarea naturală, în ≤ 30 de zile;
- **nu** rula revalidarea globală doar pentru asta (≈25.000 ISR Writes); opțional, revalidează
  țintit homepage-ul și paginile de autor.

Fazele 3 și 4 se pot face într-un singur deploy; separat e mai ușor de dat înapoi.

### Faza 5 — curățenie (după ≥ 35 de zile)

- Toate paginile au URL-urile noi → ruta `/api/media/file/*` mai primește doar trafic rezidual.
- Bucket-ul Supabase se păstrează câteva săptămâni ca backup (stocarea fără citiri nu face
  egress), apoi se șterge, împreună cu cheile S3 Supabase.
- `README.md`, `.env.example`: Supabase Storage → R2. `next.config.mjs`: `remotePatterns`
  pentru `**.supabase.co` nu mai e necesar (site-ul folosește `<img>`, nu `next/image`).

## 5. Revenire (rollback)

| După faza | Cum revii | Pierderi |
|---|---|---|
| 1–2 | nimic de făcut | — |
| 3 | variabilele `S3_*` înapoi la Supabase + redeploy | portretele încărcate după comutare există doar în R2 → copiere inversă (scriptul, cu sursa/destinația inversate) |
| 4 | șterge `MEDIA_PUBLIC_URL` + redeploy | — (`/api/media/file/*` funcționează oricând) |

## 6. Riscuri și verificări

- **Fereastra copiere → comutare**: un upload în acest interval ajunge doar în Supabase.
  Mitigare: fără upload-uri în fereastră + a doua rulare a scriptului după comutare.
- **Nume cu caractere speciale**: `generateFileURL` codifică numele (`encodeURIComponent`);
  testează un fișier cu spațiu/diacritice după Faza 4.
- **Admin**: miniaturile din Media vor veni de pe `media.citatecrestine.ro`; Payload nu are CSP
  implicit, deci se încarcă fără configurare.
- **Ștergere din admin**: după Faza 3 șterge din R2 (corect); Supabase nu mai e atins.
- **Limite R2 gratuite**: 10 GB stocare, 1M operații clasa A, 10M clasa B / lună, egress
  gratuit — cu ~10 MB și trafic CDN, practic 0 $.
- **Dev local**: fără `S3_*`, Payload folosește `./media` ca înainte; `MEDIA_PUBLIC_URL` are
  efect doar când adaptorul S3 e activ.

## 7. Ce conține branch-ul

- `src/payload.config.ts` — `MEDIA_PUBLIC_URL` opțional → `generateFileURL` (URL direct);
  fără variabilă, comportament identic cu acum.
- `scripts/migrare-media-r2.mjs` (`npm run migrare:media-r2`) — copiere Supabase → R2,
  idempotentă, cu dry-run și verificare; setează `Cache-Control: immutable` pe obiectele copiate.
- `.env.example` — `MEDIA_PUBLIC_URL`.
