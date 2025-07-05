"use client";
import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Header() {
  // const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-neutral-100">
          Killed<span className="text-red-500">It</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          <Button asChild variant="destructive" size="sm">
            <Link href="/create">
              Confess
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
} 