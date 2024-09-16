'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/authcontext'
import { db, storage } from '@/lib/firebaseConfig'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast, Toaster } from 'react-hot-toast'
import { PlusIcon, Pencil, Trash, Upload, AlertTriangle, BookOpen } from 'lucide-react'
import Image from 'next/image'
import { StarRating } from '@/components/ui/starrating'
import Link from 'next/link'

interface Novel {
  id?: string
  name: string
  author: string
  authorId: string
  synopsis: string
  genre: string
  tags: string[]
  type: string
  releaseDate: string
  lastUpdated: string
  language: string
  rating: number
  chapters: number
  views: number
  rank: number
  coverUrl: string
}

const genres = [
  "Fantasy", "Science Fiction", "Romance", "Action", "Mystery", "Slice of Life", "Isekai", "Horror"
]

const types = [
  "Light Novel", "Manga", "Education", "Biography", "History", "Fiction"
]

export default function AdminDashboard() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      fetchNovels()
    } else {
      setError("User not authenticated. Please log in.")
      setLoading(false)
    }
  }, [user])

  const fetchNovels = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const q = query(
        collection(db, 'novels'),
        where('authorId', '==', user.uid),
        orderBy('name')
      )
      const querySnapshot = await getDocs(q)
      const fetchedNovels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel))
      setNovels(fetchedNovels)
    } catch (error) {
      console.error('Error fetching novels:', error)
      setError(`Failed to fetch novels: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to fetch novels. Please try again.')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !currentNovel) return

    try {
      const novelData = {
        ...currentNovel,
        author: user.displayName || 'Anonymous',
        authorId: user.uid,
        lastUpdated: new Date().toISOString(),
        rating: Number(currentNovel.rating),
        chapters: Number(currentNovel.chapters),
        views: Number(currentNovel.views),
        rank: Number(currentNovel.rank)
      }

      if (currentNovel.id) {
        await updateDoc(doc(db, 'novels', currentNovel.id), novelData)
        toast.success('Novel updated successfully')
      } else {
        await addDoc(collection(db, 'novels'), novelData)
        toast.success('Novel added successfully')
      }
      setIsDialogOpen(false)
      fetchNovels()
    } catch (error) {
      console.error('Error saving novel:', error)
      toast.error(`Failed to save novel: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this novel?')) {
      try {
        await deleteDoc(doc(db, 'novels', id))
        toast.success('Novel deleted successfully')
        fetchNovels()
      } catch (error) {
        console.error('Error deleting novel:', error)
        toast.error(`Failed to delete novel: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentNovel(prev => ({ ...prev!, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCurrentNovel(prev => ({ ...prev!, [name]: value }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim())
    setCurrentNovel(prev => ({ ...prev!, tags }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingImage(true)
    try {
      const storageRef = ref(storage, `novel-cover/${user.uid}/${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      setCurrentNovel(prev => ({ ...prev!, coverUrl: downloadURL }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setUploadingImage(false)
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          You must be logged in to access this page. Please log in and try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Novel Admin Dashboard</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setCurrentNovel({ author: user.displayName || 'Anonymous', authorId: user.uid } as Novel)} className="mb-4">
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Novel
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentNovel?.id ? 'Edit Novel' : 'Add New Novel'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={currentNovel?.name || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input id="author" name="author" value={currentNovel?.author || user.displayName || 'Anonymous'} disabled />
            </div>
            <div>
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea id="synopsis" name="synopsis" value={currentNovel?.synopsis || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select name="genre" value={currentNovel?.genre || ''} onValueChange={(value) => handleSelectChange('genre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase()}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" name="tags" value={currentNovel?.tags?.join(', ') || ''} onChange={handleTagsChange} />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" value={currentNovel?.type || ''} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input id="releaseDate" name="releaseDate" type="date" value={currentNovel?.releaseDate || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input id="language" name="language" value={currentNovel?.language || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Input 
                id="rating" 
                name="rating" 
                type="number" 
                min="0" 
                max="5" 
                step="0.1" 
                value={currentNovel?.rating || ''} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="chapters">Chapters</Label>
              <Input id="chapters" name="chapters" type="number" min="0" value={currentNovel?.chapters || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="views">Views</Label>
              <Input id="views" name="views" type="number" min="0" value={currentNovel?.views || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="rank">Rank</Label>
              <Input id="rank" name="rank" type="number" min="1" value={currentNovel?.rank || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image</Label>
              <div className="flex items-center space-x-4">
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {currentNovel?.coverUrl && (
                  <Image
                    src={currentNovel.coverUrl}
                    alt="Novel cover"
                    width={100}
                    height={150}
                    className="object-cover rounded"
                  />
                )}
              </div>
            </div>
            <Button type="submit">Save Novel</Button>
          </form>
        </DialogContent>
      </Dialog>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.map((novel) => (
              <TableRow key={novel.id}>
                <TableCell>
                  {novel.coverUrl && (
                    <Image
                      src={novel.coverUrl}
                      alt={`Cover for ${novel.name}`}
                      width={50}
                      height={75}
                      className="object-cover rounded"
                    />
                  )}
                </TableCell>
                <TableCell>{novel.name}</TableCell>
                <TableCell>{novel.author}</TableCell>
                <TableCell>{novel.genre}</TableCell>
                <TableCell>{novel.type}</TableCell>
                <TableCell><StarRating rating={novel.rating} /></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setCurrentNovel(novel); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit {novel.name}</span>
                  </Button>
                  <Link href={`/admin/novel/${novel.id}/chapters`} passHref>
                    <Button variant="outline" size="sm" className="mr-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="sr-only">Manage Chapters for {novel.name}</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => novel.id && handleDelete(novel.id)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete {novel.name}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}