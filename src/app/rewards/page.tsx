"use client";
import { useState, useEffect } from "react";
import Header from "~/components/navigation/Header";
import { useAccount } from "wagmi";
import {
  IconTrophy,
  IconBolt,
  IconMessageCircle,
  IconUsers,
  IconLock,
  IconCheck,
  IconStar,
  IconLogin,
  IconGift,
} from "@tabler/icons-react";

interface UserPoints {
  address: string;
  totalPoints: number;
  votePoints: number;
  commentPoints: number;
  lastUpdated: Date;
}

const BADGES = [
  {
    id: 1,
    Icon: IconTrophy,
    title: "Movie Critic",
    desc: "Vote on 10 movies",
    goal: 10,
    key: "votePoints" as const,
    pts: 100,
    color: "#F5C542",
  },
  {
    id: 2,
    Icon: IconMessageCircle,
    title: "Commentator",
    desc: "Comment on 5 movies",
    goal: 5,
    key: "commentPoints" as const,
    pts: 150,
    divisor: 2,
    color: "#60A5FA",
  },
  {
    id: 3,
    Icon: IconUsers,
    title: "Community Champ",
    desc: "Vote on 25 movies",
    goal: 25,
    key: "votePoints" as const,
    pts: 250,
    color: "#A78BFA",
  },
  {
    id: 4,
    Icon: IconBolt,
    title: "Streak Master",
    desc: "Vote 7 days in a row",
    goal: 7,
    key: "votePoints" as const,
    pts: 300,
    locked: true,
    color: "#F97316",
  },
];

export default function RewardsPage() {
  const { address, isConnected } = useAccount();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (address) {
      fetch(`/api/points?address=${address}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.points) setPoints(d.points); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [address]);

  const progress = (b: typeof BADGES[0]) => {
    if (!points) return 0;
    const raw = points[b.key] ?? 0;
    const val = "divisor" in b && b.divisor ? Math.floor(raw / b.divisor) : raw;
    return Math.min(val, b.goal);
  };

  const pct = (b: typeof BADGES[0]) => (progress(b) / b.goal) * 100;
  const claimable = (b: typeof BADGES[0]) => !b.locked && progress(b) >= b.goal && !claimed.has(b.id);

  const totalPts = points?.totalPoints ?? 0;
  const votePts  = points?.votePoints  ?? 0;
  const cmtPts   = points?.commentPoints ?? 0;

  const STATS = [
    { label: "Total",    value: loading ? "—" : totalPts.toLocaleString(), Icon: IconStar,           color: "#F5C542" },
    { label: "Votes",    value: loading ? "—" : votePts.toLocaleString(),  Icon: IconTrophy,         color: "#A78BFA" },
    { label: "Comments", value: loading ? "—" : cmtPts.toLocaleString(),   Icon: IconMessageCircle,  color: "#60A5FA" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header showSearch={false} />

      <div className="px-5 pt-[80px] pb-16 max-w-lg mx-auto">
        <div className="h-[1px] w-full bg-white/6 mb-6" />

        {/* Title */}
        <div className="mb-6">
          <p className="text-white/30 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1">Earn & Unlock</p>
          <h1 className="text-white text-2xl font-bold tracking-tight leading-none">Rewards</h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-3 py-5 text-center">
              <s.Icon size={18} className="mx-auto mb-2.5" style={{ color: s.color }} />
              <p className="text-white text-2xl font-bold leading-none mb-1.5 tabular-nums">{s.value}</p>
              <p className="text-white/25 text-[10px] uppercase tracking-wide font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Daily spin CTA */}
        <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 mb-7">
          <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
            <IconGift size={18} className="text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold">Daily Spin</p>
            <p className="text-white/35 text-[11px] mt-0.5">One free spin per day — bonus points await</p>
          </div>
          <span className="text-white/15 text-[10px] font-semibold uppercase tracking-wide">Auto</span>
        </div>

        {/* Badges */}
        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.14em] mb-3">Badges</p>
        <div className="space-y-2.5">
          {BADGES.map(b => {
            const prog = progress(b);
            const can = claimable(b);
            const done = claimed.has(b.id);
            const p = pct(b);

            return (
              <div
                key={b.id}
                className={`rounded-xl border px-4 py-4 transition-colors ${
                  can  ? "bg-white/[0.05] border-white/15" :
                  done ? "bg-white/[0.02] border-white/[0.05] opacity-50" :
                  b.locked ? "bg-white/[0.02] border-white/[0.04]" :
                  "bg-white/[0.03] border-white/[0.07]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon circle */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${b.color}18` }}
                  >
                    <b.Icon size={16} style={{ color: b.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-semibold tracking-tight">{b.title}</span>
                      <span className="text-white/30 text-xs font-medium">{b.pts} pts</span>
                    </div>
                    <p className="text-white/40 text-xs mb-3 leading-relaxed">{b.desc}</p>

                    {/* Progress bar */}
                    <div className="w-full h-[3px] rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${p}%`,
                          background: done ? "rgba(255,255,255,0.15)" : b.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/20 text-[10px]">{prog}/{b.goal}</span>
                      {can && (
                        <button
                          onClick={() => setClaimed(prev => new Set([...prev, b.id]))}
                          className="px-4 py-2 rounded-full text-xs font-bold text-black transition-colors"
                          style={{ background: b.color }}
                        >
                          Claim reward
                        </button>
                      )}
                      {done && (
                        <span className="flex items-center gap-1 text-white/25 text-[10px]">
                          <IconCheck size={11} stroke={2.5} /> Claimed
                        </span>
                      )}
                      {b.locked && !can && (
                        <span className="flex items-center gap-1 text-white/20 text-[10px]">
                          <IconLock size={11} stroke={2} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="mt-8 rounded-xl bg-white/[0.03] border border-white/[0.07] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <IconLogin size={20} className="text-white/20" />
            </div>
            <h3 className="text-white text-sm font-semibold mb-1">Connect your wallet</h3>
            <p className="text-white/30 text-xs">Open MovieMeter in MiniPay to track your rewards</p>
          </div>
        )}
      </div>
    </div>
  );
}
