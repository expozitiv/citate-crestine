/**
 * Seed cu datele din machetele de design — pentru verificarea vizuală
 * side-by-side cu citatecrestine-mock.html. Idempotent (rulabil repetat).
 *
 * Rulare: npx payload run scripts/seed.ts
 */
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const assets = path.resolve(dirname, '../design_handoff_citatecrestine/assets')

const payload = await getPayload({ config })

const gaseste = async <T extends 'autori' | 'carti' | 'citate' | 'teme'>(
  collection: T,
  where: Record<string, unknown>,
): Promise<{ id: number } | null> => {
  const res = await payload.find({
    collection,
    where: where as never,
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as { id: number } | undefined) ?? null
}

const media = async (fisier: string, alt: string): Promise<number | null> => {
  const existent = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt } },
    limit: 1,
    depth: 0,
  })
  if (existent.docs[0]) return existent.docs[0].id as number
  try {
    const doc = await payload.create({
      collection: 'media',
      filePath: path.join(assets, fisier),
      data: { alt },
    })
    return doc.id as number
  } catch (e) {
    console.warn(`Nu am putut încărca ${fisier}:`, (e as Error).message)
    return null
  }
}

/* --- Autori ------------------------------------------------------------ */

const portretSpurgeon = await media('spurgeon-portrait_orig.jpg', 'Charles H. Spurgeon')
const portretSmith = await media('smithjames.jpg', 'James Smith')

const autor = async (data: {
  nume: string
  ani?: string
  descriereScurta?: string
  descriere?: string
  imagine?: number | null
}): Promise<number> => {
  const existent = await gaseste('autori', { nume: { equals: data.nume } })
  if (existent) return existent.id
  const doc = await payload.create({
    collection: 'autori',
    data: { ...data, imagine: data.imagine ?? undefined },
  })
  return doc.id as number
}

const spurgeon = await autor({
  nume: 'Charles H. Spurgeon',
  ani: '1834–1892',
  descriereScurta: 'predicator baptist, Londra',
  descriere: '„prințul predicatorilor” · pastor al Metropolitan Tabernacle, Londra',
  imagine: portretSpurgeon,
})

const smith = await autor({
  nume: 'James Smith',
  ani: '1802–1862',
  descriereScurta: 'predicator baptist, Anglia',
  descriere: 'predicator baptist · predecesorul lui Spurgeon la New Park Street, Londra',
  imagine: portretSmith,
})

/* --- Cărți -------------------------------------------------------------- */

const carte = async (data: {
  nume: string
  autor: number
  editura?: string
  an?: number
  url?: string
  numeComplet?: string
}): Promise<number> => {
  const existent = await gaseste('carti', {
    and: [{ nume: { equals: data.nume } }, { autor: { equals: data.autor } }],
  })
  if (existent) return existent.id
  const doc = await payload.create({ collection: 'carti', data })
  return doc.id as number
}

const MG = 'MAGNA GRATIA'
const urlMG = 'https://www.magnagratia.org/'

const carti = {
  castigareaSufletelor: await carte({ nume: 'Câștigarea sufletelor', autor: spurgeon, editura: MG, an: 2016, url: urlMG }),
  caleaMantuirii: await carte({ nume: 'Calea mântuirii', autor: spurgeon, editura: MG, an: 2018, url: urlMG }),
  totulPrinHar: await carte({ nume: 'Totul prin har', autor: spurgeon, editura: MG, an: 2020, url: urlMG }),
  pasteMieluseii: await carte({ nume: 'Paște Mielușeii Mei!', autor: spurgeon, editura: MG, an: 2017, url: urlMG }),
  inainteaPortii: await carte({ nume: 'Înaintea porții strâmte', autor: spurgeon, editura: MG, an: 2017, url: urlMG }),
  peCaleaCredintei: await carte({ nume: 'Pe calea credinței', autor: spurgeon, editura: MG, an: 2020, url: urlMG }),
  bataliaFinala: await carte({ nume: 'Bătălia finală', autor: spurgeon, editura: MG, an: 2017, url: urlMG }),
  colectiaPredici: await carte({
    nume: 'Colecția de predici',
    autor: spurgeon,
    url: 'https://www.spurgeongems.org/',
    numeComplet: 'Charles Spurgeon Sermon Collection (63 vol.)',
  }),
  avertismentele: await carte({ nume: 'Avertismentele Evangheliei', autor: spurgeon, editura: MG, an: 2022, url: urlMG }),
  spurgeonsGold: await carte({ nume: 'Spurgeon’s Gold', autor: spurgeon, an: 1888, numeComplet: 'Spurgeon’s Gold, Washington D.C.' }),
  rouaDiminetii: await carte({
    nume: 'Roua dimineții',
    autor: smith,
    editura: MG,
    url: urlMG,
    numeComplet: 'Roua dimineții. Meditații devoționale în Evanghelie și umblarea cu Hristos',
  }),
}

