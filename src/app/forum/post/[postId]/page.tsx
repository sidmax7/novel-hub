'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Moon, Sun, LogOut, User, Home, MessageSquare, ChevronDown, ChevronUp, MoreHorizontal, ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/authcontext'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebaseConfig'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion, doc, getDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from 'react-hot-toast'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ReactMarkdown from 'react-markdown'

interface Reply {
  id: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  parentId: string | null
  image?: string
}

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  section: string
  replies: Reply[]
  image?: string
}

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

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

const ReplyComponent = ({ reply, allReplies, onReply, userProfiles }: { reply: Reply, allReplies: Reply[], onReply: (parentReplyId: string, content: string) => void, userProfiles: {[key: string]: {profilePicture: string, username: string}} }) => {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplies, setShowReplies] = useState(false)
  const { user } = useAuth()

  const nestedReplies = allReplies.filter(r => r.parentId === reply.id)

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(reply.id, replyContent)
      setReplyContent('')
      setIsReplying(false)
    }
  }

  const userProfile = userProfiles[reply.authorId] || { profilePicture: '/assets/default-avatar.png', username: reply.author }

  return (
    <div className="mt-4">
      <div className="flex items-start space-x-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={userProfile.profilePicture} alt={userProfile.username} />
          <AvatarFallback>{userProfile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#232120] dark:text-[#E7E7E8]">{userProfile.username}</span>
            <span className="text-xs text-[#3E3F3E] dark:text-[#C3C3C3]">{reply.createdAt.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[#232120] dark:text-[#E7E7E8]">{reply.content}</p>
          {reply.image && (
            <div className="mt-2">
              <Image src={reply.image} alt="Reply image" width={200} height={200} className="rounded-md" />
            </div>
          )}
          <div className="flex items-center space-x-4 mt-2">
            <Button variant="ghost" size="sm" className="text-[#3E3F3E] dark:text-[#C3C3C3] hover:text-[#232120] dark:hover:text-[#E7E7E8]" onClick={() => setIsReplying(!isReplying)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </div>
      {isReplying && (
        <div className="mt-2 ml-14">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="w-full bg-[#E7E7E8] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8] border-[#C3C3C3] dark:border-[#3E3F3E]"
          />
          <Button onClick={handleReply} className="mt-2 bg-[#F1592A] text-[#E7E7E8] hover:bg-[#D14820]">
            Submit Reply
          </Button>
        </div>
      )}
      {nestedReplies.length > 0 && (
        <div className="mt-2 ml-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="text-[#3E3F3E] dark:text-[#C3C3C3] hover:text-[#232120] dark:hover:text-[#E7E7E8]"
          >
            {showReplies ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showReplies ? 'Hide Replies' : `Show Replies (${nestedReplies.length})`}
          </Button>
          {showReplies && (
            <div className="mt-2">
              {nestedReplies.map((nestedReply) => (
                <ReplyComponent
                  key={nestedReply.id}
                  reply={nestedReply}
                  allReplies={allReplies}
                  onReply={onReply}
                  userProfiles={userProfiles}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PostPage({ params }: { params: { postId: string } }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
  const [sortBy, setSortBy] = useState('New')
  const [searchQuery, setSearchQuery] = useState('')
  const [allReplies, setAllReplies] = useState<Reply[]>([])
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {profilePicture: string, username: string}}>({})

  useEffect(() => {
    setMounted(true)
    fetchPost()
    if (user) {
      fetchUserProfile()
    }
  }, [user, params.postId])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const postDoc = await getDoc(doc(db, 'forumPosts', params.postId))
      if (postDoc.exists()) {
        const postData = postDoc.data()
        const repliesRef = collection(doc(db, 'forumPosts', params.postId), 'replies')
        const repliesSnapshot = await getDocs(query(repliesRef, orderBy('createdAt', 'desc')))
        
        const fetchedReplies = repliesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Reply[]
        
        setPost({
          id: postDoc.id,
          ...postData,
          createdAt: postData.createdAt.toDate(),
        } as ForumPost)
        setAllReplies(fetchedReplies)

        // Fetch user profiles for all reply authors
        const authorIds = new Set([postData.authorId, ...fetchedReplies.map(reply => reply.authorId)])
        const userProfilesPromises = Array.from(authorIds).map(async (authorId) => {
          const userDoc = await getDoc(doc(db, 'users', authorId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            return [authorId, {
              profilePicture: userData.profilePicture || '/assets/default-avatar.png',
              username: userData.username || 'Anonymous'
            }]
          }
          return [authorId, { profilePicture: '/assets/default-avatar.png', username: 'Anonymous' }]
        })
        const userProfilesArray = await Promise.all(userProfilesPromises)
        setUserProfiles(Object.fromEntries(userProfilesArray))
      } else {
        toast.error('Post not found')
        router.push('/forum')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load post')
    }
    setLoading(false)
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)))
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data()
        setUserProfile({
          profilePicture: userData.profilePicture || '/assets/default-avatar.png',
          username: userData.username || 'Anonymous'
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleReply = async (parentReplyId: string | null, content: string) => {
    if (!user) {
      toast.error('You must be logged in to reply')
      return
    }
    try {
      const newReply = {
        content,
        author: userProfile?.username || 'Anonymous',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        parentId: parentReplyId
      }
      
      const postRef = doc(db, 'forumPosts', params.postId)
      const repliesRef = collection(postRef, 'replies')
      const docRef = await addDoc(repliesRef, newReply)
      
      const addedReply = {
        id: docRef.id,
        ...newReply,
        createdAt: new Date()
      }
      
      setAllReplies(prevReplies => [addedReply, ...prevReplies])
      
      // Fetch the user's profile if it's not already in userProfiles
      if (!userProfiles[user.uid]) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUserProfiles(prevProfiles => ({
            ...prevProfiles,
            [user.uid]: {
              profilePicture: userData.profilePicture || '/assets/default-avatar.png',
              username: userData.username || 'Anonymous'
            }
          }))
        }
      }
      
      toast.success('Reply added successfully')
      setReplyContent('')
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    }
  }

  const sortReplies = (replies: Reply[]): Reply[] => {
    switch (sortBy) {
      case 'New':
        return [...replies].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      case 'Old':
        return [...replies].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      default:
        return replies
    }
  }

  const filterReplies = (replies: Reply[]): Reply[] => {
    if (!searchQuery) return replies
    return replies.filter(reply => 
      reply.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reply.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  const handleBackToForums = () => {
    const tab = post?.section || 'announcements'
    const page = searchParams.get('page') || '1'
    router.push(`/forum?tab=${tab}&page=${page}&scrollTo=${params.postId}`)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#E7E7E8] dark:bg-[#232120] text-[#232120] dark:text-[#E7E7E8]">
      <motion.div 
        className="flex flex-col min-h-screen"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <header className="border-b border-[#C3C3C3] dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/forum" className="text-3xl font-bold text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors">
                NovelHub Forums
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#232120]/50 dark:text-[#E7E7E8]/50"/>
                <Input
                  type="search"
                  placeholder="Search forums..."
                  className="pl-10 pr-4 py-2 w-64 rounded-full bg-[#C3C3C3] dark:bg-[#3E3F3E] focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder-[#8E8F8E]"
                />
              </div>
              <Link href="/forum" passHref>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] group"
                >
                  <Home className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                  <span className="sr-only">Forums</span>
                </Button>
              </Link>
              {mounted && <ThemeToggle />}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar>
                        <AvatarImage src={userProfile?.profilePicture} alt="User avatar" />
                        <AvatarFallback>{userProfile?.username?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.username}</p>
                        <p className="text-xs leading-none text-[#C3C3C3]">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/user_profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" onClick={() => router.push('/auth')} className="text-[#F1592A]">Login</Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center text-[#232120] dark:text-[#E7E7E8]">Loading post...</div>
          ) : post ? (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-[#3E3F3E]">
                <CardHeader className="flex flex-row items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={userProfiles[post.authorId]?.profilePicture || '/assets/default-avatar.png'} alt={post.author} />
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-bold text-[#F1592A]">{post.title}</CardTitle>
                      <p className="text-sm text-[#8E8F8E] dark:text-[#C3C3C3]">
                        Posted by {post.author} • {post.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-[#F1592A] text-[#E7E7E8] hover:bg-[#D14820] border-none"
                    onClick={handleBackToForums}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Forums
                  </Button>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown className="text-[#232120] dark:text-[#E7E7E8] text-lg prose dark:prose-invert max-w-none">
                    {post.content}
                  </ReactMarkdown>
                  {post.image && (
                    <div className="mt-4">
                      <Image src={post.image} alt="Post image" width={400} height={300} className="rounded-md" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-white dark:bg-[#3E3F3E] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="text-[#8E8F8E]">
                        Sort by: {sortBy} <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortBy('New')}>New</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('Old')}>Old</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#C3C3C3]" />
                    <Input
                      type="search"
                      placeholder="Search Comments"
                      className="pl-10 pr-4 py-2 w-64 bg-[#232120] text-[#E7E7E8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#F1592A]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div> */}
                </div>

                {user && (
                  <Card className="bg-[#E7E7E8] dark:bg-[#232120] mb-4">
                    <CardContent className="p-4">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8] border-[#C3C3C3] dark:border-[#3E3F3E]"
                      />
                      <Button onClick={() => handleReply(null, replyContent)} className="mt-2 bg-[#F1592A] text-[#E7E7E8] hover:bg-[#D14820]">
                        Submit Reply
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {filterReplies(sortReplies(allReplies.filter(r => !r.parentId))).map((reply) => (
                    <ReplyComponent
                      key={reply.id}
                      reply={reply}
                      allReplies={allReplies}
                      onReply={handleReply}
                      userProfiles={userProfiles}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-[#232120] dark:text-[#E7E7E8]">Post not found</div>
          )}
        </main>

        <footer className="border-t border-[#C3C3C3] dark:border-[#3E3F3E] py-8 bg-[#E7E7E8] dark:bg-[#232120]">
          <div className="container mx-auto px-4 text-center text-[#8E8F8E] dark:text-[#C3C3C3]">
            <p className="text-sm">© 2023 NovelHub Forums. All rights reserved.</p>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}