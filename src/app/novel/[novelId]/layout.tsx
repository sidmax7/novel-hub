import { Metadata } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

// Function to truncate text to a specific length
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { novelId: string } }): Promise<Metadata> {
  try {
    const novelDoc = await getDoc(doc(db, 'novels', params.novelId))
    
    if (!novelDoc.exists()) {
      return {
        title: 'Novel Not Found | Novellize',
        description: 'The requested novel could not be found on Novellize.'
      }
    }

    const novelData = novelDoc.data()
    const truncatedSynopsis = truncateText(novelData.synopsis, 155) // Truncate to recommended meta description length

    return {
      title: `${novelData.title} | Read on Novellize`,
      description: truncatedSynopsis,
      openGraph: {
        title: `${novelData.title} | Read on Novellize`,
        description: truncatedSynopsis,
        images: [novelData.coverPhoto],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${novelData.title} | Read on Novellize`,
        description: truncatedSynopsis,
        images: [novelData.coverPhoto],
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Novel | Novellize',
      description: 'Read novels on Novellize'
    }
  }
}

export default function NovelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 