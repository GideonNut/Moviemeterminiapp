'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "~/components/providers/Providers";
import { ConditionalLayout } from "~/components/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
