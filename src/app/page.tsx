'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Search, Menu, BookOpen, Moon, Sun, LogOut, Pencil, ChevronsLeftRightIcon, BookMarked, ThumbsUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/ui/starrating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from "@/components/ui/card"
import { toast } from 'react-hot-toast'
import { NovelCard } from '@/components/NovelCard'


export const genreColors = {
  Fantasy: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-100' },
  "Sci-Fi": { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-100' },
  Romance: { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-900 text-pink-100' },
  Action: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-100' },
  Mystery: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900 text-yellow-100' },
  "Slice of Life": { light: 'bg-green-100 text-green-800', dark: 'bg-green-900 text-green-100' },
  Isekai: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-100' },
  Horror: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-900 text-gray-100' },
}



interface Novel {
  id: string
  name: string
  author: string
  genre: string
  rating: number
  coverUrl: string
  authorId: string
}

export default function ModernLightNovelsHomepage() {
  const [darkMode, setDarkMode] = useState(false)
  const [hoveredNovel, setHoveredNovel] = useState<string | null>(null)
  const [popularNovels, setPopularNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const [followedNovels, setFollowedNovels] = useState<string[]>([])
  const [userType, setUserType] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)

  useEffect(() => {
    fetchPopularNovels()
    if (user) {
      fetchFollowedNovels()
      fetchUserType()
      fetchUserProfile()
    }
  }, [user])

  const fetchPopularNovels = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(8))
      const querySnapshot = await getDocs(q)
      const novels = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        authorId: doc.data().authorId || doc.id // Fallback to doc.id if authorId is not set
      } as Novel))
      setPopularNovels(novels)
    } catch (error) {
      console.error('Error fetching popular novels:', error)
    }
    setLoading(false)
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
    // Update local state if needed
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

  const handleProfileClick = () => {
    if (user) {
      router.push('/user_profile')
    } else {
      router.push('/auth')
    }
  }

  return (
    <motion.div 
      className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleProfileClick}>
            <Avatar>
              {user && userProfile?.profilePicture ? (
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
              <AvatarFallback>{user ? (userProfile?.username?.[0] || '?') : '?'}</AvatarFallback>
            </Avatar>
          </Button>

            <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">NovelHub</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search novels..."
                className="pl-10 pr-4 py-2 w-64 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="bg-gray-200 dark:bg-gray-700"
            >
              <Sun className="h-4 w-4 text-yellow-500" />
              <Moon className="h-4 w-4 text-blue-500" />
            </Switch>
            {user && userType === 'author' && (
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                <ChevronsLeftRightIcon className="h-5 w-5 mr-2" />
                Admin Console
              </Button>
            )}
            {user ? (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => router.push('/auth')}>Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-12 md:py-24 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-900 dark:to-pink-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Your Next Adventure</h2>
            <p className="text-xl text-purple-100 mb-8">Explore thousands of light novels across various genres</p>
            <Button className="bg-white text-purple-600 hover:bg-purple-50">Start Reading Now</Button>
          </div>
        </section>
        <section className="py-12 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
          variants={fadeIn}
        >
          Popular Novels
        </motion.h2>
        {loading ? (
          <div className="text-center">Loading popular novels...</div>
        ) : (
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
          >
            {popularNovels.map((novel) => (
              <motion.div
                key={novel.id}
                variants={fadeIn}
                whileHover={{ scale: 1.05 }}
              >
                <NovelCard novel={novel} onFollowChange={handleFollowChange} />
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div 
          className="mt-12 text-center"
          variants={fadeIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30">
            Browse All Novels
          </Button>
        </motion.div>
      </div>
    </section>
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
              variants={fadeIn}
            >
              Explore Genres
            </motion.h2>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={staggerChildren}
            >
              {Object.entries(genreColors).map(([genre, colors]) => (
                <motion.div
                  key={genre}
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={`/genre/${genre.toLowerCase()}`} className={`p-4 rounded-lg shadow-md text-center block transition-colors ${darkMode ? colors.dark : colors.light}`}>
                    <span className="font-medium">{genre}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
              variants={fadeIn}
            >
              Upcoming Releases
            </motion.h2>
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerChildren}
            >
              {[1, 2, 3].map((release) => (
                <motion.div 
                  key={release}
                  className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md"
                  variants={fadeIn}
                  whileHover={{ scale: 1.03 }}
                >
                  <Image
                    src={`/assets/cover.jpg`}
                    alt={`Upcoming Release ${release}`}
                    width={100}
                    height={150}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <motion.div 
            className="text-center md:text-left mb-4 md:mb-0"
            variants={fadeIn}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              © 2023 NovelHub. All rights reserved.
            </p>
          </motion.div>
          <motion.nav 
            className="flex justify-center md:justify-end space-x-6"
            variants={staggerChildren}
          >
            {["About Us", "Terms", "Privacy", "Contact"].map((item) => (
              <motion.div key={item} variants={fadeIn}>
                <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200">
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