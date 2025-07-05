"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabase } from "@/components/SupabaseProvider";

export default function LoginPage() {
  const { supabase } = useSupabase();

  if (!supabase) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 py-20">
        <h1 className="text-center text-3xl font-bold text-neutral-100">
          Sign in to KilledIt
        </h1>
        <div className="text-center text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-20">
      <h1 className="text-center text-3xl font-bold text-neutral-100">
        Sign in to KilledIt
      </h1>
      <Auth
        supabaseClient={supabase}
        providers={["github", "google"]}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
      />
    </div>
  );
} 