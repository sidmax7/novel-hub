import { motion } from 'framer-motion'
import { LatestReleasesCarousel } from './CarouselList'

interface PopularSectionProps {
  novels: any[]
  manga: any[]
  loading: boolean
  onFollowChange: (novelId: string, isFollowing: boolean) => void
}

export function PopularSection({ novels, manga, loading, onFollowChange }: PopularSectionProps) {
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  return (
    <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
      <div className="container mx-auto px-4">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-[#F1592A] text-center mb-12"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          RANKING
        </motion.h1>

        <div className="space-y-12">
          <LatestReleasesCarousel
            title="Latest Novels"
            novels={novels}
            loading={loading}
            onFollowChange={onFollowChange}
          />

          <LatestReleasesCarousel
            title="Latest Manga"
            novels={manga}
            loading={loading}
            onFollowChange={onFollowChange}
          />
        </div>
      </div>
    </section>
  )
} 