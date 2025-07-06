import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Tenor API route called!')
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = searchParams.get('limit') || '20'
  
  const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY
  
  console.log('Tenor API Key status:', TENOR_API_KEY ? 'Found' : 'Missing')
  
  if (!TENOR_API_KEY) {
    console.error('Tenor API key not configured')
    return NextResponse.json({ error: 'Tenor API key not configured' }, { status: 500 })
  }

  try {
    console.log('Searching Tenor GIFs with query:', query)
    
    const base = 'https://tenor.googleapis.com/v2'
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: 'killedit',
      limit,
      media_filter: 'minimal'
    })

    // Use search endpoint for both queries and "trending" (with popular terms)
    const searchQuery = query.trim() || 'funny meme'
    const url = `${base}/search?${params.toString()}&q=${encodeURIComponent(searchQuery)}`

    console.log('Fetching from endpoint:', url.replace(TENOR_API_KEY, 'HIDDEN'))

    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('Tenor API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Tenor API error: ${response.status}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Tenor API response received, results:', data.results?.length || 0)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Tenor API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Tenor API' }, 
      { status: 500 }
    )
  }
} 