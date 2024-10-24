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

interface Novel {
  id: string
  title: string
  genres: {
    name: string
  }[] // Update to an array of strings
  rating: number
  coverPhoto: string
  publishers: {
    original: string
    english?: string
  }
  likes: number
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
      const followingRef = doc(db, 'users', user.uid, 'following', novel.id)
      const followingDoc = await getDoc(followingRef)
      setIsFollowing(followingDoc.exists())
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }, [user, novel.id])

  const checkIfLiked = useCallback(async () => {
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      const isLiked = userDoc.data()?.likedNovels?.includes(novel.id) || false
      setIsLiked(isLiked)
      
      if (isLiked) {
        setLikes(prevLikes => Math.max(prevLikes, 1))
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }, [user, novel.id])

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
      if (onFollowChange) {
        onFollowChange(novel.id, !isFollowing)
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
      const novelRef = doc(db, 'novels', novel.id)
      const userRef = doc(db, 'users', user.uid)

      if (isLiked) {
        await updateDoc(novelRef, { likes: increment(-1) })
        await updateDoc(userRef, { likedNovels: arrayRemove(novel.id) })
        setLikes(prevLikes => Math.max(prevLikes - 1, 0))
        setIsLiked(false)
        toast.success('Like removed')
      } else {
        await updateDoc(novelRef, { likes: increment(1) })
        await updateDoc(userRef, { likedNovels: arrayUnion(novel.id) })
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
    <Card className="overflow-hidden">
      <Link href={`/novel/${novel.id}`} passHref legacyBehavior>
        <a className="block">
          <div className="relative w-full pt-[150%]">
            <Image
              src={novel.coverPhoto || '/assets/default-cover.jpg'}
              alt={novel.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 truncate">{novel.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Published by {novel.publishers.original}</p>
            <div className="flex items-center justify-between mb-2">
              <StarRating rating={novel.rating} />
            </div>
            <div className="flex flex-wrap gap-1">
            {novel.genres.slice(0, 3).map((g, i) => (
                        <span 
                          key={i}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            theme === 'dark'
                              ? getColorScheme(g.name).dark
                              : getColorScheme(g.name).light
                          }`}
                        >
                          {g.name}
                        </span>
              ))}
            </div>
          </CardContent>
        </a>
      </Link>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          onClick={handleFollowNovel}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLikeNovel}
          className={`flex items-center ${isLiked ? 'text-red-500' : ''}`}
        >
          <ThumbsUp className="mr-1" size={16} />
          <span>{likes}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
