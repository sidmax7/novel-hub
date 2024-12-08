import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from 'lucide-react'
import CommentSystem from '@/components/ui/commentsystem'

interface CommentsTabProps {
  novelId: string
}

export function CommentsTab({ novelId }: CommentsTabProps) {
  return (
    <Card className="bg-white dark:bg-[#232120] rounded-t-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-[#232120] dark:text-[#E7E7E8]">
          <MessageSquare className="mr-2 h-6 w-6" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommentSystem novelId={novelId} />
      </CardContent>
    </Card>
  )
}

