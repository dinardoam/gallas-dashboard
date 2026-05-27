"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PRODUCTION_FORECAST, SALES_DATA } from "@/lib/data";
import { Pizza, AlertTriangle, CheckCircle } from "lucide-react";
import type { DateRange } from "./DateRangePicker";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gallas-dark-card border border-gallas-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-300">{p.name}:</span>
            <span className="font-semibold text-white">{p.value}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-gallas-dark-border">
          <span className="text-xs text-gray-500">
            Total: {payload.reduce((s: number, p: any) => s + (p.value || 0), 0)} pies
          </span>
        </div>
      </div>
    );
  }
  return null;
};

function PrepGuide({ day }: { day: typeof PRODUCTION_FORECAST[0] }) {
  const doughBalls = Math.ceil(day.pies * 1.05);
  const largePercent = Math.round((day.large / day.pies) * 100);
  const miniPercent = Math.round((day.mini / day.pies) * 100);
  const gfPercent = Math.round((day.gf / day.pies) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Pizza className="w-4 h-4 text-gallas-red" />
        <h4 className="text-sm font-semibold text-white">Prep Recommendation: {day.date}</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PrepCard label="Total Dough Balls" value={doughBalls} unit="balls" accent="red" note="+5% buffer" />
        <PrepCard label="Large (16&quot;)" value={day.large} unit="doughs" accent="default" note={`${largePercent}% of mix`} />
        <PrepCard label="Mini (10&quot;)" value={day.mini} unit="doughs" accent="default" note={`${miniPercent}% of mix`} />
        <PrepCard label="GF Crusts" value={day.gf} unit="shells" accent="gold" note={`${gfPercent}% of mix`} />
      </div>
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300">
          Forecast is based on rolling 4-week average for {day.date.split(" ")[0]}s. Adjust up if weather is favorable or you have events scheduled.
          {day.date === "Thu 5/29" && " Thursday has historically been a spike day — consider extra prep."}
        </p>
      </div>
    </div>
  );
}

