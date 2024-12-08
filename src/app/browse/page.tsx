'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Check, ChevronLeft, ChevronRight, X, Home} from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { collection, query, orderBy, getDocs, limit} from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { toast } from 'react-hot-toast'
import Image from "next/image"
import { useRouter, useSearchParams } from 'next/navigation'
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react"
import dynamic from 'next/dynamic'
import { LucideProps } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import LoadingSpinner from '@/components/LoadingSpinner'
import { genreColors } from '../genreColors'
import { Suspense } from 'react'
import FilterSection from '@/components/FilterSection'
import { ImageProps } from 'next/image'

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports
}

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = dynamic(dynamicIconImports[name])
  return <LucideIcon {...props} />
}

const ClientSideIcon = ({ name, ...props }: IconProps) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <Icon name={name} {...props} />
}

interface Novel {
  novelId: string
  title: string
  publishers: {
    original: string
    english?: string
  }
  genres: { name: string }[]
  rating: number
  coverPhoto: string
  authorId: string
  tags: string[]
  likes: number
  synopsis: string
  type?: string
  lastUpdated?: string
  releaseDate?: string | null
  chapters?: number
  language?: string
  rank?: number
}

const FILTER_STATE_KEY = 'novelHubFilterState'

interface FilterState {
  selectedGenres: string;
  excludedGenres: string;
  genreLogic: 'AND' | 'OR';
  // ... other filter state properties
}

// Update Redis initialization
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value,
            ttl: options?.ex
          })
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

// Add a new component for optimized novel cover images
const NovelCoverImage = ({ src, alt, priority }: { src: string, alt: string, priority?: boolean }) => {
  return (
    <Image
      src={src || '/placeholder.svg'}
      alt={alt}
      fill
      sizes="(max-width: 768px) 96px, 96px"
      priority={priority}
      className="rounded object-cover"
      // Add blur placeholder for better loading experience
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0fHRsdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0XFyAeIRshGxsdIR0hHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      onError={(e) => {
        // Fallback to placeholder on error
        const img = e.target as HTMLImageElement;
        img.src = '/placeholder.svg';
      }}
    />
  );
};

