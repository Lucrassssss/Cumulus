// ─── My Tickets — its own screen, reached from a single row on Account ─────
// Used to be split across two separate near-duplicate screens (a flat list
// here, and a by-event grouped list reached from the confirmation screen's
// "View all my tickets" button, which lacked the Transfer/Cancel actions
// below), then briefly rendered fully inline on Account itself. Account now
// just links to this dedicated view — a wallet full of ticket cards doesn't
// belong crowding the settings list above it.
function openMyTickets() {
  pushNav();
  state.view = "my-tickets";
  renderNav();
  renderView();
  window.scrollTo(0, 0);
}

function renderMyTickets() {
  const isPast = (t) => {
    const ev = EVENTS.find((e) => e.id === t.eventId);
    return ev && eventStatus(ev) === "past";
  };
  const known = myTickets.filter((t) => EVENTS.some((e) => e.id === t.eventId));
  const upcoming = known.filter((t) => !isPast(t)).length;
  const past = known.length - upcoming;
  const tab = state.ticketsTab === "past" ? "past" : "upcoming";
  const seg = (k, label, n) =>
    `<button type="button" role="tab" class="tk-tab${tab === k ? " on" : ""}" aria-selected="${tab === k}" onclick="setTicketsTab('${k}')">${label}${n ? `<span class="tk-tab-n">${n}</span>` : ""}</button>`;
  return `<div class="v-page">
    <header class="v-page-head">
      <div class="v-kicker">Wallet</div>
      <h1 class="v-h1">Your tickets</h1>
      <p class="v-sub">${upcoming ? `${upcoming} coming up` : myTickets.length ? "Nothing coming up" : "Nothing here yet"}</p>
    </header>
    ${myTickets.length ? `<div class="tk-tabs" role="tablist" aria-label="Tickets">${seg("upcoming", "Upcoming", upcoming)}${seg("past", "Past", past)}</div>` : ""}
    ${myTicketsCardsHtml(tab)}
    ${(() => {
      if (tab !== "upcoming") return "";
      const saved = savedUpcoming();
      if (!saved.length) return "";
      return `<div class="hp-sec-head"><h3>Saved</h3><span>${saved.length} coming up</span></div>
        <div class="fr-list compact hp-list">${saved.map((ev) => feedRowHtml(ev)).join("")}</div>`;
    })()}
  </div>`;
}
function setTicketsTab(k) {
  if (state.ticketsTab === k) return;
  state.ticketsTab = k;
  renderView();
}

