const https = require('https');

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

  const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&expand[]=orderType`;

  const data = await new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${apiKey}` } }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });

  const orders = data.elements || [];

  // Group by orderType label
  const channelMap = {};
  orders.forEach(order => {
    const label = (order.orderType && order.orderType.label) ? order.orderType.label : 'Other';
    if (!channelMap[label]) channelMap[label] = { name: label, revenue: 0, orders: 0 };
    channelMap[label].revenue += (order.total || 0) / 100;
    channelMap[label].orders += 1;
  });

  const total = Object.values(channelMap).reduce((s, c) => s + c.revenue, 0);

  // Sort by revenue descending
  const channels = Object.values(channelMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map(c => ({
      name: c.name,
      revenue: Math.round(c.revenue * 100) / 100,
      orders: c.orders,
      pct: total > 0 ? Math.round((c.revenue / total) * 100) : 0,
    }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ channels, total: Math.round(total * 100) / 100 }),
  };
};
