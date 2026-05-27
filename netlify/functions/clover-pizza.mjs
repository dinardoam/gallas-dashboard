const MID = "3NMZM0YN49QQ1";
const BASE = `https://api.clover.com/v3/merchants/${MID}`;

function isoToEpochMs(isoDate) {
  return new Date(isoDate + "T00:00:00Z").getTime();
}

function epochMsToIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// Classify a line item name into pizza size bucket
function classifyPizza(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  // Gluten-free check first (takes priority)
  if (n.includes("gf") || n.includes("gluten")) return "gf";
  // Large / 16"
  if (n.includes("large") || n.includes('16"') || n.includes("16 inch")) return "large";
  // Mini / 10"
  if (n.includes("mini") || n.includes('10"') || n.includes("10 inch") || n.includes("small")) return "mini";
  // Generic "pizza" or "pie" with no size — skip (can't classify)
  return null;
}

async function fetchAllOrders(apiKey, startMs, endMs) {
  const orders = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${BASE}/orders?filter=clientCreatedTime>=${startMs}&filter=clientCreatedTime<${endMs}&limit=${limit}&offset=${offset}&expand=lineItems`;
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
    const endMs = isoToEpochMs(endDate) + 86400000;

    const orders = await fetchAllOrders(apiKey, startMs, endMs);

    // Group pizza line items by date
    const dayMap = {};
    for (const order of orders) {
      const dateKey = epochMsToIsoDate(order.clientCreatedTime);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, large: 0, mini: 0, gf: 0, total: 0 };
      }
      const lineItems = order.lineItems?.elements || [];
      for (const item of lineItems) {
        const bucket = classifyPizza(item.name);
        if (bucket) {
          dayMap[dateKey][bucket] += 1;
          dayMap[dateKey].total += 1;
        }
      }
    }

    // Build sorted days array covering the full requested range
    const days = [];
    let cursor = startMs;
    while (cursor < endMs) {
      const dateKey = epochMsToIsoDate(cursor);
      days.push(dayMap[dateKey] || { date: dateKey, large: 0, mini: 0, gf: 0, total: 0 });
      cursor += 86400000;
    }

    return new Response(
      JSON.stringify({ days }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