// Sorted soonest-event-first (not purchase order) — a ticket wallet reads
// as "what's coming up", so the next thing you're going to is always on top.
function myTicketsCardsHtml(tab = "upcoming") {
  if (!myTickets.length)
    return `<div class="feed-empty">
      <div class="feed-empty-art" aria-hidden="true">${BRAND_MARK}</div>
      <h3>No tickets. Yet.</h3>
      <p>Everything you book lands here — QR, calendar, transfer, all of it.</p>
      <div class="feed-empty-actions"><button class="v-btn" onclick="goFeed()">Find something on</button></div>
    </div>`;
  const wantPast = tab === "past";
  const list = myTickets.filter((t) => {
    const ev = EVENTS.find((e) => e.id === t.eventId);
    return ev && (eventStatus(ev) === "past") === wantPast;
  });
  if (!list.length)
    return wantPast
      ? `<div class="tk-empty">${brandMark("be-mark")}<b>No past events yet</b><span>Events you've been to will be kept here, with their tickets and receipts.</span></div>`
      : `<div class="tk-empty">${brandMark("be-mark")}<b>Nothing coming up</b><span>Your next booking will land here, QR and all.</span><button class="v-btn sm" onclick="goFeed()">Find something on</button></div>`;
  // Upcoming: soonest first. Past: most recent first.
  return list
    .sort((a, b) => {
      const evA = EVENTS.find((e) => e.id === a.eventId);
      const evB = EVENTS.find((e) => e.id === b.eventId);
      const d = (evA?.startsAt ?? 0) - (evB?.startsAt ?? 0);
      return wantPast ? -d : d;
    })
    .map((t) => {
      const ev = EVENTS.find((e) => e.id === t.eventId);
      if (!ev) return "";
      const status = eventStatus(ev);
      const safeTitle = escapeHtml(ev.title).replace(/'/g, "&#39;");
      return `<article class="tk${status === "past" ? " past" : ""}${status === "live" ? " is-live" : ""}">
      <div class="tk-art ${posterClass(ev)}" style="${posterStyle(ev)}" onclick="openViewTicket('${ev.id}')" role="button" tabindex="0" aria-label="Open ticket for ${escapeHtml(ev.title)}">
        ${posterGlyph(ev)}
        <span class="tk-stamp" aria-hidden="true">${BRAND_MARK}</span>
        <div class="tk-art-foot">
          <span class="fp-date${status === "live" ? " live" : ""}">${status === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</span>
          <h3 class="tk-title">${escapeHtml(ev.title)}</h3>
          <div class="tk-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
        </div>
      </div>
      <div class="tk-perf" aria-hidden="true"></div>
      <div class="tk-stub">
        <div class="tk-row">
          <div><span class="tk-lbl">Admit</span><b>${t.qty} × ${escapeHtml(t.typeLabel || "General")}</b></div>
          <div><span class="tk-lbl">Paid</span><b>${t.total ? `£${t.total.toFixed(2)}` : "Free"}</b></div>
          <div><span class="tk-lbl">Code</span><b class="mono">${escapeHtml(t.ticketId)}</b></div>
        </div>
        <div class="tk-actions">
          ${
            status === "past"
              ? `<button class="v-btn ghost" onclick="openViewTicket('${ev.id}')">Ticket &amp; receipt</button>${ev.host ? `<button class="v-btn ghost" onclick="openHostProfile('${escapeHtml(String(ev.hostId || ev.host)).replace(/'/g, "&#39;")}','${escapeHtml(ev.host).replace(/'/g, "&#39;")}')">Host's events</button>` : ""}`
              : `<button class="v-btn${status === "live" ? " tk-qr-live" : ""}" onclick="openViewTicket('${ev.id}')">${status === "live" ? '<span class="tk-live-dot" aria-hidden="true"></span>Show QR' : "Show QR"}</button>
          <button class="v-btn ghost" onclick="openCalendarSheet('${ev.id}')">+ Calendar</button>`
          }
        </div>
        ${
          status !== "past"
            ? `<div class="tk-links">
              <button onclick="openCantGoSheet('${escapeHtml(t.ticketId)}')">Can't make it?</button>
            </div>`
            : ""
        }
      </div>
    </article>`;
    })
    .join("");
}

// "Can't make it?" — Dice's model, without the touting: hand it to a mate
// for free, or give it back at face value and the spot goes straight to the
// next person on the waitlist. One sheet, both honest options.
function openCantGoSheet(ticketId) {
  const t = myTickets.find((x) => x.ticketId === ticketId);
  const ev = t && EVENTS.find((e) => e.id === t.eventId);
  if (!ev) return;
  closeLocationSheet(true);
  const safeTitle = escapeHtml(ev.title).replace(/'/g, "&#39;");
  const canReturn = ev.startsAt - Date.now() >= 24 * 3600000;
  const amt = t.total ? `£${t.total.toFixed(2)}` : "";
  const received = !!t.claimedBy;
  const ic = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Can't make it?");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>Can't make it?</b><span>${escapeHtml(ev.title)} · ${dateLabel(ev)}</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      <button class="loc-opt primary" onclick="openTransferSheet('${escapeHtml(t.ticketId)}')">
        <span class="loc-ic">${ic('<path d="M4 12h12M12 6l6 6-6 6"/>')}</span>
        <span class="loc-txt"><b>Send it to a friend</b><span>Free · they get the QR, you're off the hook</span></span>
      </button>
      ${
        canReturn
          ? `<button class="loc-opt" onclick="closeLocationSheet(true);cancelTicket('${escapeHtml(t.ticketId)}')">
        <span class="loc-ic">${ic('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')}</span>
        <span class="loc-txt"><b>${amt ? (received ? `Return it · ${amt} refunded` : `Return it · ${amt} back`) : "Give up your spot"}</b><span>${
          amt && received
            ? `Refund goes to ${escapeHtml(t.purchaserName || "the friend who bought it")}'s original card, not yours`
            : `${amt ? "Full refund at face value — " : ""}your spot goes to the next person on the waitlist`
        }</span></span>
      </button>`
          : `<div class="cg-note">Returns close 24 hours before doors — you can still send it to a friend.</div>`
      }
      <div class="cg-note">No touting, no mark-ups. Tickets only ever change hands at face value.</div>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
}

// "Send it to a friend" — step 2. Industry rule (Ticketmaster, Live Nation,
// Tixr; DICE/Eventbrite refund only to the original payment method): a
// transfer moves the TICKET, never the money. Said plainly before any link
// exists, so nobody is surprised if the event is later cancelled.
function openTransferSheet(ticketId) {
  const t = myTickets.find((x) => x.ticketId === ticketId);
  const ev = t && EVENTS.find((e) => e.id === t.eventId);
  if (!ev) return;
  closeLocationSheet(true);
  const received = !!t.claimedBy;
  const buyer = escapeHtml(t.purchaserName || "the original buyer");
  const safeTitle = escapeHtml(ev.title).replace(/'/g, "&#39;");
  const ic = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Send your ticket to a friend");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>Send to a friend</b><span>${escapeHtml(ev.title)} · ${dateLabel(ev)}</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      <ul class="tf-list">
        <li>${ic('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>')}<span><b>You'll get a link to send them.</b> When they claim it, the ticket and its QR move to their wallet and leave yours.</span></li>
        <li class="key">${ic('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>')}<span><b>Refunds stay with ${received ? buyer : "you"}.</b> If the event is cancelled or the ticket is returned, the money goes back to ${received ? `${buyer}'s` : "your"} original card — never to the person holding the ticket.</span></li>
        <li>${ic('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')}<span><b>Face value only.</b> Any money between you is between you — Odd Flock never charges for a transfer.</span></li>
      </ul>
      <button class="v-btn wide" onclick="closeLocationSheet(true);transferMyTicket('${escapeHtml(t.ticketId)}','${safeTitle}')">Got it — create the link</button>
      <div class="cg-note"><a href="terms.html#transfers" target="_blank">Full transfer &amp; refund policy</a></div>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
}

// Shown when a friend's link is claimed — a proper moment, not a toast,
// and the refund rule stated up front.
function showClaimedSheet(eventId) {
  const ev = EVENTS.find((e) => e.id === eventId);
  closeLocationSheet(true);
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Ticket received");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>You've got a ticket</b><span>${ev ? `${escapeHtml(ev.title)} · ${dateLabel(ev)}` : "It's in your Tickets"}</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      <p class="tf-p">It's in your wallet with its own QR code — you're all set for the door.</p>
      <div class="tf-note">Heads up: this ticket was paid for by a friend, so any refund (if the event is cancelled or it's returned) goes back to their card.</div>
      <button class="v-btn wide" onclick="closeLocationSheet(true);${ev ? `openViewTicket('${ev.id}')` : "navStack=[];openTicketsTab()"}">View my ticket</button>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
}

// Real self-serve cancellation, mirroring deleteEvent()'s Supabase-delete
// pattern. Gated to >=24h before the event, matching the policy copy shown
// at booking/confirmation (renderBook/renderConfirmed).
async function cancelTicket(ticketId, confirmed) {
  const t = myTickets.find((x) => x.ticketId === ticketId);
  if (!t) return;
  const ev = EVENTS.find((e) => e.id === t.eventId);
  if (ev && ev.startsAt - Date.now() < 24 * 3600000) {
    showToast("Cancellations close 24 hours before the event.", "error");
    return;
  }
  const paid = t.total > 0;
  if (
    !confirmed &&
    !confirm(
      paid
        ? "Cancel this booking? Your payment will be refunded. This can't be undone."
        : "Cancel this booking? This can't be undone.",
    )
  )
    return;
  if (!state.userId) {
    // No real account behind this ticket (shouldn't happen — booking is
    // gated behind sign-up — but keep the old local-only fallback rather
    // than hard-crash on a state this session's guest-browsing work made
    // theoretically unreachable).
    myTickets = myTickets.filter((x) => x.ticketId !== ticketId);
    showToast("Booking cancelled", "success");
    renderView();
    return;
  }
  // Real refund + waitlist hand-off (cancel-ticket-refund) — see that
  // function's header. Runs before touching local state, so a failed
  // refund never silently drops the ticket from the wallet.
  const res = await cancelTicketRefund(ticketId);
  if (!res || res.ok !== true) {
    showToast(res?.error || "Couldn't cancel — try again", "error");
    return;
  }
  myTickets = myTickets.filter((x) => x.ticketId !== ticketId);
  if (state.ticketCounts && t.eventId && state.ticketCounts[String(t.eventId)])
    state.ticketCounts[String(t.eventId)] = Math.max(0, state.ticketCounts[String(t.eventId)] - 1);
  loadTicketCounts(t.eventId);
  showToast(
    res.refunded ? "Booking cancelled — refund on its way" : "Booking cancelled",
    "success",
  );
  renderView();
}



// Host form ("Make a night"): four quick steps — the vibe, when, where,
// tickets — beside a live ticket that fills itself in as you type. Every
// field keeps its old id, so submitHostEvent() / initHostMap() / the price
// and recurring helpers in 07–08 read it exactly as before. Hosting is
// frictionless: every event is public, admins publish instantly, everyone
// else goes through a quick review (notify-admin-new-event emails on it).
const HOST_TITLE_IDEAS = ["Rooftop Jazz & Natural Wine", "Sunday Run Club", "Vinyl Swap Social", "Late-night Dumpling Supper", "Beginner Life Drawing"];
function renderHostView() {
  const p = _hostPrefill || {};
  const dup = !!p.title;
  const cat0 = p.category && CATS[p.category] ? p.category : Object.keys(CATS)[0];
  const paid = p.priceTiers ? true : !!p.price;
  const step = (n, title, sub, body, extra = "") =>
    `<section class="hx2-step" data-step="${n}" ${extra}>
      <header class="hx2-step-h"><i class="hx2-n" aria-hidden="true"><span>${n}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i><div><b>${title}</b><span>${sub}</span></div></header>
      ${body}
    </section>`;
  const chip = (label, onclick, extra = "") => `<button type="button" class="v-chip sm" onclick="${onclick}" ${extra}>${label}</button>`;
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };
  // the coming Saturday — next week's if that's already "Tomorrow"
  let nextSat = (6 - new Date().getDay() + 7) % 7 || 7;
  if (nextSat <= 1) nextSat += 7;
  return `<div class="hx2${dup ? " is-dup" : ""}">
    <header class="hx2-head">
      <div class="v-kicker">${dup ? "Run it back" : "Host · 0% platform fee"}</div>
      <h1 class="hx2-title">${dup ? "Same night,<br/>new date." : "Make a<br/>night<i>.</i>"}</h1>
      <p class="hx2-sub">${dup ? "Everything's carried over — pick a new date and it's ready to go." : "Four quick bits and it's on London's live map. You keep 100% of the ticket price."}</p>
      <div id="host-type-notice" class="hx2-notice">${
        state.isAdmin
          ? `${uiIcon("check", 14)} Admin: this goes straight onto the live map.`
          : "Goes live after a quick review — usually within a few hours."
      }</div>
    </header>
    ${renderMyHostedEventsDuplicatePanel()}

    <div class="hx2-grid">
      <div class="hx2-form" oninput="hostFormChanged()" onchange="hostFormChanged()">
        ${step(1, "The vibe", "Name it and tell people what to expect", `
          <label class="hx2-lbl" for="host-title">Event name</label>
          <input id="host-title" class="hx2-big" maxlength="80" placeholder="e.g. ${HOST_TITLE_IDEAS[Math.floor(Math.random() * HOST_TITLE_IDEAS.length)]}" value="${escapeHtml(p.title || "")}" autocomplete="off"/>
          <span class="hx2-lbl">Category</span>
          <div class="hx2-chips" role="radiogroup" aria-label="Category">${Object.keys(CATS)
            .map((c) => `<button type="button" role="radio" class="v-chip sm hx2-cat${c === cat0 ? " on" : ""}" aria-checked="${c === cat0}" style="--dot:${posterPalette(c)[0]}" data-cat="${escapeHtml(c)}" onclick="setHostCat(this.dataset.cat)"><i></i>${escapeHtml(c)}</button>`)
            .join("")}</div>
          <select id="host-cat" class="hx2-hidden" tabindex="-1" aria-hidden="true">${Object.keys(CATS)
            .map((c) => `<option value="${escapeHtml(c)}"${c === cat0 ? " selected" : ""}>${escapeHtml(c)}</option>`)
            .join("")}</select>
          <label class="hx2-lbl" for="host-desc">What's the plan?</label>
          <textarea id="host-desc" class="hx2-in" rows="3" placeholder="Doors at 7, two sets, natural wine at the bar. Bring a mate.">${escapeHtml(p.desc || "")}</textarea>
          <input id="host-flyer-input" type="file" accept="image/*" hidden onchange="handleHostFlyerSelect(this)"/>
          <button type="button" class="hx2-flyer" onclick="document.getElementById('host-flyer-input').click()">
            <span id="host-flyer-preview" class="hx2-flyer-art"${p.photoUrl ? ` style="background:url('${p.photoUrl}') center/cover"` : ""}>${p.photoUrl ? "" : uiIcon("camera", 22)}</span>
            <span class="hx2-flyer-txt"><b>${p.photoUrl ? "Using the original flyer" : "Add a flyer"}</b><small>${p.photoUrl ? "Tap to swap it" : "Optional — no flyer, we'll design a poster for you"}</small></span>
          </button>`)}

        ${step(2, "When", dup ? "Dates don't carry over — pick a new one" : "Pick a day, a start time and how long it runs", `
          <div class="hx2-chips" role="group" aria-label="Quick day">
            ${chip("Tonight", "setHostDay(0)", 'data-day="0"')}${chip("Tomorrow", "setHostDay(1)", 'data-day="1"')}${chip(`This ${day(nextSat).toLocaleDateString("en-GB", { weekday: "short" })} ${day(nextSat).getDate()}`, `setHostDay(${nextSat})`, `data-day="${nextSat}"`)}
            <label class="v-chip sm hx2-pickday">${uiIcon("calendar", 14)} Pick a date<input id="host-start-date" type="date" min="${dayKey(Date.now())}" onclick="try{this.showPicker()}catch(e){}" onchange="autofillEventEndDate(this.value);updateRecurringHint();hostSyncEnd();"/></label>
          </div>
          <div class="hx2-row">
            <label class="hx2-field"><span class="hx2-lbl">Starts</span><input id="host-start-time" type="time" class="hx2-in" onchange="hostSyncEnd()"/></label>
            <div class="hx2-field"><span class="hx2-lbl">Runs for</span>
              <div class="hx2-seg" role="radiogroup" aria-label="How long">${[2, 3, 4, 6].map((h) => `<button type="button" role="radio" aria-checked="${h === 3}" class="${h === 3 ? "on" : ""}" data-h="${h}" onclick="setHostDuration(${h})">${h}h</button>`).join("")}</div>
            </div>
          </div>
          <div class="hx2-when" id="hx2-when" aria-live="polite"></div>
          <details class="hx2-more">
            <summary>Different end time, or runs past midnight?</summary>
            <div class="hx2-row">
              <label class="hx2-field"><span class="hx2-lbl">End date</span><input id="host-end-date" type="date" class="hx2-in" onchange="_hostDurManual=true"/></label>
              <label class="hx2-field"><span class="hx2-lbl">End time</span><input id="host-end-time" type="time" class="hx2-in" onchange="_hostDurManual=true"/></label>
            </div>
          </details>
          <label class="ff-toggle hx2-toggle"><span><b>Repeat it</b><small>Weekly, fortnightly or monthly — one form, several events</small></span>
            <input type="checkbox" id="host-recurring-toggle" onchange="document.getElementById('host-recurring-rows').style.display=this.checked?'flex':'none';updateRecurringHint();"/><i aria-hidden="true"></i></label>
          <div id="host-recurring-rows" class="hx2-row" style="display:none;">
            <label class="hx2-field"><span class="hx2-lbl">Every</span><select id="host-recurring-freq" class="hx2-in" onchange="updateRecurringHint()"><option value="7">Week</option><option value="14">2 weeks</option><option value="30">Month</option></select></label>
            <label class="hx2-field"><span class="hx2-lbl">Times</span><input id="host-recurring-count" type="number" min="2" max="12" value="4" class="hx2-in" oninput="updateRecurringHint()"/></label>
          </div>
          <div id="host-recurring-hint" class="hx2-hint" style="display:none;"></div>`)}

        ${step(3, "Where", "Search the address, or tap the map to drop the pin", `
          <label class="hx2-lbl" for="host-address-search">Address</label>
          <div class="hx2-search">
            ${uiIcon("pin", 16)}
            <input id="host-address-search" class="hx2-in" placeholder="Street or postcode…" oninput="handleAddressAutocomplete()" autocomplete="off" value="${escapeHtml(p.address || "")}"/>
            <div id="autocomplete-results" class="hx2-ac"></div>
          </div>
          <div id="host-map-picker"></div>
          <div id="host-lat-lon-text" class="hx2-hint">${p.lat != null ? `Pinned at ${Number(p.lat).toFixed(4)}, ${Number(p.lon).toFixed(4)}` : "Pin starts in central London — search or tap the map to move it"}</div>
          <div class="hx2-row">
            <label class="hx2-field" style="flex:1.4"><span class="hx2-lbl">Venue name</span><input id="host-venue" class="hx2-in" placeholder="e.g. The Rooftop" value="${escapeHtml(p.venue || "")}"/></label>
            <label class="hx2-field"><span class="hx2-lbl">Area <small>optional</small></span><input id="host-area" class="hx2-in" placeholder="e.g. Peckham" value="${escapeHtml(p.area || "")}"/></label>
          </div>`, 'style="overflow:visible"')}

        ${step(4, "Tickets", "How many people, and what it costs", `
          <span class="hx2-lbl">How many people?</span>
          <div class="hx2-chips" role="group" aria-label="Capacity">
            ${[20, 50, 100, 250].map((n) => `<button type="button" class="v-chip sm" data-cap="${n}" onclick="setHostCap(${n})">${n}</button>`).join("")}
            <input id="host-capacity" type="number" min="1" inputmode="numeric" class="hx2-in hx2-cap" placeholder="Other" value="${p.capacity ?? ""}" aria-label="Capacity"/>
          </div>
          <span class="hx2-lbl">Entry</span>
          <div class="hx2-seg hx2-paid" role="radiogroup" aria-label="Free or paid">
            <button type="button" role="radio" aria-checked="${!paid}" class="${paid ? "" : "on"}" onclick="setHostPaid(false)">Free</button>
            <button type="button" role="radio" aria-checked="${paid}" class="${paid ? "on" : ""}" onclick="setHostPaid(true)">Paid</button>
          </div>
          <div id="hx2-price-row" class="hx2-price"${paid ? "" : " hidden"}>
            <label class="hx2-money"><span>£</span><input id="host-price" type="number" min="0" step="0.01" inputmode="decimal" placeholder="10" value="${p.priceTiers ? "" : p.price || ""}" aria-label="Ticket price in pounds"/></label>
            <div class="host-price-preview" id="host-price-preview" aria-live="polite"></div>
            <label class="ff-toggle hx2-toggle"><span><b>Price tiers</b><small>Early bird → General → Final, rising on dates you pick</small></span>
              <input type="checkbox" id="host-tiered-toggle" ${p.priceTiers ? "checked" : ""} onchange="document.getElementById('host-tiered-rows').style.display=this.checked?'block':'none'"/><i aria-hidden="true"></i></label>
            <div id="host-tiered-rows" style="display:${p.priceTiers ? "block" : "none"};">
              <p class="hx2-hint">Fill whichever tiers you want. Each price holds until its date, then the next takes over — leave the last one's date blank.${p.priceTiers ? " Prices carried over; dates didn't." : ""}</p>
              ${["early", "general", "final"]
                .map((id, i) => {
                  const label = ["Early bird", "General", "Final"][i];
                  const prior = (p.priceTiers || []).find((t) => t.label === ["Early Bird", "General", "Final"][i]);
                  return `<div class="hx2-row hx2-tier"><label class="hx2-field"><span class="hx2-lbl">${label}</span><label class="hx2-money sm"><span>£</span><input id="tier-${id}-price" type="number" min="0" step="0.01" placeholder="0" value="${prior ? prior.price : ""}"/></label></label>
                    <label class="hx2-field" style="flex:1.5"><span class="hx2-lbl">Rises after</span><input id="tier-${id}-cutoff" type="datetime-local" class="hx2-in"/></label></div>`;
                })
                .join("")}
            </div>
          </div>
          <p class="hx2-hint">Guests see one all-in price with a small booking fee on top. You keep every penny of yours, paid out 24–48h after the event.</p>`)}
      </div>

      <aside class="hx2-live" aria-label="Live preview">
        <div class="hx2-live-h"><span class="pulse"></span>Live preview</div>
        <div id="hx2-live"></div>
      </aside>
    </div>

    <div class="hx2-bar">
      <div class="hx2-prog" aria-live="polite"><div class="hx2-dots">${[1, 2, 3, 4].map((n) => `<i data-d="${n}"></i>`).join("")}</div><span id="hx2-prog-txt">Let's go</span></div>
      <button id="host-submit-btn" class="v-btn" onclick="submitHostEvent()">${state.isAdmin ? "Put it on the map" : "Send for review"} →</button>
    </div>

    <div class="hx2-after">
      <h2 class="hx2-after-h">Your hosting</h2>
      ${renderHostPayoutsPanel()}
      ${renderConnectStatusPanel()}
      ${renderPromoCodesPanel()}
      ${renderMyHostedEventsCancelPanel()}
    </div>
  </div>`;
}

// ── Host form helpers ─────────────────────────────────────────────────────
let _hostDur = 3;
let _hostDurManual = false;
let _hostAllDone = false;
const _hv = (id) => (document.getElementById(id) || {}).value || "";
function setHostCat(c) {
  const sel = document.getElementById("host-cat");
  if (sel) sel.value = c;
  document.querySelectorAll(".hx2-cat").forEach((b) => {
    const on = b.dataset.cat === c;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", on);
  });
  hostFormChanged();
}
function setHostDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const inp = document.getElementById("host-start-date");
  if (inp) inp.value = dayKey(d);
  const t = document.getElementById("host-start-time");
  if (t && !t.value) t.value = offset === 0 && new Date().getHours() >= 19 ? "21:00" : "19:00";
  const end = document.getElementById("host-end-date");
  if (end && !_hostDurManual) end.value = "";
  autofillEventEndDate(inp ? inp.value : "");
  updateRecurringHint();
  hostSyncEnd();
}
function setHostDuration(h) {
  _hostDur = h;
  _hostDurManual = false;
  document.querySelectorAll(".hx2-seg [data-h]").forEach((b) => {
    const on = Number(b.dataset.h) === h;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", on);
  });
  hostSyncEnd();
}
// End = start + the chosen length (crossing midnight moves the end date),
// unless the host has set an end by hand under "Different end time".
function hostSyncEnd() {
  const sd = _hv("host-start-date"), st = _hv("host-start-time");
  if (sd && st && !_hostDurManual) {
    const end = new Date(`${sd}T${st}`);
    end.setHours(end.getHours() + _hostDur);
    const ed = document.getElementById("host-end-date"), et = document.getElementById("host-end-time");
    if (ed) ed.value = dayKey(end);
    if (et) et.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  }
  hostFormChanged();
}
function setHostCap(n) {
  const inp = document.getElementById("host-capacity");
  if (inp) inp.value = n;
  hostFormChanged();
}
function setHostPaid(paid) {
  document.querySelectorAll(".hx2-paid button").forEach((b, i) => {
    const on = (i === 1) === paid;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", on);
  });
  const row = document.getElementById("hx2-price-row");
  if (row) row.hidden = !paid;
  const price = document.getElementById("host-price");
  if (!paid) {
    if (price) price.value = "";
    const tiers = document.getElementById("host-tiered-toggle");
    if (tiers && tiers.checked) tiers.click();
  } else if (price) setTimeout(() => price.focus(), 30);
  updateHostPricePreview();
  hostFormChanged();
}
// Re-checks each step, the progress bar and the live ticket on every edit.
function hostFormChanged() {
  const root = document.querySelector(".hx2");
  if (!root) return;
  const sd = _hv("host-start-date"), st = _hv("host-start-time");
  const done = {
    1: !!_hv("host-title").trim(),
    2: !!(sd && st && _hv("host-end-date") && _hv("host-end-time")),
    3: !!_hv("host-venue").trim(),
    4: Number(_hv("host-capacity")) > 0,
  };
  let n = 0;
  for (const k of [1, 2, 3, 4]) {
    root.querySelector(`.hx2-step[data-step="${k}"]`)?.classList.toggle("done", done[k]);
    root.querySelector(`.hx2-dots [data-d="${k}"]`)?.classList.toggle("on", done[k]);
    n += done[k];
  }
  const txt = document.getElementById("hx2-prog-txt");
  if (txt) txt.textContent = n === 4 ? "Ready to go" : n ? `${n} of 4 done` : "Let's go";
  const btn = document.getElementById("host-submit-btn");
  if (btn) btn.classList.toggle("ready", n === 4);
  if (n === 4 && !_hostAllDone && btn && typeof saveBurst === "function") saveBurst(btn);
  _hostAllDone = n === 4;
  // quick-pick chips reflect the fields
  const today = new Date();
  root.querySelectorAll("[data-day]").forEach((b) => {
    const d = new Date(today);
    d.setDate(d.getDate() + Number(b.dataset.day));
    b.classList.toggle("on", sd === dayKey(d));
  });
  root.querySelector(".hx2-pickday")?.classList.toggle("on", !!sd && ![...root.querySelectorAll("[data-day]")].some((b) => b.classList.contains("on")));
  const cap = _hv("host-capacity");
  root.querySelectorAll("[data-cap]").forEach((b) => b.classList.toggle("on", b.dataset.cap === cap));
  // the "when" line
  const when = document.getElementById("hx2-when");
  if (when) {
    if (sd && st && _hv("host-end-time")) {
      const s = new Date(`${sd}T${st}`), e = new Date(`${_hv("host-end-date") || sd}T${_hv("host-end-time")}`);
      const f = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
      when.innerHTML = e > s
        ? `${uiIcon("calendar", 14)} <b>${f(s)}</b>, ${st}–${_hv("host-end-time")}${dayKey(e) !== sd ? ` <small>(ends ${e.toLocaleDateString("en-GB", { weekday: "short" })})</small>` : ""}`
        : `<span class="bad">Ends before it starts — check the end time.</span>`;
    } else when.textContent = sd ? "Now pick a start time." : "";
  }
  renderHostLive();
}
// The live ticket: the same poster + ticket look guests will see.
function renderHostLive() {
  const el = document.getElementById("hx2-live");
  if (!el) return;
  const sd = _hv("host-start-date"), st = _hv("host-start-time") || "19:00";
  const price = parseFloat(_hv("host-price")) || 0;
  const ev = {
    id: "host-preview",
    title: _hv("host-title").trim() || "Your night",
    category: _hv("host-cat") || Object.keys(CATS)[0],
    venue: _hv("host-venue").trim() || "Venue",
    area: _hv("host-area").trim(),
    price,
    startsAt: sd ? new Date(`${sd}T${st}`).getTime() : null,
    photoUrl: window._hostFlyerUrl || (_hostPrefill && _hostPrefill.photoUrl) || null,
  };
  const when = ev.startsAt
    ? new Date(ev.startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase() + " · " + st
    : "PICK A DATE";
  const cap = Number(_hv("host-capacity")) || 0;
  el.innerHTML = `<div class="hx2-poster ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}
      <span class="fp-date">${escapeHtml(when)}</span>
      <div class="hx2-poster-foot"><span class="hx2-poster-cat">${escapeHtml(ev.category)}</span><b>${escapeHtml(ev.title)}</b><small>${escapeHtml(ev.venue)}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</small></div>
    </div>
    <div class="hx2-live-meta"><span><b>${price ? fmtGBP(price + getCumulusFee(price)) : "Free"}</b>${price ? " all-in" : " entry"}</span><span>${cap ? `${cap} spots` : "— spots"}</span></div>
    <div class="hx2-live-btn" aria-hidden="true">${ticketButtonHtml({ id: "host-preview", title: ev.title, category: ev.category, photoUrl: ev.photoUrl, startsAt: ev.startsAt }, { label: price ? "Get tickets" : "Get in free", onclick: "" })}</div>`;
}

// Small convenience toward the "60-second publish" goal: picking a start
// date fills in the same end date (most events don't span midnight), so a
// host isn't tapping all four date/time fields for a same-day event. Only
// fires when the end date is still empty, so it never clobbers a value the
// host already deliberately set (e.g. a multi-day event).
function autofillEventEndDate(startDateVal) {
  const endInput = document.getElementById("host-end-date");
  if (!startDateVal || !endInput || endInput.value) return;
  endInput.value = startDateVal;
}

// ══════════════════════════════════════════════
// HOST SCANNER — offline-first ticket check-in
// ══════════════════════════════════════════════
// Protected in the sense that matters: the actual security boundary is
// server-side (tickets_host_read RLS + check_in_ticket()'s host_id check),
// not this client-side gate. The Account entry point just decides whether
// to *show* the door — see renderAccount()'s conditional row.
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
  window.scrollTo(0, 0);
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
        ? `<div class="hp-panel" style="margin-bottom:14px;"><div class="hp-title">Your sales timing</div><div style="font-size:12px;color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">${lastMinutePct}%</strong> of tickets for this event sold in the final 48 hours before start. ${lastMinutePct >= 60 ? "Your audience buys late — lean into last-minute pushes." : "Your audience plans ahead — early promotion is working for you."}</div></div>`
        : ""
    }
    ${
      spontaneity !== null
        ? `<div class="hp-panel" style="margin-bottom:14px;">
            <div class="hp-title">Spontaneous vs planned</div>
            <div style="display:flex;height:8px;border-radius:99px;overflow:hidden;margin:8px 0;">
              <div style="width:${spontaneity.spontaneousPct}%;background:#8B5CF6;"></div>
              <div style="width:${spontaneity.preplannedPct}%;background:var(--surface-2);"></div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">${spontaneity.spontaneousPct}%</strong> booked within 4 hours of doors opening (spontaneous) · <strong style="color:var(--text);">${spontaneity.preplannedPct}%</strong> booked earlier (pre-planned)</div>
          </div>`
        : ""
    }
    <div class="hp-panel" style="margin-bottom:14px;display:${scannerState.repeatStat && scannerState.repeatStat.total ? "block" : "none"};">
      <div class="hp-title">Repeat attendees</div>
      <div id="repeat-attendee-stat" style="font-size:12px;color:var(--text-muted);line-height:1.6;"></div>
    </div>
    ${
      dropOff !== null
        ? `<div class="hp-panel" style="margin-bottom:14px;">
            <div class="hp-title">Drop-off rate</div>
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
  a.download = `${(ev?.title || "oddflock-event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-guestlist.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} guest${rows.length !== 1 ? "s" : ""}`, "success");
}

// Boot moved to the end of 13-discover-feed.js — the last script — so every
// render path it touches is defined before start() runs.

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
      ".panel, .intro-card, .stat-box",
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
});
