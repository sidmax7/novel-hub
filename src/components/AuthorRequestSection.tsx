'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export const AuthorRequestSection = () => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRequestAccess = async () => {
    if (!user) {
      toast.error('Please login to request author access')
      return
    }

    try {
      setIsSubmitting(true)

      // Check if user has already submitted a request
      const requestsRef = collection(db, 'requests')
      const q = query(requestsRef, where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        toast.error('You have already submitted a request')
        return
      }

      // Add new request to Firestore
      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        email: user.email,
        status: 'pending',
        createdAt: new Date(),
        type: 'author_access'
      })

      toast.success('Your request has been submitted successfully!')
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section 
      className="py-16 bg-gradient-to-br from-[#232120] via-[#2A2827] to-[#232120] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(241, 89, 42, 0.15) 0%, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#F1592A] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Become an Author
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Share your stories with our growing community of readers. Join our platform as an author and bring your creative visions to life.
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button
              onClick={handleRequestAccess}
              disabled={isSubmitting || !user}
              className="relative group bg-gradient-to-r from-[#F1592A] to-[#FF8C94] hover:from-[#FF8C94] hover:to-[#F1592A] text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {isSubmitting ? 'Submitting...' : 'Request Author Access'}
              </span>
              <motion.div
                className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </Button>
          </motion.div>

          {!user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-gray-400 text-sm"
            >
              Please login to request author access
            </motion.p>
          )}
        </div>
      </div>
    </motion.section>
  )
} 