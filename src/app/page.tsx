'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, BookOpen, LogOut, Pencil, ChevronsLeftRightIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/ui/starrating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const genreColors = {
  Fantasy: 'bg-purple-100 text-purple-800',
  "Sci-Fi": 'bg-blue-100 text-blue-800',
  Romance: 'bg-pink-100 text-pink-800',
  Action: 'bg-red-100 text-red-800',
  Mystery: 'bg-yellow-100 text-yellow-800',
  "Slice of Life": 'bg-green-100 text-green-800',
  Isekai: 'bg-indigo-100 text-indigo-800',
  Horror: 'bg-gray-100 text-gray-800',
  default: 'bg-gray-100 text-gray-800',
}

interface Novel {
  id: string
  name: string
  author: string
  genre: string
  rating: number
  coverUrl: string
}

export default function ModernLightNovelsHomepage() {
  const [hoveredNovel, setHoveredNovel] = useState<string | null>(null)
  const [popularNovels, setPopularNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchPopularNovels()
  }, [])

  const fetchPopularNovels = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(8))
      const querySnapshot = await getDocs(q)
      const novels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel))
      setPopularNovels(novels)
    } catch (error) {
      console.error('Error fetching popular novels:', error)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
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
  const getGenreColor = (genre: string): string => {
    return genreColors[genre as keyof typeof genreColors] || genreColors.default;
  }

  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleProfileClick}>
              <Avatar>
                <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                <AvatarFallback>{user?.displayName?.[0] || '?'}</AvatarFallback>
              </Avatar>
            </Button>
            <h1 className="text-2xl font-bold text-purple-600">LightNovelHub</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search novels..."
                className="pl-10 pr-4 py-2 w-64 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {user && (
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
        <section className="py-12 md:py-24 bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Your Next Adventure</h2>
            <p className="text-xl text-purple-100 mb-8">Explore thousands of light novels across various genres</p>
            <Button className="bg-white text-purple-600 hover:bg-purple-50">Start Reading Now</Button>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-900"
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
                  <Link href={`/novel/${novel.id}`} key={novel.id}>
                    <motion.article 
                      className="group relative cursor-pointer"
                      variants={fadeIn}
                      whileHover={{ scale: 1.05 }}
                      onHoverStart={() => setHoveredNovel(novel.id)}
                      onHoverEnd={() => setHoveredNovel(null)}
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-200 aspect-[3/4]">
                        <Image
                          src={novel.coverUrl || '/assets/cover.jpg'}
                          alt={novel.name}
                          layout="fill"
                          objectFit="cover"
                          placeholder="blur"
                          blurDataURL="/assets/placeholder.jpg"
                          loading="eager"
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getGenreColor(novel.genre)}`}>
                          {novel.genre}
                        </div>
                      </div>
                      <motion.div 
                        className="mt-4 space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900">{novel.name}</h3>
                        <p className="text-sm text-gray-600">{novel.author}</p>
                        <StarRating rating={novel.rating} />
                      </motion.div>
                    </motion.article>
                  </Link>
                ))}
              </motion.div>
            )}
            <motion.div 
              className="mt-12 text-center"
              variants={fadeIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                Browse All Novels
              </Button>
            </motion.div>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-900"
              variants={fadeIn}
            >
              Explore Genres
            </motion.h2>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={staggerChildren}
            >
              {Object.entries(genreColors).map(([genre, color]) => (
                genre !== 'default' && (
                  <motion.div
                    key={genre}
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={`/genre/${genre.toLowerCase()}`} className={`p-4 rounded-lg shadow-md text-center block transition-colors ${color}`}>
                      <span className="font-medium">{genre}</span>
                    </Link>
                  </motion.div>
                )
              ))}
            </motion.div>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold mb-8 text-gray-900"
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
                  className="flex items-center space-x-4 bg-gray-50 p-6 rounded-lg shadow-md"
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
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <motion.div 
            className="text-center md:text-left mb-4 md:mb-0"
            variants={fadeIn}
          >
            <p className="text-sm text-gray-600">
              © 2023 NovelHub. All rights reserved.
            </p>
          </motion.div>
          <motion.nav 
            className="flex justify-center md:justify-end space-x-6"
            variants={staggerChildren}
          >
            {["About Us", "Terms", "Privacy", "Contact"].map((item) => (
              <motion.div key={item} variants={fadeIn}>
                <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
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