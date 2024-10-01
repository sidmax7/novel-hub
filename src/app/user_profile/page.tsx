'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from '@/components/ui/starrating'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '../authcontext'
import { Edit, BookOpen, BookMarked, ThumbsUp, Upload, Moon, Sun, Home } from 'lucide-react'
import { db } from '@/lib/firebaseConfig'
import { Timestamp, doc, getDoc, collection, query, where, getDocs, updateDoc, limit, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useTheme } from 'next-themes'
import { Switch } from '@radix-ui/react-switch'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { NovelCard } from '@/components/NovelCard'

interface UserProfile {
  uid: string
  username: string
  userType: string
  email: string
  bio: string
  profilePicture: string
  favoriteGenres: string[]
  readingGoal: number
  timeCreated: Timestamp
  followedNovels: string[]
}

interface Novel {
  authorId: string
  id: string
  name: string
  author: string
  coverUrl: string
  rating: number
  genre: string
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [followedNovels, setFollowedNovels] = useState<Novel[]>([])
  const [recommendations, setRecommendations] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [followedNovelIds, setFollowedNovelIds] = useState<string[]>([])
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchFollowedNovels(user.uid)
      fetchRecommendations()
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile
        setProfile({
          ...userData,
          favoriteGenres: userData.favoriteGenres || [],
          readingGoal: userData.readingGoal || 0,
        })
        setFollowedNovelIds(userData.followedNovels || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setLoading(false)
    }
  }

  const fetchFollowedNovels = async (userId: string) => {
    try {
      console.log('Fetching followed novels for user:', userId)
      const followingRef = collection(db, 'users', userId, 'following')
      const followingQuery = query(followingRef, where('following', '==', true))
      const followingSnapshot = await getDocs(followingQuery)
      
      console.log('Number of followed novels:', followingSnapshot.size)
      
      const novelPromises = followingSnapshot.docs.map(async (followingDoc) => {
        const novelId = followingDoc.id
        console.log('Fetching novel details for:', novelId)
        const novelDoc = await getDoc(doc(db, 'novels', novelId))
        if (novelDoc.exists()) {
          return { id: novelId, ...novelDoc.data() } as Novel
        }
        return null
      })
      
      const novels = await Promise.all(novelPromises)
      const validNovels = novels.filter((novel): novel is Novel => novel !== null)
      console.log('Valid followed novels:', validNovels)
      setFollowedNovels(validNovels)
      return validNovels
    } catch (error) {
      console.error('Error fetching followed novels:', error)
      return []
    }
  }

  const fetchRecommendations = async () => {
    try {
      const recommendationsQuery = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(4))
      const querySnapshot = await getDocs(recommendationsQuery)
      const novels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel))
      setRecommendations(novels)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageCrop = useCallback(async () => {
    if (!completedCrop || !imageRef.current) return

    const canvas = document.createElement('canvas')
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      toast.error('Failed to create canvas context')
      return
    }

    ctx.drawImage(
      imageRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    canvas.toBlob(async (blob) => {
      if (!blob || !user) {
        toast.error('Failed to create image blob')
        return
      }

      const loadingToast = toast.loading('Uploading avatar...')

      try {
        const storage = getStorage()
        const storageRef = ref(storage, `avatars/${user.uid}`)
        
        await uploadBytes(storageRef, blob)
        const downloadURL = await getDownloadURL(storageRef)
        
        await updateDoc(doc(db, 'users', user.uid), {
          profilePicture: downloadURL
        })
        
        setProfile(prev => prev ? { ...prev, profilePicture: downloadURL } : null)
        
        toast.dismiss(loadingToast)
        toast.success('Avatar updated successfully')
        setIsAvatarDialogOpen(false)
        setUploadedImage(null)
      } catch (error) {
        console.error('Error uploading avatar:', error)
        toast.dismiss(loadingToast)
        toast.error('Failed to update avatar. Please try again.')
      }
    }, 'image/jpeg')
  }, [completedCrop, user])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !profile) return
  
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: profile.username,
        bio: profile.bio,
        favoriteGenres: profile.favoriteGenres,
        readingGoal: profile.readingGoal
      })
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleFollowChange = useCallback(async (novelId: string, isFollowing: boolean) => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)

    try {
      if (isFollowing) {
        await updateDoc(userRef, {
          followedNovels: arrayUnion(novelId)
        })
        setFollowedNovelIds(prev => [...prev, novelId])
      } else {
        await updateDoc(userRef, {
          followedNovels: arrayRemove(novelId)
        })
        setFollowedNovelIds(prev => prev.filter(id => id !== novelId))
      }
      await fetchFollowedNovels(user.uid)
    } catch (error) {
      console.error('Error updating followed novels:', error)
      toast.error('Failed to update followed novels')
    }
  }, [user, fetchFollowedNovels])

  if (!mounted) return null

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NovelHub</h1>
          <div className="flex items-center space-x-4">
            <Link href="./">
              <Button variant="outline" size="icon" className="bg-white dark:bg-gray-800">
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Sun className="h-[1.2rem] w-[1.2rem] dark:text-gray-400" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
              <Moon className="h-[1.2rem] w-[1.2rem] text-gray-400 dark:text-white" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile?.profilePicture} alt={profile?.username} />
                  <AvatarFallback>{profile?.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4 comic-button">
                      <Upload className="mr-2 h-4 w-4" /> Change Avatar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Change Avatar</DialogTitle>
                      <DialogDescription>
                        Upload and crop a new avatar image. Max file size: 5MB. Supported formats: JPEG, PNG, GIF
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {!uploadedImage ? (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="avatar-upload" className="text-right">
                            Choose File
                          </Label>
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            className="col-span-3"
                            onChange={handleFileUpload}
                          />
                        </div>
                      ) : (
                        <>
                          <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                          >
                            <img ref={imageRef} src={uploadedImage} alt="Upload" />
                          </ReactCrop>
                          <Button onClick={handleImageCrop}>Upload Cropped Image</Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex-grow">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profile?.username || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile?.bio || ''}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="favoriteGenres">Favorite Genres (comma-separated)</Label>
                      <Input
                        id="favoriteGenres"
                        name="favoriteGenres"
                        value={profile?.favoriteGenres.join(', ')}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, favoriteGenres: e.target.value.split(',').map(g => g.trim()) } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="readingGoal">Daily Reading Goal (pages)</Label>
                      <Input
                        id="readingGoal"
                        name="readingGoal"
                        type="number"
                        value={profile?.readingGoal || ''}
                        onChange={handleInputChange}
                        min={1}
                      />
                    </div>
                    <Button type="submit" className="comic-button">Save Changes</Button>
                    <Button type="button" variant="outline" className="ml-2 comic-button" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">{profile?.username}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                    <p className="text-justify">{profile?.bio}</p>
                    <div>
                      <strong>Favorite Genres:</strong> {profile?.favoriteGenres.join(', ')}
                    </div>
                    <div>
                      <strong>Daily Reading Goal:</strong> {profile?.readingGoal} pages
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="comic-button">
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="followed" className="mb-8">
          <TabsList>
            <TabsTrigger value="followed">Followed Novels</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="followed">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {followedNovels.length > 0 ? (
                followedNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} onFollowChange={handleFollowChange} />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500">You haven't followed any novels yet.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Reading Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Total Books Read</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">27</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Pages Read This Week</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">342</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Reading Streak</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}