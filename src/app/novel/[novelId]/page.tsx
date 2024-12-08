'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { doc, getDoc, collection, query, getDocs, orderBy, updateDoc, increment, Timestamp, arrayRemove, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from '@/components/ui/starrating'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, ThumbsUp, BookMarked, Gift } from 'lucide-react'
import CommentSystem from '@/components/ui/commentsystem'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '@/app/authcontext'
import { setDoc, deleteDoc } from 'firebase/firestore'
import { genreColors } from '@/app/genreColors'

interface Novel {
  novelId: string
  title: string
  synopsis: string
  coverPhoto: string
  genres: { name: string }[]
  rating: number
  publishers: {
    original: string
    english?: string
  }
  likes: number
  views: number
  totalChapters: number
  uploaderId: string
  uploader: string
  seriesStatus: 'ONGOING' | 'COMPLETED' | 'ON HOLD' | 'CANCELLED' | 'UPCOMING'
  tags?: string[]
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

const getGenreColor = (genreName: string, theme: string | undefined) => {
  const normalizedGenre = genreName.toLowerCase();
  const key = Object.keys(genreColors).find(k => k.toLowerCase() === normalizedGenre);
  if (!key) return theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
  return theme === 'dark' ? genreColors[key as keyof typeof genreColors].dark : genreColors[key as keyof typeof genreColors].light;
};

export default function NovelPage({ params }: { params: { novelId: string } }) {
  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('about')
  const [uploaderUsername, setUploaderUsername] = useState<string>('')
  const [viewIncremented, setViewIncremented] = useState(false)
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)

  const updateTags = async () => {
    if (!user || !novel) return;
    try {
      const novelRef = doc(db, 'novels', novel.novelId);
      await updateDoc(novelRef, {
        tags: ['action', 'fantasy', 'magic', 'system']
      });
      toast.success('Tags updated successfully');
      // Refresh the novel data
      fetchNovel();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    }
  };

