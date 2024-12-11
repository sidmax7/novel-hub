'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  User, 
  ChevronsLeftRight, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Flame, 
  BookOpen, 
  Crown, 
  Sparkles,
  Menu,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from 'framer-motion'
import { useAuth } from './authcontext'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NovelCard } from '@/components/NovelCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from 'next-themes'
import LoadingSpinner from '@/components/LoadingSpinner' // Add this import
import { genreColors } from './genreColors'
import WeeklyBookSection from '@/components/WeeklySection'
import { NovelRankings } from '@/components/NovelRanking'
import { LatestReleasesCarousel } from '@/components/CarouselList'
import { TopReleasesSection } from '@/components/TopReleasesSection'
import { YouMayAlsoLikeSection } from '@/components/YouMayAlsoLikeSection'


interface Novel {
  novelId: string
  title: string
  coverPhoto: string
  genres: { name: string }[]
  rating: number
  synopsis: string
  publishers: {
    original: string
    english?: string
  }
  likes: number
  metadata?: {
    createdAt: any;
    updatedAt: any;
  }
  views?: number;
  totalChapters?: number;
  lastUpdated?: string;
  author: string;
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: any
  image?: string
}

interface RecommendedNovel {
  id: string;
  title: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
  };
  tags: string[];
  rating: number;
  chaptersCount: number;
  synopsis: string;
}

const CACHE_KEY = 'popularNovels'
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const LATEST_CACHE_KEY = 'latestNovels'

const fetchPopularNovels = async () => {
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data.slice(0, 10)
    }
  }

  // If cache is invalid or expired, fetch from Firestore
  const q = query(collection(db, 'novels'), orderBy('rating', 'desc'), limit(10))
  const querySnapshot = await getDocs(q)
  const novels = querySnapshot.docs.map(doc => ({ 
    novelId: doc.id, 
    ...doc.data(),
    genres: doc.data().genres || [],
    author: doc.data().publishers?.original || 'Unknown'
  } as Novel)).slice(0, 10)

  // Cache the fetched data
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: novels, timestamp: Date.now() }))

  return novels
}

const fetchLatestNovels = async () => {
  const cachedData = localStorage.getItem(LATEST_CACHE_KEY)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data.slice(0, 20)
    }
  }

  // If cache is invalid or expired, fetch from Firestore
  const q = query(
    collection(db, 'novels'), 
    orderBy('metadata.createdAt', 'desc'), 
    limit(20)
  )
  const querySnapshot = await getDocs(q)
  const novels = querySnapshot.docs.map(doc => ({ 
    novelId: doc.id, 
    ...doc.data(),
    genres: doc.data().genres || [],
    author: doc.data().publishers?.original || 'Unknown'
  } as Novel)).slice(0, 10)

  // Cache the fetched data
  localStorage.setItem(LATEST_CACHE_KEY, JSON.stringify({ 
    data: novels, 
    timestamp: Date.now() 
  }))

  return novels
}

const fetchEditorsPicks = async () => {
  // For now, just get the latest 6 novels
  const q = query(
    collection(db, 'novels'),
    orderBy('metadata.createdAt', 'desc'),
    limit(6)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    novelId: doc.id,
    ...doc.data(),
    genres: doc.data().genres || [],
    publishers: doc.data().publishers || { original: 'Unknown' }
  } as Novel))
}

const fetchRecommendedNovels = async () => {
  const q = query(
    collection(db, 'novels'),
    orderBy('rating', 'desc'),
    limit(8)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      coverImage: data.coverPhoto,
      category: data.genres?.[0]?.name || 'Fantasy',
      author: {
        name: data.publishers?.original || 'Unknown'
      },
      tags: data.genres?.map((g: { name: string }) => g.name) || [],
      rating: data.rating || 0,
      chaptersCount: data.chapters?.length || 0,
      synopsis: data.synopsis || ''
    };
  });
};

