import { db } from '@/lib/firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'
import { NextResponse } from 'next/server'

const BASE_URL = 'https://www.novellize.com'

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export async function GET() {
  if (!db) {
    console.error('🔴 Database connection not initialized')
    return new NextResponse('Database connection error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  try {
    const testQuery = collection(db, 'novels')
    const testDoc = await getDocs(testQuery)

    // Start XML document
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    // Add homepage
    xml += `  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`

    if (testDoc.size > 0) {
      for (const doc of testDoc.docs) {
        xml += `  <url>
    <loc>${BASE_URL}/novel/${doc.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`
      }
    } else {
      console.log('⚠️ No novels found in database')
    }

    xml += '</urlset>'

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('🔴 Error:', error)
    return new NextResponse('Error generating sitemap', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
} 