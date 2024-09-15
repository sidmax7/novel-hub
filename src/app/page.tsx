// 'use client'

// import { useState, useEffect } from 'react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Switch } from "@/components/ui/switch"
// import { Search, Menu, BookOpen, Star, Moon, Sun, LogOut } from "lucide-react"
// import Image from "next/image"
// import Link from "next/link"
// import { motion, AnimatePresence } from 'framer-motion'
// import { useAuth } from './authcontext'
// import { signOut } from 'firebase/auth'
// import { auth, db } from '@/lib/firebaseConfig'
// import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
// import { useRouter } from 'next/navigation'

// export const genreColors = {
//   Fantasy: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-100' },
//   "Sci-Fi": { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-100' },
//   Romance: { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-900 text-pink-100' },
//   Action: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-100' },
//   Mystery: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900 text-yellow-100' },
//   "Slice of Life": { light: 'bg-green-100 text-green-800', dark: 'bg-green-900 text-green-100' },
//   Isekai: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-100' },
//   Horror: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-900 text-gray-100' },
// }

// interface Novel {
//   id: string
//   name: string
//   author: string
//   genre: string
//   rating: number
//   coverUrl: string
// }

// const StarRating = ({ rating }: { rating: number }) => {
//   return (
//     <div className="flex items-center">
//       {[...Array(5)].map((_, i) => (
//         <svg
//           key={i}
//           className="w-4 h-4 text-yellow-400"
//           fill="currentColor"
//           viewBox="0 0 20 20"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <defs>
//             <linearGradient id={`star-gradient-${i}`}>
//               <stop offset={`${Math.max(Math.min((rating - i) * 100, 100), 0)}%`} stopColor="currentColor" />
//               <stop offset={`${Math.max(Math.min((rating - i) * 100, 100), 0)}%`} stopColor="transparent" stopOpacity="1" />
//             </linearGradient>
//           </defs>
//           <path
//             d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
//             fill={`url(#star-gradient-${i})`}
//           />
//         </svg>
//       ))}
//     </div>
//   )
// }

// export default function ModernLightNovelsHomepage() {
//   const [darkMode, setDarkMode] = useState(false)
//   const [hoveredNovel, setHoveredNovel] = useState<string | null>(null)
//   const [popularNovels, setPopularNovels] = useState<Novel[]>([])
//   const [loading, setLoading] = useState(true)
//   const { user } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     fetchPopularNovels()
//   }, [])

//   const fetchPopularNovels = async () => {
//     setLoading(true)
//     try {
//       const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(8))
//       const querySnapshot = await getDocs(q)
//       const novels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel))
//       setPopularNovels(novels)
//     } catch (error) {
//       console.error('Error fetching popular novels:', error)
//     }
//     setLoading(false)
//   }

//   const handleLogout = async () => {
//     try {
//       await signOut(auth)
//       router.push('/')
//     } catch (error) {
//       console.error('Error signing out:', error)
//     }
//   }

//   const fadeIn = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1, transition: { duration: 0.5 } }
//   }

//   const staggerChildren = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1
//       }
//     }
//   }

