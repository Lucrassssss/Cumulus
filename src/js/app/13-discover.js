// ── Discover feed ─────────────────────────────────────────────────────────
// The home screen. Before this, the app booted straight into a full-screen
// map hidden behind a loader that waited on Mapbox tiles (+2.5s) — a guest
// on a slow phone saw a spinner, then a map with a few pins and nothing to
// read. The feed renders instantly from EVENTS (no WebGL, no tiles) and the
// map is one tap away (Map tab / "Map" pill).
//
// Same classic-script contract as the rest of src/js/app: every function is a
// global so inline onclick="" handlers can reach it.

// Per-category poster palettes for events with no photo — two hues + a
// glyph, rendered as a mesh gradient with grain, so every event looks like a
// gig poster rather than a grey placeholder.
const POSTER_PALETTES = {
  Creative: ["#FFB547", "#FF3D7F", "✶"],
  Gaming: ["#2CF6B3", "#3A5BFF", "◆"],
  "Movie Nights": ["#FF8A3D", "#7A1FFF", "▶"],
  "Board Games": ["#24D3E6", "#1E7A5A", "●"],
  Meetups: ["#FF5FA8", "#FFB000", "✺"],
  "Food & Drink": ["#FF5A36", "#FFD23F", "✸"],
  "Live Music": ["#FF2E63", "#6C2BFF", "♫"],
  "Wellness & Outdoors": ["#B8F23C", "#16A37F", "☀"],
  "Tech & Talks": ["#3DA9FF", "#9D4DFF", "⌘"],
};
function posterPalette(cat) {
  return POSTER_PALETTES[cat] || ["#D4FF3F", "#8B5CFF", "✦"];
}

