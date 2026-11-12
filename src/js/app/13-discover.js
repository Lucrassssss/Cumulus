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
  const p = eventAllInPrice(ev);
  return p ? fmtGBP(p) : "Free";
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
    if (range === "saved" && !isSaved(ev.id)) return false;
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
  const near = document.querySelector('[data-near="1"]');
  if (near) {
    near.classList.remove("loading");
    near.classList.toggle("on", !!state.nearMe);
    near.setAttribute("aria-pressed", state.nearMe ? "true" : "false");
  }
  document.querySelectorAll("[data-fcat]").forEach((b) =>
    b.classList.toggle("on", b.dataset.fcat === (state.selectedCategory || "all")),
  );
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
        <span class="fp-top-r">
          ${scarce ? `<span class="fp-hot">${left} left</span>` : isHotEvent(ev) && st !== "live" ? `<span class="fp-hot">🔥 Hot</span>` : ""}
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
  const going = attendeesFor(ev.id).length;
  return `<article class="fr-row" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}">
    <div class="fr-thumb ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}</div>
    <div class="fr-body">
      <div class="fr-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}${ev._dist != null ? ` <span class="fr-dist">· ${fmtDistance(ev._dist)}</span>` : ""}</div>
      <h3 class="fr-title">${escapeHtml(ev.title)}</h3>
      <div class="fr-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
      <div class="fr-foot">
        <span class="fr-price${eventPrice(ev) ? "" : " free"}">${feedPriceLabel(ev)}</span>
        ${tag ? `<span class="fr-chip tag">${escapeHtml(tag)}</span>` : ""}
        ${left !== null && left <= 10 && left > 0 ? `<span class="fr-chip warn">Only ${left} left</span>` : ""}
        ${left === 0 ? `<span class="fr-chip">Waitlist</span>` : ""}
        ${crewFor(ev).length ? crewChipHtml(ev) : going >= 2 ? `<span class="fr-chip">${going} going</span>` : ""}
      </div>
    </div>
    ${saveBtnHtml(ev, "in-row")}
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
  showToast(
    on ? (state.userId ? "Saved — it's in your Tickets" : "Saved — find it under ♥ Saved on Discover") : "Removed from saved",
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
      const day = state.nearMe ? "Nearest first" : feedDayHeading(ev);
      const head = day !== lastDay ? `<div class="fr-day">${escapeHtml(day)}</div>` : "";
      lastDay = day;
      return head + feedRowHtml(ev);
    })
    .join("");
  const left = list.length - shown.length;
  return `<div class="fr-list compact">${rows}</div>${
    left > 0
      ? `<button class="v-btn ghost wide feed-more" onclick="state.feedLimit=(state.feedLimit||FEED_PAGE)+FEED_PAGE;_rerenderFeedResults()">Show ${Math.min(left, FEED_PAGE)} more${left > FEED_PAGE ? ` <span>of ${left}</span>` : ""}</button>`
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
      <div id="feed-settings" class="feed-settings" role="dialog" aria-label="Settings">${appearanceMenuHtml()}${privacyMenuHtml()}</div>
    </header>

    <div class="feed-layout">
    <div class="feed-hero">
        <div class="feed-kicker"><span class="pulse"></span>${escapeHtml(kicker)}${live.length ? ` · ${live.length} live now` : ""}</div>
        <h1 class="feed-h1">${escapeHtml(hello)}</h1>
        <label class="feed-search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="search" placeholder="Artists, venues, vibes…" value="${escapeHtml(state.feedQuery || "")}" oninput="onFeedSearch(this.value)" aria-label="Search events" autocomplete="off"/>
        </label>
        ${signedIn ? "" : promiseStripHtml()}
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
      <div class="chip-rail">
        <button class="v-chip near${state.nearMe ? " on" : ""}" data-near="1" onclick="toggleNearMe()" aria-pressed="${!!state.nearMe}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>Near me</button>
        <button class="v-chip saved${range === "saved" ? " on" : ""}" data-range="saved" onclick="setFeedRange('saved')" style="${savedUpcoming().length ? "" : "display:none"}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-9.4-9.3C1.4 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.7 4.4 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"/></svg>Saved <b>${savedUpcoming().length}</b></button>
        ${ranges
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
  // The tab only shows once signed in; this guards deep links / stale tabs.
  if (!state.userId) {
    showToast("Sign in with your email to see your tickets", "info");
    showLpSignup();
    return;
  }
  openMyTickets();
}

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

// ── Boot ──────────────────────────────────────────────────────────────────
// Lives in the LAST app script so every function start() can reach is
// already defined. Never let an unexpected rejection leave a blank screen.
start().catch((e) => {
  console.error("[cumulus] boot failed", e);
  try {
    enterGuestBrowse();
  } catch (_) {}
});
