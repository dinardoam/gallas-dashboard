"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SALES_DATA, PRIOR_WEEK_SALES } from "@/lib/data";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import type { DateRange } from "./DateRangePicker";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gallas-dark-card border border-gallas-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-300">{p.name}:</span>
            <span className="font-semibold text-white">
              {p.dataKey === "revenue" || p.name?.includes("Revenue")
                ? formatCurrency(p.value)
                : p.value.toLocaleString()}
            </span>
          </div>
        ))}
        {payload[0]?.payload?.note && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gallas-gold">
            <Zap className="w-3 h-3" />
            {payload[0].payload.note}
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface DayData {
  date: string;
  shortDate: string;
  isoDate: string;
  revenue: number;
  orderCount: number;
  pies: number;
  large: number;
  mini: number;
  gf: number;
  note?: string;
}

interface SalesOverviewProps {
  dateRange: DateRange;
}

function buildStaticData(range: DateRange): DayData[] {
  return SALES_DATA
    .filter((d) => d.isoDate >= range.from && d.isoDate <= range.to)
    .map((d) => ({
      ...d,
      orderCount: 0,
      shortDate: d.shortDate,
    }));
}

function shortDateFromIso(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function SalesOverview({ dateRange }: SalesOverviewProps) {
  const [liveData, setLiveData] = useState<DayData[] | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLiveData(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-sales?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        // Merge live revenue/orderCount with static pie counts for the same dates
        const staticMap = Object.fromEntries(
          SALES_DATA.map((d) => [d.isoDate, d])
        );
        const merged: DayData[] = (json.days || []).map((ld: any) => {
          const s = staticMap[ld.date];
          return {
            isoDate: ld.date,
            shortDate: shortDateFromIso(ld.date),
            date: s?.date ?? ld.date,
            revenue: ld.revenue,
            orderCount: ld.orderCount,
            pies: s?.pies ?? 0,
            large: s?.large ?? 0,
            mini: s?.mini ?? 0,
            gf: s?.gf ?? 0,
            note: s?.note,
          };
        });
        setLiveData(merged);
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

  const filteredData: DayData[] = liveData ?? buildStaticData(dateRange);

  const weekRevenue = filteredData.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = filteredData.length > 0 ? Math.round(weekRevenue / filteredData.length) : 0;
  const totalPies = filteredData.reduce((s, d) => s + d.pies, 0);
  const priorWeekRevenue = PRIOR_WEEK_SALES.reduce((s, d) => s + d.revenue, 0);
  const peakDay = filteredData.length > 0
    ? filteredData.reduce((max, d) => d.revenue > max.revenue ? d : max, filteredData[0])
    : null;

  const trend = weekRevenue - priorWeekRevenue;
  const trendPct = priorWeekRevenue > 0 ? ((trend / priorWeekRevenue) * 100).toFixed(1) : "0.0";
  const isUp = trend >= 0;

  const comparisonData = filteredData.map((d, i) => ({
    shortDate: d.shortDate,
    "This Period": d.revenue,
    "Prior Week": PRIOR_WEEK_SALES[SALES_DATA.indexOf(SALES_DATA.find((s) => s.isoDate === d.isoDate)!)]?.revenue ?? 0,
  }));

  const noData = filteredData.length === 0;

  return (
    <div className="space-y-6">
      {/* Live/Static indicator */}
      <div className="flex items-center justify-end gap-2">
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
            Loading live data…
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

      {noData ? (
        <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-12 text-center">
          <p className="text-gray-500 text-sm">No sales data available for the selected date range.</p>
          <p className="text-gray-600 text-xs mt-1">Available data: May 20–26, 2026</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Period Revenue"
              value={formatCurrency(weekRevenue)}
              badge={
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? "+" : "-"}{trendPct}% vs prior week
                </span>
              }
            />
            <StatCard
              label="Avg Daily Revenue"
              value={formatCurrency(avgDaily)}
              badge={<span className="text-xs text-gray-500">{filteredData.length}-day average</span>}
            />
            <StatCard
              label="Total Pies"
              value={totalPies.toLocaleString()}
              badge={
                peakDay ? (
                  <span className="text-xs text-gray-500">Peak: {peakDay.date}</span>
                ) : null
              }
            />
          </div>

          {/* Revenue Chart */}
          <ChartCard title="Daily Revenue" subtitle="Selected period vs prior week">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="thisWeekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="priorWeekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B7280" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="shortDate" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", color: "#9CA3AF", paddingTop: "8px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="Prior Week"
                  stroke="#6B7280"
                  strokeWidth={2}
                  fill="url(#priorWeekGrad)"
                  strokeDasharray="4 2"
                />
                <Area
                  type="monotone"
                  dataKey="This Period"
                  stroke="#C41E3A"
                  strokeWidth={2.5}
                  fill="url(#thisWeekGrad)"
                  dot={{ fill: "#C41E3A", r: 4 }}
                  activeDot={{ r: 6, fill: "#E83A55" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Daily Revenue Bar */}
          <ChartCard title="Revenue by Day" subtitle="Selected period daily breakdown">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="shortDate" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#C41E3A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Table */}
          <ChartCard title="Day-by-Day Breakdown" subtitle="Revenue, pies, and mix">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gallas-dark-border">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Day</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Revenue</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Orders</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Total Pies</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Large</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">Mini</th>
                    <th className="text-right py-2 px-4 text-gray-500 font-medium">GF</th>
                    <th className="py-2 pl-4 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((d, i) => (
                    <tr
                      key={i}
                      className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium text-white">{d.date}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-white">{formatCurrency(d.revenue)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">{isLive ? d.orderCount : "—"}</td>
                      <td className="py-2.5 px-4 text-right text-gray-300">{d.pies}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">{d.large}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">{d.mini}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">{d.gf}</td>
                      <td className="py-2.5 pl-4 text-right">
                        {d.note && (
                          <span className="inline-flex items-center gap-1 text-xs text-gallas-gold bg-gallas-gold/10 px-2 py-0.5 rounded-full">
                            <Zap className="w-2.5 h-2.5" />
                            {d.note}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gallas-dark-border">
                    <td className="py-2.5 pr-4 font-bold text-white">Total</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gallas-red-light">{formatCurrency(weekRevenue)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-300">
                      {isLive ? filteredData.reduce((s, d) => s + d.orderCount, 0) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-white">{totalPies}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-300">{filteredData.reduce((s, d) => s + d.large, 0)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-300">{filteredData.reduce((s, d) => s + d.mini, 0)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-300">{filteredData.reduce((s, d) => s + d.gf, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: React.ReactNode }) {
  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
