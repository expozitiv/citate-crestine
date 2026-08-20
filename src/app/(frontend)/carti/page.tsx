import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { SiteHeader } from '@/components/SiteHeader'
import { getCarti, type AutorDoc } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Sursele antologiei',
  description: 'Cărțile și sursele din care sunt culese citatele antologiei Citate creștine.',
  alternates: { canonical: '/carti' },
}

export default async function PaginaCarti() {
  const carti = await getCarti()

  /* Grupate pe autor, ca în banda „Sursele antologiei”. */
  const grupuri = new Map<number, { autor: AutorDoc; carti: typeof carti }>()
  for (const carte of carti) {
    if (typeof carte.autor !== 'object') continue
    const g = grupuri.get(carte.autor.id) ?? { autor: carte.autor, carti: [] }
    g.carti.push(carte)
    grupuri.set(carte.autor.id, g)
  }

  return (
    <>
      <SiteHeader />
      <main>
        <div className="linie-hair">
          <section className="antet-pagina wrap">
            <h1 className="antet-pagina__titlu" style={{ margin: 0 }}>
              Sursele antologiei
            </h1>
            <div className="antet-pagina__descriere">
              Volumele din care sunt culese citatele — traduceri folosite cu permisiune.
            </div>
          </section>
        </div>

        <section className="continut-lista">
          {[...grupuri.values()].map(({ autor, carti: cartiAutor }, i) => (
            <React.Fragment key={autor.id}>
              {i > 0 && <div className="hairline-citat" style={{ margin: '34px 0' }} />}
              <div className="eticheta" style={{ marginBottom: 18 }}>
                {autor.nume.toLocaleUpperCase('ro')}
              </div>
              <div className="banda-surse__grid">
                {cartiAutor.map((carte) => {
                  const sufix = [carte.editura, carte.an].filter(Boolean).join(', ')
                  return (
                    <div key={carte.id}>
                      <Link href={`/carti/${carte.slug}`} className="link-carte">
                        {carte.numeComplet || carte.nume}
                      </Link>
                      {sufix ? `, ${sufix}` : ''}
                    </div>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
          {carti.length === 0 && (
            <p className="fara-rezultate">Nu există încă surse în antologie.</p>
          )}
        </section>
      </main>
    </>
  )
}
