import { NextResponse } from "next/server";
import { REVIEWS_DATA } from "@/lib/data";

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GALLAS_PLACE_ID;

  if (apiKey && placeId) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.result?.reviews) {
          return NextResponse.json({
            source: "live",
            reviews: data.result.reviews,
            overallRating: data.result.rating,
            totalReviews: data.result.user_ratings_total,
          });
        }
      }
    } catch (err) {
      console.error("Google Places API error:", err);
    }
  }

  return NextResponse.json({
    source: "static",
    reviews: REVIEWS_DATA,
    overallRating: 5.0,
    totalReviews: REVIEWS_DATA.length,
  });
}
