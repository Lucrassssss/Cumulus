// ── Supabase data loaders ─────────────────────────────────────────────────

async function loadRealEvents() {
  const { data } = await sb
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });
  if (!data) return;
  data.forEach((ev) => {
    // Idempotent: skip any event already loaded (e.g. one just created locally)
    if (EVENTS.find((e) => e.id === ev.id)) return;
    const mapped = {
      id: ev.id,
      title: ev.title,
      category: ev.category,
      host: ev.host_name,
      hostId: ev.host_id,
      venue: ev.venue,
      area: ev.area,
      address: ev.address,
      lat: ev.lat,
      lon: ev.lon,
      startTime: ev.start_time,
      endTime: ev.end_time,
      desc: ev.description,
      capacity: ev.capacity,
      price: ev.price || 0,
      priceTiers: ev.price_tiers || null,
      nightShotUrl: ev.night_shot_url || null,
      photoUrl: ev.photo_url || null,
      status: ev.status || "active",
    };
    computeEventDates(mapped);
    EVENTS.push(mapped);
  });
  // DEV-ONLY VISUAL FIXTURE — never runs outside localhost, and never runs if
  // the real backend actually returned rows. Lets the design-pass work see
  // pins/cards/detail views without needing a live Supabase seed. Safe to
  // delete this call + loadDevFixtureEvents() below any time; it is not
  // wired to any production path (GH Pages / cumulusapp.co never match the
  // hostname check).
  if (
    EVENTS.length === 0 &&
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ) {
    loadDevFixtureEvents();
  }
}

