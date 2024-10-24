'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Check, ChevronLeft, ChevronRight, BookOpen, X, Home, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useAuth } from '../authcontext'
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { toast } from 'react-hot-toast'
import Image from "next/image"
import { useRouter, useSearchParams } from 'next/navigation'
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react"
import { Redis } from '@upstash/redis'
import dynamic from 'next/dynamic'
import { LucideProps } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import LoadingSpinner from '@/components/LoadingSpinner'
import { genreColors } from '../genreColors'
import { Suspense } from 'react'

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


// Initialize Redis client
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_REDIS_URL,
  token: process.env.NEXT_PUBLIC_REDIS_TOKEN,
})

interface Novel {
  id: string
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

interface NovelIndex {
  [key: string]: Set<string>
}

const CACHE_KEY = 'novelHubCache'
const CACHE_EXPIRATION = 60 * 60 * 1000 // 1 hour in milliseconds
const FILTER_STATE_KEY = 'novelHubFilterState'

function BrowsePageContent() {
  const { theme, setTheme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [appliedGenres, setAppliedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortCriteria, setSortCriteria] = useState<'releaseDate' | 'name'>('releaseDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination states
  const [itemsPerPage] = useState(2)

  const searchParams = useSearchParams()

  // Load filter state from localStorage on initial render
  useEffect(() => {
    const savedFilterState = localStorage.getItem(FILTER_STATE_KEY)
    if (savedFilterState) {
      const { appliedGenres, selectedTags, searchTerm } = JSON.parse(savedFilterState)
      setAppliedGenres(appliedGenres)
      setSelectedGenres(appliedGenres)
      setSelectedTags(selectedTags)
      setSearchTerm(searchTerm)
    }

    const genreFromUrl = searchParams.get('genre')
    if (genreFromUrl) {
      setSelectedGenres([genreFromUrl])
      setAppliedGenres([genreFromUrl])
    }
  }, [searchParams])

  const fetchNovels = useCallback(async () => {
    try {
      // Try to get data from Redis cache first
      let cachedNovels;
      try {
        cachedNovels = await redis.get('all_novels');
        console.log("Raw data from Redis:", cachedNovels);
      } catch (redisError) {
        console.error("Error fetching from Redis:", redisError);
        // If Redis fails, we'll fall back to Firebase
      }
      
      if (cachedNovels && Array.isArray(cachedNovels) && cachedNovels.length > 0) {
        console.log("Using cached data from Redis");
        setNovels(cachedNovels);
        setFilteredNovels(cachedNovels);
        return;
      }

      // If not in cache or invalid, fetch from Firebase
      console.log("Fetching from Firebase");
      let novelsRef = collection(db, 'novels');
      let q = query(novelsRef, orderBy('title'));

      const querySnapshot = await getDocs(q);
      const fetchedNovels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        genres: doc.data().genres || [], // Ensure genres is an array
        likes: doc.data().likes || 0,
        synopsis: doc.data().synopsis || 'No synopsis available.',
        rating: doc.data().rating || 0,
        tags: doc.data().tags || [],
      } as Novel));

      console.log("Fetched novels from Firebase:", fetchedNovels);
      
      // Store fetched data in Redis cache
      try {
        await redis.set('all_novels', JSON.stringify(fetchedNovels), { ex: 3600 }); // Cache for 1 hour
        console.log("Stored novels in Redis cache");
      } catch (cacheError) {
        console.error("Error storing novels in Redis cache:", cacheError);
      }

      setNovels(fetchedNovels);
      setFilteredNovels(fetchedNovels);
    } catch (error) {
      console.error("Error fetching novels:", error);
      toast.error("Failed to load novels. Please try again later.");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      console.log("Fetching novels...");
      await fetchNovels();
      setIsLoading(false);
    };
    loadData();
  }, []); // Ensure this useEffect only runs once on mount

