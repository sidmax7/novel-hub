import { useState, useRef, useEffect, memo } from 'react'
import { Input } from "./input"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { XIcon } from "lucide-react"

interface AutocompleteProps {
  suggestions: string[]
  selectedItems?: string[]
  onSelect: (items: string[]) => void
  placeholder?: string
  className?: string
}

export const Autocomplete = memo(({
  suggestions,
  selectedItems = [],
  onSelect,
  placeholder = "Type to search...",
  className
}: AutocompleteProps) => {
  const [inputValue, setInputValue] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filtered = suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedItems.includes(suggestion)
    )
    setFilteredSuggestions(filtered)
  }, [inputValue, suggestions, selectedItems])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: string) => {
    if (!selectedItems.includes(item)) {
      onSelect([...selectedItems, item]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemove = (item: string) => {
    onSelect(selectedItems.filter(i => i !== item));
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#E7E7E8] dark:bg-[#232120] rounded-md shadow-lg border border-[#3E3F3E] max-h-[200px] overflow-y-auto">
          <ScrollArea className="h-full">
            {filteredSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                className="w-full justify-start px-3 py-2 text-sm hover:bg-[#F1592A] dark:hover:bg-[#F1592A] rounded-sm transition-colors"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </ScrollArea>
        </div>
      )}
      
      {(selectedItems?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedItems?.map((item) => (
            <div
              key={item}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              <span className="text-sm">{item}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => handleRemove(item)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})