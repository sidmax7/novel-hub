import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Star, Hash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion';

// TODO: Chapter Count Feature
// - Fetch chapter counts from Firebase subcollection
// - Update novel document if count is 0
// - Update UI with accurate chapter count
// Implementation commented out for future use:
/*
import { db } from '@/lib/firebaseConfig'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
*/

interface Novel {
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
  isFollowing?: boolean;
}

interface YouMayAlsoLikeSectionProps {
  novels: Novel[];
  onFollowNovel: (novelId: string) => Promise<void>;
  userFollowedNovels?: string[];
}

export function YouMayAlsoLikeSection({ novels, onFollowNovel, userFollowedNovels = [] }: YouMayAlsoLikeSectionProps) {
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>(
    novels.reduce((acc, novel) => ({
      ...acc,
      [novel.id]: userFollowedNovels.includes(novel.id)
    }), {})
  );

  /* TODO: Re-implement chapter count feature
  const [chapterCounts, setChapterCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchChapterCounts = async () => {
      for (const novel of novels) {
        if (novel.chaptersCount === 0) {
          try {
            const chaptersRef = collection(db, 'novels', novel.id, 'chapters');
            const snapshot = await getDocs(chaptersRef);
            const count = snapshot.size;
            
            if (count > 0) {
              const novelRef = doc(db, 'novels', novel.id);
              await updateDoc(novelRef, {
                chaptersCount: count
              });
              
              setChapterCounts(prev => ({
                ...prev,
                [novel.id]: count
              }));
            }
          } catch (error) {
            console.error('Error fetching chapter count:', error);
          }
        } else {
          setChapterCounts(prev => ({
            ...prev,
            [novel.id]: novel.chaptersCount
          }));
        }
      }
    };

    fetchChapterCounts();
  }, [novels]);
  */

  const handleFollow = async (novelId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const toastId = toast.loading('Adding to your library...');
    
    try {
      await onFollowNovel(novelId);
      setFollowingStates(prev => {
        const newState = !prev[novelId];
        toast.dismiss(toastId);
        toast.success(newState ? 'Added to your library!' : 'Removed from your library');
        return {
          ...prev,
          [novelId]: newState
        };
      });
    } catch (error) {
      console.error('Error following novel:', error);
      toast.dismiss(toastId);
      toast.error('Please login to add novels to your library');
    }
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      boxShadow: "0px 0px 8px rgba(241, 89, 42, 0.5)",
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 0px 15px rgba(241, 89, 42, 0.8)",
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8] mb-8 relative inline-block after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-[#F1592A]">
          You May Also Like
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
          {novels.slice(0, 8).map((novel) => (
            <Link href={`/novel/${novel.id}`} key={novel.id} className="group">
              <div className="flex gap-4">
                {/* Cover Image */}
                <div className="relative w-[120px] h-[180px] flex-shrink-0">
                  <Image
                    src={novel.coverImage}
                    alt={novel.title}
                    fill
                    className="object-cover rounded"
                    sizes="120px"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(novel.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors cursor-pointer rounded-md flex items-center"
                      >
                        <Hash className="h-3 w-3 mr-0.5" />
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-1 text-[#232120] dark:text-[#E7E7E8] group-hover:text-[#F1592A] transition-colors line-clamp-1">
                    {novel.title}
                  </h3>
                  
                  {/* Category & Author */}
                  <div className="text-sm text-[#464646] dark:text-[#C3C3C3] mb-2">
                    {novel.category} · <span className="text-sm text-[#464646] dark:text-[#C3C3C3] px-2 py-0.2 bg-black/5 dark:bg-white/5 rounded-md border border-[#F1592A]/50">
                    {novel.author.name}</span>
                  </div>
                  
                  {/* Synopsis */}
                  <p className="text-sm text-[#464646] dark:text-[#C3C3C3] mb-3 line-clamp-3">
                    {novel.synopsis}
                  </p>
                  
                  {/* Stats and Add Button */}
                  <div className="flex items-center gap-4 text-sm text-[#464646] dark:text-[#C3C3C3]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      {novel.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {novel.chaptersCount || 0} Chapters
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-0 font-medium flex items-center justify-center gap-1 transition-colors ${
                        followingStates[novel.id] 
                          ? 'text-[#F1592A] hover:text-[#F1592A]/80' 
                          : 'text-[#4B6BFB] hover:text-[#4B6BFB]/80'
                      }`}
                      onClick={(e) => handleFollow(novel.id, e)}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 ${
                        followingStates[novel.id] 
                          ? 'bg-[#F1592A]' 
                          : 'bg-[#4B6BFB]'
                      }`}>
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                      {followingStates[novel.id] ? 'ADDED' : 'ADD'}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Animated Browse All Button */}
        <div className="flex justify-center mt-8">
          <Link href="/browse">
            <motion.div
              variants={buttonVariants}
              initial="idle"
              animate="idle"
              whileHover="hover"
              className="inline-block"
            >
              <Button 
                variant="outline" 
                className="relative border-2 border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8] overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-[#F1592A]/0 via-[#F1592A]/30 to-[#F1592A]/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <span className="relative">Browse All Novels</span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
} 