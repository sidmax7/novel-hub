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
  firstReleaseDate?: string | null;
  chapters?: number;
  language?: string;
  rank?: number;
  seriesInfo: {
    firstReleaseDate: any;
  };
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

// First, update the type for sort criteria
type SortCriteria = 'latest' | 'oldest' | 'alphabetical_asc' | 'alphabetical_desc' | 'rating' | 'likes';

const sortNovels = (novels: Novel[], criteria: SortCriteria) => {
  const sorted = [...novels];
  switch (criteria) {
    case 'latest':
      return sorted.sort((a, b) => {
        // Handle Firestore Timestamp
        const dateA = a.seriesInfo?.firstReleaseDate?.seconds 
          ? a.seriesInfo.firstReleaseDate.seconds * 1000 
          : 0;
        const dateB = b.seriesInfo?.firstReleaseDate?.seconds 
          ? b.seriesInfo.firstReleaseDate.seconds * 1000 
          : 0;
        return dateB - dateA;
      });
    case 'oldest':
      return sorted.sort((a, b) => {
        // Handle Firestore Timestamp
        const dateA = a.seriesInfo?.firstReleaseDate?.seconds 
          ? a.seriesInfo.firstReleaseDate.seconds * 1000 
          : Infinity;
        const dateB = b.seriesInfo?.firstReleaseDate?.seconds 
          ? b.seriesInfo.firstReleaseDate.seconds * 1000 
          : Infinity;
        return dateA - dateB;
      });
    case 'alphabetical_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'alphabetical_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'likes':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    default:
      return sorted;
  }
};

