import type { Metadata } from 'next'

import { metadataTema, TemaView } from '@/views/TemaView'

export const revalidate = 3600
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return metadataTema(slug, 1)
}

export default async function PaginaTema({ params }: Props) {
  const { slug } = await params
  return TemaView({ slug, pagina: 1 })
}
