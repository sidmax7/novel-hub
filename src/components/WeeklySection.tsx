'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  synopsis: string
  rating: number
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: { toDate: () => Date }
  image?: string
}

interface WeeklyBookSectionProps {
  popularNovels: Novel[]
  announcements: Announcement[]
}

export default function WeeklyBookSection({ popularNovels, announcements }: WeeklyBookSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)
  const [autoSlideInterval, setAutoSlideInterval] = useState<NodeJS.Timeout | null>(null)

  const filteredNovels = popularNovels.filter(novel => novel.coverPhoto && novel.title).slice(0, 5)

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentSlide(prev => (prev + 1) % filteredNovels.length)
    }, 5000)
    setAutoSlideInterval(interval)
    return () => clearInterval(interval)
  }, [filteredNovels.length])

  const handlePrevSlide = () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval)
    setDirection(-1)
    setCurrentSlide(prev => (prev - 1 + filteredNovels.length) % filteredNovels.length)
  }

  const handleNextSlide = () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval)
    setDirection(1)
    setCurrentSlide(prev => (prev + 1) % filteredNovels.length)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  }

  return (
    <section className="py-12 md:py-16 bg-[#E7E7E8] dark:bg-[#3e3f3e]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Featured Novel */}
          <div className="bg-white dark:bg-[#3E3F3E] rounded-2xl p-8 lg:col-span-2">
            <h2 className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-6">Weekly Book</h2>
            {filteredNovels.length > 1 && (
              <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="absolute w-full h-full"
                  >
                    <div className="relative w-full h-full flex items-center">
                      {/* Blurred background */}
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={filteredNovels[currentSlide].coverPhoto || '/assets/cover.jpg'}
                          alt=""
                          fill
                          className="object-cover blur-md brightness-50"
                        />
                      </div>
                      
                      {/* Content container */}
                      <div className="relative z-10 w-full h-full flex px-8 md:px-12">
                        {/* Book cover */}
                        <div className="w-1/3 h-full flex items-center justify-center">
                          <div className="relative w-[160px] h-[240px] md:w-[200px] md:h-[300px] lg:w-[220px] lg:h-[330px] shadow-2xl transition-transform duration-300 hover:scale-105">
                            <Image
                              src={filteredNovels[currentSlide].coverPhoto || '/assets/cover.jpg'}
                              alt={filteredNovels[currentSlide].title}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        </div>
                        
                        {/* Book info */}
                        <div className="w-2/3 flex flex-col justify-center pl-6 md:pl-8">
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {filteredNovels[currentSlide].title}
                          </h3>
                          <p className="text-gray-200 text-base md:text-lg mb-4 line-clamp-4 md:line-clamp-5">
                            {filteredNovels[currentSlide].synopsis}
                          </p>
                          <div className="flex items-center space-x-2 text-lg text-[#F1592A]">
                            <span>★</span>
                            <span>{filteredNovels[currentSlide].rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {filteredNovels.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#F1592A]/75 text-white p-2 rounded-full z-20 transition-colors duration-300"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#F1592A]/75 text-white p-2 rounded-full z-20 transition-colors duration-300"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="bg-white dark:bg-[#3E3F3E] rounded-2xl p-8 lg:col-span-1">
            <h2 className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-6">Announcements</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {announcements.slice(0, 3).map((announcement) => (
                <Link 
                  href={`/forum/post/${announcement.id}`} 
                  key={announcement.id}
                  className="group block p-4 rounded-lg bg-[#E7E7E8] dark:bg-[#232120] hover:bg-gray-100 dark:hover:bg-[#3E3F3E] transition-all duration-300
                    border border-gray-200 dark:border-gray-700 
                    shadow-sm hover:shadow-md hover:border-[#F1592A] dark:hover:border-[#F1592A]
                    relative overflow-hidden h-[100px] lg:h-[120px]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F1592A] group-hover:w-2 transition-all duration-300"></div>
                  <div className="flex items-center space-x-4 h-full">
                    <div className="flex-1 pl-3">
                      <h3 className="font-medium text-[#232120] dark:text-[#E7E7E8] mb-2 line-clamp-1 group-hover:text-[#F1592A] transition-colors duration-300">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                        {announcement.content}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                        {new Date(announcement.createdAt?.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                    {announcement.image && (
                      <div className="flex-shrink-0">
                        <Image
                          src={announcement.image}
                          alt={announcement.title}
                          width={80}
                          height={80}
                          className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