function PrepCard({ label, value, unit, accent, note }: {
  label: string;
  value: number;
  unit: string;
  accent: "red" | "gold" | "default";
  note: string;
}) {
  const colors = {
    red: "border-gallas-red/30 bg-gallas-red/5",
    gold: "border-gallas-gold/30 bg-gallas-gold/5",
    default: "border-gallas-dark-border bg-gallas-dark-muted/20",
  };
  const textColors = {
    red: "text-gallas-red-light",
    gold: "text-gallas-gold",
    default: "text-white",
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[accent]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${textColors[accent]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{unit} · {note}</p>
    </div>
  );
}

interface LivePizzaDay {
  date: string;
  large: number;
  mini: number;
  gf: number;
  total: number;
}

interface PizzaProductionProps {
  dateRange: DateRange;
}

function shortDateFromIso(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function PizzaProduction({ dateRange }: PizzaProductionProps) {
  const [liveActuals, setLiveActuals] = useState<LivePizzaDay[] | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLiveActuals(null);
    setIsLive(false);

    fetch(`/.netlify/functions/clover-pizza?startDate=${dateRange.from}&endDate=${dateRange.to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setLiveActuals(json.days || []);
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

  // Forecast
  const filteredForecast = PRODUCTION_FORECAST.filter(
    (d) => d.isoDate >= dateRange.from && d.isoDate <= dateRange.to
  );
  const forecastToShow = filteredForecast.length > 0 ? filteredForecast : PRODUCTION_FORECAST.slice(0, 7);
  const upcomingDay = PRODUCTION_FORECAST[0];
  const showingUpcoming = filteredForecast.length === 0;

  // Actuals: prefer live data, fall back to SALES_DATA
  const staticActuals = SALES_DATA.filter(
    (d) => d.isoDate >= dateRange.from && d.isoDate <= dateRange.to
  );

  const actualsToShow: Array<{ date: string; shortDate: string; isoDate?: string; large: number; mini: number; gf: number; total?: number; pies?: number }> =
    isLive && liveActuals
      ? liveActuals.map((d) => ({
          date: d.date,
          shortDate: shortDateFromIso(d.date),
          large: d.large,
          mini: d.mini,
          gf: d.gf,
          total: d.total,
        }))
      : staticActuals.map((d) => ({
          date: d.date,
          shortDate: d.shortDate,
          isoDate: d.isoDate,
          large: d.large,
          mini: d.mini,
          gf: d.gf,
          pies: d.pies,
        }));

  const hasActuals = actualsToShow.length > 0 && actualsToShow.some((d) => (d.total ?? d.pies ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Prep Guide for Next Day */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <PrepGuide day={upcomingDay} />
      </div>

      {/* Production Forecast Chart */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">
            {showingUpcoming ? "Upcoming 7-Day Production Forecast" : "Production Forecast — Selected Range"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {showingUpcoming
              ? "May 27 – June 2 (no forecast data in selected range)"
              : `${forecastToShow[0]?.date} – ${forecastToShow[forecastToShow.length - 1]?.date} · Pies by size`}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={forecastToShow} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis dataKey="shortDate" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#9CA3AF", paddingTop: "8px" }} iconType="circle" iconSize={8} />
            <Bar dataKey="large" name="Large (16&quot;)" stackId="a" fill="#C41E3A" />
            <Bar dataKey="mini" name="Mini (10&quot;)" stackId="a" fill="#E83A55" />
            <Bar dataKey="gf" name="Gluten-Free" stackId="a" fill="#D4A853" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Detailed Forecast</h3>
          <p className="text-xs text-gray-500 mt-0.5">Recommended dough prep by day</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gallas-dark-border">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Day</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Total Pies</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Large (16&quot;)</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Mini (10&quot;)</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">GF Shells</th>
                <th className="text-right py-2 pl-4 text-gray-500 font-medium">Dough Balls</th>
              </tr>
            </thead>
            <tbody>
              {forecastToShow.map((d, i) => {
                const isNext = i === 0 && showingUpcoming;
                return (
                  <tr
                    key={i}
                    className={`border-b border-gallas-dark-border/50 transition-colors ${isNext ? "bg-gallas-red/5" : "hover:bg-white/2"}`}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isNext ? "text-gallas-red-light" : "text-white"}`}>{d.date}</span>
                        {isNext && (
                          <span className="text-xs bg-gallas-red text-white px-1.5 py-0.5 rounded font-medium">NEXT</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-white">{d.pies}</td>
                    <td className="py-2.5 px-4 text-right text-gray-300">{d.large}</td>
                    <td className="py-2.5 px-4 text-right text-gray-300">{d.mini}</td>
                    <td className="py-2.5 px-4 text-right text-gray-400">{d.gf}</td>
                    <td className="py-2.5 pl-4 text-right font-medium text-gallas-gold">{Math.ceil(d.pies * 1.05)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actual Production for Selected Range */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Actual Production — Selected Range</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasActuals
                ? `${actualsToShow[0]?.date} – ${actualsToShow[actualsToShow.length - 1]?.date}`
                : "No actuals in selected range"}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            {hasActuals && (
              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                <CheckCircle className="w-3 h-3" />
                Completed
              </div>
            )}
          </div>
        </div>
        {!hasActuals ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No actual production data in selected range. Available: May 20–26, 2026.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gallas-dark-border">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Day</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">Total</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">Large</th>
                  <th className="text-right py-2 px-4 text-gray-500 font-medium">Mini</th>
                  <th className="text-right py-2 pl-4 text-gray-500 font-medium">GF</th>
                </tr>
              </thead>
              <tbody>
                {actualsToShow.map((d, i) => (
                  <tr key={i} className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-300">{d.date}</td>
                    <td className="py-2 px-4 text-right font-semibold text-white">{d.total ?? d.pies ?? 0}</td>
                    <td className="py-2 px-4 text-right text-gray-400">{d.large}</td>
                    <td className="py-2 px-4 text-right text-gray-400">{d.mini}</td>
                    <td className="py-2 pl-4 text-right text-gray-400">{d.gf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
