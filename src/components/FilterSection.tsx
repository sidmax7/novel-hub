import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Tag, 
  BookOpen, 
  Building2, 
  Filter, 
  X,
  Hash,
  Star,
  Calendar,
  Type,
  BookText,
  Banknote,
  Globe,
  MessageSquare,
  Users
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
import { ChevronDown, ChevronUp } from "lucide-react"
import { Switch } from "@/components/ui/switch"

// Define the options for each filter category
const SERIES_TYPES = [
  { id: "ORIGINAL", label: "Original" },
  { id: "TRANSLATED", label: "Translated" },
  { id: "FAN_FIC", label: "Fan Fiction" }
]

const STYLE_CATEGORIES = [
  { id: "LIGHT_NOVEL", label: "Light Novels" },
  { id: "PUBLISHED_NOVEL", label: "Published Novels" },
  { id: "WEB_NOVEL", label: "Web Novels" },
  { id: "GRAPHIC_NOVEL", label: "Graphic Novels" },
  { id: "NOVELLA", label: "Novella/Short Story" },
  { id: "SERIALIZED", label: "Serialized Novels" },
  { id: "EPISODIC", label: "Episodic Novels" },
  { id: "EPISTOLARY", label: "Epistolary Novels" },
  { id: "ANTHOLOGY", label: "Anthology Novels" },
  { id: "CYOA", label: "Choose Your Own Adventure Novels" },
  { id: "VERSE", label: "Novels-in-Verse" }
]

const CHAPTER_TYPES = [
  { id: "TEXT", label: "Text" },
  { id: "MANGA", label: "Manga" },
  { id: "VIDEO", label: "Video" },
  { id: "AUDIO", label: "Audio" }
]

const LANGUAGES = [
  { id: "EN", label: "English" },
  { id: "JP", label: "Japanese" },
  { id: "KR", label: "Korean" },
  { id: "CN", label: "Chinese" },
  // Add more languages as needed
]

const SERIES_STATUS = [
  { id: "ONGOING", label: "Ongoing" },
  { id: "COMPLETED", label: "Completed" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "UPCOMING", label: "Upcoming" }
]

const AVAILABILITY_TYPES = [
  { id: "FREE", label: "Free" },
  { id: "FREEMIUM", label: "Freemium" },
  { id: "PAID", label: "Paid" }
]

