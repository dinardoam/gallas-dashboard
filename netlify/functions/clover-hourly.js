const https = require('https');

function fetchPage(mid, apiKey, start, end, offset) {
  return new Promise((resolve, reject) => {
    const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&offset=${offset}&orderBy=clientCreatedTime+ASC`;
    const req = https.get(url, { headers: { Authorization: `Bearer ${apiKey}` } }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

async function fetchAllOrders(mid, apiKey, start, end) {
  const orders = [];
  let offset = 0;
  while (true) {
    const data = await fetchPage(mid, apiKey, start, end, offset);
    const batch = data.elements || [];
    orders.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return orders;
}

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(`${startDate}T00:00:00-04:00`).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(`${endDate}T00:00:00-04:00`).getTime() + 86400000 : Date.now();

  const allOrders = await fetchAllOrders(mid, apiKey, start, end);
  const orders = allOrders.filter(o => (o.total || 0) > 0);

  // Group by hour in Eastern time
  const hourMap = {};
  orders.forEach(order => {
    const d = new Date(order.clientCreatedTime);
    const easternHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      }).format(d)
    );
    const h = easternHour % 24;
    if (!hourMap[h]) hourMap[h] = { hour: h, revenue: 0, orders: 0 };
    hourMap[h].revenue += ((order.total || 0) - (order.taxAmount || 0)) / 100;
    hourMap[h].orders += 1;
  });

  function hourLabel(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  const hours = Object.values(hourMap)
    .sort((a, b) => a.hour - b.hour)
    .map(h => ({
      hour: h.hour,
      label: hourLabel(h.hour),
      revenue: Math.round(h.revenue * 100) / 100,
      orders: h.orders,
    }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ hours }),
  };
};
