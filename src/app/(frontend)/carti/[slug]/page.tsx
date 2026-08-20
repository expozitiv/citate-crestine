import type { Metadata } from 'next'

import { CarteView, metadataCarte } from '@/views/CarteView'

export const revalidate = 3600
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return metadataCarte(slug, 1)
}

export default async function PaginaCarte({ params }: Props) {
  const { slug } = await params
  return CarteView({ slug, pagina: 1 })
}
