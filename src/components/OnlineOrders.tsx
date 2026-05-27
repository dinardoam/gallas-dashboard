"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { POPMENU_DATA } from "@/lib/data";
import { ShoppingBag, Users, DollarSign, TrendingUp } from "lucide-react";
import UpcomingOrders from "./UpcomingOrders";

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
              {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function OnlineOrders() {
  return (
    <div className="space-y-6">
      {/* UPCOMING ORDERS — most critical operational view */}
      <div className="bg-gallas-dark-card rounded-xl border-2 border-gallas-red/40 p-5 shadow-lg shadow-gallas-red/5">
        <UpcomingOrders />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gallas-dark-border" />
        <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Historical Channel Data</span>
        <div className="flex-1 h-px bg-gallas-dark-border" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="30-Day Orders"
          value={POPMENU_DATA.totalOrders.toLocaleString()}
          icon={<ShoppingBag className="w-4 h-4" />}
          accent="red"
          sub="via Popmenu"
        />
        <MetricCard
          label="30-Day Revenue"
          value={formatCurrency(POPMENU_DATA.totalRevenue)}
          icon={<DollarSign className="w-4 h-4" />}
          accent="gold"
          sub="online channel"
        />
        <MetricCard
          label="Avg Order Value"
          value={`$${POPMENU_DATA.avgOrderValue.toFixed(2)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="red"
          sub="per transaction"
        />
        <MetricCard
          label="Popmenu Followers"
          value={POPMENU_DATA.followers.toLocaleString()}
          icon={<Users className="w-4 h-4" />}
          accent="gold"
          sub="active subscribers"
        />
      </div>

      {/* Daily Orders Chart */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Daily Online Orders</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 7 days — order count</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={POPMENU_DATA.dailyOrders} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" name="Orders" fill="#C41E3A" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Daily Online Revenue</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 7 days — online channel revenue</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={POPMENU_DATA.dailyOrders} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#D4A853"
              strokeWidth={2.5}
              dot={{ fill: "#D4A853", r: 4 }}
              activeDot={{ r: 6, fill: "#E0BE7A" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Daily Online Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Orders, revenue, and avg ticket</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gallas-dark-border">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Orders</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Revenue</th>
                <th className="text-right py-2 pl-4 text-gray-500 font-medium">Avg Ticket</th>
              </tr>
            </thead>
            <tbody>
              {POPMENU_DATA.dailyOrders.map((d, i) => (
                <tr key={i} className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-white">{d.date}</td>
                  <td className="py-2.5 px-4 text-right text-gray-300">{d.orders}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-white">{formatCurrency(d.revenue)}</td>
                  <td className="py-2.5 pl-4 text-right text-gallas-gold">{formatCurrency(d.revenue / d.orders)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gallas-dark-border">
                <td className="py-2.5 pr-4 font-bold text-white">Week Total</td>
                <td className="py-2.5 px-4 text-right font-bold text-white">
                  {POPMENU_DATA.dailyOrders.reduce((s, d) => s + d.orders, 0)}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-gallas-red-light">
                  {formatCurrency(POPMENU_DATA.dailyOrders.reduce((s, d) => s + d.revenue, 0))}
                </td>
                <td className="py-2.5 pl-4 text-right font-bold text-gallas-gold">
                  {formatCurrency(
                    POPMENU_DATA.dailyOrders.reduce((s, d) => s + d.revenue, 0) /
                    POPMENU_DATA.dailyOrders.reduce((s, d) => s + d.orders, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Popmenu context */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Popmenu Channel Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">30-Day Total Orders</span>
              <span className="font-semibold text-white">{POPMENU_DATA.totalOrders.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">30-Day Revenue</span>
              <span className="font-semibold text-white">{formatCurrency(POPMENU_DATA.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average Order Value</span>
              <span className="font-semibold text-white">${POPMENU_DATA.avgOrderValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Popmenu Followers</span>
              <span className="font-semibold text-white">{POPMENU_DATA.followers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Online Orders / Day (avg)</span>
              <span className="font-semibold text-white">{(POPMENU_DATA.totalOrders / 30).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Online Rev / Day (avg)</span>
              <span className="font-semibold text-white">{formatCurrency(POPMENU_DATA.totalRevenue / 30)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, accent, sub }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "red" | "gold";
  sub: string;
}) {
  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          accent === "red" ? "bg-gallas-red/15 text-gallas-red-light" : "bg-gallas-gold/15 text-gallas-gold"
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
