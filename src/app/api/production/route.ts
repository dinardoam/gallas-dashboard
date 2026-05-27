import { NextResponse } from "next/server";
import { PRODUCTION_FORECAST } from "@/lib/data";

export async function GET() {
  // Production forecast is computed from rolling averages
  // When Clover is connected, this would be calculated from historical sales
  return NextResponse.json({
    source: "forecast",
    forecast: PRODUCTION_FORECAST,
  });
}
