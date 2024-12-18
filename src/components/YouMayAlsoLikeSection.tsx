import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Star } from 'lucide-react';
import { useState } from 'react';

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

  const handleFollow = async (novelId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await onFollowNovel(novelId);
      setFollowingStates(prev => ({
        ...prev,
        [novelId]: !prev[novelId]
      }));
    } catch (error) {
      console.error('Error following novel:', error);
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#232120] dark:text-[#E7E7E8]">
            You May Also Like
          </h2>
          <Link href="/browse">
            <Button variant="ghost" className="text-[#F1592A] hover:text-[#F1592A]/90">
              Browse All
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                    {novel.tags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/browse?tagSearchInclude=${encodeURIComponent(tag)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-[#2E6FE4] dark:text-[#5C9DFF] uppercase hover:text-[#F1592A] transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-base font-semibold mb-1 text-[#232120] dark:text-[#E7E7E8] group-hover:text-[#F1592A] transition-colors line-clamp-1">
                    {novel.title}
                  </h3>
                  
                  {/* Category & Author */}
                  <div className="text-sm text-[#464646] dark:text-[#C3C3C3] mb-2">
                    {novel.category} · {novel.author.name}
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
                      {novel.chaptersCount} Chapters
                    </div>
                    <Button
                      variant={followingStates[novel.id] ? "secondary" : "outline"}
                      size="sm"
                      className={`rounded-full px-3 flex items-center gap-1 ${
                        followingStates[novel.id] 
                          ? 'bg-[#F1592A]/10 text-[#F1592A] hover:bg-[#F1592A]/20' 
                          : 'hover:text-[#F1592A] hover:border-[#F1592A]'
                      }`}
                      onClick={(e) => handleFollow(novel.id, e)}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 