"use client";

import { useEffect, useState, useCallback } from "react";

interface TodayStats {
  revenue: number;
  orderCount: number;
  avgTicket: number;
  lastUpdated: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function minutesAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
}

export default function TodayBanner() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0);

  const fetchStats = useCallback(() => {
    setLoading((prev) => (stats === null ? true : prev));
    fetch("/.netlify/functions/clover-today")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TodayStats) => {
        setStats(data);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [stats]);

  // Initial fetch + every 3 minutes
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick every 30s to refresh "X min ago" display
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gallas-dark-card border-b border-gallas-dark-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {loading && !stats ? (
          /* Skeleton */
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse" />
              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-600 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error && !stats ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-600" />
            Live data unavailable
          </div>
        ) : stats ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Today</span>
            </div>

            {/* Stats */}
            <Stat label="Revenue" value={formatCurrency(stats.revenue)} />
            <Divider />
            <Stat label="Orders" value={stats.orderCount.toString()} />
            <Divider />
            <Stat label="Avg Ticket" value={formatCurrency(stats.avgTicket)} />
            <Divider />
            <span className="text-xs text-gray-600 ml-auto">
              Updated {minutesAgo(stats.lastUpdated)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-gray-400">
      {label}:{" "}
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="text-gray-700 text-xs hidden sm:inline">|</span>;
}
