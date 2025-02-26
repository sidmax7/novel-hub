'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, getDoc, Timestamp, writeBatch } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast, Toaster } from 'react-hot-toast'
import { PlusIcon, Pencil, Trash, AlertTriangle, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parse } from 'papaparse'

interface Chapter {
  id?: string
  title: string
  link: string
  chapter: number
  releaseDate?: Timestamp
}

interface Novel {
  novelId?: string
  title: string
  coverPhoto: string
  brand: {
    name: string
    logo: string
  }
}

export default function ChapterManagement() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [novel, setNovel] = useState<Novel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const novelId = params.novelId as string

  const fetchNovelDetails = async () => {
    try {
      const novelDoc = await getDoc(doc(db, 'novels', novelId))
      if (novelDoc.exists()) {
        setNovel({ novelId: novelDoc.id, ...novelDoc.data() } as Novel)
      } else {
        setError("Novel not found")
      }
    } catch (error) {
      console.error('Error fetching novel details:', error)
      setError(`Failed to fetch novel details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchChapters = async () => {
    setLoading(true)
    setError(null)
    try {
      const chaptersRef = collection(db, 'novels', novelId, 'chapters')
      const q = query(chaptersRef, orderBy('chapter'))
      const querySnapshot = await getDocs(q)
      const fetchedChapters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter))
      setChapters(fetchedChapters)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      setError(`Failed to fetch chapters: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to fetch chapters. Please try again.')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentChapter) return

    try {
      const chapterData = {
        ...currentChapter,
        chapter: Number(currentChapter.chapter),
        releaseDate: Timestamp.now()
      }

      if (currentChapter.id) {
        await updateDoc(doc(db, 'novels', novelId, 'chapters', currentChapter.id), chapterData)
        toast.success('Chapter updated successfully')
      } else {
        await addDoc(collection(db, 'novels', novelId, 'chapters'), chapterData)
        toast.success('Chapter added successfully')
      }
      setIsDialogOpen(false)
      fetchChapters()
    } catch (error) {
      console.error('Error saving chapter:', error)
      toast.error(`Failed to save chapter: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      try {
        await deleteDoc(doc(db, 'novels', novelId, 'chapters', id))
        toast.success('Chapter deleted successfully')
        fetchChapters()
      } catch (error) {
        console.error('Error deleting chapter:', error)
        toast.error(`Failed to delete chapter: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentChapter(prev => ({ ...prev!, [name]: value }))
  }

  const handleMoveChapter = async (chapterId: string, direction: 'up' | 'down') => {
    const chapterIndex = chapters.findIndex(chapter => chapter.id === chapterId)
    if (chapterIndex === -1) return

    const newChapters = [...chapters]
    const chapter = newChapters[chapterIndex]
    let swapChapter: Chapter

    if (direction === 'up' && chapterIndex > 0) {
      swapChapter = newChapters[chapterIndex - 1]
    } else if (direction === 'down' && chapterIndex < newChapters.length - 1) {
      swapChapter = newChapters[chapterIndex + 1]
    } else {
      return
    }

    const tempchapter = chapter.chapter
    chapter.chapter = swapChapter.chapter
    swapChapter.chapter = tempchapter

    try {
      await updateDoc(doc(db, 'novels', novelId, 'chapters', chapter.id!), { chapter: chapter.chapter })
      await updateDoc(doc(db, 'novels', novelId, 'chapters', swapChapter.id!), { chapter: swapChapter.chapter })
      toast.success('Chapter order updated successfully')
      fetchChapters()
    } catch (error) {
      console.error('Error updating chapter order:', error)
      toast.error(`Failed to update chapter order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    parse(file, {
      header: true,
      complete: async (results) => {
        try {
          console.log(`Attempting to upload ${results.data.length} chapters`);
          
          // Create a batch
          const batch = writeBatch(db);
          const chaptersRef = collection(db, 'novels', novelId, 'chapters');
          
          const chaptersToAdd = results.data.map((row: any) => ({
            title: row.title,
            link: row.link,
            chapter: Number(row.chapter),
            releaseDate: Timestamp.now()
          }));

          // Add chapters in batches of 500 (Firestore limit)
          for (const chapter of chaptersToAdd) {
            const newChapterRef = doc(chaptersRef);
            batch.set(newChapterRef, chapter);
          }

          // Commit the batch
          await batch.commit();
          
          console.log(`Successfully processed ${chaptersToAdd.length} chapters`);
          toast.success(`Successfully uploaded ${chaptersToAdd.length} chapters`);
          fetchChapters();
        } catch (error) {
          console.error('Error uploading chapters:', error);
          toast.error(`Failed to upload chapters: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  }

  const copyFormatTemplate = () => {
    const template = 'title,link,chapter\nChapter Title,https://example.com/chapter-link,1\nChapter Title,https://example.com/chapter-link,2\nChapter Title,https://example.com/chapter-link,3';
    navigator.clipboard.writeText(template)
      .then(() => toast.success('Format template copied to clipboard!'))
      .catch(() => toast.error('Failed to copy template'));
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.userType !== 'admin' && userData.userType !== 'author') {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
        router.push('/');
      }
    };

    checkAccess();
    fetchNovelDetails();
    fetchChapters();
  }, [user, router]);

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Chapter Management</CardTitle>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Novels
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {novel && (
            <div className="flex items-center space-x-4 mb-4">
              <img src={novel.coverPhoto} alt={novel.title} className="w-16 h-24 object-cover rounded" />
              <div>
                <h2 className="text-xl font-semibold">{novel.title}</h2>
                <p className="text-gray-600">Published by {novel.brand.name}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentChapter?.id ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="chapter">Chapter Number</Label>
              <Input 
                id="chapter" 
                name="chapter" 
                type="number" 
                min="1" 
                value={currentChapter?.chapter || ''} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={currentChapter?.title || ''} onChange={handleInputChange} required />
            </div>
            
            <div>
              <Label htmlFor="link">Chapter Link</Label>
              <Textarea id="link" name="link" value={currentChapter?.link || ''} onChange={handleInputChange} required rows={4} />
            </div>
            <Button type="submit">Save Chapter</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 mb-4">
        <Button onClick={() => {
          setCurrentChapter({ title: '', link: '', chapter: chapters.length + 1 });
          setIsDialogOpen(true);
        }}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Chapter
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
            <PlusIcon className="mr-2 h-4 w-4" /> Upload Chapters (CSV)
          </Button>
          <Input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button 
            variant="ghost" 
            onClick={copyFormatTemplate}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Copy CSV Format
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapters.map((chapter, index) => (
              <TableRow key={chapter.id}>
                <TableCell>{chapter.chapter}</TableCell>
                <TableCell>{chapter.title}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setCurrentChapter(chapter); setIsDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {chapter.title}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => chapter.id && handleDelete(chapter.id)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete {chapter.title}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => chapter.id && handleMoveChapter(chapter.id, 'up')} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Move {chapter.title} up</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => chapter.id && handleMoveChapter(chapter.id, 'down')} disabled={index === chapters.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Move {chapter.title} down</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
