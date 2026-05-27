"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DateRange } from "./DateRangePicker";

const CHANNEL_COLORS: Record<string, string> = {
  "Dine In": "#C41E3A",
  "To Go": "#D97706",
  "Delivery": "#2563EB",
  "Online Order": "#16A34A",
  "Other": "#6B7280",
};

function getColor(name: string): string {
  return CHANNEL_COLORS[name] ?? "#6B7280";
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Channel {
  name: string;
  revenue: number;
  orders: number;
  pct: number;
}

interface ChannelData {
  channels: Channel[];
  total: number;
}

interface ChannelMixProps {
  dateRange: DateRange;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-gallas-dark-card border border-gallas-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{d.name}</p>
        <p className="text-sm font-semibold text-white">{formatCurrency(d.revenue)}</p>
        <p className="text-xs text-gray-400">{d.orders} orders · {d.pct}%</p>
      </div>
    );
  }
  return null;
};

export default function ChannelMix({ dateRange }: ChannelMixProps) {
  const [data, setData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-channels?startDate=${dateRange.from}&endDate=${dateRange.to}`)
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
          <h3 className="text-sm font-semibold text-white">Channel Mix</h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue split by order type</p>
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
        <div className="py-12 text-center text-gray-500 text-sm">Loading channel data…</div>
      )}

      {!loading && (!data || data.channels.length === 0) && (
        <div className="py-12 text-center">
          <p className="text-gray-500 text-sm">No channel data available for the selected date range.</p>
        </div>
      )}

      {!loading && data && data.channels.length > 0 && (
        <>
          {/* Donut Chart */}
          <div className="mb-6" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.channels}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="revenue"
                >
                  {data.channels.map((ch, i) => (
                    <Cell key={i} fill={getColor(ch.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{value}</span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gallas-dark-border">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Channel</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">Orders</th>
                  <th className="text-right py-2 pl-4 text-gray-500 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((ch, i) => (
                  <tr key={i} className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getColor(ch.name) }}
                        />
                        <span className="font-medium text-white">{ch.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-white">{formatCurrency(ch.revenue)}</td>
                    <td className="py-2.5 px-4 text-right text-gray-400">{ch.orders.toLocaleString()}</td>
                    <td className="py-2.5 pl-4 text-right">
                      <span className="text-gray-300 font-medium">{ch.pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gallas-dark-border">
                  <td className="py-2.5 pr-4 font-bold text-white">Total</td>
                  <td className="py-2.5 px-4 text-right font-bold text-gallas-red-light">{formatCurrency(data.total)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-300">
                    {data.channels.reduce((s, c) => s + c.orders, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-gray-300">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
