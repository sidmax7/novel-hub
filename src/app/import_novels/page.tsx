'use client'

import React, { useState } from 'react'
import { db, storage } from '@/lib/firebaseConfig'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast, Toaster } from 'react-hot-toast'
import { AlertTriangle, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface Novel {
  name: string
  author: string
  synopsis: string
  genre: string
  tags: string[]
  type: string
  likes: number
  releaseDate: string
  lastUpdated: string
  language: string
  rating: number
  chapters: number
  views: number
  rank: number
  coverUrl: string
}

const ImportNovelsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const data = await readFileData(file)
      await importNovels(data)
      toast.success('Novels imported successfully')
    } catch (error) {
      console.error('Error importing novels:', error)
      setError(`Failed to import novels: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to import novels. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const readFileData = (file: File): Promise<Novel[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        resolve(jsonData as Novel[])
      }
      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const importNovels = async (novels: Novel[]) => {
    for (const novel of novels) {
      // Check if the novel already exists
      const existingNovel = await checkNovelExists(novel.name, novel.author)
      if (existingNovel) {
        console.log(`Novel "${novel.name}" by ${novel.author} already exists. Skipping.`)
        continue
      }

      // Upload cover image if URL is provided
      if (novel.coverUrl) {
        try {
          const imageResponse = await fetch(novel.coverUrl)
          const imageBlob = await imageResponse.blob()
          const imagePath = `novel-covers/${novel.name.replace(/\s+/g, '_')}.jpg`
          const storageRef = ref(storage, imagePath)
          await uploadBytes(storageRef, imageBlob)
          novel.coverUrl = await getDownloadURL(storageRef)
        } catch (error) {
          console.error(`Failed to upload cover image for "${novel.name}":`, error)
          novel.coverUrl = '' // Set to empty string if upload fails
        }
      }

      // Add the novel to Firestore
      try {
        await addDoc(collection(db, 'novels'), {
          ...novel,
          lastUpdated: new Date().toISOString(),
          likes: 0,
          views: 0,
          rating: 0,
          rank: 0,
        })
        console.log(`Novel "${novel.name}" imported successfully`)
      } catch (error) {
        console.error(`Failed to import novel "${novel.name}":`, error)
      }
    }
  }

  const checkNovelExists = async (name: string, author: string): Promise<boolean> => {
    const q = query(
      collection(db, 'novels'),
      where('name', '==', name),
      where('author', '==', author)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Import Novels</CardTitle>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>
          <Button onClick={handleImport} disabled={!file || importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'Importing...' : 'Import Novels'}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ImportNovelsPage