/* --- Teme ---------------------------------------------------------------- */

const tema = async (nume: string, descriere?: string): Promise<number> => {
  const existent = await gaseste('teme', { nume: { equals: nume } })
  if (existent) return existent.id
  const doc = await payload.create({ collection: 'teme', data: { nume, descriere } })
  return doc.id as number
}

const teme = {
  harul: await tema('Harul'),
  credinta: await tema('Credința'),
  rugaciunea: await tema('Rugăciunea'),
  crucea: await tema('Crucea lui Hristos'),
  biblia: await tema('Biblia'),
  ascultarea: await tema('Ascultarea'),
  bucuria: await tema('Bucuria'),
  pocainta: await tema('Pocăința'),
  sfintenia: await tema('Sfințenia'),
  providenta: await tema('Providența'),
  incercarea: await tema('Încercarea'),
  darnicia: await tema('Dărnicia'),
  centralitatea: await tema('Centralitatea lui Hristos'),
  adevarul: await tema('Adevărul'),
  adorarea: await tema('Adorarea'),
}

/* --- Citate (din machete) ------------------------------------------------ */

const citat = async (data: {
  text: string
  autor: number
  carte?: number
  teme?: number[]
}): Promise<void> => {
  const existent = await gaseste('citate', { text: { equals: data.text } })
  if (existent) return
  await payload.create({ collection: 'citate', data })
}

await citat({
  text: 'Rugăciunea este gânguritul pruncului în credință, strigătul credinciosului în luptă și șoapta sfântului pe punctul de a adormi în Isus.',
  autor: spurgeon,
  carte: carti.spurgeonsGold,
  teme: [teme.rugaciunea, teme.credinta],
})
await citat({
  text: 'Harul este mama și doica sfințeniei — nu avocatul păcatului.',
  autor: spurgeon,
  carte: carti.totulPrinHar,
  teme: [teme.harul, teme.sfintenia],
})
await citat({
  text: 'Harul fără plată poate să se coboare în noroi și să scoată din el un mărgăritar.',
  autor: spurgeon,
  carte: carti.totulPrinHar,
  teme: [teme.harul],
})
await citat({
  text: 'Roțile providenței se rotesc, dar osia lor este dragostea veșnică.',
  autor: spurgeon,
  carte: carti.colectiaPredici,
  teme: [teme.providenta],
})
await citat({
  text: 'A crede în Dumnezeu când totul este lumină în jurul tău nu este mare lucru, dar a crede în El când treci prin întuneric, aceea este credința adevărată.',
  autor: spurgeon,
  carte: carti.peCaleaCredintei,
  teme: [teme.credinta],
})
await citat({
  text: 'Isus a mers în Ghetsimani pentru ca noi să nu mergem în Iad.',
  autor: smith,
  carte: carti.rouaDiminetii,
  teme: [teme.crucea],
})
await citat({
  text: 'Strâmtorarea poate fi aproape, dar tronul harului este și mai aproape.',
  autor: smith,
  carte: carti.rouaDiminetii,
  teme: [teme.incercarea],
})
await citat({
  text: 'Harul care nu îți schimbă viața nu îți va mântui sufletul.',
  autor: spurgeon,
  carte: carti.colectiaPredici,
  teme: [teme.harul],
})
await citat({
  text: 'Harurile nefolosite sunt ca parfumurile dulci care dorm în cupele florilor.',
  autor: spurgeon,
  carte: carti.spurgeonsGold,
  teme: [teme.harul],
})
await citat({
  text: 'Harul măreț și gândurile înălțătoare despre sine nu merg niciodată împreună.',
  autor: spurgeon,
  carte: carti.totulPrinHar,
  teme: [teme.harul],
})
await citat({
  text: 'Acea credință care nu se dovedește niciodată prin fapte bune este o credință moartă, care nu va mântui niciodată un suflet.',
  autor: spurgeon,
  carte: carti.caleaMantuirii,
  teme: [teme.credinta],
})
await citat({
  text: 'A dărui înseamnă a avea cu adevărat.',
  autor: spurgeon,
  carte: carti.colectiaPredici,
  teme: [teme.darnicia],
})
await citat({
  text: 'A fi păzit sfânt este mai bine decât a fi păzit teafăr.',
  autor: spurgeon,
  carte: carti.totulPrinHar,
  teme: [teme.sfintenia],
})
await citat({
  text: 'Absența lui Hristos este Iadul, dar prezența lui Isus este Raiul.',
  autor: spurgeon,
  carte: carti.colectiaPredici,
  teme: [teme.centralitatea],
})
await citat({
  text: 'Rugăciunea este autograful Duhului Sfânt pe inima înnoită.',
  autor: spurgeon,
  carte: carti.peCaleaCredintei,
  teme: [teme.rugaciunea],
})

console.log('Seed finalizat.')
process.exit(0)
