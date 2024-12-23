import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Tag, 
  BookOpen, 
  Building2, 
  Filter, 
  X,
  BookMarked,
  BookOpenCheck,
  BookX,
  BookPlus,
  Hash,
  Star,
  Calendar,
  Globe,
  Type,
  BookText,
  Banknote
} from "lucide-react"
import { useCallback, useState } from "react"
import { tags } from "@/app/tags"
import { genres } from "@/app/genreColors"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FilterSectionProps {
  tagLogic: 'AND' | 'OR'
  setTagLogic: (value: 'AND' | 'OR') => void
  tagSearchInclude: string
  setTagSearchInclude: (value: string) => void
  tagSearchExclude: string
  setTagSearchExclude: (value: string) => void
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
  closeSheet: () => void
  seriesType: string
  setSeriesType: (value: string) => void
  chapterType: string
  setChapterType: (value: string) => void
  seriesStatus: string
  setSeriesStatus: (value: string) => void
  availabilityType: string
  setAvailabilityType: (value: string) => void
  releaseYearRange: [number, number]
  setReleaseYearRange: (value: [number, number]) => void
  ratingRange: [number, number]
  setRatingRange: (value: [number, number]) => void
}

export default function FilterSection({
  tagLogic,
  setTagLogic,
  tagSearchInclude,
  setTagSearchInclude,
  tagSearchExclude,
  setTagSearchExclude,
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
  seriesType,
  setSeriesType,
  chapterType,
  setChapterType,
  seriesStatus,
  setSeriesStatus,
  availabilityType,
  setAvailabilityType,
  releaseYearRange,
  setReleaseYearRange,
  ratingRange,
  setRatingRange
}: FilterSectionProps) {
  const [openIncludeTags, setOpenIncludeTags] = useState(false);
  const [openExcludeTags, setOpenExcludeTags] = useState(false);
  const [openIncludeGenres, setOpenIncludeGenres] = useState(false);
  const [openExcludeGenres, setOpenExcludeGenres] = useState(false);

  const handleTagSelect = (tag: string, type: 'include' | 'exclude') => {
    const setter = type === 'include' ? setTagSearchInclude : setTagSearchExclude;
    const current = type === 'include' ? tagSearchInclude : tagSearchExclude;
    const currentTags = current.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!currentTags.includes(tag)) {
      setter(current ? `${current}, ${tag}` : tag);
    }
  };

  const handleGenreSelect = (genre: string, type: 'include' | 'exclude') => {
    const setter = type === 'include' ? setSelectedGenres : setExcludedGenres;
    const current = type === 'include' ? selectedGenres : excludedGenres;
    const currentGenres = current.split(',').map(g => g.trim()).filter(Boolean);
    
    if (!currentGenres.includes(genre)) {
      setter(current ? `${current}, ${genre}` : genre);
    }
  };

  const renderTags = (tags: string, type: 'include' | 'exclude') => {
    if (!tags) return null;
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {tagArray.map((tag, index) => (
          <Badge
            key={index}
            variant={type === 'include' ? 'default' : 'destructive'}
            className="flex items-center gap-1 text-xs"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer hover:text-white/80" 
              onClick={(e) => {
                e.preventDefault();
                const newTags = tagArray.filter((_, i) => i !== index).join(', ');
                if (type === 'include') {
                  setTagSearchInclude(newTags);
                } else {
                  setTagSearchExclude(newTags);
                }
              }}
            />
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-[calc(100vh-300px)] px-6">
        <div className="space-y-6 py-4">
          {/* Tag Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#F1592A]" />
                <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Tags</h3>
              </div>
              <RadioGroup
                value={tagLogic}
                onValueChange={(value: 'AND' | 'OR') => setTagLogic(value)}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="AND" id="tag-and" />
                  <Label htmlFor="tag-and" className="text-xs">AND</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="OR" id="tag-or" />
                  <Label htmlFor="tag-or" className="text-xs">OR</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="include-tags" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Include Tags
                </Label>
                <Popover open={openIncludeTags} onOpenChange={setOpenIncludeTags}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openIncludeTags}
                      className="w-full justify-between mt-1"
                    >
                      Select tags to include...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {tags.map((tag) => (
                            <CommandItem
                              key={tag}
                              onSelect={() => {
                                handleTagSelect(tag, 'include');
                                setOpenIncludeTags(false);
                              }}
                            >
                              {tag}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {renderTags(tagSearchInclude, 'include')}
              </div>
              <div>
                <Label htmlFor="exclude-tags" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Exclude Tags
                </Label>
                <Popover open={openExcludeTags} onOpenChange={setOpenExcludeTags}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openExcludeTags}
                      className="w-full justify-between mt-1"
                    >
                      Select tags to exclude...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {tags.map((tag) => (
                            <CommandItem
                              key={tag}
                              onSelect={() => {
                                handleTagSelect(tag, 'exclude');
                                setOpenExcludeTags(false);
                              }}
                            >
                              {tag}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {renderTags(tagSearchExclude, 'exclude')}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Genre Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#F1592A]" />
                <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Genres</h3>
              </div>
              <RadioGroup
                value={genreLogic}
                onValueChange={(value: 'AND' | 'OR') => setGenreLogic(value)}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="AND" id="genre-and" />
                  <Label htmlFor="genre-and" className="text-xs">AND</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="OR" id="genre-or" />
                  <Label htmlFor="genre-or" className="text-xs">OR</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="include-genres" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Include Genres
                </Label>
                <Popover open={openIncludeGenres} onOpenChange={setOpenIncludeGenres}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openIncludeGenres}
                      className="w-full justify-between mt-1"
                    >
                      Select genres to include...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search genres..." />
                      <CommandList>
                        <CommandEmpty>No genres found.</CommandEmpty>
                        <CommandGroup>
                          {genres.map((genre) => (
                            <CommandItem
                              key={genre}
                              onSelect={() => {
                                handleGenreSelect(genre, 'include');
                                setOpenIncludeGenres(false);
                              }}
                            >
                              {genre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {renderTags(selectedGenres, 'include')}
              </div>
              <div>
                <Label htmlFor="exclude-genres" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Exclude Genres
                </Label>
                <Popover open={openExcludeGenres} onOpenChange={setOpenExcludeGenres}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openExcludeGenres}
                      className="w-full justify-between mt-1"
                    >
                      Select genres to exclude...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search genres..." />
                      <CommandList>
                        <CommandEmpty>No genres found.</CommandEmpty>
                        <CommandGroup>
                          {genres.map((genre) => (
                            <CommandItem
                              key={genre}
                              onSelect={() => {
                                handleGenreSelect(genre, 'exclude');
                                setOpenExcludeGenres(false);
                              }}
                            >
                              {genre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {renderTags(excludedGenres, 'exclude')}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Series Type Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Series Type</h3>
            </div>
            <Select value={seriesType} onValueChange={setSeriesType}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select series type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ORIGINAL">Original</SelectItem>
                <SelectItem value="TRANSLATED">Translated</SelectItem>
                <SelectItem value="FAN_FIC">Fan Fiction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Chapter Type Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookText className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Chapter Type</h3>
            </div>
            <Select value={chapterType} onValueChange={setChapterType}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select chapter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="MANGA">Manga</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Series Status Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Series Status</h3>
            </div>
            <Select value={seriesStatus} onValueChange={setSeriesStatus}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Availability Type Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Availability</h3>
            </div>
            <Select value={availabilityType} onValueChange={setAvailabilityType}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="FREEMIUM">Freemium</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Release Year Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Release Year</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{releaseYearRange[0]}</span>
                <span className="text-sm text-gray-500">{releaseYearRange[1]}</span>
              </div>
              <Slider
                value={releaseYearRange}
                min={2000}
                max={new Date().getFullYear()}
                step={1}
                onValueChange={(value) => setReleaseYearRange(value as [number, number])}
                className="w-full"
              />
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Rating Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Rating</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{ratingRange[0].toFixed(1)}★</span>
                <span className="text-sm text-gray-500">{ratingRange[1].toFixed(1)}★</span>
              </div>
              <Slider
                value={ratingRange}
                min={0}
                max={5}
                step={0.1}
                onValueChange={(value) => setRatingRange(value as [number, number])}
                className="w-full"
              />
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Publisher Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#F1592A]" />
              <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Publisher</h3>
            </div>
            <div>
              <Label htmlFor="publisher" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Publisher Name
              </Label>
              <Input
                id="publisher"
                value={publisherSearch}
                onChange={(e) => setPublisherSearch(e.target.value)}
                placeholder="Search publishers..."
                className="mt-1 text-sm rounded-full"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-4">
          <Button
            onClick={handleApplyFilters}
            className="flex-1 bg-[#F1592A] text-white hover:bg-[#F1592A]/90 rounded-full"
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="flex-1 rounded-full"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}