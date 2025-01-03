'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Novel {
  id: string;
  title: string;
  cover: string;
  synopsis: string;
  genre: string;
}

interface LatestNovelsSectionProps {
  latestNovels: Novel[];
  editorsChoice: Novel[];
}

export default function LatestNovelsSection({
  latestNovels,
  editorsChoice,
}: LatestNovelsSectionProps) {
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const editorsChoiceRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? ref.current.scrollLeft - scrollAmount 
        : ref.current.scrollLeft + scrollAmount;
      
      ref.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        {/* New Arrivals Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">New Asrrivals</h2>
            <Button variant="ghost" size="sm" className="text-blue-500">
              SWITCH
            </Button>
          </div>
          <div className="relative group">
            <div 
              ref={newArrivalsRef}
              className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {latestNovels.map((novel) => (
                <Link href={`/novel/${novel.id}`} key={novel.id} className="flex-none">
                  <div className="w-[140px] group cursor-pointer">
                    <div className="relative aspect-[2/3] mb-2">
                      <Image
                        src={novel.cover}
                        alt={novel.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{novel.genre}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scroll('left', newArrivalsRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              disabled={!newArrivalsRef.current?.scrollLeft}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scroll('right', newArrivalsRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Editors' Choice Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Editors' Choice</h2>
          </div>
          <div className="relative group">
            <div 
              ref={editorsChoiceRef}
              className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {editorsChoice.map((novel) => (
                <Link href={`/novel/${novel.id}`} key={novel.id} className="flex-none">
                  <div className="w-[140px] group cursor-pointer">
                    <div className="relative aspect-[2/3] mb-2">
                      <Image
                        src={novel.cover}
                        alt={novel.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{novel.genre}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scroll('left', editorsChoiceRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              disabled={!editorsChoiceRef.current?.scrollLeft}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scroll('right', editorsChoiceRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 