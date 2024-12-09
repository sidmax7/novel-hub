'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Home, Moon, Sun, ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { toast } from 'react-hot-toast'
import Image from "next/image"
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { genreColors } from '../genreColors'
import FilterSection from '@/components/FilterSection'
import { useInView } from 'react-intersection-observer';
import { AnimatePresence, motion } from 'framer-motion';

interface Novel {
  novelId: string;
  title: string;
  publishers: {
    original: string;
    english?: string;
  };
  genres: { name: string }[];
  rating: number;
  coverPhoto: string;
  authorId: string;
  tags: string[];
  likes: number;
  synopsis: string;
  type?: string;
  lastUpdated?: string;
  releaseDate?: string | null;
  chapters?: number;
  language?: string;
  rank?: number;
}

const initializeRedis = () => {
  return {
    async get(key: string) {
      try {
        const response = await fetch(`/api/redis?key=${encodeURIComponent(key)}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Redis GET failed:', errorData);
          return null;
        }
        const { data } = await response.json();
        console.log('Redis GET response:', data ? 'Data found' : 'No data');
        return data;
      } catch (error) {
        console.error('Redis get error:', error);
        return null;
      }
    },
    async set(key: string, value: string, options?: { ex: number }) {
      try {
        const response = await fetch('/api/redis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value, ttl: options?.ex })
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Redis SET failed:', errorData);
          return false;
        }
        const data = await response.json();
        console.log('Redis SET response:', data);
        return data.success;
      } catch (error) {
        console.error('Redis set error:', error);
        return false;
      }
    }
  };
};

const redis = initializeRedis();
console.log('Redis initialized:', !!redis);

const NovelCoverImage = ({ src, alt, priority }: { src: string, alt: string, priority?: boolean }) => {
  return (
    <Image
      src={src || '/placeholder.svg'}
      alt={alt}
      fill
      sizes="(max-width: 768px) 96px, 96px"
      priority={priority}
      className="rounded object-cover"
      placeholder="blur"
      blurDataURL="/placeholder.svg"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.src = '/placeholder.svg';
      }}
    />
  );
};

// Update the animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 10,
    scale: 0.98
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15
    }
  }
};

export default function BrowsePage() {
  const { theme, setTheme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortCriteria, setSortCriteria] = useState<'releaseDate' | 'name'>('releaseDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [itemsPerPage] = useState(10);
  const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR');
  const [tagSearchInclude, setTagSearchInclude] = useState('');
  const [tagSearchExclude, setTagSearchExclude] = useState('');
  const [readingStatus, setReadingStatus] = useState('all');
  const [publisherSearch, setPublisherSearch] = useState('');
  const [genreLogic, setGenreLogic] = useState<'AND' | 'OR'>('OR');
  const [selectedGenres, setSelectedGenres] = useState<string>('');
  const [excludedGenres, setExcludedGenres] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const totalPages = Math.ceil(filteredNovels.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  const [displayedNovels, setDisplayedNovels] = useState<Novel[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_LOAD = 12;

  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView]);

  const loadMore = useCallback(() => {
    const currentLength = displayedNovels.length;
    const nextBatch = filteredNovels.slice(
      currentLength,
      currentLength + ITEMS_PER_LOAD
    );
    
    if (nextBatch.length > 0) {
      setDisplayedNovels(prev => [...prev, ...nextBatch]);
    }
    
    setHasMore(currentLength + nextBatch.length < filteredNovels.length);
  }, [filteredNovels, displayedNovels.length]);

  const fetchNovels = useCallback(async () => {
    try {
      setIsLoading(true);
      const CACHE_KEY = 'all_novels_v1';
      const CACHE_TTL = 3600;

      if (redis) {
        try {
          console.log('🔍 Checking Redis cache...');
          const cachedData = await redis.get(CACHE_KEY);
          if (cachedData) {
            console.log('✨ Successfully retrieved data from Redis cache');
            let parsedData;
            
            try {
              parsedData = typeof cachedData === 'string' 
                ? JSON.parse(cachedData)
                : Array.isArray(cachedData) ? cachedData : [];
                
              if (!Array.isArray(parsedData)) {
                throw new Error('Invalid cache format');
              }
              
              setNovels(parsedData);
              setFilteredNovels(parsedData);
              return;
            } catch (parseError) {
              const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error occurred';
              throw new Error(`Failed to parse cached data: ${errorMessage}`);
            }
          }
        } catch (redisError) {
          console.error('Redis error:', redisError);
          // Continue to Firebase fetch on Redis error
        }
      }

      const novelsRef = collection(db, 'novels');
      const q = query(novelsRef, orderBy('title'));
      const querySnapshot = await getDocs(q);
      
      const fetchedNovels = querySnapshot.docs.map(doc => ({
        novelId: doc.id,
        ...doc.data()
      } as Novel));

      setNovels(fetchedNovels);
      setFilteredNovels(fetchedNovels);

      await redis.set(CACHE_KEY, JSON.stringify(fetchedNovels), { ex: CACHE_TTL });
    } catch (error) {
      console.error("Error fetching novels:", error);
      toast.error("Failed to load novels");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  const applyFilters = useCallback((novelsList: Novel[] = novels) => {
    if (!Array.isArray(novelsList)) {
      console.warn('Invalid novels list provided to filter');
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    let filtered = novelsList;
    
    if (searchTermLower) {
      filtered = filtered.filter(novel => {
        const novelTitle = novel.title.toLowerCase();
        const publisherOriginal = novel.publishers?.original.toLowerCase() || '';
        const genres = novel.genres.map(g => g.name.toLowerCase()).join(' ');
        const tags = novel.tags.map(t => t.toLowerCase()).join(' ');
        
        const titleWords = novelTitle.split(' ');
        const titleMatch = titleWords.some(word => word.startsWith(searchTermLower)) || 
                          novelTitle.includes(searchTermLower);
        
        return titleMatch ||
               publisherOriginal.includes(searchTermLower) ||
               genres.includes(searchTermLower) ||
               tags.includes(searchTermLower);
      });
    }

    const safeString = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    const safeSplit = (value: any): string[] => {
      try {
        const str = safeString(value);
        return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
      } catch (error) {
        console.warn('Split operation failed:', error);
        return [];
      }
    };

    // Include genres
    const includeGenresLower = safeSplit(selectedGenres)
      .map(g => g.toLowerCase());

    // Exclude genres
    const excludeGenresLower = safeSplit(excludedGenres)
      .map(g => g.toLowerCase());

    // Tags
    const includeTags = safeSplit(tagSearchInclude)
      .map(t => t.toLowerCase());
    const excludeTags = safeSplit(tagSearchExclude)
      .map(t => t.toLowerCase());

    // Genre filtering
    let matchesIncludeGenres = true;
    if (includeGenresLower.length > 0) {
      matchesIncludeGenres = genreLogic === 'AND'
        ? includeGenresLower.every(genre => 
            filtered.some(novel => 
              Array.isArray(novel.genres) && 
              novel.genres.some(g => g.name.toLowerCase() === genre)
            )
          )
        : includeGenresLower.some(genre => 
            filtered.some(novel => 
              Array.isArray(novel.genres) && 
              novel.genres.some(g => g.name.toLowerCase() === genre)
            )
          );
    }

    const matchesExcludeGenres = !excludeGenresLower.some(genre => 
      filtered.some(novel => 
        Array.isArray(novel.genres) && 
        novel.genres.some(g => g.name.toLowerCase() === genre)
      )
    );

    // Tag filtering
    const matchesIncludeTags = !includeTags.length || (
      tagLogic === 'AND'
        ? includeTags.every(tag => filtered.some(novel => 
            Array.isArray(novel.tags) && 
            novel.tags.some(t => t.toLowerCase() === tag)
          ))
        : includeTags.some(tag => filtered.some(novel => 
            Array.isArray(novel.tags) && 
            novel.tags.some(t => t.toLowerCase() === tag)
          ))
    );
    
    const matchesExcludeTags = !excludeTags.length ||
      !excludeTags.some(tag => filtered.some(novel => 
        Array.isArray(novel.tags) && 
        novel.tags.some(t => t.toLowerCase() === tag)
      ));

    filtered = filtered.filter(novel => 
      matchesIncludeGenres && 
      matchesExcludeGenres && 
      matchesIncludeTags && 
      matchesExcludeTags
    );

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortCriteria === 'name') {
        return sortOrder === 'asc' 
          ? (a.title || '').localeCompare(b.title || '')
          : (b.title || '').localeCompare(a.title || '');
      } else {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    setFilteredNovels(filtered);
    setDisplayedNovels(filtered.slice(0, ITEMS_PER_LOAD));
    setHasMore(filtered.length > ITEMS_PER_LOAD);
  }, [
    novels,
    searchTerm,
    selectedGenres,
    excludedGenres,
    genreLogic,
    tagLogic,
    tagSearchInclude,
    tagSearchExclude,
    sortCriteria,
    sortOrder
  ]);

  const handleApplyFilters = useCallback(() => {
    applyFilters(novels);
  }, [novels, applyFilters]);

  const handleTileClick = (novelId: string) => {
    router.push(`/novel/${novelId}`);
  };
  
  const getSortButtonText = () => {
    if (sortCriteria === 'name') {
      return sortOrder === 'asc' ? 'A-Z' : 'Z-A'
    } else {
      return sortOrder === 'desc' ? 'Newest first' : 'Oldest first'
    }
  }

  const handleReadNow = (novelId: string) => {
    console.log(`Start reading novel with id: ${novelId}`)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date available'
    
    if (typeof dateString === 'string') {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString()
      }
    }
    
    return 'Invalid date'
  }

  const getColorScheme = (item: string) => {
    const key = Object.keys(genreColors).find(k => item.toLowerCase().includes(k.toLowerCase()));
    return key ? genreColors[key as keyof typeof genreColors] : genreColors.Horror;
  }

  const handleSearch = () => {
    handleApplyFilters()
  }

  const handleResetFilters = useCallback(() => {
    setSelectedGenres('');
    setExcludedGenres('');
    setGenreLogic('OR');
    setTagLogic('OR');
    setTagSearchInclude('');
    setTagSearchExclude('');
    setReadingStatus('all');
    setPublisherSearch('');
    setSearchTerm('');
    setCurrentPage(1);
    applyFilters(novels);
  }, [novels, applyFilters]);

  // Add a ref for the timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update the search input onChange handler
  <Input
    className="pl-10 bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8]"
    placeholder="Search novels, authors, genres..."
    value={searchTerm}
    onChange={(e) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);
      applyFilters(novels);
    }}
    onPaste={(e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      // Update both state and input value immediately
      setSearchTerm(pastedText);
      e.currentTarget.value = pastedText;
      applyFilters(novels);
    }}
  />

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`min-h-screen bg-[#E7E7E8] dark:bg-[#232120]`}>
      <header className="sticky top-0 z-50 bg-white dark:bg-[#232120] shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
                Novellize
              </Link>
            </div>

            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#232120] dark:text-[#E7E7E8]" />
                <Input
                  className="pl-10 pr-10 bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8]"
                  placeholder="Search novels, authors, genres..."
                  value={searchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchTerm(newValue);
                    applyFilters(novels);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    setSearchTerm(pastedText);
                    e.currentTarget.value = pastedText;
                    applyFilters(novels);
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilteredNovels(novels);
                      setDisplayedNovels(novels.slice(0, ITEMS_PER_LOAD));
                      setHasMore(novels.length > ITEMS_PER_LOAD);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                  >
                    <X className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A]" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/" passHref>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
                >
                  <Home className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                ) : (
                  <Sun className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8]">Browse Novels</h1>
            <div className="flex items-center gap-4">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="border-[#F1592A] text-[#232120] dark:text-[#E7E7E8]">
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="h-full flex flex-col p-0">
                  <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Filter Novels</SheetTitle>
                    <SheetDescription>
                      Customize your novel search with these filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <FilterSection
                      tagLogic={tagLogic}
                      setTagLogic={setTagLogic}
                      tagSearchInclude={tagSearchInclude}
                      setTagSearchInclude={setTagSearchInclude}
                      tagSearchExclude={tagSearchExclude}
                      setTagSearchExclude={setTagSearchExclude}
                      readingStatus={readingStatus}
                      setReadingStatus={setReadingStatus}
                      publisherSearch={publisherSearch}
                      setPublisherSearch={setPublisherSearch}
                      genreLogic={genreLogic}
                      setGenreLogic={setGenreLogic}
                      selectedGenres={selectedGenres}
                      setSelectedGenres={setSelectedGenres}
                      excludedGenres={excludedGenres}
                      setExcludedGenres={setExcludedGenres}
                      handleApplyFilters={handleApplyFilters}
                      handleResetFilters={handleResetFilters}
                      closeSheet={() => setOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Select onValueChange={(value) => {
                setSortCriteria(value.includes('name') ? 'name' : 'releaseDate')
                setSortOrder(value.includes('asc') ? 'asc' : 'desc')
              }}>
                <SelectTrigger className="w-[160px] border-[#F1592A]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name_asc">A-Z</SelectItem>
                  <SelectItem value="name_desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <motion.div 
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[250px]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="sync">
                {displayedNovels.map((novel) => (
                  <motion.div
                    key={novel.novelId}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="group relative overflow-hidden rounded-lg border bg-white dark:bg-black p-2 transition-colors cursor-pointer h-[250px]"
                    onClick={() => handleTileClick(novel.novelId)}
                  >
                    <div className="flex p-4 h-full">
                      <div className="flex-shrink-0 w-24 h-36 mr-4 relative group">
                        <div className="relative w-24 h-36">
                          <NovelCoverImage
                            src={novel.coverPhoto}
                            alt={novel.title}
                            priority={false}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReadNow(novel.novelId);
                            }}
                          >
                            <Search className="mr-2" size={16} />
                            Read Now
                          </Button>
                        </div>
                      </div>
                      <div className="flex-grow flex flex-col">
                        <h3 className="text-xl font-semibold text-[#232120] dark:text-[#E7E7E8] mb-2">
                          {novel.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Published by{' '}
                          <span className="font-semibold">
                            {novel.publishers.original}
                          </span>
                          {novel.publishers.english && (
                            <span> / {novel.publishers.english}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow overflow-y-auto custom-scrollbar">
                          {novel.synopsis}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {novel.genres.slice(0, 3).map((g, i) => (
                            <span 
                              key={i}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                theme === 'dark'
                                  ? getColorScheme(g.name).dark
                                  : getColorScheme(g.name).light
                              }`}
                            >
                              {g.name}
                            </span>
                          ))}
                          <span className="text-sm text-gray-500 dark:text-gray-400">{novel.likes} likes</span>
                          {novel.releaseDate && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Released: {formatDate(novel.releaseDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col">
                      <h3 className="text-xl font-semibold text-[#232120] dark:text-[#E7E7E8] mb-4">
                        {novel.title}
                      </h3>
                      <div className="flex-grow overflow-y-auto custom-scrollbar">
                        <p className="text-[#232120] dark:text-[#E7E7E8]">
                          {novel.synopsis}
                        </p>
                      </div>
                      <div className="mt-4 flex gap-2 pt-4 border-t border-[#232120]/10 dark:border-[#E7E7E8]/10">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#F1592A] hover:bg-[#F1592A] hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReadNow(novel.novelId);
                          }}
                        >
                          Read Now
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#F1592A] hover:bg-[#F1592A] hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTileClick(novel.novelId);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {hasMore && (
                <div ref={ref} className="col-span-full flex justify-center p-4">
                  <LoadingSpinner />
                </div>
              )}
            </motion.div>
          )}

          {filteredNovels.length === 0 && (
            <p className="text-center text-[#232120] dark:text-[#E7E7E8] mt-8">
              No novels found matching your criteria.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