// Deterministic per-event angle so two events in the same category don't
// render identical posters.
function _posterSeed(id) {
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Background for any poster surface: the real photo when there is one,
// otherwise the generated gradient. Returns an inline style string.
function posterStyle(ev) {
  const img = ev.photoUrl || ev.nightShotUrl;
  const [a, b] = posterPalette(ev.category);
  const seed = _posterSeed(ev.id);
  const x = 15 + (seed % 70);
  const y = 10 + ((seed >> 3) % 60);
  const vars = `--p-a:${a};--p-b:${b};--p-x:${x}%;--p-y:${y}%;`;
  if (img) return `${vars}background-image:url('${String(img).replace(/'/g, "%27")}');`;
  return vars;
}
function posterClass(ev) {
  return ev.photoUrl || ev.nightShotUrl ? "poster has-photo" : "poster gen";
}
function posterGlyph(ev) {
  if (ev.photoUrl || ev.nightShotUrl) return "";
  return `<span class="poster-glyph" aria-hidden="true">${posterPalette(ev.category)[2]}</span>`;
}

// "FRI 14 NOV" / "TONIGHT" / "TOMORROW" / "LIVE NOW"
function feedDateLabel(ev) {
  const st = eventStatus(ev);
  if (st === "live") return "LIVE NOW";
  const d = new Date(ev.startsAt);
  const now = new Date();
  const day0 = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(now)) / 86400000);
  if (diff === 0) return d.getHours() >= 17 ? "TONIGHT" : "TODAY";
  if (diff === 1) return "TOMORROW";
  return d
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase()
    .replace(/,/g, "");
}
function feedTimeLabel(ev) {
  const d = new Date(ev.startsAt);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function feedPriceLabel(ev) {
  const p = eventPrice(ev);
  return p ? `£${Number(p) % 1 ? Number(p).toFixed(2) : p}` : "Free";
}
function feedSpotsLeft(ev) {
  if (!ev.capacity) return null;
  return Math.max(0, ev.capacity - attendeesFor(ev.id).length);
}

function feedUpcoming() {
  return EVENTS.filter(
    (ev) =>
      ev.status !== "cancelled" &&
      ev.status !== "hidden" &&
      eventStatus(ev) !== "past",
  ).sort((a, b) => a.startsAt - b.startsAt);
}

function feedFiltered() {
  const q = (state.feedQuery || "").trim().toLowerCase();
  const cat = state.selectedCategory || "all";
  const range = state.feedRange || "all";
  return feedUpcoming().filter((ev) => {
    if (cat !== "all" && ev.category !== cat) return false;
    if (range === "free" && eventPrice(ev)) return false;
    if (range === "today" && !eventInDateRange(ev, "today") && eventStatus(ev) !== "live") return false;
    if (range === "weekend" && !eventInDateRange(ev, "weekend")) return false;
    if (range === "tomorrow") {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      const d = new Date(ev.startsAt);
      if (d.toDateString() !== t.toDateString()) return false;
    }
    if (
      q &&
      !`${ev.title} ${ev.venue || ""} ${ev.area || ""} ${ev.category || ""} ${ev.host || ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });
}

// ── Navigation ────────────────────────────────────────────────────────────
function goFeed() {
  navStack = [];
  state.view = "feed";
  state.selectedEventId = null;
  renderNav();
  renderView();
  resetEventUrlAndMeta();
  window.scrollTo({ top: 0 });
}
function setFeedRange(r) {
  state.feedRange = r;
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
}
function setFeedCategory(c) {
  state.selectedCategory = c;
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
}
let _feedSearchT = null;
function onFeedSearch(v) {
  state.feedQuery = v;
  state.feedLimit = FEED_PAGE;
  clearTimeout(_feedSearchT);
  _feedSearchT = setTimeout(_rerenderFeedResults, 120);
}
function _rerenderFeedResults() {
  const el = document.getElementById("feed-results");
  if (!el) return renderView();
  el.innerHTML = feedResultsHtml();
  document.querySelectorAll("[data-range]").forEach((b) =>
    b.classList.toggle("on", b.dataset.range === (state.feedRange || "all")),
  );
  document.querySelectorAll("[data-fcat]").forEach((b) =>
    b.classList.toggle("on", b.dataset.fcat === (state.selectedCategory || "all")),
  );
}

// ── Building blocks ───────────────────────────────────────────────────────
function feedPosterCardHtml(ev, size) {
  const st = eventStatus(ev);
  const left = feedSpotsLeft(ev);
  const scarce = left !== null && left > 0 && left <= Math.max(3, Math.ceil(ev.capacity * 0.15));
  return `<article class="fp-card ${size || ""}" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}">
    <div class="${posterClass(ev)}" style="${posterStyle(ev)}">
      ${posterGlyph(ev)}
      <div class="fp-top">
        <span class="fp-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)}</span>
        ${scarce ? `<span class="fp-hot">${left} left</span>` : isHotEvent(ev) && st !== "live" ? `<span class="fp-hot">🔥 Hot</span>` : ""}
      </div>
      <div class="fp-bottom">
        <div class="fp-cat">${escapeHtml(ev.category || "Event")}</div>
        <h3 class="fp-title">${escapeHtml(ev.title)}</h3>
        <div class="fp-meta"><span>${escapeHtml(ev.venue || ev.area || "London")}</span><span class="fp-price">${feedPriceLabel(ev)}</span></div>
      </div>
    </div>
  </article>`;
}

function feedRowHtml(ev, tag) {
  const st = eventStatus(ev);
  const left = feedSpotsLeft(ev);
  const going = attendeesFor(ev.id).length;
  return `<article class="fr-row" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}">
    <div class="fr-thumb ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}</div>
    <div class="fr-body">
      <div class="fr-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</div>
      <h3 class="fr-title">${escapeHtml(ev.title)}</h3>
      <div class="fr-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
      <div class="fr-foot">
        <span class="fr-price${eventPrice(ev) ? "" : " free"}">${feedPriceLabel(ev)}</span>
        ${tag ? `<span class="fr-chip tag">${escapeHtml(tag)}</span>` : ""}
        ${left !== null && left <= 10 && left > 0 ? `<span class="fr-chip warn">Only ${left} left</span>` : ""}
        ${left === 0 ? `<span class="fr-chip">Waitlist</span>` : ""}
        ${going >= 2 ? `<span class="fr-chip">${going} going</span>` : ""}
      </div>
    </div>
    <span class="fr-go" aria-hidden="true">→</span>
  </article>`;
}

function feedResultsHtml() {
  if (!state.eventsLoaded && !EVENTS.length) {
    return `<div class="fr-list" aria-busy="true">${Array.from({ length: 4 })
      .map(() => `<div class="fr-row skel"><div class="fr-thumb"></div><div class="fr-body"><i></i><i></i><i></i></div></div>`)
      .join("")}</div>`;
  }
  const list = feedFiltered();
  if (!list.length) {
    const anything = feedUpcoming().length > 0;
    return `<div class="feed-empty">
      <div class="feed-empty-art" aria-hidden="true">☁︎</div>
      <h3>${anything ? "Nothing matches that." : "London's quiet. For now."}</h3>
      <p>${anything ? "Try another day or category — or clear your search." : "New events drop here first. Got something in mind? Put it on the map."}</p>
      <div class="feed-empty-actions">
        ${anything ? `<button class="v-btn" onclick="state.feedQuery='';state.feedRange='all';state.selectedCategory='all';renderView()">Show everything</button>` : `<button class="v-btn" onclick="openHost()">Host an event</button>`}
        <button class="v-btn ghost" onclick="goBrowse()">Open the map</button>
      </div>
    </div>`;
  }
  const limit = state.feedLimit || FEED_PAGE;
  const shown = list.slice(0, limit);
  let lastDay = null;
  const rows = shown
    .map((ev) => {
      const day = feedDayHeading(ev);
      const head = day !== lastDay ? `<div class="fr-day">${escapeHtml(day)}</div>` : "";
      lastDay = day;
      return head + feedRowHtml(ev);
    })
    .join("");
  const left = list.length - shown.length;
  return `<div class="fr-list compact">${rows}</div>${
    left > 0
      ? `<button class="v-btn ghost wide feed-more" onclick="state.feedLimit=(state.feedLimit||FEED_PAGE)+FEED_PAGE;_rerenderFeedResults()">Show ${Math.min(left, FEED_PAGE)} more <span>· ${left} left</span></button>`
      : list.length > FEED_PAGE
        ? `<div class="feed-end">That's everything coming up · <button class="link-btn" onclick="navStack=[];openCalendar()">See the calendar</button></div>`
        : ""
  }`;
}

const FEED_PAGE = 12;
// "Live now" / "Tonight" / "Tomorrow" / "Sat 15 Nov" — day group headings.
function feedDayHeading(ev) {
  if (eventStatus(ev) === "live") return "Live now";
  const d = new Date(ev.startsAt);
  const day0 = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(new Date())) / 86400000);
  if (diff === 0) return "Today & tonight";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function feedGreeting() {
  let h;
  try {
    h = parseInt(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(new Date()),
      10,
    );
  } catch (e) {
    h = new Date().getHours();
  }
  const day = new Date().toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/London" });
  if (h < 5) return ["Still up?", "After hours in London"];
  if (h < 12) return [`Happy ${day}.`, "Plan something good"];
  if (h < 17) return [`${day} plans?`, "What's on in London"];
  return ["Tonight in London", `${day} night, sorted`];
}

// "New from hosts you follow" — in-app half of "Notify me when they post"
// (the email half is notify-followers-new-event). Shows upcoming events
// from hosts with notify on that were created in the last 14 days and that
// this device hasn't dismissed yet.
const FOLLOW_SEEN_KEY = "cumulus_follow_seen";
function _followSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FOLLOW_SEEN_KEY) || "[]"));
  } catch (e) {
    return new Set();
  }
}
function newFromFollowed() {
  const notify = state.notifyHostIds || [];
  if (!state.userId || !notify.length) return [];
  const seen = _followSeen();
  const since = Date.now() - 14 * 86400000;
  return feedUpcoming().filter(
    (ev) => notify.includes(ev.hostId) && (ev.createdAt || 0) >= since && !seen.has(String(ev.id)),
  );
}
function dismissFollowedNew() {
  const seen = _followSeen();
  newFromFollowed().forEach((ev) => seen.add(String(ev.id)));
  try {
    localStorage.setItem(FOLLOW_SEEN_KEY, JSON.stringify([...seen].slice(-500)));
  } catch (e) {}
  const el = document.getElementById("feed-followed");
  if (el) {
    el.classList.add("out");
    setTimeout(() => el.remove(), 250);
  }
}

function renderFeed() {
  const all = feedUpcoming();
  const live = all.filter((ev) => eventStatus(ev) === "live");
  // Featured: live first, then soonest with photos, then soonest overall.
  const featured = [
    ...live,
    ...all.filter((ev) => eventStatus(ev) !== "live" && (ev.photoUrl || ev.nightShotUrl)),
    ...all.filter((ev) => eventStatus(ev) !== "live" && !(ev.photoUrl || ev.nightShotUrl)),
  ].slice(0, 6);
  const cats = Object.keys(CATS).filter((c) => all.some((ev) => ev.category === c));
  const [hello, kicker] = feedGreeting();
  const range = state.feedRange || "all";
  const cat = state.selectedCategory || "all";
  const ranges = [
    ["all", "Anytime"],
    ["today", "Tonight"],
    ["tomorrow", "Tomorrow"],
    ["weekend", "This weekend"],
    ["free", "Free"],
  ];
  const signedIn = !!state.userId;

  const ticker = live.length
    ? `<div class="feed-ticker" aria-label="Live now">
        <div class="ticker-track">${[...live, ...live, ...live]
          .map((ev) => `<button onclick="openEvent('${ev.id}')"><span class="pulse"></span>${escapeHtml(ev.title)} <em>${escapeHtml(ev.area || ev.venue || "")}</em></button>`)
          .join("")}</div>
      </div>`
    : "";

  return `<section class="feed">
    <header class="feed-head">
      <div class="feed-brand" onclick="goFeed()" role="button" tabindex="0" aria-label="Cumulus home">
        <span class="feed-mark" aria-hidden="true"></span><span>cumulus</span>
      </div>
      <div class="feed-head-actions">
        <button class="icon-pill" onclick="goBrowse()" aria-label="Open map">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>
          <span>Map</span>
        </button>
        ${
          signedIn
            ? `<button class="avatar-pill" onclick="navStack=[];openAccount()" aria-label="Your account">${escapeHtml(initials(state.profileName || "You"))}</button>`
            : `<button class="icon-pill solid" onclick="showLpSignup()">Sign in</button>`
        }
        <button id="feed-settings-btn" class="settings-btn" onclick="toggleFeedSettings()" aria-label="Settings" aria-expanded="false" aria-controls="feed-settings">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>
        </button>
      </div>
      <div id="feed-settings" class="feed-settings" role="dialog" aria-label="Settings">${appearanceMenuHtml()}</div>
    </header>

    <div class="feed-layout">
    <div class="feed-hero">
        <div class="feed-kicker"><span class="pulse"></span>${escapeHtml(kicker)}${live.length ? ` · ${live.length} live now` : ""}</div>
        <h1 class="feed-h1">${escapeHtml(hello)}</h1>
        <label class="feed-search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="search" placeholder="Artists, venues, vibes…" value="${escapeHtml(state.feedQuery || "")}" oninput="onFeedSearch(this.value)" aria-label="Search events" autocomplete="off"/>
        </label>
      </div>


      <aside class="feed-aside" aria-label="For organisers">
        <div class="feed-host-cta" onclick="openHostApply()" role="button" tabindex="0" aria-label="For organisers — host an event on Cumulus">
          <div class="fhc-stack" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="fhc-copy">
            <div class="fhc-kicker">For organisers</div>
            <div class="fhc-title">Throw something.</div>
            <div class="fhc-sub">Keep 100% of the ticket price. Paid out in 24–48h.</div>
            <span class="fhc-btn">Start hosting →</span>
          </div>
          <span class="fhc-go" aria-hidden="true">→</span>
        </div>
      </aside>

      <div class="feed-main">
    ${ticker}

    ${(() => {
      const fresh = newFromFollowed();
      if (!fresh.length) return "";
      return `<div class="feed-section feed-followed" id="feed-followed">
        <div class="feed-sec-head"><h2><span class="ff-bell" aria-hidden="true">🔔</span> New from hosts you follow</h2><button class="link-btn" onclick="dismissFollowedNew()">Clear</button></div>
        <div class="fr-list compact">${fresh.slice(0, 3).map((ev) => feedRowHtml(ev, "New")).join("")}</div>
      </div>`;
    })()}

    ${
      featured.length
        ? `<div class="feed-section">
        <div class="feed-sec-head"><h2>Don't miss</h2><span class="feed-count">${all.length} upcoming</span></div>
        <div class="fp-rail">${featured.map((ev, i) => feedPosterCardHtml(ev, i === 0 ? "xl" : "")).join("")}</div>
      </div>`
        : ""
    }

    <div class="feed-section feed-sticky-filters">
      <div class="chip-rail">${ranges
        .map(([k, l]) => `<button class="v-chip${range === k ? " on" : ""}" data-range="${k}" onclick="setFeedRange('${k}')">${l}</button>`)
        .join("")}</div>
      ${
        cats.length > 1
          ? `<div class="chip-rail cats">
          <button class="v-chip sm${cat === "all" ? " on" : ""}" data-fcat="all" onclick="setFeedCategory('all')">All</button>
          ${cats
            .map(
              (c) =>
                `<button class="v-chip sm${cat === c ? " on" : ""}" data-fcat="${escapeHtml(c)}" style="--dot:${posterPalette(c)[0]}" onclick="setFeedCategory('${c.replace(/'/g, "\\'")}')"><i></i>${escapeHtml(c)}</button>`,
            )
            .join("")}
        </div>`
          : ""
      }
    </div>

    <div class="feed-section">
      <div class="feed-sec-head"><h2>Coming up</h2><button class="link-btn" onclick="navStack=[];openCalendar()">Calendar →</button></div>
      <div id="feed-results">${feedResultsHtml()}</div>
    </div>

    <footer class="feed-foot">
      <a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><span>© Cumulus · London</span>
    </footer>
      </div>
    </div>
  </section>`;
}

