import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookMarked, ThumbsUp, BookOpen } from 'lucide-react'

interface AboutTabProps {
  novel: {
    synopsis: string
    seriesStatus: string
    totalChapters: number
    publishers: {
      original: string
      english?: string
    }
    genres: { name: string }[]
    views: number
  }
  theme: string
  getColorScheme: (item: string) => { light: string; dark: string }
  likes: number
}

export function AboutTab({ novel, theme, getColorScheme, likes }: AboutTabProps) {
  return (
    <Card className="bg-white dark:bg-[#232120]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-[#232120] dark:text-[#E7E7E8]">
          <BookMarked className="mr-2 h-6 w-6" />
          About
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Synopsis</h3>
            <p className="text-gray-700 dark:text-gray-300">{novel.synopsis || 'No synopsis available.'}</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-600 dark:text-gray-400">Status</h4>
                <p className="text-gray-800 dark:text-gray-200">{novel.seriesStatus}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-600 dark:text-gray-400">Total Chapters</h4>
                <p className="text-gray-800 dark:text-gray-200">{novel.totalChapters}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-600 dark:text-gray-400">Original Publisher</h4>
                <p className="text-gray-800 dark:text-gray-200">{novel.publishers.original}</p>
              </div>
              {novel.publishers.english && (
                <div>
                  <h4 className="font-medium text-gray-600 dark:text-gray-400">English Publisher</h4>
                  <p className="text-gray-800 dark:text-gray-200">{novel.publishers.english}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {novel.genres.map((g, i) => (
                <span 
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    theme === 'dark'
                      ? getColorScheme(g.name).dark
                      : getColorScheme(g.name).light
                  }`}
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-gray-500" />
                <span>{novel.totalChapters} chapters</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{novel.views} views</span>
              </div>
              <div className="flex items-center">
                <ThumbsUp className="h-5 w-5 mr-2 text-gray-500" />
                <span>{likes} likes</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