// DEV-ONLY: synthetic events for local visual QA. See comment above the call
// site in loadRealEvents(). Not loaded from any file shipped differently to
// prod — this function simply never executes off localhost.
function loadDevFixtureEvents() {
  const now = Date.now();
  const hrs = (n) => new Date(now + n * 3600000).toISOString();
  const fixtures = [
    {
      id: "dev-1",
      title: "Rooftop Jazz & Wine",
      category: "Live Music",
      host: "Nightjar Sessions",
      venue: "The Curtain Rooftop",
      area: "Shoreditch",
      address: "45 Curtain Rd, London EC2A 3PT",
      lat: 51.5259,
      lon: -0.0813,
      startTime: hrs(3),
      endTime: hrs(6),
      desc: "An intimate rooftop set as the sun goes down over Shoreditch — small-batch wine, low light, a five-piece band.",
      capacity: 60,
      price: 12,
    },
    {
      id: "dev-2",
      title: "Community Board Game Night",
      category: "Board Games",
      host: "Dice & Slice",
      venue: "Draughts Café",
      area: "Hackney",
      address: "337 Acton Mews, London E8 4EA",
      lat: 51.5361,
      lon: -0.0731,
      startTime: hrs(20),
      endTime: hrs(23),
      desc: "Drop-in board games with a huge library on hand — bring a friend or come solo, tables are shared.",
      capacity: 40,
      price: 0,
    },
    {
      id: "dev-3",
      title: "Sunrise Run Club",
      category: "Wellness & Outdoors",
      host: "Thames Path Runners",
      venue: "South Bank",
      area: "Southbank",
      address: "Queen's Walk, London SE1 9PP",
      lat: 51.5054,
      lon: -0.1173,
      startTime: hrs(-1),
      endTime: hrs(2),
      desc: "A 5k along the river, all paces welcome, coffee after at the usual spot.",
      capacity: 25,
      price: 0,
    },
    {
      id: "dev-4",
      title: "Life Drawing: Open Studio",
      category: "Creative",
      host: "Studio Ochre",
      venue: "Ochre Studio",
      area: "Peckham",
      address: "133 Copeland Rd, London SE15 3SN",
      lat: 51.4729,
      lon: -0.0663,
      startTime: hrs(28),
      endTime: hrs(31),
      desc: "Untutored life drawing, all levels, materials provided. Bring your own board if you have one.",
      capacity: 18,
      price: 8,
    },
    {
      id: "dev-5",
      title: "Neighbourhood Supper Club",
      category: "Food & Drink",
      host: "Table for Twelve",
      venue: "The Ivy House Kitchen",
      area: "Nunhead",
      address: "40 Stuart Rd, London SE15 3BE",
      lat: 51.4593,
      lon: -0.0568,
      startTime: hrs(50),
      endTime: hrs(53),
      desc: "A long-table supper cooked by a rotating neighbourhood host — this week, a seasonal British menu.",
      capacity: 12,
      price: 28,
    },
  ];
  fixtures.forEach((ev) => {
    computeEventDates(ev);
    EVENTS.push(ev);
  });

  // ─── TEMPORARY PREVIEW BLOCK — remove on request ──────────────────────────
  // Added to preview the pin-fan + host-profile work: three events sharing
  // one venue/host (see the fan in attachMapLayers) plus a past event on the
  // same host (see the "Event ended" Calendar treatment, the locked detail
  // page, and that host's profile page). Same localhost-only gate as the
  // fixtures above — delete this whole block (down to the closing bracket
  // before loadAllRsvps) whenever asked to wipe the preview.
  const previewHost = { host: "Nova Collective", hostId: "preview-host-nova" };
  const previewFixtures = [
    {
      id: "preview-fan-1",
      title: "Rooftop Jazz Night",
      category: "Live Music",
      ...previewHost,
      venue: "The Sky Lounge",
      area: "Shoreditch",
      address: "The Sky Lounge, Shoreditch, London E1",
      lat: 51.5265,
      lon: -0.0786,
      startTime: hrs(1),
      endTime: hrs(2),
      desc: "Preview event — same venue as two others, to show the fanned pin.",
      capacity: 80,
      price: 18,
    },
    {
      id: "preview-fan-2",
      title: "Board Game Social",
      category: "Board Games",
      ...previewHost,
      venue: "The Sky Lounge",
      area: "Shoreditch",
      address: "The Sky Lounge, Shoreditch, London E1",
      lat: 51.5265,
      lon: -0.0786,
      startTime: hrs(2),
      endTime: hrs(3),
      desc: "Preview event — same venue as two others, to show the fanned pin.",
      capacity: 40,
      price: 0,
    },
    {
      id: "preview-fan-3",
      title: "Indie Film Screening",
      category: "Movie Nights",
      ...previewHost,
      venue: "The Sky Lounge",
      area: "Shoreditch",
      address: "The Sky Lounge, Shoreditch, London E1",
      lat: 51.5265,
      lon: -0.0786,
      startTime: hrs(3),
      endTime: hrs(4),
      desc: "Preview event — same venue as two others, to show the fanned pin.",
      capacity: 60,
      price: 10,
    },
    {
      id: "preview-past-1",
      title: "Retro Arcade Night",
      category: "Gaming",
      ...previewHost,
      venue: "The Sky Lounge",
      area: "Shoreditch",
      address: "The Sky Lounge, Shoreditch, London E1",
      lat: 51.5265,
      lon: -0.0786,
      startTime: hrs(-48),
      endTime: hrs(-47),
      desc: "Preview event — already ended, to show the Calendar/detail-page/host-profile treatment for past events.",
      capacity: 80,
      price: 12,
    },
  ];
  previewFixtures.forEach((ev) => {
    computeEventDates(ev);
    EVENTS.push(ev);
  });
  // ─── END TEMPORARY PREVIEW BLOCK ───────────────────────────────────────────
}

async function loadAllRsvps() {
  const { data } = await sb.from("rsvps").select("event_id,user_name");
  if (!data) return;
  data.forEach((r) => {
    if (!state.rsvps[r.event_id]) state.rsvps[r.event_id] = [];
    if (!state.rsvps[r.event_id].includes(r.user_name))
      state.rsvps[r.event_id].push(r.user_name);
  });
}


