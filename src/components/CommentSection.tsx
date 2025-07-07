'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { supabase, obituaryService } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { TimeDisplay } from './TimeDisplay'
import { GiphyPicker } from './GiphyPicker'
import Link from 'next/link'
import { CommentActionMenu } from './CommentActionMenu'

interface Comment {
  id: string
  content: string
  authorId: string
  createdAt: string
  parentId?: string | null
  mediaUrls?: string[]
  author: {
    id: string
    handle: string
  }
}

interface CommentSectionProps {
  obituaryId: string
}

export function CommentSection({ obituaryId }: CommentSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<File[]>([])
  const [mediaPreview, setMediaPreview] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [selectedGifs, setSelectedGifs] = useState<string[]>([])
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [userLikedIds, setUserLikedIds] = useState<string[]>([])
  const [replyParentId, setReplyParentId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const loadUserAndComments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      try {
        const commentsData = await obituaryService.getComments(obituaryId)
        setComments(commentsData as unknown as Comment[])
        
        // Load like counts
        const ids = (commentsData as unknown as Comment[]).map(c => c.id)
        const { counts, userLikes } = await obituaryService.getCommentLikeCounts(ids)
        setLikeCounts(counts)
        setUserLikedIds(userLikes)
      } catch (error) {
        console.error('Failed to load comments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUserAndComments()
  }, [obituaryId])

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validFiles = files.filter(file => validTypes.includes(file.type))
    
    if (validFiles.length !== files.length) {
      alert('Only JPEG, PNG, GIF, and WebP images are allowed')
      return
    }

    setSelectedMedia(validFiles)
    
    // Create preview URLs
    const previewUrls = validFiles.map(file => URL.createObjectURL(file))
    setMediaPreview(previewUrls)
  }

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index)
    const newPreviews = mediaPreview.filter((_, i) => i !== index)
    
    // Clean up old URL
    URL.revokeObjectURL(mediaPreview[index])
    
    setSelectedMedia(newMedia)
    setMediaPreview(newPreviews)
  }

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGifs(prev => [...prev, gifUrl])
    setShowGiphyPicker(false)
  }

  const removeGif = (index: number) => {
    setSelectedGifs(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleLike = async (commentId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const isNowLiked = await obituaryService.toggleCommentLike(obituaryId, commentId)
      setLikeCounts(prev => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] || 0) + (isNowLiked ? 1 : -1))
      }))
      setUserLikedIds(prev => isNowLiked ? [...prev, commentId] : prev.filter(id => id !== commentId))
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleReply = (comment: Comment) => {
    setReplyParentId(comment.id)
    setNewComment(`@${comment.author.handle} `)
    textareaRef.current?.focus()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      router.push('/login')
      return
    }

    if (!newComment.trim() && selectedMedia.length === 0 && selectedGifs.length === 0) return

    setIsSubmitting(true)
    try {
      let mediaUrls: string[] = []
      
      // For now, just post text comments with media as attachment indicators
      // TODO: Extend Comment table to support mediaUrls in future
      if (selectedMedia.length > 0) {
        setIsUploadingMedia(true)
        try {
          const fileList = new DataTransfer()
          selectedMedia.forEach(file => fileList.items.add(file))
          mediaUrls = await obituaryService.uploadMedia(fileList.files, 'startup-logos')
          // Media uploaded successfully, add indicator to comment
        } catch (error) {
          console.error('Failed to upload media:', error)
          alert('Failed to upload media. Comment will be posted without media.')
        } finally {
          setIsUploadingMedia(false)
        }
      }

      // Add GIF URLs to media URLs
      mediaUrls = [...mediaUrls, ...selectedGifs]
      
      const comment = await obituaryService.createComment(
        obituaryId, 
        newComment.trim() || '', 
        mediaUrls,
        replyParentId
      )
      
      setComments(prev => [...prev, comment as unknown as Comment])
      setNewComment('')
      setReplyParentId(null)
      setSelectedMedia([])
      setMediaPreview([])
      setSelectedGifs([])
      setShowGiphyPicker(false)
      
      // Clean up preview URLs
      mediaPreview.forEach(url => URL.revokeObjectURL(url))
      
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-neutral-100">Comments</h3>
        <div className="text-center py-4">
          <p className="text-neutral-400">Loading comments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="comments">
      <h3 className="text-xl font-bold text-neutral-100">Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-neutral-800 text-neutral-300">
              💀
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={user ? "Pay your respects or share your thoughts..." : "Sign in to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user || isSubmitting}
              className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 resize-none"
              rows={3}
              ref={textareaRef}
            />
            
            {/* Media and Submit Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Media Upload */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-2 text-neutral-400 hover:text-neutral-200"
                  disabled={!user || isUploadingMedia}
                >
                  📷
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.gif"
                  multiple
                  onChange={handleMediaSelect}
                  className="hidden"
                />

                {/* GIPHY Picker */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGiphyPicker(!showGiphyPicker)}
                    className="h-8 px-2 text-neutral-400 hover:text-neutral-200"
                    disabled={!user}
                  >
                    🎬
                  </Button>
                  <GiphyPicker
                    isOpen={showGiphyPicker}
                    onSelect={handleGifSelect}
                    onClose={() => setShowGiphyPicker(false)}
                  />
                </div>

                {/* Character Count */}
                <span className="text-xs text-neutral-500">
                  {newComment.length}/500 characters
                </span>
              </div>

              <Button 
                type="submit" 
                size="sm"
                disabled={!user || (!newComment.trim() && selectedMedia.length === 0 && selectedGifs.length === 0) || isSubmitting || newComment.length > 500}
                className="bg-neutral-200 hover:bg-neutral-100 text-neutral-900 font-medium"
              >
                {isSubmitting ? (isUploadingMedia ? 'Uploading...' : 'Posting...') : 'Post Comment'}
              </Button>
            </div>
            
            {/* Media Preview */}
            {mediaPreview.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaPreview.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border border-neutral-600"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* GIF Preview */}
            {selectedGifs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGifs.map((gifUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={gifUrl}
                      alt={`GIF ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border border-neutral-600"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGif(index)}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>

      <Separator />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🪦</div>
          <p className="text-neutral-400">No comments yet. Be the first to pay your respects.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.filter(c => !c.parentId).map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Root Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-neutral-800 text-neutral-300">
                    💀
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      href={`/profile/${comment.author.id}`}
                      className="text-sm font-medium text-neutral-300 hover:text-neutral-100"
                    >
                      @{comment.author.handle}
                    </Link>
                    <TimeDisplay 
                      timestamp={comment.createdAt}
                      className="text-xs text-neutral-500"
                    />
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                  
                  {comment.mediaUrls && comment.mediaUrls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.mediaUrls.map((url, mediaIndex) => (
                        <img
                          key={mediaIndex}
                          src={url}
                          alt={`Comment media ${mediaIndex + 1}`}
                          className="max-w-32 max-h-32 object-cover rounded border border-neutral-600 cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions: like & reply */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                    <button
                      className={`flex items-center gap-1 hover:text-red-400 transition-colors ${userLikedIds.includes(comment.id) ? 'text-red-400' : ''}`}
                      onClick={(e) => {e.preventDefault(); handleToggleLike(comment.id)}}
                    >
                      ❤️ {likeCounts[comment.id] || 0}
                    </button>
                    <button
                      className="hover:text-neutral-300 transition-colors"
                      onClick={(e) => {e.preventDefault(); handleReply(comment)}}
                    >
                      Reply
                    </button>
                    <div className="ml-auto">
                      <CommentActionMenu
                        commentId={comment.id}
                        obituaryId={obituaryId}
                        canDelete={user?.id === comment.authorId}
                        onDeleted={() => setComments(prev => prev.filter(c => c.id !== comment.id))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comments.filter(r => r.parentId === comment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 ml-8 mt-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-neutral-800 text-neutral-300">
                      💀
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        href={`/profile/${reply.author.id}`}
                        className="text-sm font-medium text-neutral-300 hover:text-neutral-100"
                      >
                        @{reply.author.handle}
                      </Link>
                      <TimeDisplay 
                        timestamp={reply.createdAt}
                        className="text-xs text-neutral-500"
                      />
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {reply.content}
                    </p>

                    {reply.mediaUrls && reply.mediaUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {reply.mediaUrls.map((url, mediaIndex) => (
                          <img
                            key={mediaIndex}
                            src={url}
                            alt={`Comment media ${mediaIndex + 1}`}
                            className="max-w-32 max-h-32 object-cover rounded border border-neutral-600 cursor-pointer"
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Reply actions */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      <button
                        className={`flex items-center gap-1 hover:text-red-400 transition-colors ${userLikedIds.includes(reply.id) ? 'text-red-400' : ''}`}
                        onClick={(e) => {e.preventDefault(); handleToggleLike(reply.id)}}
                      >
                        ❤️ {likeCounts[reply.id] || 0}
                      </button>
                      <button
                        className="hover:text-neutral-300 transition-colors"
                        onClick={(e) => {e.preventDefault(); handleReply(reply)}}
                      >
                        Reply
                      </button>
                      <div className="ml-auto">
                        <CommentActionMenu
                          commentId={reply.id}
                          obituaryId={obituaryId}
                          canDelete={user?.id === reply.authorId}
                          onDeleted={() => setComments(prev => prev.filter(c => c.id !== reply.id))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 