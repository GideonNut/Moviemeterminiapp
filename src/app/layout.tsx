import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "~/components/providers/Providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { ConditionalLayout } from "~/components/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen">
          <Providers>
            <ConditionalLayout>{children}</ConditionalLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
