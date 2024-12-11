'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import { Sun, Moon } from 'lucide-react'
import { useAuth } from '@/app/authcontext'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#232120]">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="inline-block font-bold text-xl text-[#F1592A]">NovelNook</span>
        </Link>
        <div className="flex-1 flex justify-end gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {!user && (
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 