  const fetchNovel = async () => {
    if (!params.novelId) return
    setLoading(true)
    try {
      const novelDoc = await getDoc(doc(db, 'novels', params.novelId))
      if (novelDoc.exists()) {
        const novelData = { novelId: novelDoc.id, ...novelDoc.data() } as Novel
        console.log('Novel Data:', novelData)
        console.log('Tags:', novelData.tags)
        setNovel(novelData)
        setLikes(novelData.likes || 0)
        
        const uploaderDoc = await getDoc(doc(db, 'users', novelData.uploader))
        if (uploaderDoc.exists()) {
          setUploaderUsername(uploaderDoc.data().username || 'Unknown User')
        }

        if (!viewIncremented) {
          const currentViews = Math.round(novelData.views || 0)
          await updateDoc(doc(db, 'novels', params.novelId), {
            views: currentViews + 1
          })
          setViewIncremented(true)
        }
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

  useEffect(() => {
    if (user && novel) {
      checkIfFollowing()
      checkIfLiked()
    }
  }, [user, novel])

  const checkIfFollowing = async () => {
    if (!user || !novel) return
    try {
      const followingRef = doc(db, 'users', user.uid, 'following', novel.novelId)
      const followingDoc = await getDoc(followingRef)
      setIsFollowing(followingDoc.exists())
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const checkIfLiked = async () => {
    if (!user || !novel) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setIsLiked(userData.likedNovels?.includes(novel.novelId) || false)
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleFollowNovel = async () => {
    if (!user) {
      toast.error('Please log in to follow novels')
      return
    }

    if (!novel) return

    const followingRef = doc(db, 'users', user.uid, 'following', novel.novelId)

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
    if (!user) {
      toast.error('Please log in to like novels')
      return
    }
  
    try {
      if (!novel) throw new Error('Novel not found');
      const novelRef = doc(db, 'novels', novel.novelId)
      const userRef = doc(db, 'users', user.uid)
  
      if (isLiked) {
        await updateDoc(novelRef, { likes: increment(-1) })
        await updateDoc(userRef, { likedNovels: arrayRemove(novel.novelId) })
        setLikes(prevLikes => prevLikes - 1)
        setIsLiked(false)
        toast.success('Like removed')
      } else {
        await updateDoc(novelRef, { likes: increment(1) })
        await updateDoc(userRef, { likedNovels: arrayUnion(novel.novelId) })
        setLikes(prevLikes => prevLikes + 1)
        setIsLiked(true)
        toast.success('Novel liked')
      }
    } catch (error) {
      console.error('Error updating like:', error)
      toast.error('Failed to update like')
    }
  }

  useEffect(() => {
    setMounted(true)
    if (params.novelId) {
      fetchNovel()
      fetchChapters()
    }
  }, [params.novelId])

  if (!mounted) return null
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!novel) return <div className="flex justify-center items-center h-screen">Novel not found</div>

  return (
    <div className="min-h-screen bg-white dark:bg-[#232120]">
      <Toaster />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Cover Image */}
          <div className="w-full md:w-1/4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-6"
            >
              <Image
                src={novel.coverPhoto}
                alt={novel.title}
                width={300}
                height={400}
                className="rounded-lg shadow-lg w-full object-cover"
              />
            </motion.div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#232120] dark:text-white mb-4">
                {novel.title}
              </h1>
              
              {/* Author and Rating */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{uploaderUsername[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-gray-600 dark:text-gray-400">{uploaderUsername}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={novel.rating} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">({novel.rating.toFixed(2)})</span>
                </div>
              </div>

              {/* Genres and Tags */}
              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {novel.genres.map((genre, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getGenreColor(genre.name, theme)}`}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {novel.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {novel.totalChapters} Chapters
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {likes} Likes
                </span>
                <span className="flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  {novel.views} Views
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  {novel.seriesStatus}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <Button 
                  className="flex-1 bg-[#F1592A] hover:bg-[#F1592A]/90 text-white"
                  onClick={() => router.push(`/novel/${novel.novelId}/chapters`)}
                >
                  READ
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex-1 group ${
                    isFollowing 
                      ? "bg-[#F1592A] text-white hover:bg-[#232120]" 
                      : "border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A]/10"
                  }`}
                  onClick={handleFollowNovel}
                >
                  <BookMarked className="mr-2 h-4 w-4" />
                  <span className="group-hover:hidden">
                    {isFollowing ? 'Followed' : '+ ADD TO LIBRARY'}
                  </span>
                  <span className="hidden group-hover:inline">
                    {isFollowing ? 'Unfollow' : '+ ADD TO LIBRARY'}
                  </span>
                </Button>
              </div>

              <Tabs defaultValue="about" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3 h-12 items-center bg-transparent border-b border-gray-200 dark:border-gray-800">
                  <TabsTrigger 
                    value="about"
                    className="h-full data-[state=active]:border-b-2 border-[#F1592A] 
                    text-gray-600 data-[state=active]:text-[#F1592A] 
                    dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
                    transition-colors duration-200 text-lg font-medium"
                  >
                    About
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chapters"
                    className="h-full data-[state=active]:border-b-2 border-[#F1592A] 
                    text-gray-600 data-[state=active]:text-[#F1592A] 
                    dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
                    transition-colors duration-200 text-lg font-medium"
                  >
                    Chapters
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments"
                    className="h-full data-[state=active]:border-b-2 border-[#F1592A] 
                    text-gray-600 data-[state=active]:text-[#F1592A] 
                    dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
                    transition-colors duration-200 text-lg font-medium"
                  >
                    Comments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-8 pt-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Synopsis</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {novel.synopsis}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-[#333333] dark:bg-[#232120] border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Publication Info</h2>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Original Publisher</span>
                            <span className="font-medium">{novel.publishers.original}</span>
                          </div>
                          {novel.publishers.english && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">English Publisher</span>
                              <span className="font-medium">{novel.publishers.english}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status</span>
                            <span className="font-medium">{novel.seriesStatus}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#333333] dark:bg-[#232120] border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-600 dark:text-gray-400">
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Likes
                            </span>
                            <span className="font-medium">{likes}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-600 dark:text-gray-400">
                              <BookOpen className="w-4 h-4 mr-2" />
                              Total Views
                            </span>
                            <span className="font-medium">{novel.views}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-600 dark:text-gray-400">
                              <BookMarked className="w-4 h-4 mr-2" />
                              Chapters
                            </span>
                            <span className="font-medium">{novel.totalChapters}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-[#333333] dark:bg-[#232120] border-0 shadow-sm">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Top Fans</h2>
                      <div className="flex flex-col gap-4">
                        <div className="flex -space-x-2">
                          <Avatar className="border-2 border-white dark:border-gray-800">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>K</AvatarFallback>
                          </Avatar>
                          <Avatar className="border-2 border-white dark:border-gray-800">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>M</AvatarFallback>
                          </Avatar>
                          <Avatar className="border-2 border-white dark:border-gray-800">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>Z</AvatarFallback>
                          </Avatar>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A]/10"
                          onClick={handleLikeNovel}
                        >
                          <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                          {isLiked ? 'Liked' : 'Like this Novel'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chapters" className="h-[calc(100vh-300px)]">
                  <div className="h-full">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {chaptersLoading ? (
                          <p className="text-center py-4 text-gray-500 dark:text-gray-400">Loading chapters...</p>
                        ) : chapters.length === 0 ? (
                          <p className="text-center py-4 text-gray-500 dark:text-gray-400">No chapters available yet.</p>
                        ) : (
                          chapters.map((chapter) => (
                            <div key={chapter.id} 
                              className="flex justify-between items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <div className="flex flex-col">
                                <span className="font-medium">Chapter {chapter.number}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{chapter.title}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {formatDate(chapter.releaseDate)}
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                className="text-[#F1592A] hover:bg-[#F1592A]/10"
                                onClick={() => window.open(chapter.link, '_blank', 'noopener,noreferrer')}
                              >
                                Read
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="pt-6">
                  <CommentSystem novelId={novel.novelId} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

