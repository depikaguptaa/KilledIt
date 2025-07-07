import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Anonymous handle generation
const ADJECTIVES = [
  'Failed', 'Burned', 'Crashed', 'Doomed', 'Broken', 'Lost', 'Dead', 'Ruined',
  'Fallen', 'Wrecked', 'Sunk', 'Busted', 'Tanked', 'Bombed', 'Folded', 'Ghosted'
]

const NOUNS = [
  'Founder', 'Entrepreneur', 'Builder', 'Dreamer', 'Visionary', 'Creator', 'Starter',
  'Hustler', 'Pioneer', 'Innovator', 'Disruptor', 'Maker', 'Idealist', 'Optimist'
]

export function generateAnonymousHandle(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 999) + 1
  return `${adjective}${noun}${number}`
}

// Ensure a public.User row exists for the authenticated user.
export async function ensureUserRecord(userId?: string, email?: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  const authUser = session?.user
  const id = userId || authUser?.id
  if (!id) return false

  console.log('Ensuring user record for:', { id, email: email || authUser?.email })

  // Check if a user record already exists
  const { data: existingUser, error: selectError } = await supabase
    .from('User')
    .select('id, handle')
    .eq('id', id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking for user:', selectError)
    return false
  }

  // If user exists and has a handle, we're done.
  if (existingUser?.handle) {
    console.log('User record already exists and is valid:', existingUser)
    return false
  }
  
  // If user was previously "deleted", clear the flag now.
  if (authUser?.user_metadata?.deleted) {
    console.log('User was previously deleted, resetting...')
    const { error: updateError } = await supabase.auth.updateUser({
      data: { deleted: null }
    })
    if (updateError) {
      console.error('Failed to clear deleted flag:', updateError)
      // Not returning false, as we can still try to upsert the user record.
    }
  }

  console.log('User record is missing or incomplete. Creating/updating now.')

  // Upsert the user record.
  // If the user doesn't exist, it creates one with a new handle.
  // If the user exists but has no handle, it generates one.
  const { data, error } = await supabase
    .from('User')
    .upsert({
      id,
      email: email || authUser?.email || '',
      // Only set handle if it's null, using the DB function
      handle: existingUser?.handle || generateAnonymousHandle(),
      avatarUrl: null,
      karma: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to upsert user record:', error)
    // Attempt to generate a handle on the client as a fallback
    if (error.message.includes('null value in column "handle"')) {
       const { data: retryData, error: retryError } = await supabase
         .from('User')
         .upsert({ id, email: email || authUser?.email || '', handle: generateAnonymousHandle() })
         .select().single()

       if (retryError) {
         console.error('Fallback user upsert failed:', retryError)
         return false
       }
       console.log('Successfully created user with fallback handle:', retryData)
       return true
    }
    return false
  }

  console.log('Successfully upserted user record:', data)
  return true
}

// Database types
export interface Obituary {
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

export interface CreateObituaryData {
  title: string
  blurb: string
  causes: string[]
  storyMd: string
  mediaUrls: string[]
}

// Database operations
export const obituaryService = {
  async getObituaries(limit = 20, offset = 0) {
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
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as unknown as Obituary[]
  },

  async getObituariesCount() {
    const { count, error } = await supabase
      .from('Obituary')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  },

  async createObituary(data: CreateObituaryData) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    // Check if user exists in our User table, if not create them
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // Create anonymous user record
      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: user.id,
          email: user.email || '',
          handle: generateAnonymousHandle(),
          avatarUrl: null
        })

      if (userError) {
        console.error('Failed to create user:', userError)
        throw new Error(`Failed to create user: ${userError.message}`)
      }
    }

    // Generate UUID for obituary
    const obituaryId = crypto.randomUUID()
    
    const { data: obituary, error } = await supabase
      .from('Obituary')
      .insert({
        id: obituaryId,
        ...data,
        founderId: user.id
      })
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
      .single()

    if (error) {
      console.error('Failed to create obituary:', error)
      throw new Error(`Failed to create obituary: ${error.message}`)
    }
    
    return obituary as unknown as Obituary
  },

  async uploadMedia(files: FileList | File, bucket: string = 'startup-logos') {
    const fileArray = files instanceof FileList ? Array.from(files) : [files]
    
    // Check file types and sizes
    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime', 'video/avi']
    const allSupportedTypes = [...supportedImageTypes, ...supportedVideoTypes]
    
    for (const file of fileArray) {
      if (!allSupportedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Supported types: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV, QuickTime, AVI)`)
      }
      
      // 50MB limit for videos, 10MB for images
      const maxSize = supportedVideoTypes.includes(file.type) ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        throw new Error(`File "${file.name}" is too large. Maximum size: ${maxSizeMB}MB`)
      }
    }
    
    const uploadPromises = fileArray.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return publicUrl
    })

    const urls = await Promise.all(uploadPromises)
    return urls
  },

  async toggleEmojiReaction(obituaryId: string, emoji: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    const validEmojis = ['🔥', '💀', '😭', '🤯', '🧠']
    if (!validEmojis.includes(emoji)) {
      throw new Error('Invalid emoji reaction')
    }

    // Check if user already reacted with this emoji
    const { data: existingReaction, error: checkError } = await supabase
      .from('Reaction')
      .select('id')
      .eq('type', emoji)
      .eq('userId', user.id)
      .eq('obituaryId', obituaryId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing reaction:', checkError)
      throw new Error(`Failed to check existing reaction: ${checkError.message}`)
    }

    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('Reaction')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Error removing reaction:', deleteError)
        throw new Error(`Failed to remove reaction: ${deleteError.message}`)
      }
      return false
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('Reaction')
        .insert({
          id: crypto.randomUUID(),
          type: emoji,
          userId: user.id,
          obituaryId: obituaryId
        })

      if (insertError) {
        console.error('Error adding reaction:', insertError)
        throw new Error(`Failed to add reaction: ${insertError.message || insertError.code || 'Unknown error'}`)
      }
      return true
    }
  },

  async getEmojiReactions(obituaryId: string) {
    const { data: reactions, error } = await supabase
      .from('Reaction')
      .select('type, userId')
      .eq('obituaryId', obituaryId)
      .in('type', ['🔥', '💀', '😭', '🤯', '🧠'])

    if (error) {
      console.error('Error fetching emoji reactions:', error)
      return { counts: {}, userReactions: [] }
    }

    // Count reactions by emoji
    const counts: Record<string, number> = {
      '🔥': 0,
      '💀': 0,
      '😭': 0,
      '🤯': 0,
      '🧠': 0
    }

    const userReactions: string[] = []
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    reactions?.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1
      if (reaction.userId === currentUserId) {
        userReactions.push(reaction.type)
      }
    })

    return { counts, userReactions }
  },

  async getUserSavedState(obituaryId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return false

    const { data: savedReaction, error } = await supabase
      .from('Reaction')
      .select('id')
      .eq('type', 'save')
      .eq('userId', user.id)
      .eq('obituaryId', obituaryId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user saved state:', error)
      return false
    }

    return !!savedReaction
  },

  async createComment(obituaryId: string, content: string, mediaUrls?: string[], parentId?: string | null) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    // Check if user exists in our User table
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // Create anonymous user record
      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: user.id,
          email: user.email || '',
          handle: generateAnonymousHandle(),
          avatarUrl: null
        })

      if (userError) {
        console.error('Failed to create user:', userError)
        throw new Error(`Failed to create user: ${userError.message}`)
      }
    }

    // Generate UUID for comment
    const commentId = crypto.randomUUID()

    const { data: comment, error } = await supabase
      .from('Comment')
      .insert({
        id: commentId,
        content: content.trim(),
        authorId: user.id,
        obituaryId: obituaryId,
        parentId: parentId || null,
        mediaUrls: mediaUrls || null
      })
      .select(`
        id,
        content,
        authorId,
        createdAt,
        parentId,
        mediaUrls,
        author:User (
          id,
          handle
        )
      `)
      .single()

    if (error) {
      console.error('Failed to create comment:', error)
      throw new Error(`Failed to create comment: ${error.message}`)
    }

    return comment
  },

  async getComments(obituaryId: string) {
    const { data: comments, error } = await supabase
      .from('Comment')
      .select(`
        id,
        content,
        authorId,
        createdAt,
        parentId,
        mediaUrls,
        author:User (
          id,
          handle
        )
      `)
      .eq('obituaryId', obituaryId)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('Failed to load comments:', error)
      throw new Error(`Failed to load comments: ${error.message}`)
    }

    return comments || []
  },

  async getCommentCount(obituaryId: string) {
    const { count, error } = await supabase
      .from('Comment')
      .select('*', { count: 'exact', head: true })
      .eq('obituaryId', obituaryId)

    if (error) {
      console.error('Failed to get comment count:', error)
      return 0
    }

    return count || 0
  },

  async getCommentCounts(obituaryIds: string[]) {
    if (obituaryIds.length === 0) return {}

    const { data, error } = await supabase
      .from('Comment')
      .select('obituaryId')
      .in('obituaryId', obituaryIds)

    if (error) {
      console.error('Failed to get comment counts:', error)
      return {}
    }

    // Count comments per obituary
    const counts: Record<string, number> = {}
    obituaryIds.forEach(id => counts[id] = 0)
    
    data?.forEach(comment => {
      counts[comment.obituaryId] = (counts[comment.obituaryId] || 0) + 1
    })

    return counts
  },

  async toggleSave(obituaryId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    // Check if user already saved this obituary
    const { data: existingReaction } = await supabase
      .from('Reaction')
      .select('id')
      .eq('type', 'save')
      .eq('userId', user.id)
      .eq('obituaryId', obituaryId)
      .single()

    if (existingReaction) {
      // Remove save
      await supabase
        .from('Reaction')
        .delete()
        .eq('id', existingReaction.id)
    } else {
      // Add save
      await supabase
        .from('Reaction')
        .insert({
          id: crypto.randomUUID(),
          type: 'save',
          userId: user.id,
          obituaryId: obituaryId
        })
    }

    return !existingReaction
  },

  async getSavedObituaries() {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    const { data: savedReactions, error } = await supabase
      .from('Reaction')
      .select(`
        obituaryId,
        obituary:Obituary (
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
        )
      `)
      .eq('type', 'save')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Failed to load saved obituaries:', error)
      throw new Error(`Failed to load saved obituaries: ${error.message}`)
    }

    const list = (savedReactions?.map(r => r.obituary).filter(Boolean) || []) as unknown as Obituary[]
    // Deduplicate by obituary id in case multiple "save" reactions exist
    const deduped = Array.from(new Map(list.map(o => [o.id, o])).values())
    return deduped
  },

  async deleteComment(commentId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('Comment')
      .delete()
      .eq('id', commentId)
      .eq('authorId', user.id) // Ensure user can only delete their own comment

    if (error) {
      console.error('Failed to delete comment:', error)
      throw new Error(`Failed to delete comment: ${error.message}`)
    }
  },

  async deleteObituary(obituaryId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')
    
    // First, verify the user is the founder of the obituary
    const { data: obit, error: fetchError } = await supabase
      .from('Obituary')
      .select('founderId')
      .eq('id', obituaryId)
      .single()

    if (fetchError || obit?.founderId !== user.id) {
      throw new Error('Unauthorized or obituary not found')
    }

    // Delete all associated data
    // Note: In a production app, this should be a single transaction
    // or a database function (edge function) for atomicity.
    const { error: reactionError } = await supabase.from('Reaction').delete().eq('obituaryId', obituaryId)
    if (reactionError) throw new Error(`Failed to delete reactions: ${reactionError.message}`)

    const { error: commentError } = await supabase.from('Comment').delete().eq('obituaryId', obituaryId)
    if (commentError) throw new Error(`Failed to delete comments: ${commentError.message}`)

    // Finally, delete the obituary itself
    const { error: obitError } = await supabase.from('Obituary').delete().eq('id', obituaryId)
    if (obitError) throw new Error(`Failed to delete obituary: ${obitError.message}`)
  },

  /* ---------------- Comment Likes (❤️) ---------------- */

  async toggleCommentLike(obituaryId: string, commentId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Not authenticated')

    // Check if user already liked this comment
    const { data: existingReaction, error: checkError } = await supabase
      .from('Reaction')
      .select('id')
      .eq('type', '❤️')
      .eq('userId', user.id)
      .eq('commentId', commentId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing comment like:', checkError)
      throw new Error(`Failed to check existing comment like: ${checkError.message}`)
    }

    if (existingReaction) {
      // Remove like
      const { error: deleteError } = await supabase
        .from('Reaction')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        throw new Error(`Failed to remove like: ${deleteError.message}`)
      }
      return false
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from('Reaction')
        .insert({
          id: crypto.randomUUID(),
          type: '❤️',
          userId: user.id,
          commentId,
          obituaryId: null
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        throw new Error(`Failed to add like: ${insertError.message}`)
      }
      return true
    }
  },

  async getCommentLikeCounts(commentIds: string[]) {
    if (commentIds.length === 0) return { counts: {}, userLikes: [] }

    const { data, error } = await supabase
      .from('Reaction')
      .select('commentId, userId')
      .eq('type', '❤️')
      .in('commentId', commentIds)

    if (error) {
      console.error('Failed to fetch comment like counts:', error)
      return { counts: {}, userLikes: [] }
    }

    const counts: Record<string, number> = {}
    const userLikes: string[] = []
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    commentIds.forEach(id => counts[id] = 0)

    data?.forEach((row) => {
      if (!row.commentId) return
      counts[row.commentId] = (counts[row.commentId] || 0) + 1
      if (row.userId === currentUserId) {
        userLikes.push(row.commentId)
      }
    })

    return { counts, userLikes }
  },
} 