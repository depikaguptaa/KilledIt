'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { InteractionButtons } from '@/components/InteractionButtons'
import { supabase, Obituary, obituaryService, ensureUserRecord } from '@/lib/supabase'

interface UserProfile {
  id: string
  handle: string
  email: string
  karma: number
  createdAt: string
  obits: Obituary[]
}

const createdAtIsRecent = (ts: string) => Date.now() - new Date(ts).getTime() < 5 * 60 * 1000 // 5 minutes

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
  const [commentLikeCount, setCommentLikeCount] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Ensure a user record exists, and if one was just created,
      // redirect to the settings page to choose a handle.
      const created = await ensureUserRecord(user.id, user.email || undefined)
      if (created) {
        router.push('/profile/settings?new=1')
        return
      }
      
      const { data, error } = await supabase
        .from('User')
        .select(`
          id,
          handle,
          email,
          karma,
          createdAt,
          obits:Obituary (
            id,
            title,
            blurb,
            causes,
            upvotes,
            roastScore,
            createdAt
          )
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to load profile:', error)
      } else {
        const profileData = data as unknown as UserProfile
        // If user exists but looks new (0 obits) -> send to onboarding once
        if (profileData.obits.length === 0 && createdAtIsRecent(profileData.createdAt)) {
          router.push('/profile/settings?new=1')
          return
        }
        setProfile(profileData)
        
        // Get comment counts and reaction counts for all obituaries
        if (profileData.obits.length > 0) {
          const obituaryIds = profileData.obits.map(obit => obit.id)
          
          // Get comment counts
          const counts = await obituaryService.getCommentCounts(obituaryIds)
          setCommentCounts(counts)
          
          // Get reaction counts for each obituary
          const reactionCountsMap: Record<string, number> = {}
          for (const obituaryId of obituaryIds) {
            const { data: reactions } = await supabase
              .from('Reaction')
              .select('type')
              .eq('obituaryId', obituaryId)
              .in('type', ['🔥', '💀', '😭', '🤯', '🧠'])
            
            reactionCountsMap[obituaryId] = reactions?.length || 0
          }
          setReactionCounts(reactionCountsMap)

          /* ----- Count ❤️ likes on any comment under the user's obituaries ----- */
          // Get all comment ids for these obituaries
          const { data: commentRows } = await supabase
            .from('Comment')
            .select('id')
            .in('obituaryId', obituaryIds)

          const commentIds = (commentRows || []).map(c => c.id)

          let totalLikes = 0
          if (commentIds.length > 0) {
            const { data: likeRows } = await supabase
              .from('Reaction')
              .select('id')
              .eq('type', '❤️')
              .in('commentId', commentIds)

            totalLikes = likeRows?.length || 0
          }
          setCommentLikeCount(totalLikes)
        }
      }
      setIsLoading(false)
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCardClick = (obituaryId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a[href]')) {
      return
    }
    router.push(`/obituary/${obituaryId}`)
  }

  // Calculate Burn Score: total emoji reactions + comments on user's obituaries
  const calculateBurnScore = () => {
    if (!profile) return 0
    
    const totalReactions = profile.obits.reduce((sum, obit) => 
      sum + (reactionCounts[obit.id] || 0), 0
    )
    const totalComments = profile.obits.reduce((sum, obit) => 
      sum + (commentCounts[obit.id] || 0), 0
    )
    
    return totalReactions + totalComments + commentLikeCount
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <p className="text-neutral-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Profile Not Found</h2>
          <p className="text-neutral-400">Unable to load your profile.</p>
        </div>
      </div>
    )
  }

  const memberSince = formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <Card className="border-neutral-800 bg-neutral-900 mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-neutral-800 text-neutral-300 text-2xl">
                  💀
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">@{profile.handle}</h1>
                <p className="text-neutral-400">Anonymous entrepreneur</p>
                <p className="text-sm text-neutral-500">Member {memberSince}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile/settings">
                <Button variant="outline" size="sm">Settings</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-100">{profile.obits.length}</div>
              <div className="text-sm text-neutral-400">Obituaries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                🔥 {calculateBurnScore()}
              </div>
              <div className="text-sm text-neutral-400">Burn Score</div>
              <div className="text-xs text-neutral-500 mt-1">
                Total reactions + comments
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {profile.obits.reduce((sum, obit) => sum + (commentCounts[obit.id] || 0), 0)}
              </div>
              <div className="text-sm text-neutral-400">Total Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Obituaries */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-neutral-100">Your Obituaries</h2>
          <Link href="/create">
            <Button>Write New Obituary</Button>
          </Link>
        </div>

        {profile.obits.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🪦</div>
              <h3 className="text-xl font-bold text-neutral-300 mb-2">No obituaries yet</h3>
              <p className="text-neutral-400 mb-4">
                Ready to confess your first startup failure?
              </p>
              <Link href="/create">
                <Button>Write Your First Obituary</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {profile.obits
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((obit) => (
                <Card 
                  key={obit.id} 
                  className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  onClick={(e) => handleCardClick(obit.id, e)}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-neutral-100">
                        <span className="hover:text-red-400 transition-colors">
                          RIP {obit.title} 💀
                        </span>
                      </CardTitle>
                      <span className="text-sm text-neutral-500">
                        {formatDistanceToNow(new Date(obit.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400">{obit.blurb}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {obit.causes.map((cause, index) => (
                        <Badge 
                          key={index} 
                          variant={cause.includes('terrible') || cause.includes('bad') ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {cause}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <InteractionButtons
                      obituaryId={obit.id}
                      showComments={true}
                      commentCount={commentCounts[obit.id] || 0}
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
} 