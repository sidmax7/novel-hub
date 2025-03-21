'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '../authcontext'
import { Edit, Upload, Moon, Sun, Home } from 'lucide-react'
import { db } from '@/lib/firebaseConfig'
import { Timestamp, doc, getDoc, collection, query, where, getDocs, updateDoc, limit, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { NovelCard } from '@/components/NovelCard'
import { Novel } from '@/types/novel'

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
  socialLinks?: {
    twitter?: string
    facebook?: string
    website?: string
  }
  totalWorks?: number
  totalLikes?: number
  verified: boolean
}

export default function UserProfilePage() {
  const [darkMode, setDarkMode] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [followedNovels, setFollowedNovels] = useState<Novel[]>([])
  const [recommendations, setRecommendations] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

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
      
      const novelPromises = followingSnapshot.docs.map(async (followingDoc) => {
        const novelId = followingDoc.id
        const novelDoc = await getDoc(doc(db, 'novels', novelId))
        if (novelDoc.exists()) {
          const novelData = novelDoc.data()
          return {
            novelId: novelId,
            rating: novelData.rating,
            genres: novelData.genres,
            likes: novelData.likes,
            title: novelData.title,
            synopsis: novelData.synopsis,
            coverPhoto: novelData.coverPhoto,
            publishers: Array.isArray(novelData.publishers) ? novelData.publishers.map((publisher: any) => ({
              original: publisher.original || '',
              english: publisher.english
            })) : novelData.publishers,
            availability: novelData.availability,
            tags: novelData.tags || []
          } as Novel
        }
        return null
      })
      
      const novels = await Promise.all(novelPromises)
      const validNovels = novels.filter((novel): novel is Novel => novel !== null)
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
      const novels = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          novelId: doc.id,
          title: data.title,
          genres: data.genres,
          synopsis: data.synopsis,
          rating: data.rating,
          coverPhoto: data.coverPhoto,
          publishers: data.publishers,
          likes: data.likes,
          availability: data.availability,
          tags: data.tags || []
        } as Novel
      })
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
      } else {
        await updateDoc(userRef, {
          followedNovels: arrayRemove(novelId)
        })
      }
      await fetchFollowedNovels(user.uid)
    } catch (error) {
      console.error('Error updating followed novels:', error)
      toast.error('Failed to update followed novels')
    }
  }, [user, fetchFollowedNovels])


  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchFollowedNovels(user.uid)
      fetchRecommendations()
    }
  }, [user, fetchUserProfile, fetchFollowedNovels, fetchRecommendations])

  if (!mounted) return null

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-orange-500 to-orange-800 bg-clip-text text-transparent">Novellize</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Link href="/" passHref>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="w-9 h-9"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32 border-2 border-muted">
                  <AvatarImage src={profile?.profilePicture} alt={profile?.username} />
                  <AvatarFallback className="text-4xl">{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full md:w-auto">
                      <Upload className="mr-2 h-4 w-4" /> Change Avatar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Change Avatar</DialogTitle>
                      <DialogDescription>
                        Upload and crop a new avatar image
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {!uploadedImage ? (
                        <div className="space-y-4">
                          <Label htmlFor="avatar-upload">Choose File</Label>
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleFileUpload}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                          >
                            <img ref={imageRef} src={uploadedImage} alt="Upload" />
                          </ReactCrop>
                          <Button onClick={handleImageCrop} className="w-full">Upload Cropped Image</Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 space-y-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profile?.username || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile?.bio || ''}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favoriteGenres">Favorite Genres</Label>
                      <Input
                        id="favoriteGenres"
                        name="favoriteGenres"
                        value={profile?.favoriteGenres.join(', ')}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, favoriteGenres: e.target.value.split(',').map(g => g.trim()) } : null)}
                        placeholder="Fantasy, Romance, Mystery..."
                      />
                    </div>
                    <div className="space-y-2">
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
                    <div className="flex gap-2 pt-4">
                      <Button type="submit">Save Changes</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{profile?.username}</h2>
                      <p className="text-muted-foreground">{profile?.email}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{profile?.bio || 'No bio added yet.'}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Favorite Genres:</span>
                        <span className="text-sm text-muted-foreground">{profile?.favoriteGenres.join(', ') || 'None set'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Daily Reading Goal:</span>
                        <span className="text-sm text-muted-foreground">{profile?.readingGoal || 0} pages</span>
                      </div>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="mt-4">
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {followedNovels.length > 0 ? (
                  followedNovels.map((novel) => (
                    <NovelCard key={novel.novelId} novel={novel} onFollowChange={handleFollowChange} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Your library is empty. Start following some novels!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reading Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Books Read</h3>
                  <p className="text-2xl font-bold text-orange-500">27</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pages This Week</h3>
                  <p className="text-2xl font-bold text-orange-500">342</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Reading Streak</h3>
                  <p className="text-2xl font-bold text-orange-500">5 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.map((novel) => (
                  <NovelCard key={novel.novelId} novel={novel} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
