import { useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType, RecommendationResponse } from '@/types/chat';
import { Novel } from '@/types/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { ChatNovelCard } from '../ChatNovelCard';
import { Button } from '../ui/button';
import Image from 'next/image';

interface ChatInterfaceProps {
  onUpdateRecommendations?: (novels: Novel[]) => void;
}

const EXAMPLE_PROMPTS = [
  "I want a fantasy novel with strong character development and romance",
  "Looking for a completed light novel with action and adventure",
  "Recommend me a dark fantasy with complex plot and mature themes",
  "I enjoy slice of life stories with comedy and heartwarming moments",
];

const INITIAL_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content: 'Hello! I can help you find novels based on your preferences. You can describe what you\'re looking for, or try one of the example prompts below.'
};

export function ChatInterface({ onUpdateRecommendations }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecommendations, setCurrentRecommendations] = useState<Novel[]>([]);
  const [showExamples, setShowExamples] = useState(true);

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setShowExamples(false);
      
      // Add user message
      const userMessage: ChatMessageType = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Call recommendation API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data: RecommendationResponse = await response.json();
      
      // Add assistant response
      const assistantMessage: ChatMessageType = {
        role: 'assistant',
        content: data.explanation
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update recommendations
      setCurrentRecommendations(data.recommendations);
      if (onUpdateRecommendations) {
        onUpdateRecommendations(data.recommendations);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '😅 Oops! I couldn\'t find any novels matching your preferences. Could you try describing what you\'re looking for in a different way? 📚✨'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentRecommendations([]);
    setShowExamples(true);
    if (onUpdateRecommendations) {
      onUpdateRecommendations([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden shadow-2xl border border-[#F1592A]/10">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-[#F1592A]/5 to-[#F1592A]/10 border-b border-[#F1592A]/10">
        <div className="relative w-8 h-8">
          <Image
            src="/assets/favicon.png"
            alt="Novelize AI"
            fill
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Novel Recommendations</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Novelize AI</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage message={message} />
              {index === messages.length - 1 && message.role === 'assistant' && currentRecommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-6 space-y-3"
                >
                  <div className="relative">
                    <div className="absolute -left-12 -top-6 w-10 h-10">
                      <Image
                        src="/assets/favicon.png"
                        alt="Novelize AI"
                        fill
                        className="object-contain transform -scale-x-100"
                      />
                    </div>
                    <div className="space-y-3">
                      {currentRecommendations.map((novel, idx) => (
                        <ChatNovelCard key={novel.novelId} novel={novel} index={idx} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-xs text-[#F1592A] hover:text-[#F1592A]/80 hover:bg-[#F1592A]/10"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Try Another Search
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {showExamples && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mt-6"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Try these examples:</p>
              <div className="grid grid-cols-1 gap-3">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left h-auto py-4 px-5 text-sm justify-start hover:bg-[#F1592A]/10 hover:text-[#F1592A] transition-colors rounded-xl whitespace-normal"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    <Sparkles className="h-4 w-4 mr-3 shrink-0 text-[#F1592A]" />
                    <span>{prompt}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center p-4"
            >
              <Loader2 className="h-6 w-6 animate-spin text-[#F1592A]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-[#F1592A]/10 bg-gradient-to-r from-[#F1592A]/5 to-[#F1592A]/10">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
} 