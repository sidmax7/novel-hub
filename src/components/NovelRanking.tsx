import Image from 'next/image'
import Link from 'next/link'

const CustomStyles = () => (
  <style jsx global>{`
    @keyframes neonPulse {
      0%, 100% { 
        box-shadow: 0 0 2px #0ff,
                   inset 0 0 2px #0ff;
        border-color: rgba(0, 255, 255, 0.5);
      }
      50% { 
        box-shadow: 0 0 4px #0ff,
                   inset 0 0 3px #0ff;
        border-color: rgba(0, 255, 255, 0.8);
      }
    }

    @keyframes neonFire {
      0%, 100% { 
        box-shadow: 0 0 2px #ff3d7f,
                   inset 0 0 2px #ff3d7f;
        border-color: rgba(255, 61, 127, 0.5);
      }
      50% { 
        box-shadow: 0 0 4px #ff3d7f,
                   inset 0 0 3px #ff3d7f;
        border-color: rgba(255, 61, 127, 0.8);
      }
    }

    @keyframes neonSparkle {
      0%, 100% { 
        box-shadow: 0 0 2px #f0f,
                   inset 0 0 2px #f0f;
        border-color: rgba(255, 0, 255, 0.5);
      }
      50% { 
        box-shadow: 0 0 4px #f0f,
                   inset 0 0 3px #f0f;
        border-color: rgba(255, 0, 255, 0.8);
      }
    }

    .animate-neon-pulse {
      animation: neonPulse 2s ease-in-out infinite;
      border-width: 1.5px;
      position: relative;
      overflow: hidden;
    }

    .animate-neon-fire {
      animation: neonFire 2s ease-in-out infinite;
      border-width: 1.5px;
      position: relative;
      overflow: hidden;
    }

    .animate-neon-sparkle {
      animation: neonSparkle 2s ease-in-out infinite;
      border-width: 1.5px;
      position: relative;
      overflow: hidden;
    }

    .animate-neon-pulse::after,
    .animate-neon-fire::after,
    .animate-neon-sparkle::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 45%,
        rgba(255, 255, 255, 0.1) 48%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.1) 52%,
        transparent 55%
      );
      animation: shine 3s linear infinite;
      pointer-events: none;
    }

    @keyframes shine {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
  `}</style>
)

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
  const renderNovelList = (novels: Novel[], title: string, subtitle: string, animationClass: string, subtitleColor: string) => (
    <div className="bg-[#E7E7E8] dark:bg-[#232120] rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-3xl font-bold text-[#F1592A] flex items-center gap-2">
          {title}
          <div className="relative">
            <span className={`text-sm px-4 py-1.5 rounded-full ${animationClass} inline-block ${subtitleColor} font-medium border shadow-sm transition-colors`}>
              {subtitle}
            </span>
          </div>
        </h2>
      </div>
      <div className="h-[1px] w-full bg-[#F1592A] mb-4"></div>
      <div className="space-y-6">
        {novels.slice(0, 5).map((novel, index) => (
          <Link href={`/novel/${novel.novelId}`} key={novel.novelId}>
            <div className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-[#3E3F3E] p-1.5 rounded-lg transition-colors h-[90px] bg-opacity-100 dark:bg-[#232120] mb-2 hover:scale-[1.02] transition-transform duration-200">
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
      <CustomStyles />
      <div className="container mx-auto px-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 max-w-6xl mx-auto">
          {renderNovelList(
            newReleases, 
            "New", 
            "#Latest", 
            "animate-neon-pulse", 
            "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
          )}
          {renderNovelList(
            trending, 
            "Trending", 
            "#Top 5", 
            "animate-neon-fire", 
            "bg-pink-500/10 text-pink-500 border-pink-500/20"
          )}
          {renderNovelList(
            popular, 
            "Popular", 
            "#All Time", 
            "animate-neon-sparkle", 
            "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20"
          )}
        </div>
      </div>
    </section>
  )
}

