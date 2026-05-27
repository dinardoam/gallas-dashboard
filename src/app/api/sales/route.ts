import { NextResponse } from "next/server";
import { SALES_DATA, PRIOR_WEEK_SALES } from "@/lib/data";

export async function GET() {
  // If Clover API key is configured, fetch live data
  const cloverKey = process.env.CLOVER_API_KEY;
  const merchantId = process.env.CLOVER_MERCHANT_ID;

  if (cloverKey && merchantId) {
    try {
      // Fetch last 7 days of orders from Clover
      const end = Date.now();
      const start = end - 7 * 24 * 60 * 60 * 1000;

      const res = await fetch(
        `https://api.clover.com/v3/merchants/${merchantId}/orders?filter=createdTime>${start}&filter=createdTime<${end}&expand=lineItems`,
        {
          headers: {
            Authorization: `Bearer ${cloverKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          source: "live",
          data: data.elements ?? [],
        });
      }
    } catch (err) {
      console.error("Clover API error:", err);
    }
  }

  // Fallback to static data
  return NextResponse.json({
    source: "static",
    salesData: SALES_DATA,
    priorWeekData: PRIOR_WEEK_SALES,
  });
}
