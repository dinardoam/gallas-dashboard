const https = require('https');

function fetchPage(url, apiKey) {
  return new Promise((resolve, reject) => {
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
    const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&offset=${offset}&orderBy=clientCreatedTime+ASC&expand=payments`;
    const data = await fetchPage(url, apiKey);
    const batch = data.elements || [];
    orders.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return orders;
}

async function fetchAllRefunds(mid, apiKey, start, end) {
  const refunds = [];
  let offset = 0;
  while (true) {
    const url = `https://api.clover.com/v3/merchants/${mid}/refunds?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&offset=${offset}&orderBy=clientCreatedTime+ASC`;
    const data = await fetchPage(url, apiKey);
    const batch = data.elements || [];
    refunds.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return refunds;
}

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};

  // Use a slightly wider window to account for UTC/Eastern boundary, then filter by Eastern date
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 8 * 86400000;
  const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

  const [orders, refunds] = await Promise.all([
    fetchAllOrders(mid, apiKey, start, end),
    fetchAllRefunds(mid, apiKey, start, end),
  ]);

  const dayMap = {};
  orders.forEach(order => {
    const d = new Date(order.clientCreatedTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    // Only include days within the requested range
    if (startDate && d < startDate) return;
    if (endDate && d > endDate) return;
    if (!dayMap[d]) dayMap[d] = { date: d, revenue: 0, orderCount: 0 };
    // Net = gross - tax (from payments)
    const gross = (order.total || 0) / 100;
    const tax = (order.payments && order.payments.elements
      ? order.payments.elements.reduce((s, p) => s + (p.taxAmount || 0), 0)
      : 0) / 100;
    dayMap[d].revenue += gross - tax;
    dayMap[d].orderCount += 1;
  });

  // Subtract refunds per day
  refunds.forEach(refund => {
    const d = new Date(refund.clientCreatedTime || refund.createdTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (startDate && d < startDate) return;
    if (endDate && d > endDate) return;
    if (dayMap[d]) dayMap[d].revenue -= (refund.amount || 0) / 100;
  });

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  const total = days.reduce((s, d) => s + d.revenue, 0);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ days, total, avgDaily: days.length ? total / days.length : 0 })
  };
};
