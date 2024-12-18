import NovelPageClient from './NovelPageClient'

export default function NovelPage({ params }: { params: { novelId: string } }) {
  return <NovelPageClient params={params} />
}

