'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { obituaryService, supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface InteractionButtonsProps {
  obituaryId: string
  commentCount?: number
  showComments?: boolean
}

const EMOJI_REACTIONS = [
  { emoji: '🔥', tooltip: 'Hot mess', description: 'Pure drama. What a way to die.' },
  { emoji: '💀', tooltip: 'RIP, brutal end', description: 'Fatal. Iconic. Legendary death.' },
  { emoji: '😭', tooltip: 'Ugh, so relatable', description: 'Been there. Done that. Felt that.' },
  { emoji: '🤯', tooltip: 'WTF happened here?', description: 'Chaos, confusion, carnage.' },
  { emoji: '🧠', tooltip: 'Lesson learned', description: 'Painful but enlightening, babe.' }
]

export function InteractionButtons({ 
  obituaryId, 
  commentCount = 0,
  showComments = true
}: InteractionButtonsProps) {
  const router = useRouter()
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
  const [userReactions, setUserReactions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadReactions = async () => {
      try {
        // Wait for session to be restored
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          return
        }
        
        setUser(session?.user || null)
        
        // Load emoji reactions
        const { counts, userReactions: userEmojis } = await obituaryService.getEmojiReactions(obituaryId)
        setReactionCounts(counts)
        setUserReactions(userEmojis)
      } catch (error) {
        console.error('Error in loadReactions:', error)
      }
    }
    loadReactions()
  }, [obituaryId])

  const handleEmojiReaction = async (emoji: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const isNowReacted = await obituaryService.toggleEmojiReaction(obituaryId, emoji)
      
      // Update local state
      setReactionCounts(prev => ({
        ...prev,
        [emoji]: isNowReacted ? (prev[emoji] || 0) + 1 : Math.max(0, (prev[emoji] || 0) - 1)
      }))
      
      setUserReactions(prev => 
        isNowReacted 
          ? [...prev, emoji]
          : prev.filter(e => e !== emoji)
      )
    } catch (error) {
      console.error('Failed to toggle emoji reaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComments = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/obituary/${obituaryId}#comments`)
  }

  return (
    <div className="flex items-center w-full gap-2 sm:gap-3 text-sm flex-wrap">
      {/* Emoji bar left, comment counter right */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {EMOJI_REACTIONS.map(({ emoji, tooltip }) => {
          const count = reactionCounts[emoji] || 0
          const isReacted = userReactions.includes(emoji)
          
          return (
            <Button
              key={emoji}
              variant="outline"
              size="sm"
              className={`gap-1 text-xs sm:text-sm px-2 sm:px-3 h-8 transition-all duration-200 shadow-sm hover:shadow-md ${
                isReacted 
                  ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-600 text-blue-400 shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-105' 
                  : 'hover:bg-gradient-to-br hover:from-neutral-800 hover:to-neutral-850 hover:scale-105 hover:shadow-md'
              }`}
              onClick={(e) => handleEmojiReaction(emoji, e)}
              disabled={isLoading}
              title={tooltip}
            >
              <span className="text-base transition-transform duration-200 hover:scale-110">{emoji}</span>
              {count > 0 && <span className="text-xs font-medium">{count}</span>}
            </Button>
          )
        })}
      </div>
      
      {/* Comment Counter aligned to the right */}
      {showComments && (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto gap-1 sm:gap-2 text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 hover:bg-gradient-to-br hover:from-neutral-800 hover:to-neutral-850"
          onClick={handleComments}
          title="View comments and pay your respects"
        >
          <span className="text-base transition-transform duration-200 hover:scale-110">💬</span> 
          <span className="font-medium">{commentCount}</span>
        </Button>
      )}
    </div>
  )
} 