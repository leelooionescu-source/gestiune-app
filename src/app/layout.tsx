import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FlashMessage from "@/components/FlashMessage";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Gestiune App",
  description: "Aplicație de gestiune clienți, contracte și facturi",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ro">
      <body className="bg-gray-50 min-h-screen font-sans">
        {user && <Navbar />}
        <main className={user ? "max-w-7xl mx-auto px-4 py-6" : ""}>
          <Suspense>
            <FlashMessage />
          </Suspense>
          {children}
        </main>
      </body>
    </html>
  );
}
