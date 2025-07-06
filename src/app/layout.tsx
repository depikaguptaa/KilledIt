import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupabaseProvider from "@/components/SupabaseProvider";
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KilledIt – Startup Graveyard",
  description: "Post obituaries of failed startups. Laugh, cry, roast, learn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 min-h-screen`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(239, 68, 68, 0.02) 0%, transparent 50%)
          `
        }}
      >
        <QueryProvider>
          <SupabaseProvider>
            <Header />
            <main className="relative z-20">{children}</main>
            <Footer />
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
