'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Image from "next/image"

interface TenorV2MediaFormat { url: string; dims?: number[]; preview?: string }
interface TenorV2Media { 
  gif?: TenorV2MediaFormat
  mediumgif?: TenorV2MediaFormat
  tinygif?: TenorV2MediaFormat
  nanogif?: TenorV2MediaFormat
}
interface TenorV2Result { 
  id: string
  title?: string
  content_description?: string
  media_formats?: TenorV2Media
}

interface GiphyGif {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    original: {
      url: string
      width: string
      height: string
    }
  }
}

interface GiphyPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
  isOpen: boolean
}

export function GiphyPicker({ onSelect, onClose, isOpen }: GiphyPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY
  
  // Debug: Check if API key is loaded
  useEffect(() => {
    console.log('Tenor API Key status:', TENOR_API_KEY ? 'Found' : 'Not found')
    console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))
  }, [TENOR_API_KEY])

  const searchGifs = useCallback(async (query: string) => {
    console.log('Searching Tenor GIFs with query:', query)
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '20'
      })
      
      if (query.trim()) {
        params.set('q', query)
      }
      
      const url = `/api/tenor?${params.toString()}`

      console.log('Fetching from endpoint:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API proxy error:', response.status, errorData)
        alert(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`)
        setIsLoading(false)
        return
      }
      const data = await response.json()
      
      console.log('Tenor API response:', data)

      if (data.results) {
        const mapped = (data.results as TenorV2Result[]).map((r) => {
          const media = r.media_formats || {}
          const fixed = media.nanogif || media.tinygif || media.mediumgif || media.gif
          const original = media.gif || media.mediumgif || fixed
          return fixed?.url
            ? {
                id: r.id,
                title: r.title || r.content_description || '',
                images: {
                  fixed_height: {
                    url: fixed.url,
                    width: '200',
                    height: '200'
                  },
                  original: {
                    url: original?.url || fixed.url,
                    width: '480',
                    height: '480'
                  }
                }
              }
            : null
        }).filter(Boolean) as GiphyGif[]

        setGifs(mapped)
        setHasSearched(true)
        console.log('Found', data.results.length, 'GIFs')
      } else {
        console.error('No data in API response:', data)
        if (data.error) {
          alert(`Tenor API Error: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch GIFs:', error)
      alert('Failed to fetch GIFs. Please check your internet connection and API key.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && !hasSearched) {
      searchGifs('')
    }
  }, [isOpen, hasSearched, searchGifs])

  const handleSearch = () => {
    searchGifs(searchTerm)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectGif = (gif: GiphyGif) => {
    onSelect(gif.images.original.url)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 max-h-96 bg-neutral-800 border border-neutral-700 rounded-lg z-20 shadow-lg max-w-[calc(100vw-2rem)]">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-200">Search GIFs</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-200"
          >
            ✕
          </Button>
        </div>
        
        <div className="mb-3">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for GIFs..."
              className="bg-neutral-700 border-neutral-600 text-neutral-100 text-sm flex-1"
            />
            <Button 
              onClick={handleSearch} 
              size="sm" 
              disabled={isLoading}
              type="button"
              className="shrink-0"
            >
              {isLoading ? '...' : '🔍'}
            </Button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-neutral-400 text-sm">Loading GIFs...</p>
            </div>
          ) : gifs.length === 0 && hasSearched ? (
            <div className="text-center py-4">
              <p className="text-neutral-400 text-sm">No GIFs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <Card
                  key={gif.id}
                  className="cursor-pointer hover:ring-2 hover:ring-blue-500 overflow-hidden"
                  onClick={() => handleSelectGif(gif)}
                >
                  <Image
                    src={gif.images.fixed_height.url}
                    alt={gif.title}
                    width={200}
                    height={200}
                    className="w-full h-24 object-cover"
                    unoptimized
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-neutral-500 text-center">
          Powered by Tenor
        </div>
      </div>
    </div>
  )
} 