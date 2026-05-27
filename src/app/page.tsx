"use client";

import { useState, useEffect } from "react";
import SalesOverview from "@/components/SalesOverview";
import PizzaProduction from "@/components/PizzaProduction";
import OnlineOrders from "@/components/OnlineOrders";
import ReviewsSection from "@/components/ReviewsSection";
import CateringPipeline from "@/components/CateringPipeline";
import DateRangePicker, { getDefaultDateRange } from "@/components/DateRangePicker";
import type { DateRange } from "@/components/DateRangePicker";
import { SALES_DATA, PRIOR_WEEK_SALES } from "@/lib/data";
import { TrendingUp, TrendingDown, Pizza, DollarSign, BarChart3, ShoppingBag, Star, Utensils } from "lucide-react";

const tabs = [
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "production", label: "Production", icon: Pizza },
  { id: "online", label: "Online Orders", icon: ShoppingBag },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "catering", label: "Catering", icon: Utensils },
];

// Tabs that use date range filtering
const DATE_FILTERED_TABS = new Set(["sales", "production"]);

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatPercent(a: number, b: number) {
  const pct = ((a - b) / b) * 100;
  return { value: Math.abs(pct).toFixed(1), up: pct >= 0 };
}

interface KpiData {
  weekRevenue: number | null;
  avgDaily: number | null;
  totalPies: number;
  peakDay: { date: string; revenue: number; note?: string } | null;
  isLive: boolean;
}

function computeStaticKpis(dateRange: DateRange): KpiData {
  const filtered = SALES_DATA.filter(
    (d) => d.isoDate >= dateRange.from && d.isoDate <= dateRange.to && d.revenue > 0
  );
  if (filtered.length === 0) {
    return { weekRevenue: null, avgDaily: null, totalPies: 0, peakDay: null, isLive: false };
  }
  const weekRevenue = filtered.reduce((s, d) => s + d.revenue, 0);
  return {
    weekRevenue,
    avgDaily: Math.round(weekRevenue / filtered.length),
    totalPies: filtered.reduce((s, d) => s + d.pies, 0),
    peakDay: filtered.reduce((max, d) => d.revenue > max.revenue ? d : max, filtered[0]),
    isLive: false,
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [kpis, setKpis] = useState<KpiData>(() => computeStaticKpis(getDefaultDateRange()));

  // Fetch live Clover data for KPI header cards
  useEffect(() => {
    let cancelled = false;
    // Reset to static while loading
    setKpis(computeStaticKpis(dateRange));

    fetch(`/.netlify/functions/clover-sales?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const days: Array<{ date: string; revenue: number; orderCount: number }> = json.days || [];
        if (days.length === 0) return;

        const staticMap = Object.fromEntries(SALES_DATA.map((d) => [d.isoDate, d]));
        const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);
        const avgDaily = days.length > 0 ? Math.round(weekRevenue / days.length) : 0;
        const totalPies = days.reduce((s, d) => s + (staticMap[d.date]?.pies ?? 0), 0);
        const peakRaw = days.reduce((max, d) => d.revenue > max.revenue ? d : max, days[0]);
        const peakStatic = staticMap[peakRaw.date];

        setKpis({
          weekRevenue,
          avgDaily,
          totalPies,
          peakDay: {
            date: peakStatic?.date ?? peakRaw.date,
            revenue: peakRaw.revenue,
            note: peakStatic?.note,
          },
          isLive: true,
        });
      })
      .catch(() => {
        // On error, keep static data but mark not live — values stay as static
        if (!cancelled) {
          setKpis((prev) => ({ ...prev, isLive: false }));
        }
      });

    return () => { cancelled = true; };
  }, [dateRange.from, dateRange.to]);

  const priorWeekRevenue = PRIOR_WEEK_SALES.reduce((s, d) => s + d.revenue, 0);
  const trend = kpis.weekRevenue !== null
    ? formatPercent(kpis.weekRevenue, priorWeekRevenue)
    : null;
  const showDatePicker = DATE_FILTERED_TABS.has(activeTab);

  return (
    <div className="min-h-screen bg-gallas-dark text-white">
      {/* Header */}
      <header className="border-b border-gallas-dark-border bg-gallas-dark-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gallas-red rounded-lg flex items-center justify-center flex-shrink-0">
                <Pizza className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Galla&apos;s Pizza &amp; Tavern</h1>
                <p className="text-xs text-gray-500 leading-tight">Operations Dashboard</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </span>
              <span>Week of May 20–26, 2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="border-b border-gallas-dark-border bg-gallas-dark-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label={showDatePicker ? "Period Revenue" : "Week Revenue"}
              value={kpis.weekRevenue !== null ? formatCurrency(kpis.weekRevenue) : "—"}
              sub={
                trend ? (
                  <span className={`flex items-center gap-1 text-xs font-medium ${trend.up ? "text-green-400" : "text-red-400"}`}>
                    {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.value}% vs prior week
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">No data in range</span>
                )
              }
              icon={<DollarSign className="w-4 h-4" />}
              accent="red"
            />
            <KpiCard
              label="Avg Daily Revenue"
              value={kpis.avgDaily !== null ? formatCurrency(kpis.avgDaily) : "—"}
              sub={<span className="text-xs text-gray-500">{showDatePicker ? "filtered avg" : "7-day average"}</span>}
              icon={<BarChart3 className="w-4 h-4" />}
              accent="gold"
            />
            <KpiCard
              label="Total Pies Sold"
              value={kpis.totalPies.toLocaleString()}
              sub={<span className="text-xs text-gray-500">{showDatePicker ? "filtered range" : "This week"}</span>}
              icon={<Pizza className="w-4 h-4" />}
              accent="red"
            />
            <KpiCard
              label="Peak Day"
              value={kpis.peakDay ? formatCurrency(kpis.peakDay.revenue) : "—"}
              sub={
                kpis.peakDay ? (
                  <span className="text-xs text-gray-500">
                    {kpis.peakDay.date}
                    {kpis.peakDay.note ? ` (${kpis.peakDay.note})` : ""}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">No data in range</span>
                )
              }
              icon={<TrendingUp className="w-4 h-4" />}
              accent="gold"
            />
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="border-b border-gallas-dark-border bg-gallas-dark-card/30 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-1" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0
                    ${active
                      ? "bg-gallas-red text-white shadow-lg shadow-gallas-red/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Range Picker — shown only for filterable tabs */}
        {showDatePicker && (
          <div className="mb-6">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        )}

        {activeTab === "sales" && <SalesOverview dateRange={dateRange} />}
        {activeTab === "production" && <PizzaProduction dateRange={dateRange} />}
        {activeTab === "online" && <OnlineOrders />}
        {activeTab === "reviews" && <ReviewsSection />}
        {activeTab === "catering" && <CateringPipeline />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gallas-dark-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-600">
            Galla&apos;s Pizza &amp; Tavern Operations Dashboard · Built by Max · Data sourced from Clover POS, Popmenu, Monkey Media
          </p>
        </div>
      </footer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  accent: "red" | "gold";
}) {
  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <div className="mt-1">{sub}</div>
        </div>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            accent === "red"
              ? "bg-gallas-red/15 text-gallas-red-light"
              : "bg-gallas-gold/15 text-gallas-gold"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