export default function ModernLightNovelsHomepage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [popularNovels, setPopularNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const [followedNovels, setFollowedNovels] = useState<string[]>([])
  const [userType, setUserType] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ profilePicture: string, username: string } | null>(null)
  const [latestNovels, setLatestNovels] = useState<Novel[]>([])
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [autoSlideInterval, setAutoSlideInterval] = useState<NodeJS.Timeout | null>(null);
  const [editorsPicks, setEditorsPicks] = useState<Novel[]>([])
  const [recommendedNovels, setRecommendedNovels] = useState<Array<any>>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['trending', 'latest', 'popular'];
      const scrollPosition = window.scrollY + 100; // offset for header

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    setMounted(true)
    const loadNovels = async () => {
      setLoading(true)
      try {
        const [popular, latest, editors, recommended] = await Promise.all([
          fetchPopularNovels(),
          fetchLatestNovels(),
          fetchEditorsPicks(),
          fetchRecommendedNovels()
        ])
        console.log('Latest Novels:', latest)
        console.log('Editors Picks:', editors)
        setPopularNovels(popular)
        setLatestNovels(latest)
        setEditorsPicks(editors)
        setRecommendedNovels(recommended)
      } catch (error) {
        console.error('Error fetching novels:', error)
      }
      setLoading(false)
    }

    loadNovels()
    if (user) {
      fetchFollowedNovels()
      fetchUserType()
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    const loadAnnouncements = async () => {
      const data = await fetchAnnouncements()
      setAnnouncements(data)
    }
    loadAnnouncements()
  }, [])

  useEffect(() => {
    const filteredNovels = popularNovels.filter(novel => novel.coverPhoto && novel.title).slice(0, 5);
    if (filteredNovels.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(current => 
        current < filteredNovels.length - 1 ? current + 1 : 0
      );
    }, 5000); // Change slide every 5 seconds

    setAutoSlideInterval(interval);

    return () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
      }
    };
  }, [popularNovels]);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        setUserProfile({
          profilePicture: userData.profilePicture || '',
          username: userData.username || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchFollowedNovels = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setFollowedNovels(userData.followedNovels || [])
      }
    } catch (error) {
      console.error('Error fetching followed novels:', error)
    }
  }

  const fetchUserType = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserType(userData.userType || null)
      }
    } catch (error) {
      console.error('Error fetching user type:', error)
    }
  }

  const handleFollowChange = (novelId: string, isFollowing: boolean) => {
    setFollowedNovels(prev => 
      isFollowing ? [...prev, novelId] : prev.filter(id => id !== novelId)
    )
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const ThemeToggle = () => {
    if (!mounted) return null

    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-10 h-10 rounded-full border-2 border-[#F1592A] border-opacity-50 bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-[#E7E7E8]" />
        ) : (
          <Moon className="h-4 w-4 text-[#232120] group-hover:text-white" />
        )}
      </Button>
    )
  }

  const fetchAnnouncements = async () => {
    const q = query(
      collection(db, 'forumPosts'),
      where('section', '==', 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Announcement))
  }

  const handleFollowNovel = async (novelId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const currentFollowed = userDoc.data()?.followedNovels || [];
    
    if (currentFollowed.includes(novelId)) {
      // Unfollow
      await updateDoc(userRef, {
        followedNovels: arrayRemove(novelId)
      });
    } else {
      // Follow
      await updateDoc(userRef, {
        followedNovels: arrayUnion(novelId)
      });
    }
    
    // Update local state
    await fetchFollowedNovels();
  };

  const NavButton = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = activeSection === id;
    return (
      <button 
        onClick={() => scrollToSection(id)} 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-200
          ${isActive 
            ? 'text-[#F1592A] bg-[#F1592A]/10' 
            : 'text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] hover:bg-[#F1592A]/5'
          }`}
      >
        <Icon className={`w-4 h-4 transition-transform duration-200 ${
          isActive ? 'scale-110' : ''
        } ${
          id === 'trending' && isActive ? 'text-orange-500' : ''
        } ${
          id === 'latest' && isActive ? 'text-blue-500' : ''
        } ${
          id === 'popular' && isActive ? 'text-yellow-500' : ''
        }`} />
        <span className={`${isActive ? 'font-medium' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <motion.div 
      className={`flex flex-col min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#E7E7E8] dark:bg-[#232120]`}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <header className="border-b dark:border-[#3E3F3E] bg-[#E7E7E8] dark:bg-[#232120] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/" onClick={scrollToTop} className="flex-shrink-0">
                <Image
                  src="/assets/favicon.png"
                  alt="Novellize"
                  width={40}
                  height={40}
                  className="hover:opacity-90 transition-opacity"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-2">
                <NavButton id="trending" icon={Flame} label="Trending" />
                <NavButton id="latest" icon={Sparkles} label="Latest" />
                <NavButton id="popular" icon={Crown} label="Popular" />
                <Link 
                  href="/browse" 
                  className="flex items-center gap-2 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] transition-colors px-3 py-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Browse All</span>
                </Link>
              </nav>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              {/* Desktop Search */}
              <div className="hidden lg:flex relative w-[300px]">
                <Input
                  type="text"
                  placeholder="Search novels..."
                  className="pl-10 pr-4 py-2 w-full bg-white dark:bg-[#2A2827] border-[#F1592A] border-opacity-50 rounded-full focus-visible:ring-[#F1592A]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <ThemeToggle />

              {/* Desktop Forum Button */}
              <Link href="/forum" className="hidden md:block">
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-[#F1592A] border-opacity-50 bg-[#E7E7E8] dark:bg-[#232120] hover:bg-[#F1592A] dark:hover:bg-[#F1592A] group px-4 gap-2"
                >
                  <MessageSquare className="h-4 w-4 text-[#232120] dark:text-[#E7E7E8] group-hover:text-white" />
                  <span className="text-[#232120] dark:text-[#E7E7E8] group-hover:text-white">Forum</span>
                </Button>
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar>
                      <AvatarImage src={userProfile?.profilePicture} alt={userProfile?.username} />
                      <AvatarFallback>{userProfile?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/user_profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {userType === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={() => router.push('/admin')}>
                          <ChevronsLeftRight className="mr-2 h-4 w-4" />
                          <span>Admin Console</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {userType === 'author' && (
                      <>
                        <DropdownMenuItem onClick={() => router.push('/admin')}>
                          <ChevronsLeftRight className="mr-2 h-4 w-4" />
                          <span>Author Console</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" onClick={() => router.push('/auth')} className="text-[#F1592A]">
                  Login
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-[#232120] dark:text-[#E7E7E8]" />
                ) : (
                  <Menu className="h-6 w-6 text-[#232120] dark:text-[#E7E7E8]" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-4">
              <div className="flex flex-col space-y-4">
                {/* Mobile Search */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search novels..."
                    className="pl-10 pr-4 py-2 w-full bg-white dark:bg-[#2A2827] border-[#F1592A] border-opacity-50 rounded-full focus-visible:ring-[#F1592A]"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {/* Mobile Navigation */}
                <NavButton id="trending" icon={Flame} label="Trending" />
                <NavButton id="latest" icon={Sparkles} label="Latest" />
                <NavButton id="popular" icon={Crown} label="Popular" />
                <Link 
                  href="/browse" 
                  className="flex items-center gap-2 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] transition-colors px-2 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Browse All</span>
                </Link>
                <Link 
                  href="/forum" 
                  className="flex items-center gap-2 text-[#232120] dark:text-[#E7E7E8] hover:text-[#F1592A] transition-colors px-2 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Forum</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Hero Section with Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/hero-section.jpg"
              alt="Background"
              fill
              className="object-cover blur-lg brightness-75 [mask-image:linear-gradient(to_bottom,rgba(241,89,42,0.3),rgba(0,0,0,0.5))]"
              priority
              style={{
                backgroundColor: 'rgba(241, 89, 42, 0.3)',
                mixBlendMode: 'multiply'
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 relative z-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              {/* Left column: Logo and Brand */}
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
                <Image
                  src="/assets/favicon.png"
                  alt="Company Logo"
                  width={300}
                  height={300}
                  className="mb-6 mx-auto p-2"
                  priority
                />
                <h1 className="text-3xl rounded-md bg-opacity-60 bg-gray-200 dark:bg-opacity-60 dark:bg-[#232120] md:text-4xl lg:text-5xl font-bold text-[#F1592A] mb-4 text-center md:text-left mx-auto pb-2 pt-1 px-2">
                  Novellize
                </h1>
              </div>

              {/* Right column: Company Description */}
              <div className="w-full md:w-1/2 dark:text-[#E7E7E8] text-[#232120]">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold dark:text-[#E7E7E8] text-[#232120] mb-4 text-center md:text-left">
                  Discover Your Next Adventure
                </h2>
                <p className="text-base md:text-lg lg:text-xl dark:text-[#E7E7E8] text-[#232120] mb-6 text-center md:text-left">
                  Explore thousands of light novels across various genres. Our platform offers a vast collection of captivating stories, from fantasy and romance to sci-fi and mystery. Immerse yourself in new worlds, follow intriguing characters, and experience thrilling adventures - all at your fingertips.
                </p>
                <p className="text-base md:text-lg dark:text-[#E7E7E8] text-[#232120] text-center md:text-left">
                  Whether you're a seasoned light novel enthusiast or new to the genre, our curated selection ensures there's something for everyone. Start your journey today and unlock the power of imagination!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Section */}
        <section id="trending" className="py-8 md:py-12">
          <NovelRankings
            newReleases={latestNovels}
            trending={popularNovels}
            popular={popularNovels}
          />
        </section>

        {/* Weekly Books Section */}
        <section className="py-8 md:py-12">
          <WeeklyBookSection 
            popularNovels={popularNovels} 
            announcements={announcements} 
          />
        </section>

        {/* Latest Releases Section */}
        <section id="latest" className="py-8 md:py-12">
          <TopReleasesSection
            latestNovels={latestNovels}
            editorsPicks={editorsPicks}
            loading={loading}
          />
        </section>

        {/* Popular Section */}
        <section id="popular" className="py-8 md:py-12">
          <LatestReleasesCarousel
            novels={latestNovels}
            loading={loading}
            onFollowChange={handleFollowChange}
          />
        </section>
        <section id="popular" className="py-8 md:py-12">
          <LatestReleasesCarousel
            novels={latestNovels}
            loading={loading}
            onFollowChange={handleFollowChange}
          />
        </section>


        {/* You May Also Like Section */}
        <section className="py-8 md:py-12">
          <YouMayAlsoLikeSection 
            novels={recommendedNovels as RecommendedNovel[]}
            onFollowNovel={handleFollowNovel}
            userFollowedNovels={followedNovels}
          />
        </section>

        {/* Explore Genres Section */}
        <style jsx global>{`
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .shine-effect {
            position: relative;
            overflow: hidden;
          }
          .shine-effect::after {
            position: absolute;
            content: "";
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            transform: translateX(-100%);
            animation: shine 2s infinite;
          }
        `}</style>
        <section className="py-8 md:py-12 bg-[#E7E7E8] dark:bg-[#232120] relative z-10">
          <div className={`container rounded-3xl mx-auto px-6 md:px-12 py-8 md:py-12 ${
            mounted && theme === 'dark'
              ? 'bg-black dark:bg-[#3E3F3E]'
              : 'bg-white dark:bg-[#3E3F3E] border border-[#F1592A] border-opacity-30'
          } backdrop-blur-md`}>
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100"
              variants={fadeIn}
            >
              Explore Genres
            </motion.h2>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={staggerChildren}
            >
              {Object.entries(genreColors)
                .slice(0, showAllGenres ? undefined : 16)
                .map(([genre, colors]) => (
                  <motion.div
                    key={genre}
                    variants={fadeIn}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href={`/browse?genre=${encodeURIComponent(genre.toLowerCase())}`}
                      className={`shine-effect p-2 md:p-3 rounded-full shadow-lg text-center block transition-colors h-full
                      ${mounted ? (theme === 'dark' ? colors.dark : colors.light) : colors.dark}`}
                    >
                      <span className="font-semibold text-sm md:text-base relative z-10">{genre}</span>
                    </Link>
                  </motion.div>
                ))}
            </motion.div>
            
            {/* Add Show More/Less Button */}
            <motion.div 
              className="mt-8 text-center"
              variants={fadeIn}
            >
              <Button
                variant="outline"
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="rounded-full border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8]"
              >
                {showAllGenres ? 'Show Less' : 'Show More'}
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8 bg-white dark:bg-[#232120] dark:border-[#3E3F3E]">
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <motion.div 
            className="text-center md:text-left mb-4 md:mb-0"
            variants={fadeIn}
          >
            <p className="text-sm text-[#464646] dark:text-[#C3C3C3]">
              © 2024 Novellize. All rights reserved.
            </p>
          </motion.div>
          <motion.nav 
            className="flex justify-center md:justify-end space-x-4 md:space-x-6"
            variants={staggerChildren}
          >
            {["About Us", "Terms", "Privacy", "Contact"].map((item) => (
              <motion.div key={item} variants={fadeIn}>
                <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-[#464646] hover:text-[#232120] dark:text-[#C3C3C3] dark:hover:text-[#E7E7E8] transition-colors duration-200">
                  {item}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </footer>
    </motion.div>
  )
}
