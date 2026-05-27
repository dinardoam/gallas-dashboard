const https = require('https');

exports.handler = async (event) => {
  const apiKey = process.env.CLOVER_GALLAS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const mid = '3NMZM0YN49QQ1';

  // Get midnight Eastern time today
  const now = new Date();
  // Eastern offset: EST = UTC-5, EDT = UTC-4
  // Use Intl to get current Eastern date
  const easternFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = easternFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day').value);

  // Midnight Eastern = midnight local Eastern time expressed as UTC ms
  const midnightEastern = new Date(Date.UTC(year, month, day));
  // Adjust for Eastern offset: find the UTC ms that corresponds to midnight Eastern
  // We do this by constructing the date string and using the timezone
  const midnightStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  const midnightMs = new Date(new Date(midnightStr).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  // Simpler: get offset by comparing a known time
  const tzOffset = (new Date().getTime() - new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime());
  const startMs = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`).getTime() + tzOffset;
  const endMs = now.getTime();

  const url = `https://api.clover.com/v3/merchants/${mid}/orders?filter=clientCreatedTime>=${startMs}&filter=clientCreatedTime<${endMs}&limit=1000`;

  let data;
  try {
    data = await new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { Authorization: `Bearer ${apiKey}` } }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
    });
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch Clover data' }) };
  }

  const orders = (data.elements || []).filter(o =>
    (o.total || 0) > 0 &&
    o.state !== 'open' &&
    o.paymentState !== 'OPEN'
  );

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
