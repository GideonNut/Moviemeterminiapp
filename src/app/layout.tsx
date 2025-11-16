'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "~/components/providers/Providers";
import { ConditionalLayout } from "~/components/ConditionalLayout";
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-background`}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="space-y-4 w-full max-w-2xl px-4">
              <div className="h-10 bg-muted rounded-md animate-pulse w-3/4 mx-auto"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-md animate-pulse"></div>
                <div className="h-4 bg-muted rounded-md animate-pulse w-5/6"></div>
                <div className="h-4 bg-muted rounded-md animate-pulse w-4/6"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-40 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 bg-muted rounded-md animate-pulse w-3/4"></div>
                    <div className="h-3 bg-muted rounded-md animate-pulse w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark">
      <head />
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
