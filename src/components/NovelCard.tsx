import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from '@/components/ui/starrating'
import { BookMarked, ThumbsUp } from 'lucide-react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc, setDoc, deleteDoc, collection } from 'firebase/firestore'
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
}

interface NovelCardProps {
  novel: Novel
  onFollowChange?: (novelId: string, isFollowing: boolean) => void
  onRead?: () => void
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(false)
  const { user } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (user) {
      checkIfFollowing()
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
              className="flex-grow comic-button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFollowNovel()
              }}
            >
              <BookMarked className="mr-2 h-4 w-4" />
              {isFollowing ? 'Followed' : 'Follow'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-grow comic-button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Implement like functionality here
              }}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Like
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
