const https = require('https');

function fetchUrl(url, apiKey) {
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

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const { startDate, endDate } = event.queryStringParameters || {};
  const start = startDate ? new Date(startDate).getTime() : Date.now() - 7 * 86400000;
  const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

  // Fetch total revenue from orders + refunds in parallel
  const ordersUrl = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000`;
  const refundsUrl = `https://api.clover.com/v3/merchants/${mid}/refunds?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=500`;

  const [ordersData, refundsData] = await Promise.all([
    fetchUrl(ordersUrl, apiKey),
    fetchUrl(refundsUrl, apiKey),
  ]);

  const allOrders = ordersData.elements || [];
  const refunds = refundsData.elements || [];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0) / 100, 0);
  const voidTotal = refunds.reduce((s, r) => s + (r.amount || 0) / 100, 0);
  const voidCount = refunds.length;
  const voidPct = totalRevenue > 0 ? Math.round((voidTotal / totalRevenue) * 1000) / 10 : 0;

  const voids = refunds
    .sort((a, b) => (b.clientCreatedTime || 0) - (a.clientCreatedTime || 0))
    .map(r => {
      const dt = new Date(r.clientCreatedTime || r.createdTime);
      const isoDate = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
      const orderTotal = r.orderRef ? (r.orderRef.total || 0) / 100 : null;
      return {
        date: isoDate,
        time,
        amount: Math.round((r.amount || 0)) / 100,
        orderTotal: orderTotal ? Math.round(orderTotal * 100) / 100 : null,
        reason: r.note || (r.orderRef && r.orderRef.note) || 'No reason provided',
      };
    });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      voidCount,
      voidTotal: Math.round(voidTotal * 100) / 100,
      voidPct,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      voids,
    }),
  };
};
