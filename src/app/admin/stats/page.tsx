"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminPasscode } from "~/components/admin/admin-passcode-context";
import type { AdminStats } from "~/lib/admin-stats";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-[#18181B] border border-white/10 rounded-lg p-5">
      <p className="text-sm text-white/60 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {hint ? <p className="text-xs text-white/40 mt-2">{hint}</p> : null}
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function AdminStatsPage() {
  const { adminFetch } = useAdminPasscode();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminFetch("/api/admin/stats");
      const data = await response.json();

      if (!response.ok) {
        setStats(null);
        setError(data.error || "Failed to load stats.");
        return;
      }

      setStats(data.stats);
    } catch {
      setError("Could not reach the stats API.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const yesPercent =
    stats && stats.votes.totalVotes > 0
      ? Math.round((stats.votes.totalYes / stats.votes.totalVotes) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-blue-400 hover:text-blue-300 mb-2 inline-block"
          >
            ← Back to admin
          </Link>
          <h1 className="text-3xl font-bold text-white">Admin Stats</h1>
          <p className="text-white/60 mt-1">
            Firestore aggregates for content, votes, and engagement.
          </p>
        </div>

        {loading && !stats ? (
          <p className="text-center text-white/60">Loading stats…</p>
        ) : null}
        {error ? (
          <p className="mb-6 text-center text-sm text-red-400">{error}</p>
        ) : null}

        {stats ? (
          <>
            <p className="text-xs text-white/40 mb-6 text-right">
              Updated {new Date(stats.generatedAt).toLocaleString()}
            </p>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">Content</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Movies" value={stats.content.movies} />
                <StatCard label="TV shows" value={stats.content.tvShows} />
                <StatCard
                  label="Total titles"
                  value={stats.content.totalContent}
                />
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">Votes</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total votes (yes + no)"
                  value={formatNumber(stats.votes.totalVotes)}
                />
                <StatCard
                  label="Yes / No"
                  value={`${formatNumber(stats.votes.totalYes)} / ${formatNumber(stats.votes.totalNo)}`}
                  hint={`${yesPercent}% yes`}
                />
                <StatCard
                  label="Vote records"
                  value={formatNumber(stats.votes.userVoteRecords)}
                  hint="Rows in userVotes"
                />
                <StatCard
                  label="Unique voters"
                  value={formatNumber(stats.votes.uniqueVoters)}
                />
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">
                Engagement
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Comments"
                  value={formatNumber(stats.engagement.comments)}
                />
                <StatCard
                  label="Watchlist items"
                  value={formatNumber(stats.engagement.watchlistItems)}
                />
                <StatCard
                  label="Users with points"
                  value={formatNumber(stats.engagement.usersWithPoints)}
                />
              </div>
            </section>

            {stats.topByVotes.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Top titles by votes
                </h2>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#18181B] text-white/60">
                      <tr>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium text-right">Yes</th>
                        <th className="px-4 py-3 font-medium text-right">No</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {stats.topByVotes.map((item) => (
                        <tr
                          key={`${item.type}-${item.title}`}
                          className="bg-[#18181B]/50"
                        >
                          <td className="px-4 py-3 text-white">{item.title}</td>
                          <td className="px-4 py-3 text-white/60 capitalize">
                            {item.type}
                          </td>
                          <td className="px-4 py-3 text-right text-green-400">
                            {item.yes}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400">
                            {item.no}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            {item.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => void loadStats()}
                disabled={loading}
                className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                {loading ? "Refreshing…" : "Refresh stats"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
