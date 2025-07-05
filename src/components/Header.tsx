"use client";
import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  // const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
        <Link href="/" className="font-bold text-neutral-100">
          Killed<span className="text-red-500">It</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/create"
            className="rounded bg-red-600 px-3 py-1.5 font-medium text-white transition hover:bg-red-500"
          >
            Confess
          </Link>
        </div>
      </div>
    </header>
  );
} 