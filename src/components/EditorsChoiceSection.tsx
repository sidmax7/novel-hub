'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  genres: { name: string }[]
}

interface EditorsChoiceSectionProps {
  novels: Novel[]
}

export default function EditorsChoiceSection({ novels }: EditorsChoiceSectionProps) {
  return (
    <section className="py-4 bg-white dark:bg-[#232120]">
      <div className="container mx-auto px-3">
        <h2 className="text-xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-3">
          Editors' Choice
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {novels.slice(0, 6).map((novel) => (
            <Link 
              href={`/novel/${novel.novelId}`} 
              key={novel.novelId}
              className="group flex flex-col"
            >
              {/* Cover Image */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg mb-2">
                <Image
                  src={novel.coverPhoto || '/assets/cover.jpg'}
                  alt={novel.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Title */}
              <h3 className="text-sm font-medium text-[#232120] dark:text-[#E7E7E8] line-clamp-2 min-h-[2.5rem] mb-0.5">
                {novel.title}
              </h3>
              
              {/* Genre */}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {novel.genres?.[0]?.name || 'Unknown'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
} 