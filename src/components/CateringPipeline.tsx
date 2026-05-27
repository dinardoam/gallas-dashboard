"use client";

import { CATERING_PIPELINE } from "@/lib/data";
import { Utensils, Calendar, DollarSign, CheckCircle, Clock, Pizza } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
        <CheckCircle className="w-3 h-3" />
        Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

export default function CateringPipeline() {
  const confirmed = CATERING_PIPELINE.filter((c) => c.status === "confirmed");
  const pending = CATERING_PIPELINE.filter((c) => c.status === "pending");
  const totalConfirmedRevenue = confirmed.reduce((s, c) => s + c.revenue, 0);
  const totalPipeline = CATERING_PIPELINE.reduce((s, c) => s + c.revenue, 0);
  const totalPies = CATERING_PIPELINE.reduce((s, c) => s + c.pies, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Confirmed Revenue"
          value={formatCurrency(totalConfirmedRevenue)}
          icon={<CheckCircle className="w-4 h-4" />}
          accent="green"
          sub={`${confirmed.length} events`}
        />
        <MetricCard
          label="Total Pipeline"
          value={formatCurrency(totalPipeline)}
          icon={<DollarSign className="w-4 h-4" />}
          accent="gold"
          sub={`${CATERING_PIPELINE.length} total orders`}
        />
        <MetricCard
          label="Pies in Pipeline"
          value={totalPies.toLocaleString()}
          icon={<Pizza className="w-4 h-4" />}
          accent="red"
          sub="all upcoming events"
        />
        <MetricCard
          label="Pending Review"
          value={pending.length.toString()}
          icon={<Clock className="w-4 h-4" />}
          accent="amber"
          sub={pending.length > 0 ? formatCurrency(pending.reduce((s, c) => s + c.revenue, 0)) + " potential" : "All clear"}
        />
      </div>

      {/* Monkey Media note */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Utensils className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300">Monkey Media (MONKEYSee) Integration</p>
          <p className="text-xs text-gray-400 mt-1">
            Showing upcoming confirmed catering orders. Live data pulls from the Azure SQL catering database when the <code className="text-blue-300 bg-blue-500/10 px-1 rounded">MSSQL_*</code> environment variables are configured.
            Current data is from the most recent Monkey Media analysis.
          </p>
        </div>
      </div>

      {/* Pipeline Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Upcoming Orders</h3>
        {CATERING_PIPELINE.map((order) => (
          <div
            key={order.id}
            className={`bg-gallas-dark-card rounded-xl border p-5 transition-colors ${
              order.status === "confirmed"
                ? "border-gallas-dark-border hover:border-green-500/30"
                : "border-amber-500/20 hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white truncate">{order.client}</h4>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {order.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Pizza className="w-3.5 h-3.5 text-gray-500" />
                    {order.pies} pies
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Utensils className="w-3.5 h-3.5 text-gray-500" />
                    Contact: {order.contact}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-white">{formatCurrency(order.revenue)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(order.revenue / order.pies)}/pie</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Pipeline Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gallas-dark-border">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Client</th>
                <th className="text-left py-2 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Pies</th>
                <th className="text-right py-2 px-4 text-gray-500 font-medium">Revenue</th>
                <th className="text-left py-2 pl-4 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {CATERING_PIPELINE.map((order) => (
                <tr key={order.id} className="border-b border-gallas-dark-border/50 hover:bg-white/2 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-white">{order.client}</td>
                  <td className="py-2.5 px-4 text-gray-400">{order.date}</td>
                  <td className="py-2.5 px-4 text-right text-gray-300">{order.pies}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-white">{formatCurrency(order.revenue)}</td>
                  <td className="py-2.5 pl-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gallas-dark-border">
                <td className="py-2.5 pr-4 font-bold text-white" colSpan={2}>Total Pipeline</td>
                <td className="py-2.5 px-4 text-right font-bold text-white">{totalPies}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gallas-red-light">{formatCurrency(totalPipeline)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, accent, sub }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "red" | "gold" | "green" | "amber";
  sub: string;
}) {
  const styles = {
    red: "bg-gallas-red/15 text-gallas-red-light",
    gold: "bg-gallas-gold/15 text-gallas-gold",
    green: "bg-green-500/15 text-green-400",
    amber: "bg-amber-500/15 text-amber-400",
  };

  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