function renderNav() {
  const activeTab = ["owner-dash", "review", "event-approvals"].includes(
    state.view,
  )
    ? "admin"
    : [
          "book",
          "checkout",
          "confirmed",
          "scan-picker",
          "scan",
          "account-details",
        ].includes(state.view)
      ? "account"
      : ["calendar", "calendar-day"].includes(state.view)
        ? "calendar"
        : state.view;
  const navContainer = document.getElementById("nav-container");
  const hostApproved = isApprovedHost();
  const isOwnerAccount = isAdminAccount();

  // Rebuild the tab bar if it doesn't exist yet, OR if host-tab/admin-tab
  // visibility has changed since it was last built (e.g. an admin verifies
  // mid-session, or a host application gets approved and the page hasn't
  // reloaded yet).
  if (
    !navContainer.querySelector(".bottom-nav") ||
    navContainer.dataset.hostShown !== String(hostApproved) ||
    navContainer.dataset.adminShown !== String(isOwnerAccount)
  ) {
    navContainer.dataset.hostShown = String(hostApproved);
    navContainer.dataset.adminShown = String(isOwnerAccount);
    const icons = {
      browse: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/></svg>`,
      tickets: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg>`,
      calendar: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>`,
      host: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>`,
      account: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>`,
      admin: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v2H9z"/><path d="M8.5 13l2 2 4-4.5"/></svg>`,
    };
    const NAV_TABS = [
      { label: "Explore", v: "browse", action: "goBrowse()" },
      // Only shown once an account is an approved host (verified-host badge,
      // granted on host_applications approval) or an admin — otherwise any
      // signed-up user could reach the event-creation form with zero
      // hosting privileges. Non-hosts apply via Account → "Become a host"
      // instead (openHostApply()).
      ...(hostApproved
        ? [{ label: "Host", v: "host", action: "navStack=[];openHost()" }]
        : []),
      {
        label: "Calendar",
        v: "calendar",
        action: "navStack=[];openCalendar()",
      },
      { label: "Account", v: "account", action: "navStack=[];openAccount()" },
      // Owner-only: event approvals, host application review, live
      // finances — used to be buried inside Profile with no other home;
      // now its own tab, hidden entirely for every other account.
      ...(isOwnerAccount
        ? [{ label: "Admin", v: "admin", action: "navStack=[];openAdmin()" }]
        : []),
    ];
    navContainer.innerHTML = `
      <div class="top-bar">
        <div class="logo-wrap" onclick="goBrowse()" role="button" tabindex="0" aria-label="Cumulus home">${BLOT_SVG}<span class="logo hide-mobile">Cumulus</span></div>
        <input id="search-input" class="search-input" placeholder="Search events..." oninput="onSearchInput()" autocomplete="off"/>

      </div>
      <div class="bottom-nav">
        ${NAV_TABS.map(
          ({ label, v, action }) => `
          <button class="nav-link" data-nav="${v}" onclick="${action}" style="position:relative;">
            ${icons[v] || ""}
            <span>${label}</span>
          </button>`,
        ).join("")}
      </div>`;
  }

  // Every call: patch active state and theme toggle — no DOM destruction
  navContainer.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active-cloud-tab", btn.dataset.nav === activeTab);
  });

}

function onSearchInput() {
  if (state.view !== "browse") {
    state.view = "browse";
    state.selectedEventId = null;
  }
  renderView();
}
function destroyMainMap() {
  if (lmap) {
    try {
      removeActiveHtmlMarker();
      Object.values(htmlMarkerRefs).forEach((ref) => {
        if (ref.added) {
          ref.marker.remove();
          if (ref.bubbleMarker) ref.bubbleMarker.remove();
        }
      });
      htmlMarkerRefs = {};
      lmap.remove();
    } catch (e) {}
    lmap = null;
    lmapFitted = false;
  }
}
function destroyHostMap() {
  if (hostMap) {
    try {
      hostMap.remove();
    } catch (e) {}
    hostMap = null;
    hostMarker = null;
  }
}

// Dedicated sign-out — tears the session down cleanly and returns to the gate.
// Confirms first unless called with confirmed=true (e.g. from clearAllUsers).
async function signOut(confirmed) {
  if (!confirmed) {
    showConfirm(
      "Sign out?",
      "You'll return to the welcome screen. Your data is saved.",
      "Sign out",
      "signOut",
    );
    return;
  }
  // Clear any Supabase auth session (defensive — harmless if none is active,
  // and future-proofs a move to real sb.auth without leaving a token behind).
  try {
    await sb.auth.signOut();
  } catch (e) {}
  // Clear local session cache
  try {
    localStorage.removeItem("cumulus_email");
  } catch (e) {}
  try {
    localStorage.removeItem("cumulus_session");
  } catch (e) {}
  try {
    localStorage.removeItem("prefs");
  } catch (e) {}
  // Reset in-memory state
  state.userId = null;
  state.profileName = "";
  state.profileEmail = "";
  state.profilePhone = "";
  state.profileAvatarUrl = "";
  state.profileId = null;
  state.specialBadges = [];
  state.followedHostIds = [];
  state.view = "browse";
  state.rsvps = {};
  myTickets = [];
  state.hostPayouts = undefined; // re-fetch fresh for whoever signs in next
  state.myConnectStatus = undefined;
  // Admin flags must NOT survive a sign-out — otherwise the next account
  // signed into this tab inherits the previous admin's bypass.
  state.isAdmin = false;
  state._verifiedAdmin = false;
  destroyMainMap();
  destroyHostMap();
  document.getElementById("app").style.display = "none";
  document.getElementById("nav-container").innerHTML = "";
  document.getElementById("view-container").innerHTML = "";
  document.body.classList.remove("app-active"); // bring landing decor back
  renderGate();
}
// Back-compat alias — older call sites referenced resetProfile by name.
function resetProfile(confirmed) {
  return signOut(confirmed);
}