const RELEASE_FREQUENCY = [
  { id: "DAILY", label: "Daily" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "BI_WEEKLY", label: "Bi-Weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "IRREGULAR", label: "Irregular" }
]

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
  selectedGenres: string[]
  setSelectedGenres: (value: string[]) => void
  excludedGenres: string[]
  setExcludedGenres: (value: string[]) => void
  handleApplyFilters: () => void
  handleResetFilters: () => void
  closeSheet: () => void
  selectedSeriesTypes: string[]
  setSelectedSeriesTypes: (value: string[]) => void
  selectedChapterTypes: string[]
  setSelectedChapterTypes: (value: string[]) => void
  selectedSeriesStatus: string[]
  setSelectedSeriesStatus: (value: string[]) => void
  selectedAvailabilityTypes: string[]
  setSelectedAvailabilityTypes: (value: string[]) => void
  releaseYearRange: [number, number]
  setReleaseYearRange: (value: [number, number]) => void
  ratingRange: [number, number]
  setRatingRange: (value: [number, number]) => void
  selectedStyleCategories: string[]
  setSelectedStyleCategories: (value: string[]) => void
  selectedLanguages: string[]
  setSelectedLanguages: (value: string[]) => void
  originalPublisher: string
  setOriginalPublisher: (value: string) => void
  englishPublisher: string
  setEnglishPublisher: (value: string) => void
  releaseFrequency: string[]
  setReleaseFrequency: (value: string[]) => void
  releasedChaptersRange: [number, number]
  setReleasedChaptersRange: (value: [number, number]) => void
  totalChaptersRange: [number, number]
  setTotalChaptersRange: (value: [number, number]) => void
  reviewsRange: [number, number]
  setReviewsRange: (value: [number, number]) => void
  ratingsRange: [number, number]
  setRatingsRange: (value: [number, number]) => void
  ratingsCountRange: [number, number]
  setRatingsCountRange: (value: [number, number]) => void
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
  selectedSeriesTypes,
  setSelectedSeriesTypes,
  selectedChapterTypes,
  setSelectedChapterTypes,
  selectedSeriesStatus,
  setSelectedSeriesStatus,
  selectedAvailabilityTypes,
  setSelectedAvailabilityTypes,
  releaseYearRange,
  setReleaseYearRange,
  ratingRange,
  setRatingRange,
  selectedStyleCategories,
  setSelectedStyleCategories,
  selectedLanguages,
  setSelectedLanguages,
  originalPublisher,
  setOriginalPublisher,
  englishPublisher,
  setEnglishPublisher,
  releaseFrequency,
  setReleaseFrequency,
  releasedChaptersRange,
  setReleasedChaptersRange,
  totalChaptersRange,
  setTotalChaptersRange,
  reviewsRange,
  setReviewsRange,
  ratingsRange,
  setRatingsRange,
  ratingsCountRange,
  setRatingsCountRange
}: FilterSectionProps) {
  const [openIncludeTags, setOpenIncludeTags] = useState(false);
  const [openExcludeTags, setOpenExcludeTags] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [includeTagsFocused, setIncludeTagsFocused] = useState(false);
  const [excludeTagsFocused, setExcludeTagsFocused] = useState(false);

  const handleTagSelect = (tag: string, type: 'include' | 'exclude') => {
    const setter = type === 'include' ? setTagSearchInclude : setTagSearchExclude;
    const current = type === 'include' ? tagSearchInclude : tagSearchExclude;
    const currentTags = current.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!currentTags.includes(tag)) {
      setter(current ? `${current}, ${tag}` : tag);
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

  const renderCheckboxGrid = (
    options: { id: string; label: string }[],
    selectedValues: string[],
    onChange: (values: string[]) => void,
    title: string,
    icon: React.ReactNode
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <Checkbox
              id={option.id}
              checked={selectedValues.includes(option.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selectedValues, option.id]);
                } else {
                  onChange(selectedValues.filter((value) => value !== option.id));
                }
              }}
              className="h-4 w-4 rounded-sm border-[#F1592A]/50 data-[state=checked]:bg-[#F1592A] data-[state=checked]:border-[#F1592A]"
            />
            <Label
              htmlFor={option.id}
              className="text-sm font-medium leading-none cursor-pointer select-none text-gray-700 dark:text-gray-300"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-[calc(100vh-300px)] px-4">
        <div className="space-y-4 py-4">
          {/* Primary Filters */}
          {/* Series Type */}
          {renderCheckboxGrid(
            SERIES_TYPES,
            selectedSeriesTypes,
            setSelectedSeriesTypes,
            "Series Type",
            <Type className="h-4 w-4 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Style Category */}
          {renderCheckboxGrid(
            STYLE_CATEGORIES,
            selectedStyleCategories,
            setSelectedStyleCategories,
            "Style Category",
            <BookText className="h-4 w-4 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Chapter Type */}
          {renderCheckboxGrid(
            CHAPTER_TYPES,
            selectedChapterTypes,
            setSelectedChapterTypes,
            "Chapter Type",
            <BookOpen className="h-4 w-4 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Genres */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#F1592A]" />
                <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Genres</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">OR</span>
                <Switch
                  checked={genreLogic === 'AND'}
                  onCheckedChange={(checked) => setGenreLogic(checked ? 'AND' : 'OR')}
                  className="data-[state=checked]:bg-[#F1592A] data-[state=unchecked]:bg-blue-500"
                />
                <span className="text-sm text-gray-500">AND</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {genres.map((genre) => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={genre}
                    checked={selectedGenres.includes(genre)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                      }
                    }}
                  />
                  <Label
                    htmlFor={genre}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {genre}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#F1592A]" />
                <h3 className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Tags</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">OR</span>
                <Switch
                  checked={tagLogic === 'AND'}
                  onCheckedChange={(checked) => setTagLogic(checked ? 'AND' : 'OR')}
                  className="data-[state=checked]:bg-[#F1592A] data-[state=unchecked]:bg-blue-500"
                />
                <span className="text-sm text-gray-500">AND</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="include-tags" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Include Tags
                </Label>
                <Command className="rounded-lg border border-[#F1592A]/50 mt-1">
                  <CommandInput 
                    placeholder="Search tags to include..." 
                    className="h-9"
                    onFocus={() => setIncludeTagsFocused(true)}
                    onBlur={() => {
                      // Small delay to allow for item selection
                      setTimeout(() => setIncludeTagsFocused(false), 200);
                    }}
                  />
                  {includeTagsFocused && (
                    <CommandList className="max-h-[200px] overflow-auto custom-scrollbar">
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag) => (
                          <CommandItem
                            key={tag}
                            onSelect={() => handleTagSelect(tag, 'include')}
                            className="cursor-pointer hover:bg-[#F1592A]/10"
                          >
                            <Hash className="h-3 w-3 mr-2" />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
                </Command>
                {renderTags(tagSearchInclude, 'include')}
              </div>
              <div>
                <Label htmlFor="exclude-tags" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Exclude Tags
                </Label>
                <Command className="rounded-lg border border-[#F1592A]/50 mt-1">
                  <CommandInput 
                    placeholder="Search tags to exclude..." 
                    className="h-9"
                    onFocus={() => setExcludeTagsFocused(true)}
                    onBlur={() => {
                      // Small delay to allow for item selection
                      setTimeout(() => setExcludeTagsFocused(false), 200);
                    }}
                  />
                  {excludeTagsFocused && (
                    <CommandList className="max-h-[200px] overflow-auto custom-scrollbar">
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag) => (
                          <CommandItem
                            key={tag}
                            onSelect={() => handleTagSelect(tag, 'exclude')}
                            className="cursor-pointer hover:bg-[#F1592A]/10"
                          >
                            <Hash className="h-3 w-3 mr-2" />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
                </Command>
                {renderTags(tagSearchExclude, 'exclude')}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Language */}
          {renderCheckboxGrid(
            LANGUAGES,
            selectedLanguages,
            setSelectedLanguages,
            "Language",
            <Globe className="h-5 w-5 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Series Status */}
          {renderCheckboxGrid(
            SERIES_STATUS,
            selectedSeriesStatus,
            setSelectedSeriesStatus,
            "Series Status",
            <BookOpen className="h-5 w-5 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Availability Criteria */}
          {renderCheckboxGrid(
            AVAILABILITY_TYPES,
            selectedAvailabilityTypes,
            setSelectedAvailabilityTypes,
            "Availability",
            <Banknote className="h-5 w-5 text-[#F1592A]" />
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Advanced Filters Toggle */}
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between py-4 px-6 bg-[#F1592A]/10 hover:bg-[#F1592A]/20 border-y border-[#F1592A]/20"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#F1592A]" />
              <span className="text-base font-semibold text-[#232120] dark:text-[#E7E7E8]">Advanced Filters</span>
            </div>
            {showAdvancedFilters ? (
              <ChevronUp className="h-5 w-5 text-[#F1592A]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#F1592A]" />
            )}
          </Button>

          {showAdvancedFilters && (
            <div className="space-y-6 p-4 bg-[#F1592A]/5">
              {/* Publishers Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Publishers</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Original Publisher</Label>
                    <Input
                      value={originalPublisher}
                      onChange={(e) => setOriginalPublisher(e.target.value)}
                      placeholder="Search original publishers..."
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A] transition-colors"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">English Publisher</Label>
                    <Input
                      value={englishPublisher}
                      onChange={(e) => setEnglishPublisher(e.target.value)}
                      placeholder="Search English publishers..."
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[#F1592A]/20" />

              {/* Release Frequency */}
              {renderCheckboxGrid(
                RELEASE_FREQUENCY,
                releaseFrequency,
                setReleaseFrequency,
                "Release Frequency",
                <Calendar className="h-4 w-4 text-[#F1592A]" />
              )}

              <Separator className="bg-[#F1592A]/20" />

              {/* Released Chapters Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Released Chapters</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={0}
                      max={releasedChaptersRange[1]}
                      value={releasedChaptersRange[0]}
                      onChange={(e) => setReleasedChaptersRange([parseInt(e.target.value), releasedChaptersRange[1]])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={releasedChaptersRange[0]}
                      max={1000}
                      value={releasedChaptersRange[1]}
                      onChange={(e) => setReleasedChaptersRange([releasedChaptersRange[0], parseInt(e.target.value)])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[#F1592A]/20" />

              {/* Total Chapters Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Total Chapters</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={0}
                      max={totalChaptersRange[1]}
                      value={totalChaptersRange[0]}
                      onChange={(e) => setTotalChaptersRange([parseInt(e.target.value), totalChaptersRange[1]])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={totalChaptersRange[0]}
                      max={1000}
                      value={totalChaptersRange[1]}
                      onChange={(e) => setTotalChaptersRange([totalChaptersRange[0], parseInt(e.target.value)])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[#F1592A]/20" />

              {/* Reviews Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Reviews</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={0}
                      max={reviewsRange[1]}
                      value={reviewsRange[0]}
                      onChange={(e) => setReviewsRange([parseInt(e.target.value), reviewsRange[1]])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={reviewsRange[0]}
                      max={10000}
                      value={reviewsRange[1]}
                      onChange={(e) => setReviewsRange([reviewsRange[0], parseInt(e.target.value)])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[#F1592A]/20" />

              {/* Ratings Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Ratings</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={0}
                      max={ratingsRange[1]}
                      step={0.1}
                      value={ratingsRange[0]}
                      onChange={(e) => setRatingsRange([parseFloat(e.target.value), ratingsRange[1]])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={ratingsRange[0]}
                      max={5}
                      step={0.1}
                      value={ratingsRange[1]}
                      onChange={(e) => setRatingsRange([ratingsRange[0], parseFloat(e.target.value)])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[#F1592A]/20" />

              {/* Number of Ratings Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#F1592A]" />
                  <h3 className="text-sm font-semibold text-[#232120] dark:text-[#E7E7E8]">Number of Ratings</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={0}
                      max={ratingsCountRange[1]}
                      value={ratingsCountRange[0]}
                      onChange={(e) => setRatingsCountRange([parseInt(e.target.value), ratingsCountRange[1]])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={ratingsCountRange[0]}
                      max={10000}
                      value={ratingsCountRange[1]}
                      onChange={(e) => setRatingsCountRange([ratingsCountRange[0], parseInt(e.target.value)])}
                      className="h-9 rounded-md bg-transparent border-[#F1592A]/50 hover:border-[#F1592A] focus:border-[#F1592A]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-3">
          <Button
            onClick={handleApplyFilters}
            className="flex-1 bg-[#F1592A] text-white hover:bg-[#F1592A]/90 h-9 rounded-md"
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="flex-1 h-9 rounded-md border-[#F1592A]/50 hover:border-[#F1592A] hover:bg-[#F1592A]/10"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}