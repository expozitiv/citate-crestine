# Studiu: egress-ul bazei de date (Supabase „Shared Pooler Egress”)

Data: 21 oct 2026 · branch `perf/egress-db`

## 1. Concluzia pe scurt

| | Înainte | După (branch) | Scădere |
|---|---:|---:|---:|
| O trecere completă a crawlerelor (toate paginile ISR regenerate) | **1,39 GB** | **0,34 GB** | **−76%** |
| Pagina unui citat (22.000 de pagini) | 22,2 KB | 7,9 KB | −65% |
| Pagina unui autor (1.312 pagini, cu paginare) | 551 KB | 62 KB | −89% |
| Pagina unei teme (2.311) | 62,7 KB | 29,8 KB | −52% |
| Pagina unei cărți (1.872) | 18,2 KB | 6,5 KB | −64% |
| Homepage | 97,8 KB | 22,9 KB | −77% |

Paginile rămân identice: am randat cu `master` și cu branch-ul aceleași 11 pagini (home,
citat, autor + paginare, carte, temă + paginare, cele trei indexuri, căutare) și am comparat
HTML-ul. Nu există nicio diferență.

**Proiecție pe consumul real.** În graficul Supabase, 14–20 oct au avut în medie ~200 MB/zi
(~6 GB/lună, peste cei 5 GB incluși în planul Free). Cu −76%, consumul ar ajunge la
**~50 MB/zi, adică ~1,5 GB/lună**. Vârful din 13 oct (1,56 GB) corespunde aproape exact unei
treceri complete măsurate aici (1,39 GB). Asta confirmă modelul: ziua aceea a regenerat
practic tot site-ul.

## 2. De ce 50 MB de date pot face gigaocteți de egress

Egress-ul nu depinde de mărimea bazei de date. Depinde de câte octeți trimite baza pentru
fiecare regenerare de pagină, înmulțit cu numărul de regenerări. Paginile citatelor se
generează la prima vizită (`generateStaticParams` → `[]`). După fiecare deploy, cache-ul ISR
pornește gol, iar crawlerele (Google, Bing, boții AI) regenerează pagină cu pagină cele
~27.500 de pagini.

## 3. Metoda

- Postgres 16 local, cu schema creată de Payload și date sintetice de mărimea bazei reale
  (47 MB): 22.000 de citate de ~280 de caractere, 450 de autori (descriere ~350 de caractere,
  30% cu biografie de ~1.200), 1.800 de cărți, 250 de teme, 1–3 teme pe citat. Distribuția
  citatelor pe autori și teme e inegală, ca în realitate (câțiva autori au mii de citate).
- Un proxy TCP între Payload și Postgres numără octeții trimiși de server. Sunt aceiași octeți
  pe care Supabase îi contorizează ca „Shared Pooler Egress”; Supabase mai adaugă câteva
  procente pentru TLS.
- Pentru fiecare tip de pagină, scriptul rulează exact apelurile din ruta reală, inclusiv
  `generateMetadata`, și face media pe un eșantion de documente.
  Scriptul este `scripts/egress/masurare.ts`.

## 4. Unde se duceau octeții

1. **Pagina de autor: 551 KB.** `getAutoriCuNumar()` (indexul A–Z și „Alți autori”) citea
   toți autorii cu `depth: 1`: biografii, descrieri și documentul Media al portretului. Lista e
   aceeași pe toate cele 1.312 pagini de autor, dar se citea complet pe fiecare. Asta înseamnă
   **723 MB dintr-o trecere de 1,39 GB**, adică jumătate din tot egress-ul.
2. **Autorul atașat fiecărui citat era adus complet,** cu biografie și descriere, deși
   pagina afișează doar numele, anii și descrierea scurtă. La fel cartea și temele (cu
   descrierea temei).
3. **Listele aduceau tot citatul,** inclusiv `textNorm`, o a doua copie a textului folosită
   doar la căutare.
4. **Homepage-ul** citea toate temele cu descriere, pentru banda „Subiecte”.
5. **`generateMetadata` și pagina citeau același document de două ori.**

## 5. Ce face branch-ul `perf/egress-db`

| Schimbare | Fișier | Efect măsurat |
|---|---|---|
| `defaultPopulate`: un autor, o carte sau o temă atașată aduce doar câmpurile afișate | `src/collections/Autori.ts`, `Carti.ts`, `Teme.ts` | trecere completă 1.391 → 1.074 MB |
| Indexul de autori cu `depth: 0` și doar nume/slug/ani | `src/lib/data.ts` (`getAutori`) | autor 541 → 63 KB |
| `select` pe listele de citate (fără `textNorm` și câmpuri neafișate) | `src/lib/data.ts` | liste −15…−30% |
| Temele din index/homepage doar cu nume și slug | `src/lib/data.ts` (`getTemeCuNumar`) | homepage 85 → 23 KB |
| `cache()` din React pe `get…BySlug` (metadata și pagina împart interogarea) | `src/lib/data.ts` | citat 10,4 → 7,9 KB |

Pagina autorului, a cărții și a temei își citesc în continuare documentul propriu complet.
Interfața de admin nu e afectată: `defaultPopulate` se aplică doar la relațiile populate.

## 6. Ce mai rămâne, cu estimări

| Pas următor | Câștig estimat pe o trecere | Cost / risc |
|---|---:|---|
| Lista tuturor autorilor (44 KB) pusă în cache-ul de date Next (`unstable_cache` + tag invalidat la salvarea unui autor sau citat): se citește o dată, nu pe fiecare pagină de autor | −58 MB (335 → ~277 MB, total −80%) | mic; e nevoie de invalidare în `revalidate.ts` |
| Paginile de temă: Payload citește `text_norm` de două ori în interogarea cu join (sortare după text). O coloană scurtă de sortare ar elimina ~12 KB pe pagină | ~−28 MB | schimbare de schemă + backfill |
| **Mai puține deploy-uri în producție** (grupate sau verificate întâi pe preview) | fiecare deploy evitat economisește până la o trecere (0,34 GB după optimizări, 1,39 GB înainte) | doar disciplină de lucru |
| Sitemap-urile de citate (5 × 0,5 MB/zi) cu revalidare la 7 zile în loc de 1 | ~−60 MB/lună | Google vede citatele noi cu câteva zile întârziere |

## 7. Limitele studiului

- Datele sunt sintetice. Dacă biografiile reale sunt mai lungi sau există mai mulți autori,
  câștigul real e **mai mare** (exact acele câmpuri au fost eliminate). Pentru calibrare,
  rulează în Supabase → SQL Editor:
  ```sql
  select (select count(*) from autori) autori, (select count(*) from carti) carti,
         (select count(*) from teme) teme, (select count(*) from citate) citate,
         (select avg(length(coalesce(biografie,'')))::int from autori) bio_medie,
         (select avg(length(coalesce(descriere,'')))::int from autori) descriere_medie,
         (select avg(length(text))::int from citate) text_mediu;
  ```
- Pentru o măsurătoare pe datele reale: `npm run backup:db` → restaurare într-un Postgres
  local → `DATABASE_URI=<local> DEDUP=1 npx payload run scripts/egress/masurare.ts`.
- Nu am modelat câte pagini regenerează crawlerele pe zi; proiecția presupune că mixul de
  pagini rămâne cel de acum. Scăderea procentuală se aplică oricum la fel.
