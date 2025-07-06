'use client'

import { formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TimeDisplayProps {
  timestamp: string
  className?: string
  showFullDate?: boolean
}

export function TimeDisplay({ timestamp, className = "", showFullDate = false }: TimeDisplayProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [userTimezone, setUserTimezone] = useState<string>('')
  
  useEffect(() => {
    const getUserTimezone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Try to get timezone, but handle gracefully if column doesn't exist
          const { data, error } = await supabase
            .from('User')
            .select('timezone')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.log('Timezone column not found, using browser timezone:', error.message)
            setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
          } else {
            setUserTimezone(data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          }
        } else {
          setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        }
      } catch (error) {
        console.log('Error getting user timezone, using browser timezone:', error)
        setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      }
    }
    
    getUserTimezone()
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!userTimezone) return
    
    const updateTime = () => {
      try {
        // Parse the timestamp - handle both ISO string and PostgreSQL timestamp
        let date: Date
        
        if (timestamp.includes('T')) {
          // ISO format with timezone
          date = new Date(timestamp)
        } else {
          // PostgreSQL timestamp without timezone - treat as UTC
          date = new Date(timestamp + 'Z')
        }
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          console.error('Invalid timestamp:', timestamp)
          setTimeAgo('Invalid date')
          return
        }
        
        if (showFullDate) {
          // Show full date and time in user's timezone
          const formatted = formatInTimeZone(date, userTimezone, 'PPp')
          setTimeAgo(formatted)
        } else {
          // Show relative time (this automatically uses local timezone)
          const formatted = formatDistanceToNow(date, { addSuffix: true })
          setTimeAgo(formatted)
        }
      } catch (error) {
        console.error('Error parsing timestamp:', timestamp, error)
        setTimeAgo('Invalid date')
      }
    }
    
    updateTime()
    
    // Update every minute for accuracy
    const interval = setInterval(updateTime, 60000)
    
    return () => clearInterval(interval)
  }, [timestamp, userTimezone, showFullDate])
  
  // Return a placeholder during SSR to avoid hydration mismatch
  if (!mounted || !timeAgo) {
    return <span className={className}>...</span>
  }
  
  return <span className={className}>{timeAgo}</span>
} 