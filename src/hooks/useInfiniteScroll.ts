import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number // Distance from bottom to trigger load (in pixels)
}

interface UseInfiniteScrollReturn {
  isFetching: boolean
  setIsFetching: (fetching: boolean) => void
}

export function useInfiniteScroll(
  fetchMore: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 100 } = options
  const [isFetching, setIsFetching] = useState(false)

  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
    const clientHeight = document.documentElement.clientHeight || window.innerHeight
    
    // Check if user is near the bottom
    if (scrollHeight - scrollTop - clientHeight < threshold && !isFetching) {
      setIsFetching(true)
    }
  }, [threshold, isFetching])

  useEffect(() => {
    if (!isFetching) return

    const loadMore = async () => {
      try {
        await fetchMore()
      } catch (error) {
        console.error('Error fetching more data:', error)
      } finally {
        setIsFetching(false)
      }
    }

    loadMore()
  }, [isFetching, fetchMore])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { isFetching, setIsFetching }
} 