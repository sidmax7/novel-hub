'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Moon, Sun, LogOut, User, Plus, Home,Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../authcontext'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebaseConfig'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp,Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Reply {
id: string
content: string
author: string
authorId: string
createdAt: Timestamp
replies: Reply[]
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
repliesCount: number
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

export default function ForumsPage() {
const [mounted, setMounted] = useState(false)
const [posts, setPosts] = useState<ForumPost[]>([])
const [loading, setLoading] = useState(true)
const { user } = useAuth()
const router = useRouter()
const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
const [newPostTitle, setNewPostTitle] = useState('')
const [newPostContent, setNewPostContent] = useState('')
const [newPostSection, setNewPostSection] = useState('general')
const [newPostImage, setNewPostImage] = useState<File | null>(null)
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [direction, setDirection] = useState(0)
const [activeTab, setActiveTab] = useState("announcements")
const fileInputRef = useRef<HTMLInputElement>(null)
const [scrollToPostId, setScrollToPostId] = useState<string | null>(null)



const fetchPosts = async () => {
  setLoading(true)
  try {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    const fetchedPosts = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const postData = doc.data()
      const repliesRef = collection(doc.ref, 'replies')
      const repliesSnapshot = await getDocs(repliesRef)
      const repliesCount = repliesSnapshot.size
      return { 
        id: doc.id, 
        ...postData,
        createdAt: postData.createdAt.toDate(),
        repliesCount: repliesCount
      } as ForumPost
    }))
    setPosts(fetchedPosts)
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    toast.error('Failed to load forum posts')
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

const handleCreatePost = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) {
    toast.error('You must be logged in to create a post')
    return
  }
  if (!newPostTitle.trim() || !newPostContent.trim()) {
    toast.error('Please fill in all fields')
    return
  }
  try {
    let imageUrl = ''
    if (newPostImage) {
      const imageRef = ref(storage, `post-images/${Date.now()}-${newPostImage.name}`)
      await uploadBytes(imageRef, newPostImage)
      imageUrl = await getDownloadURL(imageRef)
    }

    await addDoc(collection(db, 'forumPosts'), {
      title: newPostTitle,
      content: newPostContent,
      author: userProfile?.username || 'Anonymous',
      authorId: user.uid,
      createdAt: serverTimestamp(),
      section: newPostSection,
      replies: [],
      image: imageUrl || null
    })
    toast.success('Post created successfully')
    setNewPostTitle('')
    setNewPostContent('')
    setNewPostSection('general')
    setNewPostImage(null)
    setIsDialogOpen(false)
    window.location.reload()
  } catch (error) {
    console.error('Error creating post:', error)
    toast.error('Failed to create post')
  }
}

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    setNewPostImage(file)
  }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
}

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

const handleTabChange = (newTab: string) => {
  const tabOrder = ["announcements", "general", "updates", "community"];
  const currentIndex = tabOrder.indexOf(activeTab);
  const newIndex = tabOrder.indexOf(newTab);
  setDirection(newIndex > currentIndex ? 1 : -1);
  setActiveTab(newTab);
}

