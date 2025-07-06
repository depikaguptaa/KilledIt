'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TombstoneCard } from '@/components/TombstoneCard'
import { obituaryService, Obituary } from '@/lib/supabase'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

export default function SavedPage() {
  const router = useRouter()
  const [savedObituaries, setSavedObituaries] = useState<Obituary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [hasMore, setHasMore] = useState(true)
  const [allSavedIds, setAllSavedIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const loadSavedObituaries = async () => {
      try {
        // Get all saved obituaries first
        const allSaved = await obituaryService.getSavedObituaries()
        const allSavedData = allSaved as unknown as Obituary[]
        
        // Set up pagination
        const firstBatch = allSavedData.slice(0, ITEMS_PER_PAGE)
        setSavedObituaries(firstBatch)
        setAllSavedIds(allSavedData.map(obit => obit.id))
        setCurrentIndex(ITEMS_PER_PAGE)
        
        // Check if there are more items
        if (allSavedData.length <= ITEMS_PER_PAGE) {
          setHasMore(false)
        }
        
        // Get comment counts for first batch
        if (firstBatch.length > 0) {
          const obituaryIds = firstBatch.map(obit => obit.id)
          const counts = await obituaryService.getCommentCounts(obituaryIds)
          setCommentCounts(counts)
        }
      } catch (error: unknown) {
        console.error('Failed to load saved obituaries:', error)
        // If user is not authenticated, redirect to login
        if (error instanceof Error && error.message === 'Not authenticated') {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedObituaries()
  }, [router])

  // Function to load more saved obituaries
  const loadMoreSavedObituaries = useCallback(async () => {
    if (!hasMore) return

    try {
      // Get all saved obituaries again (in case new ones were saved)
      const allSaved = await obituaryService.getSavedObituaries()
      const allSavedData = allSaved as unknown as Obituary[]
      
      // Get the next batch
      const nextBatch = allSavedData.slice(currentIndex, currentIndex + ITEMS_PER_PAGE)
      
      if (nextBatch.length === 0) {
        setHasMore(false)
        return
      }

      // Get comment counts for new batch
      if (nextBatch.length > 0) {
        const obituaryIds = nextBatch.map(obit => obit.id)
        const newCounts = await obituaryService.getCommentCounts(obituaryIds)
        setCommentCounts(prev => ({ ...prev, ...newCounts }))
      }

      setSavedObituaries(prev => [...prev, ...nextBatch])
      setCurrentIndex(prev => prev + ITEMS_PER_PAGE)

      // Check if we've reached the end
      if (currentIndex + nextBatch.length >= allSavedData.length) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more saved obituaries:', error)
    }
  }, [currentIndex, hasMore])

  // Setup infinite scroll
  const { isFetching } = useInfiniteScroll(loadMoreSavedObituaries, {
    threshold: 200
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <p className="text-neutral-400">Loading saved obituaries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-100 mb-2">
          Saved Obituaries
        </h1>
        <p className="text-neutral-400">
          Your bookmarked startup failures to learn from
        </p>
      </div>

      {savedObituaries.length === 0 ? (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-xl font-bold text-neutral-300 mb-2">No saved obituaries yet</h3>
            <p className="text-neutral-400 mb-4">
              Start saving interesting startup failures to build your learning collection.
            </p>
            <Link href="/">
              <Button>Browse Obituaries</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-neutral-400">
              {allSavedIds.length} saved obituar{allSavedIds.length === 1 ? 'y' : 'ies'}
            </p>
            <Link href="/">
              <Button variant="outline" size="sm">Browse More</Button>
            </Link>
          </div>
          
          {savedObituaries.map((obituary) => (
            <TombstoneCard key={obituary.id} obituary={obituary} commentCount={commentCounts[obituary.id] || 0} />
          ))}

          {/* Loading indicator for infinite scroll */}
          {isFetching && hasMore && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-neutral-400">
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                Loading more saved obituaries...
              </div>
            </div>
          )}

          {/* End of content indicator */}
          {!hasMore && savedObituaries.length > 0 && (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">
                🪦 You&apos;ve reached the end of your saved collection!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 