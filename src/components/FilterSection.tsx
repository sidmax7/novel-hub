import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Autocomplete } from "@/components/ui/autocomplete"
import { tags } from '../app/tags'
import { genreColors, genres } from '../app/genreColors'

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
  handleResetFilters
}: {
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
}) {

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Genres Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">Genres</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="genre-logic">Logic:</Label>
            <Select value={genreLogic} onValueChange={(value) => setGenreLogic(value as 'AND' | 'OR')}>
              <SelectTrigger id="genre-logic" className="w-[100px]">
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
              selectedItems={selectedGenres.split(',').filter(genre => genre.trim())}
              onSelect={(items) => setSelectedGenres(items.join(', '))}
              placeholder="Select genres to include..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclude-genres">Exclude genres</Label>
            <Autocomplete
              suggestions={genres}
              selectedItems={excludedGenres.split(',').filter(genre => genre.trim())}
              onSelect={(items) => setExcludedGenres(items.join(', '))}
              placeholder="Select genres to exclude..."
            />
          </div>
        </div>

        {/* Tags Section - Now Second */}
        <div className="space-y-4">
          <h3 className="font-semibold">Tags</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="tag-logic">Logic:</Label>
            <Select value={tagLogic} onValueChange={(value) => setTagLogic(value as 'AND' | 'OR')}>
              <SelectTrigger id="tag-logic" className="w-[100px]">
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
              selectedItems={tagSearchInclude.split(',').filter(tag => tag.trim())}
              onSelect={(items) => setTagSearchInclude(items.join(', '))}
              placeholder="Select tags to include..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclude-tags">Exclude tags</Label>
            <Autocomplete
              suggestions={tags}
              selectedItems={tagSearchExclude.split(',').filter(tag => tag.trim())}
              onSelect={(items) => setTagSearchExclude(items.join(', '))}
              placeholder="Select tags to exclude..."
            />
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">Novel Status</h3>
          <Select value={readingStatus} onValueChange={setReadingStatus}>
            <SelectTrigger id="reading-status">
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
          <h3 className="font-semibold">Publisher</h3>
          <Input
            id="publisher-search"
            type="text"
            placeholder="Search publishers..."
            value={publisherSearch}
            onChange={(e) => setPublisherSearch(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={handleResetFilters} variant="outline" className="flex-1">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

export default FilterSection;