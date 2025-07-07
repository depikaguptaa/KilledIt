'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from '@/lib/supabase'
import { InteractionButtons } from '@/components/InteractionButtons'
import { TimeDisplay } from '@/components/TimeDisplay'
import { CommentSection } from '@/components/CommentSection'
import Link from 'next/link'
import { ObitActionMenu } from '@/components/ObitActionMenu'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ObituaryWithFounder {
  id: string
  title: string
  blurb: string
  causes: string[]
  storyMd: string
  mediaUrls: string[]
  upvotes: number
  roastScore: number
  founderId: string
  createdAt: string
  founder: {
    id: string
    handle: string
    avatarUrl: string | null
  }
}

export default function ObituaryPage({ params }: PageProps) {
  const router = useRouter()
  const [obituary, setObituary] = useState<ObituaryWithFounder | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializePage = async () => {
      // Get the obituary ID from params
      const { id } = await params

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }

      // Fetch obituary data
      const { data, error } = await supabase
        .from('Obituary')
        .select(`
          id,
          title,
          blurb,
          causes,
          storyMd,
          mediaUrls,
          upvotes,
          roastScore,
          founderId,
          createdAt,
          founder:User (
            id,
            handle,
            avatarUrl
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        notFound()
        return
      }

      setObituary(data as unknown as ObituaryWithFounder)
      setIsLoading(false)
    }

    initializePage()
  }, [params, router])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <p className="text-neutral-400">Loading obituary...</p>
        </div>
      </div>
    )
  }

  if (!obituary) {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card className="border-neutral-800 bg-neutral-900 relative">
        {/* Action menu top-right */}
        <div className="absolute top-4 right-4 z-10">
          <ObitActionMenu obituary={obituary} isOwner={currentUserId===obituary.founder.id} />
        </div>
        
        <CardHeader className="pr-20">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href={`/profile/${obituary.founder.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-neutral-800 text-neutral-300 text-lg">
                  💀
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-neutral-300 hover:text-neutral-100">@{obituary.founder.handle}</span>
                <span className="text-sm text-neutral-500">
                  Posted <TimeDisplay timestamp={obituary.createdAt} />
                </span>
              </div>
            </Link>
          </div>
          
          <CardTitle className="text-3xl font-bold text-neutral-100 mb-4">
            RIP {obituary.title} 💀
          </CardTitle>
          
          <p className="text-lg text-neutral-400 leading-relaxed mb-4">
            {obituary.blurb}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {obituary.causes.map((cause: string, index: number) => (
              <Badge 
                key={index} 
                variant={cause.includes('terrible') || cause.includes('bad') ? 'destructive' : 'secondary'}
                className="text-sm"
              >
                {cause}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <Separator className="mb-6" />
          
          {obituary.mediaUrls.length > 0 && (
            <div className="mb-6 space-y-4">
              {obituary.mediaUrls.map((url, index) => (
                <div key={index}>
                  {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                    <video
                      src={url}
                      controls
                      className="rounded-lg max-h-96 w-full object-cover"
                    />
                  ) : (
                    <Image 
                      src={url} 
                      alt={`${obituary.title} media ${index + 1}`}
                      width={800}
                      height={400}
                      className="rounded-lg max-h-96 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="prose prose-invert prose-lg max-w-none mb-6">
            <ReactMarkdown>{obituary.storyMd}</ReactMarkdown>
          </div>
          
          <div className="flex items-center gap-6 text-sm mb-6">
            <InteractionButtons
              obituaryId={obituary.id}
              showComments={false}
            />
          </div>
          
          <Separator className="my-8" />
          
          <div id="comments">
            <CommentSection obituaryId={obituary.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 