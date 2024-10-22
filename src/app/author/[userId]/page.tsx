'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StarRating } from '@/components/ui/starrating'
import { Home, Moon, Sun, BookOpen, Heart, Eye, Twitter, Facebook, Globe } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GiQuillInk } from "react-icons/gi"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface User {
  id: string
  username: string
  bio: string
  profilePicture: string
  socialLinks: {
    twitter?: string
    facebook?: string
    website?: string
  }
  userType: 'reader' | 'author'
  totalWorks?: number
  totalLikes?: number
  timeCreated: Timestamp
  verified: boolean
}

interface Novel {
  id: string
  name: string
  coverUrl: string
  rating: number
  genre: string
  likes: number
  views: number
  chapters: number
}

export default function AuthorPage({ params }: { params: { userId: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (params.userId) {
      fetchUserData()
      fetchUserNovels()
    }
  }, [params.userId])

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    console.log("Current novels state:", novels);
  }, [novels]);

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString();
  };
  
  const fetchUserData = async () => {
    if (!params.userId) return
    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, 'users', params.userId))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        if (userData.userType === 'author') {
          setUser(userData)
        } else {
          toast.error('This user is not an author')
          router.push('/')
        }
      } else {
        toast.error('User not found')
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to fetch user details')
    }
    setLoading(false)
  }

  const fetchUserNovels = async () => {
    if (!params.userId) return
    console.log("Fetching novels for user ID:", params.userId);
    try {
      const novelsQuery = query(
        collection(db, 'novels'),
        where('authorId', '==', params.userId),
        orderBy('likes', 'desc')
      )
      console.log("Query:", novelsQuery);
      const querySnapshot = await getDocs(novelsQuery)
      console.log("Query snapshot size:", querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        console.log("Novel document:", doc.id, doc.data());
      });

      const novelsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          rating: data.rating || 0,
          likes: data.likes || 0,
          views: data.views || 0,
          chapters: data.chapters || 0,
        } as Novel;
      })
      console.log("Processed novels data:", novelsData);
      setNovels(novelsData)
    } catch (error) {
      console.error('Error fetching user novels:', error)
      if (error instanceof Error && error.name === 'FirebaseError') {
        const fbError = error as { code?: string, message?: string }
        console.error('Firestore error code:', fbError.code)
        console.error('Firestore error message:', fbError.message)
      }
      toast.error('Failed to fetch user novels')
    }
  }
  useEffect(() => {
    setMounted(true)
    if (params.userId) {
      fetchUserData()
      fetchUserNovels()
    }
  }, [params.userId])

  const NovelCard = ({ novel }: { novel: Novel }) => {
    console.log("Rendering NovelCard for novel:", novel);
    return (
      <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
        <Link href={`/novel/${novel.id}`}>
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={novel.coverUrl || '/assets/cover.jpg'}
              alt={novel.name || 'Novel cover'}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 truncate text-gray-900 dark:text-gray-100">{novel.name || 'Untitled'}</h3>
            <div className="flex items-center mb-2">
              <StarRating rating={novel.rating || 0} />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({(novel.rating || 0).toFixed(1)})</span>
            </div>
            {novel.genre && <Badge variant="secondary" className="mb-2">{novel.genre}</Badge>}
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center"><Heart className="h-4 w-4 mr-1" /> {novel.likes || 0}</span>
              <span className="flex items-center"><Eye className="h-4 w-4 mr-1" /> {novel.views || 0}</span>
              <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1" /> {novel.chapters || 0}</span>
            </div>
          </CardContent>
        </Link>
      </Card>
    )
  }

  if (!mounted) return null
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!user) return <div className="flex justify-center items-center h-screen">Author not found</div>

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
        <Card className="mb-6 overflow-hidden border-1 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-full md:w-1/3 flex justify-center">
                <Avatar className="w-48 h-48 border-4 border-[#F1592A]/80 dark:border-[#F1592A]/80 shadow-lg">
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                  <AvatarFallback className="text-4xl">{user.username[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="w-full md:w-2/3 space-y-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h2>
                  <Badge variant="secondary" className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    <GiQuillInk className="h-4 w-4 mr-1 inline-block" />
                    Author
                  </Badge>
                  {user.verified && (
                    <Badge variant="secondary" className="px-2 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <svg className="w-4 h-4 mr-1 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">{user.bio}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <span>{user.totalWorks || 0} works</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Heart className="h-5 w-5 mr-2" />
                    <span>{user.totalLikes || 0} likes</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Joined {formatDate(user.timeCreated)}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex space-x-4">
                  {user.socialLinks?.twitter && (
                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 transition-colors">
                      <Twitter className="h-6 w-6" />
                    </a>
                  )}
                  {user.socialLinks?.facebook && (
                    <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                      <Facebook className="h-6 w-6" />
                    </a>
                  )}
                  {user.socialLinks?.website && (
                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                      <Globe className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-grow overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Novels by {user.username}</CardTitle>
            <CardDescription>Explore the captivating worlds created by this author</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-[calc(100vh-24rem)] pr-4">
              {novels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {novels.map((novel) => (
                    <NovelCard key={novel.id} novel={novel} />
                  ))}
                </div>
              ) : (
                <p>No novels found for this author.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}