import { Novel } from '@/types/chat';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ChatNovelCardProps {
  novel: Novel;
  index: number;
}

export function ChatNovelCard({ novel, index }: ChatNovelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex gap-3 p-3 bg-white/50 dark:bg-black/50 rounded-lg hover:bg-white/80 dark:hover:bg-black/80 transition-colors group"
    >
      {/* Cover Image */}
      <div className="relative w-16 h-24 flex-shrink-0">
        <Image
          src={novel.coverPhoto}
          alt={novel.title}
          fill
          className="object-cover rounded-md"
          sizes="64px"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8] truncate">
              {novel.title}
            </h3>
            <Badge 
              variant="secondary" 
              className="shrink-0 text-[10px] px-1.5 py-0.5 bg-[#F1592A]/10 text-[#F1592A]"
            >
              {novel.seriesStatus}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{novel.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{novel.chapters} Ch</span>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1">
            {novel.genres.slice(0, 2).map((genre, i) => (
              <Badge 
                key={i}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 bg-black/5 dark:bg-white/10 text-[#232120] dark:text-[#E7E7E8]"
              >
                {genre.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action */}
        <Link href={`/novel/${novel.novelId}`} className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs justify-between text-[#F1592A] hover:text-[#F1592A] hover:bg-[#F1592A]/10"
          >
            <span>View Details</span>
            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
} 