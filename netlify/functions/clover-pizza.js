const https = require('https');

function fetchPage(mid, apiKey, start, end, offset) {
  return new Promise((resolve, reject) => {
    const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&offset=${offset}&expand=lineItems`;
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

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(`${startDate}T00:00:00-04:00`).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(`${endDate}T00:00:00-04:00`).getTime() + 86400000 : Date.now();

  // Paginate through all orders
  const orders = [];
  let offset = 0;
  while (true) {
    const data = await fetchPage(mid, apiKey, start, end, offset);
    const batch = data.elements || [];
    orders.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }

  const dayMap = {};
  orders.forEach(order => {
    const d = new Date(order.clientCreatedTime).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (!dayMap[d]) dayMap[d] = { date: d, large: 0, mini: 0, gf: 0, total: 0 };
    const items = (order.lineItems && order.lineItems.elements) || [];
    items.forEach(item => {
      const name = (item.name || '').toLowerCase();
      if (name.includes('gf') || name.includes('gluten')) { dayMap[d].gf++; dayMap[d].total++; }
      else if (name.includes('large') || name.includes('16')) { dayMap[d].large++; dayMap[d].total++; }
      else if (name.includes('mini') || name.includes('10')) { dayMap[d].mini++; dayMap[d].total++; }
    });
  });

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ days })
  };
};
