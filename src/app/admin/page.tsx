'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/authcontext'
import { db, storage } from '@/lib/firebaseConfig'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore'
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
import { PlusIcon, Pencil, Trash, Upload, AlertTriangle, BookOpen, Home } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Timestamp } from 'firebase/firestore'
import { Novel } from '@/models/Novel'

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
  const [currentNovel, setCurrentNovel] = useState<Novel | null>({
    novelId: '',
    title: '',
    synopsis: '',
    coverPhoto: '',
    extraArt: [],
    brand: {
      name: '',
      logo: '',
    },
    seriesType: 'ORIGINAL',
    styleCategory: {
      primary: '',
      secondary: [],
    },
    language: {
      original: '',
      translated: [],
    },
    publishers: {
      original: '',
      english: '',
    },
    releaseFrequency: '',
    alternativeNames: {
      abbreviations: [],
      originalName: '',
      otherNames: [],
    },
    chapterType: 'TEXT',
    totalChapters: 0,
    seriesStatus: 'ONGOING',
    availability: {
      type: 'FREE',
      price: 0,
    },
    seriesInfo: {
      volumeNumber: 0,
      seriesNumber: 0,
      releaseYear: new Date().getFullYear(),
      releaseMonth: new Date().getMonth() + 1,
      firstReleaseDate: Timestamp.now(),
    },
    credits: {
      authors: [],
      artists: {
        translators: [],
        editors: [],
        proofreaders: [],
        posters: [],
        rawProviders: [],
        artDirectors: [],
        drafters: [],
        lineArtists: [],
        colorArtists: [],
        compositors: [],
        typesetters: [],
        projectManagers: [],
      },
    },
    genres: [],
    tags: [],
    metadata: {
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    likes: 0,
    views: 0,
    rating: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorsList, setAuthorsList] = useState<{ id: string; name: string; username: string; }[]>([]);

  

  useEffect(() => {
    const initializeAdminDashboard = async () => {
      if (user) {
        setLoading(true);
        try {
          await checkUserType();
          if (isAdmin) {  // Only fetch authors if user is admin
            console.log("Is admin, fetching authors..."); // Debug log
            await fetchAuthors();
          }
          await fetchNovels();
        } catch (error) {
          console.error("Error in initialization:", error);
        }
        setLoading(false);
      } else {
        setError("User not authenticated. Please log in.");
        setLoading(false);
      }
    };

    initializeAdminDashboard();
  }, [user, isAdmin]);

  const checkUserType = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("User data:", userData); // Debug log
        console.log("User type:", userData.userType); // Debug log
        setIsAuthor(userData.userType === 'author');
        setIsAdmin(userData.userType === 'admin');
      } else {
        setIsAuthor(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      setIsAuthor(false);
      setIsAdmin(false);
    }
  };

  const fetchNovels = async () => {
    if (!user) return;
    setError(null);
    try {
      let q;
      console.log("Is admin?", isAdmin); // Debug log
      if (isAdmin) {
        // Admin sees all novels
        q = query(
          collection(db, 'novels'),
          orderBy('title')
        );
      } else {
        // Authors see only their uploaded novels
        q = query(
          collection(db, 'novels'),
          where('uploader', '==', user.uid),
          orderBy('title')
        );
      }
      const querySnapshot = await getDocs(q);
      console.log("Fetched novels count:", querySnapshot.size); // Debug log
      const fetchedNovels = querySnapshot.docs.map(doc => ({  novelId: doc.id, ...doc.data() } as Novel));
      console.log("Fetched novels:", fetchedNovels); // Debug log
      setNovels(fetchedNovels);
    } catch (error) {
      console.error('Error fetching novels:', error);
      setError(`Failed to fetch novels: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to fetch novels. Please try again.');
    }
  };

  const fetchAuthors = async () => {
    try {
      console.log("Fetching authors..."); // Debug log
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userType', 'in', ['author', 'admin']));
      const querySnapshot = await getDocs(q);
      console.log("Query snapshot size:", querySnapshot.size); // Debug log
      
      querySnapshot.forEach((doc) => {
        console.log("User document:", doc.id, doc.data()); // Debug log
      });

      const authors = querySnapshot.docs.map(doc => {
        const userData = doc.data();
        console.log("Processing user data:", userData); // Debug log
        return {
          id: doc.id,
          name: userData.username || userData.displayName || userData.email || 'Unknown Author',
          username: userData.username || 'Unknown'
        };
      });
      console.log("Processed authors:", authors); // Debug log
      setAuthorsList(authors);
    } catch (error) {
      console.error('Error fetching authors:', error);
      if (error instanceof Error && error.name === 'FirebaseError') {
        const fbError = error as { code?: string, message?: string }
        console.error('Firestore error code:', fbError.code)
        console.error('Firestore error message:', fbError.message)
      }
      toast.error('Failed to fetch authors list');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !currentNovel) return;

    try {
      const novelData: Omit<Novel, 'novelId'> = {
        title: currentNovel.title || '',
        synopsis: currentNovel.synopsis || '',
        coverPhoto: currentNovel.coverPhoto || '',
        extraArt: currentNovel.extraArt || [],
        brand: {
          name: currentNovel.brand?.name || '',
          logo: currentNovel.brand?.logo || '',
        },
        seriesType: currentNovel.seriesType || 'ORIGINAL',
        styleCategory: {
          primary: currentNovel.styleCategory?.primary || '',
          secondary: currentNovel.styleCategory?.secondary || [],
        },
        language: {
          original: currentNovel.language?.original || '',
          translated: currentNovel.language?.translated || [],
        },
        publishers: {
          original: currentNovel.publishers?.original || '',
          english: currentNovel.publishers?.english || '',
        },
        releaseFrequency: currentNovel.releaseFrequency || '',
        alternativeNames: {
          abbreviations: currentNovel.alternativeNames?.abbreviations || [],
          originalName: currentNovel.alternativeNames?.originalName || '',
          otherNames: currentNovel.alternativeNames?.otherNames || [],
        },
        chapterType: currentNovel.chapterType || 'TEXT',
        totalChapters: currentNovel.totalChapters || 0,
        seriesStatus: currentNovel.seriesStatus || 'ONGOING',
        availability: {
          type: currentNovel.availability?.type || 'FREE',
          price: currentNovel.availability?.price || 0,
        },
        seriesInfo: {
          volumeNumber: currentNovel.seriesInfo?.volumeNumber || 0,
          seriesNumber: currentNovel.seriesInfo?.seriesNumber || 0,
          releaseYear: currentNovel.seriesInfo?.releaseYear || new Date().getFullYear(),
          releaseMonth: currentNovel.seriesInfo?.releaseMonth || new Date().getMonth() + 1,
          firstReleaseDate: currentNovel.seriesInfo?.firstReleaseDate || Timestamp.now(),
        },
        credits: {
          authors: currentNovel.credits?.authors || [],
          artists: {
            translators: currentNovel.credits?.artists?.translators || [],
            editors: currentNovel.credits?.artists?.editors || [],
            proofreaders: currentNovel.credits?.artists?.proofreaders || [],
            posters: currentNovel.credits?.artists?.posters || [],
            rawProviders: currentNovel.credits?.artists?.rawProviders || [],
            artDirectors: currentNovel.credits?.artists?.artDirectors || [],
            drafters: currentNovel.credits?.artists?.drafters || [],
            lineArtists: currentNovel.credits?.artists?.lineArtists || [],
            colorArtists: currentNovel.credits?.artists?.colorArtists || [],
            compositors: currentNovel.credits?.artists?.compositors || [],
            typesetters: currentNovel.credits?.artists?.typesetters || [],
            projectManagers: currentNovel.credits?.artists?.projectManagers || [],
          },
        },
        genres: currentNovel.genres || [],
        tags: currentNovel.tags || [],
        metadata: {
          createdAt: currentNovel.metadata?.createdAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        likes: currentNovel.likes || 0,
        views: currentNovel.views || 0,
        uploader: isAdmin ? currentNovel.uploader || user.uid : user.uid,
        rating: currentNovel.rating || 0,
      };

      if (currentNovel.novelId) {
        await updateDoc(doc(db, 'novels', currentNovel.novelId), novelData as any);
        toast.success('Novel updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'novels'), novelData as any);
        await updateDoc(docRef, { id: docRef.id });
        toast.success('Novel added successfully');
      }
      setIsDialogOpen(false);
      fetchNovels();
    } catch (error) {
      console.error('Error saving novel:', error);
      toast.error(`Failed to save novel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
    const { name, value } = e.target;

    setCurrentNovel(prev => {
      if (!prev) return prev;

      const keys = name.split('.');
      if (keys.length === 1) {
        if (name === 'genres') {
          return { ...prev, genres: value.split(',').map(genre => ({ name: genre.trim() })) };
        }
        if (name === 'extraArt') {
          return { ...prev, extraArt: value.split(',').map(url => url.trim()) };
        }
        if (name === 'price') {
          const price = parseFloat(value);
          const availabilityType = price > 0 ? 'PAID' : 'FREE';
          return {
            ...prev,
            availability: {
              ...prev.availability,
              price,
              type: availabilityType,
            },
          };
        }
        return { ...prev, [name]: value };
      } else {
        const [firstKey, secondKey] = keys;
        if (firstKey === 'language' && secondKey === 'translated') {
          return {
            ...prev,
            language: {
              ...prev.language,
              translated: value.split(',').map(lang => lang.trim()),
            },
          };
        }
        if (firstKey === 'styleCategory' && secondKey === 'secondary') {
          return {
            ...prev,
            styleCategory: {
              ...prev.styleCategory,
              secondary: value.split(',').map(style => style.trim()),
            },
          };
        }
        return {
          ...prev,
          [firstKey]: {
            ...(prev[firstKey as keyof Novel] as object),
            [secondKey]: value,
          },
        };
      }
    });
  };

  const handleSelectChange = <T extends string>(name: string, value: T) => {
    setCurrentNovel(prev => {
      if (!prev) return prev;
      if (name === 'availability.type') {
        return {
          ...prev,
          availability: {
            ...prev.availability,
            type: value as 'FREE' | 'FREEMIUM' | 'PAID',
          },
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim())
    setCurrentNovel(prev => ({ ...prev!, tags }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    await setUploadingImage(true)
    try {
      const storageRef = ref(storage, `novel-cover/${user.uid}/${currentNovel?.title}`)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentNovel) return;

    try {
      const storageRef = ref(storage, `coverphoto/${user.uid}/${currentNovel.title}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setCurrentNovel(prev => ({ ...prev!, coverPhoto: downloadURL }));
      toast.success('Cover photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.error(`Failed to upload cover photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getPageTitle = () => {
    if (isAdmin) {
      return "Novellize Admin Dashboard";
    }
    return "Author Dashboard";
  };

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        <Link href="./" passHref>
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex space-x-4 mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setCurrentNovel({ author: user.displayName || 'Anonymous', authorId: user.uid } as unknown as Novel)}
              disabled={!isAuthor}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Novel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentNovel?.novelId ? 'Edit Novel' : 'Add New Novel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={currentNovel?.title || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea id="synopsis" name="synopsis" value={currentNovel?.synopsis || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="coverPhoto">Cover Photo</Label>
                <Input type="file" id="coverPhoto" name="coverPhoto" accept="image/*" onChange={handleFileChange} />
              </div>
              <div>
                <Label htmlFor="extraArt">Extra Art URLs (comma-separated)</Label>
                <Input id="extraArt" name="extraArt" value={currentNovel?.extraArt?.join(', ') || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input id="brandName" name="brand.name" value={currentNovel?.brand?.name || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="brandLogo">Brand Logo URL</Label>
                <Input id="brandLogo" name="brand.logo" value={currentNovel?.brand?.logo || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="seriesType">Series Type</Label>
                <Select name="seriesType" value={currentNovel?.seriesType || 'ORIGINAL'} onValueChange={(value) => handleSelectChange('seriesType', value as 'ORIGINAL' | 'TRANSLATED' | 'FAN_FIC')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORIGINAL">Original</SelectItem>
                    <SelectItem value="TRANSLATED">Translated</SelectItem>
                    <SelectItem value="FAN_FIC">Fan Fiction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="primaryStyle">Primary Style Category</Label>
                <Input id="primaryStyle" name="styleCategory.primary" value={currentNovel?.styleCategory?.primary || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="secondaryStyles">Secondary Style Categories (comma-separated)</Label>
                <Input id="secondaryStyles" name="styleCategory.secondary" value={currentNovel?.styleCategory?.secondary?.join(', ') || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="originalLanguage">Original Language</Label>
                <Input id="originalLanguage" name="language.original" value={currentNovel?.language?.original || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="translatedLanguages">Translated Languages (comma-separated)</Label>
                <Input id="translatedLanguages" name="language.translated" value={currentNovel?.language?.translated?.join(', ') || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="releaseFrequency">Release Frequency</Label>
                <Input id="releaseFrequency" name="releaseFrequency" value={currentNovel?.releaseFrequency || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="totalChapters">Total Chapters</Label>
                <Input id="totalChapters" name="totalChapters" type="number" min="0" value={currentNovel?.totalChapters || 0} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="seriesStatus">Series Status</Label>
                <Select name="seriesStatus" value={currentNovel?.seriesStatus || 'ONGOING'} onValueChange={(value) => handleSelectChange('seriesStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ON HOLD">On Hold</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availabilityType">Availability Type</Label>
                <Select name="availability.type" value={currentNovel?.availability?.type || 'FREE'} onValueChange={(value) => handleSelectChange('availability.type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="FREEMIUM">Freemium</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="availability.price" type="number" min="0" value={currentNovel?.availability?.price || 0} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="genres">Genres (comma-separated)</Label>
                <Input id="genres" name="genres" value={currentNovel?.genres?.map(genre => genre.name).join(', ') || ''} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" value={currentNovel?.tags?.join(', ') || ''} onChange={handleTagsChange} />
              </div>
              {isAdmin && (
                <div>
                  <Label htmlFor="uploader">Uploader</Label>
                  <Select
                    value={currentNovel?.uploader || user?.uid}
                    onValueChange={(value) => handleSelectChange('uploader', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an uploader" />
                    </SelectTrigger>
                    <SelectContent>
                      {authorsList.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          {author.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit">Save Novel</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {!isAuthor && (
        <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>Only authors can add new novels. If you believe this is an error, please contact support.</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Series Type</TableHead>
              <TableHead>Primary Style</TableHead>
              {isAdmin && <TableHead>Uploader</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.map((novel) => (
              <TableRow key={novel.novelId}>
                <TableCell>
                  <div className="relative w-16 h-24">
                    <Image
                      src={novel.coverPhoto}
                      alt={novel.title}
                      fill
                      sizes="64px"
                      className="object-cover rounded-sm"
                      placeholder="blur"
                      blurDataURL="/path/to/placeholder.png"
                    />
                  </div>
                </TableCell>
                <TableCell>{novel.title}</TableCell>
                <TableCell>{novel.seriesStatus}</TableCell>
                <TableCell>{novel.seriesType}</TableCell>
                <TableCell>{novel.styleCategory.primary}</TableCell>
                {isAdmin && <TableCell>{authorsList.find(author => author.id === novel.uploader)?.username || 'Unknown'}</TableCell>}
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setCurrentNovel(novel); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4"/>
                  </Button>
                  <Link href={`/admin/novel/${novel.novelId}/chapters`} passHref>
                    <Button variant="outline" size="sm" className="mr-2">
                      <BookOpen className="h-4 w-4"/>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => novel.novelId && handleDelete(novel.novelId)}>
                    <Trash className="h-4 w-4"/>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!isAdmin && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Author View</AlertTitle>
          <AlertDescription>You are viewing your uploaded novels. Only administrators can view all novels.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
