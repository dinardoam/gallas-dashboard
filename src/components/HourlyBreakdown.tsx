"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Zap } from "lucide-react";
import type { DateRange } from "./DateRangePicker";

interface HourData {
  hour: number;
  label: string;
  revenue: number;
  orders: number;
}

interface HourlyBreakdownProps {
  dateRange: DateRange;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const HourlyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gallas-dark-card border border-gallas-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-gallas-red" />
          <span className="text-gray-300">Revenue:</span>
          <span className="font-semibold text-white">{formatCurrency(payload[0]?.value ?? 0)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-300">Orders:</span>
          <span className="font-semibold text-white">{payload[0]?.payload?.orders ?? 0}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function HourlyBreakdown({ dateRange }: HourlyBreakdownProps) {
  const [hours, setHours] = useState<HourData[] | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHours(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-hourly?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setHours(json.hours || []);
        setIsLive(true);
      })
      .catch(() => {
        if (!cancelled) {
          setHours([]);
          setIsLive(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dateRange.from, dateRange.to]);

  const peakHour = hours && hours.length > 0
    ? hours.reduce((max, h) => h.revenue > max.revenue ? h : max, hours[0])
    : null;

  const avgPerHour = hours && hours.length > 0
    ? hours.reduce((s, h) => s + h.revenue, 0) / hours.length
    : 0;

  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Hourly Sales Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue and orders by hour of day</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
              Loading…
            </span>
          ) : isLive ? (
            <span className="inline-flex items-center gap-1.5 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              Static
            </span>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="h-48 bg-gallas-dark rounded-lg animate-pulse" />
      )}

      {/* No data */}
      {!loading && (!hours || hours.length === 0) && (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          No hourly data available for the selected range.
        </div>
      )}

      {/* Chart */}
      {!loading && hours && hours.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hours} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip content={<HourlyTooltip />} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#C41E3A"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gallas-dark-border">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Peak Hour</p>
              {peakHour ? (
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-gallas-gold" />
                  {peakHour.label}
                  <span className="text-gray-400 font-normal">{formatCurrency(peakHour.revenue)}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Avg per Hour</p>
              <p className="text-sm font-semibold text-white">{formatCurrency(avgPerHour)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
