'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  genres: { name: string }[]
  synopsis: string
}

interface NovelCarouselSectionProps {
  novels: Novel[]
  sectionTitle: string
  category: string
}

export function NovelCarouselSection({ novels, sectionTitle, category }: NovelCarouselSectionProps) {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(
    novels.length > 0 ? novels[0] : null
  )
  const [startIndex, setStartIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const visibleNovels = 8

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.offsetWidth / visibleNovels
      carouselRef.current.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      })
    }
  }

  const handlePrevious = () => {
    const newIndex = Math.max(0, startIndex - 1)
    setStartIndex(newIndex)
    scrollToIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex = Math.min(novels.length - visibleNovels, startIndex + 1)
    setStartIndex(newIndex)
    scrollToIndex(newIndex)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const scrollPosition = carouselRef.current.scrollLeft
        const itemWidth = carouselRef.current.offsetWidth / visibleNovels
        const newIndex = Math.round(scrollPosition / itemWidth)
        if (newIndex !== startIndex) {
          setStartIndex(newIndex)
        }
      }
    }

    carouselRef.current?.addEventListener('scroll', handleScroll)
    return () => carouselRef.current?.removeEventListener('scroll', handleScroll)
  }, [startIndex])

  return (
    <section className="py-8 sticky top-20 bg-[#E7E7E8] dark:bg-[#232120] z-30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8]">
            {sectionTitle}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={startIndex === 0}
              className="border-[#F1592A] transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={startIndex >= novels.length - visibleNovels}
              className="border-[#F1592A] transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div 
          ref={carouselRef}
          className="flex gap-4 mb-8 overflow-x-auto w-full scroll-smooth hide-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {novels.slice(startIndex, startIndex + visibleNovels).map((novel) => (
            <div
              key={novel.novelId}
              className={`flex-shrink-0 cursor-pointer transition-all duration-300 w-[calc((100%-28px)/8)] hover:scale-105 ${
                selectedNovel?.novelId === novel.novelId
                  ? 'border-2 border-[#F1592A]'
                  : ''
              }`}
              onClick={() => setSelectedNovel(novel)}
              style={{ scrollSnapAlign: 'start' }}
            >
              <Image
                src={novel.coverPhoto}
                alt={novel.title}
                width={100}
                height={150}
                className="rounded-lg object-cover w-full h-[300px] transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        {/* Selected Novel Details */}
        {selectedNovel && (
          <div className="flex gap-6 bg-white dark:bg-[#3E3F3E] p-6 rounded-lg transition-all duration-300 transform">
            <div className="flex-shrink-0">
              <Image
                src={selectedNovel.coverPhoto}
                alt={selectedNovel.title}
                width={200}
                height={300}
                className="rounded-lg object-cover w-[200px] h-[300px]"
              />
            </div>
            <div className="flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2 text-[#232120] dark:text-[#E7E7E8]">
                {selectedNovel.title}
              </h3>
              <div className="flex gap-2 mb-4">
                {selectedNovel.genres.map((genre) => (
                  <span
                    key={genre.name}
                    className="px-2 py-1 text-sm rounded-full bg-[#F1592A] bg-opacity-10 text-[#F1592A] transition-all duration-200 hover:bg-opacity-20"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {selectedNovel.synopsis}
              </p>
              <div className="flex gap-4 mt-auto">
                <Link href={`/novel/${selectedNovel.novelId}`}>
                  <Button className="bg-[#F1592A] hover:bg-[#F1592A]/90 transition-all duration-200 hover:scale-105">
                    READ NOW
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-[#F1592A] transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Library
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
} 