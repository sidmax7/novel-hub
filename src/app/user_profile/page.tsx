'use client'

import { useState, useEffect, useCallback } from 'react'
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
  id: string
  name: string
  author: string
  coverUrl: string
  rating: number
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchFollowedNovels()
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

  const fetchFollowedNovels = async () => {
    if (!user) return
    try {
      // Fetch the user document to get the followedNovels array
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const followedNovelIds = userData.followedNovels || []
  
        // Fetch the novel documents using the followedNovelIds
        const novelPromises = followedNovelIds.map((novelId: string) => getDoc(doc(db, 'novels', novelId)))
        const novelDocs = await Promise.all(novelPromises)
  
        const novels = novelDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as Novel))
  
        setFollowedNovels(novels)
      }
    } catch (error) {
      console.error('Error fetching followed novels:', error)
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
  
    try {
      const storage = getStorage()
      const storageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      await updateDoc(doc(db, 'users', user.uid), {
        profilePicture: downloadURL
      })
      
      setProfile(prev => ({ ...prev!, profilePicture: downloadURL }))
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to update avatar')
    }
  }

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

  const handleFollowNovel = useCallback(async (novel: Novel) => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)
    const isFollowing = followedNovelIds.includes(novel.id)

    try {
      if (isFollowing) {
        await updateDoc(userRef, {
          followedNovels: arrayRemove(novel.id)
        })
        setFollowedNovelIds(prev => prev.filter(id => id !== novel.id))
        setFollowedNovels(prev => prev.filter(n => n.id !== novel.id))
      } else {
        await updateDoc(userRef, {
          followedNovels: arrayUnion(novel.id)
        })
        setFollowedNovelIds(prev => [...prev, novel.id])
        setFollowedNovels(prev => [...prev, novel])
      }
      toast.success(isFollowing ? 'Novel unfollowed' : 'Novel followed')
    } catch (error) {
      console.error('Error updating followed novels:', error)
      toast.error('Failed to update followed novels')
    }
  }, [user, followedNovelIds])

  const NovelCard = ({ novel, showActions = false }: { novel: Novel, showActions?: boolean }) => {
    const isFollowing = followedNovelIds.includes(novel.id)

    return (
      <Card className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={novel.coverUrl}
            alt={novel.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1 truncate">{novel.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">{novel.author}</p>
          <StarRating rating={novel.rating} />
          {showActions ? (
            <div className="flex mt-2 space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-grow comic-button"
                onClick={() => handleFollowNovel(novel)}
              >
                {isFollowing ? (
                  <>
                    <BookMarked className="mr-2 h-4 w-4" /> Followed
                  </>
                ) : (
                  <>
                    <BookMarked className="mr-2 h-4 w-4" /> Follow
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-grow comic-button"
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> Like
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 comic-button"
            >
              <BookOpen className="mr-2 h-4 w-4" /> Read
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

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
                <Label htmlFor="avatar-upload" className="cursor-pointer mt-4">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button variant="outline" size="sm" className="comic-button">
                    <Upload className="mr-2 h-4 w-4" /> Change Avatar
                  </Button>
                </Label>
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
              {followedNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((novel) => (
                <NovelCard key={novel.id} novel={novel} showActions />
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