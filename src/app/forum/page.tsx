'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Moon, Sun, LogOut, User, Plus, Home } from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useAuth } from '../authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-hot-toast'
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

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  section: string
}

export default function ForumsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostSection, setNewPostSection] = useState('general')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPosts()
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const fetchedPosts = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as ForumPost))
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
      await addDoc(collection(db, 'forumPosts'), {
        title: newPostTitle,
        content: newPostContent,
        author: userProfile?.username || 'Anonymous',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        section: newPostSection
      })
      toast.success('Post created successfully')
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostSection('general')
      setIsDialogOpen(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    }
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  const renderPosts = (section: string) => {
    const sectionPosts = posts.filter(post => post.section === section)
    return (
      <div className="space-y-4">
        {sectionPosts.map((post) => (
          <Card key={post.id} className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#F1592A]">{post.title}</CardTitle>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Posted by {post.author} • {post.createdAt.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <motion.div 
        className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
            <Link href="/" className="text-3xl font-bold text-[#232120] hover:text-[#F1592A] transition-colors">
            NovelHub Forums
          </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search forums..."
                  className="pl-10 pr-4 py-2 w-64 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
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
                onClick={toggleDarkMode}
                className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-white dark:bg-gray-800 hover:bg-[#F1592A] dark:hover:bg-[#F1592A]"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4 text-gray-100" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-900" />
                )}
              </Button>
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
                        <p className="text-xs leading-none text-gray-500 dark:text-gray-400">{user.email}</p>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Forum Discussions</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#F1592A] text-white hover:bg-[#D14820]">
                  <Plus className="mr-2 h-4 w-4" /> New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Input
                    placeholder="Post Title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full"
                  />
                  <Textarea
                    placeholder="Post Content"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full h-32"
                  />
                  <Select value={newPostSection} onValueChange={setNewPostSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcements">Announcements</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="updates">Updates</SelectItem>
                      <SelectItem value="community">Community Discussions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full bg-[#F1592A] text-white hover:bg-[#D14820]">
                    Create Post
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center">Loading forum posts...</div>
          ) : (
            <Tabs defaultValue="announcements" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>
              <TabsContent value="announcements">
                <h3 className="text-xl font-semibold mb-4">Announcements</h3>
                {renderPosts('announcements')}
              </TabsContent>
              <TabsContent value="general">
                <h3 className="text-xl font-semibold mb-4">General Discussions</h3>
                {renderPosts('general')}
              </TabsContent>
              <TabsContent value="updates">
                <h3 className="text-xl font-semibold mb-4">Updates</h3>
                {renderPosts('updates')}
              </TabsContent>
              <TabsContent value="community">
                <h3 className="text-xl font-semibold mb-4">Community Discussions</h3>
                {renderPosts('community')}
              </TabsContent>
            </Tabs>
          )}
        </main>

        <footer className="border-t border-gray-200 dark:border-gray-700 py-8 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">© 2023 NovelHub Forums. All rights reserved.</p>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}