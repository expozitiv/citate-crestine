import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { metadataTema, TemaView } from '@/views/TemaView'

export const revalidate = 2592000 // 30 de zile; modificările din admin invalidează țintit (lib/revalidate.ts)
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string; nr: string }> }

const parseazaPagina = (nr: string): number | null => {
  const n = Number(nr)
  return Number.isInteger(n) && n >= 2 ? n : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, nr } = await params
  const pagina = parseazaPagina(nr)
  if (!pagina) return {}
  return metadataTema(slug, pagina)
}

export default async function PaginaTemaPaginata({ params }: Props) {
  const { slug, nr } = await params
  const pagina = parseazaPagina(nr)
  if (!pagina) notFound()
  return TemaView({ slug, pagina })
}
