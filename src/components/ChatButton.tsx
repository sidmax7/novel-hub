import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChatInterface } from './ChatInterface';
import { Novel } from '@/types/chat';
import Image from 'next/image';

interface ChatButtonProps {
  onUpdateRecommendations?: (novels: Novel[]) => void;
}

export function ChatButton({ onUpdateRecommendations }: ChatButtonProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="fixed bottom-6 right-6 h-auto py-3 px-4 gap-3 bg-white dark:bg-gray-950 shadow-lg hover:shadow-xl transition-all rounded-2xl border-[#F1592A]/20 hover:border-[#F1592A]/40 group"
        >
          <div className="relative w-8 h-8">
            <Image
              src="/assets/favicon.png"
              alt="Novelize AI"
              fill
              className="object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#232120] dark:text-[#E7E7E8]">Need Help Finding Your Next Read?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ask our AI Assistant</p>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[500px] p-0">
        <ChatInterface onUpdateRecommendations={onUpdateRecommendations} />
      </SheetContent>
    </Sheet>
  );
} 