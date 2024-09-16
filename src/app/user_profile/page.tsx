'use client'

import { useState } from 'react'
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
import { Edit, BookOpen, BookMarked, ThumbsUp, Upload } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  email: string
  bio: string
  avatarUrl: string
  favoriteGenres: string[]
  readingGoal: number
}

interface Novel {
  id: string
  name: string
  author: string
  coverUrl: string
  rating: number
}

// Mock data
const mockProfile: UserProfile = {
  id: '1',
  username: 'BookLover123',
  email: 'booklover123@example.com',
  bio: 'Avid reader and light novel enthusiast. Always looking for the next great story!',
  avatarUrl: 'https://i.pravatar.cc/300',
  favoriteGenres: ['Fantasy', 'Sci-Fi', 'Romance'],
  readingGoal: 50
}

const mockFollowedNovels: Novel[] = [
  { id: '1', name: 'The Enchanted Sword', author: 'Aria Blackwood', coverUrl: 'https://picsum.photos/seed/novel1/300/450', rating: 4.5 },
  { id: '2', name: 'Starship Odyssey', author: 'Zack Stellar', coverUrl: 'https://picsum.photos/seed/novel2/300/450', rating: 4.2 },
  { id: '3', name: 'Love in the Digital Age', author: 'Emma Hearts', coverUrl: 'https://picsum.photos/seed/novel3/300/450', rating: 4.7 },
  { id: '4', name: 'The Last Mage', author: 'Merlin Wise', coverUrl: 'https://picsum.photos/seed/novel4/300/450', rating: 4.8 },
]

const mockRecommendations: Novel[] = [
  { id: '5', name: 'Cyber Detective', author: 'Neo Pixel', coverUrl: 'https://picsum.photos/seed/novel5/300/450', rating: 4.6 },
  { id: '6', name: 'Dragon Rider Academy', author: 'Scales McFire', coverUrl: 'https://picsum.photos/seed/novel6/300/450', rating: 4.9 },
  { id: '7', name: 'Time Travelers Diary', author: 'Chrono Ink', coverUrl: 'https://picsum.photos/seed/novel7/300/450', rating: 4.4 },
  { id: '8', name: 'Whispers in the Wind', author: 'Breeze Willows', coverUrl: 'https://picsum.photos/seed/novel8/300/450', rating: 4.3 },
]

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(mockProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [followedNovels] = useState<Novel[]>(mockFollowedNovels)
  const [recommendations] = useState<Novel[]>(mockRecommendations)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
  
    // Simulating avatar upload
    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (result && typeof result === 'string') {
        setProfile(prev => ({ ...prev, avatarUrl: result as string }))
        toast.success('Avatar updated successfully')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Simulating profile update
    setIsEditing(false)
    toast.success('Profile updated successfully')
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer mt-4">
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button variant="outline" size="sm">
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
                      value={profile.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="favoriteGenres">Favorite Genres (comma-separated)</Label>
                    <Input
                      id="favoriteGenres"
                      name="favoriteGenres"
                      value={profile.favoriteGenres.join(', ')}
                      onChange={(e) => setProfile(prev => ({ ...prev, favoriteGenres: e.target.value.split(',').map(g => g.trim()) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="readingGoal">Daily Reading Goal (pages)</Label>
                    <Input
                      id="readingGoal"
                      name="readingGoal"
                      type="number"
                      value={profile.readingGoal}
                      onChange={handleInputChange}
                      min={1}
                    />
                  </div>
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" className="ml-2" onClick={() => setIsEditing(false)}>Cancel</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{profile.username}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <p>{profile.bio}</p>
                  <div>
                    <strong>Favorite Genres:</strong> {profile.favoriteGenres.join(', ')}
                  </div>
                  <div>
                    <strong>Daily Reading Goal:</strong> {profile.readingGoal} pages
                  </div>
                  <Button onClick={() => setIsEditing(true)}>
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
              <Card key={novel.id}>
                <CardContent className="p-4">
                  <div className="aspect-w-2 aspect-h-3 mb-4">
                    <Image
                      src={novel.coverUrl}
                      alt={novel.name}
                      width={300}
                      height={450}
                      layout="responsive"
                      className="rounded-md object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{novel.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{novel.author}</p>
                  <StarRating rating={novel.rating} />
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <BookOpen className="mr-2 h-4 w-4" /> Read
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map((novel) => (
              <Card key={novel.id}>
                <CardContent className="p-4">
                  <div className="aspect-w-2 aspect-h-3 mb-4">
                    <Image
                      src={novel.coverUrl}
                      alt={novel.name}
                      width={300}
                      height={450}
                      layout="responsive"
                      className="rounded-md object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{novel.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{novel.author}</p>
                  <StarRating rating={novel.rating} />
                  <div className="flex mt-2">
                    <Button variant="outline" size="sm" className="flex-grow mr-2">
                      <BookMarked className="mr-2 h-4 w-4" /> Follow
                    </Button>
                    <Button variant="outline" size="sm" className="flex-grow">
                      <ThumbsUp className="mr-2 h-4 w-4" /> Like
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              <p className="text-3xl font-bold text-purple-600">27</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Pages Read This Week</h3>
              <p className="text-3xl font-bold text-purple-600">342</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Reading Streak</h3>
              <p className="text-3xl font-bold text-purple-600">5 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}