"use client";

import { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Globe,
  Plug,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime: string;
  source: "google" | "onebite" | "popmenu" | string;
}

interface RatingBreakdown {
  "5": number;
  "4": number;
  "3": number;
  "2": number;
  "1": number;
}

interface ReviewTrend {
  last30days: number;
  last90days: number;
  allTime: number;
}

interface ReviewsData {
  source: "google" | "static";
  avgRating: number;
  totalReviews: number;
  recentReviews: Review[];
  ratingBreakdown: RatingBreakdown;
  trend: ReviewTrend;
}

// ---------------------------------------------------------------------------
// Sentiment keywords derived from static review corpus
// ---------------------------------------------------------------------------
const POSITIVE_KEYWORDS = ["crust", "sauce", "service", "atmosphere", "fresh", "quick"];
const NEGATIVE_KEYWORDS = ["wait", "parking"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    google: { label: "Google", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    onebite: { label: "One Bite", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    popmenu: { label: "Popmenu", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  };
  const config = map[source] ?? { label: source, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.cls}`}>
      <Globe className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1">
      Static
    </span>
  );
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = parseFloat((current - previous).toFixed(1));
  if (diff > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <TrendingUp className="w-3.5 h-3.5" />
        +{diff} vs 90d
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <TrendingDown className="w-3.5 h-3.5" />
        {diff} vs 90d
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Minus className="w-3.5 h-3.5" />
      Stable
    </span>
  );
}

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-12 flex-shrink-0">
        <span className="text-xs text-gray-400">{stars}</span>
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      </div>
      <div className="flex-1 bg-gallas-dark-border rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{count.toLocaleString()}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 180;
  const displayText = !expanded && isLong ? review.text.slice(0, 180) + "…" : review.text;
  const initial = review.author.charAt(0).toUpperCase();

  return (
    <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gallas-red/20 flex items-center justify-center text-sm font-bold text-gallas-red-light flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{review.author}</p>
            <p className="text-xs text-gray-500">{review.relativeTime || review.date}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StarRating rating={review.rating} />
          <SourceBadge source={review.source} />
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">
        &ldquo;{displayText}&rdquo;
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Read more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ReviewsLive() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  const fetchReviews = (reviewLimit: number) => {
    setLoading(true);
    setError(null);
    fetch(`/.netlify/functions/reviews?limit=${reviewLimit}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: ReviewsData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews(limit);
  }, [limit]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gallas-dark-card rounded-xl border border-gallas-dark-border" />
        <div className="h-40 bg-gallas-dark-card rounded-xl border border-gallas-dark-border" />
        <div className="h-28 bg-gallas-dark-card rounded-xl border border-gallas-dark-border" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-sm text-red-400 mb-2">Failed to load reviews</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => fetchReviews(limit)}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const isLive = data.source === "google" || data.source === "google_places";
  const breakdownTotal = Object.values(data.ratingBreakdown).reduce((s, v) => s + v, 0);
  const trendDiff = parseFloat((data.trend.last30days - data.trend.last90days).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Connect banner — only when not live */}
      {!isLive && (
        <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <Plug className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-300">
              Connect Google Business Profile for live reviews
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Set <code className="text-gray-300">GOOGLE_GBP_ACCESS_TOKEN</code>,{" "}
              <code className="text-gray-300">GOOGLE_GBP_ACCOUNT_ID</code>, and{" "}
              <code className="text-gray-300">GOOGLE_GBP_LOCATION_ID</code> in Netlify environment variables.
              Showing curated static data in the meantime.
            </p>
          </div>
        </div>
      )}

      {/* Rating overview */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-6">
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Overall Rating</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-white">{data.avgRating.toFixed(1)}</span>
              <div className="pb-1">
                <StarRating rating={Math.round(data.avgRating)} size="lg" />
                <p className="text-xs text-gray-500 mt-1">
                  {data.totalReviews.toLocaleString()} reviews
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <LiveBadge isLive={isLive} />
            <TrendIndicator current={data.trend.last30days} previous={data.trend.last90days} />
            <button
              onClick={() => fetchReviews(limit)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Trend stats row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gallas-dark-border">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Last 30 days</p>
            <p
              className={`text-lg font-bold ${
                data.trend.last30days >= data.trend.allTime ? "text-green-400" : "text-red-400"
              }`}
            >
              {data.trend.last30days.toFixed(1)}
            </p>
          </div>
          <div className="text-center border-x border-gallas-dark-border">
            <p className="text-xs text-gray-500 mb-0.5">Last 90 days</p>
            <p className="text-lg font-bold text-white">{data.trend.last90days.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">All time</p>
            <p className="text-lg font-bold text-white">{data.trend.allTime.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Rating Distribution</h3>
        <div className="space-y-2.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={data.ratingBreakdown[String(stars) as keyof RatingBreakdown] ?? 0}
              total={breakdownTotal}
            />
          ))}
        </div>
      </div>

      {/* Sentiment summary */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Sentiment Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Top positive themes</p>
            <div className="flex flex-wrap gap-2">
              {POSITIVE_KEYWORDS.map((kw) => (
                <span
                  key={kw}
                  className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Areas to watch</p>
            <div className="flex flex-wrap gap-2">
              {NEGATIVE_KEYWORDS.map((kw) => (
                <span
                  key={kw}
                  className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Portnoy bump callout */}
        <div className="mt-4 pt-4 border-t border-gallas-dark-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gallas-red flex-shrink-0" />
          <p className="text-xs text-gray-400">
            <span className="text-white font-medium">Portnoy Bump (5/22):</span> Review velocity
            increased significantly after the One Bite feature — 100% positive ratings since the
            review dropped.
          </p>
        </div>
      </div>

      {/* Recent reviews list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Recent Reviews</h3>
          <span className="text-xs text-gray-500">
            Showing {data.recentReviews.length} of {data.totalReviews.toLocaleString()}
          </span>
        </div>

        <div className="space-y-4">
          {data.recentReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Load more */}
        {limit < data.totalReviews && (
          <button
            onClick={() => setLimit((l) => Math.min(l + 10, 50))}
            className="mt-4 w-full py-2.5 text-sm text-gray-400 hover:text-white border border-gallas-dark-border rounded-xl hover:border-gray-600 transition-all"
          >
            Load more reviews
          </button>
        )}
      </div>
    </div>
  );
}
