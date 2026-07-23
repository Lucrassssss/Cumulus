// ── Events ───────────────────────────────
// Cumulus runs on REAL data only — no demo/seed events. EVENTS starts empty
// and is populated at boot from the Supabase `events` table via
// loadRealEvents(). If the backend is unreachable or has no rows, the app
// renders clean empty states rather than inventing listings.
const EVENTS = [];

// Category palette — distinct, harmonious, no purple/indigo/violet.
// Used only as scannability accents (dots, badges, markers, borders);
// all interactive chrome (buttons/nav/CTAs) stays yellow.
const CATS = {
  Creative: { color: "#FFCF33", textColor: "#765E1F" }, // gold
  Gaming: { color: "#35C98A", textColor: "#1D6C4A" }, // emerald
  "Movie Nights": { color: "#F0913E", textColor: "#984D0C" }, // orange
  "Board Games": { color: "#2FB6C4", textColor: "#1B6A72" }, // teal
  Meetups: { color: "#E85BA0", textColor: "#B41965" }, // pink
  "Food & Drink": { color: "#E85641", textColor: "#B22916" }, // red
  "Live Music": { color: "#F0687E", textColor: "#B7122D" }, // rose
  "Wellness & Outdoors": { color: "#8FC63D", textColor: "#4C6A1F" }, // lime
  "Tech & Talks": { color: "#4F9BE8", textColor: "#1660AB" }, // blue
};

// Category → representative photo (Unsplash, free license). Presentation only.
const CAT_IMG = {
  Creative: "1513364776144-60967b0f800f",
  Gaming: "1511512578047-dfb367046420",
  "Movie Nights": "1489599849927-2ee91cede3ba",
  "Board Games": "1610890716171-6b1bb98ffd09",
  Meetups: "1523580494863-6f3031224c94",
  "Food & Drink": "1414235077428-338989a2e8c0",
  "Live Music": "1470229722913-7c0e2dbbafd3",
  "Wellness & Outdoors": "1544367567-0f2fcb009e0b",
  "Tech & Talks": "1475721027785-f74eccf877e2",
};
function catImg(cat) {
  const id = CAT_IMG[cat] || "1517457373958-b7bdd4587205";
  return `https://images.unsplash.com/photo-${id}?w=900&q=72&auto=format&fit=crop`;
}

