import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from '@/components/ui/starrating'
import { BookMarked, ThumbsUp } from 'lucide-react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc, deleteDoc, collection, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { useTheme } from 'next-themes'
interface Novel {
  id: string
  name: string
  author: string
  genre: string
  rating: number
  coverUrl: string
  authorId: string
  likes: number
}

interface NovelCardProps {
  novel: Novel
  onFollowChange?: (novelId: string, isFollowing: boolean) => void
  onRead?: () => void
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(false)
  const [likes, setLikes] = useState(novel.likes || 0)
  const [isLiked, setIsLiked] = useState(false)
  const { user } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (user) {
      checkIfFollowing()
      checkIfLiked()
    }
  }, [user, novel.id])

  const checkIfFollowing = async () => {
    if (!user) return
    try {
      const followingRef = doc(db, 'users', user.uid, 'following', novel.id)
      const followingDoc = await getDoc(followingRef)
      setIsFollowing(followingDoc.exists())
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const checkIfLiked = async () => {
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      setIsLiked(userDoc.data()?.likedNovels?.includes(novel.id) || false)
    } catch (error) {
      console.error('Error checking like status:', error)
    }
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
        setLikes(prevLikes => prevLikes - 1)
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

  return (
    <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
      <Link href={`/novel/${novel.id}`} passHref>
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={novel.coverUrl || '/assets/cover.jpg'}
            alt={novel.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1 truncate">{novel.name}</h3>
          <Link href={`/author/${novel.authorId}`} passHref>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate hover:text-[#F1592A] dark:hover:text-[#F1592A] cursor-pointer">
              {novel.author}
            </p>
          </Link>
          <StarRating rating={novel.rating} />
          <div className="flex mt-2 space-x-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-grow comic-button group border-2 border-[#F1592A] ${
                isFollowing 
                  ? "dark:bg-[#F1592A] bg-[#F1592A] text-[#232120] dark:text-white hover:bg-[#232120] dark:hover:bg-[#232120] hover:text-white" 
                  : "dark:bg-[#232120] bg-white text-[#232120] dark:text-white hover:bg-[#F1592A] dark:hover:bg-[#F1592A] hover:text-white"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFollowNovel()
              }}
            >
              <BookMarked className="mr-2 h-4 w-4" />
              <span className="group-hover:hidden">
                {isFollowing ? 'Followed' : 'Follow'}
              </span>
              <span className="hidden group-hover:inline">
                {isFollowing ? 'Unfollow' : 'Follow'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-grow comic-button group ${
                theme === 'dark' 
                  ? "bg-[#232120] text-white hover:bg-[#F1592A] dark:hover:bg-white dark:hover:text-[#232120]" 
                  : "bg-white text-[#232120] hover:bg-[#232120] hover:text-white"
              } ${isLiked ? 'bg-white dark:bg-[#232120] text-[#F1592A] dark:text-[#F1592A]' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLikeNovel()
              }}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> 
              <span className="group-hover:hidden">
                {isLiked ? 'Liked' : 'Like'} ({likes})
              </span>
              <span className="hidden group-hover:inline">
                {isLiked ? 'Unlike' : 'Like'} ({likes - 1})
              </span>
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}