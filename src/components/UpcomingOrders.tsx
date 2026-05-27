"use client";

import { UPCOMING_ORDERS } from "@/lib/data";
import { Clock, AlertTriangle, Flame, MapPin, Phone, ShoppingBag, Truck } from "lucide-react";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function minutesUntil(iso: string): number {
  // Dashboard "now" = 2026-05-26T17:00:00 (5pm)
  const now = new Date("2026-05-26T17:00:00");
  const due = new Date(iso);
  return Math.round((due.getTime() - now.getTime()) / 60000);
}

type AlertLevel = "critical" | "warning" | "normal" | "future";

function getAlertLevel(order: typeof UPCOMING_ORDERS[0]): AlertLevel {
  const mins = minutesUntil(order.scheduledFor);
  const isLarge = order.total > 150 || order.pies > 3;
  if (mins <= 120 && isLarge) return "critical";
  if (isLarge) return "warning";
  if (mins <= 120) return "warning";
  if (mins < 0) return "future"; // already past (for demo)
  return "normal";
}

const levelStyles: Record<AlertLevel, { card: string; badge: string; badgeText: string; timeText: string }> = {
  critical: {
    card: "border-red-500/50 bg-red-500/5",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    badgeText: "LARGE · DUE SOON",
    timeText: "text-red-400 font-bold",
  },
  warning: {
    card: "border-orange-500/40 bg-orange-500/5",
    badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    badgeText: "LARGE ORDER",
    timeText: "text-orange-400 font-semibold",
  },
  normal: {
    card: "border-gallas-dark-border bg-gallas-dark-card",
    badge: "",
    badgeText: "",
    timeText: "text-white",
  },
  future: {
    card: "border-gallas-dark-border/60 bg-gallas-dark-card/60",
    badge: "bg-gray-500/20 text-gray-400 border border-gray-500/20",
    badgeText: "TOMORROW",
    timeText: "text-gray-300",
  },
};

function OrderCard({ order }: { order: typeof UPCOMING_ORDERS[0] }) {
  const level = getAlertLevel(order);
  const styles = levelStyles[level];
  const mins = minutesUntil(order.scheduledFor);
  const firesMins = mins - 45;
  const isToday = order.scheduledFor.startsWith("2026-05-26");

  return (
    <div className={`rounded-xl border p-4 transition-all ${styles.card}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Left: customer + order ID */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{order.customer}</span>
            {styles.badgeText && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                {(level === "critical" || level === "warning") && <Flame className="w-3 h-3" />}
                {styles.badgeText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="font-mono">{order.id}</span>
            <span className="flex items-center gap-1">
              {order.type === "delivery" ? <Truck className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {order.type === "pickup" ? "Pickup" : "Delivery"}
            </span>
            {order.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.phone}
              </span>
            )}
          </div>
        </div>

        {/* Right: time + total */}
        <div className="text-right flex-shrink-0">
          <div className={`text-base font-bold ${styles.timeText}`}>
            {formatTime(order.scheduledFor)}
          </div>
          {!isToday && (
            <div className="text-xs text-gray-500">{formatDate(order.scheduledFor)}</div>
          )}
          <div className="text-sm font-semibold text-gallas-gold mt-0.5">
            {formatCurrency(order.total)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="text-sm text-gray-300 mb-2">
        <span className="text-gray-500 text-xs mr-1">Items:</span>
        {order.items}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="flex items-start gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          {order.notes}
        </div>
      )}

      {/* KDS fire time */}
      {isToday && mins > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>
            KDS fires at{" "}
            <span className={firesMins <= 30 ? "text-orange-400 font-medium" : "text-gray-400"}>
              {formatTime(new Date(new Date(order.scheduledFor).getTime() - 45 * 60000).toISOString())}
            </span>
            {" "}({mins} min until due)
          </span>
        </div>
      )}
    </div>
  );
}

export default function UpcomingOrders() {
  const criticalOrders = UPCOMING_ORDERS.filter((o) => {
    const level = getAlertLevel(o);
    return level === "critical" || level === "warning";
  });
  const normalOrders = UPCOMING_ORDERS.filter((o) => {
    const level = getAlertLevel(o);
    return level === "normal" || level === "future";
  });
  const totalRevenue = UPCOMING_ORDERS.reduce((s, o) => s + o.total, 0);
  const totalPies = UPCOMING_ORDERS.reduce((s, o) => s + o.pies, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Upcoming Orders</h3>
          <span className="text-xs bg-gallas-dark-muted text-gray-300 px-2 py-0.5 rounded-full font-medium">
            Next 24 hrs
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{UPCOMING_ORDERS.length} orders</span>
          <span className="text-gallas-gold font-semibold">{formatCurrency(totalRevenue)}</span>
          <span>{totalPies} pies</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-red-500/50 bg-red-500/10 flex-shrink-0" />
          Large order (&gt;$150 or &gt;3 pies) due within 2hrs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-orange-500/40 bg-orange-500/10 flex-shrink-0" />
          Large order (any time)
        </span>
      </div>

      {/* Critical / Warning orders first */}
      {criticalOrders.length > 0 && (
        <div className="space-y-2">
          {criticalOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Divider if mixed */}
      {criticalOrders.length > 0 && normalOrders.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gallas-dark-border" />
          <span className="text-xs text-gray-600">Standard Orders</span>
          <div className="flex-1 h-px bg-gallas-dark-border" />
        </div>
      )}

      {/* Normal orders */}
      <div className="space-y-2">
        {normalOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Placeholder notice */}
      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
        <ShoppingBag className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
        <span>
          <strong>Placeholder data.</strong> Live Popmenu order feed coming soon. Orders will auto-refresh and alert when large orders come in after hours.
        </span>
      </div>
    </div>
  );
}