  const applyFilters = useCallback((novelsList: Novel[] = novels) => {
    let filtered = novelsList.filter(novel => {
      const searchTermLower = searchTerm.toLowerCase()
      const genresLower = novel.genres.map(g => g.name.toLowerCase())
      const tagsLower = novel.tags.map(tag => tag.toLowerCase())

      const matchesSearch = 
        novel.title.toLowerCase().includes(searchTermLower) ||
        novel.publishers.original.toLowerCase().includes(searchTermLower) ||
        genresLower.some(genre => genre.includes(searchTermLower)) ||
        tagsLower.some(tag => tag.includes(searchTermLower))

      const matchesGenre = selectedGenres.length === 0 || 
        selectedGenres.map(g => g.toLowerCase()).some(selected => genresLower.includes(selected))
      const matchesTag = selectedTags.length === 0 || 
        novel.tags.some(tag => selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))

      return matchesSearch && matchesGenre && matchesTag
    })

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortCriteria === 'name') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
    })

    console.log("Filtered and sorted novels:", filtered)
    setFilteredNovels(filtered)
    setCurrentPage(1)

    // Save filter state to localStorage
    localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
      appliedGenres: selectedGenres,
      selectedTags,
      searchTerm
    }))
  }, [novels, searchTerm, selectedGenres, selectedTags, sortCriteria, sortOrder])

  const handleApplyFilters = useCallback(() => {
    applyFilters(novels);
  }, [applyFilters, novels]);

  

  const getSortButtonText = () => {
    if (sortCriteria === 'name') {
      return sortOrder === 'asc' ? 'A-Z' : 'Z-A'
    } else {
      return sortOrder === 'desc' ? 'Newest first' : 'Oldest first'
    }
  }

  const handleResetFilters = () => {
    setSelectedGenres([])
    setAppliedGenres([])
    setSelectedTags([])
    setSearchTerm('')
    setCurrentPage(1)
    
    // Apply current sorting to all novels
    const sortedNovels = [...novels].sort((a, b) => {
      if (sortCriteria === 'name') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
    })
    
    setFilteredNovels(sortedNovels)
    localStorage.removeItem(FILTER_STATE_KEY)
  }

  const toggleGenre = (genre: string) => {
    console.log('Toggling genre:', genre);
    setSelectedGenres(prev => {
      const currentGenres = prev || [];
      return currentGenres.some(g => g.toLowerCase() === genre.toLowerCase())
        ? currentGenres.filter(g => g.toLowerCase() !== genre.toLowerCase())
        : [...currentGenres, genre]
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.some(t => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    )
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

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    setCurrentPage(1)
  }

  const changeSortCriteria = (criteria: 'releaseDate' | 'name') => {
    setSortCriteria(criteria)
    setCurrentPage(1)
  }

  // Pagination logic
  const indexOfLastNovel = currentPage * itemsPerPage
  const indexOfFirstNovel = indexOfLastNovel - itemsPerPage
  const currentNovels = filteredNovels.slice(indexOfFirstNovel, indexOfLastNovel)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const renderPageNumbers = () => {
    const pageNumbers = []
    const totalPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + totalPagesToShow - 1)

    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(1, endPage - totalPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          onClick={() => changePage(i)}
          variant={i === currentPage ? "default" : "outline"}
          className={`px-3 py-2 rounded ${i === currentPage ? 'bg-[#F1592A] text-white' : ''}`}
        >
          {i}
        </Button>
      )
    }

    return pageNumbers
  }

  const resetFilters = () => {
    setSelectedGenres([])
    setSelectedTags([])
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleSearch = () => {
    handleApplyFilters()
  }

  useEffect(() => {
    const savedFilterState = localStorage.getItem(FILTER_STATE_KEY)
    if (savedFilterState) {
      const { appliedGenres, selectedTags, searchTerm } = JSON.parse(savedFilterState)
      setAppliedGenres(appliedGenres)
      setSelectedGenres(appliedGenres)
      setSelectedTags(selectedTags)
      setSearchTerm(searchTerm)
    }
  }, [])

  useEffect(() => {
    // Apply filters and sorting
    const filtered = novels.filter(novel => {
      const matchesGenre = selectedGenres.length === 0 || 
        selectedGenres.map(g => g.toLowerCase()).some(g => novel.genres.map(genre => genre.name.toLowerCase()).includes(g))
      const matchesTag = selectedTags.length === 0 || 
        novel.tags.some(tag => selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
      const matchesSearch = searchTerm === '' ||
        novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        novel.publishers.original.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesGenre && matchesTag && matchesSearch
    })

    const sorted = [...filtered].sort((a, b) => {
      if (sortCriteria === 'name') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
    })

    setFilteredNovels(sorted)
    setCurrentPage(1)
  }, [novels, selectedGenres, selectedTags, searchTerm, sortCriteria, sortOrder])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [isLoading, setIsLoading] = useState(true)

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
      
      <main className="container mx-auto px-4 py-8 flex">
        <aside className="w-full md:w-64 pr-8 mb-8 md:mb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8]">Filters</h2>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-[#232120] dark:text-[#E7E7E8]">Genres</h3>
            <div className="space-y-2">
              {Object.keys(genreColors).map((genre) => {
                const isSelected = (selectedGenres || []).map(g => g.toLowerCase()).includes(genre.toLowerCase())
                const colorScheme = getColorScheme(genre)
                return (
                  <Button
                    key={genre}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleGenre(genre);
                    }}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-between ${isSelected ? (theme === 'dark' ? colorScheme.dark : colorScheme.light) : ''}`}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check size={16} />}
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="flex space-x-2 mb-6">
            <Button onClick={handleApplyFilters} className="flex-1 bg-[#F1592A] text-white hover:bg-[#E7E7E8] hover:border-2 hover:border-[#F1592A] hover:text-[#F1592A] dark:hover:bg-[#232120]">Apply</Button>
            <Button onClick={handleResetFilters} variant="outline" className="flex-1">Reset</Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-[#232120] dark:text-[#E7E7E8]">Tags</h3>
            <div className="space-y-2">
              {Object.keys(genreColors).map((tag) => {
                const isSelected = selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
                const colorScheme = getColorScheme(tag)
                return (
                  <Button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-between ${isSelected ? (theme === 'dark' ? colorScheme.dark : colorScheme.light) : ''}`}
                  >
                    <span>{tag}</span>
                    {isSelected && <Check size={16} />}
                  </Button>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold  text-[#232120] dark:text-[#E7E7E8]">Browse Novels</h1>
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
                key={novel.id}
                className="bg-white dark:bg-black rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => handleTileClick(novel.id)}
              >
                <div className="flex p-4">
                  <div className="flex-shrink-0 w-24 h-36 mr-4 relative group">
                    <div className="relative w-24 h-36">
                      <Image
                        src={novel.coverPhoto || '/placeholder.svg'}
                        alt={novel.title}
                        fill
                        sizes="96px"
                        priority={index < 3}
                        style={{ objectFit: "cover" }}
                        className="rounded"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReadNow(novel.id)
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

          {}
          {filteredNovels.length > itemsPerPage && (
            <div className="flex justify-center mt-8 space-x-2">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              {Array.from({ length: Math.ceil(filteredNovels.length / itemsPerPage) }, (_, i) => (
                <Button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(filteredNovels.length / itemsPerPage)}
                variant="outline"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {filteredNovels.length === 0 && (
            <p className="text-center text-[#232120] dark:text-[#E7E7E8] mt-8">No novels found matching your criteria.</p>
          )}
        </div>
      </main>
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
