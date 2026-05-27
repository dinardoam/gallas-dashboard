"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { DateRange } from "./DateRangePicker";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

interface VoidEntry {
  date: string;
  time: string;
  amount: number;
  reason: string;
}

interface VoidData {
  voidCount: number;
  voidTotal: number;
  voidPct: number;
  totalRevenue: number;
  voids: VoidEntry[];
}

interface VoidTrackerProps {
  dateRange: DateRange;
}

function voidColor(pct: number): string {
  if (pct >= 4) return "text-red-400";
  if (pct >= 2) return "text-yellow-400";
  return "text-green-400";
}

function voidBg(pct: number): string {
  if (pct >= 4) return "bg-red-500/10 border-red-500/20";
  if (pct >= 2) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-green-500/10 border-green-500/20";
}

export default function VoidTracker({ dateRange }: VoidTrackerProps) {
  const [data, setData] = useState<VoidData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-voids?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setIsLive(true);
      })
      .catch(() => {
        if (!cancelled) setIsLive(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dateRange.from, dateRange.to]);

  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Void &amp; Comp Tracker</h3>
          <p className="text-xs text-gray-500 mt-0.5">Refunded and voided orders</p>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
            Loading…
          </span>
        ) : isLive ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Static
          </span>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-gray-500 text-sm">Loading void data…</div>
      )}

      {!loading && !isLive && !data && (
        <div className="py-12 text-center">
          <p className="text-gray-500 text-sm">Unable to load void data. Clover API unavailable.</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Alert banner */}
          {data.voidPct >= 2 && (
            <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 mb-5 ${voidBg(data.voidPct)}`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${voidColor(data.voidPct)}`} />
              <p className={`text-sm font-medium ${voidColor(data.voidPct)}`}>
                Void rate is above 2% — review recent transactions
              </p>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Voids</p>
              <p className={`text-xl font-bold ${voidColor(data.voidPct)}`}>{formatCurrency(data.voidTotal)}</p>
            </div>
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Void Count</p>
              <p className={`text-xl font-bold ${voidColor(data.voidPct)}`}>{data.voidCount}</p>
            </div>
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Void %</p>
              <p className={`text-xl font-bold ${voidColor(data.voidPct)}`}>{data.voidPct.toFixed(1)}%</p>
            </div>
          </div>

          {/* Void list */}
          {data.voids.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-green-400 text-sm font-medium">No voids in this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gallas-dark-border">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Time</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Amount</th>
                    <th className="text-left py-2 pl-4 text-gray-500 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.voids.map((v, i) => (
                    <tr key={i} className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-300">{v.date}</td>
                      <td className="py-2.5 px-4 text-gray-400">{v.time}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-red-400">{formatCurrency(v.amount)}</td>
                      <td className="py-2.5 pl-4 text-gray-400 truncate max-w-xs">{v.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