let navStack = [];
function pushNav() {
  navStack.push({ view: state.view, selectedEventId: state.selectedEventId });
}
function goBack() {
  if (navStack.length > 0) {
    const p = navStack.pop();
    state.view = p.view;
    state.selectedEventId = p.selectedEventId;
    renderNav();
    renderView();
    if (state.view !== "browse")
      window.scrollTo({ top: 0, behavior: "smooth" });
    if (state.view === "detail") {
      const ev = EVENTS.find((e) => e.id === state.selectedEventId);
      if (ev) updateEventUrlAndMeta(ev);
    } else {
      resetEventUrlAndMeta();
    }
  } else {
    goBrowse();
  }
}

function goBrowse() {
  navStack = [];
  state.view = "browse";
  state.selectedEventId = null;
  renderNav();
  renderView();
  resetEventUrlAndMeta();
}
function setCategory(cat) {
  state.selectedCategory = cat;
  renderView();
}
// Blueprint whitespace: "Web-View SEO Routing... events cannot be trapped
// inside a map." Full Google-crawlable server-rendered pages would need a
// server (this app is deliberately static/no-build/no-server — see
// ARCHITECTURE.md) — that's a separate infra project, not something to
// fake here. What IS shipped: a real shareable/bookmarkable URL per event
// (?event=<id>) that deep-links straight to it on load, plus a dynamically
// updated <title>/meta description so a shared link's social-card preview
// reflects the actual event, not the generic homepage.
function updateEventUrlAndMeta(ev) {
  try {
    const url = `${location.pathname}?event=${encodeURIComponent(ev.id)}`;
    history.replaceState(null, "", url);
    document.title = `${ev.title} — Cumulus`;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.name = "description";
      document.head.appendChild(desc);
    }
    desc.setAttribute(
      "content",
      `${ev.title} · ${ev.date} · ${ev.venue}${ev.area ? ", " + ev.area : ""} — find it on Cumulus's live map of London community events.`,
    );
  } catch (e) {}
}
function resetEventUrlAndMeta() {
  try {
    history.replaceState(null, "", location.pathname);
    document.title = "Cumulus — London's live community event map";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "A live map of grassroots events across London. Every event is public — no invite, no curator code.",
      );
  } catch (e) {}
}
function openEvent(id) {
  pushNav();
  state.view = "detail";
  state.selectedEventId = id;
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
  const ev = EVENTS.find((e) => e.id === id);
  if (ev) updateEventUrlAndMeta(ev);
}
// Boot-time deep link: ?event=<id> opens straight to that event once EVENTS
// has loaded (called from initApp(), after loadRealEvents()).
function checkEventDeepLink() {
  const params = new URLSearchParams(location.search);
  const id = params.get("event");
  if (!id) return;
  const ev = EVENTS.find((e) => String(e.id) === String(id));
  if (ev) openEvent(ev.id);
}
function openAccount() {
  pushNav();
  state.view = "account";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openCalendar() {
  pushNav();
  state.view = "calendar";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
// True once an account has been accepted onto the host onboarding system
// (the verified-host badge, granted server-side in reviewHost() on
// approval) or is an admin. This — not just being signed in — is what gates
// the Host tab and the event-creation form; the actual security boundary is
// still RLS (events_insert_own), this just decides what the UI offers.
function isApprovedHost() {
  return state.isAdmin || (state.specialBadges || []).includes("verified-host");
}
// Gates the owner-only Admin nav tab — same boundary isApprovedHost() uses
// (state.isAdmin, set after admin OTP verification), so any signed-in admin
// sees it, not just approved hosts.
function isAdminAccount() {
  return !!state.isAdmin;
}
function openHost() {
  if (!isApprovedHost()) {
    openHostApply();
    return;
  }
  // A flyer picked on a previous visit to this form (then abandoned without
  // submitting, e.g. via the back button) must not silently attach itself
  // to a completely different submission later — the fresh form has no
  // preview showing anything is still selected.
  _hostFlyerBlob = null;
  state.view = "host";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
// No-op if the overlay was never created (peekAttendee, its only creator,
// was removed with the per-event Connect/chat feature) — kept only because
// the global Escape-key handler calls every close* function defensively.
function closeAttendeePeek() {
  const ov = document.getElementById("attendee-peek-overlay");
  if (ov) ov.classList.remove("open");
}

function getEventDay(ev, year, monthIdx) {
  if (ev.startsAt == null) return null;
  const d = new Date(ev.startsAt);
  if (year != null && d.getFullYear() !== year) return null;
  if (monthIdx != null && d.getMonth() !== monthIdx) return null;
  return d.getDate();
}
function buildCalendarWeeks(year, monthIdx) {
  const firstDay = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ---- MAPBOX GL MAP & HTML Markers ----

// Events sharing (near-enough) the same coordinate — recurring events at one
// venue, almost always geocoded from the same address — used to render as
// separate WebGL pins stacked directly on top of each other
// (icon-allow-overlap/icon-ignore-placement), visually indistinguishable and
// with clicks landing on whichever one Mapbox's hit-test happened to return.
// toFixed(6) (~0.1m precision) groups by "the same point", not "nearby" — two
// genuinely different venues a few doors down stay separate pins.
function groupEventsByLocation(events) {
  const groups = new Map();
  events.forEach((ev) => {
    const key = `${ev.lon.toFixed(6)},${ev.lat.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ev);
  });
  return groups;
}

// Fans a group out from the shared point itself, like a hand of cards held
// at one corner — NOT translated sideways into a row. icon-anchor:"bottom"
// already puts each pin's tip exactly on its coordinate; every event in a
// group shares that exact coordinate, and rotating each pin around its own
// (shared) tip by a different angle is what sweeps their heads out into an
// arc while every tip stays glued to the true epicentre. No icon-offset at
// all — a translated-row version of this was tried first and was wrong: it
// moved each pin's own tip away from the real point, so the group no longer
// visibly "came from" the venue at all. Pure rotation is the fix.
// Separation between two rotated pins is a chord length, not the angle
// itself: for a pin whose head sits L px up from its (shared, fixed) tip,
// two heads at angles a distance step apart land 2*L*sin(step/2) px apart on
// screen. With this icon's real geometry (head ~32px up the 40px-wide
// canvas), a 22° step — the first attempt at this — only separates adjacent
// heads by ~12px, well inside the icon's own width, so one pin fully hid
// behind its neighbour. ~50° gives ~27px separation, close to the icon's
// full width and enough for each head to actually stand apart. Capped total
// spread so large groups compress their step rather than fanning past ~150°
// (beyond that pins start pointing back toward each other from the other
// side, which stops reading as a fan at all).
const PIN_FAN_MAX_SPREAD = 150; // total arc width in degrees
const PIN_FAN_STEP = 50; // degrees between adjacent pins before the cap kicks in
function fanAnglesFor(count) {
  if (count <= 1) return [0];
  const spread = Math.min(PIN_FAN_MAX_SPREAD, PIN_FAN_STEP * (count - 1));
  const step = spread / (count - 1);
  const start = -spread / 2;
  return Array.from({ length: count }, (_, i) => Math.round(start + step * i));
}

function buildEventsGeoJSON() {
  const withLocation = getFilteredEvents().filter(
    (ev) =>
      typeof ev.lon === "number" &&
      typeof ev.lat === "number" &&
      isFinite(ev.lon) &&
      isFinite(ev.lat),
  );
  const groups = groupEventsByLocation(withLocation);
  const features = [];
  groups.forEach((group) => {
    const sorted = [...group].sort((a, b) => a.startsAt - b.startsAt);
    const angles = fanAnglesFor(sorted.length);
    sorted.forEach((ev, i) => {
      features.push({
        type: "Feature",
        id: ev.id,
        geometry: { type: "Point", coordinates: [ev.lon, ev.lat] },
        properties: {
          id: ev.id,
          color: CATS[ev.category].color,
          status: eventStatus(ev),
          category: ev.category,
          free: eventPrice(ev) <= 0,
          fan_rotate: angles[i],
        },
      });
    });
  });
  return { type: "FeatureCollection", features };
}

