import Image from 'next/image'
import Link from 'next/link'

interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  genres: { name: string }[]
  rating: number
  author: string
}

interface NovelRankingsProps {
  newReleases: Novel[]
  trending: Novel[]
  popular: Novel[]
}

export function NovelRankings({ newReleases, trending, popular }: NovelRankingsProps) {
  const renderNovelList = (novels: Novel[], title: string, subtitle: string) => (
    <div className="bg-[#E7E7E8] dark:bg-[#232120] rounded-lg p-4 ">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-3xl font-bold text-[#F1592A]">{title}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          #{subtitle}
        </span>
      </div>
      <div className="h-[1px] w-full bg-[#F1592A] mb-4"></div>
      <div className="space-y-6">
        {novels.slice(0, 5).map((novel, index) => (
          <Link href={`/novel/${novel.novelId}`} key={novel.novelId}>
            <div className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-[#3E3F3E] p-1.5 rounded-lg transition-colors h-[90px] bg-opacity-100 dark:bg-[#232120] mb-2">
              <span className="font-bold text-[#F1592A] w-6 text-base">{(index + 1).toString().padStart(2, '0')}</span>
              <Image
                src={novel.coverPhoto || '/assets/cover.jpg'}
                alt={novel.title}
                width={55}
                height={80}
                className="object-cover rounded"
              />
              <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-sm text-[#232120] dark:text-[#E7E7E8] line-clamp-2 mb-0.5">{novel.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {novel.genres[0]?.name || 'Fantasy'} • {novel.author || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-yellow-500">★ {novel.rating?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <section className="py-4 md:py-6 bg-[#E7E7E8] dark:bg-[#232120]">
      <div className="container mx-auto px-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 max-w-6xl mx-auto">
          {renderNovelList(newReleases, "New", "Latest")}
          {renderNovelList(trending, "Trending", "Top 5")}
          {renderNovelList(popular, "Popular", "All Time")}
        </div>
      </div>
    </section>
  )
}

