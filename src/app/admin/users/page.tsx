'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast, Toaster } from 'react-hot-toast'
import { ArrowLeft, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  uid: string
  email: string
  username: string
  userType: 'reader' | 'author' | 'admin'
  createdAt: any
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        router.push('/')
        return
      }

      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid), where('userType', '==', 'admin')))
      
      if (userSnap.empty) {
        router.push('/')
        return
      }
    }

    checkAdminAccess()
    fetchUsers()
  }, [user, router])

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)
      const usersList = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User))
      setUsers(usersList)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserTypeChange = async (uid: string, currentType: string) => {
    try {
      const newType = currentType === 'reader' ? 'author' : 'reader'
      await updateDoc(doc(db, 'users', uid), {
        userType: newType
      })
      toast.success(`User type updated to ${newType}`)
      setUsers(users.map(user => 
        user.uid === uid ? { ...user, userType: newType } : user
      ))
    } catch (error) {
      console.error('Error updating user type:', error)
      toast.error('Failed to update user type')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Toaster />
      <Card className="mb-8 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">User Management</CardTitle>
            <Link href="/admin">
              <Button variant="outline" className="">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search users by email or username"
              className="pl-10 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Username</TableHead>
                    <TableHead className="w-1/3">Email</TableHead>
                    <TableHead className="w-1/4">User Type</TableHead>
                    <TableHead className="w-1/4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.userType === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.userType === 'author'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.userType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.userType !== 'admin' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Reader</span>
                            <Switch
                              checked={user.userType === 'author'}
                              onCheckedChange={() => handleUserTypeChange(user.uid, user.userType)}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span className="text-sm font-medium">Author</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}