'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Footer() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Only show footer on homepage when user is not logged in
  if (isLoading || user || pathname !== '/') {
    return null
  }

  return (
    <footer className="border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">
              Killed<span className="text-red-500">It</span>
            </h3>
            <p className="text-sm text-neutral-400">
              The startup graveyard where failed dreams find peace.
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200">Explore</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Recent Deaths</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Most Roasted</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Hall of Shame</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Lessons Learned</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200">Community</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/create" className="hover:text-neutral-200 transition-colors">Confess Your Failure</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Guidelines</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Support</Link></li>
              <li><a href="#" className="hover:text-neutral-200 transition-colors">Discord</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Terms of Service</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Content Policy</Link></li>
              <li><Link href="/" className="hover:text-neutral-200 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-neutral-500">
            © 2025 KilledIt. All failed startups rest in peace here.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-neutral-500 hover:text-neutral-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-400 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 