//   return (
//     <motion.div 
//       className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}
//       initial="hidden"
//       animate="visible"
//       variants={fadeIn}
//     >
//       <header className="border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <motion.div
//             initial={{ x: -20, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             transition={{ duration: 0.5 }}
//           >
//             <Link href="/" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
//               NovelHub
//             </Link>
//           </motion.div>
//           <nav className="hidden md:flex space-x-6">
//             {["Browse", "Genres", "New Releases", "Community"].map((item, index) => (
//               <motion.div
//                 key={item}
//                 initial={{ y: -20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: index * 0.1 }}
//               >
//                 <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200">
//                   {item}
//                 </Link>
//               </motion.div>
//             ))}
//           </nav>
//           <div className="flex items-center space-x-4">
//             <form className="hidden md:flex items-center">
//               <Input
//                 type="search"
//                 placeholder="Search novels..."
//                 className="w-full sm:w-[300px] mr-2 dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//               />
//               <Button type="submit" size="icon" variant="ghost" className="dark:text-gray-100">
//                 <Search className="h-4 w-4" />
//                 <span className="sr-only">Search</span>
//               </Button>
//             </form>
//             <motion.div
//               className="flex items-center space-x-2"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               {user ? (
//                 <div className="flex items-center space-x-4">
//                   <span className="text-sm text-gray-600 dark:text-gray-300">
//                     Welcome, {user.displayName || user.email}
//                   </span>
//                   <Button variant="outline" size="sm" onClick={handleLogout} className="text-gray-600 dark:text-gray-300">
//                     <LogOut className="h-4 w-4 mr-2" />
//                     Log Out
//                   </Button>
//                 </div>
//               ) : (
//                 <Link href="/auth">
//                   <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-300">
//                     Log In
//                   </Button>
//                 </Link>
//               )}
//               <Switch
//                 checked={darkMode}
//                 onCheckedChange={setDarkMode}
//                 className="data-[state=checked]:bg-gray-600"
//               />
//               <span className="sr-only">Toggle dark mode</span>
//               <AnimatePresence mode="wait" initial={false}>
//                 <motion.div
//                   key={darkMode ? 'dark' : 'light'}
//                   initial={{ y: -20, opacity: 0 }}
//                   animate={{ y: 0, opacity: 1 }}
//                   exit={{ y: 20, opacity: 0 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   {darkMode ? (
//                     <Sun className="h-4 w-4 text-gray-100" />
//                   ) : (
//                     <Moon className="h-4 w-4 text-gray-900" />
//                   )}
//                 </motion.div>
//               </AnimatePresence>
//             </motion.div>
//             <Button variant="ghost" size="icon" className="md:hidden dark:text-gray-100">
//               <Menu className="h-4 w-4" />
//               <span className="sr-only">Menu</span>
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="flex-grow">
//       <section className="py-12 md:py-24 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-900 dark:to-pink-900">
//           <div className="container mx-auto px-4">
//             <motion.div 
//               className="grid md:grid-cols-2 gap-12 items-center"
//               variants={staggerChildren}
//             >
//               <motion.div className="space-y-6" variants={fadeIn}>
//                 <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
//                   Featured Series: "The Enchanted Chronicles"
//                 </h1>
//                 <p className="text-gray-100 md:text-lg">
//                   Dive into a world of magic and adventure with our bestselling novel series.
//                 </p>
//                 <div className="flex items-center space-x-1 text-yellow-300">
//                   {[...Array(5)].map((_, i) => (
//                     <Star key={i} className="h-5 w-5 fill-current" />
//                   ))}
//                   <span className="text-gray-100 ml-2 text-sm">(4.9/5 - 2,345 reviews)</span>
//                 </div>
//                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                   <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700">
//                     Start Reading
//                   </Button>
//                 </motion.div>
//               </motion.div>
//               <motion.div
//                 variants={fadeIn}
//                 whileHover={{ scale: 1.05 }}
//                 transition={{ type: "spring", stiffness: 300 }}
//                 className="relative"
//               >
//                 <Image
//                   src="/assets/cover.jpg"
//                   alt="The Enchanted Chronicles Cover"
//                   width={300}
//                   height={400}
//                   className="rounded-lg shadow-2xl mx-auto"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
//               </motion.div>
//             </motion.div>
//           </div>
//         </section>
//         <section className="py-12 bg-white dark:bg-gray-800">
//           <div className="container mx-auto px-4">
//             <motion.h2 
//               className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
//               variants={fadeIn}
//             >
//               Popular Novels
//             </motion.h2>
//             {loading ? (
//               <div className="text-center">Loading popular novels...</div>
//             ) : (
//               <motion.div 
//                 className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
//                 variants={staggerChildren}
//               >
//                 {popularNovels.map((novel) => (
//                   <motion.article 
//                     key={novel.id}
//                     className="group relative"
//                     variants={fadeIn}
//                     whileHover={{ scale: 1.05 }}
//                     onHoverStart={() => setHoveredNovel(novel.id)}
//                     onHoverEnd={() => setHoveredNovel(null)}
//                   >
//                     <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
//                       <Image
//                         src={novel.coverUrl || '/assets/cover.jpg'}
//                         alt={novel.name}
//                         width={300}
//                         height={400}
//                         className="w-full object-cover transition-transform duration-300 group-hover:scale-110"
//                       />
//                       <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                     </div>
//                     <motion.div 
//                       className="mt-4 space-y-2"
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{novel.name}</h3>
//                       <p className="text-sm text-gray-600 dark:text-gray-300">{novel.author}</p>
//                       <StarRating rating={novel.rating} />
//                       <AnimatePresence>
//                         {hoveredNovel === novel.id && (
//                           <motion.div
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: 10 }}
//                             transition={{ duration: 0.2 }}
//                             className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90"
//                           >
//                             <Link href={`/novel/${novel.id}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center">
//                               <BookOpen className="h-4 w-4 mr-1" /> Read Now
//                             </Link>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </motion.div>
//                   </motion.article>
//                 ))}
//               </motion.div>
//             )}
//             <motion.div 
//               className="mt-12 text-center"
//               variants={fadeIn}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30">
//                 Browse All Novels
//               </Button>
//             </motion.div>
//           </div>
//         </section>
//         <section className="py-12 bg-white dark:bg-gray-800">
//           <div className="container mx-auto px-4">
//             <motion.h2 
//               className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
//               variants={fadeIn}
//             >
//               Explore Genres
//             </motion.h2>
//             <motion.div 
//               className="grid grid-cols-2 md:grid-cols-4 gap-4"
//               variants={staggerChildren}
//             >
//               {Object.entries(genreColors).map(([genre, colors]) => (
//                 <motion.div
//                   key={genre}
//                   variants={fadeIn}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                 >
//                   <Link href={`/genre/${genre.toLowerCase()}`} className={`p-4 rounded-lg shadow-md text-center block transition-colors ${darkMode ? colors.dark : colors.light}`}>
//                     <span className="font-medium">{genre}</span>
//                   </Link>
//                 </motion.div>
//               ))}
//             </motion.div>
//           </div>
//         </section>
//         <section className="py-12 bg-white dark:bg-gray-800">
//           <div className="container mx-auto px-4">
//             <motion.h2 
//               className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100"
//               variants={fadeIn}
//             >
//               Upcoming Releases
//             </motion.h2>
//             <motion.div 
//               className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
//               variants={staggerChildren}
//             >
//               {[1, 2, 3].map((release) => (
//                 <motion.div 
//                   key={release}
//                   className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md"
//                   variants={fadeIn}
//                   whileHover={{ scale: 1.03 }}
//                 >
//                   <Image
//                     src={`/assets/cover.jpg`}
//                     alt={`Upcoming Release ${release}`}
//                     width={100}
//                     height={150}
//                   />
//                 </motion.div>
//               ))}
//             </motion.div>
//           </div>
//         </section>
//       </main>
//       <footer className="border-t py-8 bg-white dark:bg-gray-800 dark:border-gray-700">
//         <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
//           <motion.div 
//             className="text-center md:text-left mb-4 md:mb-0"
//             variants={fadeIn}
//           >
//             <p className="text-sm text-gray-600 dark:text-gray-300">
//               © 2023 NovelHub. All rights reserved.
//             </p>
//           </motion.div>
//           <motion.nav 
//             className="flex justify-center md:justify-end space-x-6"
//             variants={staggerChildren}
//           >
//             {["About Us", "Terms", "Privacy", "Contact"].map((item) => (
//               <motion.div key={item} variants={fadeIn}>
//                 <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200">
//                   {item}
//                 </Link>
//               </motion.div>
//             ))}
//           </motion.nav>
//         </div>
//       </footer>
//     </motion.div>
//   )
// }



'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Search, Menu, BookOpen, Moon, Sun, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/ui/starrating'

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
}

export default function ModernLightNovelsHomepage() {
  const [darkMode, setDarkMode] = useState(false)
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
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">LightNovelHub</h1>
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
            {user ? (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-12 md:py-24 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-900 dark:to-pink-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Your Next Adventure</h2>
            <p className="text-xl text-purple-100 mb-8">Explore thousands of light novels across various genres</p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">Start Reading Now</Button>
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
                  <motion.article 
                    key={novel.id}
                    className="group relative"
                    variants={fadeIn}
                    whileHover={{ scale: 1.05 }}
                    onHoverStart={() => setHoveredNovel(novel.id)}
                    onHoverEnd={() => setHoveredNovel(null)}
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <Image
                        src={novel.coverUrl || '/assets/cover.jpg'}
                        alt={novel.name}
                        width={300}
                        height={400}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <motion.div 
                      className="mt-4 space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{novel.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{novel.author}</p>
                      <StarRating rating={novel.rating} />
                      <AnimatePresence>
                        {hoveredNovel === novel.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90"
                          >
                            <Link href={`/novel/${novel.id}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" /> Read Now
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.article>
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