// ── Settings dropdown (home header) ───────────────────────────────────────
// Opens from the three-line button, same behaviour as the map's filter
// dropdown: stays open while you change things, closes on outside tap / Esc.
function toggleFeedSettings(force) {
  const panel = document.getElementById("feed-settings");
  const btn = document.getElementById("feed-settings-btn");
  if (!panel || !btn) return;
  const open = force !== undefined ? force : !panel.classList.contains("open");
  panel.classList.toggle("open", open);
  btn.classList.toggle("on", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  document.removeEventListener("pointerdown", _feedSettingsOutside, true);
  document.removeEventListener("keydown", _feedSettingsEsc);
  if (open) {
    document.addEventListener("pointerdown", _feedSettingsOutside, true);
    document.addEventListener("keydown", _feedSettingsEsc);
  }
}
function _feedSettingsOutside(e) {
  const panel = document.getElementById("feed-settings");
  const btn = document.getElementById("feed-settings-btn");
  if (!panel || (!panel.contains(e.target) && !(btn && btn.contains(e.target)))) toggleFeedSettings(false);
}
function _feedSettingsEsc(e) {
  if (e.key === "Escape") toggleFeedSettings(false);
}

// ── Location: exact-coordinate map links ──────────────────────────────────
// Every event has real lat/lon (Mapbox Search Box on create, or the host's
// dropped pin). Hand those coordinates to Google/Apple Maps so the pin lands
// on the exact spot — a text search for a venue name Google doesn't know
// (or a typo'd address) used to land somewhere else or nowhere.
function hasCoords(ev) {
  return ev && typeof ev.lat === "number" && typeof ev.lon === "number" && isFinite(ev.lat) && isFinite(ev.lon);
}
function eventMapLinks(ev) {
  const label = [ev.venue, ev.address || ev.area].filter(Boolean).join(", ") || "London";
  const named = !!(ev.venue && ev.address);
  if (hasCoords(ev)) {
    const ll = `${ev.lat.toFixed(6)},${ev.lon.toFixed(6)}`;
    // With a real venue name + street address, search for exactly that so
    // Google/Apple open the place's own card (name, photos, hours, reviews)
    // — the full address keeps it from landing on a same-named place
    // elsewhere. Without them, fall back to the exact coordinates.
    const placeQ = encodeURIComponent(label);
    return {
      google: named
        ? `https://www.google.com/maps/search/?api=1&query=${placeQ}`
        : `https://www.google.com/maps/search/?api=1&query=${ll}`,
      directions: named
        ? `https://www.google.com/maps/dir/?api=1&destination=${placeQ}&travelmode=transit`
        : `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=transit`,
      apple: `https://maps.apple.com/?q=${encodeURIComponent(ev.venue || "Event")}${named ? `&address=${encodeURIComponent(ev.address)}` : ""}&ll=${ll}&z=17`,
      appleDirections: `https://maps.apple.com/?daddr=${named ? placeQ : ll}&dirflg=r`,
      label,
      named,
    };
  }
  const q = encodeURIComponent(label + (/london/i.test(label) ? "" : ", London"));
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`,
    apple: `https://maps.apple.com/?q=${q}`,
    appleDirections: `https://maps.apple.com/?daddr=${q}&dirflg=r`,
    label,
    named,
  };
}
// Mapbox Static Images preview with a Volt pin on the exact coordinates —
// themed to match the app. Falls back to nothing if there's no token/coords.
function eventStaticMapUrl(ev, w = 640, h = 240) {
  if (!hasCoords(ev) || !mapboxConfigured()) return "";
  const style = state.theme === "dark" ? "dark-v11" : "light-v11";
  const lon = ev.lon.toFixed(6),
    lat = ev.lat.toFixed(6);
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-l+d4ff3f(${lon},${lat})/${lon},${lat},15.2,0/${w}x${h}@2x?logo=false&attribution=false&access_token=${MAPBOX_TOKEN}`;
}
function isAppleDevice() {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
}

// Location sheet: Open in Google Maps / Directions / Apple Maps / Copy.
function openLocationSheet(id) {
  const ev = EVENTS.find((e) => String(e.id) === String(id));
  if (!ev) return;
  const L = eventMapLinks(ev);
  closeLocationSheet(true);
  const apple = isAppleDevice();
  const ic = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const row = (href, icon, title, sub, primary) =>
    `<a class="loc-opt${primary ? " primary" : ""}" href="${href}" target="_blank" rel="noopener" onclick="setTimeout(closeLocationSheet,150)">
      <span class="loc-ic">${icon}</span><span class="loc-txt"><b>${title}</b><span>${sub}</span></span><span class="loc-go" aria-hidden="true">↗</span>
    </a>`;
  const opts = [
    row(L.google, ic('<path d="M12 21s7-7.58 7-12A7 7 0 0 0 5 9c0 4.42 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>'), "Open in Google Maps", L.named ? `${escapeHtml(ev.venue)} · photos, hours & reviews` : "Pinned on the exact spot", true),
    row(L.directions, ic('<path d="M3 11 21 3l-8 18-2-8-8-2Z"/>'), "Get directions", "Google Maps · public transport", false),
    row(apple ? L.appleDirections : L.apple, ic('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>'), "Open in Apple Maps", apple ? "Directions on your iPhone" : "Opens maps.apple.com", false),
  ].join("");
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Open location");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>${escapeHtml(ev.venue || "Venue")}</b><span>${escapeHtml([ev.address, ev.area].filter(Boolean).join(" · ") || "London")}</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      ${opts}
      <button class="loc-opt" onclick="copyEventAddress('${ev.id}')">
        <span class="loc-ic">${ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>')}</span><span class="loc-txt"><b>Copy address</b><span>${escapeHtml(L.label)}</span></span>
      </button>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
}
function _locEsc(e) {
  if (e.key === "Escape") closeLocationSheet();
}
function closeLocationSheet(instant) {
  const el = document.getElementById("loc-sheet");
  document.removeEventListener("keydown", _locEsc);
  if (!el) return;
  if (instant) return el.remove();
  el.classList.remove("in");
  setTimeout(() => el.remove(), 250);
}
async function copyEventAddress(id) {
  const ev = EVENTS.find((e) => String(e.id) === String(id));
  if (!ev) return;
  const text = eventMapLinks(ev).label;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Address copied", "success");
  } catch (e) {
    showToast(text, "info");
  }
  closeLocationSheet();
}

// Mapbox reverse geocoding (v6): the real street address at a coordinate.
async function reverseGeocode(lat, lon) {
  if (!mapboxConfigured()) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&types=address,street&country=gb&language=en&access_token=${MAPBOX_TOKEN}`,
    );
    if (!res.ok) return null;
    const feats = (await res.json()).features || [];
    const f = feats.find((x) => x.properties?.feature_type === "address") || feats[0];
    if (!f) return null;
    const p = f.properties || {};
    const ctx = p.context || {};
    return {
      address: p.full_address || p.place_formatted || p.name || "",
      area: (ctx.neighborhood && ctx.neighborhood.name) || (ctx.locality && ctx.locality.name) || "",
    };
  } catch (e) {
    return null;
  }
}

function hideBootLoader() {
  const loader = document.getElementById("cumulus-loader");
  if (!loader || loader.dataset.hiding) return;
  loader.dataset.hiding = "1";
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 400);
}

function openTicketsTab() {
  if (!state.userId) {
    showToast("Sign in to see your tickets", "info");
    showLpSignup();
    return;
  }
  openMyTickets();
}

// ── Boot ──────────────────────────────────────────────────────────────────
// Lives in the LAST app script so every function start() can reach is
// already defined. Never let an unexpected rejection leave a blank screen.
start().catch((e) => {
  console.error("[cumulus] boot failed", e);
  try {
    enterGuestBrowse();
  } catch (_) {}
});
