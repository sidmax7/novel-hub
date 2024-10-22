'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, Moon, Sun, LogOut, User, ChevronsLeftRightIcon, MessageSquare } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'
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


interface Novel {
  id: string
  name: string
  author: string
  genre: string
  rating: number
  coverUrl: string
  authorId: string
  likes?: number;
}

const CACHE_KEY = 'popularNovels'
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutes in milliseconds

const fetchPopularNovels = async () => {
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data
    }
  }

  // If cache is invalid or expired, fetch from Firestore
  const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(10))
  const querySnapshot = await getDocs(q)
  const novels = querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    authorId: doc.data().authorId || doc.id
  } as Novel))

  // Cache the fetched data
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: novels, timestamp: Date.now() }))

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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setMounted(true)
    const loadPopularNovels = async () => {
      setLoading(true)
      try {
        const novels = await fetchPopularNovels()
        setPopularNovels(novels)
      } catch (error) {
        console.error('Error fetching popular novels:', error)
      }
      setLoading(false)
    }

    loadPopularNovels()
    if (user) {
      fetchFollowedNovels()
      fetchUserType()
      fetchUserProfile()
    }
  }, [user])

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

  return (
    <motion.div 
      className={`flex flex-col min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#E7E7E8] dark:bg-[#232120]`}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-10 shadow-sm">
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
                NovelHub
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar>
                      {userProfile?.profilePicture ? (
                        <AvatarImage
                          src={userProfile.profilePicture}
                          alt="User avatar"
                          className="object-cover"
                        />
                      ) : (
                        <AvatarImage
                          src="/assets/default-avatar.png"
                          alt="Default avatar"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback>{userProfile?.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
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
                  {userType === 'author' && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <ChevronsLeftRightIcon className="mr-2 h-4 w-4" />
                      <span>Admin Console</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!user && (
              <Button variant="ghost" onClick={() => router.push('/auth')} className="text-[#F1592A] text-sm md:text-base">Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 lg:py-24 bg-gradient-to-br from-[#F1592A] to-[#3E3F3E] dark:from-[#3E3F3E] dark:to-[#F1592A] flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#E7E7E8] mb-4">Discover Your Next Adventure</h2>
            <p className="text-base md:text-lg lg:text-xl text-[#E7E7E8] mb-6">Explore thousands of light novels across various genres</p>
            <div className="relative inline-block w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#232120]/60 dark:text-[#E7E7E8]/60" />
              <Input
                type="search"
                placeholder="Search novels..."
                className="pl-10 pr-4 py-2 w-full rounded-full bg-[#E7E7E8] dark:bg-[#232120] focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder-[#8E8F8E] dark:placeholder-[#C3C3C3]"
              />
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
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
                    key={novel.id}
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                  >
                    <NovelCard novel={{...novel, likes: 0}} onFollowChange={handleFollowChange} />
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

        <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className={`container rounded-lg mx-auto px-6 md:px-12 py-8 md:py-12 ${
                theme === 'dark'
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
              {Object.entries(genreColors).map(([genre, colors]) => (
                <motion.div
                  key={genre}
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={`/genre/${genre.toLowerCase()}`} 
                    className={`p-4 md:p-6 rounded-lg shadow-md text-center block transition-colors h-full
                    ${theme === 'dark' ? colors.dark : colors.light}`}
                  >
                    <span className="font-medium text-base md:text-lg">{genre}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120]">
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
                  className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg shadow-md"
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">Author Name</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Release Date: Soon</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8 bg-white dark:bg-[#232120] dark:border-[#3E3F3E]">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <motion.div 
            className="text-center md:text-left mb-4 md:mb-0"
            variants={fadeIn}
          >
            <p className="text-sm text-[#464646] dark:text-[#C3C3C3]">
              © 2023 NovelHub. All rights reserved.
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
