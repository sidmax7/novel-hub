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
import { StarRating } from '@/components/ui/starrating'
import { BookMarked, ThumbsUp, Home, Moon, Sun, BookOpen } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { toast, Toaster } from 'react-hot-toast'

interface Novel {
  id: string
  name: string
  author: string
  coverUrl: string
  rating: number
  releaseDate: string
  description: string
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
        // Increment view count
        await updateDoc(doc(db, 'novels', params.novelId), {
          views: increment(1)
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
    console.log('Fetching chapters for novel ID:', params.novelId)
    try {
      const chaptersQuery = query(
        collection(db, 'novels', params.novelId, 'chapters'),
        orderBy('chapter', 'asc')
      )
      const querySnapshot = await getDocs(chaptersQuery)
      console.log('Query snapshot:', querySnapshot)
      if (querySnapshot.empty) {
        console.log('No chapters found for this novel')
        setChapters([])
        return
      }
      const chaptersData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Chapter data:', data)
        return {
          id: doc.id,
          number: data.chapter,
          title: data.title,
          link: data.link,
          releaseDate: data.releaseDate
        } as Chapter
      })
      console.log('Fetched chapters:', chaptersData)
      setChapters(chaptersData)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Failed to fetch chapters')
    } finally {
      setChaptersLoading(false)
    }
  }

  const handleFollowNovel = () => {
    toast('Follow feature available after login', {
      icon: '👤',
    })
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
  if (!novel) return <div className="flex justify-center items-center h-screen">Chapter not found</div>

  console.log('Chapters in state:', chapters) // Add this line before the return statement

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NovelHub</h1>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="bg-white dark:bg-gray-800">
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="bg-gray-200 dark:bg-gray-700"
            >
              <Sun className="h-4 w-4 text-yellow-500" />
              <Moon className="h-4 w-4 text-blue-500" />
            </Switch>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Card className="mb-8 overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="relative aspect-[2/3] w-full">
                  <Image
                    src={novel.coverUrl}
                    alt={novel.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <h2 className="text-3xl font-bold mb-2">{novel.name}</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">by {novel.author}</p>
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
                <p className="mt-4 text-gray-700 dark:text-gray-300">{novel.description}</p>
                <div className="flex flex-wrap gap-4 mt-6">
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
                <div className="flex mt-6 space-x-4">
                  <Button className="flex-1 comic-button" onClick={handleFollowNovel}>
                    <BookMarked className="mr-2 h-4 w-4" /> Follow
                  </Button>
                  <Button variant="outline" className="flex-1 comic-button" onClick={handleLikeNovel}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Like
                  </Button>
                  <Button variant="outline" className="flex-1 comic-button" onClick={() => router.push(`/novel/${novel.id}/chapters`)}>
                    <BookOpen className="mr-2 h-4 w-4" /> Read
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Chapters</CardTitle>
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
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((chapter) => (
                      <tr key={chapter.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2">{chapter.number}</td>
                        <td className="px-4 py-2">{chapter.title}</td>
                        <td className="px-4 py-2">{formatDate(chapter.releaseDate)}</td>
                        <td className="px-4 py-2">
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
      </main>
    </div>
  )
}