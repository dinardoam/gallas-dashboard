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

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';
  const now = new Date();

  // Get today's date in Eastern time
  const easternDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // returns "YYYY-MM-DD"

  // Midnight Eastern expressed as UTC epoch ms
  // Append T00:00:00 and parse as Eastern
  const startMs = new Date(`${easternDate}T00:00:00-04:00`).getTime(); // EDT offset
  const endMs = now.getTime();

  // Fetch all orders for today (pagination in case of very busy day)
  const orders = [];
  let offset = 0;
  while (true) {
    const data = await fetchPage(mid, apiKey, startMs, endMs, offset);
    const batch = (data.elements || []).filter(o => (o.total || 0) > 0 && o.state !== 'open');
    orders.push(...batch);
    if ((data.elements || []).length < 1000) break;
    offset += 1000;
  }

  const revenue = orders.reduce((s, o) => s + (o.total || 0) / 100, 0);
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? revenue / orderCount : 0;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      revenue: Math.round(revenue * 100) / 100,
      orderCount,
      avgTicket: Math.round(avgTicket * 100) / 100,
      lastUpdated: new Date().toISOString(),
    }),
  };
};
