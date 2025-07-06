"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-gradient-to-r from-neutral-950/90 via-neutral-950/95 to-neutral-950/90 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-neutral-100 hover:text-neutral-300 transition-all duration-200 hover:scale-105">
          Killed<span className="text-red-500">It</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="h-8 w-16 bg-gradient-to-r from-neutral-800 to-neutral-700 animate-pulse rounded shadow-sm"></div>
          ) : user ? (
            <>
              <Link href="/saved" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-750 transition-all duration-200 hover:scale-105">
                  🔖 Saved
                </Button>
              </Link>
              <Link href="/saved" className="sm:hidden">
                <Button variant="ghost" size="sm" className="px-2 hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-750 transition-all duration-200 hover:scale-105">
                  🔖
                </Button>
              </Link>
              <Button asChild variant="destructive" size="sm" className="text-xs sm:text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md shadow-red-900/30 hover:shadow-lg hover:shadow-red-900/40 transition-all duration-200 hover:scale-105">
                <Link href="/create">
                  <span className="hidden sm:inline">+ Confess</span>
                  <span className="sm:hidden">+</span>
                </Link>
              </Button>
              <Link href="/profile">
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-neutral-600 transition-all duration-200 hover:scale-110 shadow-md shadow-black/30">
                  <AvatarFallback className="bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 text-sm">
                    💀
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-750 transition-all duration-200 hover:scale-105">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="destructive" size="sm" className="text-xs sm:text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md shadow-red-900/30 hover:shadow-lg hover:shadow-red-900/40 transition-all duration-200 hover:scale-105">
                <Link href="/create">
                  <span className="hidden sm:inline">+ Confess</span>
                  <span className="sm:hidden">+</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 