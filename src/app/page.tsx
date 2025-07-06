'use client'

import { useEffect, useState, useCallback } from 'react'
import { TombstoneCard } from '@/components/TombstoneCard'
import { obituaryService, Obituary, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

export default function HomePage() {
  const [obituaries, setObituaries] = useState<Obituary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [user, setUser] = useState<User | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  // Load initial data and check authentication
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        // Load first page of obituaries
        const data = await obituaryService.getObituaries(ITEMS_PER_PAGE, 0)
        setObituaries(data)
        
        // Get comment counts for all obituaries
        if (data.length > 0) {
          const obituaryIds = data.map(obit => obit.id)
          const counts = await obituaryService.getCommentCounts(obituaryIds)
          setCommentCounts(counts)
        }

        // Check if there are more items
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false)
        }
      } catch (error) {
        console.error('Failed to load obituaries:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Function to load more obituaries
  const loadMoreObituaries = useCallback(async () => {
    if (!hasMore || !user) return

    try {
      const nextPage = page + 1
      const offset = nextPage * ITEMS_PER_PAGE
      const newData = await obituaryService.getObituaries(ITEMS_PER_PAGE, offset)
      
      if (newData.length === 0) {
        setHasMore(false)
        return
      }

      // Get comment counts for new obituaries
      if (newData.length > 0) {
        const obituaryIds = newData.map(obit => obit.id)
        const newCounts = await obituaryService.getCommentCounts(obituaryIds)
        setCommentCounts(prev => ({ ...prev, ...newCounts }))
      }

      setObituaries(prev => [...prev, ...newData])
      setPage(nextPage)

      // Check if we've reached the end
      if (newData.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more obituaries:', error)
    }
  }, [page, hasMore, user])

  // Setup infinite scroll for logged-in users
  const { isFetching } = useInfiniteScroll(loadMoreObituaries, {
    threshold: 200 // Start loading 200px before reaching bottom
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-hidden">
        {/* Graveyard decorative elements - testing in page component */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Left side tombstones */}
          <div className="fixed top-20 left-10 w-8 h-12 bg-neutral-600 opacity-20 rounded-t-full tombstone-sway-1"></div>
          <div className="fixed bottom-40 left-20 w-6 h-10 bg-neutral-600 opacity-15 rounded-t-full tombstone-sway-3"></div>
          <div className="fixed top-80 left-5 w-4 h-6 bg-neutral-700 opacity-12 rounded-full"></div>
          
          {/* Right side tombstones */}
          <div className="fixed top-60 right-16 w-10 h-14 bg-neutral-600 opacity-20 rounded-t-full tombstone-sway-2"></div>
          <div className="fixed bottom-20 right-10 w-5 h-8 bg-neutral-600 opacity-15 rounded-t-full tombstone-sway-2"></div>
          
          {/* Cross tombstones */}
          <div className="fixed top-40 right-32 opacity-18 tombstone-sway-1" style={{animationDelay: '-1s'}}>
            <div className="w-6 h-2 bg-neutral-600 absolute top-2 left-1"></div>
            <div className="w-2 h-8 bg-neutral-600 absolute top-0 left-3"></div>
            <div className="w-8 h-4 bg-neutral-600 absolute top-8 left-0"></div>
          </div>
          
          {/* Memorial stones */}
          <div className="fixed bottom-10 right-40 w-3 h-4 bg-neutral-700 opacity-10 rounded-full"></div>
          <div className="fixed top-10 right-5 w-4 h-5 bg-neutral-700 opacity-10 rounded-full"></div>
          
          {/* Fence elements */}
          <div className="fixed bottom-0 left-0 opacity-12">
            <div className="flex space-x-4">
              <div className="w-1 h-6 bg-neutral-600"></div>
              <div className="w-1 h-5 bg-neutral-600"></div>
              <div className="w-1 h-7 bg-neutral-600"></div>
              <div className="w-1 h-4 bg-neutral-600"></div>
              <div className="w-1 h-6 bg-neutral-600"></div>
            </div>
            <div className="w-24 h-1 bg-neutral-600 mt-1"></div>
          </div>
          
          <div className="fixed bottom-0 right-0 opacity-12">
            <div className="flex space-x-3">
              <div className="w-1 h-5 bg-neutral-600"></div>
              <div className="w-1 h-6 bg-neutral-600"></div>
              <div className="w-1 h-4 bg-neutral-600"></div>
              <div className="w-1 h-7 bg-neutral-600"></div>
            </div>
            <div className="w-18 h-1 bg-neutral-600 mt-1"></div>
          </div>
        </div>
        
        <div className="mx-auto max-w-4xl px-4 py-8 relative z-30">
          <div className="mb-12 text-center">
            <h1 className="mb-6 text-3xl sm:text-4xl lg:text-6xl font-bold text-neutral-100 leading-tight">
              Welcome to the <span className="relative font-black">
                <span className="absolute inset-0 bg-gradient-to-r from-red-500/25 to-red-600/25 blur-lg -z-10"></span>
                <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">Final Boss</span>
              </span> of <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap font-black">Startup L&apos;s</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Where ideas flop, burnouts peak, and founders overshare for closure.
            </p>
            
            {/* Feature explanation with icons */}
            <div className="mb-10 max-w-2xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base text-neutral-400">
                <div className="flex items-center gap-2 group hover:text-blue-300 transition-all duration-300 cursor-default">
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">💀</span>
                  <strong className="text-blue-400 group-hover:text-blue-300 text-shadow-sm">Drop your L</strong>
                </div>
                <div className="hidden sm:block text-neutral-600 opacity-50">•</div>
                <div className="flex items-center gap-2 group hover:text-green-300 transition-all duration-300 cursor-default">
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🔥</span>
                  <strong className="text-green-400 group-hover:text-green-300 text-shadow-sm">React with pain</strong>
                </div>
                <div className="hidden sm:block text-neutral-600 opacity-50">•</div>
                <div className="flex items-center gap-2 group hover:text-purple-300 transition-all duration-300 cursor-default">
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🔖</span>
                  <strong className="text-purple-400 group-hover:text-purple-300 text-shadow-sm">Bookmark the mess</strong>
                </div>
              </div>
            </div>
            
            {/* Enhanced CTA Button */}
            <Link href="/create">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 sm:px-12 py-4 text-lg sm:text-xl shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40 transform hover:scale-105 transition-all duration-200 border border-red-500/20"
              >
                <span className="mr-2 text-xl">💀</span>
                <span className="hidden sm:inline">Confess Your Failure</span>
                <span className="sm:hidden">Confess</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {(user ? obituaries : obituaries.slice(0, 4)).map((obituary) => (
              <TombstoneCard key={obituary.id} obituary={obituary} commentCount={commentCounts[obituary.id] || 0} />
            ))}
          </div>

          {/* Loading indicator for infinite scroll */}
          {user && isFetching && hasMore && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-neutral-400">
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                Loading more obituaries...
              </div>
            </div>
          )}

          {/* End of content indicator */}
          {user && !hasMore && obituaries.length > 0 && (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">
                🪦 You&apos;ve reached the end of the graveyard. Time to create your own obituary!
              </p>
            </div>
          )}

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <div className="text-center py-8">
              <p className="text-neutral-400 mb-4">
                Want to see more startup failures? Sign in to unlock infinite scroll!
              </p>
              <Link href="/login">
                <Button variant="outline">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-hidden">
      {/* Graveyard decorative elements - testing in page component */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Left side tombstones */}
        <div className="fixed top-20 left-10 w-8 h-12 bg-neutral-600 opacity-20 rounded-t-full tombstone-sway-1"></div>
        <div className="fixed bottom-40 left-20 w-6 h-10 bg-neutral-600 opacity-15 rounded-t-full tombstone-sway-3"></div>
        <div className="fixed top-80 left-5 w-4 h-6 bg-neutral-700 opacity-12 rounded-full"></div>
        
        {/* Right side tombstones */}
        <div className="fixed top-60 right-16 w-10 h-14 bg-neutral-600 opacity-20 rounded-t-full tombstone-sway-2"></div>
        <div className="fixed bottom-20 right-10 w-5 h-8 bg-neutral-600 opacity-15 rounded-t-full tombstone-sway-2"></div>
        
        {/* Cross tombstones */}
        <div className="fixed top-40 right-32 opacity-18 tombstone-sway-1" style={{animationDelay: '-1s'}}>
          <div className="w-6 h-2 bg-neutral-600 absolute top-2 left-1"></div>
          <div className="w-2 h-8 bg-neutral-600 absolute top-0 left-3"></div>
          <div className="w-8 h-4 bg-neutral-600 absolute top-8 left-0"></div>
        </div>
        
        {/* Memorial stones */}
        <div className="fixed bottom-10 right-40 w-3 h-4 bg-neutral-700 opacity-10 rounded-full"></div>
        <div className="fixed top-10 right-5 w-4 h-5 bg-neutral-700 opacity-10 rounded-full"></div>
        
        {/* Fence elements */}
        <div className="fixed bottom-0 left-0 opacity-12">
          <div className="flex space-x-4">
            <div className="w-1 h-6 bg-neutral-600"></div>
            <div className="w-1 h-5 bg-neutral-600"></div>
            <div className="w-1 h-7 bg-neutral-600"></div>
            <div className="w-1 h-4 bg-neutral-600"></div>
            <div className="w-1 h-6 bg-neutral-600"></div>
          </div>
          <div className="w-24 h-1 bg-neutral-600 mt-1"></div>
        </div>
        
        <div className="fixed bottom-0 right-0 opacity-12">
          <div className="flex space-x-3">
            <div className="w-1 h-5 bg-neutral-600"></div>
            <div className="w-1 h-6 bg-neutral-600"></div>
            <div className="w-1 h-4 bg-neutral-600"></div>
            <div className="w-1 h-7 bg-neutral-600"></div>
          </div>
          <div className="w-18 h-1 bg-neutral-600 mt-1"></div>
        </div>
      </div>
      
      <div className="mx-auto max-w-4xl px-4 py-8 relative z-30">
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-3xl sm:text-4xl lg:text-6xl font-bold text-neutral-100 leading-tight">
            Welcome to the <span className="relative font-black">
              <span className="absolute inset-0 bg-gradient-to-r from-red-500/25 to-red-600/25 blur-lg -z-10"></span>
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">Final Boss</span>
            </span> of <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap font-black">Startup L&apos;s</span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed px-4">
            Where ideas flop, burnouts peak, and founders overshare for closure.
          </p>
          
          {/* Feature explanation with icons */}
          <div className="mb-10 max-w-2xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base text-neutral-400">
              <div className="flex items-center gap-2 group hover:text-blue-300 transition-all duration-300 cursor-default">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">💀</span>
                <strong className="text-blue-400 group-hover:text-blue-300 text-shadow-sm">Drop your L</strong>
              </div>
              <div className="hidden sm:block text-neutral-600 opacity-50">•</div>
              <div className="flex items-center gap-2 group hover:text-green-300 transition-all duration-300 cursor-default">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🔥</span>
                <strong className="text-green-400 group-hover:text-green-300 text-shadow-sm">React with pain</strong>
              </div>
              <div className="hidden sm:block text-neutral-600 opacity-50">•</div>
              <div className="flex items-center gap-2 group hover:text-purple-300 transition-all duration-300 cursor-default">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🔖</span>
                <strong className="text-purple-400 group-hover:text-purple-300 text-shadow-sm">Bookmark the mess</strong>
              </div>
            </div>
          </div>
          
          {/* Enhanced CTA Button */}
          <Link href="/create">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 sm:px-12 py-4 text-lg sm:text-xl shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40 transform hover:scale-105 transition-all duration-200 border border-red-500/20"
            >
              <span className="mr-2 text-xl">💀</span>
              <span className="hidden sm:inline">Confess Your Failure</span>
              <span className="sm:hidden">Confess</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {(user ? obituaries : obituaries.slice(0, 4)).map((obituary) => (
            <TombstoneCard key={obituary.id} obituary={obituary} commentCount={commentCounts[obituary.id] || 0} />
          ))}
        </div>

        {/* Loading indicator for infinite scroll */}
        {user && isFetching && hasMore && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-neutral-400">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              Loading more obituaries...
            </div>
          </div>
        )}

        {/* End of content indicator */}
        {user && !hasMore && obituaries.length > 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-500 text-sm">
              🪦 You&apos;ve reached the end of the graveyard. Time to create your own obituary!
            </p>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="text-center py-8">
            <p className="text-neutral-400 mb-4">
              Want to see more startup failures? Sign in to unlock infinite scroll!
            </p>
            <Link href="/login">
              <Button variant="outline">
                Sign In to Continue
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
