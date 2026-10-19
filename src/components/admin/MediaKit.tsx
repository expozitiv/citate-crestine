import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { CHEIE_MEDIA_KIT, infoFisierR2 } from '@/lib/r2'

/**
 * Media kit-ul — pagină proprie în admin (/admin/media-kit), lângă Manualul editorului.
 * Arhiva stă în bucket-ul R2 privat; butonul trece prin /api/admin/media-kit, care
 * verifică sesiunea și redirecționează către un URL semnat. Stiluri: .cc-dash + .cc-man.
 */

const dataRo = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

const marimeRo = (octeti: number): string =>
  `${new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 1 }).format(octeti / 1024 / 1024)} MB`

export async function MediaKit({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) {
    redirect(`${req.payload.config.routes.admin}/login`)
  }

  const info = await infoFisierR2(CHEIE_MEDIA_KIT)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div className="cc-dash cc-man">
        <header className="cc-dash__antet">
          <p className="cc-dash__eticheta">Citate creștine — panou de administrare</p>
          <h1 className="cc-dash__titlu">Media kit</h1>
          <p className="cc-dash__subtitlu">
            Identitatea vizuală Citate creștine (Magna Gratia), pentru rețelele sociale, parteneri
            și materiale de prezentare. Uz intern — nu distribui arhiva public.
          </p>
          <div className="cc-dash__filet" aria-hidden="true" />
        </header>

        <article className="cc-man__continut">
          <section>
            <h2>Ce conține arhiva</h2>
            <ul>
              <li>
                <strong>Citește-mă</strong> (PDF) — ghidul scurt de folosire a materialelor.
              </li>
              <li>
                <strong>Brandbook</strong> (PDF) — logo, culori, tipografie și regulile de
                folosire.
              </li>
              <li>
                <strong>Imagini pentru rețele</strong> — avatar (luminos / verde), copertă
                Facebook, imaginea de previzualizare a linkurilor (1200×630).
              </li>
              <li>
                <strong>Șabloane editabile</strong> (PowerPoint) — postare 1080×1080, portret
                1080×1350 și story 1080×1920, plus exemple gata făcute.
              </li>
            </ul>
          </section>

          <section>
            <h2>Descarcă</h2>
            {info ? (
              <>
                <p>
                  <a
                    className="cc-dash__buton cc-dash__buton--plin"
                    href="/api/admin/media-kit"
                    download
                  >
                    Descarcă media kit-ul (ZIP)
                  </a>
                </p>
                <p className="cc-man__nota">
                  {marimeRo(info.marime)}
                  {info.actualizat ? ` · actualizat la ${dataRo.format(info.actualizat)}` : null}.
                  Linkul de descărcare e personal și expiră după 5 minute.
                </p>
              </>
            ) : (
              <p className="cc-dash__gol">
                Arhiva nu este disponibilă momentan (stocarea nu e configurată sau fișierul
                lipsește). Anunță administratorul.
              </p>
            )}
          </section>

          <section>
            <h2>Cum se actualizează</h2>
            <p>
              Arhiva stă în Cloudflare R2, în bucket-ul privat <code>citate-crestine-privat</code>,
              sub numele <code>{CHEIE_MEDIA_KIT}</code>. Pentru o versiune nouă, încarc-o acolo
              (Upload) cu exact același nume — o înlocuiește pe cea veche, fără modificări pe
              site.
            </p>
            <p className="cc-man__final">
              <Link href="/admin">← Înapoi la panoul de bord</Link>
            </p>
          </section>
        </article>
      </div>
    </DefaultTemplate>
  )
}
