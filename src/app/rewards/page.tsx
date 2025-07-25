"use client";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { useRouter } from "next/navigation";

export default function RewardsPage() {
  const router = useRouter();
  return (
    <main className="pt-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen bg-[#0A0A0A]">
      <div className="flex items-center mb-8">
        <button onClick={() => router.back()} className="text-white text-lg px-3 py-1 rounded hover:bg-white/10 transition-colors">← Back</button>
        <h2 className="text-3xl font-bold text-white text-center flex-1">Claimable Tokens</h2>
        <div className="w-24" />
      </div>
      <Card className="bg-[#18181B] text-white w-full max-w-xl mx-auto rounded-2xl shadow-lg border border-white/10 flex flex-col items-center">
        <CardContent className="flex flex-col items-center p-8 w-full">
          <CardTitle className="mb-2 text-center w-full text-lg font-semibold">No tokens available to claim at this time.</CardTitle>
          <CardDescription className="text-center w-full text-white/70">Check back later for rewards you can claim!</CardDescription>
        </CardContent>
      </Card>
    </main>
  );
} 