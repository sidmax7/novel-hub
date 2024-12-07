'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search,Moon, Sun, LogOut, User, ChevronsLeftRightIcon, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion} from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NovelCard } from '@/components/NovelCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from 'next-themes'
import LoadingSpinner from '@/components/LoadingSpinner' // Add this import
import { genreColors } from './genreColors'
import WeeklyBookSection from '@/components/WeeklySection'
import { NovelRankings } from '@/components/NovelRanking'
import { LatestReleasesCarousel } from '@/components/CarouselList'
import { NovelCarouselSection } from '@/components/NovelCarouselSection'


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
  metadata?: {
    createdAt: any;
    updatedAt: any;
  }
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: any
  image?: string
}

const CACHE_KEY = 'popularNovels'
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const LATEST_CACHE_KEY = 'latestNovels'

const fetchPopularNovels = async () => {
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data.slice(0, 10)
    }
  }

  // If cache is invalid or expired, fetch from Firestore
  const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(10))
  const querySnapshot = await getDocs(q)
  const novels = querySnapshot.docs.map(doc => ({ 
    novelId: doc.id, 
    ...doc.data(),
    genres: doc.data().genres || []
  } as Novel)).slice(0, 10)

  // Cache the fetched data
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: novels, timestamp: Date.now() }))

  return novels
}

const fetchLatestNovels = async () => {
  const cachedData = localStorage.getItem(LATEST_CACHE_KEY)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data.slice(0, 20)
    }
  }

  // If cache is invalid or expired, fetch from Firestore
  const q = query(
    collection(db, 'novels'), 
    orderBy('metadata.createdAt', 'desc'), 
    limit(20)
  )
  const querySnapshot = await getDocs(q)
  const novels = querySnapshot.docs.map(doc => ({ 
    novelId: doc.id, 
    ...doc.data(),
    genres: doc.data().genres || []
  } as Novel)).slice(0, 10)

  // Cache the fetched data
  localStorage.setItem(LATEST_CACHE_KEY, JSON.stringify({ 
    data: novels, 
    timestamp: Date.now() 
  }))

  return novels
}

