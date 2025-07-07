'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from '@/lib/supabase'

interface UserSettings {
  id: string
  handle: string
  email: string
  karma: number
  createdAt: string
  timezone?: string
}

const TIMEZONES = [
  { value: 'UTC', label: '🌍 UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: '🇺🇸 Eastern Time (ET)' },
  { value: 'America/Chicago', label: '🇺🇸 Central Time (CT)' },
  { value: 'America/Denver', label: '🇺🇸 Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 Pacific Time (PT)' },
  { value: 'Europe/London', label: '🇬🇧 London (GMT/BST)' },
  { value: 'Europe/Paris', label: '🇫🇷 Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: '🇩🇪 Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: '🇨🇳 Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: '🇮🇳 India (IST)' },
  { value: 'Asia/Dubai', label: '🇦🇪 Dubai (GST)' },
  { value: 'Australia/Sydney', label: '🇦🇺 Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: '🇳🇿 Auckland (NZST/NZDT)' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newHandle, setNewHandle] = useState('')
  const [selectedTimezone, setSelectedTimezone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [burnScore, setBurnScore] = useState(0)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('User')
        .select('id, handle, email, karma, createdAt, timezone')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to load settings:', error)
      } else {
        const userData = data as unknown as UserSettings
        setSettings(userData)
        setNewHandle(userData.handle)
        setSelectedTimezone(userData.timezone || '')
        
        // Calculate Burn Score
        const { data: userObits } = await supabase
          .from('Obituary')
          .select('id')
          .eq('founderId', user.id)
        
        if (userObits && userObits.length > 0) {
          const obituaryIds = userObits.map(obit => obit.id)
          
          // Get total reactions
          const { data: reactions } = await supabase
            .from('Reaction')
            .select('type')
            .in('obituaryId', obituaryIds)
            .in('type', ['🔥', '💀', '😭', '🤯', '🧠'])
          
          // Get total comments
          const { data: comments } = await supabase
            .from('Comment')
            .select('id')
            .in('obituaryId', obituaryIds)
          
          const totalReactions = reactions?.length || 0
          const totalComments = comments?.length || 0
          setBurnScore(totalReactions + totalComments)
        }
      }
      setIsLoading(false)
    }

    loadSettings()
  }, [router])

  useEffect(() => {
    // determine new signup flag from query string client-side
    const sp = new URLSearchParams(window.location.search)
    setIsNew(sp.get('new') === '1')
  }, [])

  const handleUpdateSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const updates: Partial<UserSettings> = {}
      
      if (newHandle.trim() !== settings.handle) {
        updates.handle = newHandle.trim()
      }
      
      if (selectedTimezone !== (settings.timezone || '')) {
        updates.timezone = selectedTimezone
      }

      if (Object.keys(updates).length === 0) {
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('User')
        .update(updates)
        .eq('id', settings.id)

      if (error) {
        alert(`Failed to update settings: ${error.message}`)
      } else {
        setSettings(prev => prev ? { ...prev, ...updates } : null)
        alert('Settings updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!settings) return

    const confirmed = confirm(
      'Are you sure you want to delete your account? This will permanently delete all your obituaries, comments, reactions and cannot be undone.'
    )

    if (!confirmed) return

    try {
      // Collect obituary ids authored by user
      const { data: userObits } = await supabase
        .from('Obituary')
        .select('id')
        .eq('founderId', settings.id)

      const obituaryIds = userObits?.map(o => o.id) || []

      // Delete reactions on those obits (from anyone)
      if (obituaryIds.length) {
        await supabase.from('Reaction').delete().in('obituaryId', obituaryIds)
        // Delete comments on those obits
        await supabase.from('Comment').delete().in('obituaryId', obituaryIds)
      }

      // Delete reactions made by user elsewhere
      await supabase.from('Reaction').delete().eq('userId', settings.id)

      // Delete comments authored by user elsewhere
      await supabase.from('Comment').delete().eq('authorId', settings.id)

      // Delete obituaries themselves
      if (obituaryIds.length) {
        await supabase.from('Obituary').delete().in('id', obituaryIds)
      }

      // Delete the user row from our database
      const { error: userDeleteError } = await supabase.from('User').delete().eq('id', settings.id)
      if (userDeleteError) {
        alert(`Failed to delete account: ${userDeleteError.message}`)
        return
      }

      // Delete the user from Supabase Auth
      const { error: authDeleteError } = await supabase.auth.updateUser({
        data: { deleted: true } // Mark as deleted in auth metadata
      })
      if (authDeleteError) {
        console.error('Failed to mark auth user as deleted:', authDeleteError)
      }

      await supabase.auth.signOut()
      router.push('/?goodbye=1')
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  const generateNewHandle = () => {
    const adjectives = ['Failed', 'Burned', 'Crashed', 'Doomed', 'Broken', 'Lost', 'Dead', 'Ruined']
    const nouns = ['Founder', 'Entrepreneur', 'Builder', 'Dreamer', 'Visionary', 'Creator', 'Starter']
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 999) + 1
    setNewHandle(`${adjective}${noun}${number}`)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center">
          <p className="text-neutral-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Settings Not Found</h2>
          <p className="text-neutral-400">Unable to load your settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/profile" className="text-neutral-400 hover:text-neutral-300 text-sm">
          ← Back to Profile
        </Link>
        <h1 className="text-3xl font-bold text-neutral-100 mt-2">Account Settings</h1>
        <p className="text-neutral-400">Manage your anonymous identity and preferences</p>
      </div>

      {isNew && (
        <Card className="border-orange-800 bg-orange-900/30 mb-6 animate-in fade-in zoom-in-50">
          <CardContent className="py-6 text-center">
            <h2 className="text-xl font-bold text-orange-300 mb-2">Welcome to KilledIt! 🎉</h2>
            <p className="text-neutral-300 mb-1">Choose a unique anonymous handle and set your timezone.</p>
            <p className="text-neutral-400 text-sm">You can change these later in Settings.</p>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card className="border-neutral-800 bg-neutral-900 mb-6">
        <CardHeader>
          <CardTitle className="text-neutral-100">Anonymous Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-neutral-800 text-neutral-300 text-2xl">
                💀
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-neutral-300 font-medium">@{settings.handle}</p>
              <p className="text-sm text-neutral-500">Your anonymous handle</p>
            </div>
          </div>

          <Separator />

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Change Handle
            </label>
            <div className="flex gap-2">
              <Input
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="Enter new handle"
                className="bg-neutral-800 border-neutral-700 text-neutral-100"
              />
              <Button 
                variant="outline" 
                onClick={generateNewHandle}
                className="whitespace-nowrap"
              >
                🎲 Random
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Choose a new anonymous handle. This is how others will see you.
            </p>
          </div>

          <Separator />

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Timezone
            </label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {TIMEZONES.map((tz) => (
                  <SelectItem 
                    key={tz.value} 
                    value={tz.value}
                    className="text-neutral-100 focus:bg-neutral-700"
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">
              Post timestamps will be shown in your selected timezone.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleUpdateSettings}
              disabled={!newHandle.trim() || (newHandle === settings.handle && selectedTimezone === (settings.timezone || '')) || isSaving}
            >
              {isSaving ? 'Saving...' : 'Update Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-neutral-800 bg-neutral-900 mb-6">
        <CardHeader>
          <CardTitle className="text-neutral-100">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Email (Private)
            </label>
            <p className="text-neutral-400 text-sm">{settings.email}</p>
            <p className="text-xs text-neutral-500">
              Used for login only. Never shown publicly.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Member Since
            </label>
            <p className="text-neutral-400 text-sm">
              {new Date(settings.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              🔥 Burn Score
            </label>
            <p className="text-neutral-400 text-sm">{burnScore}</p>
            <p className="text-xs text-neutral-500">
              Total emoji reactions + comments on your obituaries
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-green-800 bg-green-950/20 mb-6">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            🔒 Privacy Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-300">
          <ul className="space-y-2">
            <li>• Your real name and photo are never stored or displayed</li>
            <li>• Only your anonymous handle is visible to other users</li>
            <li>• Your email is used only for authentication</li>
            <li>• All posts are linked to your anonymous identity</li>
          </ul>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-800 bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-neutral-100 font-medium mb-2">Delete Account</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Permanently delete your account and all your obituaries. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Account Forever
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 