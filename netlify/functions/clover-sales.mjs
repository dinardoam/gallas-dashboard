const MID = "3NMZM0YN49QQ1";
const BASE = `https://api.clover.com/v3/merchants/${MID}`;

function isoToEpochMs(isoDate) {
  // Parse as UTC midnight
  return new Date(isoDate + "T00:00:00Z").getTime();
}

function epochMsToIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchAllOrders(apiKey, startMs, endMs) {
  const orders = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${BASE}/orders?filter=clientCreatedTime>=${startMs}&filter=clientCreatedTime<${endMs}&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`Clover API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const elements = data.elements || [];
    orders.push(...elements);
    if (elements.length < limit) break;
    offset += limit;
  }

  return orders;
}

export default async function handler(req) {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY || "3d8c1771-38b6-d9b4-c195-692f1b32d071";

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return new Response(
      JSON.stringify({ error: "startDate and endDate query params are required (ISO format: YYYY-MM-DD)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const startMs = isoToEpochMs(startDate);
    // endDate is inclusive — fetch through end of that day
    const endMs = isoToEpochMs(endDate) + 86400000;

    const orders = await fetchAllOrders(apiKey, startMs, endMs);

    // Group by date
    const dayMap = {};
    for (const order of orders) {
      const dateKey = epochMsToIsoDate(order.clientCreatedTime);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, revenue: 0, orderCount: 0 };
      }
      dayMap[dateKey].revenue += (order.total || 0) / 100;
      dayMap[dateKey].orderCount += 1;
    }

    // Build sorted days array covering the full requested range
    const days = [];
    let cursor = startMs;
    while (cursor < endMs) {
      const dateKey = epochMsToIsoDate(cursor);
      days.push(dayMap[dateKey] || { date: dateKey, revenue: 0, orderCount: 0 });
      cursor += 86400000;
    }

    const total = days.reduce((s, d) => s + d.revenue, 0);
    const avgDaily = days.length > 0 ? total / days.length : 0;

    return new Response(
      JSON.stringify({ days, total: Math.round(total * 100) / 100, avgDaily: Math.round(avgDaily * 100) / 100 }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