const renderPosts = (section: string) => {
  const sectionPosts = posts.filter(post => post.section === section)
  return (
    <div className="space-y-4">
      {sectionPosts.map((post) => (
        <Link href={`/forum/post/${post.id}?tab=${section}&page=1`} key={post.id}>
          <Card id={`post-${post.id}`} className="bg-[#C3C3C3]/50 dark:bg-[#3E3F3E]/50 cursor-pointer hover:bg-[#C3C3C3]/70 dark:hover:bg-[#3E3F3E]/70 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#F1592A]">
                <strong>{post.title}</strong>
              </CardTitle>
              <div className="text-sm text-[#3E3F3E] dark:text-[#C3C3C3]">
                Posted by {post.author} • {post.createdAt.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[#232120] dark:text-[#E7E7E8]">{post.content.substring(0, 150)}...</p>
              {post.image && (
                <div className="mt-2">
                  <Image src={post.image} alt="Post image" width={200} height={150} className="rounded-md" />
                </div>
              )}
              <div className="mt-2 text-sm text-[#3E3F3E] dark:text-[#C3C3C3]">
                {post.repliesCount} {post.repliesCount === 1 ? 'reply' : 'replies'}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

useEffect(() => {
  setMounted(true)
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  const scrollTo = params.get('scrollTo')
  if (tab) setActiveTab(tab)
  if (scrollTo) setScrollToPostId(scrollTo)
  fetchPosts()
  if (user) {
    fetchUserProfile()
  }
}, [user])

useEffect(() => {
  if (scrollToPostId) {
    const postElement = document.getElementById(`post-${scrollToPostId}`)
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setScrollToPostId(null)
    }
  }
}, [posts, scrollToPostId])

if (!mounted) return null

return (
  <div className={`min-h-screen bg-[#E7E7E8] dark:bg-[#232120]`}>
    <motion.div 
      className="flex flex-col min-h-screen"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b border-[#C3C3C3] dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-3xl font-bold text-[#232120] hover:text-[#F1592A] dark:hover:text-[#F1592A] transition-colors dark:text-[#E7E7E8]">
              Novellize Forums
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#232120]/60 dark:text-[#E7E7E8]/60" />
              <Input
                type="search"
                placeholder="Search forums..."
                className="pl-10 pr-4 py-2 w-64 rounded-full bg-[#C3C3C3] dark:bg-[#3E3F3E] focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder-[#8E8F8E] dark:placeholder-[#C3C3C3]"
              />
            </div>
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
              >
                <Home className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                <span className="sr-only">Home</span>
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
                      <p className="text-xs leading-none text-[#8E8F8E] dark:text-[#C3C3C3]">{user.email}</p>
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

      <main className="flex-grow container mx-auto px-4 py-8 h-[calc(100vh-var(--header-height)-var(--footer-height)-2rem)] flex flex-col">        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8]">Forum Discussions</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F1592A] text-white hover:bg-[#D14820]">
                <Plus className="mr-2 h-4 w-4" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-[#E7E7E8] dark:bg-[#232120]">
              <DialogHeader>
                <DialogTitle className="text-[#232120] dark:text-[#E7E7E8]">Create a New Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  placeholder="Post Title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8]"
                />
                <Textarea
                  placeholder="Post Content"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full h-32 bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8] font-mono"
                />
                <Select value={newPostSection} onValueChange={setNewPostSection}>
                  <SelectTrigger className="bg-[#C3C3C3] dark:bg-[#3E3F3E] text-[#232120] dark:text-[#E7E7E8]">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcements">Announcements</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="updates">Updates</SelectItem>
                    <SelectItem value="community">Community Discussions</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {newPostImage ? 'Change Image' : 'Add Image'}
                  </Button>
                  {newPostImage && <span className="text-sm text-[#3E3F3E] dark:text-[#C3C3C3]">{newPostImage.name}</span>}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#F1592A] text-white hover:bg-[#D14820]">
                  Create Post
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center text-[#232120] dark:text-[#E7E7E8]">Loading forum posts...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 bg-[#C3C3C3] dark:bg-[#3E3F3E] space-x-1">
              <TabsTrigger 
                value="announcements" 
                className="text-[#232120] data-[state=active]:bg-[#E7E7E8] data-[state=active]:text-[#232120]
                dark:text-[#E7E7E8] dark:data-[state=active]:bg-[#232120] dark:data-[state=active]:text-[#E7E7E8]"
              >
                Announcements
              </TabsTrigger>
              <TabsTrigger value="general" className="text-[#232120] data-[state=active]:bg-[#E7E7E8] data-[state=active]:text-[#232120]
                dark:text-[#E7E7E8] dark:data-[state=active]:bg-[#232120] dark:data-[state=active]:text-[#E7E7E8]"
              >
                General Discussions
              </TabsTrigger>
              <TabsTrigger value="updates" className="text-[#232120] data-[state=active]:bg-[#E7E7E8] data-[state=active]:text-[#232120]
                dark:text-[#E7E7E8] dark:data-[state=active]:bg-[#232120] dark:data-[state=active]:text-[#E7E7E8]"
              >
                Updates
              </TabsTrigger>
              <TabsTrigger value="community" className="text-[#232120] data-[state=active]:bg-[#E7E7E8] data-[state=active]:text-[#232120]
                dark:text-[#E7E7E8] dark:data-[state=active]:bg-[#232120] dark:data-[state=active]:text-[#E7E7E8]"
              >
                Community
              </TabsTrigger>
            </TabsList>
            <div className="flex-grow relative overflow-hidden mt-4">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "tween", duration: 0.5, ease: "easeInOut" },
                  }}
                  className="absolute inset-0 overflow-hidden"
                >
                  <TabsContent value="announcements" forceMount={activeTab === "announcements" || undefined} className="h-full">
                    <ScrollArea className="h-full pr-4">
                      {renderPosts('announcements')}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="general" forceMount={activeTab === "general" || undefined} className="h-full">
                    <ScrollArea className="h-full pr-4">
                      {renderPosts('general')}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="updates" forceMount={activeTab === "updates" || undefined} className="h-full">
                    <ScrollArea className="h-full pr-4">
                      {renderPosts('updates')}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="community" forceMount={activeTab === "community" || undefined} className="h-full">
                    <ScrollArea className="h-full pr-4">
                      {renderPosts('community')}
                    </ScrollArea>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        )}
      </main>

      <footer className="border-t border-[#C3C3C3] dark:border-[#3E3F3E] py-4 bg-[#E7E7E8] dark:bg-[#232120] h-[var(--footer-height)] mt-auto">
        <div className="container mx-auto px-4 text-center text-[#8E8F8E] dark:text-[#C3C3C3]">
          <p className="text-sm">© 2024 Novellize Forums. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  </div>
)
}