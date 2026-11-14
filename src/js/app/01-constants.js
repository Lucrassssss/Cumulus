// ── Events ───────────────────────────────
// Odd Flock runs on REAL data only — no demo/seed events. EVENTS starts empty
// and is populated at boot from the Supabase `events` table via
// loadRealEvents(). If the backend is unreachable or has no rows, the app
// renders clean empty states rather than inventing listings.
const EVENTS = [];

// ── Brand mark ───────────────────────────
// The Odd Flock mark: two emperor penguins and a rockhopper, flat silhouettes.
// Colours come from CSS: currentColor for the birds, --hm-cut for the gaps
// between them (match it to whatever sits behind), --hm-patch for the yellow.
const BRAND_MARK = `<svg class="brand-mark" viewBox="4 -2 114 114" aria-hidden="true" focusable="false"><g class="hm-a"><g transform="translate(5.77 15) scale(.8846)"><path d="M39 27 C36 22.5 32 18 28 15 C26 10.5 21.5 9 18 10.6 C14.6 12.2 13.6 16.4 14.2 21 C9.6 31 7 44 7 60 C7 74 8 84 10 90 C8 94 6 97 3 100 C7 100.5 10 99.5 12 98 C15 100.5 20 101.5 25 101 L33 101.5 C35 101 35 100 33 99.4 C38 94 41 84 41 72 C41 58 37 45 32 36 C29.5 31 27.6 26 27.5 20.5 C31 22 35 24.5 39 27Z" fill="currentColor" stroke="var(--hm-cut,var(--bg))" stroke-width="1.6" paint-order="stroke" stroke-linejoin="round"/><path d="M15.5 31 C13 46 14.5 61 19.5 72" fill="none" stroke="var(--hm-cut,var(--bg))" stroke-width=".7" stroke-linecap="round"/><path d="M20.6 14.6 C23.6 16.2 25.2 20 24.8 24.4 C24.4 27.2 22.8 28.4 20.8 28 C21.8 24 21.8 18.6 20.6 14.6Z" fill="var(--hm-patch,var(--volt))"/><circle cx="23.2" cy="14.2" r=".85" fill="var(--hm-cut,var(--bg))"/></g></g><g class="hm-b"><g transform="translate(32 3)"><path d="M46 15 C40 13.5 34 11 30 10 C28 7 23 6.2 19.5 8 C16 9.8 14.6 14 15 19 C10 30 7 44 7 60 C7 74 8 84 10 90 C8 94 6 97 3 100 C7 100.5 10 99.5 12 98 C15 100.5 20 101.5 25 101 L33 101.5 C35 101 35 100 33 99.4 C38 94 41 84 41 72 C41 58 37 45 32 36 C29 31 28 26 28.6 22 C29.4 19.5 32 18 35.5 17.2 C39 16.5 43 15.8 46 15Z" fill="currentColor" stroke="var(--hm-cut,var(--bg))" stroke-width="1.6" paint-order="stroke" stroke-linejoin="round"/><path d="M16 30 C13.5 45 15 60 20 71" fill="none" stroke="var(--hm-cut,var(--bg))" stroke-width=".7" stroke-linecap="round"/><path d="M23 12.4 C25.8 14 27.2 17.6 26.8 21.8 C26.4 24.6 24.8 25.9 22.8 25.6 C23.8 21.6 23.9 16.4 23 12.4Z" fill="var(--hm-patch,var(--volt))"/><circle cx="25.2" cy="11.4" r=".85" fill="var(--hm-cut,var(--bg))"/></g></g><g class="hm-c"><g transform="translate(106 42) scale(-.8 .8)"><path d="M31 13 C34.5 12.8 38 14.6 39.4 17.2 C39 18.6 37 19.6 34 20 L30.5 19.6 C29.6 21.5 30 23.4 31 25 C35 30 39 40 39 52 C39 62 36 72 30 77.4 C31.5 78 31.5 79 30 79.2 L24 78.8 C20 79 17 78.6 14.5 77.2 C12.5 78.2 9.5 78.6 6 78 C8 75.6 9.4 73.4 10 71 C8 66 7 60 7 52 C7 42 9 31 13 21.5 C13 20 12.6 18 13 16.4 L10.2 14.4 L13.6 13.6 L12 10.6 L15.8 11.4 L15.6 7.8 L18.6 10 L19 6.6 L21 10 C25 9.6 29 10.4 31 13Z" fill="currentColor" stroke="var(--hm-cut,var(--bg))" stroke-width="1.4" paint-order="stroke" stroke-linejoin="round"/><path d="M30.6 19.4 C33 18.4 36 17.8 39.2 17.6" fill="none" stroke="var(--hm-cut,var(--bg))" stroke-width=".5" stroke-linecap="round"/><path d="M14.5 27 C12.5 38 13.5 50 17.5 58" fill="none" stroke="var(--hm-cut,var(--bg))" stroke-width=".7" stroke-linecap="round"/><g fill="var(--hm-patch,var(--volt))"><path d="M20.67 12.40 Q27.04 11.52 32.60 14.20 Q26.96 10.08 20.53 10.00Z"/><path d="M24.73 10.14 Q13.20 7.65 1.60 12.60 Q12.80 9.15 24.07 12.66Z"/><path d="M23.30 10.75 Q12.94 12.05 3.40 21.00 Q13.06 13.55 23.50 13.25Z"/><path d="M21.81 11.67 Q15.05 16.44 10.40 27.00 Q15.75 17.56 22.99 13.53Z"/><path d="M25.47 9.98 Q15.88 4.91 5.00 4.60 Q15.32 5.89 24.53 11.62Z"/></g><circle cx="28.4" cy="15.4" r=".9" fill="var(--hm-cut,var(--bg))"/></g></g></svg>`;

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
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
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

