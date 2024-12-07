import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

interface Novel {
  novelId: string;
  title: string;
  coverPhoto: string;
  genres: { name: string }[];
  rating: number;
  synopsis: string;
  publishers: {
    original: string;
    english?: string;
  };
  likes: number;
  metadata?: {
    createdAt: any;
    updatedAt: any;
  };
}

interface TopReleasesSectionProps {
  latestNovels: Novel[];
  editorsPicks: Novel[];
  loading: boolean;
}

export function TopReleasesSection({ latestNovels, editorsPicks, loading }: TopReleasesSectionProps) {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const novels = latestNovels.slice(0, 10);

  useEffect(() => {
    if (novels.length > 0 && !selectedNovel) {
      setSelectedNovel(novels[0]);
    }
  }, [novels, selectedNovel]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isScrolling) return;

    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth / 3;
    
    if (container.scrollLeft < 10) {
      setIsScrolling(true);
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = scrollWidth;
      container.style.scrollBehavior = 'smooth';
      setIsScrolling(false);
    } else if (container.scrollLeft >= (scrollWidth * 2) - 10) {
      setIsScrolling(true);
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = scrollWidth;
      container.style.scrollBehavior = 'smooth';
      setIsScrolling(false);
    }
  }, [isScrolling]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initialize scroll position
      container.scrollLeft = container.scrollWidth / 3;
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && !isScrolling) {
      const scrollAmount = 300;
      const container = scrollContainerRef.current;
      const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-[500px]">
            <div className="border-4 border-[#F1592A] border-t-transparent rounded-lg animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!latestNovels.length && !editorsPicks.length) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
      <div className="container mx-auto">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Latest Releases Section - 65% width */}
            {latestNovels.length > 0 && (
              <div className="lg:w-[65%]">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#232120] dark:text-[#E7E7E8]">
                  New Arrivals
                </h2>
                
                {/* Horizontal Novel Covers */}
                <div className="relative mb-6 mt-4">
                  <div 
                    ref={scrollContainerRef} 
                    className="overflow-x-auto scrollbar-hide"
                  >
                    <div className="flex gap-4 min-w-min pb-4 pt-4 px-1">
                      {/* First set (for infinite scroll) */}
                      {novels.map((novel, index) => (
                        <motion.div
                          key={`pre-${novel.novelId}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative cursor-pointer flex-shrink-0 pt-1.5"
                          onClick={() => setSelectedNovel(novel)}
                        >
                          <div className={`relative w-24 h-36 rounded-lg ${
                            selectedNovel?.novelId === novel.novelId
                              ? 'ring-2 ring-[#F1592A]'
                              : ''
                          }`}>
                            <Image
                              src={novel.coverPhoto}
                              alt={novel.title}
                              fill
                              className="object-cover rounded-lg"
                              sizes="96px"
                              quality={75}
                            />
                          </div>
                        </motion.div>
                      ))}
                      {/* Main set */}
                      {novels.map((novel, index) => (
                        <motion.div
                          key={novel.novelId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative cursor-pointer flex-shrink-0 pt-1.5"
                          onClick={() => setSelectedNovel(novel)}
                        >
                          <div className={`relative w-24 h-36 rounded-lg ${
                            selectedNovel?.novelId === novel.novelId
                              ? 'ring-2 ring-[#F1592A]'
                              : ''
                          }`}>
                            <Image
                              src={novel.coverPhoto}
                              alt={novel.title}
                              fill
                              className="object-cover rounded-lg"
                              sizes="96px"
                              quality={75}
                            />
                          </div>
                        </motion.div>
                      ))}
                      {/* Last set (for infinite scroll) */}
                      {novels.map((novel, index) => (
                        <motion.div
                          key={`post-${novel.novelId}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative cursor-pointer flex-shrink-0 pt-1.5"
                          onClick={() => setSelectedNovel(novel)}
                        >
                          <div className={`relative w-24 h-36 rounded-lg ${
                            selectedNovel?.novelId === novel.novelId
                              ? 'ring-2 ring-[#F1592A]'
                              : ''
                          }`}>
                            <Image
                              src={novel.coverPhoto}
                              alt={novel.title}
                              fill
                              className="object-cover rounded-lg"
                              sizes="96px"
                              quality={75}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div 
                    onClick={() => scrollCarousel('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-black/80 rounded-full flex items-center justify-center cursor-pointer shadow-md backdrop-blur-sm -ml-4 hover:bg-white dark:hover:bg-black transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#232120] dark:text-[#E7E7E8]" />
                  </div>
                  <div 
                    onClick={() => scrollCarousel('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-black/80 rounded-full flex items-center justify-center cursor-pointer shadow-md backdrop-blur-sm -mr-4 hover:bg-white dark:hover:bg-black transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-[#232120] dark:text-[#E7E7E8]" />
                  </div>
                </div>

                {/* Selected Novel Details */}
                {selectedNovel && (
                  <motion.div
                    key={selectedNovel.novelId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-6"
                  >
                    <div className="relative w-40 h-56 flex-shrink-0">
                      <Image
                        src={selectedNovel.coverPhoto}
                        alt={selectedNovel.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-2">
                        {selectedNovel.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-[#464646] dark:text-[#C3C3C3]">
                          {selectedNovel.publishers.original}
                        </span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-[#F1592A] fill-[#F1592A]" />
                          <span className="ml-1 text-sm text-[#464646] dark:text-[#C3C3C3]">
                            {selectedNovel.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#464646] dark:text-[#C3C3C3] mb-4 line-clamp-3">
                        {selectedNovel.synopsis}
                      </p>
                      <div className="flex gap-3">
                        <Link href={`/novel/${selectedNovel.novelId}`}>
                          <Button className="bg-[#F1592A] text-white hover:bg-[#F1592A]/90">
                            READ NOW
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Editors' Picks Section - 35% width */}
            {editorsPicks.length > 0 && (
              <div className={`${latestNovels.length > 0 ? 'lg:w-[35%]' : 'w-full'}`}>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#232120] dark:text-[#E7E7E8] pl-1">
                  Editors' Picks
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {editorsPicks.map((novel, index) => (
                    <motion.div
                      key={novel.novelId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative w-24 h-36 rounded-lg overflow-hidden"
                    >
                      <Link href={`/novel/${novel.novelId}`}>
                        <div className="relative w-full h-full">
                          <Image
                            src={novel.coverPhoto}
                            alt={novel.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                            quality={75}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-[2px]">
                            <h3 className="text-xs font-medium text-white line-clamp-1">
                              {novel.title}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 