export default function ModernLightNovelsHomepage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [popularNovels, setPopularNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const [followedNovels, setFollowedNovels] = useState<string[]>([])
  const [userType, setUserType] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
  const [latestNovels, setLatestNovels] = useState<Novel[]>([])
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [autoSlideInterval, setAutoSlideInterval] = useState<NodeJS.Timeout | null>(null);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setMounted(true)
    const loadNovels = async () => {
      setLoading(true)
      try {
        const [popular, latest] = await Promise.all([
          fetchPopularNovels(),
          fetchLatestNovels()
        ])
        setPopularNovels(popular)
        setLatestNovels(latest)
      } catch (error) {
        console.error('Error fetching novels:', error)
      }
      setLoading(false)
    }

    loadNovels()
    if (user) {
      fetchFollowedNovels()
      fetchUserType()
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    const loadAnnouncements = async () => {
      const data = await fetchAnnouncements()
      setAnnouncements(data)
    }
    loadAnnouncements()
  }, [])

  useEffect(() => {
    const filteredNovels = popularNovels.filter(novel => novel.coverPhoto && novel.title).slice(0, 5);
    if (filteredNovels.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(current => 
        current < filteredNovels.length - 1 ? current + 1 : 0
      );
    }, 5000); // Change slide every 5 seconds

    setAutoSlideInterval(interval);

    return () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
      }
    };
  }, [popularNovels]);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        setUserProfile({
          profilePicture: userData.profilePicture || '',
          username: userData.username || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchFollowedNovels = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setFollowedNovels(userData.followedNovels || [])
      }
    } catch (error) {
      console.error('Error fetching followed novels:', error)
    }
  }

  const fetchUserType = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserType(userData.userType || null)
      }
    } catch (error) {
      console.error('Error fetching user type:', error)
    }
  }

  const handleFollowChange = (novelId: string, isFollowing: boolean) => {
    setFollowedNovels(prev => 
      isFollowing ? [...prev, novelId] : prev.filter(id => id !== novelId)
    )
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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

  const ThemeToggle = () => {
    if (!mounted) return null

    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-[#E7E7E8]" />
        ) : (
          <Moon className="h-4 w-4 text-[#232120] group-hover:text-white" />
        )}
      </Button>
    )
  }

  const fetchAnnouncements = async () => {
    const q = query(
      collection(db, 'forumPosts'),
      where('section', '==', 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Announcement))
  }

  return (
    <motion.div 
      className={`flex flex-col min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#E7E7E8] dark:bg-[#232120]`}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#F1592A]">
              <Link 
                href="/" 
                className="text-[#F1592A] dark:text-[#F1592A] hover:text-[#232120] dark:hover:text-[#E7E7E8] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTop();
                }}
              >
                Novellize
              </Link>
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link href="/forum" passHref>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 dark:border-opacity-50 dark:border-[#F1592A] bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                <MessageSquare className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                <span className="sr-only">Forum</span>
              </Button>
            </Link>
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarImage src={userProfile?.profilePicture} alt={userProfile?.username} />
                    <AvatarFallback>{userProfile?.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/user_profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {userType === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <ChevronsLeftRightIcon className="mr-2 h-4 w-4" />
                        <span>Admin Console</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {userType === 'author' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <ChevronsLeftRightIcon className="mr-2 h-4 w-4" />
                        <span>Author Console</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" onClick={() => router.push('/auth')} className="text-[#F1592A] text-sm md:text-base">Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background image with blur and tint */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/hero-section.jpg"
            alt="Background"
            fill
            className="object-cover blur-lg brightness-75 [mask-image:linear-gradient(to_bottom,rgba(241,89,42,0.3),rgba(0,0,0,0.5))]"
            priority
            style={{
              backgroundColor: 'rgba(241, 89, 42, 0.3)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left column: Logo and Brand */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
              <Image
                src="/assets/favicon.png"
                alt="Company Logo"
                width={300}
                height={300}
                className="mb-6 mx-auto p-2"
                priority
              />
              <h1 className="text-3xl rounded-md bg-opacity-60 bg-gray-200 dark:bg-opacity-60 dark:bg-[#232120] md:text-4xl lg:text-5xl font-bold text-[#F1592A] mb-4 text-center md:text-left mx-auto pb-2 pt-1 px-2">
                Novellize
              </h1>
            </div>

            {/* Right column: Company Description */}
            <div className="w-full md:w-1/2 dark:text-[#E7E7E8] text-[#232120]">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold dark:text-[#E7E7E8] text-[#232120] mb-4 text-center md:text-left">
                Discover Your Next Adventure
              </h2>
              <p className="text-base md:text-lg lg:text-xl dark:text-[#E7E7E8] text-[#232120] mb-6 text-center md:text-left">
                Explore thousands of light novels across various genres. Our platform offers a vast collection of captivating stories, from fantasy and romance to sci-fi and mystery. Immerse yourself in new worlds, follow intriguing characters, and experience thrilling adventures - all at your fingertips.
              </p>
              <p className="text-base md:text-lg dark:text-[#E7E7E8] text-[#232120] text-center md:text-left">
                Whether you're a seasoned light novel enthusiast or new to the genre, our curated selection ensures there's something for everyone. Start your journey today and unlock the power of imagination!
              </p>
            </div>
          </div>
        </div>
      </section>

      <NovelRankings
          newReleases={latestNovels}
          trending={popularNovels}
          popular={popularNovels}
        />

    <WeeklyBookSection popularNovels={popularNovels} announcements={announcements} />

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
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
            variants={staggerChildren}
          >
            {latestNovels.map((novel) => (
              <motion.div
                key={novel.novelId}
                variants={fadeIn}
                whileHover={{ scale: 1.05 }}
              >
                <NovelCard novel={novel as any} onFollowChange={handleFollowChange} />
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div 
              className="mt-8 md:mt-12 text-center"
              variants={fadeIn}
              whileHover={{ scale: 1.05  }}
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
    <LatestReleasesCarousel
          novels={latestNovels}
          loading={loading}
          onFollowChange={handleFollowChange}
        />

<NovelCarouselSection 
        novels={latestNovels}
        sectionTitle="New Arrivals"
        category="latest"
      />

        {/* <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-6 text-[#232120] dark:text-[#E7E7E8]"
              variants={fadeIn}
            >
              Popular Novels
            </motion.h2>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <LoadingSpinner />
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
                variants={staggerChildren}
              >
                {popularNovels.map((novel) => (
                  <motion.div
                    key={novel.novelId}
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                  >
                    <NovelCard novel={novel as any} onFollowChange={handleFollowChange} />
                  </motion.div>
                ))}
              </motion.div>
            )}
            <motion.div 
              className="mt-8 md:mt-12 text-center"
              variants={fadeIn}
              whileHover={{ scale: 1.05  }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/browse">
                <Button variant="outline" className="border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8]">
                  Browse All Novels
                </Button>
              </Link>
            </motion.div>
          </div>
        </section> */}

        <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className={`container rounded-lg mx-auto px-6 md:px-12 py-8 md:py-12 ${
            mounted && theme === 'dark'
              ? 'bg-black dark:bg-[#3E3F3E]'
              : 'bg-white dark:bg-[#3E3F3E] border border-[#F1592A] border-opacity-30'
          } backdrop-blur-md`}>
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100"
              variants={fadeIn}
            >
              Explore Genres
            </motion.h2>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={staggerChildren}
            >
              {Object.entries(genreColors)
                .slice(0, showAllGenres ? undefined : 16)
                .map(([genre, colors]) => (
                  <motion.div
                    key={genre}
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href={`/browse?genre=${encodeURIComponent(genre.toLowerCase())}`}
                      className={`p-4 md:p-6 rounded-lg shadow-md text-center block transition-colors h-full
                      ${mounted ? (theme === 'dark' ? colors.dark : colors.light) : colors.dark}`}
                    >
                      <span className="font-medium text-base md:text-lg">{genre}</span>
                    </Link>
                  </motion.div>
                ))}
            </motion.div>
            
            {/* Add Show More/Less Button */}
            <motion.div 
              className="mt-8 text-center"
              variants={fadeIn}
            >
              <Button
                variant="outline"
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8]"
              >
                {showAllGenres ? 'Show Less' : 'Show More'}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100"
              variants={fadeIn}
            >
              Upcoming Releases
            </motion.h2>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
              variants={staggerChildren}
            >
              {[1, 2, 3].map((release) => (
                <motion.div 
                  key={release}
                  className="flex flex-col md:flex-row items-center space-y-2 md:space-x-4 bg-gray-50 dark:bg-[#232120] p-4 rounded-lg"
                  variants={fadeIn}
                  whileHover={{ scale: 1.03 }}
                >
                  <Image
                    src={`/assets/cover.jpg`}
                    alt={`Upcoming Release ${release}`}
                    width={100}
                    height={150}
                    className="w-full md:w-auto h-auto md:h-[150px] object-cover rounded"
                  />
                  <div className="flex flex-col justify-center">
                    <h3 className="font-semibold text-lg mb-1">Novel Title {release}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Published by Publisher Name</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Release Date: Soon</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section> */}
      </main>
      <footer className="border-t py-6 md:py-8 bg-white dark:bg-[#232120] dark:border-[#3E3F3E]">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <motion.div 
            className="text-center md:text-left mb-4 md:mb-0"
            variants={fadeIn}
          >
            <p className="text-sm text-[#464646] dark:text-[#C3C3C3]">
              © 2024 Novellize. All rights reserved.
            </p>
          </motion.div>
          <motion.nav 
            className="flex justify-center md:justify-end space-x-4 md:space-x-6"
            variants={staggerChildren}
          >
            {["About Us", "Terms", "Privacy", "Contact"].map((item) => (
              <motion.div key={item} variants={fadeIn}>
                <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-[#464646] hover:text-[#232120] dark:text-[#C3C3C3] dark:hover:text-[#E7E7E8] transition-colors duration-200">
                  {item}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </footer>
    </motion.div>
  )
}
