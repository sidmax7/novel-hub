import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Wand2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const SUGGESTION_KEYWORDS = [
  { text: "fantasy", description: "Fantasy novels with magic and adventure" },
  { text: "romance", description: "Stories focused on relationships and love" },
  { text: "action", description: "Fast-paced novels with exciting sequences" },
  { text: "mystery", description: "Intriguing plots with suspense and twists" },
  { text: "comedy", description: "Light-hearted and humorous stories" },
  { text: "drama", description: "Character-driven emotional narratives" },
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<typeof SUGGESTION_KEYWORDS>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    // Show suggestions based on input
    if (input.length > 0) {
      const words = input.toLowerCase().split(' ');
      const lastWord = words[words.length - 1];
      if (lastWord.length >= 2) {
        const matches = SUGGESTION_KEYWORDS.filter(kw => 
          kw.text.toLowerCase().startsWith(lastWord)
        );
        setSuggestions(matches);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const words = input.split(' ');
    words[words.length - 1] = suggestion;
    setInput(words.join(' ') + ' ');
    setSuggestions([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const generateRandomPrompt = () => {
    const genres = ['fantasy', 'romance', 'action', 'mystery', 'comedy', 'drama'];
    const themes = ['adventure', 'friendship', 'revenge', 'growth', 'survival'];
    const attributes = ['complex plot', 'strong characters', 'emotional', 'dark', 'light-hearted'];
    
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
    
    const prompt = `I want a ${randomGenre} novel with ${randomTheme} and ${randomAttr} elements`;
    setInput(prompt);
  };

  return (
    <div className="relative">
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-black rounded-lg shadow-lg border p-2 z-10">
          <div className="grid grid-cols-1 gap-1">
            {suggestions.map((suggestion, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                    >
                      {suggestion.text}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{suggestion.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-4 border-t bg-background">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={generateRandomPrompt}
                className="h-[60px] w-[60px] border-2 border-[#F1592A]/50 hover:bg-[#F1592A]/10"
                disabled={isLoading}
              >
                <Wand2 className="h-4 w-4 text-[#F1592A]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate random prompt</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the type of novel you're looking for..."
          className="min-h-[60px] w-full resize-none bg-transparent border-2 border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A] transition-colors"
          disabled={isLoading}
          rows={1}
        />

        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="h-[60px] w-[60px] bg-[#F1592A] hover:bg-[#F1592A]/90"
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
} 