function eventStatus(ev) {
  const now = Date.now();
  if (now >= ev.startsAt && now <= ev.endsAt) return "live";
  if (now < ev.startsAt) return "upcoming";
  return "past";
}
function isHotEvent(ev) {
  const st = eventStatus(ev);
  if (st === "past") return false;
  if (st === "live") return true;
  return attendeesFor(ev.id).length >= 2;
}
function generateUniqueId() {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}
function codeFor(name, id) {
  const c = name
    .toUpperCase()
    .replace(/s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");
  return `CUMULUS-FRIEND::${c}-${id}`;
}

const DEMO_PEOPLE = [
  {
    name: "Alex Rivera",
    id: "849201",
    events: [3, 11, 61, 70, 96],
    blurb: "Watercolours and board games. Always brings snacks.",
  },
  {
    name: "Priya Shah",
    id: "102934",
    events: [9, 29, 45, 84],
    blurb: "New to London, up for almost anything social.",
  },
  {
    name: "Tom Becker",
    id: "582910",
    events: [4, 26, 32, 97],
    blurb: "Retro gaming obsessive, pinball wizard.",
  },
  {
    name: "Mei Lin",
    id: "392105",
    events: [17, 20, 31, 80],
    blurb: "Ceramics, sketching and very strong tea.",
  },
  {
    name: "Jordan Cole",
    id: "994021",
    events: [15, 28, 60, 73, 86],
    blurb: "Film buff and certified A24 superfan.",
  },
  {
    name: "Sam Okafor",
    id: "223019",
    events: [22, 48, 78, 96, 99],
    blurb: "Strategy games strategist. Will teach you.",
  },
  {
    name: "Nadia Hassan",
    id: "774812",
    events: [14, 21, 40, 100],
    blurb: "Here to meet people and try new things.",
  },
  {
    name: "Owen Wright",
    id: "110293",
    events: [40, 49, 74, 87],
    blurb: "Arcades, indie films and good company.",
  },
  {
    name: "Chloe Davies",
    id: "450912",
    events: [10, 26, 76, 89, 92],
    blurb: "Running, sketching, and exploring new boroughs.",
  },
  {
    name: "Marcus King",
    id: "660192",
    events: [14, 39, 90, 99],
    blurb: "Hardstuck in ranked, here to watch the pros instead.",
  },
];
DEMO_PEOPLE.forEach((p) => (p.code = codeFor(p.name, p.id)));
function personByName(n) {
  return DEMO_PEOPLE.find((p) => p.name === n);
}

const LONDON_AREAS = [
  "Shoreditch",
  "Dalston",
  "Hackney",
  "Peckham",
  "Brixton",
  "Clapham",
  "Soho",
  "Fitzrovia",
  "Islington",
  "Bethnal Green",
  "Bermondsey",
  "Borough",
  "Vauxhall",
  "Battersea",
  "Chelsea",
  "Fulham",
  "Hammersmith",
  "Notting Hill",
  "Kensington",
  "Camden",
  "Kentish Town",
  "Holloway",
  "Crouch End",
  "Stoke Newington",
  "Wood Green",
  "Tottenham",
  "Stratford",
  "Bow",
  "Canary Wharf",
  "Greenwich",
  "Lewisham",
  "New Cross",
  "Crystal Palace",
  "Dulwich",
  "Herne Hill",
  "Tooting",
  "Wimbledon",
  "Richmond",
  "Kingston",
  "Putney",
  "Wandsworth",
  "Balham",
  "Elephant & Castle",
  "Southwark",
  "Wapping",
  "Mayfair",
  "Marylebone",
  "King's Cross",
  "Angel",
  "Farringdon",
  "Barbican",
  "Clerkenwell",
  "Whitechapel",
  "Bethnal Green",
  "Stepney",
  "Mile End",
  "Walthamstow",
  "Leyton",
];
const CATEGORY_KEYWORDS = {
  Gaming: ["gaming", "video game", "games", "esports", "arcade", "retro"],
  Creative: [
    "art",
    "painting",
    "drawing",
    "sketch",
    "pottery",
    "crafts",
    "ceramics",
  ],
  "Movie Nights": ["movies", "film", "cinema", "screening"],
  "Board Games": ["board games", "tabletop", "strategy", "puzzles", "catan"],
  Meetups: ["meetups", "social", "networking", "making friends"],
  "Food & Drink": [
    "food",
    "drink",
    "wine",
    "cocktails",
    "beer",
    "cooking",
    "tasting",
  ],
  "Live Music": [
    "live music",
    "gig",
    "concert",
    "open mic",
    "jazz",
    "acoustic",
  ],
  "Wellness & Outdoors": [
    "wellness",
    "yoga",
    "meditation",
    "outdoors",
    "fitness",
    "running",
    "mindfulness",
  ],
  "Tech & Talks": [
    "tech",
    "startup",
    "coding",
    "ai",
    "talks",
    "hackathon",
    "product",
  ],
};
const nowObj = new Date();
let CALENDAR_YEAR = nowObj.getFullYear();
let CALENDAR_MONTH = nowObj.getMonth();
function changeCalendarMonth(delta) {
  let m = CALENDAR_MONTH + delta;
  let y = CALENDAR_YEAR;
  while (m < 0) {
    m += 12;
    y--;
  }
  while (m > 11) {
    m -= 12;
    y++;
  }
  CALENDAR_MONTH = m;
  CALENDAR_YEAR = y;
  renderView();
}
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOT_SVG = `<svg class="blot-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="var(--gold)" d="M10 1c2 1 4 2 5 4.5 1 2.3 1 4.6-0.3 6.6-1.3 2-3.6 3.3-5.7 4.8-1-1.3-2.7-2-4.2-3.2C2.8 12 1.3 9.8 1.8 7.3 2.3 4.7 4.7 3 7 1.8 8 1.3 9 0.7 10 1Z"/></svg>`;
// Consistent stroke-icon replacements for the 🔒/✓ emoji used as structural
// state indicators (locked/complete) throughout the app — matches the
// Phosphor-style icon set introduced on the landing page/nav.
function lockIconSvg(size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
}
function checkIconSvg(size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>`;
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone is optional and intentionally lenient — digits, spaces, and the
// handful of punctuation marks real numbers use (+, -, (), .), 7-20 chars.
// No country-specific format enforcement.
const PHONE_PATTERN = /^[0-9+()\-.\s]{7,20}$/;

let state = {
  view: "browse",
  selectedEventId: null,
  selectedCategory: "all",
  calendarDay: null,
  userId: null,
  profileName: "",
  profileEmail: "",
  profilePhone: "",
  profileAvatarUrl: "",
  profileId: null,
  specialBadges: [],
  hostApplicationStatus: null, // null | "pending" | "approved" | "rejected" — see loadHostApplicationStatus()
  followedHostIds: [], // host_follows rows for the current user — see loadMyFollows()
  theme: "light",
  rsvps: {},
  attendeeCards: {},
  goingOpen: {},
  liveOnly: false,
  hotOnly: false,
  startingSoonOnly: false,
  isAdmin: false, // set to true after admin OTP verification — bypasses all gates
  bgLoading: false,
};
let lmap = null,
  lmapFitted = false;
let hostMap = null,
  hostMarker = null;
let newEventLat = 51.5072,
  newEventLon = -0.1276;

