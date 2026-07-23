// Account — replaces the old gamified Profile (ID card, levels/badges,
// achievements page, about-me/interests, memories, recent-events recap).
// Tickets are the actual reason this app exists, so they're the headline
// content here rather than a link buried under a stats row; everything else
// is a lean, purely functional settings list. No admin tools here at all —
// those moved to their own owner-only nav tab (renderAdmin()).
function renderAccount() {
  return `
    <div class="connect-header connect-header-avatar">
      ${accountAvatarHtml(56)}
      <div><h2>Account</h2><p>${escapeHtml(state.profileName)}</p></div>
    </div>

    <div class="section-title">My Tickets</div>
    ${myTicketsCardsHtml()}

    <div class="section-title">Settings</div>
    <div class="prof-action-list">
      <button class="prof-action-row" onclick="openAccountDetails()">
        <span class="prof-action-label">Account details<span class="prof-action-sub">Name, email, phone &amp; photo</span></span>
        <span class="prof-action-right">›</span>
      </button>
      ${
        canAccessScanner()
          ? `<button class="prof-action-row" onclick="openScannerPicker()">
        <span class="prof-action-label">Scan tickets<span class="prof-action-sub">Check guests in at the door</span></span>
        <span class="prof-action-right">›</span>
      </button>`
          : ""
      }
      ${
        isApprovedHost()
          ? ""
          : state.hostApplicationStatus === "pending"
            ? `<div class="prof-action-row" style="opacity:.6;">
        <span class="prof-action-label">Host application<span class="prof-action-sub">Pending review — usually within 48 hours</span></span>
      </div>`
            : `<button class="prof-action-row" onclick="openHostApply()">
        <span class="prof-action-label">Become a host<span class="prof-action-sub">Apply to host events on Cumulus</span></span>
        <span class="prof-action-right">›</span>
      </button>`
      }
      <button class="prof-action-row" onclick="window.location.href='mailto:hello@cumulusapp.co'">
        <span class="prof-action-label">Help &amp; Support</span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-signout" onclick="signOut()">
        <span class="prof-action-label">Sign out</span>
        <span class="prof-action-right">›</span>
      </button>
    </div>
  `;
}

// Shared avatar — a real photo (state.profileAvatarUrl) once uploaded, a
// plain initials monogram until then. Used in the Account header, the
// Account details page, and the nav-adjacent contexts that want a small
// identity marker.
function accountAvatarHtml(size) {
  const s = size || 40;
  if (state.profileAvatarUrl) {
    return `<div class="account-avatar" style="width:${s}px;height:${s}px;"><img src="${state.profileAvatarUrl}" alt="" width="${s}" height="${s}"/></div>`;
  }
  return `<div class="account-avatar account-avatar-mono" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.38)}px;">${initials(state.profileName)}</div>`;
}

