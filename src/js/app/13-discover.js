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
  _rerenderFeedResults();
}
function setFeedCategory(c) {
  state.selectedCategory = c;
  _rerenderFeedResults();
}
let _feedSearchT = null;
function onFeedSearch(v) {
  state.feedQuery = v;
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

function feedRowHtml(ev) {
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
  return `<div class="fr-list">${list.map(feedRowHtml).join("")}</div>`;
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

function renderFeed() {
  const all = feedUpcoming();
  const live = all.filter((ev) => eventStatus(ev) === "live");
  // Featured: live first, then soonest with photos, then soonest overall.
  const featured = [
    ...live,
    ...all.filter((ev) => eventStatus(ev) !== "live" && (ev.photoUrl || ev.nightShotUrl)),
    ...all.filter((ev) => eventStatus(ev) !== "live" && !(ev.photoUrl || ev.nightShotUrl)),
  ].slice(0, 8);
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
      </div>
    </header>

    <div class="feed-hero">
      <div class="feed-kicker"><span class="pulse"></span>${escapeHtml(kicker)}${live.length ? ` · ${live.length} live now` : ""}</div>
      <h1 class="feed-h1">${escapeHtml(hello)}</h1>
      <label class="feed-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" placeholder="Artists, venues, vibes…" value="${escapeHtml(state.feedQuery || "")}" oninput="onFeedSearch(this.value)" aria-label="Search events" autocomplete="off"/>
      </label>
    </div>

    ${ticker}

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

    <div class="feed-host-cta" onclick="openHost()" role="button" tabindex="0">
      <div>
        <div class="fhc-kicker">For organisers</div>
        <div class="fhc-title">Throw something.<br/>Keep 100% of the ticket price.</div>
      </div>
      <span class="fhc-go" aria-hidden="true">→</span>
    </div>
    <footer class="feed-foot">
      <a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><span>© Cumulus · London</span>
    </footer>
  </section>`;
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
