'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { doc, getDoc, collection, query, getDocs, orderBy, updateDoc, increment, Timestamp, arrayRemove, arrayUnion, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from '@/components/ui/starrating'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, ThumbsUp, BookMarked, Gift, Eye, Info, MessageCircle, Search, Moon, Sun, LogOut, User, ChevronsLeftRight, MessageSquare, Menu, X } from 'lucide-react'
import CommentSystem from '@/components/ui/commentsystem'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '@/app/authcontext'
import { setDoc, deleteDoc } from 'firebase/firestore'
import { genreColors } from '@/app/genreColors'
import Link from 'next/link'
import { RecommendedList } from '@/components/RecomendedList'
import ReactMarkdown from 'react-markdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseConfig'

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
  const [recommendedNovels, setRecommendedNovels] = useState<Novel[]>([])
  const [recommendedLoading, setRecommendedLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
  const [userType, setUserType] = useState<string | null>(null)

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

        // Fetch recommended novels of same genre
        setRecommendedLoading(true);
        try {
          const primaryGenre = novelData.genres[0]?.name; // Get first genre
          let recommendedQuery;
          
          if (primaryGenre) {
            // Simple query with just where clause
            recommendedQuery = query(
              collection(db, 'novels'),
              where('genres', 'array-contains', primaryGenre),
              limit(8)
            );
          } else {
            // Fallback to latest novels
            recommendedQuery = query(
              collection(db, 'novels'),
              limit(8)
            );
          }
          
          const recommendedSnapshot = await getDocs(recommendedQuery);
          const recommendedData = recommendedSnapshot.docs
            .map(doc => ({ novelId: doc.id, ...doc.data() } as Novel))
            .filter(n => n.novelId !== novelData.novelId); // Exclude current novel

          setRecommendedNovels(recommendedData);
        } catch (error) {
          console.error('Error fetching recommended novels:', error);
          toast.error('Failed to fetch recommendations');
        } finally {
          setRecommendedLoading(false);
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

  const handleFollowChange = (novelId: string, isFollowing: boolean) => {
    // This can be implemented later if needed
    console.log('Follow status changed:', novelId, isFollowing)
  }

  useEffect(() => {
    setMounted(true)
    if (params.novelId) {
      fetchNovel()
      fetchChapters()
    }
    if (user) {
      fetchUserProfile()
    }
  }, [params.novelId, user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
        setUserType(userData.userType || null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  if (!mounted) return null
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!novel) return <div className="flex justify-center items-center h-screen">Novel not found</div>

  return (
    <div className="min-h-screen bg-white dark:bg-[#232120]">
      <Toaster />
      <header className="border-b dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/assets/favicon.png"
                  alt="Novellize"
                  width={40}
                  height={40}
                  className="hover:opacity-90 transition-opacity"
                />
              </Link>

              <nav className="hidden lg:flex items-center space-x-4">
                <Link 
                  href="/browse" 
                  className="flex items-center gap-2 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] transition-colors px-3 py-1.5"
                >
                  Browse All
                </Link>
                <Link 
                  href="/forum" 
                  className="flex items-center gap-2 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] transition-colors px-3 py-1.5"
                >
                  Forum
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex relative w-[300px]">
                <Input
                  type="text"
                  placeholder="Search novels..."
                  className="pl-10 pr-4 py-2 w-full bg-white dark:bg-[#2A2827] border-[#F1592A] border-opacity-50 rounded-full focus-visible:ring-[#F1592A]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

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
                          <ChevronsLeftRight className="mr-2 h-4 w-4" />
                          <span>Admin Console</span>
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
                <Button variant="ghost" onClick={() => router.push('/auth')} className="text-[#F1592A]">
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#F1592A]">Home</Link>
          <span>/</span>
          <Link href="/fantasy" className="hover:text-[#F1592A]">Fantasy</Link>
          <span>/</span>
          <span className="text-[#F1592A]">{novel.title}</span>
        </div>

        {/* Novel Info Section - First Row */}
        <div className="flex flex-col md:flex-row gap-10 mb-10">
          {/* Left Column - Cover Image */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="sticky top-6">
              <Image
                src={novel.coverPhoto}
                alt={novel.title}
                width={300}
                height={400}
                className="rounded-3xl shadow-lg w-full object-cover"
              />
            </div>
          </div>

          {/* Right Column - Novel Details */}
          <div className="flex-1 flex flex-col">
            {/* Top Content */}
            <div className="flex-1">
              {/* Title and Original Label */}
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-[#232120] dark:text-white">
                  {novel.title}
                </h1>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  ORIGINAL
                </span>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-600 dark:text-gray-400">Author:</span>
                <Link 
                  href={`/author/${novel.uploaderId}`}
                  className="text-sm text-[#F1592A] hover:underline"
                >
                  {uploaderUsername}
                </Link>
              </div>

              {/* Genres and Tags Section */}
              <div className="space-y-4 mb-6">
                {/* Genres */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Genres</h3>
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
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
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
              </div>
            </div>

            {/* Bottom Content - Rating, Stats and Buttons */}
            <div className="mt-auto">
              {/* Rating Section */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <StarRating rating={novel.rating} />
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {novel.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">Rating</span>
                </div>
                
              </div>

              {/* Stats Icons Row */}
              <div className="flex gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <BookOpen className="w-6 h-6 text-blue-500 mb-1" />
                  <span className="text-sm font-medium">{novel.totalChapters}</span>
                  <span className="text-xs text-gray-500">Chapters</span>
                </div>
                <div className="flex flex-col items-center">
                  <Eye className="w-6 h-6 text-green-500 mb-1" />
                  <span className="text-sm font-medium">{novel.views}</span>
                  <span className="text-xs text-gray-500">Views</span>
                </div>
                <div className="flex flex-col items-center">
                  <ThumbsUp 
                    className={`w-6 h-6 mb-1 ${isLiked ? 'text-pink-500 fill-current' : 'text-gray-500'}`}
                    onClick={handleLikeNovel}
                    style={{ cursor: 'pointer' }}
                  />
                  <span className="text-sm font-medium">{likes}</span>
                  <span className="text-xs text-gray-500">Likes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-[#F1592A] hover:bg-[#F1592A]/90 text-white rounded-full"
                  onClick={() => router.push(`/novel/${novel.novelId}/chapters`)}
                >
                  CONTINUE READING
                </Button>
                <Button 
                  variant="outline" 
                  className={`flex-1 rounded-full ${
                    isFollowing 
                      ? "bg-[#F1592A] text-white hover:bg-[#232120]" 
                      : "border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A]/10"
                  }`}
                  onClick={handleFollowNovel}
                >
                  <BookMarked className="mr-2 h-4 w-4" />
                  {isFollowing ? 'IN LIBRARY' : 'ADD TO LIBRARY'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Second Row */}
        <Tabs defaultValue="about" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-14 items-center bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none mb-8">
            <TabsTrigger 
              value="about"
              className="flex items-center gap-2 text-lg h-full data-[state=active]:border-b-2 border-[#F1592A] 
              text-gray-600 data-[state=active]:text-[#F1592A] 
              dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
              transition-colors duration-200"
            >
              <Info className="w-5 h-5" />
              About
            </TabsTrigger>
            <TabsTrigger 
              value="chapters"
              className="flex items-center gap-2 text-lg h-full data-[state=active]:border-b-2 border-[#F1592A] 
              text-gray-600 data-[state=active]:text-[#F1592A] 
              dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
              transition-colors duration-200"
            >
              <BookOpen className="w-5 h-5" />
              Chapters
            </TabsTrigger>
            <TabsTrigger 
              value="comments"
              className="flex items-center gap-2 text-lg h-full data-[state=active]:border-b-2 border-[#F1592A] 
              text-gray-600 data-[state=active]:text-[#F1592A] 
              dark:text-gray-400 dark:data-[state=active]:text-[#F1592A]
              transition-colors duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-8 pt-6">
            <div className="space-y-4 prose dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold">Synopsis</h2>
              <ReactMarkdown className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {novel.synopsis}
              </ReactMarkdown>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-50 dark:bg-gray-900 border-0 shadow-sm rounded-3xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Publication Info</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-gray-600 dark:text-gray-400">Original Publisher</span>
                      <span className="font-medium">{novel.publishers.original}</span>
                    </div>
                    {novel.publishers.english && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400">English Publisher</span>
                        <span className="font-medium">{novel.publishers.english}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span className="font-medium">{novel.seriesStatus}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 dark:bg-gray-900 border-0 shadow-sm rounded-3xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Likes
                      </span>
                      <span className="font-medium">{likes}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Total Views
                      </span>
                      <span className="font-medium">{novel.views}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
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

            <div className="mt-8">
              <RecommendedList 
                novels={recommendedNovels} 
                loading={recommendedLoading}
                onFollowChange={handleFollowChange}
              />
            </div>
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
                        className="flex justify-between items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
                        <div className="flex flex-col">
                          <span className="font-medium">Chapter {chapter.number}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{chapter.title}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(chapter.releaseDate)}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="text-[#F1592A] hover:bg-[#F1592A]/10 rounded-full"
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
      </main>
    </div>
  )
}

