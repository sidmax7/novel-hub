'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { auth, db } from '@/lib/firebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { collection, doc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useAuth } from '../authcontext'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])
  const handleContinueWithoutSignIn = () => {
    router.push('./') // Redirect to the desired page without authentication
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedUsername = username.replace(/\s+/g, '')
    if (trimmedUsername !== username) {
      setError('Username cannot contain spaces. Spaces have been removed.')
      setUsername(trimmedUsername)
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const usernameQuery = query(collection(db, 'users'), where('username', '==', trimmedUsername))
      const usernameQuerySnapshot = await getDocs(usernameQuery)

      if (!usernameQuerySnapshot.empty) {
        setError('Username is already taken. Please choose a different one.')
        setLoading(false)
        return
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: trimmedUsername })
      
      // Create user record in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        username: trimmedUsername,
        email: email,
        timeCreated: Timestamp.now()
      })
    }
    router.push('/')
  } catch (error) {
    setError('Failed to authenticate. Please check your credentials.')
    console.error(error)
  }

  setLoading(false)
}

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg px-8 py-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            {isLogin ? 'Log In' : 'Sign Up'} to NovelHub
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center"><p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-500 hover:underline dark:text-blue-400"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button></p>
            <Button variant="outline" onClick={handleContinueWithoutSignIn} className="mt-4 ">
                  Continue without signing in
                </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


