import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { obituaryService } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Obituary } from '@/lib/supabase'

interface Props {
  obituary: Obituary
  isOwner: boolean
  initiallySaved?: boolean
}

export function ObitActionMenu({ obituary, isOwner, initiallySaved = false }: Props) {
  const router = useRouter()
  const [isSaved, setIsSaved] = React.useState(initiallySaved)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/obituary/${obituary.id}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RIP ${obituary.title} - KilledIt`,
          text: obituary.blurb,
          url: shareUrl
        })
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch {
        alert('Unable to copy, please copy manually.')
      }
    }
  }

  const toggleSave = async () => {
    try {
      const newState = await obituaryService.toggleSave(obituary.id)
      setIsSaved(newState)
    } catch {
      alert('Failed to toggle save')
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm('Delete this obituary? This cannot be undone.')
    if (!confirmed) return
    try {
      await obituaryService.deleteObituary(obituary.id)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete'
      alert(msg)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-200">
          ⋯
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-neutral-800 text-neutral-200 border-neutral-700">
        <DropdownMenuItem onSelect={handleShare}>
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleSave}>
          {isSaved ? 'Unsave' : 'Save'}
        </DropdownMenuItem>
        {isOwner && (
          <DropdownMenuItem onSelect={handleDelete} className="text-red-400 focus:text-red-400">
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 