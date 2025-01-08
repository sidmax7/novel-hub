import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { StarRating } from '@/components/ui/starrating'
import { ThumbsUp } from 'lucide-react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import { genreColors } from '@/app/genreColors'
import { useTheme } from 'next-themes'
import { Hash, Plus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(241, 89, 42, 0.5) transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    margin: 2px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(241, 89, 42, 0.8), rgba(241, 89, 42, 0.6));
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(241, 89, 42, 1), rgba(241, 89, 42, 0.8));
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
`

// Add styles to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = scrollbarStyles
  document.head.appendChild(style)
}

interface Novel {
  novelId: string
  title: string
  genres: {
    name: string
  }[] // Update to an array of strings
  synopsis: string
  rating: number
  coverPhoto: string
  publishers: {
    original: string
    english?: string
  }
  likes: number
  availability: {
    type: "FREE" | "PAID" | "FREEMIUM"
  }
  tags: string[] // Fix: Change to array of strings
}

interface NovelCardProps {
  novel: Novel
  onFollowChange?: (novelId: string, isFollowing: boolean) => void
  onRead?: () => void
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, onFollowChange }) => {
  const { theme} = useTheme()
  const [isFollowing, setIsFollowing] = useState(false)
  const [likes, setLikes] = useState(novel.likes || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const checkIfFollowing = useCallback(async () => {
    if (!user) return
    try {
      const followingRef = doc(db, 'users', user.uid, 'following', novel.novelId)
      const followingDoc = await getDoc(followingRef)
      setIsFollowing(followingDoc.exists())
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }, [user, novel.novelId])

  const checkIfLiked = useCallback(async () => {
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      const isLiked = userDoc.data()?.likedNovels?.includes(novel.novelId) || false
      setIsLiked(isLiked)
      
      if (isLiked) {
        setLikes(prevLikes => Math.max(prevLikes, 1))
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }, [user, novel.novelId])

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await Promise.all([checkIfFollowing(), checkIfLiked()])
      }
      setIsLoading(false)
    }
    loadData()
  }, [user, checkIfFollowing, checkIfLiked])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const handleFollowNovel = async () => {
    if (!user) {
      toast.error('Please log in to follow novels')
      return
    }

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
      if (onFollowChange) {
        onFollowChange(novel.novelId, !isFollowing)
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
      const novelRef = doc(db, 'novels', novel.novelId)
      const userRef = doc(db, 'users', user.uid)

      if (isLiked) {
        await updateDoc(novelRef, { likes: increment(-1) })
        await updateDoc(userRef, { likedNovels: arrayRemove(novel.novelId) })
        setLikes(prevLikes => Math.max(prevLikes - 1, 0))
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
  const getColorScheme = (item: string) => {
    const key = Object.keys(genreColors).find(k => item.toLowerCase().includes(k.toLowerCase()));
    return key ? genreColors[key as keyof typeof genreColors] : genreColors.Horror;
  }
  return (
    <Card className="overflow-hidden group relative">
      <Link href={`/novel/${novel.novelId}`} passHref legacyBehavior>
        <a className="block">
          <div className="relative w-full pt-[150%]">
            <Image
              src={novel.coverPhoto || '/assets/default-cover.jpg'}
              alt={novel.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transform transition-all duration-300 group-hover:opacity-0">
              <h3 className="font-semibold text-lg text-white">{novel.title}</h3>
            </div>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col p-4">
              <div className="mb-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-semibold text-base text-white mb-1">{novel.title}</h3>
                <p className="text-xs text-gray-300">by <span className="text-sm text-[#464646] dark:text-[#C3C3C3] px-2 py-0.5 bg-black/20 dark:bg-white/10 rounded-md ml-1">{novel.publishers.original}</span></p>
              </div>
              
              <div className="flex-grow overflow-y-auto mb-2 custom-scrollbar transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                <p className="text-sm text-gray-200 leading-tight p-1 mb-4">{novel.synopsis}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {novel.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-1.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors cursor-pointer rounded-md flex items-center"
                    >
                      <Hash className="h-3 w-3 mr-0.5" />
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                <div className="flex flex-wrap gap-1">
                  {novel.genres.slice(0, 2).map((g, i) => (
                    <Badge 
                      key={i}
                      variant="secondary"
                      className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F1592A]/10 text-[#F1592A] hover:bg-[#F1592A]/20 transition-colors cursor-pointer"
                    >
                      {g.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex justify-between items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-0 text-[#4B6BFB] hover:text-[#4B6BFB]/80 font-medium flex items-center justify-center gap-1 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFollowNovel();
                    }}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#4B6BFB] flex items-center justify-center mr-1">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    {isFollowing ? 'ADDED' : 'ADD'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs flex items-center ${isLiked ? 'text-red-500' : 'text-white'}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLikeNovel();
                    }}
                  >
                    <ThumbsUp className="mr-1" size={14} />
                    <span>{likes}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </Card>
  )
}
