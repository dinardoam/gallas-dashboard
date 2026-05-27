"use client";

import { REVIEWS_DATA } from "@/lib/data";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
        <ThumbsUp className="w-3 h-3" />
        Positive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-full">
      Neutral
    </span>
  );
}

export default function ReviewsSection() {
  const totalReviews = REVIEWS_DATA.length;
  const avgRating = REVIEWS_DATA.reduce((s, r) => s + r.rating, 0) / totalReviews;
  const positiveCount = REVIEWS_DATA.filter((r) => r.sentiment === "positive").length;
  const positivePercent = Math.round((positiveCount / totalReviews) * 100);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
          <p className="text-xs text-gray-500 mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-white">{avgRating.toFixed(1)}</p>
            <div>
              <StarRating rating={Math.round(avgRating)} />
              <p className="text-xs text-gray-500 mt-0.5">out of 5</p>
            </div>
          </div>
        </div>
        <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
          <p className="text-xs text-gray-500 mb-1">Positive Sentiment</p>
          <p className="text-3xl font-bold text-green-400">{positivePercent}%</p>
          <p className="text-xs text-gray-500 mt-1">{positiveCount} of {totalReviews} recent reviews</p>
        </div>
        <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-4">
          <p className="text-xs text-gray-500 mb-1">Portnoy Bump</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-6 h-6 text-gallas-red" />
            <div>
              <p className="text-sm font-bold text-white">Review velocity up</p>
              <p className="text-xs text-gray-500">Post One Bite spike (5/22)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-300">Google Reviews Note</p>
          <p className="text-xs text-gray-400 mt-1">
            Showing 4 most recent curated reviews. To see your full live review feed, connect a Google Places API key in your environment settings.
            Current overall profile: <strong className="text-white">100% positive</strong> since the Portnoy One Bite review on May 22.
          </p>
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Recent Reviews</h3>
        {REVIEWS_DATA.map((review) => (
          <div key={review.id} className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gallas-red/20 flex items-center justify-center text-sm font-bold text-gallas-red-light flex-shrink-0">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{review.author}</p>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <StarRating rating={review.rating} />
                <SentimentBadge sentiment={review.sentiment} />
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">&ldquo;{review.text}&rdquo;</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-600 bg-gray-700/30 px-2 py-0.5 rounded">{review.platform}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rating Distribution */}
      <div className="bg-gallas-dark-card rounded-xl border border-gallas-dark-border p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = REVIEWS_DATA.filter((r) => r.rating === stars).length;
            const pct = (count / totalReviews) * 100;
            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 flex-shrink-0">
                  <span className="text-xs text-gray-400">{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 bg-gallas-dark-border rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
