'use client'

import { Button } from "@/components/ui/button"

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string
}

export function ShareButton({ title, text, url, className = "" }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const shareUrl = url || window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: shareUrl
        })
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy link:', error)
        alert('Failed to copy link. Please copy manually: ' + shareUrl)
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleShare}
      title="Share this obituary"
    >
      🔗 Share
    </Button>
  )
} 