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
  if (img) {
    // Absolute, because a relative url() inside a custom property resolves
    // against the stylesheet that uses it, not this page.
    let abs = String(img);
    try {
      abs = new URL(abs, document.baseURI).href;
    } catch (e) {}
    const u = `url('${abs.replace(/'/g, "%27")}')`;
    return `${vars}--p-img:${u};background-image:${u};`;
  }
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
// Sentence-case version for running text (sheet subtitles, summaries):
// "Tomorrow", "Sun 15 Nov", "Live now" — the caps label is for mono kickers.
function dateLabel(ev) {
  const s = feedDateLabel(ev).toLowerCase();
  return s.replace(/(^|\s)([a-z])/g, (m, a, b, i) => (i === 0 || /^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(s.slice(i + a.length)) ? a + b.toUpperCase() : m));
}
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
  const p = eventAllInPrice(ev);
  return p ? fmtGBP(p) : "Free";
}
function feedSpotsLeft(ev) {
  if (!ev.capacity) return null;
  return Math.max(0, ev.capacity - goingCount(ev.id));
}

function feedUpcoming() {
  return EVENTS.filter(
    (ev) =>
      ev.status !== "cancelled" &&
      ev.status !== "hidden" &&
      eventStatus(ev) !== "past",
  ).sort((a, b) => a.startsAt - b.startsAt);
}

