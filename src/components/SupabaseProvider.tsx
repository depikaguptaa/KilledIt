"use client";
import { supabase } from "@/lib/supabase";
import { createContext, useContext, useState } from "react";
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
  const [supabaseClient] = useState<SupabaseClient>(supabase);

  return (
    <Context.Provider value={{ supabase: supabaseClient }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  return context;
}; 