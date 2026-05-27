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

  // Fetch all orders for total revenue
  const allUrl = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&limit=1000`;
  // Fetch refunded/voided orders
  const voidUrl = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${start}&filter=clientCreatedTime<${end}&filter=state=REFUNDED&limit=500`;

  const [allData, voidData] = await Promise.all([
    fetchUrl(allUrl, apiKey),
    fetchUrl(voidUrl, apiKey),
  ]);

  const allOrders = allData.elements || [];
  const voidOrders = voidData.elements || [];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0) / 100, 0);
  const voidTotal = voidOrders.reduce((s, o) => s + (o.total || 0) / 100, 0);
  const voidCount = voidOrders.length;
  const voidPct = totalRevenue > 0 ? Math.round((voidTotal / totalRevenue) * 1000) / 10 : 0;

  const voids = voidOrders
    .sort((a, b) => b.clientCreatedTime - a.clientCreatedTime)
    .map(o => {
      const dt = new Date(o.clientCreatedTime);
      const isoDate = dt.toISOString().slice(0, 10);
      const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return {
        date: isoDate,
        time,
        amount: Math.round((o.total || 0)) / 100,
        reason: o.note || 'No reason provided',
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
