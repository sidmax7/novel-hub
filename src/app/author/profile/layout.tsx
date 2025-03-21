import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Author Profile | Novellize',
  description: 'View author information and their works on Novellize',
}

export default function AuthorProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
} 