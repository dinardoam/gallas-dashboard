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
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

  const orders = await fetchAllOrders(mid, apiKey, start, end);

  const dayMap = {};
  orders.forEach(order => {
    const d = new Date(order.clientCreatedTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (!dayMap[d]) dayMap[d] = { date: d, revenue: 0, orderCount: 0 };
    dayMap[d].revenue += (order.total || 0) / 100;
    dayMap[d].orderCount += 1;
  });

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  const total = days.reduce((s, d) => s + d.revenue, 0);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ days, total, avgDaily: days.length ? total / days.length : 0 })
  };
};
