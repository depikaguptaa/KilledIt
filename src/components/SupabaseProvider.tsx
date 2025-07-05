"use client";
import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseContext = {
  supabase: SupabaseClient | null;
};

const Context = createContext<SupabaseContext>({ supabase: null });

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (!context.supabase) {
    // Return a placeholder during SSR or before client hydration
    return { supabase: null };
  }
  return context;
}; 