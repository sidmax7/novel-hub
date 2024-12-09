'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { PlusIcon, Pencil, Trash, AlertTriangle, BookOpen, Home, User, Eye, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Timestamp } from 'firebase/firestore'
import { Novel } from '@/models/Novel'
import { Autocomplete } from '@/components/ui/autocomplete'
import { genreColors } from '@/app/genreColors'
import { tags } from '../tags'
// import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"


// Define the style categories
const styleCategories = [
  "Light Novels",
  "Published Novels",
  "Web Novels/Webtoons",
  "Graphic Novels",
  "Novella/Short Story",
  "Serialized Novels",
  "Episodic Novels",
  "Epistolary Novels",
  "Anthology Novels",
  "Choose Your Own Adventure Novels",
  "Novels-in-Verse",
  "Art"
];

// Add these at the top of your file with other constants
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1899 }, (_, i) => String(currentYear - i));
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Function to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Add these stats-related components near the top of the file
const StatsCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

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
    alternativeNames: '',
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
  const { user } = useAuth()
  const [isAuthor, setIsAuthor] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorsList, setAuthorsList] = useState<{ id: string; name: string; username: string; }[]>([]);
  const [authorsInput, setAuthorsInput] = useState<string[]>([]);

  useEffect(() => {
    if (currentNovel) {
      setAuthorsInput(currentNovel.credits.authors || []);
    }
  }, [currentNovel]);

  // Add these new state variables for stats
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
  });

  // Define fetchNovels as a callback
  const fetchNovels = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setLoading(true);
      let q;
      if (isAdmin) {
        q = query(
          collection(db, 'novels'), 
          orderBy('metadata.createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'novels'),
          where('uploader', '==', user.uid),
          orderBy('metadata.createdAt', 'desc')
        );
      }
      const querySnapshot = await getDocs(q);
      const fetchedNovels = querySnapshot.docs.map(doc => ({
        novelId: doc.id,
        ...doc.data()
      } as Novel));
      setNovels(fetchedNovels);
    } catch (error) {
      console.error('Error fetching novels:', error);
      setError(`Failed to fetch novels: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to fetch novels. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]); // Dependencies for the callback

  // Check user type
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        setIsAuthor(false);
        setIsAdmin(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsAuthor(userData.userType === 'author');
          setIsAdmin(userData.userType === 'admin');
        }
      } catch (error) {
        console.error('Error checking user type:', error);
        setIsAuthor(false);
        setIsAdmin(false);
      }
    };

    checkUserType();
  }, [user]);

  // Fetch authors when isAdmin changes
  useEffect(() => {
    const fetchAuthors = async () => {
      if (!isAdmin) return;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('userType', 'in', ['author', 'admin']));
        const querySnapshot = await getDocs(q);
        const authors = querySnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            name: userData.username || userData.displayName || userData.email || 'Unknown Author',
            username: userData.username || 'Unknown'
          };
        });
        setAuthorsList(authors);
      } catch (error) {
        console.error('Error fetching authors:', error);
        toast.error('Failed to fetch authors list');
      }
    };

    fetchAuthors();
  }, [isAdmin]);

  // Fetch novels when dependencies change
  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  // Add this function to calculate stats
  const calculateStats = useCallback(() => {
    const newStats = novels.reduce((acc, novel) => ({
      totalViews: acc.totalViews + (novel.views || 0),
      totalLikes: acc.totalLikes + (novel.likes || 0),
    }), {
      totalViews: 0,
      totalLikes: 0,
    });

    setStats(newStats);
  }, [novels]);

  // Add this effect to update stats when novels change
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const handleAddAuthor = () => {
    setAuthorsInput([...authorsInput, '']);
  };

  const handleAuthorChange = (index: number, value: string) => {
    const updatedAuthors = [...authorsInput];
    updatedAuthors[index] = value;
    setAuthorsInput(updatedAuthors);
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
        alternativeNames: currentNovel.alternativeNames || '',
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
          authors: authorsInput.filter(Boolean),
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
      await fetchNovels(); // Refresh the novels list after submit
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

      // Handle extraArt field specifically
      if (name === 'extraArt') {
        return { ...prev, extraArt: value.split(',').map(url => url.trim()).filter(Boolean) };
      }

      return { ...prev, [name]: value };
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Novels"
            value={novels.length}
            icon={BookOpen}
          />
          <StatsCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={Eye}
          />
          <StatsCard
            title="Total Likes"
            value={stats.totalLikes.toLocaleString()}
            icon={Star}
          />
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Series Status Distribution</h3>
            <div className="space-y-2">
              {Object.entries(novels.reduce((acc, novel) => ({
                ...acc,
                [novel.seriesStatus]: (acc[novel.seriesStatus] || 0) + 1
              }), {} as Record<string, number>)).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm">{status}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Style Categories</h3>
            <div className="space-y-2">
              {Object.entries(novels.reduce((acc, novel) => ({
                ...acc,
                [novel.styleCategory.primary]: (acc[novel.styleCategory.primary] || 0) + 1
              }), {} as Record<string, number>)).map(([style, count]) => (
                <div key={style} className="flex justify-between items-center">
                  <span className="text-sm">{style || 'Uncategorized'}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Activity</h3>
            <div className="space-y-2">
              {novels
                .sort((a, b) => b.metadata.updatedAt.toMillis() - a.metadata.updatedAt.toMillis())
                .slice(0, 5)
                .map(novel => (
                  <div key={novel.novelId} className="flex justify-between items-center">
                    <span className="text-sm truncate">{novel.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(novel.metadata.updatedAt.toMillis()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/admin/users" passHref>
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" /> Manage Users
              </Button>
            </Link>
          )}
          <Link href="./" passHref>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
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
              onClick={() => setCurrentNovel({ 
                ...currentNovel,
                uploader: user.uid,
                metadata: {
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                }
              } as Novel)}
              disabled={!isAuthor && !isAdmin}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Novel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentNovel?.novelId ? 'Edit Novel' : 'Add New Novel'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Main Authors</Label>
                {authorsInput.length === 0 && (
                    <Button type="button" size="sm" onClick={handleAddAuthor} className="w-full">
                        <PlusIcon className="h-4 w-4 mr-2" /> Add Author
                    </Button>
                )}
                {authorsInput.map((author, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <Input
                            value={author}
                            onChange={(e) => handleAuthorChange(index, e.target.value)}
                            placeholder="Enter author name"
                        />
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => {
                                const newAuthors = [...authorsInput];
                                newAuthors.splice(index, 1);
                                setAuthorsInput(newAuthors);
                            }}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                        {index === authorsInput.length - 1 && (
                            <Button type="button" size="sm" onClick={handleAddAuthor}>
                                <PlusIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={currentNovel?.title || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="synopsis">Synopsis/Summary</Label>
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
                <Label htmlFor="brandName">Brand/Company/Group</Label>
                <Input
                  id="brandName"
                  name="brand.name"
                  value={currentNovel?.brand?.name || ''}
                  onChange={(e) => {
                    const { value } = e.target;
                    setCurrentNovel(prev => ({
                      ...prev!,
                      brand: {
                        ...prev!.brand,
                        name: value
                      }
                    }));
                  }}
                  placeholder="Enter brand name"
                />
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
                <Label htmlFor="styleCategory">Style Category</Label>
                <Autocomplete
                  suggestions={styleCategories} // Use the style categories array
                  selectedItems={currentNovel?.styleCategory?.primary ? [currentNovel.styleCategory.primary] : []}
                  onSelect={(items) => {
                    setCurrentNovel(prev => ({
                      ...prev!,
                      styleCategory: {
                        ...prev!.styleCategory,
                        primary: items[0] || '' // Set the first selected item as the primary style category
                      }
                    }))
                  }}
                  placeholder="Select a style category..."
                />
                
              </div>
              {/* {/* <div>
                <Label htmlFor="secondaryStyles">Secondary Style Categories (comma-separated)</Label>
                <Input id="secondaryStyles" name="styleCategory.secondary" value={currentNovel?.styleCategory?.secondary?.join(', ') || ''} onChange={handleInputChange} />
              </div> */}
              <div>
                <Label htmlFor="originalLanguage">Original Language</Label>
                <Input
                  id="originalLanguage"
                  name="language.original"
                  value={currentNovel?.language?.original || ''}
                  onChange={(e) => {
                    const { value } = e.target;
                    setCurrentNovel(prev => ({
                      ...prev!,
                      language: {
                        ...prev!.language,
                        original: value
                      }
                    }));
                  }}
                  placeholder="Enter original language"
                />
              </div>
              <div>
                <Label htmlFor="publishersOriginal">Original Publisher</Label>
                <Input
                  id="publishersOriginal"
                  name="publishers.original"
                  value={currentNovel?.publishers?.original || ''}
                  onChange={(e) => {
                    const { value } = e.target;
                    setCurrentNovel(prev => ({
                      ...prev!,
                      publishers: {
                        ...prev!.publishers,
                        original: value
                      }
                    }));
                  }}
                  placeholder="Enter original publisher"
                />
              </div>
              <div>
                <Label htmlFor="publishersEnglish">English Publisher</Label>
                <Input
                  id="publishersEnglish"
                  name="publishers.english"
                  value={currentNovel?.publishers?.english || ''}
                  onChange={(e) => {
                    const { value } = e.target;
                    setCurrentNovel(prev => ({
                      ...prev!,
                      publishers: {
                        ...prev!.publishers,
                        english: value
                      }
                    }));
                  }}
                  placeholder="Enter English publisher"
                />
              </div>
              {/* <div>
                <Label htmlFor="translatedLanguages">Translated Languages (comma-separated)</Label>
              </div> */}
              <div>
                <Label htmlFor="translatedLanguages">Translated Languages (comma-separated)</Label>
                <Input
                  id="translatedLanguages"
                  name="language.translated"
                  value={currentNovel?.language?.translated?.join(', ') || ''}
                  onChange={(e) => {
                    const languages = e.target.value.split(',').map(lang => lang.trim()).filter(Boolean);
                    setCurrentNovel(prev => ({
                      ...prev!,
                      language: {
                        ...prev!.language,
                        translated: languages
                      }
                    }));
                  }}
                  placeholder="Enter translated languages, separated by commas"
                />
              </div>
              <div>
                <Label htmlFor="releaseFrequency">Release Frequency per Week</Label>
                <Input id="releaseFrequency" name="releaseFrequency" type="number" min="0" value={currentNovel?.releaseFrequency || 0} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="alternativeNames">Alternative Names</Label>
                <Input
                  id="alternativeNames"
                  name="alternativeNames"
                  value={currentNovel?.alternativeNames || ''}
                  onChange={handleInputChange}
                  placeholder="Enter alternative names separated by commas"
                />
              </div>
              <div>
                <Label htmlFor="chapterType">Chapter Type</Label>
                <Select name="chapterType" value={currentNovel?.chapterType || 'TEXT'} onValueChange={(value) => handleSelectChange('chapterType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="MANGA">Manga</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="UNDER EDITING">Under Editing</SelectItem>
                    <SelectItem value="UNDER EDITING">Under Editing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availabilityType">Availability Criteria</Label>
                <Label htmlFor="availabilityType">Availability Criteria</Label>
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
              {/* {/* <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="availability.price" type="number" min="0" value={currentNovel?.availability?.price || 0} onChange={handleInputChange} />
              </div> */}
             
              <div>
                <Label htmlFor="seriesNumber">Series/Volume Number</Label>
                <Input
                  id="seriesNumber"
                  name="seriesInfo.seriesNumber"
                  type="number"
                  min="0"
                  value={currentNovel?.seriesInfo?.seriesNumber || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setCurrentNovel(prev => ({
                      ...prev!,
                      seriesInfo: {
                        ...prev!.seriesInfo,
                        seriesNumber: value
                      }
                    }));
                  }}
                  placeholder="Enter series/volume number"
                />
              </div>
              
              <div className="space-y-4">
                <Label>Series Release Year and Month</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="releaseYear" className="text-sm">Year</Label>
                    <Select
                      value={String(currentNovel?.seriesInfo?.releaseYear || currentYear)}
                      onValueChange={(value) => {
                        const year = parseInt(value);
                        setCurrentNovel(prev => ({
                          ...prev!,
                          seriesInfo: {
                            ...prev!.seriesInfo,
                            releaseYear: year,
                            firstReleaseDate: Timestamp.fromDate(new Date(
                              year,
                              (prev?.seriesInfo?.releaseMonth || 1) - 1
                            ))
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="releaseMonth" className="text-sm">Month</Label>
                    <Select
                      value={currentNovel?.seriesInfo?.releaseMonth 
                        ? String(currentNovel.seriesInfo.releaseMonth) 
                        : String(new Date().getMonth() + 1)}
                      onValueChange={(value) => {
                        const monthIndex = parseInt(value);
                        setCurrentNovel(prev => ({
                          ...prev!,
                          seriesInfo: {
                            ...prev!.seriesInfo,
                            releaseMonth: monthIndex,
                            firstReleaseDate: Timestamp.fromDate(new Date(
                              prev?.seriesInfo?.releaseYear || currentYear,
                              monthIndex - 1
                            ))
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={month} value={String(index + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Selected: {currentNovel?.seriesInfo?.releaseMonth && currentNovel?.seriesInfo?.releaseYear ? 
                    `${months[currentNovel.seriesInfo.releaseMonth - 1]} ${currentNovel.seriesInfo.releaseYear}` : 
                    'No date selected'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <Label>First Release Date</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstReleaseYear" className="text-sm">Year</Label>
                    <Select
                      value={String(currentNovel?.seriesInfo?.firstReleaseDate?.toDate().getFullYear() || currentYear)}
                      onValueChange={(value) => {
                        const year = parseInt(value);
                        const currentDate = currentNovel?.seriesInfo?.firstReleaseDate?.toDate() || new Date();
                        const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                        
                        setCurrentNovel(prev => ({
                          ...prev!,
                          seriesInfo: {
                            ...prev!.seriesInfo,
                            firstReleaseDate: Timestamp.fromDate(newDate)
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="firstReleaseMonth" className="text-sm">Month</Label>
                    <Select
                      value={String((currentNovel?.seriesInfo?.firstReleaseDate?.toDate().getMonth() || 0) + 1)}
                      onValueChange={(value) => {
                        const monthIndex = parseInt(value) - 1;
                        const currentDate = currentNovel?.seriesInfo?.firstReleaseDate?.toDate() || new Date();
                        const newDate = new Date(currentDate.getFullYear(), monthIndex, currentDate.getDate());
                        
                        setCurrentNovel(prev => ({
                          ...prev!,
                          seriesInfo: {
                            ...prev!.seriesInfo,
                            firstReleaseDate: Timestamp.fromDate(newDate)
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={month} value={String(index + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="firstReleaseDay" className="text-sm">Day</Label>
                    <Select
                      value={String(currentNovel?.seriesInfo?.firstReleaseDate?.toDate().getDate() || 1)}
                      onValueChange={(value) => {
                        const day = parseInt(value);
                        const currentDate = currentNovel?.seriesInfo?.firstReleaseDate?.toDate() || new Date();
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        
                        setCurrentNovel(prev => ({
                          ...prev!,
                          seriesInfo: {
                            ...prev!.seriesInfo,
                            firstReleaseDate: Timestamp.fromDate(newDate)
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: getDaysInMonth(
                            currentNovel?.seriesInfo?.firstReleaseDate?.toDate().getFullYear() || currentYear,
                            (currentNovel?.seriesInfo?.firstReleaseDate?.toDate().getMonth() || 0) + 1
                          ) },
                          (_, i) => String(i + 1)
                        ).map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Selected: {currentNovel?.seriesInfo?.firstReleaseDate ? 
                    currentNovel.seriesInfo.firstReleaseDate.toDate().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 
                    'No date selected'}
                  </span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="genres">Genres</Label>
                <Autocomplete
                  suggestions={Object.keys(genreColors)}
                  selectedItems={currentNovel?.genres?.map(g => g.name) || []}
                  onSelect={(items) => {
                    setCurrentNovel(prev => ({
                      ...prev!,
                      genres: items.map(name => ({ name }))
                    }))
                  }}
                  placeholder="Select genres..."
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Autocomplete
                  suggestions={tags} // You can replace this with a separate tags array if needed
                  selectedItems={currentNovel?.tags || []}
                  onSelect={(items) => {
                    setCurrentNovel(prev => ({
                      ...prev!,
                      tags: items
                    }))
                  }}
                  placeholder="Select tags..."
                />
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
              
                
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Series Artists</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Translators */}
                    <div>
                      <Label htmlFor="translators">Translators</Label>
                      <Input
                        id="translators"
                        name="credits.artists.translators"
                        value={currentNovel?.credits?.artists?.translators?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                translators: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter translators (comma-separated)"
                      />
                    </div>

                    {/* Editors */}
                    <div>
                      <Label htmlFor="editors">Editors</Label>
                      <Input
                        id="editors"
                        name="credits.artists.editors"
                        value={currentNovel?.credits?.artists?.editors?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                editors: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter editors (comma-separated)"
                      />
                    </div>

                    {/* Proofreaders */}
                    <div>
                      <Label htmlFor="proofreaders">Proofreaders</Label>
                      <Input
                        id="proofreaders"
                        name="credits.artists.proofreaders"
                        value={currentNovel?.credits?.artists?.proofreaders?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                proofreaders: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter proofreaders (comma-separated)"
                      />
                    </div>

                    {/* Posters */}
                    <div>
                      <Label htmlFor="posters">Posters</Label>
                      <Input
                        id="posters"
                        name="credits.artists.posters"
                        value={currentNovel?.credits?.artists?.posters?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                posters: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter posters (comma-separated)"
                      />
                    </div>

                    {/* Raw Providers */}
                    <div>
                      <Label htmlFor="rawProviders">Raw Providers</Label>
                      <Input
                        id="rawProviders"
                        name="credits.artists.rawProviders"
                        value={currentNovel?.credits?.artists?.rawProviders?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                rawProviders: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter raw providers (comma-separated)"
                      />
                    </div>

                    {/* Art Directors */}
                    <div>
                      <Label htmlFor="artDirectors">Art Directors</Label>
                      <Input
                        id="artDirectors"
                        name="credits.artists.artDirectors"
                        value={currentNovel?.credits?.artists?.artDirectors?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                artDirectors: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter art directors (comma-separated)"
                      />
                    </div>

                    {/* Drafters */}
                    <div>
                      <Label htmlFor="drafters">Drafters</Label>
                      <Input
                        id="drafters"
                        name="credits.artists.drafters"
                        value={currentNovel?.credits?.artists?.drafters?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                drafters: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter drafters (comma-separated)"
                      />
                    </div>

                    {/* Line Artists */}
                    <div>
                      <Label htmlFor="lineArtists">Line Artists</Label>
                      <Input
                        id="lineArtists"
                        name="credits.artists.lineArtists"
                        value={currentNovel?.credits?.artists?.lineArtists?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                lineArtists: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter line artists (comma-separated)"
                      />
                    </div>

                    {/* Color Artists */}
                    <div>
                      <Label htmlFor="colorArtists">Color Artists</Label>
                      <Input
                        id="colorArtists"
                        name="credits.artists.colorArtists"
                        value={currentNovel?.credits?.artists?.colorArtists?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                colorArtists: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter color artists (comma-separated)"
                      />
                    </div>

                    {/* Compositors */}
                    <div>
                      <Label htmlFor="compositors">Compositors</Label>
                      <Input
                        id="compositors"
                        name="credits.artists.compositors"
                        value={currentNovel?.credits?.artists?.compositors?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                compositors: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter compositors (comma-separated)"
                      />
                    </div>

                    {/* Typesetters */}
                    <div>
                      <Label htmlFor="typesetters">Typesetters</Label>
                      <Input
                        id="typesetters"
                        name="credits.artists.typesetters"
                        value={currentNovel?.credits?.artists?.typesetters?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                typesetters: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter typesetters (comma-separated)"
                      />
                    </div>

                    {/* Project Managers */}
                    <div>
                      <Label htmlFor="projectManagers">Project Managers</Label>
                      <Input
                        id="projectManagers"
                        name="credits.artists.projectManagers"
                        value={currentNovel?.credits?.artists?.projectManagers?.join(', ') || ''}
                        onChange={(e) => {
                          const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                          setCurrentNovel(prev => ({
                            ...prev!,
                            credits: {
                              ...prev!.credits,
                              artists: {
                                ...prev!.credits?.artists,
                                projectManagers: names
                              }
                            }
                          }));
                        }}
                        placeholder="Enter project managers (comma-separated)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button type="submit">Save Novel</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {!isAuthor && !isAdmin && (
        <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>Only authors and administrators can add new novels. If you believe this is an error, please contact support.</AlertDescription>
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
              <TableHead>Chapters</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Views</TableHead>
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
                <TableCell>{novel.totalChapters || 0}</TableCell>
                <TableCell>{novel.rating ? `${novel.rating.toFixed(1)}/5` : 'N/A'}</TableCell>
                <TableCell>{novel.views?.toLocaleString() || 0}</TableCell>
                {isAdmin && <TableCell>{authorsList.find(author => author.id === novel.uploader)?.username || 'Unknown'}</TableCell>}
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setCurrentNovel(novel); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4"/>
                  </Button>
                  {(isAdmin || isAuthor) && (
                    <Link href={`/admin/novel/${novel.novelId}/chapters`} passHref>
                      <Button variant="outline" size="sm" className="mr-2">
                        <BookOpen className="h-4 w-4"/>
                      </Button>
                    </Link>
                  )}
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