function BrowsePageContent() {
  const { theme, setTheme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortCriteria, setSortCriteria] = useState<'releaseDate' | 'name'>('releaseDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [itemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)

  // Filter state variables
  const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR')
  const [tagSearchInclude, setTagSearchInclude] = useState('')
  const [tagSearchExclude, setTagSearchExclude] = useState('')
  const [readingStatus, setReadingStatus] = useState('all')
  const [publisherSearch, setPublisherSearch] = useState('')
  const [genreLogic, setGenreLogic] = useState<'AND' | 'OR'>('OR')
  const [selectedGenres, setSelectedGenres] = useState<string>('')
  const [excludedGenres, setExcludedGenres] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const searchParams = useSearchParams()

  // Load filter state from localStorage on initial render
  useEffect(() => {
    const savedFilterState = localStorage.getItem(FILTER_STATE_KEY)
    if (savedFilterState) {
      try {
        const parsedState = JSON.parse(savedFilterState);
        setSelectedGenres(parsedState.selectedGenres || '');
        setExcludedGenres(parsedState.excludedGenres || '');
        setGenreLogic(parsedState.genreLogic || 'OR');
        setTagLogic(parsedState.tagLogic || 'OR');
        setTagSearchInclude(parsedState.tagSearchInclude || '');
        setTagSearchExclude(parsedState.tagSearchExclude || '');
        setReadingStatus(parsedState.readingStatus || 'all');
        setPublisherSearch(parsedState.publisherSearch || '');
        setSearchTerm(parsedState.searchTerm || '');
      } catch (error) {
        console.error('Error parsing filter state:', error);
      }
    }

    const genreFromUrl = searchParams.get('genre')
    if (genreFromUrl) {
      setSelectedGenres(genreFromUrl);
    }
  }, [searchParams]);

  // Update fetchNovels function
  const fetchNovels = useCallback(async () => {
    try {
      setIsLoading(true);
      const CACHE_KEY = 'all_novels_v1';
      const CACHE_TTL = 3600;

      // Try Redis first
      if (redis) {
        try {
          console.log('🔍 Checking Redis cache...');
          const cachedData = await redis.get(CACHE_KEY);
          if (cachedData) {
            console.log('✨ Successfully retrieved data from Redis cache');
            const parsedData = typeof cachedData === 'string' 
              ? JSON.parse(cachedData) 
              : cachedData;
            
            console.log(`📚 Found ${parsedData.length} novels in cache`);
            setNovels(parsedData);
            setFilteredNovels(parsedData);
            return;
          }
          console.log('❌ No cached data found in Redis');
        } catch (redisError) {
          console.warn('⚠️ Redis read failed, falling back to Firebase:', redisError);
        }
      }

      // Fetch from Firebase if no cache or cache failed
      console.log('🔥 Fetching from Firebase...');
      const novelsRef = collection(db, 'novels');
      const q = query(
        novelsRef,
        orderBy('title')
      );

      const querySnapshot = await getDocs(q);
      const fetchedNovels = querySnapshot.docs.map(doc => ({
        novelId: doc.id,
        ...doc.data()
      } as Novel));

      console.log(`📚 Fetched ${fetchedNovels.length} novels from Firebase`);

      // Update state
      setNovels(fetchedNovels);
      setFilteredNovels(fetchedNovels);

      // Try to cache the new data
      if (redis) {
        try {
          console.log('💾 Caching data in Redis...');
          await redis.set(CACHE_KEY, JSON.stringify(fetchedNovels), {
            ex: CACHE_TTL
          });
          console.log('✅ Successfully cached in Redis');
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache in Redis:', cacheError);
        }
      }

    } catch (error) {
      console.error("❌ Error fetching novels:", error);
      toast.error("Failed to load novels. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  const applyFilters = useCallback((novelsList: Novel[] = novels) => {
    if (!novelsList?.length) return;
    
    let filtered = novelsList.filter(novel => {
      if (!novel) return false;

      const searchTermLower = searchTerm?.toLowerCase() || '';
      
      // Convert genre names to lowercase for case-insensitive comparison
      const novelGenres = novel.genres?.map(g => g.name.toLowerCase()) || [];
      const tagsLower = novel.tags?.map(tag => tag.toLowerCase()) || [];
      
      // Basic search with null checks
      const matchesSearch = 
        (novel.title?.toLowerCase().includes(searchTermLower) ?? false) ||
        (novel.publishers?.original?.toLowerCase().includes(searchTermLower) ?? false);

      // Genre filtering - Include genres
      const includeGenresLower = selectedGenres
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(Boolean); // Remove empty strings
      
      let matchesIncludeGenres = true;
      
      if (includeGenresLower.length > 0) {
        if (genreLogic === 'AND') {
          // All selected genres must be present
          matchesIncludeGenres = includeGenresLower.every(genre => 
            novelGenres.some(novelGenre => novelGenre.includes(genre))
          );
        } else {
          // At least one selected genre must be present (OR logic)
          matchesIncludeGenres = includeGenresLower.some(genre => 
            novelGenres.some(novelGenre => novelGenre.includes(genre))
          );
        }
      }

      // Genre filtering - Exclude genres
      const excludeGenresLower = excludedGenres
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(Boolean); // Remove empty strings
      
      const matchesExcludeGenres = !excludeGenresLower.some(genre => 
        novelGenres.some(novelGenre => novelGenre.includes(genre))
      );

      // Tag filtering with null checks
      const includeTags = (tagSearchInclude || '').toLowerCase().split(',')
        .map(t => t.trim())
        .filter(Boolean);
      
      const excludeTags = (tagSearchExclude || '').toLowerCase().split(',')
        .map(t => t.trim())
        .filter(Boolean);
      
      const matchesIncludeTags = !includeTags.length || (
        tagLogic === 'AND'
          ? includeTags.every(tag => tagsLower.includes(tag))
          : includeTags.some(tag => tagsLower.includes(tag))
      );
      
      const matchesExcludeTags = !excludeTags.length ||
        !excludeTags.some(tag => tagsLower.includes(tag));

      return matchesSearch && 
             matchesIncludeGenres && 
             matchesExcludeGenres && 
             matchesIncludeTags && 
             matchesExcludeTags;
    });

    // Apply sorting with null checks
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
    setCurrentPage(1);
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

  // Handle apply filters button click
  const handleApplyFilters = useCallback(() => {
    // Save filter state
    const filterState = {
      selectedGenres,
      excludedGenres,
      genreLogic,
      tagLogic,
      tagSearchInclude,
      tagSearchExclude,
      readingStatus,
      publisherSearch,
      searchTerm
    };
    
    localStorage.setItem(FILTER_STATE_KEY, JSON.stringify(filterState));
    
    // Now actually apply the filters
    applyFilters(novels);
  }, [
    novels,
    selectedGenres,
    excludedGenres,
    genreLogic,
    tagLogic,
    tagSearchInclude,
    tagSearchExclude,
    readingStatus,
    publisherSearch,
    searchTerm,
    applyFilters
  ]);

  const handleResetFilters = useCallback(() => {
    setSelectedGenres('')
    setExcludedGenres('')
    setGenreLogic('OR')
    setTagLogic('OR')
    setTagSearchInclude('')
    setTagSearchExclude('')
    setReadingStatus('all')
    setPublisherSearch('')
    setSearchTerm('')
    setCurrentPage(1)
    
    localStorage.removeItem(FILTER_STATE_KEY)
    applyFilters(novels)
  }, [novels, applyFilters]);

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

  const handleTileClick = (novelId: string) => {
    router.push(`/novel/${novelId}`)
  }

  const getColorScheme = (item: string) => {
    const key = Object.keys(genreColors).find(k => item.toLowerCase().includes(k.toLowerCase()));
    return key ? genreColors[key as keyof typeof genreColors] : genreColors.Horror;
  }




  // Pagination logic
  const indexOfLastNovel = currentPage * itemsPerPage;
  const indexOfFirstNovel = indexOfLastNovel - itemsPerPage;
  const currentNovels = filteredNovels.slice(indexOfFirstNovel, indexOfLastNovel);

  const totalPages = Math.ceil(filteredNovels.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);



  const handleSearch = () => {
    handleApplyFilters()
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`min-h-screen bg-[#E7E7E8] dark:bg-[#232120] ${mounted && theme === 'dark' ? 'dark' : ''}`}>
      <header className="bg-white dark:bg-[#232120] shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-[#F1592A]">
              <Link href="/" className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
                Novellize
              </Link>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                <Home className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                <ClientSideIcon 
                  name={theme === 'dark' ? 'sun' : 'moon'} 
                  className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" 
                />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar with FilterSection */}
            <aside className="md:w-80">
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
              />
            </aside>

            {/* Main content area */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-[#232120] dark:text-[#E7E7E8]">Browse Novels</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort by : {getSortButtonText()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSortCriteria('releaseDate')
                      setSortOrder('desc')
                    }}>
                      Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortCriteria('releaseDate')
                      setSortOrder('asc')
                    }}>
                      Oldest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortCriteria('name')
                      setSortOrder('asc')
                    }}>
                      A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortCriteria('name')
                      setSortOrder('desc')
                    }}>
                      Z-A
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Search bar */}
              <div className="mb-8">
                <div className="relative flex items-center">
                  <ClientSideIcon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#232120]/60 dark:text-[#E7E7E8]/60" />
                  <Input
                    type="search"
                    placeholder="Search novels, authors, genres, or tags..."
                    className="pl-10 pr-4 py-2 w-full rounded-l-full bg-[#C3C3C3] dark:bg-[#3E3F3E] focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder-[#8E8F8E] dark:placeholder-[#C3C3C3]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSearch}
                    className="rounded-r-full bg-[#F1592A] text-white hover:bg-[#E7E7E8] hover:text-[#F1592A] dark:hover:bg-[#232120]"
                  >
                    Search
                  </Button>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-24 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Novels grid */}
              <motion.div 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {currentNovels.map((novel, index) => (
                  <motion.div
                    key={novel.novelId}
                    className="bg-white dark:bg-black rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                    onClick={() => handleTileClick(novel.novelId)}
                  >
                    <div className="flex p-4">
                      <div className="flex-shrink-0 w-24 h-36 mr-4 relative group">
                        <div className="relative w-24 h-36">
                          <NovelCoverImage
                            src={novel.coverPhoto}
                            alt={novel.title}
                            priority={index < 3}
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
                            <ClientSideIcon name="book-open" className="mr-2" size={16} />
                            Read Now
                          </Button>
                        </div>
                      </div>
                      <div className="flex-grow">
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{novel.synopsis}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
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
                  </motion.div>
                ))}
              </motion.div>

              {/* Add after novels grid */}
              {filteredNovels.length > 0 && (
                <div className="flex justify-center mt-8 space-x-2">
                  <Button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <Button
                        key={number}
                        onClick={() => paginate(number)}
                        variant={currentPage === number ? "default" : "outline"}
                        className={currentPage === number ? "bg-[#F1592A] text-white" : ""}
                      >
                        {number}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}

              {filteredNovels.length === 0 && (
                <p className="text-center text-[#232120] dark:text-[#E7E7E8] mt-8">
                  No novels found matching your criteria.
                </p>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BrowsePageContent />
    </Suspense>
  )
}
