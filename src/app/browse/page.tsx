'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Check } from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { NovelCard } from '@/components/NovelCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { genreColors } from '@/app/page'
import { useAuth } from '../authcontext'
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-hot-toast';
import Image from "next/image";

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

export default function BrowsePage() {
  const { theme } = useTheme()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchNovels = async () => {
      try {
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
              {Object.keys(genreColors).map((genre) => {
                const isSelected = selectedGenres.map(g => g.toLowerCase()).includes(genre.toLowerCase());
                return (
                  <Button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-between !text-[#232120] dark:!text-[#E7E7E8] ${genreColors[genre as keyof typeof genreColors]?.light} dark:${genreColors[genre as keyof typeof genreColors]?.dark}`}
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
                return (
                  <Button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-between"
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
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={novel.coverUrl || '/placeholder.svg'}
                    alt={novel.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-[#232120] dark:text-[#E7E7E8] mb-2">{novel.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">by {novel.author}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">{novel.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold !text-[#232120] dark:!text-[#E7E7E8] ${genreColors[novel.genre as keyof typeof genreColors]?.light} dark:${genreColors[novel.genre as keyof typeof genreColors]?.dark}`}>
                      {novel.genre}
                    </span>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{novel.rating.toFixed(1)}</span>
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