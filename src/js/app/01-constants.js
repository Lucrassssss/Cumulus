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
  return goingCount(ev.id) >= 2;
}
function generateUniqueId() {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}


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
// Consistent stroke-icon replacements for the 🔒/✓ emoji used as structural
// state indicators (locked/complete) throughout the app — matches the
// Phosphor-style icon set introduced on the landing page/nav.
function lockIconSvg(size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
}
// Small shared line-icon set (same 24px / round-stroke style as the nav).
const UI_ICONS = {
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  pin: '<path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  inbox: '<path d="M4 13h4l1.5 2.5h5L16 13h4"/><path d="M5.5 5h13L20 13v6H4v-6z"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4 4.6-5"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17h.01"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
};
function uiIcon(name, size = 18) {
  return `<svg class="ui-ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI_ICONS[name] || ""}</svg>`;
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
  profileCoverUrl: "",
  profileId: null,
  specialBadges: [],
  hostApplicationStatus: null, // null | "pending" | "approved" | "rejected" — see loadHostApplicationStatus()
  ticketCounts: {}, // tickets sold per event id — see loadTicketCounts()
  crewGoing: {}, // crew_going() rows by event id — see loadCrewGoing()
  followedHostIds: [], // host_follows rows for the current user — see loadMyFollows()
  myWaitlist: [], // event_waitlist rows for the current user — see loadMyWaitlist()
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

