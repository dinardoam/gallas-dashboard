"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import type { DateRange } from "./DateRangePicker";

const WEEKLY_GOAL = 45000;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function progressColor(pct: number): string {
  if (pct >= 90) return "#16A34A";
  if (pct >= 70) return "#D97706";
  return "#C41E3A";
}

function progressTextColor(pct: number): string {
  if (pct >= 90) return "text-green-400";
  if (pct >= 70) return "text-yellow-400";
  return "text-red-400";
}

interface DayData {
  date: string;
  revenue: number;
  orderCount: number;
}

interface SalesTargetProps {
  dateRange: DateRange;
}

// Count days remaining in the current week (Mon–Sun) from endDate of range
function daysRemainingInWeek(endDate: string): number {
  // Dashboard week is Mon May 20 – Sun May 26, 2026
  // We compute days between endDate and Sunday of that week
  const end = new Date(endDate + "T00:00:00");
  const dow = end.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const daysUntilSunday = dow === 0 ? 0 : 7 - dow;
  return daysUntilSunday;
}

export default function SalesTarget({ dateRange }: SalesTargetProps) {
  const [revenue, setRevenue] = useState<number | null>(null);
  const [dayCount, setDayCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRevenue(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-sales?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const days: DayData[] = json.days || [];
        const total = days.reduce((s, d) => s + d.revenue, 0);
        setRevenue(total);
        setDayCount(days.length);
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

  const current = revenue ?? 0;
  const pct = Math.min(Math.round((current / WEEKLY_GOAL) * 100), 100);
  const remaining = daysRemainingInWeek(dateRange.to);
  const avgDaily = dayCount > 0 ? current / dayCount : 0;
  const totalDaysInRange = dayCount + remaining;
  const projected = avgDaily * totalDaysInRange;
  const color = progressColor(pct);
  const textColor = progressTextColor(pct);

  // SVG circle progress
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Sales Target</h3>
          <p className="text-xs text-gray-500 mt-0.5">Weekly goal progress</p>
        </div>
        <div className="flex items-center gap-3">
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
          <div className="w-8 h-8 rounded-lg bg-gallas-red/15 text-gallas-red-light flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width={140} height={140} viewBox="0 0 140 140">
            {/* Background circle */}
            <circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke="#1F1F1F"
              strokeWidth={12}
            />
            {/* Progress circle */}
            <circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${textColor}`}>{pct}%</span>
            <span className="text-xs text-gray-500 mt-0.5">of goal</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <p className="text-xs text-gray-500 mb-1">Revenue vs Goal</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(current)}{" "}
              <span className="text-gray-500 font-normal text-sm">of {formatCurrency(WEEKLY_GOAL)} goal</span>
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-3">
              <p className="text-xs text-gray-500 mb-0.5">Remaining to Goal</p>
              <p className={`text-base font-semibold ${current >= WEEKLY_GOAL ? "text-green-400" : "text-white"}`}>
                {current >= WEEKLY_GOAL ? "Goal Reached!" : formatCurrency(WEEKLY_GOAL - current)}
              </p>
            </div>
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-3">
              <p className="text-xs text-gray-500 mb-0.5">Days Remaining</p>
              <p className="text-base font-semibold text-white">
                {remaining} {remaining === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-3">
              <p className="text-xs text-gray-500 mb-0.5">Avg Daily Revenue</p>
              <p className="text-base font-semibold text-white">{dayCount > 0 ? formatCurrency(avgDaily) : "—"}</p>
            </div>
            <div className="bg-gallas-dark-muted rounded-lg border border-gallas-dark-border p-3">
              <p className="text-xs text-gray-500 mb-0.5">Projected Week Total</p>
              <p className={`text-base font-semibold ${projected >= WEEKLY_GOAL ? "text-green-400" : "text-yellow-400"}`}>
                {dayCount > 0 ? formatCurrency(projected) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
