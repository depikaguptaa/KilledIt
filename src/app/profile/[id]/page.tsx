'use client'

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { TimeDisplay } from '@/components/TimeDisplay'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

interface UserProfileData {
  id: string
  handle: string
  karma: number
  createdAt: string
  obits: Array<{
    id: string
    title: string
    blurb: string
    causes: string[]
    upvotes: number
    roastScore: number
    createdAt: string
  }>
}

async function getUserProfile(id: string): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('User')
    .select(`
      id,
      handle,
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
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as UserProfileData
}

export default function UserProfilePage({ params }: PageProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileId, setProfileId] = useState<string>('')
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadProfile = async () => {
      const { id } = await params
      setProfileId(id)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      
      // Get profile data
      const profileData = await getUserProfile(id)
      setProfile(profileData)
      
      // Get comment counts and reaction counts for all obituaries
      if (profileData?.obits.length) {
        const obituaryIds = profileData.obits.map(obit => obit.id)
        
        // Get comment counts
        const { data: comments } = await supabase
          .from('Comment')
          .select('obituaryId')
          .in('obituaryId', obituaryIds)
        
        const commentCountsMap: Record<string, number> = {}
        obituaryIds.forEach(id => commentCountsMap[id] = 0)
        comments?.forEach(comment => {
          commentCountsMap[comment.obituaryId] = (commentCountsMap[comment.obituaryId] || 0) + 1
        })
        setCommentCounts(commentCountsMap)
        
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
      }
      
      setIsLoading(false)
    }
    
    loadProfile()
  }, [params])

  // Calculate Burn Score: total emoji reactions + comments on user's obituaries
  const calculateBurnScore = () => {
    if (!profile) return 0
    
    const totalReactions = profile.obits.reduce((sum, obit) => 
      sum + (reactionCounts[obit.id] || 0), 0
    )
    const totalComments = profile.obits.reduce((sum, obit) => 
      sum + (commentCounts[obit.id] || 0), 0
    )
    
    return totalReactions + totalComments
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
    notFound()
  }

  const isOwnProfile = currentUserId === profileId

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <Card className="border-neutral-800 bg-neutral-900 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-neutral-800 text-neutral-300 text-2xl">
                  💀
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">@{profile.handle}</h1>
                <p className="text-neutral-400">Anonymous entrepreneur</p>
                <p className="text-sm text-neutral-500">
                  Member <TimeDisplay timestamp={profile.createdAt} />
                </p>
              </div>
            </div>
            {isOwnProfile && (
              <Link href="/profile/settings">
                <Button variant="outline" size="sm">
                  ⚙️ Settings
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
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
              <div className="text-2xl font-bold text-neutral-300">
                {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: false })}
              </div>
              <div className="text-sm text-neutral-400">Member Since</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Obituaries */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-neutral-100 mb-6">
          {profile.handle}&apos;s Obituaries
        </h2>

        {profile.obits.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🪦</div>
              <h3 className="text-xl font-bold text-neutral-300 mb-2">No obituaries yet</h3>
              <p className="text-neutral-400">
                This entrepreneur hasn&apos;t confessed any failures yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {profile.obits
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((obit) => (
                <Link key={obit.id} href={`/obituary/${obit.id}`} className="block">
                  <Card className="border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-neutral-100 hover:text-red-400 transition-colors">
                          RIP {obit.title} 💀
                        </CardTitle>
                        <TimeDisplay 
                          timestamp={obit.createdAt}
                          className="text-sm text-neutral-500"
                        />
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
                      <div className="flex items-center gap-6 text-sm text-neutral-500">
                        <span className="flex items-center gap-1 text-neutral-400">
                          👁️ View Details & React
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  )
} 