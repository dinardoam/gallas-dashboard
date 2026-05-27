// reviews.js — Netlify Function
// Fetches live reviews from Google Business Profile API using OAuth refresh token.
// Falls back to static data if credentials are missing or the API is unavailable.
//
// Required Netlify env vars for live mode:
//   GOOGLE_CLIENT_ID         — OAuth2 client ID (maxbot project)
//   GOOGLE_CLIENT_SECRET     — OAuth2 client secret
//   GOOGLE_REFRESH_TOKEN     — Refresh token with business.manage scope
//   GOOGLE_GBP_ACCOUNT_ID    — GBP account ID (e.g. "123456789012345678")
//   GOOGLE_GBP_LOCATION_ID   — GBP location ID (e.g. "987654321098765432")

const https = require('https');

// ---------------------------------------------------------------------------
// Static review data (real reviews from Galla's analysis, May 2026)
// ---------------------------------------------------------------------------
const STATIC_REVIEWS = [
  {
    id: 'static-1',
    author: 'Therese Moran',
    rating: 5,
    text: "Absolutely incredible pizza! The crust is perfect — crispy on the outside, chewy inside. Best pizza in Columbus bar none. We drove 45 minutes just for this place and it was 100% worth it.",
    date: '2026-05-25',
    relativeTime: '2 days ago',
    source: 'google',
  },
  {
    id: 'static-2',
    author: 'Sam Napier',
    rating: 5,
    text: "Dave Portnoy knows what he's talking about — this pizza is elite. Showed up the day after the One Bite review and the line was long but totally worth the wait. The large is a must-get.",
    date: '2026-05-24',
    relativeTime: '3 days ago',
    source: 'google',
  },
  {
    id: 'static-3',
    author: 'Marcus T.',
    rating: 5,
    text: "Came after seeing the Portnoy review and was NOT disappointed. That score is earned. Thin crust perfection. Already planning my return trip.",
    date: '2026-05-22',
    relativeTime: '5 days ago',
    source: 'onebite',
  },
  {
    id: 'static-4',
    author: 'Jennifer Walsh',
    rating: 5,
    text: "The gluten-free option here actually tastes like real pizza. As a celiac this is life-changing. Staff was super accommodating and the atmosphere is classic tavern. Love this place.",
    date: '2026-05-20',
    relativeTime: '7 days ago',
    source: 'google',
  },
  {
    id: 'static-5',
    author: 'Kevin M.',
    rating: 5,
    text: "Been coming here for years and it just keeps getting better. The tavern vibe is unmatched in Smyrna. Order the large cheese — you won't regret it.",
    date: '2026-05-18',
    relativeTime: '9 days ago',
    source: 'google',
  },
  {
    id: 'static-6',
    author: 'Rachel P.',
    rating: 4,
    text: "Really solid pizza and great service. The crust is excellent — exactly what I look for in a good pie. Only docking a star because the wait was a bit long on Friday night, but totally understandable given how busy they are.",
    date: '2026-05-17',
    relativeTime: '10 days ago',
    source: 'google',
  },
  {
    id: 'static-7',
    author: 'Tommy B.',
    rating: 5,
    text: "This is the real deal. Came specifically because of One Bite. Portnoy gave it an 8.4 and honestly I think it deserves higher. The sauce is bright and the crust has a perfect chew. New favorite spot.",
    date: '2026-05-23',
    relativeTime: '4 days ago',
    source: 'onebite',
  },
  {
    id: 'static-8',
    author: 'Diana K.',
    rating: 5,
    text: "Great atmosphere, friendly staff, and incredible pizza. The thin crust is exactly right — not cracker thin, not too thick. Parking can be tricky but worth any hassle.",
    date: '2026-05-15',
    relativeTime: '12 days ago',
    source: 'popmenu',
  },
  {
    id: 'static-9',
    author: 'Chris R.',
    rating: 4,
    text: "Excellent pizza — the sausage and peppers combo is a standout. Service was fast and friendly. Great local spot that doesn't get the credit it deserves outside the area.",
    date: '2026-05-14',
    relativeTime: '13 days ago',
    source: 'google',
  },
  {
    id: 'static-10',
    author: 'Anita J.',
    rating: 5,
    text: "Hands down the best pizza I've had in Columbus. The crust, the sauce, the cheese — everything is balanced perfectly. My kids went crazy for it too. This place is special.",
    date: '2026-05-12',
    relativeTime: '15 days ago',
    source: 'google',
  },
];

const STATIC_RATING_BREAKDOWN = { '5': 620, '4': 148, '3': 52, '2': 18, '1': 9 };
const STATIC_TOTAL = 847;
const STATIC_AVG = 4.6;

// ---------------------------------------------------------------------------
// Helper: fetch JSON via HTTPS
// ---------------------------------------------------------------------------
function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Token request timeout')); });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Get a fresh access token using the OAuth refresh token
// ---------------------------------------------------------------------------
async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }).toString();

  const data = await httpsPost('oauth2.googleapis.com', '/token', body);

  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Fetch Google Business Profile reviews
// ---------------------------------------------------------------------------
async function fetchGoogleReviews(limit) {
  const accountId = process.env.GOOGLE_GBP_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_GBP_LOCATION_ID;

  if (!accountId || !locationId) {
    throw new Error('Missing GOOGLE_GBP_ACCOUNT_ID or GOOGLE_GBP_LOCATION_ID');
  }

  const accessToken = await getAccessToken();

  // Use the v4 reviews endpoint (stable, widely supported)
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=${limit}`;

  const data = await httpsGet(url, { Authorization: `Bearer ${accessToken}` });
  return data;
}

function mapGbpReview(r, idx) {
  const ts = r.updateTime || r.createTime || '';
  const date = ts ? ts.slice(0, 10) : '';
  const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return {
    id: r.reviewId || `gbp-${idx}`,
    author: r.reviewer?.displayName || 'Anonymous',
    rating: ratingMap[r.starRating] || 0,
    text: r.comment || '',
    date,
    relativeTime: date ? relativeDate(date) : '',
    source: 'google',
  };
}

function relativeDate(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return '1 week ago';
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 60) return '1 month ago';
  return `${Math.floor(diff / 30)} months ago`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const params = event.queryStringParameters || {};
  const limit = Math.min(parseInt(params.limit || '10', 10), 50);

  // Try Google Business Profile API first
  try {
    const gbpData = await fetchGoogleReviews(limit);
    const reviews = (gbpData.reviews || []).map(mapGbpReview);

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      const breakdown = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
      reviews.forEach((r) => {
        const k = String(r.rating);
        if (breakdown[k] !== undefined) breakdown[k]++;
      });

      const totalFromBreakdown = Object.values(breakdown).reduce((s, v) => s + v, 0);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          source: 'google',
          avgRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: gbpData.totalReviewCount || totalFromBreakdown,
          recentReviews: reviews,
          ratingBreakdown: breakdown,
          trend: {
            last30days: parseFloat(avgRating.toFixed(1)),
            last90days: parseFloat(avgRating.toFixed(1)),
            allTime: parseFloat(avgRating.toFixed(1)),
          },
        }),
      };
    }
  } catch (_err) {
    // Fall through to static
  }

  // Static fallback
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      source: 'static',
      avgRating: STATIC_AVG,
      totalReviews: STATIC_TOTAL,
      recentReviews: STATIC_REVIEWS.slice(0, limit),
      ratingBreakdown: STATIC_RATING_BREAKDOWN,
      trend: {
        last30days: 4.7,
        last90days: 4.6,
        allTime: STATIC_AVG,
      },
    }),
  };
};
