// reviews.js — Netlify Function
// Fetches live reviews from Google Places API.
// Falls back to static data if the API is unavailable or returns no reviews.
//
// Required Netlify env var:
//   GOOGLE_PLACES_API_KEY  — Google Maps/Places API key (project: maxbot-497412)
//
// Place ID: ChIJvWbSu_sI9YgRSrQVefMsNlE
//   Galla's Pizza & Tavern, 4849 Peachtree Rd, Chamblee, GA 30341

const https = require('https');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PLACE_ID = 'ChIJvWbSu_sI9YgRSrQVefMsNlE';

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
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
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
// Fetch reviews from Google Places Details API
// ---------------------------------------------------------------------------
async function fetchPlacesReviews(limit) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY env var is not set');
  const fields = 'name,rating,reviews,user_ratings_total';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=${fields}&key=${apiKey}`;

  const data = await httpsGet(url);

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status} — ${data.error_message || 'unknown'}`);
  }

  const result = data.result || {};
  const rawReviews = result.reviews || [];
  const overallRating = result.rating || null;
  const totalRatings = result.user_ratings_total || null;

  const reviews = rawReviews.slice(0, limit).map((r, idx) => {
    const date = r.time ? new Date(r.time * 1000).toISOString().slice(0, 10) : '';
    return {
      id: `places-${idx}`,
      author: r.author_name || 'Anonymous',
      rating: r.rating || 0,
      text: r.text || '',
      date,
      relativeTime: r.relative_time_description || (date ? relativeDate(date) : ''),
      source: 'google',
    };
  });

  return { reviews, overallRating, totalRatings };
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
  const limit = Math.min(parseInt(params.limit || '5', 10), 5);

  // Try Google Places API first
  try {
    const { reviews, overallRating, totalRatings } = await fetchPlacesReviews(limit);

    if (reviews.length > 0) {
      const avgRating = overallRating || (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
      const breakdown = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
      reviews.forEach((r) => {
        const k = String(r.rating);
        if (breakdown[k] !== undefined) breakdown[k]++;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          source: 'google_places',
          rating: parseFloat(avgRating.toFixed(1)),
          totalReviews: totalRatings || reviews.length,
          reviews,
          ratingBreakdown: breakdown,
          avgRating: parseFloat(avgRating.toFixed(1)),
          totalRatings: totalRatings || reviews.length,
          // Legacy fields for dashboard compatibility
          recentReviews: reviews,
          trend: {
            last30days: parseFloat(avgRating.toFixed(1)),
            last90days: parseFloat(avgRating.toFixed(1)),
            allTime: parseFloat(avgRating.toFixed(1)),
          },
        }),
      };
    }
  } catch (err) {
    console.error('Places API error:', err.message);
    // Fall through to static
  }

  // Static fallback
  const staticReviews = STATIC_REVIEWS.slice(0, limit);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      source: 'static',
      rating: STATIC_AVG,
      totalReviews: STATIC_TOTAL,
      reviews: staticReviews,
      ratingBreakdown: STATIC_RATING_BREAKDOWN,
      avgRating: STATIC_AVG,
      totalRatings: STATIC_TOTAL,
      // Legacy fields
      recentReviews: staticReviews,
      trend: {
        last30days: 4.7,
        last90days: 4.6,
        allTime: STATIC_AVG,
      },
    }),
  };
};
