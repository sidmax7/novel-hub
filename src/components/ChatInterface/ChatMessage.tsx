import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Bot, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messageContent = message.content;
  const shouldTruncate = messageContent.length > 300;
  const displayContent = shouldTruncate && !isExpanded 
    ? messageContent.slice(0, 300) + '...'
    : messageContent;

  return (
    <motion.div
      layout
      className={cn(
        'flex w-full items-start gap-4 p-4 rounded-lg transition-colors',
        isAssistant ? 'bg-black/5 dark:bg-white/5' : ''
      )}
    >
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
        {isAssistant ? (
          <Bot className="h-4 w-4 text-[#F1592A]" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-[#232120] dark:text-[#E7E7E8] whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[#F1592A] hover:text-[#F1592A]/80"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {isAssistant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-2"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Was this helpful?
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback('helpful')}
              className={cn(
                "h-8 w-8 p-0",
                feedback === 'helpful' && "text-green-500"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback('unhelpful')}
              className={cn(
                "h-8 w-8 p-0",
                feedback === 'unhelpful' && "text-red-500"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
            {feedback && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                Thanks for your feedback!
              </motion.span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 