// ── Account details — its own full page (industry-standard "edit your
// profile" pattern: name/email/phone/photo, one page, one Save), replacing
// the old inline-swap row that used to live directly in the Settings list.
function openAccountDetails() {
  pushNav();
  state.view = "account-details";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Banner shown on a host's own public profile page — a real uploaded
// photo once set, the same textured gold gradient as a fallback otherwise
// (matches .host-profile-cover exactly, so setting/clearing a banner never
// jumps the layout). Only shown here at all for approved hosts: a banner
// is meaningless for an account with no public host page to show it on.
function accountCoverHtml() {
  if (state.profileCoverUrl) {
    return `<div class="account-cover-edit-zone" onclick="document.getElementById('account-cover-input').click()" role="button" tabindex="0" aria-label="Change host banner" style="background-image:url('${state.profileCoverUrl}');">
      <span class="account-avatar-edit-badge account-cover-edit-badge" aria-hidden="true">📷</span>
    </div>`;
  }
  return `<div class="account-cover-edit-zone account-cover-edit-empty" onclick="document.getElementById('account-cover-input').click()" role="button" tabindex="0" aria-label="Add a host banner">
    <span class="account-avatar-edit-badge account-cover-edit-badge" aria-hidden="true">📷</span>
  </div>`;
}

function renderAccountDetails() {
  const showCover = isApprovedHost();
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Account details</h2><p>Your name, contact info &amp; photo</p></div>

    ${
      showCover
        ? `<div class="section-title">Host banner</div>
    <input id="account-cover-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountCoverChange(this)"/>
    ${accountCoverHtml()}
    <p class="account-cover-hint">Shown at the top of your public host page. Checked automatically — nothing unsuitable gets published.</p>`
        : ""
    }

    <div class="account-avatar-edit">
      <input id="account-avatar-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountAvatarChange(this)"/>
      <div class="account-avatar-edit-zone" onclick="document.getElementById('account-avatar-input').click()" role="button" tabindex="0" aria-label="Change profile photo">
        ${accountAvatarHtml(84)}
        <span class="account-avatar-edit-badge" aria-hidden="true">📷</span>
      </div>
      <button class="btn-text" style="font-size:12.5px;" onclick="document.getElementById('account-avatar-input').click()">${state.profileAvatarUrl ? "Change photo" : "Add a photo"}</button>
    </div>

    <div class="gate-field">
      <label class="gate-label" for="account-details-name">Name</label>
      <input id="account-details-name" class="gate-input" value="${escapeHtml(state.profileName)}" autocomplete="name"/>
    </div>
    <div class="gate-field">
      <label class="gate-label" for="account-details-email">Email</label>
      <input id="account-details-email" class="gate-input" type="email" value="${escapeHtml(state.profileEmail)}" autocomplete="email"/>
    </div>
    <div class="gate-field">
      <label class="gate-label" for="account-details-phone">Phone number <span class="gate-label-optional">(optional)</span></label>
      <input id="account-details-phone" class="gate-input" type="tel" value="${escapeHtml(state.profilePhone || "")}" autocomplete="tel" placeholder="+44 7700 900000"/>
    </div>
    <div id="account-details-error" style="display:none;color:var(--danger,#dc2626);font-size:12px;margin-bottom:8px;"></div>
    <button class="btn" style="width:100%;" onclick="saveAccountDetailsForm()">Save changes</button>`;
}

// Both handlers below route through services.js's moderated upload path
// (moderate-image-upload edge function, Google Cloud Vision SafeSearch) —
// the client has no direct storage-write access to either bucket, so a
// rejected photo never reaches a public URL in the first place.
async function handleAccountAvatarChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showToast("Checking photo…");
  const { url, error } = await uploadAvatarPhoto(file);
  input.value = "";
  if (!url) {
    showToast(error || "Couldn't upload that photo — try again", "error");
    return;
  }
  state.profileAvatarUrl = url;
  try {
    await persistProfile();
  } catch (e) {}
  showToast("Photo updated", "success");
  renderView();
}

async function handleAccountCoverChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showToast("Checking photo…");
  const { url, error } = await uploadCoverPhoto(file);
  input.value = "";
  if (!url) {
    showToast(error || "Couldn't upload that photo — try again", "error");
    return;
  }
  state.profileCoverUrl = url;
  try {
    await persistProfile();
  } catch (e) {}
  showToast("Banner updated", "success");
  renderView();
}

// Real edit, unlike the old editProfile() this page replaces — that one
// just flipped state.editingProfile with no form ever consuming it, so the
// button silently did nothing. persistProfile() already knows how to
// upsert name/email/phone/avatar; this just points it at the edited values.
async function saveAccountDetailsForm() {
  const nameEl = document.getElementById("account-details-name");
  const emailEl = document.getElementById("account-details-email");
  const phoneEl = document.getElementById("account-details-phone");
  const errEl = document.getElementById("account-details-error");
  const name = (nameEl?.value || "").trim();
  const email = (emailEl?.value || "").trim();
  const phone = (phoneEl?.value || "").trim();
  const showErr = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = "block";
    }
  };
  if (!name) return showErr("Name can't be empty.");
  if (!EMAIL_PATTERN.test(email)) return showErr("Enter a valid email.");
  if (phone && !PHONE_PATTERN.test(phone))
    return showErr("Enter a valid phone number, or leave it blank.");

  state.profileName = name;
  state.profileEmail = email;
  state.profilePhone = phone;
  try {
    await persistProfile();
    showToast("Account updated", "success");
  } catch (e) {
    showToast("Couldn't reach the server — try again", "error");
  }
  goBack();
}

// Compact real-event preview card reused wherever a screen needs to show
// live events instead of empty space (Calendar agenda, Social teaser).
// Small urgency pill shown on card-style event rows when few spaces remain
// (<=15% of capacity) — reuses the exact spacesLeft calc from renderDetail().
function almostFullBadgeHtml(ev) {
  if (!ev.capacity) return "";
  const going = attendeesFor(ev.id).length;
  const spacesLeft = Math.max(0, ev.capacity - going);
  if (spacesLeft > 0 && spacesLeft <= Math.ceil(ev.capacity * 0.15)) {
    return `<span class="badge-almost-full">Almost full</span>`;
  }
  return "";
}

const ELC_LOCATION_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 21s7-7.58 7-12A7 7 0 0 0 5 9c0 4.42 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>`;

// Shared event row used everywhere the app needs a bigger, richer synopsis
// card rather than a bare title — calendar List mode and Day view. A square
// image (a real photo if one exists — currently only ev.nightShotUrl, a
// past-event memory shot — else a category stock photo via catImg(), same
// source the detail page's own hero already uses) plus title/location/host,
// nothing else: no inline "Book"/"Add to calendar" actions, since the point
// is a synopsis, not a duplicate purchase flow — the whole card opens the
// real detail page, where buying actually happens.
function eventListCardHtml(ev) {
  const c = CATS[ev.category] || { color: "var(--accent)", textColor: "#fff" };
  const status = eventStatus(ev);
  const price = eventPrice(ev);
  const img = ev.photoUrl || ev.nightShotUrl || catImg(ev.category);
  const ended = status === "past";
  return `<div class="panel event-list-card${ended ? " event-list-card-ended" : ""}" style="--corner:${c.color};" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}${ended ? ", event ended" : ""}">
    <div class="elc-img" style="background-image:url('${img}');"></div>
    <div class="elc-body">
      <div class="elc-top-row">
        <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};margin-bottom:0;">${ev.category}</span>
        ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>` : ""}
        ${ended ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text-muted) !important;border:1px solid var(--line);margin-bottom:0;">Event ended</span>` : ""}
        ${almostFullBadgeHtml(ev)}
      </div>
      <div class="elc-title">${escapeHtml(ev.title)}</div>
      <div class="elc-meta">${ELC_LOCATION_ICON}<span>${escapeHtml(ev.venue || "")}${ev.area ? `, ${escapeHtml(ev.area)}` : ""}</span></div>
      <div class="elc-meta">${escapeHtml(ev.date)} · ${escapeHtml(ev.time)}</div>
      <div class="elc-foot">
        ${ev.host ? `<span class="elc-host">Hosted by ${escapeHtml(ev.host)}</span>` : `<span></span>`}
        <span class="elc-price">${price ? `From £${price}` : "Free"}</span>
      </div>
    </div>
  </div>`;
}

function setCalendarViewMode(mode) {
  state.calendarViewMode = mode;
  renderView();
}

function renderCalendar() {
  const weeks = buildCalendarWeeks(CALENDAR_YEAR, CALENDAR_MONTH);
  const eventsByDay = {};
  const monthEvents = [];
  EVENTS.forEach((ev) => {
    const d = getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH);
    if (d) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
      monthEvents.push(ev);
    }
  });
  monthEvents.sort((a, b) => a.startsAt - b.startsAt);

  const header = `
    <div class="connect-header cal-header">
      <button class="cal-nav-btn" onclick="changeCalendarMonth(-1)" aria-label="Previous month">←</button>
      <div>
        <div class="prof-about-label" style="margin-bottom:2px;">Event Calendar</div>
        <h2>${MONTH_NAMES[CALENDAR_MONTH]} ${CALENDAR_YEAR}</h2>
        <p>What's on this month</p>
      </div>
      <button class="cal-nav-btn" onclick="changeCalendarMonth(1)" aria-label="Next month">→</button>
    </div>
    <div class="social-seg cal-mode-seg">
      <button class="social-seg-btn${state.calendarViewMode === "list" ? "" : " active"}" onclick="setCalendarViewMode('month')">Month</button>
      <button class="social-seg-btn${state.calendarViewMode === "list" ? " active" : ""}" onclick="setCalendarViewMode('list')">List</button>
    </div>`;

  if (state.calendarViewMode === "list") {
    return header + renderCalendarEventList(monthEvents);
  }

  const now = new Date();
  const todayDay =
    now.getFullYear() === CALENDAR_YEAR && now.getMonth() === CALENDAR_MONTH
      ? now.getDate()
      : null;
  const cellsHtml = weeks
    .map((week) =>
      week
        .map((day) => {
          if (!day) return `<div class="calendar-cell empty"></div>`;
          const dayEvents = eventsByDay[day] || [];
          const isToday = day === todayDay;
          const dotN = Math.min(dayEvents.length, 4);
          const dots = dayEvents.length
            ? `<div class="cal-dots">${dayEvents
                .slice(0, dotN)
                .map((ev) => {
                  const cc = (CATS[ev.category] || { color: "var(--accent)" })
                    .color;
                  return `<span class="cal-dot" style="background:${cc};"></span>`;
                })
                .join(
                  "",
                )}${dayEvents.length > 4 ? `<span class="cal-dot-more">+${dayEvents.length - 4}</span>` : ""}</div>`
            : "";
          return `<div class="calendar-cell ${isToday ? "today" : ""} ${dayEvents.length ? "has-events" : ""} pointer" onclick="openCalendarDay(${day})" style="cursor:pointer;" role="button" tabindex="0" aria-label="${day}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}` : ""}"><div class="calendar-day-num">${day}</div>${dots}</div>`;
        })
        .join(""),
    )
    .join("");
  // Month view is the grid alone — no card list duplicated underneath it
  // (that's what List mode is for). The one exception is an empty month,
  // where a bare grid of dot-less cells reads as broken rather than "there's
  // just nothing on yet", so that case still gets a prompt.
  const agendaHtml = monthEvents.length
    ? ""
    : `<div class="cal-agenda-empty">
        <div class="map-empty-card" role="status" style="max-width:100%;">
          <div class="me-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg></div>
          <div class="me-title">Nothing on the calendar yet</div>
          <div class="me-sub">Events you RSVP to or host will show up here automatically.</div>
          <button class="btn" onclick="goBrowse()">Browse events</button>
        </div>
      </div>`;
  return (
    header +
    `
    <div class="calendar-scroll"><div class="calendar-inner">
      <div class="calendar-header-row">${WEEKDAY_LABELS.map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}</div>
      <div class="calendar-grid">${cellsHtml}</div>
    </div></div>
    ${agendaHtml}`
  );
}

// Searchable flat list of the currently-navigated month's events, grouped by
// date — the Dice/Eventbrite-style alternative to the month grid. The search
// box re-filters client-side (no full renderView()) so typing never loses
// focus; it's a local filter, separate from the global map #search-input.
function renderCalendarEventList(monthEvents) {
  const df = state.calListDateFilter || "all";
  return `<div class="cal-list">
    <div class="social-seg cal-mode-seg" style="max-width:280px;">
      <button class="social-seg-btn${df === "today" ? " active" : ""}" onclick="setCalListDateFilter('today')">Today</button>
      <button class="social-seg-btn${df === "weekend" ? " active" : ""}" onclick="setCalListDateFilter('weekend')">This weekend</button>
      <button class="social-seg-btn${df === "all" ? " active" : ""}" onclick="setCalListDateFilter('all')">All</button>
    </div>
    <input id="cal-list-search" class="search-input" style="width:100%;margin-bottom:16px;" placeholder="Search this month's events…" oninput="filterCalendarList()" autocomplete="off"/>
    <div id="cal-list-items">${calendarListItemsHtml(monthEvents, "")}</div>
  </div>`;
}
function setCalListDateFilter(mode) {
  state.calListDateFilter = state.calListDateFilter === mode ? "all" : mode;
  renderView();
}

function calendarListItemsHtml(events, query) {
  const q = (query || "").toLowerCase().trim();
  const df = state.calListDateFilter || "all";
  let filtered = q
    ? events.filter((ev) =>
        (ev.title + ev.venue + ev.area + ev.category + (ev.host || ""))
          .toLowerCase()
          .includes(q),
      )
    : events;
  if (df !== "all") filtered = filtered.filter((ev) => eventInDateRange(ev, df));
  if (!filtered.length) {
    return `<div class="map-empty-card" role="status" style="max-width:100%;margin:0 auto;">
      <div class="me-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></div>
      <div class="me-title">${q ? "No events match" : "Nothing on the calendar yet"}</div>
      <div class="me-sub">${q ? "Try a different search term." : "Events posted for this month will show up here."}</div>
    </div>`;
  }
  const groups = [];
  let lastKey = null;
  filtered.forEach((ev) => {
    if (ev.date !== lastKey) {
      groups.push({ key: ev.date, items: [] });
      lastKey = ev.date;
    }
    groups[groups.length - 1].items.push(ev);
  });
  return groups
    .map(
      (g) => `<div class="cal-list-group">
        <div class="cal-list-date">${escapeHtml(g.key)}</div>
        ${g.items.map(eventListCardHtml).join("")}
      </div>`,
    )
    .join("");
}

function filterCalendarList() {
  const input = document.getElementById("cal-list-search");
  const container = document.getElementById("cal-list-items");
  if (!input || !container) return;
  const monthEvents = [];
  EVENTS.forEach((ev) => {
    if (getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH)) monthEvents.push(ev);
  });
  monthEvents.sort((a, b) => a.startsAt - b.startsAt);
  container.innerHTML = calendarListItemsHtml(monthEvents, input.value);
}

// ════════════════════════════════════════════════
// TICKET SYSTEM
// ════════════════════════════════════════════════
// Blueprint table-stakes: tiered ticketing that "flips automatically" —
// implemented here as a time-cutoff schedule (events.price_tiers, e.g.
// Early Bird -> General -> Final). Capacity-based flipping is deliberately
// NOT implemented (would need a live attendee-count trigger; documented as
// deferred in ARCHITECTURE.md rather than half-built). Tiers are ordered by
// cutoff ascending; the active tier is the first whose cutoff hasn't
// passed, falling back to the last (final) tier once every cutoff has
// passed. This same selection logic is duplicated server-side in
// create-checkout-session (never trust the client for the actual charge).
function activeTicketTier(ev) {
  const tiers = Array.isArray(ev.priceTiers) ? ev.priceTiers : null;
  if (!tiers || !tiers.length) return null;
  const now = Date.now();
  const sorted = [...tiers].sort(
    (a, b) => new Date(a.cutoff || 0) - new Date(b.cutoff || 0),
  );
  const active = sorted.find((t) => !t.cutoff || new Date(t.cutoff) > now);
  return active || sorted[sorted.length - 1];
}
function eventPrice(ev) {
  const tier = activeTicketTier(ev);
  if (tier) return Number(tier.price) || 0;
  return ev.price || 0;
}
function getCumulusFee(ticketPrice) {
  if (ticketPrice <= 0) return 0;
  if (ticketPrice <= 15) return 1.5;
  if (ticketPrice <= 40) return 2.5;
  if (ticketPrice <= 71) return 3.5;
  return 4.5;
}
function ticketTypes(ev) {
  const tier = activeTicketTier(ev);
  const basePrice = eventPrice(ev);
  if (!basePrice)
    return [
      {
        id: "free",
        label: "Free Registration",
        price: 0,
        platformFee: 0,
        desc: "Claim your spot — no charge",
      },
    ];
  const platformFee = getCumulusFee(basePrice);
  if (tier) {
    return [
      {
        id: "tier",
        label: tier.label || "General",
        price: basePrice,
        platformFee,
        desc: tier.cutoff
          ? `${tier.label} pricing — rises after ${new Date(tier.cutoff).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
          : "Final price — this is it",
      },
    ];
  }
  return [
    {
      id: "general",
      label: "General Admission",
      price: basePrice,
      platformFee,
      desc: "Standard entry to the event",
    },
  ];
}
function generateTicketId() {
  return "CU-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
// Squad ticket-claim link code — separate namespace from ticket IDs so a
// leaked claim URL can't be confused with (or used as) a ticket lookup.
function generateClaimCode() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

let myTickets = [];
async function loadMyTickets() {
  if (!state.userId) {
    const r = await localGet(`tickets:${state.profileName}`);
    myTickets = r ? JSON.parse(r) : [];
    return;
  }
  const { data } = await sb
    .from("tickets")
    .select("*")
    .eq("user_id", state.userId)
    .order("purchased_at", { ascending: false });
  if (data)
    myTickets = data.map((t) => ({
      ticketId: t.ticket_id,
      bookingId: t.booking_id,
      seatNum: t.seat_num,
      totalSeats: t.total_seats,
      eventId: t.event_id,
      type: t.ticket_type,
      typeLabel: t.type_label,
      pricePerTicket: t.price_per_ticket,
      total: t.total,
      purchaserName: t.purchaser_name,
      purchasedAt: new Date(t.purchased_at).getTime(),
      squadId: t.squad_id,
      claimCode: t.claim_code,
    }));
}
async function _insertTickets(tickets) {
  if (!state.userId) return;
  const rows = tickets.map((t) => ({
    ticket_id: t.ticketId,
    booking_id: t.bookingId,
    seat_num: t.seatNum || null,
    total_seats: t.totalSeats || null,
    event_id: t.eventId,
    user_id: state.userId,
    ticket_type: t.type,
    type_label: t.typeLabel,
    price_per_ticket: t.pricePerTicket,
    platform_fee: t.platformFee || 0,
    total: t.total,
    purchaser_name: t.purchaserName,
    purchased_at: new Date(t.purchasedAt).toISOString(),
    squad_id: t.squadId || null,
    claim_code: t.claimCode || null,
    marketing_opt_in: t.marketingOptIn || false,
  }));
  await sb.from("tickets").insert(rows);
}

// A Squad is created once per multi-ticket purchase; the buyer keeps the
// first ticket, every other ticket gets a claim_code for the "share with
// your squad" link (claimTicket() reassigns it once someone opens the link).
async function createSquadIfNeeded(eventId, qty) {
  if (qty <= 1 || !state.userId) return null;
  try {
    const { data, error } = await sb
      .from("event_squads")
      .insert({ event_id: eventId, buyer_user_id: state.userId })
      .select()
      .single();
    if (error || !data) return null;
    return data.id;
  } catch (e) {
    return null;
  }
}
function getTicketForEvent(evId) {
  return myTickets.find((t) => t.eventId === evId);
}

let bookingDraft = {
  eventId: null,
  type: "general",
  qty: 1,
  confirmedTicket: null,
};

function openBook(id) {
  pushNav();
  bookingDraft = { eventId: id, qty: 1, confirmedTicket: null };
  const ev = EVENTS.find((e) => e.id === id);
  bookingDraft.type = ev ? ticketTypes(ev)[0].id : "general";
  state.view = "book";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function setBookingType(type) {
  bookingDraft.type = type;
  renderView();
}
function setBookingQty(q) {
  bookingDraft.qty = Math.max(1, Math.min(10, q));
  renderView();
}
function proceedToCheckout() {
  pushNav();
  // Read before the book screen's DOM goes away — startStripeCheckout()
  // (fired from the checkout screen) needs this value later.
  bookingDraft.marketingOptIn = !!document.getElementById("book-marketing-optin")?.checked;
  state.view = "checkout";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openViewTicket(evId) {
  pushNav();
  const eventTickets = myTickets.filter((t) => t.eventId === evId);
  if (!eventTickets.length) {
    openBook(evId);
    return;
  }
  bookingDraft.confirmedTickets = eventTickets;
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function registerFree(evId) {
  const ev = EVENTS.find((e) => e.id === evId);
  if (!ev) return;
  const baseId = generateTicketId();
  const nf = bookingDraft.qty || 1;
  const squadId = await createSquadIfNeeded(ev.id, nf);
  const marketingOptIn = !!document.getElementById("book-marketing-optin")?.checked;
  const freeTickets = Array.from({ length: nf }, (_, i) => ({
    ticketId: nf > 1 ? `${baseId}-${String(i + 1).padStart(2, "0")}` : baseId,
    seatNum: nf > 1 ? i + 1 : null,
    totalSeats: nf > 1 ? nf : null,
    bookingId: baseId,
    eventId: ev.id,
    type: "free",
    typeLabel: "Free Registration",
    pricePerTicket: 0,
    total: 0,
    purchaserName: state.profileName,
    purchasedAt: Date.now(),
    squadId,
    claimCode: i > 0 ? generateClaimCode() : null,
    marketingOptIn,
  }));
  myTickets.push(...freeTickets);
  await _insertTickets(freeTickets);
  // RSVP via Supabase
  const list = state.rsvps[ev.id] || [];
  if (!list.includes(state.profileName)) {
    await sb.from("rsvps").insert({
      event_id: ev.id,
      user_id: state.userId,
      user_name: state.profileName,
    });
    state.rsvps[ev.id] = [...list, state.profileName];
  }
  bookingDraft.confirmedTickets = freeTickets;
  navStack = [];
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Maps Cumulus's current light/dark palette onto Stripe's Elements
// Appearance API (theme + variables + fonts) so the payment form reads as
// part of the same page instead of a foreign white card dropped into a
// themed UI. Genuinely applies here — this is the raw Elements API
// (stripe.elements({appearance, fonts}), not the pre-built Checkout
// Session form's initEmbeddedCheckout()/createEmbeddedCheckoutPage(),
// which rejects an appearance option outright and, even where a
// server-side branding_settings equivalent exists, still can't theme its
// own input card (a fixed-light-surface product constraint, not a missing
// parameter — see ARCHITECTURE.md). Reads live computed CSS custom
// properties rather than duplicating hex values here, so it can never
// drift out of sync with styles.css.
function stripeAppearanceForCurrentTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    appearance: {
      theme: isDark ? "night" : "stripe",
      variables: {
        colorPrimary: v("--accent", isDark ? "#ffcf33" : "#c08a00"),
        // The app's own .btn convention pairs the gold/yellow accent with
        // near-black text (styles.css), not white — Stripe's own default
        // guess would likely pick white, which is barely readable against
        // the dark theme's bright #ffcf33. Match the real convention
        // instead of trusting a default here.
        colorPrimaryText: "#0a0a0a",
        colorBackground: v("--surface", isDark ? "#16181b" : "#f7f6f2"),
        colorText: v("--text", isDark ? "#ece9e1" : "#191a1c"),
        colorDanger: v("--danger", isDark ? "#f87171" : "#b91c1c"),
        fontFamily: v(
          "--font-sans",
          "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        ),
        borderRadius: "12px",
        spacingUnit: "4px",
      },
    },
    // Best-effort: the Appearance API's fontFamily only names a font, it
    // doesn't load one — Stripe's Elements render in their own isolated
    // context and won't inherit index.html's Google Fonts <link>. Pointing
    // it at the same Inter weights the rest of the app uses means the
    // payment form actually renders in Inter rather than falling back to a
    // generic system sans if this key isn't honored, worst case is
    // silently ignored, not a functional break.
    fonts: [
      {
        cssSrc:
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  };
}

// Holds the mounted Elements group + Payment Element between
// startStripeCheckout() (creates + mounts them) and submitStripePayment()
// (reads them back on click) — module-scope state, same pattern as
// window.stripeInstance below.
let stripeElementsGroup = null;

// Mobile-only collapse/expand for the order-recap card rendered by
// renderCheckout() — desktop forces it open via CSS (styles.css, the
// checkout view's own >=860px breakpoint) and hides the chevron, so this
// only ever fires from a real tap on narrower viewports.
function toggleCheckoutSummary() {
  const el = document.getElementById("checkout-summary");
  if (!el) return;
  const expanded = el.classList.toggle("expanded");
  const btn = el.querySelector(".checkout-summary-toggle");
  if (btn) btn.setAttribute("aria-expanded", expanded ? "true" : "false");
}

// Starts a real Stripe payment against a PaymentIntent — auto-triggered by
// afterRenderCheckout() the instant the payment screen renders, so
// "Continue to Payment" reads as one action, not two. Ticket rows are
// created ONLY by stripe-webhook once Stripe confirms payment — this
// function never writes to the tickets table itself. finalizeStripePayment()
// (below) picks the tickets up once payment actually succeeds, whether
// that happens inline (most cards — no redirect at all) or after the
// browser comes back from a redirect-based method (some banks/wallets),
// via checkStripeCheckoutReturn() at boot.
async function startStripeCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return;
  const status = document.getElementById("checkout-status");
  const setStatus = (html) => {
    if (status) {
      status.style.display = "flex";
      status.innerHTML = html;
    }
  };

  try {
    const res = await createCheckoutSession(
      ev.id,
      bookingDraft.qty,
      bookingDraft.marketingOptIn,
    );
    if (!res || res.error || !res.clientSecret) {
      throw new Error(res?.error || "Could not start checkout");
    }

    if (!window.stripeInstance) {
      window.stripeInstance = Stripe(window.CUMULUS_CONFIG.STRIPE_PUBLISHABLE_KEY);
    }
    const { appearance, fonts } = stripeAppearanceForCurrentTheme();
    stripeElementsGroup = window.stripeInstance.elements({
      clientSecret: res.clientSecret,
      appearance,
      fonts,
    });
    // Passing the already-known email as a default (rather than via a
    // separate Link Authentication Element the buyer would have to fill in
    // again) just prefills the card form's billing email now — Link itself
    // is deliberately excluded from create-checkout-session's payment_method_
    // types allow-list (card + PayPal only, per product decision), so this
    // no longer triggers Link's own one-tap recognition, only the plain
    // autofill.
    const paymentElement = stripeElementsGroup.create("payment", {
      defaultValues: state.profileEmail
        ? { billingDetails: { email: state.profileEmail } }
        : undefined,
    });
    paymentElement.mount("#payment-element");
    paymentElement.on("ready", () => {
      if (status) status.style.display = "none";
      // The Pay button lives inside the floating total+CTA bar now (see
      // renderCheckout()) — reveal the whole bar together, not just the
      // button, so the total appears at the same moment as the form.
      const ctaBar = document.getElementById("checkout-cta-bar");
      if (ctaBar) ctaBar.style.display = "flex";
    });
  } catch (err) {
    setStatus(
      `<div style="text-align:center;width:100%;">
        <div style="color:var(--danger);font-size:13px;margin-bottom:10px;">${escapeHtml(err.message || "Could not start checkout")}</div>
        <button class="btn btn-outline" onclick="startStripeCheckout()">Try again</button>
      </div>`,
    );
  }
}

// Fired by the "Pay £X" button rendered in renderCheckout(). Most card
// payments never leave the page at all — redirect:"if_required" only
// navigates away for payment methods that genuinely need it (some bank
// redirects/wallets), in which case checkStripeCheckoutReturn() (boot)
// picks it back up from the return_url's query params.
async function submitStripePayment() {
  if (!stripeElementsGroup || !window.stripeInstance) return;
  const btn = document.getElementById("pay-btn");
  const status = document.getElementById("checkout-status");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:.7">Processing…</span>';
  }
  if (status) {
    status.style.display = "none";
    status.innerHTML = "";
  }

  const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
    elements: stripeElementsGroup,
    confirmParams: {
      return_url: `${location.origin}/?checkout=return`,
    },
    redirect: "if_required",
  });

  if (error) {
    if (status) {
      status.style.display = "flex";
      status.innerHTML = `<div style="text-align:center;width:100%;"><div style="color:var(--danger);font-size:13px;">${escapeHtml(error.message || "Payment failed — try again")}</div></div>`;
      // #checkout-status sits above the Payment Element, at the top of the
      // scrollable checkout column — a buyer who scrolled down to reach a
      // tall Payment Element (card + wallets + Link) can tap the fixed Pay
      // bar without this ever entering view. Scroll it into view so the
      // reason for the failure isn't silently missed above the fold.
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.label || "Pay →";
    }
    return;
  }

  // No redirect happened (the common case for cards) — Stripe already
  // confirmed the PaymentIntent synchronously, so finalize right here
  // instead of waiting on a return_url that's never coming.
  if (paymentIntent?.status === "succeeded") {
    await finalizeStripePayment(paymentIntent.id);
  } else {
    // "processing" (rare — some bank debits settle asynchronously) or an
    // unexpected status. stripe-webhook will create the ticket once Stripe
    // actually confirms it; tell the buyer rather than leave them staring
    // at a disabled button.
    showToast(
      "Payment is processing — your ticket will appear in My Tickets shortly.",
      "info",
    );
  }
}

// Shared by submitStripePayment() (inline, no-redirect completion) and
// checkStripeCheckoutReturn() (redirect-based completion) — polls for the
// ticket rows stripe-webhook creates asynchronously once it receives
// payment_intent.succeeded, then shows the confirmation screen.
async function finalizeStripePayment(paymentIntentId) {
  showToast("Confirming your payment…", "info");
  for (let attempt = 0; attempt < 6; attempt++) {
    const rows = await fetchTicketsByPaymentIntent(paymentIntentId);
    if (rows && rows.length > 0) {
      await loadMyTickets();
      bookingDraft.confirmedTickets = rows.map((t) => ({
        ticketId: t.ticket_id,
        bookingId: t.booking_id,
        seatNum: t.seat_num,
        totalSeats: t.total_seats,
        eventId: t.event_id,
        type: t.ticket_type,
        typeLabel: t.type_label,
        pricePerTicket: t.price_per_ticket,
        total: t.total,
        purchaserName: t.purchaser_name,
        purchasedAt: new Date(t.purchased_at).getTime(),
        squadId: t.squad_id,
        claimCode: t.claim_code,
      }));
      navStack = [];
      state.view = "confirmed";
      renderNav();
      renderView();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  showToast(
    "Payment confirmed — your ticket is finishing up. Check My Tickets in a moment.",
    "info",
  );
}

// Boot-time handler for the browser coming back from a redirect-based
// payment method (some bank debits/wallets — most cards never leave the
// page, see submitStripePayment()). Stripe appends its own query params to
// the return_url passed to confirmPayment(): payment_intent,
// payment_intent_client_secret, redirect_status. Mirrors
// checkSquadClaim()'s URL-param pattern (read, strip, act).
async function checkStripeCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const paymentIntentId = params.get("payment_intent");
  const redirectStatus = params.get("redirect_status");
  if (!paymentIntentId || !redirectStatus) return;
  history.replaceState(null, "", location.pathname);

  if (redirectStatus !== "succeeded") {
    showToast(
      redirectStatus === "processing"
        ? "Payment is processing — your ticket will appear in My Tickets shortly."
        : "Payment was not completed — no charge was made.",
      "info",
    );
    return;
  }
  if (!state.userId) return; // returning signed-out isn't wired up — keep simple for now

  await finalizeStripePayment(paymentIntentId);
}

function afterRenderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length) return;
  const t0 = tickets[0];
  const masterEl = document.getElementById("squad-master-qr");
  if (masterEl && tickets.length > 1 && t0.squadId) {
    masterEl.innerHTML = "";
    try {
      new QRCode(masterEl, {
        text: `SQUAD:${t0.squadId}`,
        width: 134,
        height: 134,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      masterEl.innerHTML = `<div style="font-size:10px;word-break:break-all;color:#333;">SQUAD:${t0.squadId}</div>`;
    }
  }
  tickets.forEach((t, i) => {
    const el = document.getElementById(`ticket-qr-${i}`);
    if (!el) return;
    el.innerHTML = "";
    try {
      new QRCode(el, {
        text: t.ticketId,
        width: 120,
        height: 120,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      el.innerHTML = `<div style="font-size:10px;word-break:break-all;color:#333;">${t.ticketId}</div>`;
    }
  });
}

function downloadICS(evId) {
  const ev = EVENTS.find((e) => e.id === evId);
  if (!ev) return;
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDT = (d) => {
    const u = new Date(d);
    return `${u.getUTCFullYear()}${pad(u.getUTCMonth() + 1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`;
  };
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cumulus Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:cumulus-${ev.id}-${Date.now()}@cumulus.app`,
    `DTSTART:${fmtDT(ev.startTime)}`,
    `DTEND:${fmtDT(ev.endTime)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.desc.replace(/[;,]/g, "$&").replace(/n/g, "n")} — Hosted by ${ev.host}`,
    `LOCATION:${ev.venue}, ${ev.area}, London`,
    `ORGANIZER;CN="${ev.host}":mailto:events@cumulus.app`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("rn");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    ev.title.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-") + ".ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

