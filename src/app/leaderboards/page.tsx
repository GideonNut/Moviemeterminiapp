"use client";
import React from "react";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import Header from "~/components/navigation/Header";
import {
  GoldMedalIcon,
  SilverMedalIcon,
  BronzeMedalIcon,
  VoterTabIcon,
  EarnerTabIcon,
  StreakTabIcon,
  TrophyEmptyIcon,
  WarningIcon,
} from "~/components/icons/AppIcons";

interface TopVoter { rank: number; address: string; votes: number; streak: number; yesVotes: number; noVotes: number; lastVoteDate: string; }
interface StreakEntry { rank: number; address: string; streak: number; totalVotes: number; lastVoteDate: string; }
interface EarnerEntry { rank: number; address: string; earnings: number; activity: string; totalVotes: number; streak: number; }
interface LeaderboardData { topVoters: TopVoter[]; longestStreaks: StreakEntry[]; topEarners: EarnerEntry[]; totalUsers: number; totalVotes: number; }

type LeaderboardEntry = {
  rank: number;
  address: string;
  votes?: number;
  yesVotes?: number;
  noVotes?: number;
  streak?: number;
  totalVotes?: number;
  earnings?: number;
  activity?: string;
};

type Tab = "voters" | "earners" | "streaks";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "voters",  label: "Voters",  Icon: VoterTabIcon },
  { id: "earners", label: "Earners", Icon: EarnerTabIcon },
  { id: "streaks", label: "Streaks", Icon: StreakTabIcon },
];

function fmt(addr: string) { return `${addr?.slice(0, 6)}…${addr?.slice(-4)}`; }

function RankMark({ rank }: { rank: number }) {
  if (rank === 1) return <GoldMedalIcon size={20} />;
  if (rank === 2) return <SilverMedalIcon size={20} />;
  if (rank === 3) return <BronzeMedalIcon size={20} />;
  return <span className="text-white/35 text-[13px] font-semibold tabular-nums">#{rank}</span>;
}

export default function LeaderboardsPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("voters");

  const fetchData = async (soft = false) => {
    try {
      if (soft) { setRefreshing(true); } else { setLoading(true); }
      setError(null);
      const res = await fetch("/api/leaderboards");
      if (!res.ok) throw new Error("Failed to load leaderboard data");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const rows = (): LeaderboardEntry[] => {
    if (!data) return [];
    if (tab === "voters")  return data.topVoters;
    if (tab === "earners") return data.topEarners;
    return data.longestStreaks;
  };

  const primaryStat = (entry: LeaderboardEntry): string => {
    if (tab === "voters")  return `${(entry.votes ?? 0).toLocaleString()} votes`;
    if (tab === "earners") return `${entry.earnings ?? 0} G$`;
    return `${entry.streak ?? 0}d`;
  };

  const subStat = (entry: LeaderboardEntry): string => {
    if (tab === "voters")  return `${entry.yesVotes ?? 0} yes · ${entry.noVotes ?? 0} no`;
    if (tab === "earners") return entry.activity ?? "";
    return `${entry.totalVotes ?? 0} total votes`;
  };

  const userRank = (() => {
    if (!data || !address) return null;
    return rows().find((e: LeaderboardEntry) => e.address === address)?.rank ?? null;
  })();

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header showSearch={false} />
        <div className="px-4 pt-[72px] pb-10 max-w-lg mx-auto">
          <div className="h-px bg-white/6 mb-6" />
          <div className="h-6 w-32 bg-white/8 rounded-full mb-8 animate-pulse" />
          <div className="flex gap-2 mb-5">
            {[1,2,3].map(i => <div key={i} className="flex-1 h-10 bg-white/6 rounded-full animate-pulse" />)}
          </div>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="w-8 h-5 bg-white/6 rounded animate-pulse" />
              <div className="w-9 h-9 rounded-full bg-white/6 animate-pulse" />
              <div className="flex-1 h-4 bg-white/6 rounded-lg animate-pulse" />
              <div className="w-14 h-4 bg-white/6 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header showSearch={false} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-6">
          <WarningIcon size={40} className="text-white/20" />
          <p className="text-white/40 text-sm max-w-xs">{error}</p>
          <button onClick={() => fetchData()} className="px-5 py-2.5 rounded-full bg-white/8 text-white text-sm font-semibold hover:bg-white/15 transition-colors">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header showSearch={false} />
      <div className="px-4 pt-[72px] pb-12 max-w-lg mx-auto">
        <div className="h-px bg-white/6 mb-6" />

        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/25 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1">Rankings</p>
            <h1 className="text-white text-2xl font-bold tracking-tight leading-none">Leaderboard</h1>
            {data && (
              <p className="text-white/25 text-xs mt-1">
                {data.totalUsers.toLocaleString()} users · {data.totalVotes.toLocaleString()} votes
              </p>
            )}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-full bg-white/6 hover:bg-white/12 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={`text-white/50 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Your rank */}
        {isConnected && address && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/8 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {fmt(address)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium">{fmt(address)}</p>
              <p className="text-white/30 text-[11px]">Your wallet</p>
            </div>
            <div className="text-right">
              {userRank
                ? <span className="text-white font-bold text-base">#{userRank}</span>
                : <span className="text-white/25 text-xs">Not ranked</span>
              }
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-white text-black"
                  : "bg-white/6 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              <t.Icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {rows().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <TrophyEmptyIcon size={40} className="text-white/15" />
              <p className="text-white/30 text-sm">No data yet — start voting!</p>
            </div>
          ) : (
            rows().map((entry: LeaderboardEntry, i: number) => {
              const isMe = entry.address === address;
              return (
                <div
                  key={`${entry.address}-${i}`}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isMe
                      ? "bg-white/10 border border-white/15"
                      : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    <RankMark rank={entry.rank} />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {fmt(entry.address)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[13px] font-medium truncate">{fmt(entry.address)}</span>
                      {isMe && (
                        <span className="text-[10px] font-bold bg-white/12 text-white/60 px-1.5 py-0.5 rounded-full flex-shrink-0">you</span>
                      )}
                    </div>
                    <p className="text-white/30 text-[11px] truncate">{subStat(entry)}</p>
                  </div>
                  <span className="text-white font-semibold text-[13px] tabular-nums flex-shrink-0">
                    {primaryStat(entry)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

