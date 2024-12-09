import React, { memo } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Autocomplete } from "@/components/ui/autocomplete"
import { tags } from '../app/tags'
import { genreColors, genres } from '../app/genreColors'

interface FilterSectionProps {
  tagLogic: 'AND' | 'OR'
  setTagLogic: (value: 'AND' | 'OR') => void
  tagSearchInclude: string
  setTagSearchInclude: (value: string) => void
  tagSearchExclude: string
  setTagSearchExclude: (value: string) => void
  readingStatus: string
  setReadingStatus: (value: string) => void
  publisherSearch: string
  setPublisherSearch: (value: string) => void
  genreLogic: 'AND' | 'OR'
  setGenreLogic: (value: 'AND' | 'OR') => void
  selectedGenres: string
  setSelectedGenres: (value: string) => void
  excludedGenres: string
  setExcludedGenres: (value: string) => void
  handleApplyFilters: () => void
  handleResetFilters: () => void
  closeSheet?: () => void;
}

const FilterSection = memo(function FilterSection({
  tagLogic,
  setTagLogic,
  tagSearchInclude,
  setTagSearchInclude,
  tagSearchExclude,
  setTagSearchExclude,
  readingStatus,
  setReadingStatus,
  publisherSearch,
  setPublisherSearch,
  genreLogic,
  setGenreLogic,
  selectedGenres,
  setSelectedGenres,
  excludedGenres,
  setExcludedGenres,
  handleApplyFilters,
  handleResetFilters,
  closeSheet,
}: FilterSectionProps) {
  const safeSplit = (value: string | null | undefined) => {
    if (!value) return [];
    return value.split(',').filter(item => item.trim());
  };

  const handleApplyClick = () => {
    handleApplyFilters();
    closeSheet?.();
  };

  const handleResetClick = () => {
    handleResetFilters();
    setTagLogic('OR');
    setTagSearchInclude('');
    setTagSearchExclude('');
    setReadingStatus('all');
    setPublisherSearch('');
    setGenreLogic('OR');
    setSelectedGenres('');
    setExcludedGenres('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Genres Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#232120] dark:text-[#E7E7E8]">Genres</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="genre-logic" className="text-[#232120] dark:text-[#E7E7E8]">Logic:</Label>
              <Select value={genreLogic} onValueChange={(value) => setGenreLogic(value as 'AND' | 'OR')}>
                <SelectTrigger 
                  id="genre-logic" 
                  className="w-[100px] border-[#F1592A] bg-transparent text-[#232120] dark:text-[#E7E7E8] focus:ring-[#F1592A] focus:ring-offset-0"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OR">OR</SelectItem>
                  <SelectItem value="AND">AND</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="include-genres">Include genres</Label>
              <Autocomplete
                suggestions={genres}
                selectedItems={safeSplit(selectedGenres)}
                onSelect={(items) => setSelectedGenres(items.join(', '))}
                placeholder="Select genres to include..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclude-genres">Exclude genres</Label>
              <Autocomplete
                suggestions={genres}
                selectedItems={safeSplit(excludedGenres)}
                onSelect={(items) => setExcludedGenres(items.join(', '))}
                placeholder="Select genres to exclude..."
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#232120] dark:text-[#E7E7E8]">Tags</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="tag-logic" className="text-[#232120] dark:text-[#E7E7E8]">Logic:</Label>
              <Select value={tagLogic} onValueChange={(value) => setTagLogic(value as 'AND' | 'OR')}>
                <SelectTrigger 
                  id="tag-logic" 
                  className="w-[100px] border-[#F1592A] bg-transparent text-[#232120] dark:text-[#E7E7E8] focus:ring-[#F1592A] focus:ring-offset-0"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OR">OR</SelectItem>
                  <SelectItem value="AND">AND</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="include-tags">Include tags</Label>
              <Autocomplete
                suggestions={tags}
                selectedItems={safeSplit(tagSearchInclude)}
                onSelect={(items) => setTagSearchInclude(items.join(', '))}
                placeholder="Select tags to include..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclude-tags">Exclude tags</Label>
              <Autocomplete
                suggestions={tags}
                selectedItems={safeSplit(tagSearchExclude)}
                onSelect={(items) => setTagSearchExclude(items.join(', '))}
                placeholder="Select tags to exclude..."
              />
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#232120] dark:text-[#E7E7E8]">Novel Status</h3>
            <Select value={readingStatus} onValueChange={setReadingStatus}>
              <SelectTrigger 
                id="reading-status"
                className="border-[#F1592A] bg-transparent text-[#232120] dark:text-[#E7E7E8] focus:ring-[#F1592A] focus:ring-offset-0"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
                <SelectItem value="plan-to-read">Plan to Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Publisher Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#232120] dark:text-[#E7E7E8]">Publisher</h3>
            <Input
              id="publisher-search"
              type="text"
              placeholder="Search publishers..."
              value={publisherSearch}
              onChange={(e) => setPublisherSearch(e.target.value)}
              className="bg-transparent border-[#F1592A] text-[#232120] dark:text-[#E7E7E8] focus:ring-[#F1592A] focus:ring-offset-0 placeholder:text-[#232120]/60 dark:placeholder:text-[#E7E7E8]/60"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-[#F1592A]/10">
        <div className="flex space-x-2">
          <Button 
            onClick={handleApplyClick} 
            className="flex-1 bg-[#F1592A] text-white hover:bg-[#F1592A]/90"
          >
            Apply Filters
          </Button>
          <Button 
            onClick={handleResetClick} 
            variant="outline" 
            className="flex-1 border-[#F1592A] text-[#232120] dark:text-[#E7E7E8] hover:bg-[#F1592A] hover:text-white"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
})

export default FilterSection;