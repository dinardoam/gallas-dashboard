const https = require('https');

function fetchPage(mid, apiKey, start, end, offset) {
  return new Promise((resolve, reject) => {
    const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000&offset=${offset}&orderBy=clientCreatedTime+ASC&expand=orderType&expand=payments`;
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

function normalizeChannel(label) {
  if (!label) return 'Other';
  const l = label.toLowerCase();
  if (l.includes('doordash') || l.includes('door dash')) return 'DoorDash';
  if (l.includes('uber')) return 'Uber Eats';
  if (l.includes('popmenu') && l.includes('delivery')) return 'Popmenu Delivery';
  if (l.includes('popmenu') && l.includes('pickup')) return 'Popmenu Pickup';
  if (l.includes('popmenu')) return 'Popmenu';
  if (l.includes('online')) return 'Online Order';
  if (l.includes('delivery')) return 'Delivery';
  if (l.includes('to go') || l.includes('togo') || l.includes('take out') || l.includes('takeout') || l.includes('pickup') || l.includes('pick up')) return 'To Go';
  if (l.includes('dine in') || l.includes('dine-in') || l.includes('dinein')) return 'Dine In';
  if (l.includes('bar')) return 'Bar';
  return label;
}

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(`${startDate}T00:00:00-04:00`).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(`${endDate}T00:00:00-04:00`).getTime() + 86400000 : Date.now();

  const orders = await fetchAllOrders(mid, apiKey, start, end);

  const channelMap = {};
  orders.forEach(order => {
    const rawLabel = (order.orderType && order.orderType.label) ? order.orderType.label : null;
    const channel = normalizeChannel(rawLabel);
    if (!channelMap[channel]) channelMap[channel] = { name: channel, revenue: 0, orders: 0 };
    const tax = (order.payments && order.payments.elements
      ? order.payments.elements.reduce((t, p) => t + (p.taxAmount || 0), 0)
      : 0);
    const net = ((order.total || 0) - tax) / 100;
    channelMap[channel].revenue += net;
    channelMap[channel].orders += 1;
  });

  const total = Object.values(channelMap).reduce((s, c) => s + c.revenue, 0);

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
