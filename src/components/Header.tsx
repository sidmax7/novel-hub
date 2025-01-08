'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import { Sun, Moon, MessageSquare } from 'lucide-react'
import { useAuth } from '@/app/authcontext'
import { motion } from 'framer-motion'

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
          <Link href="/forum" className="hidden md:block">
            <motion.div
              variants={{
                idle: {
                  scale: 1,
                  boxShadow: "0px 0px 8px rgba(241, 89, 42, 0.5)",
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                },
                hover: {
                  scale: 1.05,
                  boxShadow: "0px 0px 15px rgba(241, 89, 42, 0.8)",
                }
              }}
              initial="idle"
              animate="idle"
              whileHover="hover"
              className="inline-block"
            >
              <Button 
                variant="outline" 
                className="relative border-2 border-[#F1592A] text-[#F1592A] hover:bg-[#F1592A] hover:text-white dark:border-[#F1592A] dark:text-[#F1592A] dark:hover:bg-[#F1592A] dark:hover:text-[#E7E7E8] overflow-hidden group px-4 gap-2"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-[#F1592A]/0 via-[#F1592A]/30 to-[#F1592A]/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <MessageSquare className="h-4 w-4 relative" />
                <span className="relative">Forum</span>
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  )
} 