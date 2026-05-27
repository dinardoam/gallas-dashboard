"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export type DateRange = {
  from: string; // ISO date string YYYY-MM-DD
  to: string;
  preset: "today" | "7d" | "30d" | "month" | "custom";
};

const PRESETS: { id: DateRange["preset"]; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom" },
];

function getPresetRange(preset: DateRange["preset"]): { from: string; to: string } {
  // Always use real current date in Eastern timezone
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const today = new Date(todayStr + "T12:00:00");

  if (preset === "today") {
    return { from: todayStr, to: todayStr };
  }
  if (preset === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: from.toISOString().split("T")[0], to: todayStr };
  }
  if (preset === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: from.toISOString().split("T")[0], to: todayStr };
  }
  if (preset === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: from.toISOString().split("T")[0], to: todayStr };
  }
  // custom — return current week as default
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  return { from: from.toISOString().split("T")[0], to: todayStr };
}

export function getDefaultDateRange(): DateRange {
  const preset = "7d";
  return { ...getPresetRange(preset), preset };
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");

  function handlePreset(preset: DateRange["preset"]) {
    if (preset === "custom") {
      setShowCustom(true);
      onChange({ from: value.from, to: value.to, preset: "custom" });
    } else {
      setShowCustom(false);
      const range = getPresetRange(preset);
      onChange({ ...range, preset });
    }
  }

  function handleCustomFrom(from: string) {
    onChange({ from, to: value.to, preset: "custom" });
  }

  function handleCustomTo(to: string) {
    onChange({ from: value.from, to, preset: "custom" });
  }

  return (
    <div className="bg-gallas-dark-card border border-gallas-dark-border rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
          <CalendarDays className="w-4 h-4" />
          <span className="font-medium text-gray-300">Date Range</span>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                value.preset === p.id
                  ? "bg-gallas-red text-white shadow-sm shadow-gallas-red/30"
                  : "text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {showCustom && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={value.from}
              onChange={(e) => handleCustomFrom(e.target.value)}
              className="bg-gallas-dark-muted border border-gallas-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gallas-red transition-colors"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={value.to}
              onChange={(e) => handleCustomTo(e.target.value)}
              className="bg-gallas-dark-muted border border-gallas-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gallas-red transition-colors"
            />
          </div>
        )}

        {/* Summary label */}
        {!showCustom && (
          <span className="text-xs text-gray-500 ml-auto">
            {value.from === value.to ? value.from : `${value.from} → ${value.to}`}
          </span>
        )}
      </div>
    </div>
  );
}
