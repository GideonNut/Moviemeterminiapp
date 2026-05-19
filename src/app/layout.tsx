import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "~/app/providers";
import { ConditionalLayout } from "~/components/ConditionalLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/auth";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <Providers session={session}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
