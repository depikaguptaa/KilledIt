'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Obituary, supabase } from '@/lib/supabase'
import { InteractionButtons } from './InteractionButtons'
import { TimeDisplay } from './TimeDisplay'
import { User } from '@supabase/supabase-js'
import { ObitActionMenu } from './ObitActionMenu'

interface TombstoneCardProps {
  obituary: Obituary
  commentCount?: number
}

export function TombstoneCard({ obituary, commentCount = 0 }: TombstoneCardProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button') || target.closest('video')) {
      return
    }
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page
      window.location.href = '/login'
      return
    }
    
    // Navigate to obituary page
    window.location.href = `/obituary/${obituary.id}`
  }

  return (
    <Card 
      className="border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 hover:border-neutral-700 transition-all duration-300 cursor-pointer relative group shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-neutral-850 hover:to-neutral-900"
      onClick={handleCardClick}
    >
      {/* Action menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ObitActionMenu obituary={obituary} isOwner={user?.id===obituary.founder.id} />
      </div>
      
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href={`/profile/${obituary.founder.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8 shadow-md shadow-black/30">
              <AvatarFallback className="bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300">
                💀
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm text-neutral-300 hover:text-neutral-100 transition-colors">@{obituary.founder.handle}</span>
              <TimeDisplay 
                timestamp={obituary.createdAt} 
                className="text-xs text-neutral-500"
              />
            </div>
          </Link>
        </div>
        
        <CardTitle className="flex items-center gap-2 text-neutral-100">
          <span className="hover:text-red-400 transition-colors">
            RIP {obituary.title} 💀
          </span>
        </CardTitle>
        
        <p className="text-sm text-neutral-400 leading-relaxed">
          {obituary.blurb}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {obituary.causes.map((cause, index) => (
            <Badge 
              key={index} 
              variant={cause.includes('terrible') || cause.includes('bad') ? 'destructive' : 'secondary'}
              className="text-xs shadow-sm hover:shadow-md transition-shadow"
            >
              {cause}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {obituary.mediaUrls.length > 0 && (
          <div className="mb-4 space-y-2">
            {obituary.mediaUrls.slice(0, 3).map((url, index) => (
              <div key={index} className="shadow-lg shadow-black/20 rounded-lg overflow-hidden">
                {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                  <video
                    src={url}
                    controls
                    className="max-h-64 w-full object-cover"
                  />
                ) : (
                  <img 
                    src={url} 
                    alt={`${obituary.title} media ${index + 1}`}
                    className="max-h-64 w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
            ))}
            {obituary.mediaUrls.length > 3 && (
              <p className="text-xs text-neutral-500 text-center">
                +{obituary.mediaUrls.length - 3} more media files
              </p>
            )}
          </div>
        )}
        
        <Separator className="mb-4 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
        <InteractionButtons
          obituaryId={obituary.id}
          commentCount={commentCount}
          showComments={true}
        />
      </CardContent>
    </Card>
  )
} 