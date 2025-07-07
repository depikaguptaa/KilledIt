import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { obituaryService } from '@/lib/supabase'

interface Props {
  commentId: string
  obituaryId: string
  canDelete: boolean
  onDeleted: () => void
}

export function CommentActionMenu({ commentId, obituaryId, canDelete, onDeleted }: Props) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/obituary/${obituaryId}#${commentId}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check this comment on KilledIt',
          url: shareUrl
        })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch {
        alert('Unable to copy, please copy manually.')
      }
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm('Delete this comment?')
    if (!confirmed) return
    try {
      await obituaryService.deleteComment(commentId)
      onDeleted()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete comment'
      alert(msg)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-200">
          ⋯
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 bg-neutral-800 text-neutral-200 border-neutral-700">
        <DropdownMenuItem onSelect={handleShare}>Share</DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem onSelect={handleDelete} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 