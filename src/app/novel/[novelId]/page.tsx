'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, increment, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StarRating } from '@/components/ui/starrating'
import { BookMarked, ThumbsUp, Home, Moon, Sun, BookOpen, MessageSquare } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { toast, Toaster } from 'react-hot-toast'
import CommentSystem from '@/components/ui/commentsystem'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/authcontext'
import { setDoc, deleteDoc } from 'firebase/firestore'

interface Novel {
  authorId: string
  id: string
  name: string
  author: string
  coverUrl: string
  rating: number
  releaseDate: string
  synopsis: string
  genre: string
  chapters: number
  views: number
  likes: number
}

interface Chapter {
  id: string
  number: number
  title: string
  link: string
  releaseDate: Timestamp
}

const formatDate = (timestamp: Timestamp) => {
  const date = timestamp.toDate()
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function NovelPage({ params }: { params: { novelId: string } }) {
  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chapters')

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0
      };
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0
      };
    }
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    if (activeTab === 'chapters') {
      paginate(-1);
    } else {
      paginate(1);
    }
  }, [activeTab]);

  useEffect(() => {
    setMounted(true)
    if (params.novelId) {
      fetchNovel()
      fetchChapters()
    }
  }, [params.novelId])

  const fetchNovel = async () => {
    if (!params.novelId) return
    setLoading(true)
    try {
      const novelDoc = await getDoc(doc(db, 'novels', params.novelId))
      if (novelDoc.exists()) {
        setNovel({ id: novelDoc.id, ...novelDoc.data() } as Novel)
        await updateDoc(doc(db, 'novels', params.novelId), {
          views: increment(0.5)
        })
      } else {
        toast.error('Novel not found')
      }
    } catch (error) {
      console.error('Error fetching novel:', error)
      toast.error('Failed to fetch novel details')
    }
    setLoading(false)
  }

  const fetchChapters = async () => {
    setChaptersLoading(true)
    try {
      const chaptersQuery = query(
        collection(db, 'novels', params.novelId, 'chapters'),
        orderBy('chapter', 'asc')
      )
      const querySnapshot = await getDocs(chaptersQuery)
      const chaptersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        number: doc.data().chapter,
        title: doc.data().title,
        link: doc.data().link,
        releaseDate: doc.data().releaseDate
      } as Chapter))
      setChapters(chaptersData)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Failed to fetch chapters')
    } finally {
      setChaptersLoading(false)
    }
  }

  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (user && novel) {
      checkIfFollowing()
    }
  }, [user, novel])

  const checkIfFollowing = async () => {
    if (!user || !novel) return
    try {
      const followingRef = doc(db, 'users', user.uid, 'following', novel.id)
      const followingDoc = await getDoc(followingRef)
      setIsFollowing(followingDoc.exists())
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollowNovel = async () => {
    if (!user) {
      toast.error('Please log in to follow novels')
      return
    }

    if (!novel) return

    const followingRef = doc(db, 'users', user.uid, 'following', novel.id)

    try {
      if (isFollowing) {
        await deleteDoc(followingRef)
        setIsFollowing(false)
        toast.success('Novel unfollowed')
      } else {
        await setDoc(followingRef, { following: true })
        setIsFollowing(true)
        toast.success('Novel followed')
      }
    } catch (error) {
      console.error('Error updating followed novels:', error)
      toast.error('Failed to update followed novels')
    }
  }

  const handleLikeNovel = async () => {
    if (!novel) return
    try {
      await updateDoc(doc(db, 'novels', novel.id), {
        likes: increment(1)
      })
      setNovel(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null)
      toast.success('Novel liked')
    } catch (error) {
      console.error('Error liking novel:', error)
      toast.error('Failed to like novel')
    }
  }

  if (!mounted) return null
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!novel) return <div className="flex justify-center items-center h-screen">Novel not found</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-[#F1592A]">
              <Link href="/" className="text-3xl font-bold text-[#232120] hover:text-[#F1592A] transition-colors">
            NovelHub
          </Link>
          </h1>
          </div>
          <div className="flex items-center space-x-4">
          <Link href="/" passHref>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-gray-800 hover:bg-[#F1592A] dark:hover:bg-[#F1592A]"
                >
                  <Home className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  <span className="sr-only">Home</span>
                </Button>
              </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 dark:border-opacity-50 dark:border-[#F1592A] bg-white dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#E7E7E8]" />
              ) : (
                <Moon className="h-4 w-4 text-[#232120]" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Card className="mb-8 overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/4">
                <div className="relative aspect-[2/3] w-full md:w-4/5 mx-auto">
                  <Image
                    src={novel.coverUrl}
                    alt={novel.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/4">
                <h2 className="text-3xl font-bold mb-2">{novel.name}</h2>
                <Link href={`/author/${novel.authorId}`} passHref>
                  <p className="text-md text-gray-600 dark:text-gray-400 mb-2 truncate hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                    by {novel.author}
                  </p>
                </Link>
                <p className="mb-4">Release Date: {novel.releaseDate}</p>
                <div className="flex items-center mb-4">
                  <StarRating rating={novel.rating} />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">({novel.rating.toFixed(1)})</span>
                </div>
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    {novel.genre}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Synopsis</h3>
                  <p className="text-gray-700 dark:text-gray-300">{novel.synopsis || 'No synopsis available.'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{novel.chapters} chapters</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{novel.views} views</span>
                </div>
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{novel.likes || 0} likes</span>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button className="flex-1 comic-button" onClick={handleFollowNovel}>
                  <BookMarked className="mr-2 h-4 w-4" /> {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                <Button variant="outline" className="flex-1 comic-button" onClick={handleLikeNovel}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Like
                </Button>
                <Button variant="outline" className="flex-1 comic-button" onClick={() => router.push(`/novel/${novel.id}/chapters`)}>
                  <BookOpen className="mr-2 h-4 w-4" /> Read
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="chapters" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <div className="relative overflow-hidden" style={{ height: '500px' }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute w-full h-full"
              >
                <ScrollArea className="h-full w-full">
                  {activeTab === 'chapters' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center">
                          <BookOpen className="mr-2 h-6 w-6" />
                          Chapters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {chaptersLoading ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400">Loading chapters...</p>
                          </div>
                        ) : chapters.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400">No chapters available for this novel yet.</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Check back later for updates!</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                  <th className="px-4 py-2 text-left">Chapter</th>
                                  <th className="px-4 py-2 text-left">Title</th>
                                  <th className="px-4 py-2 text-left">Release Date</th>
                                  <th className="px-4 py-2 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {chapters.map((chapter) => (
                                  <tr key={chapter.id} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-2">{chapter.number}</td>
                                    <td className="px-4 py-2">{chapter.title}</td>
                                    <td className="px-4 py-2">{formatDate(chapter.releaseDate)}</td>
                                    <td className="px-4 py-2 text-center">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => window.open(chapter.link, '_blank', 'noopener,noreferrer')}
                                      >
                                        Read
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center">
                          <MessageSquare className="mr-2 h-6 w-6" />
                          Comments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CommentSystem novelId={novel.id} />
                      </CardContent>
                    </Card>
                  )}
                </ScrollArea>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </main>
    </div>
  )
}