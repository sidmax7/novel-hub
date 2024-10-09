'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Check, Heart, BookOpen, Share2, Star } from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useAuth } from '../authcontext'
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-hot-toast';
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface Novel {
  id: string;
  name: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  authorId: string;
  tags: string[];
  likes: number;
  description: string;
  type?: string;
  lastUpdated?: string;
  chapters?: number;
  language?: string;
  rank?: number;
}

const CACHE_KEY = 'novelHubCache'
const CACHE_EXPIRATION = 60 * 60 * 1000 // 1 hour in milliseconds

const colorSchemes = {
  Fantasy: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-100' },
  "Sci-Fi": { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-100' },
  Romance: { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-900 text-pink-100' },
  Action: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-100' },
  Mystery: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900 text-yellow-100' },
  "Slice of Life": { light: 'bg-green-100 text-green-800', dark: 'bg-green-900 text-green-100' },
  Isekai: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-100' },
  Horror: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-900 text-gray-100' },
  Adventure: { light: 'bg-orange-100 text-orange-800', dark: 'bg-orange-900 text-orange-100' },
  Magic: { light: 'bg-teal-100 text-teal-800', dark: 'bg-teal-900 text-teal-100' },
  Drama: { light: 'bg-rose-100 text-rose-800', dark: 'bg-rose-900 text-rose-100' },
  Comedy: { light: 'bg-lime-100 text-lime-800', dark: 'bg-lime-900 text-lime-100' },
  Thriller: { light: 'bg-cyan-100 text-cyan-800', dark: 'bg-cyan-900 text-cyan-100' },
  Historical: { light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-900 text-amber-100' },
  Supernatural: { light: 'bg-violet-100 text-violet-800', dark: 'bg-violet-900 text-violet-100' },
};

export default function BrowsePage() {
  const { theme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { user } = useAuth()
  const router = useRouter();

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < CACHE_EXPIRATION) {
            console.log("Using cached data")
            setNovels(data)
            setFilteredNovels(data)
            return
          }
        }

        const novelsRef = collection(db, 'novels');
        const q = query(novelsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const fetchedNovels = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || 0,
          description: doc.data().description || 'No description available.',
          rating: doc.data().rating || 0,
          tags: doc.data().tags || [],
        } as Novel));
        console.log("Fetched novels:", fetchedNovels);
        setNovels(fetchedNovels);
        setFilteredNovels(fetchedNovels);

        // Cache the fetched data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: fetchedNovels,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Error fetching novels:", error);
        toast.error("Failed to load novels");
      }
    };
    fetchNovels();
  }, []);

  useEffect(() => {
    const filtered = novels.filter(novel => {
      const searchTermLower = searchTerm.toLowerCase();
      const genreLower = novel.genre.toLowerCase();
      const tagsLower = novel.tags.map(tag => tag.toLowerCase());

      const matchesSearch = 
        novel.name.toLowerCase().includes(searchTermLower) ||
        novel.author.toLowerCase().includes(searchTermLower) ||
        genreLower.includes(searchTermLower) ||
        tagsLower.some(tag => tag.includes(searchTermLower));

      const matchesGenre = selectedGenres.length === 0 || 
        selectedGenres.map(g => g.toLowerCase()).includes(genreLower);
      const matchesTag = selectedTags.length === 0 || 
        novel.tags.some(tag => selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));

      return matchesSearch && matchesGenre && matchesTag;
    });

    console.log("Filtered novels:", filtered);
    setFilteredNovels(filtered);
  }, [searchTerm, selectedGenres, selectedTags, novels]);

  const allTags = Array.from(new Set(novels.flatMap(novel => novel.tags)))

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.map(g => g.toLowerCase()).includes(genre.toLowerCase())
        ? prev.filter(g => g.toLowerCase() !== genre.toLowerCase())
        : [...prev, genre]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

  const handleReadNow = (novelId: string) => {
    // Implement logic to start reading the novel
    console.log(`Start reading novel with id: ${novelId}`);
  };

  const handleFavorite = (novelId: string) => {
    // Implement logic to add/remove novel from favorites
    console.log(`Toggle favorite for novel with id: ${novelId}`);
  };

  const isFavorite = (novelId: string) => {
    // Implement logic to check if a novel is in the user's favorites
    return false; // Placeholder
  };

  const handleShare = (novel: Novel) => {
    // Implement logic to share the novel
    console.log(`Share novel: ${novel.name}`);
  };

  const formatDate = (dateString: string) => {
    // Implement date formatting logic
    return new Date(dateString).toLocaleDateString();
  };

  const handleTileClick = (novelId: string) => {
    router.push(`/novel/${novelId}`);
  };

  const getColorScheme = (item: string) => {
    const key = Object.keys(colorSchemes).find(k => item.toLowerCase().includes(k.toLowerCase()));
    return key ? colorSchemes[key as keyof typeof colorSchemes] : colorSchemes.Horror; // Default to Horror colors if no match
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#E7E7E8] dark:bg-[#232120]`}>
      <header className="border-b dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold text-[#F1592A] dark:text-[#F1592A] hover:text-[#232120] dark:hover:text-[#E7E7E8] transition-colors">
            NovelHub
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex">
        <aside className="w-64 pr-8">
          <h2 className="text-2xl font-bold mb-4 text-[#232120] dark:text-[#E7E7E8]">Filters</h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-[#232120] dark:text-[#E7E7E8]">Genres</h3>
            <div className="space-y-2">
              {Object.keys(colorSchemes).map((genre) => {
                const isSelected = selectedGenres.map(g => g.toLowerCase()).includes(genre.toLowerCase());
                const colorScheme = getColorScheme(genre);
                return (
                  <Button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-between ${isSelected ? (theme === 'dark' ? colorScheme.dark : colorScheme.light) : ''}`}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check size={16} />}
                  </Button>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-[#232120] dark:text-[#E7E7E8]">Tags</h3>
            <div className="space-y-2">
              {allTags.map((tag) => {
                const isSelected = selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase());
                const colorScheme = getColorScheme(tag);
                return (
                  <Button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-between ${isSelected ? (theme === 'dark' ? colorScheme.dark : colorScheme.light) : ''}`}
                  >
                    <span>{tag}</span>
                    {isSelected && <Check size={16} />}
                  </Button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-8 text-[#232120] dark:text-[#E7E7E8]">Browse Novels</h1>
          
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#232120]/60 dark:text-[#E7E7E8]/60" />
              <Input
                type="search"
                placeholder="Search novels, authors, genres, or tags..."
                className="pl-10 pr-4 py-2 w-full rounded-full bg-[#C3C3C3] dark:bg-[#3E3F3E] focus:outline-none focus:ring-2 focus:ring-[#F1592A] text-[#232120] dark:text-[#E7E7E8] placeholder-[#8E8F8E] dark:placeholder-[#C3C3C3]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <motion.div 
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {filteredNovels.map((novel) => (
              <motion.div
                key={novel.id}
                className="bg-white dark:bg-black rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                onClick={() => handleTileClick(novel.id)}
              >
                <div className="flex p-4">
                  <div className="flex-shrink-0 w-24 h-36 mr-4 relative group">
                    <Image
                      src={novel.coverUrl || '/placeholder.svg'}
                      alt={novel.name}
                      width={96}
                      height={144}
                      objectFit="cover"
                      className="rounded"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadNow(novel.id);
                        }}
                      >
                        <BookOpen className="mr-2" size={16} />
                        Read Now
                      </Button>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-[#232120] dark:text-[#E7E7E8] mb-2">
                      {novel.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      by{' '}
                      <Link 
                        href={`/author/${novel.authorId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {novel.author}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{novel.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          theme === 'dark'
                            ? getColorScheme(novel.genre).dark
                            : getColorScheme(novel.genre).light
                        }`}
                      >
                        {novel.genre}   
                      </span>
                      {novel.tags.map(tag => {
                        const colorScheme = getColorScheme(tag);
                        return (
                          <span
                            key={tag}
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              theme === 'dark' ? colorScheme.dark : colorScheme.light
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      <span className="text-sm text-gray-500 dark:text-gray-400">{novel.likes} likes</span>
                      {novel.lastUpdated && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Updated: {formatDate(novel.lastUpdated)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredNovels.length === 0 && (
            <p className="text-center text-[#232120] dark:text-[#E7E7E8] mt-8">No novels found matching your criteria.</p>
          )}
        </div>
      </main>
    </div>
  )
}