"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabase } from "@/components/SupabaseProvider";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!supabase) return;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session);
      
      if (event === 'SIGNED_IN') {
        console.log('Successfully signed in:', session?.user?.email);
        // Redirect to home page on successful login
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    
    if (error) {
      console.error('Google OAuth error:', error);
    }
  };

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
      
      {/* Google OAuth Button */}
      <Button
        onClick={handleGoogleLogin}
        variant="outline"
        className="w-full bg-white text-black hover:bg-gray-100 border-gray-300 dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-neutral-900 px-2 text-neutral-400">Or continue with email</span>
        </div>
      </div>
      
      <Auth
        supabaseClient={supabase}
        providers={[]}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        view="sign_in"
      />
      
      <div className="text-center">
        <p className="text-xs text-neutral-600 mt-2">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
} 