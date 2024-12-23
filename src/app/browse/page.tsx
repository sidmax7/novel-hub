'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Home, Moon, Sun, ChevronLeft, ChevronRight, X, BookOpen, Heart, Calendar, Building2, Hash, Star } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

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
  language?: {
    original: string;
    translated?: string[];
  };
  rank?: number;
  seriesInfo: {
    firstReleaseDate: any;
  };
  status?: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  chapterType?: 'Web Novel' | 'Light Novel' | 'Novel';
  seriesType: 'ORIGINAL' | 'TRANSLATED' | 'FAN_FIC';
  seriesStatus: 'ONGOING' | 'COMPLETED' | 'ON HOLD' | 'CANCELLED' | 'UPCOMING';
  availability: {
    type: 'FREE' | 'FREEMIUM' | 'PAID';
    price?: number;
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowseContent />
    </Suspense>
  )
}

function BrowseContent() {
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
  const [publisherSearch, setPublisherSearch] = useState('');
  const [genreLogic, setGenreLogic] = useState<'AND' | 'OR'>('OR');
  const [selectedGenres, setSelectedGenres] = useState<string>('');
  const [excludedGenres, setExcludedGenres] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [seriesType, setSeriesType] = useState('all');
  const [chapterType, setChapterType] = useState('all');
  const [seriesStatus, setSeriesStatus] = useState('all');
  const [availabilityType, setAvailabilityType] = useState('all');
  const [releaseYearRange, setReleaseYearRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 5]);

  const searchParams = useSearchParams();

  // Calculate pagination values
  const totalPages = Math.ceil(filteredNovels.length / itemsPerPage);
  const indexOfLastNovel = currentPage * itemsPerPage;
  const indexOfFirstNovel = indexOfLastNovel - itemsPerPage;
  const currentNovels = filteredNovels.slice(indexOfFirstNovel, indexOfLastNovel);

  // Pagination controls
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Effect to handle URL search parameters
  useEffect(() => {
    const tagParam = searchParams.get('tagSearchInclude');
    const genreParam = searchParams.get('selectedGenres');
    const statusParam = searchParams.get('readingStatus');
    const publisherParam = searchParams.get('publisherSearch');
    const seriesTypeParam = searchParams.get('seriesType');
    const chapterTypeParam = searchParams.get('chapterType');
    const seriesStatusParam = searchParams.get('seriesStatus');
    const availabilityTypeParam = searchParams.get('availabilityType');
    const releaseYearMinParam = searchParams.get('releaseYearMin');
    const releaseYearMaxParam = searchParams.get('releaseYearMax');
    const ratingMinParam = searchParams.get('ratingMin');
    const ratingMaxParam = searchParams.get('ratingMax');

    if (tagParam) setTagSearchInclude(decodeURIComponent(tagParam));
    if (genreParam) setSelectedGenres(decodeURIComponent(genreParam));
    if (publisherParam) setPublisherSearch(decodeURIComponent(publisherParam));
    if (seriesTypeParam) setSeriesType(seriesTypeParam);
    if (chapterTypeParam) setChapterType(chapterTypeParam);
    if (seriesStatusParam) setSeriesStatus(seriesStatusParam);
    if (availabilityTypeParam) setAvailabilityType(availabilityTypeParam);
    
    if (releaseYearMinParam && releaseYearMaxParam) {
      setReleaseYearRange([parseInt(releaseYearMinParam), parseInt(releaseYearMaxParam)]);
    }
    
    if (ratingMinParam && ratingMaxParam) {
      setRatingRange([parseFloat(ratingMinParam), parseFloat(ratingMaxParam)]);
    }
  }, [searchParams]);

  const handleSearch = useCallback(() => {
    if (!novels.length) return;

    let filtered = [...novels];

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(novel => 
        novel.title.toLowerCase().includes(searchLower) ||
        novel.publishers.original.toLowerCase().includes(searchLower) ||
        novel.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        novel.genres.some(g => g.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply series type filter
    if (seriesType !== 'all') {
      filtered = filtered.filter(novel => novel.seriesType === seriesType);
    }

    // Apply chapter type filter
    if (chapterType !== 'all') {
      filtered = filtered.filter(novel => novel.chapterType === chapterType);
    }

    // Apply series status filter
    if (seriesStatus !== 'all') {
      filtered = filtered.filter(novel => novel.seriesStatus === seriesStatus);
    }

    // Apply availability type filter
    if (availabilityType !== 'all') {
      filtered = filtered.filter(novel => novel.availability.type === availabilityType);
    }

    // Apply release year range filter
    filtered = filtered.filter(novel => {
      const releaseYear = novel.seriesInfo.firstReleaseDate.toDate().getFullYear();
      return releaseYear >= releaseYearRange[0] && releaseYear <= releaseYearRange[1];
    });

    // Apply rating range filter
    filtered = filtered.filter(novel => 
      novel.rating >= ratingRange[0] && novel.rating <= ratingRange[1]
    );

    // Apply tag filters with proper logic
    if (tagSearchInclude) {
      const includeTags = tagSearchInclude.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      filtered = filtered.filter(novel => {
        const novelTags = (novel.tags || []).map(t => t.toLowerCase());
        if (tagLogic === 'AND') {
          return includeTags.every(tag => novelTags.some(t => t.includes(tag)));
        } else {
          return includeTags.some(tag => novelTags.some(t => t.includes(tag)));
        }
      });
    }

    // Apply genre filters with proper logic
    if (selectedGenres) {
      const includeGenres = selectedGenres.toLowerCase().split(',').map(g => g.trim()).filter(Boolean);
      filtered = filtered.filter(novel => {
        const novelGenres = novel.genres.map(g => g.name.toLowerCase());
        if (genreLogic === 'AND') {
          return includeGenres.every(genre => novelGenres.some(g => g.includes(genre)));
        } else {
          return includeGenres.some(genre => novelGenres.some(g => g.includes(genre)));
        }
      });
    }

    if (excludedGenres) {
      const excludeGenres = excludedGenres.toLowerCase().split(',').map(g => g.trim()).filter(Boolean);
      filtered = filtered.filter(novel => {
        const novelGenres = novel.genres.map(g => g.name.toLowerCase());
        return !excludeGenres.some(genre => novelGenres.some(g => g.includes(genre)));
      });
    }

    // Apply publisher search
    if (publisherSearch) {
      const searchLower = publisherSearch.toLowerCase().trim();
      filtered = filtered.filter(novel => 
        novel.publishers.original.toLowerCase().includes(searchLower) ||
        (novel.publishers.english?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    setFilteredNovels(filtered);
    setCurrentPage(1); // Reset to first page when applying filters
  }, [
    novels,
    searchTerm,
    tagSearchInclude,
    tagSearchExclude,
    tagLogic,
    selectedGenres,
    excludedGenres,
    genreLogic,
    publisherSearch,
    seriesType,
    chapterType,
    seriesStatus,
    availabilityType,
    releaseYearRange,
    ratingRange
  ]);

  const handleApplyFilters = useCallback(() => {
    // Update URL with current filters
    const params = new URLSearchParams();
    if (tagSearchInclude) params.set('tagSearchInclude', tagSearchInclude);
    if (selectedGenres) params.set('selectedGenres', selectedGenres);
    if (publisherSearch) params.set('publisherSearch', publisherSearch);
    if (seriesType !== 'all') params.set('seriesType', seriesType);
    if (chapterType !== 'all') params.set('chapterType', chapterType);
    if (seriesStatus !== 'all') params.set('seriesStatus', seriesStatus);
    if (availabilityType !== 'all') params.set('availabilityType', availabilityType);
    params.set('releaseYearMin', releaseYearRange[0].toString());
    params.set('releaseYearMax', releaseYearRange[1].toString());
    params.set('ratingMin', ratingRange[0].toString());
    params.set('ratingMax', ratingRange[1].toString());

    // Use router.push to update URL without reload
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl);

    handleSearch();
  }, [
    tagSearchInclude,
    selectedGenres,
    publisherSearch,
    seriesType,
    chapterType,
    seriesStatus,
    availabilityType,
    releaseYearRange,
    ratingRange,
    router,
    handleSearch
  ]);

  // Update the sort handler
  const handleSort = (value: SortCriteria) => {
    setSortBy(value);
    const sorted = sortNovels(filteredNovels, value);
    setFilteredNovels(sorted);
    setCurrentPage(1); // Reset to first page when sorting
  };

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
      if (date && typeof date === 'object' && 'seconds' in date) {
        // Convert seconds to milliseconds and create a Date object
        return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle string dates
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
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

  const handleResetFilters = useCallback(() => {
    // Reset all filter states
    setSelectedGenres('');
    setExcludedGenres('');
    setGenreLogic('OR');
    setTagLogic('OR');
    setTagSearchInclude('');
    setTagSearchExclude('');
    setPublisherSearch('');
    setSearchTerm('');
    setSeriesType('all');
    setChapterType('all');
    setSeriesStatus('all');
    setAvailabilityType('all');
    setReleaseYearRange([2000, new Date().getFullYear()]);
    setRatingRange([0, 5]);
    
    // Reset the novels display
    setFilteredNovels(novels);
    setCurrentPage(1); // Reset to first page when resetting filters
  }, [novels]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Add a ref for the timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update the search input onChange handler
  <Input
    className="pl-10 pr-10 bg-transparent border-2 border-[#F1592A]/50 hover:border-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder:text-[#232120]/60 dark:placeholder:text-[#E7E7E8]/60 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
    placeholder="Search novels, authors, genres..."
    value={searchTerm}
    onChange={(e) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);
      // Apply filters with the new search term
      const filtered = novels.filter(novel => {
        const searchLower = newValue.toLowerCase();
        return (
          novel.title.toLowerCase().includes(searchLower) ||
          novel.publishers.original.toLowerCase().includes(searchLower) ||
          novel.genres.some(g => g.name.toLowerCase().includes(searchLower)) ||
          novel.tags.some(t => t.toLowerCase().includes(searchLower))
        );
      });
      setFilteredNovels(filtered);
      setCurrentPage(1); // Reset to first page when searching
    }}
    onPaste={(e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      setSearchTerm(pastedText);
      e.currentTarget.value = pastedText;
      // Reset to current filtered state or all novels
      const currentFiltered = novels;
      setFilteredNovels(currentFiltered);
      setCurrentPage(1); // Reset to first page when resetting search
    }}
  />

  const fetchNovels = useCallback(async () => {
    try {
      setIsLoading(true);
      const CACHE_KEY = 'all_novels_test_v3';
      const CACHE_TTL = 3600;

      let fetchedData: Novel[] = [];

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
              
              fetchedData = parsedData;
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

      if (!fetchedData.length) {
        const novelsRef = collection(db, 'novels');
        const q = query(
          novelsRef, 
          orderBy('seriesInfo.firstReleaseDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        fetchedData = querySnapshot.docs.map(doc => ({
          novelId: doc.id,
          ...doc.data()
        } as Novel));

        await redis.set(CACHE_KEY, JSON.stringify(fetchedData), { ex: CACHE_TTL });
      }

      // Sort the data using current sortBy
      const sortedData = sortNovels(fetchedData, sortBy);
      
      setNovels(sortedData);
      setFilteredNovels(sortedData);
      setCurrentPage(1); // Start at first page

    } catch (error) {
      console.error("Error fetching novels:", error);
      toast.error("Failed to load novels");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  // Call fetchNovels on component mount
  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#232120] dark:text-[#E7E7E8] opacity-70" />
                <Input
                  className="pl-10 pr-10 bg-transparent border-2 border-[#F1592A]/50 hover:border-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder:text-[#232120]/60 dark:placeholder:text-[#E7E7E8]/60 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                  placeholder="Search novels, authors, genres..."
                  value={searchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchTerm(newValue);
                    // Apply filters with the new search term
                    const filtered = novels.filter(novel => {
                      const searchLower = newValue.toLowerCase();
                      return (
                        novel.title.toLowerCase().includes(searchLower) ||
                        novel.publishers.original.toLowerCase().includes(searchLower) ||
                        novel.genres.some(g => g.name.toLowerCase().includes(searchLower)) ||
                        novel.tags.some(t => t.toLowerCase().includes(searchLower))
                      );
                    });
                    setFilteredNovels(filtered);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      // Reset to current filtered state or all novels
                      const currentFiltered = novels;
                      setFilteredNovels(currentFiltered);
                      setCurrentPage(1); // Reset to first page when resetting filters
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent p-0 h-auto rounded-full"
                  >
                    <X className="h-4 w-4 text-[#232120]/70 dark:text-[#E7E7E8]/70 hover:text-[#F1592A] transition-colors" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Get 10 random novels
                  const randomNovels = [...novels]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);
                  setFilteredNovels(randomNovels);
                  setCurrentPage(1);
                  toast.success("Here's a fresh batch of random novels!");
                }}
                className="relative animate-border p-[2px] rounded-full hover:scale-105 transition-transform"
              >
                <div className="animate-border-inner rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-[#232120] dark:text-[#E7E7E8] font-medium">Surprise Me!</span>
                  <Star className="h-4 w-4 text-[#8B5CF6] animate-spin-slow" />
                </div>
              </Button>
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

      <div className="flex">
        {/* Persistent Filter Section */}
        <div className="w-80 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto bg-white dark:bg-black shadow-md">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-[#232120] dark:text-[#E7E7E8]">Filters</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Refine your novel search</p>
          </div>
          <FilterSection
            tagLogic={tagLogic}
            setTagLogic={setTagLogic}
            tagSearchInclude={tagSearchInclude}
            setTagSearchInclude={setTagSearchInclude}
            tagSearchExclude={tagSearchExclude}
            setTagSearchExclude={setTagSearchExclude}
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
            closeSheet={() => {}}
            seriesType={seriesType}
            setSeriesType={setSeriesType}
            chapterType={chapterType}
            setChapterType={setChapterType}
            seriesStatus={seriesStatus}
            setSeriesStatus={setSeriesStatus}
            availabilityType={availabilityType}
            setAvailabilityType={setAvailabilityType}
            releaseYearRange={releaseYearRange}
            setReleaseYearRange={setReleaseYearRange}
            ratingRange={ratingRange}
            setRatingRange={setRatingRange}
          />
        </div>

        {/* Main Content - With padding for better spacing */}
        <main className="flex-1 px-8 py-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-black p-4 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8]">Browse Novels</h1>
                <div className="flex items-center gap-4">
                  <Select
                    value={sortBy}
                    onValueChange={handleSort}
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
                <>
                  <motion.div 
                    className="flex flex-col gap-1.5"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    layoutRoot
                  >
                    <AnimatePresence mode="popLayout">
                      {currentNovels.map((novel, index) => (
                        <motion.div
                          key={novel.novelId}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="group relative bg-[#1A1A1A] hover:bg-[#232323] transition-colors cursor-pointer rounded-lg overflow-hidden"
                          onClick={() => handleTileClick(novel.novelId)}
                        >
                          <div className="flex p-4">
                            {/* Cover Image Section */}
                            <div className="flex-shrink-0 w-28 h-40 relative">
                              <div className="relative w-full h-full overflow-hidden rounded">
                                <NovelCoverImage
                                  src={novel.coverPhoto}
                                  alt={novel.title}
                                  priority={index < 2}
                                />
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-grow flex flex-col ml-4">
                              {/* Title and Basic Info */}
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-white group-hover:text-[#F1592A] transition-colors line-clamp-1">
                                    {novel.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-400">{novel.publishers.original}</span>
                                    {novel.publishers.english && (
                                      <>
                                        <span className="text-sm text-gray-600">•</span>
                                        <span className="text-sm text-gray-400">{novel.publishers.english}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {novel.status && (
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs px-3 py-1 ${
                                        novel.status === 'Ongoing' ? 'bg-green-900 text-green-300' :
                                        novel.status === 'Completed' ? 'bg-blue-900 text-blue-300' :
                                        novel.status === 'Hiatus' ? 'bg-yellow-900 text-yellow-300' :
                                        'bg-red-900 text-red-300'
                                      }`}
                                    >
                                      {novel.status}
                                    </Badge>
                                  )}
                                  {novel.chapterType && (
                                    <Badge 
                                      variant="secondary"
                                      className="text-xs px-3 py-1 bg-gray-800 text-gray-300"
                                    >
                                      {novel.chapterType}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Tags Row */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {novel.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-sm font-bold text-[#F1592A] hover:text-[#F1592A]/80 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setTagSearchInclude(tag);
                                      handleApplyFilters();
                                    }}
                                  >
                                    #{tag.toUpperCase()}
                                  </span>
                                ))}
                              </div>

                              {/* Synopsis */}
                              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                                {novel.synopsis}
                              </p>

                              {/* Stats Row */}
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                <div className="flex items-center gap-1.5">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span>{novel.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{novel.chapters} Chapters</span>
                                </div>
                                <span className="text-gray-600">•</span>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(novel.seriesInfo?.firstReleaseDate)}</span>
                                </div>
                              </div>

                              {/* Genres */}
                              <div className="flex flex-wrap items-center gap-2">
                                {novel.genres.map((g, i) => (
                                  <Badge 
                                    key={i}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm font-bold bg-[#F1592A] hover:bg-[#F1592A]/90 text-white dark:bg-[#F1592A] dark:hover:bg-[#F1592A]/90 dark:text-white transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setSelectedGenres(g.name);
                                      handleApplyFilters();
                                    }}
                                  >
                                    {g.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination Controls */}
                  {filteredNovels.length > 0 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-[#F1592A] hover:bg-[#F1592A] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <span
                                key={`ellipsis-${page}`}
                                className="px-3 py-1 text-[#232120] dark:text-[#E7E7E8]"
                              >
                                ...
                              </span>
                            );
                          }
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => paginate(page)}
                              className={`w-10 ${
                                currentPage === page
                                  ? "bg-[#F1592A] text-white"
                                  : "border-[#F1592A] hover:bg-[#F1592A] hover:text-white"
                              }`}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-[#F1592A] hover:bg-[#F1592A] hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {filteredNovels.length === 0 && (
                <p className="text-center text-[#232120] dark:text-[#E7E7E8] mt-8">
                  No novels found matching your criteria.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

