'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { NovelCard } from '@/components/NovelCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  genres: { name: string }[]
  rating: number
  synopsis: string
  publishers: {
    original: string
    english?: string
  }
  likes: number
}

interface LatestReleasesCarouselProps {
  novels: Novel[]
  loading: boolean
  onFollowChange: (novelId: string, isFollowing: boolean) => void
}

export function LatestReleasesCarousel({ novels, loading, onFollowChange }: LatestReleasesCarouselProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold mb-6 text-[#232120] dark:text-[#E7E7E8]"
          variants={fadeIn}
        >
          Latest Releases
        </motion.h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner />
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {novels.map((novel, index) => (
                <CarouselItem key={novel.novelId} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/5">
                  <motion.div
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                  >
                    <NovelCard novel={{...novel, availability: {type: "FREE"}}} onFollowChange={onFollowChange} />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
        <motion.div 
          className="mt-8 md:mt-12 text-center"
          variants={fadeIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/browse">
            <Button variant="outline" className="border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8]">
              Browse All Novels
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
