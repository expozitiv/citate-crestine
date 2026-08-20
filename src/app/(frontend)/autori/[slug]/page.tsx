import type { Metadata } from 'next'

import { AutorView, metadataAutor } from '@/views/AutorView'

export const revalidate = 3600
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return metadataAutor(slug, 1)
}

export default async function PaginaAutor({ params }: Props) {
  const { slug } = await params
  return AutorView({ slug, pagina: 1 })
}
