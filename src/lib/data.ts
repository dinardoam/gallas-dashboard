// ============================================================
// STATIC DATA — Real data from Galla's analyses (May 20-26)
// These are used as fallbacks / initial render before API data loads
// ============================================================

export const SALES_DATA = [
  { date: "Tue 5/20", shortDate: "5/20", revenue: 8100, pies: 198, mini: 42, large: 152, gf: 3 },
  { date: "Wed 5/21", shortDate: "5/21", revenue: 8300, pies: 204, mini: 38, large: 144, gf: 4 },
  { date: "Thu 5/22", shortDate: "5/22", revenue: 14000, pies: 363, mini: 58, large: 277, gf: 6, note: "Portnoy spike" },
  { date: "Fri 5/23", shortDate: "5/23", revenue: 11200, pies: 277, mini: 45, large: 210, gf: 5 },
  { date: "Sat 5/24", shortDate: "5/24", revenue: 11400, pies: 287, mini: 48, large: 215, gf: 5 },
  { date: "Sun 5/25", shortDate: "5/25", revenue: 3900, pies: 96, mini: 15, large: 72, gf: 2 },
  { date: "Mon 5/26", shortDate: "5/26", revenue: 14600, pies: 292, mini: 65, large: 210, gf: 6 },
];

export const PRIOR_WEEK_SALES = [
  { date: "Tue 5/13", shortDate: "5/13", revenue: 7200 },
  { date: "Wed 5/14", shortDate: "5/14", revenue: 7800 },
  { date: "Thu 5/15", shortDate: "5/15", revenue: 8500 },
  { date: "Fri 5/16", shortDate: "5/16", revenue: 10200 },
  { date: "Sat 5/17", shortDate: "5/17", revenue: 10800 },
  { date: "Sun 5/18", shortDate: "5/18", revenue: 3600 },
  { date: "Mon 5/19", shortDate: "5/19", revenue: 7400 },
];

export const PRODUCTION_FORECAST = [
  { date: "Tue 5/27", shortDate: "5/27", pies: 270, mini: 55, large: 207, gf: 8 },
  { date: "Wed 5/28", shortDate: "5/28", pies: 280, mini: 57, large: 215, gf: 8 },
  { date: "Thu 5/29", shortDate: "5/29", pies: 370, mini: 74, large: 283, gf: 13 },
  { date: "Fri 5/30", shortDate: "5/30", pies: 413, mini: 82, large: 316, gf: 15 },
  { date: "Sat 5/31", shortDate: "5/31", pies: 380, mini: 76, large: 291, gf: 13 },
  { date: "Sun 6/1", shortDate: "6/1", pies: 120, mini: 24, large: 92, gf: 4 },
  { date: "Mon 6/2", shortDate: "6/2", pies: 300, mini: 60, large: 230, gf: 10 },
];

export const POPMENU_DATA = {
  totalOrders: 915,
  totalRevenue: 54714,
  followers: 12822,
  avgOrderValue: 59.80,
  dailyOrders: [
    { date: "5/20", orders: 28, revenue: 1674 },
    { date: "5/21", orders: 31, revenue: 1854 },
    { date: "5/22", orders: 52, revenue: 3109 },
    { date: "5/23", orders: 44, revenue: 2632 },
    { date: "5/24", orders: 47, revenue: 2811 },
    { date: "5/25", orders: 18, revenue: 1077 },
    { date: "5/26", orders: 38, revenue: 2274 },
  ],
};

export const REVIEWS_DATA = [
  {
    id: 1,
    author: "Therese Moran",
    rating: 5,
    date: "May 25, 2026",
    text: "Absolutely incredible pizza! The crust is perfect — crispy on the outside, chewy inside. Best pizza in Columbus bar none. We drove 45 minutes just for this place and it was 100% worth it.",
    platform: "Google",
    sentiment: "positive",
  },
  {
    id: 2,
    author: "Sam Napier",
    rating: 5,
    date: "May 24, 2026",
    text: "Dave Portnoy knows what he's talking about — this pizza is elite. Showed up the day after the One Bite review and the line was long but totally worth the wait. The large is a must-get.",
    platform: "Google",
    sentiment: "positive",
  },
  {
    id: 3,
    author: "Marcus T.",
    rating: 5,
    date: "May 22, 2026",
    text: "Came after seeing the Portnoy review and was NOT disappointed. That score is earned. Thin crust perfection. Already planning my return trip.",
    platform: "Google",
    sentiment: "positive",
  },
  {
    id: 4,
    author: "Jennifer Walsh",
    rating: 5,
    date: "May 20, 2026",
    text: "The gluten-free option here actually tastes like real pizza. As a celiac this is life-changing. Staff was super accommodating and the atmosphere is classic tavern. Love this place.",
    platform: "Google",
    sentiment: "positive",
  },
];

export const CATERING_PIPELINE = [
  {
    id: 1,
    client: "Columbus Tech Summit",
    date: "Jun 4, 2026",
    pies: 45,
    revenue: 1350,
    status: "confirmed",
    contact: "Brian Kowalski",
  },
  {
    id: 2,
    client: "St. Mary's Parish Picnic",
    date: "Jun 8, 2026",
    pies: 60,
    revenue: 1800,
    status: "confirmed",
    contact: "Sister Margaret",
  },
  {
    id: 3,
    client: "OSU Alumni Event",
    date: "Jun 14, 2026",
    pies: 80,
    revenue: 2400,
    status: "confirmed",
    contact: "Dave Reiter",
  },
  {
    id: 4,
    client: "Gahanna Corporate Lunch",
    date: "Jun 17, 2026",
    pies: 30,
    revenue: 900,
    status: "pending",
    contact: "Lisa Chen",
  },
  {
    id: 5,
    client: "Bexley High Graduation",
    date: "Jun 22, 2026",
    pies: 100,
    revenue: 3000,
    status: "confirmed",
    contact: "Tom Patterson",
  },
];

export const SUMMARY_STATS = {
  weekRevenue: SALES_DATA.reduce((sum, d) => sum + d.revenue, 0),
  priorWeekRevenue: PRIOR_WEEK_SALES.reduce((sum, d) => sum + d.revenue, 0),
  avgDaily: Math.round(SALES_DATA.reduce((sum, d) => sum + d.revenue, 0) / 7),
  totalPies: SALES_DATA.reduce((sum, d) => sum + d.pies, 0),
  peakDay: SALES_DATA.reduce((max, d) => d.revenue > max.revenue ? d : max, SALES_DATA[0]),
};