export default function BrowsePage() {
  const { theme, setTheme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortCriteria>('latest');
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
    // Sort the next batch before adding
    const sorted = sortNovels(filteredNovels, sortBy);
    const nextBatch = sorted.slice(
      currentLength,
      currentLength + ITEMS_PER_LOAD
    );
    
    if (nextBatch.length > 0) {
      setDisplayedNovels(prev => [...prev, ...nextBatch]);
    }
    
    setHasMore(currentLength + nextBatch.length < filteredNovels.length);
  }, [filteredNovels, displayedNovels.length, sortBy]);

  const fetchNovels = useCallback(async () => {
    try {
      setIsLoading(true);
      const CACHE_KEY = 'all_novels_test_v3';
      const CACHE_TTL = 3600;

      if (redis) {
        try {
          console.log('🔍 Checking Redis cache...');
          const cachedData = await redis.get(CACHE_KEY);
          if (cachedData) {
            console.log('✨ Cache hit: Using cached novels data');
            let parsedData;
            
            try {
              parsedData = typeof cachedData === 'string' 
                ? JSON.parse(cachedData)
                : Array.isArray(cachedData) ? cachedData : [];
                
              if (!Array.isArray(parsedData)) {
                throw new Error('Invalid cache format');
              }
              
              // Sort without logging
              parsedData.sort((a, b) => {
                const dateA = a.seriesInfo?.firstReleaseDate?.seconds 
                  ? a.seriesInfo.firstReleaseDate.seconds * 1000 
                  : 0;
                const dateB = b.seriesInfo?.firstReleaseDate?.seconds 
                  ? b.seriesInfo.firstReleaseDate.seconds * 1000 
                  : 0;
                return dateB - dateA;
              });
              
              setNovels(parsedData);
              setFilteredNovels(parsedData);
              return;
            } catch (parseError) {
              console.error('❌ Cache parse error:', parseError);
              const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
              throw new Error(`Failed to parse cached data: ${errorMessage}`);
            }
          } else {
            console.log('📭 Cache miss: Fetching from Firebase');
          }
        } catch (redisError) {
          console.error('Redis error:', redisError);
        }
      }

      const novelsRef = collection(db, 'novels');
      const q = query(
        novelsRef, 
        orderBy('seriesInfo.firstReleaseDate', 'desc')
      );
      
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
    if (!Array.isArray(novelsList)) return;
    
    let filtered = [...novelsList];

    // Handle genre filters
    if (selectedGenres) {
      const genres = selectedGenres.split(',').map(g => g.trim().toLowerCase());
      filtered = filtered.filter(novel => {
        const novelGenres = novel.genres.map(g => g.name.toLowerCase());
        return genreLogic === 'AND' 
          ? genres.every(g => novelGenres.includes(g))
          : genres.some(g => novelGenres.includes(g));
      });
    }

    // Handle excluded genres
    if (excludedGenres) {
      const genres = excludedGenres.split(',').map(g => g.trim().toLowerCase());
      filtered = filtered.filter(novel => {
        const novelGenres = novel.genres.map(g => g.name.toLowerCase());
        return !genres.some(g => novelGenres.includes(g));
      });
    }

    // Handle tag filters
    if (tagSearchInclude) {
      const tags = tagSearchInclude.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(novel => {
        const novelTags = novel.tags.map(t => t.toLowerCase());
        return tagLogic === 'AND'
          ? tags.every(t => novelTags.includes(t))
          : tags.some(t => novelTags.includes(t));
      });
    }

    // Handle excluded tags
    if (tagSearchExclude) {
      const tags = tagSearchExclude.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(novel => {
        const novelTags = novel.tags.map(t => t.toLowerCase());
        return !tags.some(t => novelTags.includes(t));
      });
    }

    // Handle publisher search
    if (publisherSearch) {
      const search = publisherSearch.toLowerCase();
      filtered = filtered.filter(novel => 
        novel.publishers.original.toLowerCase().includes(search) ||
        (novel.publishers.english?.toLowerCase().includes(search) ?? false)
      );
    }

    setFilteredNovels(filtered);
    setDisplayedNovels(filtered.slice(0, ITEMS_PER_LOAD));
    setHasMore(filtered.length > ITEMS_PER_LOAD);
  }, [
    novels,
    selectedGenres,
    excludedGenres,
    genreLogic,
    tagLogic,
    tagSearchInclude,
    tagSearchExclude,
    publisherSearch,
    ITEMS_PER_LOAD
  ]);

  const handleApplyFilters = useCallback(() => {
    applyFilters(novels);
    setOpen(false);
  }, [novels, applyFilters]);

  const handleTileClick = (novelId: string) => {
    router.push(`/novel/${novelId}`);
  };
  
  const getSortButtonText = () => {
    if (sortBy === 'alphabetical_asc') {
      return 'A-Z'
    } else {
      return sortBy === 'latest' ? 'Newest first' : 'Oldest first'
    }
  }

  const handleReadNow = (novelId: string) => {
    console.log(`Start reading novel with id: ${novelId}`)
  }

  const formatDate = (date: any) => {
    if (!date) return 'No date available';
    
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Handle regular date string
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString();
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

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
              
              <Select
                value={sortBy}
                onValueChange={(value: SortCriteria) => {
                  setSortBy(value);
                  const sorted = sortNovels(filteredNovels, value);
                  setFilteredNovels(sorted);
                  setDisplayedNovels([]);
                  setTimeout(() => {
                    setDisplayedNovels(sorted.slice(0, ITEMS_PER_LOAD));
                    setHasMore(sorted.length > ITEMS_PER_LOAD);
                  }, 0);
                }}
              >
                <SelectTrigger className="w-[160px] border-[#F1592A]">
                  <SelectValue placeholder="Sort by">
                    {sortBy === 'latest' && "Latest Release"}
                    {sortBy === 'oldest' && "Oldest Release"}
                    {sortBy === 'alphabetical_asc' && "A to Z"}
                    {sortBy === 'alphabetical_desc' && "Z to A"}
                    {sortBy === 'rating' && "Highest Rating"}
                    {sortBy === 'likes' && "Most Liked"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Release</SelectItem>
                  <SelectItem value="oldest">Oldest Release</SelectItem>
                  <SelectItem value="alphabetical_asc">A to Z</SelectItem>
                  <SelectItem value="alphabetical_desc">Z to A</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
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
                          {novel.seriesInfo?.firstReleaseDate && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Released: {formatDate(novel.seriesInfo.firstReleaseDate)}
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

