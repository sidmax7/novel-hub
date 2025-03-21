'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Moon, Sun, BookOpen, Heart, Eye } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GiQuillInk } from "react-icons/gi"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { motion } from 'framer-motion'

interface Novel {
  novelId: string;
  title: string;
  coverPhoto: string;
  rating: number;
  genres: { name: string }[];
  likes: number;
  views: number;
  totalChapters: number;
}

export default function AuthorProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E7E7E8] dark:bg-[#232120] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mb-8 mx-auto relative">
            <div className="absolute inset-0 border-t-4 border-[#F1592A] rounded-full animate-spin" />
            <div className="absolute inset-2 border-t-4 border-[#F1592A]/70 rounded-full animate-spin-slow" />
            <div className="absolute inset-4 border-t-4 border-[#F1592A]/40 rounded-full animate-spin-slower" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Loading Author Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the author's information...</p>
        </div>
      </div>
    }>
      <AuthorProfileContent />
    </Suspense>
  )
}

function AuthorProfileContent() {
  const [authorName, setAuthorName] = useState<string>('Unknown Author')
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [isAccountUser, setIsAccountUser] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const name = searchParams.get('name')
    const isAccount = searchParams.get('isAccount')
    const userId = searchParams.get('userId')
    
    // Dismiss any existing loading toasts
    toast.dismiss('author-loading')
    
    // If we have a userId, check if the user exists and has the correct user type
    if (userId) {
      checkUserAndRedirect(userId, name || 'Unknown Author')
    }
    // Otherwise, proceed with the normal flow
    else if (name) {
      setAuthorName(name)
      setIsAccountUser(isAccount === 'true')
      fetchAuthorNovels(name)
      
      // Update the document title with the author's name
      document.title = `${name} | Author Profile | Novellize`
      
      // If this is an account user but not an author/admin, show a different message
      if (isAccount === 'true') {
        toast.success('This user is not registered as an author', {
          duration: 5000
        })
      }
    } else {
      toast.error('Author name not provided')
      router.push('/')
    }
  }, [searchParams])

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const fetchAuthorNovels = async (name: string) => {
    setLoading(true)
    try {
      // We need to query for both formats of author data
      // First, query for novels where the author name is a direct string match
      const stringAuthorQuery = query(
        collection(db, 'novels'),
        where('credits.authors', 'array-contains', name),
        orderBy('likes', 'desc')
      )
      
      const stringAuthorSnapshot = await getDocs(stringAuthorQuery)
      
      // Then, query for novels where the author is an object with a matching name
      // This is more complex and requires a different approach
      // We'll need to get all novels and filter them in JavaScript
      const allNovelsQuery = query(
        collection(db, 'novels'),
        orderBy('likes', 'desc')
      )
      
      const allNovelsSnapshot = await getDocs(allNovelsQuery)
      
      // Filter novels that have an author object with matching name
      const objectAuthorNovels = allNovelsSnapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.credits || !data.credits.authors) return false;
        
        return data.credits.authors.some((author: string | { name: string; id?: string; isAccount: boolean }) => 
          typeof author === 'object' && 
          author.name === name
        );
      });
      
      // Combine both result sets, avoiding duplicates
      const allMatchingDocs = new Map();
      
      // Add string matches
      stringAuthorSnapshot.docs.forEach(doc => {
        allMatchingDocs.set(doc.id, doc);
      });
      
      // Add object matches
      objectAuthorNovels.forEach(doc => {
        if (!allMatchingDocs.has(doc.id)) {
          allMatchingDocs.set(doc.id, doc);
        }
      });
      
      // Convert to array and map to Novel objects
      const novelsData = Array.from(allMatchingDocs.values()).map(doc => {
        const data = doc.data();
        return {
          novelId: doc.id,
          title: data.title,
          coverPhoto: data.coverPhoto,
          rating: data.rating || 0,
          genres: data.genres || [],
          likes: data.likes || 0,
          views: data.views || 0,
          totalChapters: data.totalChapters || 0,
        } as Novel;
      });
      
      setNovels(novelsData)
    } catch (error) {
      console.error('Error fetching author novels:', error)
      toast.error('Failed to fetch author novels')
    } finally {
      setLoading(false)
    }
  }

  // Function to check if a user exists and has the correct user type
  const checkUserAndRedirect = async (userId: string, fallbackName: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // If the user is an author or admin, redirect to their profile page
        if (userData.userType === 'author' || userData.userType === 'admin' || 
            userData.userType === 'Author' || userData.userType === 'Admin') {
          router.push(`/author/${userId}`)
          return
        }
        
        // Otherwise, show this page but with the user's data
        setAuthorName(userData.username || fallbackName)
        setIsAccountUser(true)
        fetchAuthorNovels(userData.username || fallbackName)
        
        // Update the document title
        document.title = `${userData.username || fallbackName} | Author Profile | Novellize`
        
        // Show a message
        toast.success('This user is not registered as an author', {
          duration: 5000
        })
      } else {
        // User doesn't exist, proceed with fallback name
        setAuthorName(fallbackName)
        setIsAccountUser(false)
        fetchAuthorNovels(fallbackName)
        
        // Update the document title
        document.title = `${fallbackName} | Author Profile | Novellize`
      }
    } catch (error) {
      console.error('Error checking user:', error)
      
      // Proceed with fallback name
      setAuthorName(fallbackName)
      setIsAccountUser(false)
      fetchAuthorNovels(fallbackName)
      
      // Update the document title
      document.title = `${fallbackName} | Author Profile | Novellize`
    }
  }

  const NovelCard = ({ novel, index }: { novel: Novel; index: number }) => {
    const handleNovelClick = (e: React.MouseEvent) => {
      e.preventDefault()
      
      // Show loading toast
      toast.loading('Loading novel...', {
        id: 'novel-loading',
        duration: 3000
      })
      
      // Navigate to novel page
      router.push(`/novel/${novel.novelId}`)
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
          <Link href={`/novel/${novel.novelId}`} onClick={handleNovelClick}>
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={novel.coverPhoto || '/assets/cover.jpg'}
                alt={novel.title || 'Novel cover'}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 truncate text-gray-900 dark:text-gray-100">{novel.title || 'Untitled'}</h3>
              <div className="flex items-center mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(novel.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({novel.rating.toFixed(1)})</span>
              </div>
              {novel.genres && novel.genres.length > 0 && (
                <Badge variant="secondary" className="mb-2">{novel.genres[0].name}</Badge>
              )}
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center"><Heart className="h-4 w-4 mr-1" /> {novel.likes || 0}</span>
                <span className="flex items-center"><Eye className="h-4 w-4 mr-1" /> {novel.views || 0}</span>
                <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1" /> {novel.totalChapters || 0}</span>
              </div>
            </CardContent>
          </Link>
        </Card>
      </motion.div>
    )
  }

  if (!mounted) return null
  if (loading) return (
    <div className="min-h-screen bg-[#E7E7E8] dark:bg-[#232120] flex flex-col items-center justify-center">
      <div className="text-center">
        <motion.div 
          className="w-24 h-24 mb-8 mx-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="absolute inset-0 border-t-4 border-[#F1592A] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-2 border-t-4 border-[#F1592A]/70 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-4 border-t-4 border-[#F1592A]/40 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Loading Author Profile
        </motion.h2>
        <motion.p 
          className="text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Please wait while we fetch the author's information...
        </motion.p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#E7E7E8] dark:bg-[#232120] flex flex-col">
      <Toaster />
      <header className="bg-white dark:bg-[#232120] shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
            Novellize
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                <Home className="h-4 w-4 text-gray-900 dark:text-gray-100 group-hover:text-white" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 dark:border-opacity-50 dark:border-[#F1592A] bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#E7E7E8]" />
              ) : (
                <Moon className="h-4 w-4 text-[#232120] group-hover:text-white" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6 overflow-hidden border-1 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <motion.div 
                  className="w-full md:w-1/3 flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Avatar className="w-48 h-48 border-4 border-[#F1592A]/80 dark:border-[#F1592A]/80 shadow-lg">
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-[#F1592A] to-[#F1592A]/70 text-white">
                      {authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <motion.div 
                  className="w-full md:w-2/3 space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{authorName}</h2>
                    <Badge variant="secondary" className={`px-2 py-1 text-sm font-medium ${
                      isAccountUser 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    }`}>
                      <GiQuillInk className="h-4 w-4 mr-1 inline-block" />
                      {isAccountUser ? "User" : "Author"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {isAccountUser 
                      ? "This user has an account but is not registered as an author. You're viewing a simplified profile."
                      : "This author doesn't have a Novellize account yet. You're viewing a simplified profile."}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <BookOpen className="h-5 w-5 mr-2" />
                      <span>{novels.length} works</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Heart className="h-5 w-5 mr-2" />
                      <span>{novels.reduce((sum, novel) => sum + novel.likes, 0)} total likes</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.h2 
          className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Works by {authorName}
        </motion.h2>
        
        {novels.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {novels.map((novel, index) => (
              <NovelCard key={novel.novelId} novel={novel} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-600 dark:text-gray-400 text-lg">No novels found for this author.</p>
          </motion.div>
        )}
      </main>

      <footer className="bg-white dark:bg-[#232120] shadow-inner mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Novellize. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 