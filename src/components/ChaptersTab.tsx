import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'

interface ChaptersTabProps {
  chaptersLoading: boolean
  chapters: {
    id: string
    number: number
    title: string
    link: string
    releaseDate: Timestamp
  }[]
  formatDate: (timestamp: Timestamp) => string
}

export function ChaptersTab({ chaptersLoading, chapters, formatDate }: ChaptersTabProps) {
  return (
    <Card className="bg-white dark:bg-[#232120]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-[#232120] dark:text-[#E7E7E8]">
          <BookOpen className="mr-2 h-6 w-6" />
          Chapters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chaptersLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">Loading chapters...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">No chapters available for this novel yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Check back later for updates!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#E7E7E8] dark:bg-[#3E3F3E]">
                  <th className="px-4 py-2 text-left">Chapter</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Release Date</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) => (
                  <tr key={chapter.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{chapter.number}</td>
                    <td className="px-4 py-2">{chapter.title}</td>
                    <td className="px-4 py-2">{formatDate(chapter.releaseDate)}</td>
                    <td className="px-4 py-2 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(chapter.link, '_blank', 'noopener,noreferrer')}
                      >
                        Read
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

