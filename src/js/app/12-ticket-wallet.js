// ─── Render: My Tickets list ──────────────────────────────────────────────
function renderMyTickets() {
  if (!myTickets.length)
    return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>All your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  const cards = [...myTickets]
    .reverse()
    .map((t) => {
      const ev = EVENTS.find((e) => e.id === t.eventId);
      if (!ev) return "";
      const c = CATS[ev.category];
      const status = eventStatus(ev);
      const d = new Date(t.purchasedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
        <div style="flex:1;min-width:0;">
          <span class="event-badge" style="--cat:;font-size:10px;">${ev.category}</span>
          ${status === "live" ? `<span class="live-chip" style="margin-left:6px;"><span class="dot"></span>Live</span>` : ""}
          <div style="font-size:15px;font-weight:700;margin:6px 0 3px;line-height:1.2;">${escapeHtml(ev.title)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${escapeHtml(ev.venue)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${t.qty} × ${t.typeLabel}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:800;color:${c.color};">${t.total ? `£${t.total.toFixed(2)}` : "Free"}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Booked ${d}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--line);">
        <div style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--text-muted);">${t.ticketId}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-small" onclick="downloadICS('${ev.id}')">+ Cal</button>
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket('${ev.id}')">Ticket</button>
        </div>
      </div>
      ${
        status !== "past"
          ? `<button class="btn-text" style="width:100%;margin-top:8px;font-size:12px;" onclick="transferMyTicket('${t.ticketId}','${escapeHtml(ev.title).replace(/'/g, "&#39;")}')">Transfer this ticket →</button>`
          : ""
      }
      ${
        status !== "past" && ev.startsAt - Date.now() >= 24 * 3600000
          ? `<button class="btn-text" style="width:100%;margin-top:4px;color:#E23B3B;font-size:12px;" onclick="cancelTicket('${t.ticketId}')">Cancel booking</button>`
          : ""
      }
    </div>`;
    })
    .join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>${myTickets.length} booking${myTickets.length !== 1 ? "s" : ""}</p></div>
    ${cards}`;
}

// Real self-serve cancellation, mirroring deleteEvent()'s Supabase-delete
// pattern. Gated to >=24h before the event, matching the policy copy shown
// at booking/confirmation (renderBook/renderConfirmed).
async function cancelTicket(ticketId) {
  const t = myTickets.find((x) => x.ticketId === ticketId);
  if (!t) return;
  const ev = EVENTS.find((e) => e.id === t.eventId);
  if (ev && ev.startsAt - Date.now() < 24 * 3600000) {
    showToast("Cancellations close 24 hours before the event.", "error");
    return;
  }
  if (!confirm("Cancel this booking? This can't be undone.")) return;
  myTickets = myTickets.filter((x) => x.ticketId !== ticketId);
  if (state.userId) {
    await sb
      .from("tickets")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("user_id", state.userId);
  }
  showToast("Booking cancelled", "success");
  renderView();
}

// ════════════════════════════════════════════════
// CALENDAR DAY VIEW
// ════════════════════════════════════════════════
function openCalendarDay(day) {
  pushNav();
  state.calendarDay = day;
  state.view = "calendar-day";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCalendarDay() {
  const day = state.calendarDay;
  const dateObj = new Date(CALENDAR_YEAR, CALENDAR_MONTH, day);
  const dayLabel = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const eventsByDay = {};
  EVENTS.forEach((ev) => {
    const d = getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH);
    if (d) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
    }
  });
  const dayEvents = (eventsByDay[day] || []).sort(
    (a, b) => a.startsAt - b.startsAt,
  );
  if (!dayEvents.length)
    return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dayLabel}</h2><p>Nothing scheduled today</p></div>
    <div class="empty-state">Nothing on this day. <button class="btn-text" onclick="openHost()">Host one?</button></div>`;
  // Synopsis only — same card as List mode, not a second purchase flow.
  // Tapping opens the real event page, where booking actually happens.
  const cards = dayEvents.map(eventListCardHtml).join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dateObj.toLocaleDateString("en-GB", { weekday: "long" })}, ${dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</h2><p>${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}</p></div>
    ${cards}`;
}

// ── Nav helpers ──────────────────────────────────────────────────────────
function openTicketsTab() {
  state.view = "tickets";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Tickets tab ──────────────────────────────────────────────────────────
function renderTicketsTab() {
  const byEvent = {};
  myTickets.forEach((t) => {
    if (!byEvent[t.eventId]) byEvent[t.eventId] = [];
    byEvent[t.eventId].push(t);
  });
  const sortedIds = Object.keys(byEvent)
    .map(Number)
    .sort((a, b) => {
      const ea = EVENTS.find((e) => e.id === a),
        eb = EVENTS.find((e) => e.id === b);
      return (ea?.startsAt || 0) - (eb?.startsAt || 0);
    });
  const upcoming = sortedIds.filter((id) => {
    const ev = EVENTS.find((e) => e.id === id);
    return ev && eventStatus(ev) !== "past";
  });
  const past = sortedIds.filter((id) => {
    const ev = EVENTS.find((e) => e.id === id);
    return ev && eventStatus(ev) === "past";
  });

  const renderGroup = (ids, label) => {
    if (!ids.length) return "";
    const cards = ids
      .map((evId) => {
        const ev = EVENTS.find((e) => e.id === evId);
        if (!ev) return "";
        const c = CATS[ev.category];
        const tickets = byEvent[evId];
        const status = eventStatus(ev);
        const total = tickets.reduce((s, t) => s + (t.total || 0), 0);
        return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px;">
              <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
              ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>` : ""}
            </div>
            <div style="font-size:15px;font-weight:700;line-height:1.2;margin-bottom:4px;">${escapeHtml(ev.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${ev.time}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;color:${c.color};">${total ? `£${total.toFixed(2)}` : "Free"}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket('${evId}')">View Ticket${tickets.length > 1 ? "s" : ""}</button>
          <button class="btn btn-text btn-small" onclick="downloadICS('${evId}')">+ Cal</button>
        </div>
      </div>`;
      })
      .join("");
    return `<div class="section-title">${label}</div>${cards}`;
  };

  if (!myTickets.length)
    return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>Your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${renderGroup(upcoming, "Upcoming")}
    ${renderGroup(past, "Past")}`;
}

// Hosting is frictionless — no eligibility checklist, no connections/check-in
// gate, no private/public split. Everyone can host; every event is public
// (instantly for admins, via a quick pending_events review for everyone else —
// see the notify-admin-new-event edge function, which emails on every
// submission).
function renderHostView() {
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>Host an event</h2><p>Zero platform fee — you keep 100% of your ticket price.</p></div>
    <div id="host-type-notice" class="host-notice">${
      state.isAdmin
        ? "⚡ Admin — event publishes immediately to the live map."
        : "Your event goes live after a quick review, usually within a few hours."
    }</div>

    <div class="host-section">
      <div class="host-section-title">Flyer (optional)</div>
      <input id="host-flyer-input" type="file" accept="image/*" style="display:none;" onchange="handleHostFlyerSelect(this)"/>
      <div id="host-flyer-preview" onclick="document.getElementById('host-flyer-input').click()" role="button" tabindex="0" aria-label="Upload a flyer photo" style="cursor:pointer;border:2px dashed var(--line);border-radius:14px;height:140px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:var(--text-muted);font-size:13px;background:var(--surface-2);overflow:hidden;">
        <span style="font-size:22px;">📷</span>
        <span>Tap to upload a flyer photo</span>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Compressed automatically. No flyer? We'll show a category photo instead.</div>
    </div>

    <div class="host-section">
      <div class="host-section-title">Event basics</div>
      <label class="intro-field-label">Title</label>
      <input id="host-title" class="gate-input" placeholder="e.g., Summer Park Picnic"/>
      <label class="intro-field-label">Category</label>
      <select id="host-cat" class="gate-input">${Object.keys(CATS)
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("")}</select>
      <label class="intro-field-label">Description</label>
      <textarea id="host-desc" class="gate-input" rows="3" placeholder="What's the vibe? What should people expect?"></textarea>
    </div>

    <div class="host-section">
      <div class="host-section-title">Date &amp; time</div>
      <label class="intro-field-label">Start date</label>
      <input id="host-start-date" type="date" class="gate-input"/>
      <label class="intro-field-label">Start time</label>
      <input id="host-start-time" type="time" class="gate-input"/>
      <label class="intro-field-label" style="margin-top:14px;">End date</label>
      <input id="host-end-date" type="date" class="gate-input"/>
      <label class="intro-field-label">End time</label>
      <input id="host-end-time" type="time" class="gate-input"/>
    </div>

    <div class="host-section" style="overflow:visible;">
      <div class="host-section-title">Location</div>
      <label class="intro-field-label">Search address</label>
      <div style="position:relative;margin-bottom:10px;">
        <input id="host-address-search" class="gate-input" placeholder="Street name or postcode..." oninput="handleAddressAutocomplete()" autocomplete="off"/>
        <div id="autocomplete-results" style="position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;max-height:200px;overflow-y:auto;z-index:2000;display:none;box-shadow:0 8px 20px var(--shadow);"></div>
      </div>
      <div id="host-map-picker"></div>
      <div id="host-lat-lon-text" style="font-size:11px;color:var(--text-muted);margin:6px 0 10px;font-weight:600;">Default: Central London — search above or tap map to pin exact location</div>
      <label class="intro-field-label">Venue name</label>
      <input id="host-venue" class="gate-input" placeholder="e.g., The Rooftop, Community Hall"/>
      <label class="intro-field-label">Area (optional)</label>
      <input id="host-area" class="gate-input" placeholder="e.g., Shoreditch"/>
    </div>

    <div class="host-section">
      <div class="host-section-title">Capacity</div>
      <label class="intro-field-label">Max attendees</label>
      <input id="host-capacity" type="number" min="1" class="gate-input" placeholder="e.g., 20"/>
    </div>

    <div class="host-section">
      <div class="host-section-title">Pricing</div>
      <label class="intro-field-label">Ticket Price (£) — You keep 100%</label>
      <input id="host-price" type="number" min="0" step="0.01" class="gate-input" placeholder="e.g. 10 (Leave blank for free)"/>
      <div class="host-notice">We add a flat, transparent platform fee to the buyer at checkout to cover processing. You keep every penny of your ticket price.</div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer;">
        <input type="checkbox" id="host-tiered-toggle" onchange="document.getElementById('host-tiered-rows').style.display=this.checked?'block':'none'" style="width:16px;height:16px;"/>
        Use tiered pricing instead (Early Bird → General → Final)
      </label>
      <div id="host-tiered-rows" style="display:none;margin-top:10px;">
        <div class="host-notice" style="margin-bottom:10px;">Fill in whichever tiers you want (at least one). Each tier's price applies until its cutoff time passes, then the next one takes over automatically — leave a cutoff blank on your last tier.</div>
        ${["early", "general", "final"]
          .map(
            (id, i) => `<div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;">
              <div style="flex:1;"><label class="intro-field-label">${["Early Bird", "General", "Final"][i]} (£)</label><input id="tier-${id}-price" type="number" min="0" step="0.01" class="gate-input" placeholder="£"/></div>
              <div style="flex:1.4;"><label class="intro-field-label">Rises after</label><input id="tier-${id}-cutoff" type="datetime-local" class="gate-input"/></div>
            </div>`,
          )
          .join("")}
      </div>
    </div>

    <button id="host-submit-btn" class="btn" style="width:100%;margin-bottom:16px;font-size:15px;" onclick="submitHostEvent()">${state.isAdmin ? "Publish event →" : "Submit for review →"}</button>
    ${renderHostPayoutsPanel()}
    ${renderConnectStatusPanel()}
    ${renderMyHostedEventsCancelPanel()}`;
}

// ══════════════════════════════════════════════
// HOST SCANNER — offline-first ticket check-in
// ══════════════════════════════════════════════
// Protected in the sense that matters: the actual security boundary is
// server-side (tickets_host_read RLS + check_in_ticket()'s host_id check),
// not this client-side gate. The Profile entry point just decides whether
// to *show* the door — see renderProfile()'s conditional row.
//
// Offline strategy: cache the guestlist in IndexedDB when the scanner opens
// (while there's still signal), check people in against that cache so the
// door works with no connection, queue each check-in locally, and flush the
// queue on reconnect or next scanner open. This is a deliberate choice over
// the Background Sync API — Background Sync has no support in iOS Safari,
// a real chunk of any PWA's mobile users, so "retry on reconnect/reopen"
// is the version that actually works everywhere.

const SCANNER_DB_NAME = "cumulus_scanner";
const SCANNER_DB_VERSION = 1;
function openScannerDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SCANNER_DB_NAME, SCANNER_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("guestlists"))
        db.createObjectStore("guestlists"); // key: eventId, value: ticket[]
      if (!db.objectStoreNames.contains("pending"))
        db.createObjectStore("pending"); // key: ticketId, value: {eventId}
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(store, key, value) {
  const db = await openScannerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(store, key) {
  const db = await openScannerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(store, key) {
  const db = await openScannerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllKeys(store) {
  const db = await openScannerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let scannerState = {
  eventId: null,
  guestlist: [],
  search: "",
  videoStream: null,
  scanning: false,
  detector: null,
  repeatStat: null, // {total, repeat} — lazy-loaded, see loadRepeatAttendeeStat()
};

// Am I even worth showing the "Scan tickets" entry to? Real access control
// is server-side; this is purely so ordinary attendees don't see a dead
// button. Any user hosting at least one loaded event, or an admin, passes.
function canAccessScanner() {
  return (
    state.isAdmin || EVENTS.some((e) => e.hostId && e.hostId === state.userId)
  );
}

function openScannerPicker() {
  pushNav();
  state.view = "scan-picker";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderScannerPicker() {
  const myEvents = EVENTS.filter(
    (e) => state.isAdmin || (e.hostId && e.hostId === state.userId),
  ).sort((a, b) => a.startsAt - b.startsAt);
  const rows = myEvents.length
    ? myEvents
        .map(
          (ev) => `<button class="prof-action-row" onclick="openScannerForEvent('${ev.id}')">
        <span class="prof-action-label">${escapeHtml(ev.title)}<span class="prof-action-sub">${ev.date} · ${escapeHtml(ev.venue)}</span></span>
        <span class="prof-action-right">›</span>
      </button>`,
        )
        .join("")
    : `<div class="empty-state">You're not hosting any loaded events yet.</div>`;
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Scan tickets</h2><p>Pick an event to check guests in</p></div>
    <div class="prof-action-list">${rows}</div>`;
}

async function openScannerForEvent(eventId) {
  pushNav();
  scannerState = {
    eventId,
    guestlist: [],
    search: "",
    videoStream: null,
    scanning: false,
    detector: null,
    repeatStat: null,
  };
  state.view = "scan";
  renderNav();
  renderView();

  // Try the network first (freshest list); fall back to whatever's cached
  // from a previous open if we're offline.
  const fresh = await fetchGuestlist(eventId);
  if (fresh) {
    scannerState.guestlist = fresh;
    await idbPut("guestlists", eventId, fresh);
  } else {
    const cached = await idbGet("guestlists", eventId);
    scannerState.guestlist = cached || [];
  }
  await syncScannerQueue();
  renderView();
}

function scannerSetSearch(q) {
  scannerState.search = q;
  renderScannerList();
}

// Patches just the guestlist rows, not the whole view — keeps the camera
// feed (if running) from being torn down and restarted on every keystroke.
function renderScannerList() {
  const el = document.getElementById("scanner-list");
  if (!el) return;
  const q = scannerState.search.trim().toLowerCase();
  const matches = scannerState.guestlist.filter(
    (t) =>
      !q ||
      (t.purchaser_name || "").toLowerCase().includes(q) ||
      (t.ticket_id || "").toLowerCase().includes(q),
  );
  el.innerHTML = matches.length
    ? matches
        .map(
          (t) => `<div class="panel" style="padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(t.purchaser_name || "Guest")}</div>
          <div style="font-size:11px;color:var(--text-muted);font-family:ui-monospace,monospace;">${escapeHtml(t.ticket_id)}${t.total_seats > 1 ? ` · seat ${t.seat_num}/${t.total_seats}` : ""}</div>
        </div>
        ${
          t.status === "checked_in"
            ? `<span style="font-size:11px;font-weight:700;color:#147136;flex-shrink:0;">${checkIconSvg(13)} Checked in</span>`
            : `<button class="btn btn-small" style="flex-shrink:0;" onclick="checkInGuestlistTicket('${t.ticket_id}')">Check in</button>`
        }
      </div>`,
        )
        .join("")
    : `<div class="empty-state">No matching guests.</div>`;
}

// Massive full-screen green/red flash — the door-scanner needs feedback a
// bouncer can read at a glance in a dark venue, not a small toast easy to
// miss mid-scan. One reused, pointer-events:none overlay; retriggers its
// CSS animation the same remove-reflow-add way the map's pin-hover bounce
// does, so back-to-back scans each get a clean flash instead of the first
// one's animation silently continuing.
function flashScannerResult(ok) {
  let el = document.getElementById("scanner-flash");
  if (!el) {
    el = document.createElement("div");
    el.id = "scanner-flash";
    el.className = "scanner-flash";
    document.body.appendChild(el);
  }
  el.classList.remove("flash-green", "flash-red");
  void el.offsetWidth;
  el.classList.add(ok ? "flash-green" : "flash-red");
  // Cleared from JS rather than relying on the CSS animation's own end
  // timing — prefers-reduced-motion drops the animation for a plain
  // opacity flash instead, which has no animationend event to hook.
  clearTimeout(_scannerFlashTimer);
  _scannerFlashTimer = setTimeout(() => {
    el.classList.remove("flash-green", "flash-red");
  }, 550);
}
let _scannerFlashTimer = null;

async function checkInGuestlistTicket(ticketId) {
  const entry = scannerState.guestlist.find((t) => t.ticket_id === ticketId);
  if (!entry) {
    flashScannerResult(false);
    showToast("Not on this event's guestlist", "error");
    return;
  }
  if (entry.status === "checked_in") {
    flashScannerResult(false);
    showToast("Already checked in", "info");
    return;
  }
  // Optimistic — works offline. Queue it, then try to sync immediately.
  entry.status = "checked_in";
  await idbPut("guestlists", scannerState.eventId, scannerState.guestlist);
  await idbPut("pending", ticketId, { eventId: scannerState.eventId });
  renderScannerList();
  flashScannerResult(true);
  showToast(`${entry.purchaser_name || "Guest"} checked in`, "success");
  syncScannerQueue();
}

// Master "Valid for N Entries" QR (Page 3) — scanning it checks in the next
// still-active ticket in the squad (server picks which one, race-safe via
// FOR UPDATE SKIP LOCKED), not a specific ticket_id the client already
// knows. Unlike single-ticket check-in this needs a live round-trip every
// scan — there's no safe client-side way to guess "which seat is still
// free" for an optimistic offline queue the way a known ticket_id allows,
// so this path simply asks for a connection rather than half-supporting it.
async function checkInSquadScan(squadId) {
  if (!navigator.onLine) {
    flashScannerResult(false);
    showToast("Group check-in needs a connection — reconnect and try again", "error");
    return;
  }
  const res = await checkInSquadTicket(squadId);
  if (!res || !res.ok) {
    flashScannerResult(false);
    const msg =
      res?.error === "all_checked_in"
        ? "Everyone in this group is already checked in"
        : res?.error === "not_found"
          ? "Squad not found for this event"
          : res?.error === "forbidden"
            ? "Not your event"
            : "Couldn't check in — try again";
    showToast(msg, res?.error === "all_checked_in" ? "info" : "error");
    return;
  }
  const entry = scannerState.guestlist.find((t) => t.ticket_id === res.ticket_id);
  if (entry) entry.status = "checked_in";
  await idbPut("guestlists", scannerState.eventId, scannerState.guestlist);
  renderScannerList();
  flashScannerResult(true);
  showToast(
    `${res.purchaser_name || "Guest"} checked in — ${res.remaining} left in this group`,
    "success",
  );
}

async function syncScannerQueue() {
  if (!navigator.onLine) return;
  let keys;
  try {
    keys = await idbGetAllKeys("pending");
  } catch (e) {
    return;
  }
  for (const ticketId of keys) {
    const res = await checkInTicket(ticketId);
    if (res && res.ok) {
      await idbDelete("pending", ticketId);
    }
    // Leave failed ones queued — a real error (not_found/forbidden) will
    // just keep failing, but that's rare (would mean the ticket was
    // cancelled or the event reassigned) and safe to leave for a human to
    // notice rather than silently dropping the queued check-in.
  }
  const remaining = await idbGetAllKeys("pending").catch(() => []);
  const badge = document.getElementById("scanner-pending-badge");
  if (badge) {
    badge.textContent = remaining.length
      ? `${remaining.length} pending sync`
      : "";
    badge.style.display = remaining.length ? "" : "none";
  }
}
window.addEventListener("online", () => {
  if (state.view === "scan") syncScannerQueue();
});

function stopScannerCamera() {
  if (scannerState.videoStream) {
    scannerState.videoStream.getTracks().forEach((t) => t.stop());
    scannerState.videoStream = null;
  }
  scannerState.scanning = false;
}

async function startScannerCamera() {
  if (typeof BarcodeDetector === "undefined") {
    showToast("Camera scanning isn't supported on this browser — use search below", "info");
    return;
  }
  const video = document.getElementById("scanner-video");
  if (!video) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    scannerState.videoStream = stream;
    video.srcObject = stream;
    await video.play();
    scannerState.detector = new BarcodeDetector({ formats: ["qr_code"] });
    scannerState.scanning = true;
    scanFrame(video);
  } catch (e) {
    showToast("Couldn't access the camera — use search below instead", "error");
  }
}

async function scanFrame(video) {
  if (!scannerState.scanning) return;
  try {
    const codes = await scannerState.detector.detect(video);
    if (codes.length) {
      const raw = codes[0].rawValue.trim();
      if (raw.startsWith("SQUAD:")) {
        await checkInSquadScan(raw.slice(6));
      } else {
        await checkInGuestlistTicket(raw);
      }
    }
  } catch (e) {
    // detect() can throw transiently mid-frame — just try again next tick
  }
  if (scannerState.scanning) setTimeout(() => scanFrame(video), 600);
}

// Blueprint B2B2C flywheel: "Behavioral Analytics... teaching hosts how to
// optimize their own marketing timing." Real stat computed from tickets
// this host can already see (RLS: tickets_host_read) — no fabricated numbers.
function lastMinuteSalesStat(ev) {
  if (!ev || typeof ev.startsAt !== "number") return null;
  const rows = scannerState.guestlist.filter((t) => t.purchased_at);
  if (rows.length < 3) return null; // too few sales for the stat to mean anything
  const within48h = rows.filter(
    (t) => ev.startsAt - new Date(t.purchased_at).getTime() <= 48 * 3600000,
  ).length;
  return Math.round((within48h / rows.length) * 100);
}

// Codex "Spontaneity Metric": splits sales into Spontaneous (bought within 4
// hours of doors opening) vs Pre-Planned (everything earlier than that) —
// a two-way split rather than the doc's own three-way wording ("24+ hrs" /
// "<4 hrs", leaving a 4-24h gap undefined), since a clean binary is more
// legible as a bar and the gap band is still "planned ahead" relative to
// walking in on a whim. Same guestlist data as lastMinuteSalesStat(), just
// a tighter window and framed as a ratio rather than a single percentage.
function spontaneityStat(ev) {
  if (!ev || typeof ev.startsAt !== "number") return null;
  const rows = scannerState.guestlist.filter((t) => t.purchased_at);
  if (rows.length < 3) return null;
  const spontaneous = rows.filter(
    (t) => ev.startsAt - new Date(t.purchased_at).getTime() <= 4 * 3600000,
  ).length;
  const pct = Math.round((spontaneous / rows.length) * 100);
  return { spontaneousPct: pct, preplannedPct: 100 - pct, total: rows.length };
}

// Codex "Drop-off Rate": tickets sold vs QR codes actually scanned at the
// door — only meaningful once the event has actually happened.
function dropOffStat(ev) {
  if (!ev || eventStatus(ev) !== "past") return null;
  const sold = scannerState.guestlist.length;
  if (!sold) return null;
  const scanned = scannerState.guestlist.filter(
    (t) => t.status === "checked_in",
  ).length;
  return { sold, scanned, pct: Math.round((scanned / sold) * 100) };
}

// Repeat-attendee stat needs a round trip (cross-event history), unlike the
// other two — lazy-loaded the same way renderScannerList() is, into its own
// placeholder so the rest of the panel doesn't wait on it.
async function loadRepeatAttendeeStat(eventId) {
  const stat = await getRepeatAttendeeCount(eventId);
  scannerState.repeatStat = stat;
  const el = document.getElementById("repeat-attendee-stat");
  if (!el) return;
  if (!stat || !stat.total) {
    el.parentElement.style.display = "none";
    return;
  }
  el.parentElement.style.display = "block";
  el.innerHTML = `<strong style="color:var(--text);">${stat.repeat}</strong> of tonight's ${stat.total} attendee${stat.total !== 1 ? "s" : ""} ${stat.repeat === 1 ? "has" : "have"} been to one of your past events before.`;
}

function renderScanner() {
  const ev = EVENTS.find((e) => e.id === scannerState.eventId);
  const checkedInCount = scannerState.guestlist.filter(
    (t) => t.status === "checked_in",
  ).length;
  const lastMinutePct = lastMinuteSalesStat(ev);
  const spontaneity = spontaneityStat(ev);
  const dropOff = dropOffStat(ev);
  setTimeout(() => renderScannerList(), 0);
  setTimeout(() => loadRepeatAttendeeStat(scannerState.eventId), 0);
  return `<button class="back-btn" onclick="stopScannerCamera();goBack()">←</button>
    <div class="connect-header"><h2>${ev ? escapeHtml(ev.title) : "Scan tickets"}</h2><p>${checkedInCount} / ${scannerState.guestlist.length} checked in</p></div>
    <span id="scanner-pending-badge" style="display:none;font-size:11px;font-weight:700;color:var(--accent);"></span>
    ${
      lastMinutePct !== null
        ? `<div class="hp-panel" style="margin-bottom:14px;"><div class="hp-title">📊 Your sales timing</div><div style="font-size:12px;color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">${lastMinutePct}%</strong> of tickets for this event sold in the final 48 hours before start. ${lastMinutePct >= 60 ? "Your audience buys late — lean into last-minute pushes." : "Your audience plans ahead — early promotion is working for you."}</div></div>`
        : ""
    }
    ${
      spontaneity !== null
        ? `<div class="hp-panel" style="margin-bottom:14px;">
            <div class="hp-title">⚡ Spontaneous vs planned</div>
            <div style="display:flex;height:8px;border-radius:99px;overflow:hidden;margin:8px 0;">
              <div style="width:${spontaneity.spontaneousPct}%;background:#8B5CF6;"></div>
              <div style="width:${spontaneity.preplannedPct}%;background:var(--surface-2);"></div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">${spontaneity.spontaneousPct}%</strong> booked within 4 hours of doors opening (spontaneous) · <strong style="color:var(--text);">${spontaneity.preplannedPct}%</strong> booked earlier (pre-planned)</div>
          </div>`
        : ""
    }
    <div class="hp-panel" style="margin-bottom:14px;display:${scannerState.repeatStat && scannerState.repeatStat.total ? "block" : "none"};">
      <div class="hp-title">🔁 Repeat attendees</div>
      <div id="repeat-attendee-stat" style="font-size:12px;color:var(--text-muted);line-height:1.6;"></div>
    </div>
    ${
      dropOff !== null
        ? `<div class="hp-panel" style="margin-bottom:14px;">
            <div class="hp-title">🚪 Drop-off rate</div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">${dropOff.scanned} of ${dropOff.sold}</strong> tickets sold were actually scanned at the door (${dropOff.pct}%).${dropOff.pct < 70 ? " Worth checking whether capacity planning should account for no-shows." : ""}</div>
          </div>`
        : ""
    }
    <div class="panel" style="padding:16px;margin-bottom:14px;text-align:center;">
      <video id="scanner-video" muted playsinline style="width:100%;max-width:320px;border-radius:12px;background:#000;display:${scannerState.scanning ? "block" : "none"};margin:0 auto 10px;"></video>
      ${
        scannerState.scanning
          ? `<button class="btn btn-outline" onclick="stopScannerCamera();renderView();">Stop camera</button>`
          : `<button class="btn" onclick="startScannerCamera()">Start camera scan</button>`
      }
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <input class="gate-input" placeholder="Search by name or ticket ID…" oninput="scannerSetSearch(this.value)" style="flex:1;margin-bottom:0;"/>
      <button class="btn btn-outline btn-small" style="flex-shrink:0;" onclick="exportGuestlistCsv()" title="Download attendee list as CSV">⭳ CSV</button>
    </div>
    <div id="scanner-list"></div>`;
}

// Blueprint table-stakes: "Audience Data Ownership (CSV Export)... hosts
// 100% ownership of their attendee lists" — unlike DICE's walled garden.
// Client-side generation from the already-fetched guestlist; no new
// backend call needed since fetchGuestlist() already returns everything
// a host is allowed to see (RLS: tickets_host_read).
function exportGuestlistCsv() {
  const rows = scannerState.guestlist;
  if (!rows.length) {
    showToast("No guests to export yet", "error");
    return;
  }
  const ev = EVENTS.find((e) => e.id === scannerState.eventId);
  const csvEscape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Name", "Ticket ID", "Type", "Seat", "Status"];
  const lines = [header.join(",")];
  rows.forEach((t) => {
    lines.push(
      [
        csvEscape(t.purchaser_name || "Guest"),
        csvEscape(t.ticket_id),
        csvEscape(t.type_label || t.ticket_type || ""),
        csvEscape(t.total_seats > 1 ? `${t.seat_num}/${t.total_seats}` : ""),
        csvEscape(t.status || ""),
      ].join(","),
    );
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ev?.title || "cumulus-event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-guestlist.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} guest${rows.length !== 1 ? "s" : ""}`, "success");
}

// Boot. Never let an unexpected rejection leave the user on a blank screen.
start().catch((e) => {
  try {
    renderGate();
  } catch (_) {}
});

// ══════════════════════════════════════════════
// PROFESSIONAL POLISH — PHASE II JAVASCRIPT
// View transitions · Ripples · Scroll reveal · Stagger
// ══════════════════════════════════════════════

// --- View transition wrapper ---
const _origRenderView = renderView;
renderView = function () {
  _origRenderView.apply(this, arguments);
  const container = document.getElementById("view-container");
  if (container && state.view !== "browse") {
    container.classList.remove("view-enter");
    void container.offsetWidth; // force reflow
    container.classList.add("view-enter");
    // Stagger child panels
    const panels = container.querySelectorAll(
      ".panel, .intro-card, .badge-cell, .stat-box",
    );
    panels.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.045}s`;
      el.classList.add("stagger-item");
    });
    // Scroll reveal observer
    requestAnimationFrame(() => setupReveal(container));
  }
};

// --- Scroll reveal via IntersectionObserver ---
function setupReveal(root) {
  if (!window.IntersectionObserver) return;
  const els = (root || document).querySelectorAll(
    ".panel, .section-title, .connect-header, .back-btn",
  );
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  els.forEach((el) => {
    el.classList.add("reveal");
    obs.observe(el);
  });
}

// --- Button ripple effect ---
document.addEventListener(
  "click",
  function (e) {
    const btn = e.target.closest(".btn:not(.btn-text)");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  },
  { passive: true },
);

// --- Gate card: add stagger to form fields ---
const _origRenderGate = renderGate;
renderGate = function () {
  _origRenderGate.apply(this, arguments);
  requestAnimationFrame(() => {
    const fields = document.querySelectorAll(
      "#gate-root label, #gate-root input, #gate-root button, #gate-root p",
    );
    fields.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(
        () => {
          el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          el.style.opacity = "";
          el.style.transform = "";
        },
        220 + i * 60,
      );
    });
  });
};

// --- Card editor stagger ---
const _origRenderCardEditor = renderCardEditor;
renderCardEditor = function () {
  _origRenderCardEditor.apply(this, arguments);
  requestAnimationFrame(() => {
    // The card editor's swatch/pattern/tag pickers add up to 250+ elements
    // across its four tabs. Staggering by a flat per-element index (i * 50ms)
    // meant elements late in DOM order — e.g. the Pattern tab's buttons —
    // stayed invisible for 5-15+ seconds if a user switched to that tab
    // before its turn came up, since switching tabs doesn't re-trigger this
    // reveal. Cap the index so every field is visible within ~1s of the
    // editor opening, no matter how many fields exist across all tabs.
    const fields = document.querySelectorAll(
      "#card-editor-root label, #card-editor-root input, #card-editor-root textarea, #card-editor-root button",
    );
    fields.forEach((el, i) => {
      el.style.opacity = "0";
      setTimeout(
        () => {
          el.style.transition = "opacity 0.28s ease";
          el.style.opacity = "";
        },
        180 + Math.min(i, 14) * 50,
      );
    });
  });
};

// --- Smooth map caption on load ---
window.addEventListener("load", () => {
  setTimeout(() => setupReveal(document.getElementById("view-container")), 300);
});

// Keyboard support for div/span elements acting as buttons (role="button"/"radio"):
// activates on Enter/Space so mouse-only onclick handlers are reachable from a keyboard.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest('[role="button"],[role="radio"]');
  if (!el) return;
  e.preventDefault();
  el.click();
});

// Escape closes whichever overlay/modal/popup is currently open — each close
// function is a no-op if its overlay isn't present, so it's safe to call them all.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  try {
    closeLpSignup();
  } catch (err) {}
  try {
    closeAttendeePeek();
  } catch (err) {}
  try {
    closeActivePopup();
  } catch (err) {}
  try {
    closeBadgePicker();
  } catch (err) {}
  try {
    closeExpandedCard();
  } catch (err) {}
  try {
    if (document.getElementById("card-editor-root")?.innerHTML) closeCardEditor();
  } catch (err) {}
});
