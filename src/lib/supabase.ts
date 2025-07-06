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

function generateAnonymousHandle(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 999) + 1
  return `${adjective}${noun}${number}`
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

  async createComment(obituaryId: string, content: string, mediaUrls?: string[]) {
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
        mediaUrls: mediaUrls || null
      })
      .select(`
        id,
        content,
        authorId,
        createdAt,
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

    return savedReactions?.map(r => r.obituary).filter(Boolean) || []
  }
} 