const https = require('https');

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

  const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&expand=lineItems`;

  const data = await new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${apiKey}` } }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
  });

  const orders = data.elements || [];
  const dayMap = {};
  orders.forEach(order => {
    const d = new Date(order.clientCreatedTime).toISOString().slice(0, 10);
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