// Current filter settings, as one object (the filter sheet edits a copy).
function feedFilterState() {
  let range = state.feedRange || "all";
  let price = state.feedPrice || "any";
  if (range === "free") (range = "all"), (price = "free"); // legacy chip value
  return { range, price, cat: state.selectedCategory || "all", hideSold: !!state.feedHideSold, near: !!state.nearMe, days: state.feedDays || [] };
}
// How many filters differ from the defaults (the badge on the Filters button).
function feedFilterCount(f = feedFilterState()) {
  return (f.range !== "all" && f.range !== "saved") + (f.price !== "any") + (f.cat !== "all") + f.hideSold + f.near + ((f.days || []).length > 0);
}
const PRICE_CAPS = { free: 0, u10: 10, u20: 20 };
function feedFiltered(f = feedFilterState()) {
  const q = (state.feedQuery || "").trim().toLowerCase();
  const { cat, range, price, hideSold } = f;
  const days = f.days && f.days.length ? new Set(f.days) : null;
  return feedUpcoming().filter((ev) => {
    if (cat !== "all" && ev.category !== cat) return false;
    if (days && !days.has(dayKey(ev.startsAt)) && !(eventStatus(ev) === "live" && days.has(dayKey(Date.now())))) return false;
    if (range === "saved" && !isSaved(ev.id)) return false;
    if (price !== "any") {
      const p = eventAllInPrice(ev);
      if (price === "free" ? p > 0 : p > PRICE_CAPS[price]) return false;
    }
    if (hideSold) {
      const left = feedSpotsLeft(ev);
      if (left !== null && left <= 0) return false;
    }
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
  // Tapping Home while already on Home scrolls to the top; coming back from
  // another tab returns to where you were.
  const already = state.view === "feed";
  if (!already && window._feedSeen) window._navBack = true;
  navStack = [];
  state.view = "feed";
  state.selectedEventId = null;
  renderNav();
  renderView();
  resetEventUrlAndMeta();
  if (already) window.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo(0, state._feedY || 0);
}
function setFeedRange(r) {
  state.feedRange = r;
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
  const f = feedFilterState();
  document.querySelectorAll("[data-range]").forEach((b) =>
    b.classList.toggle("on", b.dataset.range === f.range),
  );
  _syncFilterBadge(f);
  const near = document.querySelector('[data-near="1"]');
  if (near) {
    near.classList.remove("loading");
    near.classList.toggle("on", !!state.nearMe);
    near.setAttribute("aria-pressed", state.nearMe ? "true" : "false");
  }
  _syncDateStrip();
  _renderFeedDrop();
}

// ── Filters (Home) ────────────────────────────────────────────────────────
// One place for every filter: when, price, category, sort, sold-out — the
// Filters dropdown on the filter bar (below). The button shows how many are on.
const FILTER_SLIDERS = '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>';
function _syncFilterBadge(f = feedFilterState()) {
  const n = feedFilterCount(f);
  document.querySelectorAll(".ff-drop-btn").forEach((b) => {
    const badge = b.querySelector(".ffb-n");
    b.classList.toggle("on", !!n || b.getAttribute("aria-expanded") === "true");
    b.setAttribute("aria-label", `Filters${n ? ` (${n} on)` : ""}`);
    if (badge) (badge.hidden = !n), (badge.textContent = n || "");
  });
}
// The filter controls in the Filters dropdown (set = the handler name).
function _filterBodyHtml(d, set) {
  const seg = (key, opts) =>
    `<div class="ff-seg" role="radiogroup">${opts
      .map(([v, l]) => {
        const on = String(d[key]) === v;
        return `<button type="button" role="radio" aria-checked="${on}" class="${on ? "on" : ""}" onclick="${set}('${key}','${v}')">${l}</button>`;
      })
      .join("")}</div>`;
  const cats = Object.keys(CATS).filter((c) => feedUpcoming().some((ev) => ev.category === c));
  return `<div class="ff-body">
      <div class="ff-sec"><h4>When</h4>${seg("range", [["all", "Anytime"], ["today", "Tonight"], ["tomorrow", "Tomorrow"], ["weekend", "Weekend"]])}</div>
      <div class="ff-sec"><h4>Price</h4>${seg("price", [["any", "Any"], ["free", "Free"], ["u10", "Under £10"], ["u20", "Under £20"]])}</div>
      ${cats.length > 1 ? `<div class="ff-sec"><h4>Category</h4><div class="ff-cats">
        <button type="button" class="v-chip sm${d.cat === "all" ? " on" : ""}" onclick="${set}('cat','all')">All</button>
        ${cats.map((c) => `<button type="button" class="v-chip sm${d.cat === c ? " on" : ""}" style="--dot:${posterPalette(c)[0]}" onclick="${set}('cat','${c.replace(/'/g, "\\'")}')"><i></i>${escapeHtml(c)}</button>`).join("")}
      </div></div>` : ""}
      <div class="ff-sec"><h4>Sort</h4>${seg("near", [["false", "Soonest"], ["true", "Nearest to me"]])}</div>
      <label class="ff-toggle"><span><b>Hide sold-out events</b><small>Only show events you can still get into</small></span>
        <input type="checkbox" ${d.hideSold ? "checked" : ""} onchange="${set}('hideSold',this.checked)"/><i aria-hidden="true"></i></label>
    </div>`;
}
// ── Filters dropdown (the filter bar under "Don't miss") ──────────────────
// Every filter lives here; it drops down from the bar and each change
// applies straight away. The date strip sits under it in the same bar.
function feedDropBtnHtml() {
  const n = feedFilterCount();
  return `<button type="button" class="v-chip ff-drop-btn${n ? " on" : ""}" onclick="toggleFeedDrop()" aria-haspopup="true" aria-expanded="false" aria-controls="ff-drop" aria-label="Filters${n ? ` (${n} on)` : ""}">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true">${FILTER_SLIDERS}</svg>Filters<b class="ffb-n"${n ? "" : " hidden"}>${n || ""}</b>
    <svg class="ffd-caret" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`;
}
function toggleFeedDrop(force) {
  const bar = document.querySelector(".feed-sticky-filters");
  const btn = bar && bar.querySelector(".ff-drop-btn");
  if (!bar || !btn) return;
  let panel = document.getElementById("ff-drop");
  const open = force !== undefined ? force : !panel;
  if (!open) {
    if (panel) {
      panel.classList.remove("in");
      panel.id = "";
      setTimeout(() => panel.remove(), 180);
    }
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", _feedDropOutside, true);
    document.removeEventListener("keydown", _feedDropEsc);
    removeEventListener("scroll", _placeFeedDrop);
    removeEventListener("resize", _placeFeedDrop);
    if (_feedDropRO) _feedDropRO.disconnect(), (_feedDropRO = null);
    return _syncFilterBadge();
  }
  if (panel) return;
  panel = document.createElement("div");
  panel.id = "ff-drop";
  panel.className = "ff-drop";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Filters");
  bar.appendChild(panel);
  btn.setAttribute("aria-expanded", "true");
  _renderFeedDrop();
  _syncFilterBadge();
  requestAnimationFrame(() => panel.classList.add("in"));
  document.addEventListener("pointerdown", _feedDropOutside, true);
  document.addEventListener("keydown", _feedDropEsc);
  addEventListener("scroll", _placeFeedDrop, { passive: true });
  addEventListener("resize", _placeFeedDrop);
  if (window.ResizeObserver) {
    _feedDropRO = new ResizeObserver(() => requestAnimationFrame(_placeFeedDrop));
    _feedDropRO.observe(document.body);
  }
}
function _feedDropOutside(e) {
  if (!e.target.closest("#ff-drop, .ff-drop-btn")) toggleFeedDrop(false);
}
function _feedDropEsc(e) {
  if (e.key === "Escape") {
    toggleFeedDrop(false);
    document.querySelector(".ff-drop-btn")?.focus();
  }
}
function _renderFeedDrop() {
  const panel = document.getElementById("ff-drop");
  if (!panel) return;
  const f = feedFilterState();
  if (f.range === "saved") f.range = "all";
  const n = feedFiltered().length;
  const keepY = panel.scrollTop;
  panel.innerHTML = `${_filterBodyHtml(f, "_fdSet")}
    <div class="ffd-foot"><span><b>${n}</b> event${n === 1 ? "" : "s"}</span>
      <button type="button" class="link-btn" onclick="_fdSet('clear')"${feedFilterCount(f) ? "" : " disabled"}>Clear all</button>
      <button type="button" class="v-btn sm" onclick="toggleFeedDrop(false)">Done</button></div>`;
  panel.scrollTop = keepY;
  requestAnimationFrame(_placeFeedDrop);
}
// Keep the dropdown on screen between the bar and the tab dock: drop down
// when there's room, otherwise open upwards. Re-run whenever the page can
// move under it (scroll, results changing height).
function _placeFeedDrop() {
  const panel = document.getElementById("ff-drop");
  const bar = panel && panel.parentNode;
  if (!bar || !bar.getBoundingClientRect) return;
  // the visible tab dock (it can be mid-hide while scrolling, so allow for its full height)
  const dock = [...document.querySelectorAll(".bottom-nav")].find((n) => n.offsetHeight > 0);
  const floor = innerHeight - (dock ? dock.offsetHeight + 14 : 0);
  const head = document.querySelector(".feed-head")?.getBoundingClientRect().bottom || 0;
  const B = bar.getBoundingClientRect();
  const below = floor - B.bottom - 12;
  const above = B.top - head - 12;
  const up = below < 300 && above > below;
  panel.classList.toggle("up", up);
  panel.style.maxHeight = `${Math.max(180, up ? above : below)}px`;
}
let _feedDropRO = null;
function _fdSet(k, v) {
  if (k === "clear") {
    Object.assign(state, { feedRange: "all", feedPrice: "any", selectedCategory: "all", feedHideSold: false, feedDays: [] });
    state.feedLimit = FEED_PAGE;
    if (state.nearMe) return toggleNearMe();
    return _rerenderFeedResults();
  }
  if (k === "near") {
    if ((v === true || v === "true") !== !!state.nearMe) toggleNearMe();
    return _renderFeedDrop();
  }
  if (k === "range") state.feedRange = v;
  else if (k === "price") state.feedPrice = v;
  else if (k === "cat") state.selectedCategory = v;
  else if (k === "hideSold") state.feedHideSold = !!v;
  if (state.feedRange === "free") state.feedRange = "all";
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
}

// ── Your crew (friends going) ─────────────────────────────────────────────
// Dice/Partiful's strongest pull: "your mates are going". Crew = anyone
// you've shared a Squad with (see crew_going() in the 20261112 migration).
function crewFor(ev) {
  return (state.crewGoing && state.crewGoing[String(ev.id)]) || [];
}
function _crewNames(list) {
  const n = list.map((p) => escapeHtml(p.name));
  if (n.length === 1) return n[0];
  if (n.length === 2) return `${n[0]} &amp; ${n[1]}`;
  return `${n[0]}, ${n[1]} +${n.length - 2}`;
}
function crewFacesHtml(list) {
  return `<span class="crew-faces" aria-hidden="true">${list
    .slice(0, 3)
    .map((p) => (p.avatar ? `<i style="background-image:url('${escapeHtml(p.avatar)}')"></i>` : `<i>${escapeHtml(initials(p.name))}</i>`))
    .join("")}</span>`;
}
function crewChipHtml(ev, variant) {
  const list = crewFor(ev);
  return `<span class="crew-chip ${variant || ""}">${crewFacesHtml(list)}${_crewNames(list)} going</span>`;
}
function crewLineHtml(ev) {
  const list = crewFor(ev);
  if (!list.length) return "";
  return `<div class="crew-line">${crewFacesHtml(list)}<span><b>${_crewNames(list)}</b> ${list.length === 1 ? "is" : "are"} going</span></div>`;
}
function crewUpcoming() {
  return feedUpcoming().filter((ev) => crewFor(ev).length);
}
async function toggleShareGoing() {
  const next = state.shareGoing === false;
  const ok = await saveShareGoing(next);
  if (!ok) return showToast("Couldn't update that — try again", "error");
  state.shareGoing = next;
  const b = document.querySelector("[data-share-going]");
  if (b) {
    b.classList.toggle("on", next);
    b.setAttribute("aria-checked", next ? "true" : "false");
  }
  showToast(next ? "Your crew can see what you're going to" : "Your plans are private now", "info");
}
function privacyMenuHtml() {
  if (!state.userId) return "";
  const on = state.shareGoing !== false;
  return `<div class="set-group-title">Privacy</div>
    <div class="set-list">
      <button type="button" role="switch" class="set-opt set-switch${on ? " on" : ""}" data-share-going aria-checked="${on}" onclick="toggleShareGoing()">
        <span class="set-txt"><b>Show my crew what I'm going to</b><span>Only people you've shared squad tickets with</span></span>
        <span class="set-toggle" aria-hidden="true"><i></i></span>
      </button>
    </div>`;
}

// ── Up next (your next ticket) ────────────────────────────────────────────
// The in-app half of the 24h reminder: the moment you open Cumulus within a
// day and a half of something you've booked, it's the first thing you see —
// QR, directions and calendar one tap away.
function nextTicketEvent() {
  if (!state.userId || typeof myTickets === "undefined" || !myTickets.length) return null;
  const now = Date.now();
  return (
    myTickets
      .map((t) => EVENTS.find((e) => e.id === t.eventId))
      .filter((ev) => ev && eventStatus(ev) !== "past" && ev.startsAt - now < 36 * 3600000)
      .sort((a, b) => a.startsAt - b.startsAt)[0] || null
  );
}
function upNextHtml() {
  const ev = nextTicketEvent();
  if (!ev) return "";
  const st = eventStatus(ev);
  const when = st === "live" ? "Happening now" : feedDateLabel(ev);
  return `<div class="up-next" role="region" aria-label="Your next event">
    <div class="un-art ${posterClass(ev)}" style="${posterStyle(ev)}" aria-hidden="true">${posterGlyph(ev)}</div>
    <div class="un-body">
      <div class="un-kicker">${st === "live" ? '<span class="pulse"></span>' : ""}Up next · ${escapeHtml(when)} · ${feedTimeLabel(ev)}</div>
      <div class="un-title" onclick="openEvent('${ev.id}')" role="link" tabindex="0">${escapeHtml(ev.title)}</div>
      <div class="un-venue">${escapeHtml([ev.venue, ev.area].filter(Boolean).join(" · "))}</div>
      <div class="un-acts">
        <button class="v-btn sm" onclick="openViewTicket('${ev.id}')">Show QR</button>
        <button class="v-btn sm ghost" onclick="openLocationSheet('${ev.id}')">Directions</button>
        <button class="v-btn sm ghost" onclick="openCalendarSheet('${ev.id}')">Calendar</button>
      </div>
    </div>
  </div>`;
}

// ── The hook: why Cumulus, in one glance ──────────────────────────────────
// What a first-timer needs to know before they've scrolled: the three things
// the big ticketing apps don't promise. Guests only — once you're signed in
// you've already seen it.
function promiseStripHtml() {
  const ic = (d) => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return `<ul class="promise-strip" aria-label="Why Cumulus">
    <li>${ic('<path d="m5 12 5 5 9-10"/>')}<span><b>The price is the price</b>All fees shown up front</span></li>
    <li>${ic('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')}<span><b>Face value, always</b>Returns go to the waitlist</span></li>
    <li class="pr-link" onclick="goBrowse()" role="link" tabindex="0">${ic('<path d="M12 21s7-7.6 7-12A7 7 0 0 0 5 9c0 4.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>')}<span><b>Live London map</b>What's on near you, now</span></li>
  </ul>`;
}

// ── "Don't miss" wheel ────────────────────────────────────────────────────
// A roulette wheel of equal-size posters: the set is laid out three times
// (copy · real · copy) and the view starts on the real set, so there are
// always cards either side — no empty gap on the left — and it spins round
// forever in both directions. When a spin settles inside a copy, it hops
// silently to the same card in the real set. Arrows, swipe, keys and dots.
function wheelCardsHtml(list) {
  const n = list.length;
  if (n < 2) return list.map((ev) => feedPosterCardHtml(ev, "on")).join("");
  return [0, 1, 2]
    .map((rep) =>
      list
        .map((ev, i) => {
          const html = feedPosterCardHtml(ev, rep === 1 && i === 0 ? "on" : "");
          // Copies are visual only: one real, focusable card per event.
          return rep === 1 ? html.replace('class="fp-card', `data-wi="${i}" class="fp-card`) : html.replace('class="fp-card', `data-wi="${i}" aria-hidden="true" class="fp-card clone`).replace('tabindex="0"', 'tabindex="-1"');
        })
        .join(""),
    )
    .join("");
}
function _wheelCards() {
  const rail = document.getElementById("fp-rail");
  return rail ? [rail, [...rail.querySelectorAll(".fp-card")]] : [null, []];
}
function _wheelN() {
  const [, cards] = _wheelCards();
  return cards.length >= 6 && cards.length % 3 === 0 ? cards.length / 3 : cards.length;
}
function _wheelIndex() {
  const [rail, cards] = _wheelCards();
  if (!rail || !cards.length) return 0;
  const mid = rail.scrollLeft + rail.clientWidth / 2;
  let best = 0;
  let bestD = Infinity;
  cards.forEach((c, i) => {
    const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
function _wheelLeftFor(rail, c) {
  return c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2;
}
function _wheelTo(k, smooth) {
  const [rail, cards] = _wheelCards();
  if (!rail || !cards[k]) return;
  rail.scrollTo({ left: _wheelLeftFor(rail, cards[k]), behavior: smooth ? "smooth" : "auto" });
}
// Called after every feed paint: park on the first real card.
function wheelInit() {
  const [rail, cards] = _wheelCards();
  if (!rail || !cards.length) return;
  const n = _wheelN();
  const start = cards.length === n * 3 ? n : 0;
  rail.style.scrollBehavior = "auto";
  rail.scrollLeft = _wheelLeftFor(rail, cards[start]);
  rail.style.scrollBehavior = "";
  _wheelMark(start);
}
function wheelGo(i) {
  const [, cards] = _wheelCards();
  const n = _wheelN();
  if (!cards.length) return;
  const looped = cards.length === n * 3;
  _wheelTo(looped ? n + (((i % n) + n) % n) : Math.max(0, Math.min(cards.length - 1, i)), true);
}
function wheelStep(dir) {
  const [, cards] = _wheelCards();
  const n = _wheelN();
  const looped = cards.length === n * 3;
  const k = _wheelIndex() + dir;
  _wheelTo(looped ? k : ((k % n) + n) % n, true);
}
function _wheelMark(k) {
  const [, cards] = _wheelCards();
  const n = _wheelN();
  cards.forEach((c, j) => c.classList.toggle("on", j === k));
  document.querySelectorAll(".fw-dots button").forEach((d, j) => d.classList.toggle("on", j === k % n));
}
let _wheelRaf = 0;
let _wheelSettle = 0;
function wheelSync() {
  if (!_wheelRaf)
    _wheelRaf = requestAnimationFrame(() => {
      _wheelRaf = 0;
      _wheelMark(_wheelIndex());
    });
  // Once the spin has fully stopped, hop out of a copy into the real set.
  // Native `scrollend` where the browser has it (fires after momentum and
  // snapping finish), a quiet-period timer elsewhere.
  const rail = document.getElementById("fp-rail");
  if (rail && "onscrollend" in rail) {
    if (!rail._wheelEnd) {
      rail._wheelEnd = true;
      rail.addEventListener("scrollend", _wheelRecentre);
    }
    return;
  }
  clearTimeout(_wheelSettle);
  _wheelSettle = setTimeout(_wheelRecentre, 220);
}
// Same card, same pixel position — and with every transition switched off
// for that frame, so the swap is invisible (no scale/fade replay, which is
// what made a full lap look like the rail refreshing).
function _wheelRecentre() {
  const [rail, cards] = _wheelCards();
  const n = _wheelN();
  if (!rail || cards.length !== n * 3) return;
  const k = _wheelIndex();
  if (k >= n && k < 2 * n) return;
  const target = k < n ? k + n : k - n;
  const shift = cards[target].offsetLeft - cards[k].offsetLeft;
  rail.classList.add("fw-jump");
  rail.style.scrollSnapType = "none";
  rail.style.scrollBehavior = "auto";
  rail.scrollLeft += shift;
  _wheelMark(target);
  void rail.offsetWidth; // commit the jump with transitions off
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      rail.style.scrollSnapType = "";
      rail.style.scrollBehavior = "";
      rail.classList.remove("fw-jump");
    }),
  );
}

// ── Building blocks ───────────────────────────────────────────────────────
function feedPosterCardHtml(ev, size) {
  const st = eventStatus(ev);
  const left = feedSpotsLeft(ev);
  const scarce = left !== null && left > 0 && left <= Math.max(3, Math.ceil(ev.capacity * 0.15));
  return `<article class="fp-card ${size || ""}" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}"><i class="fp-glare" aria-hidden="true"></i>
    <div class="${posterClass(ev)}" style="${posterStyle(ev)}">
      ${posterGlyph(ev)}
      <div class="fp-top">
        <span class="fp-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)}</span>
        <span class="fp-top-r">
          ${scarce ? `<span class="fp-hot">${left} left</span>` : isHotEvent(ev) && st !== "live" ? `<span class="fp-hot">Selling fast</span>` : ""}
          ${saveBtnHtml(ev, "on-poster")}
        </span>
      </div>
      <div class="fp-bottom">
        ${crewFor(ev).length ? crewChipHtml(ev, "on-poster") : `<div class="fp-cat">${escapeHtml(ev.category || "Event")}</div>`}
        <h3 class="fp-title">${escapeHtml(ev.title)}</h3>
        <div class="fp-meta"><span>${escapeHtml(ev.venue || ev.area || "London")}</span><span class="fp-price">${feedPriceLabel(ev)}</span></div>
      </div>
    </div>
  </article>`;
}

function feedRowHtml(ev, tag) {
  const st = eventStatus(ev);
  const left = feedSpotsLeft(ev);
  const going = goingCount(ev.id);
  return `<article class="fr-row" data-ev="${ev.id}" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}">
    <div class="fr-thumb ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}</div>
    <div class="fr-body">
      <div class="fr-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}${ev._dist != null ? ` <span class="fr-dist">· ${fmtDistance(ev._dist)}</span>` : ""}</div>
      <h3 class="fr-title">${escapeHtml(ev.title)}</h3>
      <div class="fr-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
      <div class="fr-foot">
        ${tag ? `<span class="fr-chip tag">${escapeHtml(tag)}</span>` : ""}
        ${left !== null && left <= 10 && left > 0 ? `<span class="fr-chip warn">Only ${left} left</span>` : ""}
        ${left === 0 ? `<span class="fr-chip">Waitlist</span>` : ""}
        ${crewFor(ev).length ? crewChipHtml(ev) : going >= 2 ? `<span class="fr-chip">${going} going</span>` : ""}
      </div>
    </div>
    <div class="fr-side">
      ${
        eventPrice(ev)
          ? `<div class="fr-cost"><b>${feedPriceLabel(ev)}</b><small>incl. fees</small></div>`
          : `<div class="fr-cost free"><b>Free</b></div>`
      }
      ${saveBtnHtml(ev, "in-row")}
    </div>
  </article>`;
}

// ── Saved events (♥) ──────────────────────────────────────────────────────
// Eventbrite's heart / Dice's "interested": the cheapest retention loop
// there is. Per device (localStorage), works for guests too; the Tickets tab
// lists them and Discover gets a "♥ Saved" chip once there are any.
const SAVED_KEY = "cumulus_saved";
function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]").map(String);
  } catch (e) {
    return [];
  }
}
function isSaved(id) {
  return getSavedIds().includes(String(id));
}
function savedUpcoming() {
  const ids = getSavedIds();
  return feedUpcoming().filter((ev) => ids.includes(String(ev.id)));
}
function saveBtnHtml(ev, variant) {
  const on = isSaved(ev.id);
  return `<button type="button" class="save-btn ${variant || ""}${on ? " on" : ""}" data-save-id="${escapeHtml(String(ev.id))}" onclick="event.stopPropagation();toggleSave('${ev.id}')" aria-pressed="${on}" aria-label="${on ? "Remove from saved" : "Save"}: ${escapeHtml(ev.title)}">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.4-9.3C1.4 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.7 4.4 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"/></svg>
  </button>`;
}
function toggleSave(id) {
  id = String(id);
  const ids = getSavedIds();
  const on = !ids.includes(id);
  const next = on ? [...ids, id] : ids.filter((x) => x !== id);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next.slice(-300)));
  } catch (e) {}
  if (on) pushSavedEvents([id]);
  else removeSavedEvent(id);
  document.querySelectorAll(`[data-save-id="${CSS.escape(id)}"]`).forEach((b) => {
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    const ev = EVENTS.find((e) => String(e.id) === id);
    if (ev) b.setAttribute("aria-label", `${on ? "Remove from saved" : "Save"}: ${ev.title}`);
    if (on) {
      b.classList.remove("pop");
      void b.offsetWidth;
      b.classList.add("pop");
    }
  });
  if (on && typeof saveBurst === "function") {
    const src = window.event && window.event.target && window.event.target.closest && window.event.target.closest("[data-save-id]");
    saveBurst(src || document.querySelector(`[data-save-id="${CSS.escape(id)}"]`));
  }
  showToast(
    on ? (state.userId ? "Saved — it's in your Tickets" : "Saved — find it under Saved on Discover") : "Removed from saved",
    on ? "success" : "info",
  );
  if (state.view === "feed") {
    if (state.feedRange === "saved" && !next.length) state.feedRange = "all";
    _rerenderFeedResults();
    _refreshSavedChip();
  } else if (state.view === "my-tickets") renderView();
}
// On sign-in: union this device's saves with the account's, write the union
// back both ways, then repaint anything showing hearts.
async function syncSavedEvents() {
  const remote = await loadSavedEventIds();
  if (!remote) return;
  const local = getSavedIds();
  const merged = [...new Set([...remote, ...local])];
  pushSavedEvents(local.filter((id) => !remote.includes(id)));
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(merged.slice(-300)));
  } catch (e) {}
  if (merged.length !== local.length) {
    document.querySelectorAll("[data-save-id]").forEach((b) => {
      const on = merged.includes(b.dataset.saveId);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    _refreshSavedChip();
    if (state.view === "my-tickets") renderView();
  }
}
function _refreshSavedChip() {
  const n = savedUpcoming().length;
  const chip = document.querySelector('[data-range="saved"]');
  if (chip) {
    chip.style.display = n ? "" : "none";
    const c = chip.querySelector("b");
    if (c) c.textContent = n;
  }
}

// ── Near me ───────────────────────────────────────────────────────────────
// Fever / Eventbrite "near you": one tap sorts by distance and labels each
// row "1.2 km". Asks for location only when the chip is tapped.
function fmtDistance(m) {
  return m < 950 ? `${Math.max(50, Math.round(m / 50) * 50)} m` : `${(m / 1000).toFixed(m < 9950 ? 1 : 0)} km`;
}
function _metresBetween(a, b, c, d) {
  const R = 6371000,
    r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function toggleNearMe() {
  if (state.nearMe) {
    state.nearMe = false;
    EVENTS.forEach((e) => delete e._dist);
    state.feedLimit = FEED_PAGE;
    return _rerenderFeedResults();
  }
  if (!navigator.geolocation) return showToast("Location isn't available on this device", "error");
  const chip = document.querySelector('[data-near="1"]');
  if (chip) chip.classList.add("loading");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      state.nearMe = true;
      state.feedLimit = FEED_PAGE;
      _rerenderFeedResults();
    },
    () => {
      if (chip) chip.classList.remove("loading");
      showToast("Allow location to sort events near you", "info");
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
  );
}

// ── Date strip ("Coming up") ──────────────────────────────────────────────
// The next fortnight as big, tappable days; tap several to see them all,
// or pick any date further out. Works alongside the When/Price/etc filters.
const FEED_STRIP_DAYS = 14;
function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function feedDateStripHtml() {
  const picked = new Set(state.feedDays || []);
  const counts = {};
  feedUpcoming().forEach((ev) => {
    const k = dayKey(ev.startsAt);
    counts[k] = (counts[k] || 0) + 1;
  });
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  const keys = [];
  for (let i = 0; i < FEED_STRIP_DAYS; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    keys.push([dayKey(d), d, i]);
  }
  // dates picked from the calendar beyond the strip still show, at the end
  const extra = [...picked].filter((k) => !keys.some(([kk]) => kk === k)).sort();
  extra.forEach((k) => keys.push([k, new Date(k + "T12:00:00"), 99]));
  const cell = ([k, d, i]) => {
    const n = counts[k] || 0;
    const on = picked.has(k);
    const top = i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-GB", { weekday: "short" });
    const label = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    return `<button type="button" class="fd-day${on ? " on" : ""}${n ? "" : " none"}${d.getDay() === 0 || d.getDay() === 6 ? " wknd" : ""}" data-day="${k}" aria-pressed="${on}" aria-label="${label}, ${n || "no"} event${n === 1 ? "" : "s"}" onclick="toggleFeedDay('${k}')">
      <span class="fd-wd">${top}</span><b>${d.getDate()}</b><span class="fd-mo">${d.toLocaleDateString("en-GB", { month: "short" })}</span><i class="fd-n">${n ? n : ""}</i></button>`;
  };
  return `<div class="fd-strip" role="group" aria-label="Pick days">
    <button type="button" class="fd-day fd-any${picked.size ? "" : " on"}" aria-pressed="${!picked.size}" onclick="clearFeedDays()"><span class="fd-wd">Any</span><b>All</b><span class="fd-mo">dates</span></button>
    ${keys.map(cell).join("")}
    <label class="fd-day fd-pick" aria-label="Pick a date">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      <span class="fd-mo">More</span>
      <input type="date" min="${dayKey(Date.now())}" onclick="try{this.showPicker()}catch(e){}" onchange="if(this.value){pickFeedDay(this.value)}"/>
    </label>
  </div>`;
}
function _syncDateStrip() {
  const el = document.querySelector(".fd-strip");
  if (!el) return;
  const x = el.scrollLeft;
  el.outerHTML = feedDateStripHtml();
  const nu = document.querySelector(".fd-strip");
  if (nu) nu.scrollLeft = x;
}
function toggleFeedDay(k) {
  const set = new Set(state.feedDays || []);
  set.has(k) ? set.delete(k) : set.add(k);
  state.feedDays = [...set].sort();
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
}
function pickFeedDay(k) {
  const set = new Set(state.feedDays || []);
  set.add(k);
  state.feedDays = [...set].sort();
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
  requestAnimationFrame(() => document.querySelector(`.fd-day[data-day="${k}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }));
}
function clearFeedDays() {
  state.feedDays = [];
  state.feedLimit = FEED_PAGE;
  _rerenderFeedResults();
}

function feedResultsHtml() {
  if (!state.eventsLoaded && !EVENTS.length) {
    return `<div class="fr-list" aria-busy="true">${Array.from({ length: 4 })
      .map(() => `<div class="fr-row skel"><div class="fr-thumb"></div><div class="fr-body"><i></i><i></i><i></i></div></div>`)
      .join("")}</div>`;
  }
  let list = feedFiltered();
  if (state.nearMe && state.userLoc) {
    list.forEach((ev) => {
      ev._dist = hasCoords(ev) ? _metresBetween(state.userLoc.lat, state.userLoc.lon, ev.lat, ev.lon) : null;
    });
    list = [...list].sort((a, b) => (a._dist ?? 1e12) - (b._dist ?? 1e12));
  }
  if (!list.length) {
    const anything = feedUpcoming().length > 0;
    return `<div class="feed-empty">
      <div class="feed-empty-art" aria-hidden="true">☁︎</div>
      <h3>${anything ? "Nothing matches that." : "London's quiet. For now."}</h3>
      <p>${anything ? "Try another day or category — or clear your search." : "New events drop here first. Got something in mind? Put it on the map."}</p>
      <div class="feed-empty-actions">
        ${anything ? `<button class="v-btn" onclick="state.feedQuery='';state.feedRange='all';state.feedPrice='any';state.feedDays=[];state.selectedCategory='all';renderView()">Show everything</button>` : `<button class="v-btn" onclick="openHost()">Host an event</button>`}
        <button class="v-btn ghost" onclick="goBrowse()">Open the map</button>
      </div>
    </div>`;
  }
  const limit = state.feedLimit || FEED_PAGE;
  const shown = list.slice(0, limit);
  let lastDay = null;
  const dayCounts = {};
  if (!state.nearMe) list.forEach((ev) => ((k) => (dayCounts[k] = (dayCounts[k] || 0) + 1))(feedDayHeading(ev)));
  const rows = shown
    .map((ev) => {
      const day = state.nearMe ? "Nearest first" : feedDayHeading(ev);
      const head = day !== lastDay ? feedDayHeadHtml(ev, day, dayCounts) : "";
      lastDay = day;
      return head + feedRowHtml(ev);
    })
    .join("");
  const left = list.length - shown.length;
  return `<div class="fr-list compact">${rows}</div>${
    left > 0
      ? `<button class="v-btn ghost wide feed-more" onclick="state.feedLimit=(state.feedLimit||FEED_PAGE)+FEED_PAGE;_rerenderFeedResults()">Show ${Math.min(left, FEED_PAGE)} more${left > FEED_PAGE ? ` <span>of ${left}</span>` : ""}</button>`
      : list.length > FEED_PAGE
        ? `<div class="feed-end">That's everything coming up</div>`
        : ""
  }`;
}

const FEED_PAGE = 12;
// "Live now" / "Tonight" / "Tomorrow" / "Sat 15 Nov" — day group headings.
// A day's heading in the Home list: the day big, its date beside it, and
// how many events it has, so it's obvious at a glance which day you're in.
function feedDayHeadHtml(ev, day, counts) {
  if (state.nearMe) return `<div class="fr-day"><b>Nearest first</b></div>`;
  const n = counts[day] || 0;
  const live = day === "Live now";
  const d = new Date(live ? Date.now() : ev.startsAt);
  const big = live ? "Live now" : day === "Today & tonight" ? "Today" : day === "Tomorrow" ? "Tomorrow" : d.toLocaleDateString("en-GB", { weekday: "long" });
  const small = d.toLocaleDateString("en-GB", day === "Today & tonight" || day === "Tomorrow" || live ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "long" });
  return `<h3 class="fr-day${live ? " live" : ""}">${live ? '<span class="pulse"></span>' : ""}<b>${escapeHtml(big)}</b><span>${escapeHtml(small)}</span><em>${n} event${n === 1 ? "" : "s"}</em></h3>`;
}
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
  const [hello, kicker] = feedGreeting();
  const range = state.feedRange || "all";
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
            ? `<button id="feed-account-btn" class="avatar-pill" onclick="toggleAccountMenu()" aria-label="Your account" aria-haspopup="true" aria-expanded="false" aria-controls="feed-account">${escapeHtml(initials(state.profileName || "You"))}</button>`
            : `<button class="icon-pill solid" onclick="showLpSignup()">Sign in</button>`
        }
        <button id="feed-settings-btn" class="settings-btn" onclick="toggleFeedSettings()" aria-label="Settings" aria-expanded="false" aria-controls="feed-settings">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>
        </button>
      </div>
      <div id="feed-settings" class="feed-settings" role="dialog" aria-label="Settings">${appearanceMenuHtml()}${privacyMenuHtml()}</div>
      ${signedIn ? `<div id="feed-account" class="feed-settings feed-account" role="menu" aria-label="Your account">${accountMenuHtml()}</div>` : ""}
    </header>

    <div class="feed-layout">
    <div class="feed-hero">
        <div class="feed-kicker"><span class="pulse"></span>${escapeHtml(kicker)}${live.length ? ` · <b data-countup>${live.length}</b> live now` : ""}</div>
        <h1 class="feed-h1">${escapeHtml(hello)}</h1>
        <div class="feed-search-row">
          <label class="feed-search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="search" placeholder="Artists, venues, vibes…" value="${escapeHtml(state.feedQuery || "")}" oninput="onFeedSearch(this.value)" aria-label="Search events" autocomplete="off"/>
          </label>
        </div>
        ${signedIn ? "" : promiseStripHtml()}
      </div>


      <aside class="feed-aside" aria-label="For organisers">
        <div class="feed-host-cta" onclick="openHostApply()" role="button" tabindex="0" aria-label="For organisers — host an event on Cumulus">
          <div class="fhc-stack" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="fhc-copy">
            <div class="fhc-kicker">For organisers</div>
            <div class="fhc-title">Host your own events.</div>
            <div class="fhc-sub">Interested in hosting for your community? See how it works.</div>
            <span class="fhc-btn">Find out more →</span>
          </div>
          <span class="fhc-go" aria-hidden="true">→</span>
        </div>
      </aside>

      <div class="feed-main">
    ${upNextHtml()}
    ${ticker}

    ${(() => {
      const crew = crewUpcoming();
      if (!crew.length) return "";
      return `<div class="feed-section">
        <div class="feed-sec-head"><h2>Your crew's going</h2><span class="feed-count">${crew.length}</span></div>
        <div class="fr-list compact">${crew.slice(0, 4).map((ev) => feedRowHtml(ev)).join("")}</div>
      </div>`;
    })()}

    ${(() => {
      const fresh = newFromFollowed();
      if (!fresh.length) return "";
      return `<div class="feed-section feed-followed" id="feed-followed">
        <div class="feed-sec-head"><h2><span class="ff-bell" aria-hidden="true"><svg class="ui-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span> New from hosts you follow</h2><button class="link-btn" onclick="dismissFollowedNew()">Clear</button></div>
        <div class="fr-list compact">${fresh.slice(0, 3).map((ev) => feedRowHtml(ev, "New")).join("")}</div>
      </div>`;
    })()}

    ${
      featured.length
        ? `<div class="feed-section">
        <div class="feed-sec-head"><h2>Don't miss</h2><span class="feed-count"><b data-countup>${all.length}</b> upcoming</span></div>
        <div class="fp-wheel" role="region" aria-roledescription="carousel" aria-label="Don't miss">
          <button type="button" class="fw-arrow prev" onclick="wheelStep(-1)" aria-label="Previous event"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <div class="fp-rail" id="fp-rail" onscroll="wheelSync()" onkeydown="if(event.key==='ArrowRight'){event.preventDefault();wheelStep(1)}else if(event.key==='ArrowLeft'){event.preventDefault();wheelStep(-1)}">${wheelCardsHtml(featured)}</div>
          <button type="button" class="fw-arrow next" onclick="wheelStep(1)" aria-label="Next event"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
        ${featured.length > 1 ? `<div class="fw-dots" aria-hidden="true">${featured.map((_, i) => `<button type="button" tabindex="-1" class="${i === 0 ? "on" : ""}" onclick="wheelGo(${i})" aria-label="Show card ${i + 1}"></button>`).join("")}</div>` : ""}
      </div>`
        : ""
    }

    <div class="feed-section feed-sticky-filters">
      <div class="fbar-row">
        ${feedDropBtnHtml()}
        <button class="v-chip near${state.nearMe ? " on" : ""}" data-near="1" onclick="toggleNearMe()" aria-pressed="${!!state.nearMe}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>Near me</button>
        <button class="v-chip saved${range === "saved" ? " on" : ""}" data-range="saved" onclick="setFeedRange('saved')" style="${savedUpcoming().length ? "" : "display:none"}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-9.4-9.3C1.4 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.7 4.4 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"/></svg>Saved <b>${savedUpcoming().length}</b></button>
      </div>
      <div class="fbar-line" aria-hidden="true"></div>
      ${feedDateStripHtml()}
    </div>

    <div class="feed-section">
      <div class="feed-sec-head"><h2>Coming up</h2></div>
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
  if (force !== false) toggleAccountMenu(false);
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

// ── Account dropdown (home header) ────────────────────────────────────────
// Same pattern as Settings: everything you'd reach for — tickets, saved,
// hosting, sign out — without leaving Discover. The full Account page is
// only opened when you pick it here.
function accountMenuHtml() {
  const ic = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const upcoming = (typeof myTickets !== "undefined" ? myTickets : []).filter((t) => {
    const ev = EVENTS.find((e) => e.id === t.eventId);
    return ev && eventStatus(ev) !== "past";
  }).length;
  const saved = savedUpcoming().length;
  const item = (action, icon, title, sub, cls) =>
    `<button type="button" role="menuitem" class="set-opt${cls ? " " + cls : ""}" onclick="toggleAccountMenu(false);${action}">
      <span class="set-ic">${icon}</span><span class="set-txt"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</span>
    </button>`;
  const host = isApprovedHost()
    ? item("navStack=[];openHost()", ic('<path d="M12 5v14M5 12h14"/>'), "Host an event", "Create and manage your events")
    : state.hostApplicationStatus === "pending"
      ? ""
      : item("openHostApply()", ic('<path d="M12 5v14M5 12h14"/>'), "Become a host", "Run events for your community");
  return `<div class="acct-head">
      <span class="acct-av" aria-hidden="true">${escapeHtml(initials(state.profileName || "You"))}</span>
      <span class="set-txt"><b>${escapeHtml(state.profileName || "Your account")}</b><span>${escapeHtml(state.profileEmail || "")}</span></span>
    </div>
    <div class="set-list">
      ${item("navStack=[];openTicketsTab()", ic('<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>'), "Your tickets", upcoming ? `${upcoming} coming up` : "Nothing booked yet")}
      ${saved ? item("setFeedRange('saved')", ic('<path d="M12 20.5s-7.5-4.6-9.4-9.3C1.4 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.7 4.4 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"/>'), "Saved", `${saved} event${saved !== 1 ? "s" : ""}`) : ""}
      ${host}
      ${item("navStack=[];openAccount()", ic('<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/>'), "Account & settings", "Your details, preferences, help")}
    </div>
    <div class="set-list acct-foot">
      ${item("signOut()", ic('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>'), "Sign out", "", "danger")}
    </div>`;
}
function toggleAccountMenu(force) {
  const panel = document.getElementById("feed-account");
  const btn = document.getElementById("feed-account-btn");
  if (!panel || !btn) return;
  const open = force !== undefined ? force : !panel.classList.contains("open");
  if (open) {
    toggleFeedSettings(false);
    panel.innerHTML = accountMenuHtml(); // fresh counts every time
  }
  panel.classList.toggle("open", open);
  btn.classList.toggle("on", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  document.removeEventListener("pointerdown", _acctOutside, true);
  document.removeEventListener("keydown", _acctEsc);
  if (open) {
    document.addEventListener("pointerdown", _acctOutside, true);
    document.addEventListener("keydown", _acctEsc);
  }
}
function _acctOutside(e) {
  const panel = document.getElementById("feed-account");
  const btn = document.getElementById("feed-account-btn");
  if (!panel || (!panel.contains(e.target) && !(btn && btn.contains(e.target)))) toggleAccountMenu(false);
}
function _acctEsc(e) {
  if (e.key === "Escape") toggleAccountMenu(false);
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
  if (typeof bootReveal === "function") return bootReveal(loader); // 14-delight.js
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 400);
}

function openTicketsTab() {
  // The tab only shows once signed in; this guards deep links / stale tabs.
  if (!state.userId) {
    showToast("Sign in with your email to see your tickets", "info");
    showLpSignup();
    return;
  }
  state.ticketsTab = "upcoming"; // the tab (and after a purchase) opens on what's next
  openMyTickets();
}

// ── Shared plans (?plans=TOKEN) ───────────────────────────────────────────
// A friend's "here's what I'm going to" link. Read-only, no account needed;
// every row opens the real event so they can book and come along.
async function checkPlansLink() {
  const tok = new URLSearchParams(location.search).get("plans");
  if (!tok) return;
  history.replaceState(null, "", location.pathname);
  const res = await loadSharedPlans(tok);
  if (!res) return showToast("That plans link doesn't work any more", "info");
  state.sharedPlans = res;
  pushNav();
  state.view = "plans";
  renderNav();
  renderView();
  window.scrollTo({ top: 0 });
}
function renderSharedPlans() {
  const p = state.sharedPlans || { name: "A friend", eventIds: [] };
  const list = EVENTS.filter((ev) => p.eventIds.includes(String(ev.id)) && eventStatus(ev) !== "past").sort((a, b) => a.startsAt - b.startsAt);
  return `<div class="v-page">
    <button class="back-btn" onclick="goFeed()" aria-label="Back to Discover">←</button>
    <header class="v-page-head">
      <div class="v-kicker">Plans</div>
      <h1 class="v-h1">${escapeHtml(p.name)}'s going to…</h1>
      <p class="v-sub">${list.length ? `${list.length} thing${list.length !== 1 ? "s" : ""} coming up — tap one to come too.` : "Nothing booked right now — check back soon."}</p>
    </header>
    ${list.length ? `<div class="fr-list compact">${list.map((ev) => feedRowHtml(ev)).join("")}</div>` : ""}
    <div class="feed-empty-actions" style="margin-top:22px;"><button class="v-btn ghost" onclick="goFeed()">See everything on in London</button></div>
  </div>`;
}

// ── On-screen keyboard awareness ──────────────────────────────────────────
// iOS Safari slides the keyboard OVER the page without shrinking it, so a
// sheet pinned to the bottom (sign-in, codes, delete account…) ends up with
// its text box hidden behind the keys. Track the visible area (the "visual
// viewport") as CSS variables the sheets size themselves to, and bring the
// focused box into view.
(function keyboardAware() {
  // iOS doesn't resize the page for the keyboard, it overlays it and pans
  // the visual viewport — and fires resize/scroll many times while doing
  // so. Updating layout on every one of those made the sign-in sheet jump.
  // Instead: wait for the keyboard to settle, then set the variables once
  // (the sheet's CSS transition does the smooth move), and keep the focused
  // field visible by scrolling inside the sheet rather than the page.
  const vv = window.visualViewport;
  const root = document.documentElement;
  const SHEETS = ".lp-signup-modal, .loc-sheet, .admin-auth-modal, .report-modal, .gate-wrap";
  let raf = 0, settle = 0, lastKb = -1, lastH = -1;
  const reveal = () => {
    const el = document.activeElement;
    if (!el || !el.matches || !el.matches("input, textarea, select")) return;
    const sheet = el.closest(SHEETS);
    if (!sheet || sheet.scrollHeight <= sheet.clientHeight) return;
    const r = el.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    const field = el.closest(".gate-field") || el;
    const fr = field.getBoundingClientRect();
    if (fr.top < sr.top + 12 || r.bottom > sr.bottom - 64)
      sheet.scrollTo({ top: sheet.scrollTop + fr.top - sr.top - 56, behavior: "smooth" });
  };
  const apply = () => {
    raf = 0;
    if (!vv) return;
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    const h = Math.round(vv.height);
    if (kb !== lastKb) { root.style.setProperty("--kb", `${kb}px`); lastKb = kb; }
    if (h !== lastH) { root.style.setProperty("--vvh", `${h}px`); lastH = h; }
    root.classList.toggle("kb-open", window.innerHeight - vv.height > 120);
    setTimeout(reveal, 320); // after the sheet's own glide
  };
  const schedule = () => {
    clearTimeout(settle);
    // one update after the keyboard animation stops moving the viewport
    settle = setTimeout(() => { if (!raf) raf = requestAnimationFrame(apply); }, 90);
  };
  if (vv) {
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    apply();
  }
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (!el || !el.matches || !el.matches("input, textarea, select") || !el.closest(SHEETS)) return;
    // Moving between fields with the keyboard already up: no viewport
    // change will fire, so bring the field into view directly.
    if (root.classList.contains("kb-open")) setTimeout(reveal, 60);
  });
  document.addEventListener("focusout", () => setTimeout(() => { if (!document.activeElement || !document.activeElement.matches("input, textarea, select")) schedule(); }, 50));
})();

// ── Accessibility helpers ─────────────────────────────────────────────────
// Cards are <article role="button" tabindex="0" onclick=…>: make Enter and
// Space activate them like real buttons (they only responded to clicks).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target;
  if (!el || !el.getAttribute) return;
  const role = el.getAttribute("role");
  if (!["button", "radio", "tab", "link"].includes(role)) return;
  if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
  e.preventDefault();
  el.click();
});

