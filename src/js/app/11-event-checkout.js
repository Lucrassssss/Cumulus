// ─── Purchase flow: Tickets → Pay → You're in ─────────────────────────────
// Built against Dice / Eventbrite / Fever's quick-buy pattern: one screen to
// pick, one to pay, a moment of celebration, then the ticket itself. Every
// price shown is all-in (UK DMCC Act), the CTA always lives in the thumb
// zone, and "is this safe?" is answered before anyone has to ask.

const _bkIc = (d, s) =>
  `<svg viewBox="0 0 24 24" width="${s || 16}" height="${s || 16}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const BK_LOCK = '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
const BK_CHECK = '<path d="m5 12 5 5 9-10"/>';
const BK_RETURN = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>';

function _bkSteps(n) {
  const steps = ["Tickets", "Pay", "Done"];
  return `<ol class="bk-steps" aria-label="Step ${n} of 3">${steps
    .map((s, i) => `<li class="${i + 1 < n ? "done" : i + 1 === n ? "on" : ""}"${i + 1 === n ? ' aria-current="step"' : ""}><i>${i + 1 < n ? _bkIc(BK_CHECK, 11) : i + 1}</i>${s}</li>`)
    .join("")}</ol>`;
}
function _bkEventHead(ev) {
  return `<div class="bk-event">
    <div class="bk-art ${posterClass(ev)}" style="${posterStyle(ev)}" aria-hidden="true">${posterGlyph(ev)}</div>
    <div class="bk-ev-txt">
      <div class="bk-ev-when">${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</div>
      <div class="bk-ev-title">${escapeHtml(ev.title)}</div>
      <div class="bk-ev-where">${escapeHtml([ev.venue, ev.area].filter(Boolean).join(" · "))}</div>
    </div>
  </div>`;
}

// ─── Step 1: choose tickets ───────────────────────────────────────────────
// Fits one phone screen (Dice / Eventbrite): quantity lives inside the
// selected ticket, the breakdown lives in the pinned bar, reassurance is a
// single row — nothing to scroll past before "Continue".
function renderBook() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return '<div class="empty-state">Event not found.</div>';
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const isFree = !eventPrice(ev);
  const qty = bookingDraft.qty;
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const finalTotal = baseTotal + feeTotal;
  const stepper = `<div class="bk-stepper sm" role="group" aria-label="Number of tickets" onclick="event.stopPropagation()">
      <button onclick="setBookingQty(${qty - 1})" aria-label="One fewer" ${qty <= 1 ? "disabled" : ""}>−</button>
      <output aria-live="polite">${qty}</output>
      <button onclick="setBookingQty(${qty + 1})" aria-label="One more" ${qty >= 10 ? "disabled" : ""}>+</button>
    </div>`;
  const typeCards = types
    .map((t) => {
      const on = bookingDraft.type === t.id;
      const all = t.price + (t.platformFee || 0);
      return `
    <div class="tt-card${on ? " on" : ""}" onclick="setBookingType('${t.id}')" role="radio" tabindex="0" aria-checked="${on ? "true" : "false"}" aria-label="${escapeHtml(t.label)}, ${t.price ? `£${all.toFixed(2)} including booking fee` : "Free"}">
      <span class="tt-radio" aria-hidden="true"></span>
      <div class="tt-body"><div class="tt-name">${escapeHtml(t.label)}</div><div class="tt-desc">${t.price ? `£${all.toFixed(2)} · incl. £${(t.platformFee || 0).toFixed(2)} fee` : "Free"}${t.desc ? ` · ${escapeHtml(t.desc)}` : ""}</div></div>
      ${on ? stepper : `<div class="tt-price">${t.price ? `£${all.toFixed(2)}` : "Free"}</div>`}
    </div>`;
    })
    .join("");
  const cta = isFree
    ? `<button class="v-btn bk-cta-btn" onclick="registerFree('${ev.id}')">${_bkIc(BK_CHECK)}Get ${qty > 1 ? `${qty} tickets` : "ticket"}</button>`
    : `<button class="v-btn bk-cta-btn" onclick="proceedToCheckout()">Continue to pay</button>`;

  return `<div class="bk-page bk-fit">
    <div class="bk-top"><button class="bk-back" onclick="goBack()" aria-label="Back">${_bkIc('<path d="M15 5l-7 7 7 7"/>', 20)}</button>${_bkSteps(1)}</div>
    ${_bkEventHead(ev)}
    <h2 class="bk-h">Tickets</h2>
    <div class="bk-types" role="radiogroup" aria-label="Ticket type">${typeCards}</div>
    ${qty > 1 ? `<p class="bk-note">${_bkIc('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.7-3.4 3.2-5 6-5s5.3 1.6 6 5"/>', 14)} You'll get one link to share the other ${qty - 1} seat${qty > 2 ? "s" : ""}</p>` : ""}
    <div class="bk-extras">
      ${
        !isFree
          ? `<details class="bk-promo"${bookingDraft.promoCode ? " open" : ""}>
        <summary>Promo code</summary>
        <input id="book-promo-code" class="gate-input" placeholder="e.g. EARLYBIRD10" autocapitalize="characters" value="${escapeHtml(bookingDraft.promoCode || "")}" oninput="bookingDraft.promoCode=this.value.trim()"/>
      </details>`
          : ""
      }
      <label class="bk-optin">
        <input type="checkbox" id="book-marketing-optin" ${bookingDraft.marketingOptIn ? "checked" : ""} onchange="bookingDraft.marketingOptIn=this.checked"/>
        <span>Hear about ${escapeHtml(ev.host || "the host")}'s future events</span>
      </label>
    </div>
    <ul class="bk-chips" aria-label="Good to know">
      <li>${_bkIc(BK_CHECK, 13)}No hidden fees</li>
      ${!isFree ? `<li>${_bkIc(BK_LOCK, 13)}Secure by Stripe</li>` : ""}
      <li>${_bkIc(BK_RETURN, 13)}Refundable to 24h before</li>
    </ul>
    <div class="bk-cta">
      <div class="bk-cta-total"><span>${qty} ticket${qty !== 1 ? "s" : ""}</span><b>${finalTotal ? `£${finalTotal.toFixed(2)}` : "Free"}</b>${feeTotal ? `<em>incl. £${feeTotal.toFixed(2)} fee</em>` : ""}</div>
      ${cta}
    </div>
  </div>`;
}

// ─── Step 2: pay ──────────────────────────────────────────────────────────
// One screen: the order as a single line (tap Edit to change it), Apple /
// Google Pay one-tap buttons first where the device has them, the card form
// underneath, and Pay pinned in the thumb zone. Real Stripe PaymentIntent +
// Elements (create-checkout-session prices it server-side; numbers here are
// display only) — starts loading the moment this screen mounts.
function renderCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return "";
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const qty = bookingDraft.qty;
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const total = (baseTotal + feeTotal).toFixed(2);

  return `<div class="bk-page bk-fit bk-pay">
    <div class="bk-top"><button class="bk-back" onclick="goBack()" aria-label="Back">${_bkIc('<path d="M15 5l-7 7 7 7"/>', 20)}</button>${_bkSteps(2)}</div>
    <div class="bk-order" id="checkout-summary">
      <div class="bk-art ${posterClass(ev)}" style="${posterStyle(ev)}" aria-hidden="true">${posterGlyph(ev)}</div>
      <div class="bk-order-txt">
        <b>${escapeHtml(ev.title)}</b>
        <span>${qty} × ${escapeHtml(sel.label)} · ${feedDateLabel(ev)} ${feedTimeLabel(ev)}</span>
      </div>
      <div class="bk-order-amt"><b>£${total}</b><button type="button" onclick="goBack()">Edit</button></div>
    </div>
    ${bookingDraft.promoCode ? `<p class="bk-note">Promo "${escapeHtml(bookingDraft.promoCode)}" is being applied — the Pay button shows your real total.</p>` : ""}
    <div class="bk-express" id="express-wrap" hidden>
      <div id="express-checkout"></div>
      <div class="bk-or"><span>or pay by card</span></div>
    </div>
    <div class="checkout-payment-panel">
      <div id="checkout-status" class="checkout-status" role="status" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading payment form…</span>
        <div class="checkout-skeleton" aria-hidden="true">
          <div class="checkout-skeleton-row" style="width:40%;"></div>
          <div class="checkout-skeleton-row" style="height:46px;"></div>
          <div class="checkout-skeleton-row" style="height:46px;"></div>
        </div>
      </div>
      <div id="payment-element"></div>
    </div>
    <p class="bk-hint-pay">Choose how to pay — your card details open when you tap Card.</p>
    <p class="bk-secure">${_bkIc(BK_LOCK, 13)}<span>Encrypted by Stripe — we never see your card. By paying you agree to the <a href="terms.html" target="_blank">Terms</a>.</span></p>
    <div class="checkout-cta-bar bk-cta" id="checkout-cta-bar">
      <div class="bk-cta-total"><span>Total</span><b>£${total}</b>${feeTotal ? `<em>incl. £${feeTotal.toFixed(2)} fee</em>` : ""}</div>
      <button id="pay-btn" class="v-btn bk-cta-btn checkout-pay-btn" data-label="${_bkIc(BK_LOCK).replace(/"/g, "&quot;")}Pay £${total}" onclick="submitStripePayment()">${_bkIc(BK_LOCK)}Pay £${total}</button>
    </div>
  </div>`;
}

// Fired from renderView() right after the checkout screen mounts.
function afterRenderCheckout() {
  startStripeCheckout();
}

// ─── The Cumulus ticket glyph ─────────────────────────────────────────────
// One drawing, three moods: "scan" while paying (a beam prints the ticket),
// "win" when it's yours (fills Volt, ticks, the stub tears off and cumulus
// clouds puff out of the tear), "fail" (a small shake). The same ticket
// carries you from Pay to You're in — no generic spinner, no stock tick.
let _tgSeq = 0;
const TG_TOP = "M18 6H102A12 12 0 0 1 114 18V103A9 9 0 0 0 105 112H15A9 9 0 0 0 6 103V18A12 12 0 0 1 18 6Z";
const TG_STUB = "M15 112H105A9 9 0 0 0 114 121V150A12 12 0 0 1 102 162H18A12 12 0 0 1 6 150V121A9 9 0 0 0 15 112Z";
function _ticketGlyph(mode) {
  const id = `tg${++_tgSeq}`;
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1]
    .reduce((acc, w) => {
      acc.html += acc.x < 94 ? `<rect x="${acc.x}" y="126" width="${w * 1.6}" height="22" rx=".6"/>` : "";
      acc.x += w * 1.6 + 2.2;
      return acc;
    }, { x: 26, html: "" }).html;
  return `<svg class="tg ${mode || ""}" viewBox="0 0 120 168" aria-hidden="true">
    <defs>
      <clipPath id="${id}c"><path d="${TG_TOP}"/></clipPath>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".65"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--volt)" stop-opacity="0"/>
        <stop offset=".85" stop-color="var(--volt)" stop-opacity=".55"/>
        <stop offset="1" stop-color="var(--volt)" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <g class="tg-top">
      <path class="tg-shape" d="${TG_TOP}"/>
      <g clip-path="url(#${id}c)">
        <rect class="tg-fill" x="0" y="6" width="120" height="106"/>
        <rect class="tg-beam" x="0" y="-34" width="120" height="34" fill="url(#${id}b)"/>
      </g>
      <g class="tg-lines"><rect x="22" y="22" width="34" height="6" rx="3"/><rect x="22" y="34" width="62" height="9" rx="4.5"/><rect x="22" y="49" width="48" height="6" rx="3"/></g>
      <path class="tg-tick" d="M37 74l14 14 31-33"/>
      <g clip-path="url(#${id}c)"><rect class="tg-sheen" x="-80" y="-20" width="46" height="200" fill="url(#${id}s)" transform="rotate(18 60 60)"/></g>
    </g>
    <line class="tg-perf" x1="20" y1="112" x2="100" y2="112"/>
    <g class="tg-stub"><path class="tg-shape" d="${TG_STUB}"/><g class="tg-bars">${bars}</g></g>
  </svg>`;
}
function _buzz(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
}

// ─── Payment in progress ──────────────────────────────────────────────────
// A calm full-screen hold while the bank confirms and the ticket is written,
// so nobody double-taps Pay or wonders whether it worked.
function showPayOverlay(msg) {
  let el = document.getElementById("pay-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "pay-overlay";
    el.className = "pay-overlay";
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
  }
  if (!el.querySelector(".po-msg")) {
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.removeAttribute("aria-label");
    el.innerHTML = `<div class="po-card"><div class="po-glyph">${_ticketGlyph("scan")}</div><b class="po-msg"></b><span class="po-sub">${_bkIc(BK_LOCK, 13)} Secure payment · don't close this page</span></div>`;
  }
  el.querySelector(".po-msg").textContent = msg || "Processing…";
}
// Turns the processing overlay into a clear outcome card, on this screen:
// kind = "failed" | "pending". Big, readable, and announced to screen
// readers — the opposite of a toast at the bottom.
function showPayResult(kind, o) {
  const existing = document.querySelector("#pay-overlay .tg");
  if (kind === "failed" && existing && !o._shaken) {
    existing.classList.remove("scan");
    existing.classList.add("fail");
    _buzz([40]);
    setTimeout(() => showPayResult(kind, Object.assign({}, o, { _shaken: true })), 480);
    return;
  }
  showPayOverlay("");
  const el = document.getElementById("pay-overlay");
  if (!el) return;
  el.setAttribute("role", "alertdialog");
  el.setAttribute("aria-live", "assertive");
  el.setAttribute("aria-label", o.title);
  const icon =
    kind === "failed"
      ? _bkIc('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>', 30)
      : _bkIc('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 30);
  el.innerHTML = `<div class="po-card po-result ${kind}">
      <span class="po-ic">${icon}</span>
      <b class="po-title">${escapeHtml(o.title)}</b>
      <p class="po-body">${o.body || ""}</p>
      <div class="po-acts">
        ${o.secondary ? `<button class="v-btn ghost" onclick="${o.secondary.onclick}">${escapeHtml(o.secondary.label)}</button>` : ""}
        <button class="v-btn" onclick="${o.primary.onclick}">${escapeHtml(o.primary.label)}</button>
      </div>
    </div>`;
  el.classList.add("in");
  setTimeout(() => el.querySelector(".po-acts .v-btn:last-child")?.focus(), 60);
}
function hidePayOverlay(instant) {
  const el = document.getElementById("pay-overlay");
  if (!el) return;
  if (instant) return el.remove();
  el.classList.remove("in");
  setTimeout(() => el.remove(), 250);
}

// ─── Step 3: you're in ────────────────────────────────────────────────────
// Shared by card payments (finalizeStripePayment) and free registrations.
function showConfirmedAfterPurchase() {
  const fromPay = !!document.querySelector("#pay-overlay .tg");
  bookingDraft.justPurchased = true;
  bookingDraft.receiptState = "sending";
  navStack = [];
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0 });
  const tickets = bookingDraft.confirmedTickets || [];
  const ev = tickets[0] && EVENTS.find((e) => e.id === tickets[0].eventId);
  // The counter moves the moment you buy, then the server's number confirms.
  if (ev) {
    state.ticketCounts = state.ticketCounts || {};
    state.ticketCounts[String(ev.id)] = (state.ticketCounts[String(ev.id)] || 0) + tickets.length;
    loadTicketCounts(ev.id);
  }
  playPurchaseCelebration(ev, tickets.length, !tickets.reduce((s, t) => s + (t.total || 0), 0), fromPay);
  hidePayOverlay(true);
  // Receipt + ticket email, once (server-side idempotent).
  const bookingId = tickets[0] && tickets[0].bookingId;
  sendReceipt(bookingId, true).then((res) => _setReceiptState(res && res.ok ? "sent" : "failed", res && res.to));
}

function playPurchaseCelebration(ev, n, free, fromPay) {
  if (!ev) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = `yi-overlay${reduce ? " still" : ""}${fromPay ? " cont" : ""}`;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "assertive");
  el.setAttribute("aria-label", `You're in. ${n > 1 ? `${n} tickets` : "Your ticket"} for ${ev.title}.`);
  // The stub releases with a single clean shockwave and a light sweep
  // across the ticket — fluid, quiet, no confetti.
  const burst = reduce ? "" : `<i class="yi-ring"></i><i class="yi-ring r2"></i>`;
  const title = "You're in!"
    .split("")
    .map((ch, i) => `<span style="--i:${i}">${ch === " " ? "&nbsp;" : escapeHtml(ch)}</span>`)
    .join("");
  el.innerHTML = `<div class="yi-stage">
      <div class="yi-glyph">${_ticketGlyph("scan")}</div>
      <div class="yi-burst" aria-hidden="true">${burst}</div>
    </div>
    <div class="yi-title" aria-hidden="true">${title}</div>
    <div class="yi-sub">${n > 1 ? `${n} tickets` : "Your ticket"} for ${escapeHtml(ev.title)}</div>`;
  const close = () => {
    if (el.classList.contains("out")) return;
    el.classList.add("out");
    setTimeout(() => el.remove(), 520);
  };
  el.addEventListener("click", close);
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add("in");
    const tg = el.querySelector(".tg");
    // Let the scan run a beat (continuity with the pay overlay), then win.
    setTimeout(
      () => {
        tg.classList.remove("scan");
        tg.classList.add("win");
        el.classList.add("won");
        _buzz([14, 70, 26]);
      },
      reduce ? 0 : fromPay ? 220 : 380,
    );
  });
  setTimeout(close, reduce ? 1300 : 2700);
}

// ─── Your ticket (confirmation + wallet view) ─────────────────────────────
function renderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length) return '<div class="empty-state">No tickets found.</div>';
  const t0 = tickets[0];
  const ev = EVENTS.find((e) => e.id === t0.eventId);
  if (!ev) return "";
  const just = !!bookingDraft.justPurchased;
  const totalPaid = tickets.reduce((s, t) => s + (t.total || 0), 0);
  const sub = tickets.reduce((s, t) => s + (t.pricePerTicket || 0), 0);
  const fees = Math.max(0, totalPaid - sub);
  const st = eventStatus(ev);
  const safeTitle = escapeHtml(ev.title).replace(/'/g, "&#39;");
  const unclaimedCount = tickets.filter((t) => t.claimCode).length;
  const paidAt = new Date(t0.purchasedAt);
  const fmtPaid = isNaN(paidAt)
    ? ""
    : paidAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const byType = {};
  tickets.forEach((t) => {
    const k = t.typeLabel || "General";
    byType[k] = byType[k] || { n: 0, each: t.pricePerTicket || 0 };
    byType[k].n++;
  });

  // One master QR for a group purchase ("valid for N entries"), scanned once
  // per person via check_in_squad_ticket(); individual tickets still work.
  const master =
    tickets.length > 1 && t0.squadId
      ? `<article class="tv-ticket tv-master">
        <div class="tv-stub">
          <div class="tv-kick">${_bkIc('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.7-3.4 3.2-5 6-5s5.3 1.6 6 5M15 15.2c2.6 0 4.6 1.4 5.2 4.8"/>', 14)} Group pass · valid for ${tickets.length} entries</div>
          <div class="tv-qr" id="squad-master-qr"></div>
          <div class="tv-hint">One code for everyone — scanned once per person as you arrive.</div>
        </div>
      </article>`
      : "";

  const cards = tickets
    .map(
      (t, i) => `<article class="tv-ticket" style="--i:${i}">
      <div class="tv-art ${posterClass(ev)}" style="${posterStyle(ev)}">
        ${posterGlyph(ev)}
        <div class="tv-art-top">
          <span class="fp-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</span>
          ${tickets.length > 1 ? `<span class="tv-seat">${t.seatNum || i + 1} of ${t.totalSeats || tickets.length}</span>` : ""}
        </div>
        <div class="tv-art-foot">
          <div class="tv-title">${escapeHtml(ev.title)}</div>
          <div class="tv-venue">${escapeHtml([ev.venue, ev.area].filter(Boolean).join(" · "))}</div>
        </div>
      </div>
      <div class="tv-perf" aria-hidden="true"></div>
      <div class="tv-stub">
        <div class="tv-qr" id="ticket-qr-${i}"></div>
        <div class="tv-code mono">${escapeHtml(t.ticketId)}</div>
        <div class="tv-meta"><span>${escapeHtml(t.typeLabel || "General")}</span><span>Admit one</span>${t.claimCode ? `<span class="tv-open">Seat open to share</span>` : ""}${t.claimedBy ? `<span class="tv-gift">From ${escapeHtml((t.purchaserName || "a friend").split(" ")[0])}</span>` : ""}</div>
        <div class="tv-hint">Show this at the door — turn your screen brightness up.</div>
      </div>
    </article>`,
    )
    .join("");

  const act = (onclick, icon, label) =>
    `<button type="button" class="tv-act" onclick="${onclick}">${_bkIc(icon, 18)}<span>${label}</span></button>`;
  const actions = `<div class="tv-acts">
    ${act(`openCalendarSheet('${ev.id}')`, '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', "Calendar")}
    ${act(`openLocationSheet('${ev.id}')`, '<path d="M3 11 21 3l-8 18-2-8-8-2Z"/>', "Directions")}
    ${
      unclaimedCount > 0 && t0.squadId
        ? act(`shareSquadGroupLink('${t0.squadId}','${safeTitle}',${unclaimedCount})`, '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>', `Share ${unclaimedCount} seat${unclaimedCount > 1 ? "s" : ""}`)
        : act(`openEvent('${ev.id}')`, '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>', "Event info")
    }
    ${st !== "past" && myTickets.some((x) => x.ticketId === t0.ticketId) ? act(`openCantGoSheet('${escapeHtml(t0.ticketId)}')`, BK_RETURN, "Can't go?") : ""}
  </div>`;

  const rState = bookingDraft.receiptState || (tickets.some((t) => t.receiptSentAt) ? "sent" : "");
  // A ticket a friend sent you: no money changed hands with you, so the
  // "receipt" is a transfer record — and it says where refunds go.
  const received = tickets.every((t) => t.claimedBy);
  const buyerFirst = escapeHtml((t0.purchaserName || "your friend").split(" ")[0]);
  const fmtClaimed = t0.claimedAt
    ? new Date(t0.claimedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
  const receipt = received
    ? `<details class="tv-receipt" id="tv-receipt">
    <summary>
      <span class="tv-r-ic">${_bkIc('<path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/>', 18)}</span>
      <span class="tv-r-txt"><b>Sent by ${buyerFirst}</b><span>Order ${escapeHtml(t0.bookingId || t0.ticketId)}</span></span>
      <span class="tv-r-amt tv-gift-amt">Transferred</span>
      <span class="tv-r-chev" aria-hidden="true">${_bkIc('<path d="M6 9l6 6 6-6"/>', 16)}</span>
    </summary>
    <div class="tv-r-body">
      <div class="bk-line"><span>Bought by</span><span>${escapeHtml(t0.purchaserName || "A friend")}</span></div>
      ${fmtClaimed ? `<div class="bk-line"><span>Claimed by you</span><span>${fmtClaimed}</span></div>` : ""}
      <div class="bk-line"><span>Ticket</span><span>${escapeHtml(t0.typeLabel || "General")} × ${tickets.length}</span></div>
      <div class="tf-note">Refunds for this ticket — if the event is cancelled or it's returned — go to ${buyerFirst}'s original card, not yours. <a href="terms.html#transfers" target="_blank">Transfer policy</a></div>
    </div>
  </details>`
    : `<details class="tv-receipt" id="tv-receipt">
    <summary>
      <span class="tv-r-ic">${_bkIc('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>', 18)}</span>
      <span class="tv-r-txt"><b>Receipt</b><span>Order ${escapeHtml(t0.bookingId || t0.ticketId)}</span></span>
      <span class="tv-r-amt">${totalPaid ? `£${totalPaid.toFixed(2)}` : "Free"}</span>
      <span class="tv-r-chev" aria-hidden="true">${_bkIc('<path d="M6 9l6 6 6-6"/>', 16)}</span>
    </summary>
    <div class="tv-r-body">
      <div class="bk-line"><span>Order number</span><span class="mono">${escapeHtml(t0.bookingId || t0.ticketId)}</span></div>
      ${fmtPaid ? `<div class="bk-line"><span>${totalPaid ? "Paid" : "Booked"}</span><span>${fmtPaid}</span></div>` : ""}
      <div class="bk-line"><span>Name</span><span>${escapeHtml(t0.purchaserName || state.profileName || "")}</span></div>
      <div class="tv-r-sep"></div>
      ${Object.entries(byType)
        .map(([k, v]) => `<div class="bk-line"><span>${escapeHtml(k)} × ${v.n}</span><span>${v.each ? `£${(v.each * v.n).toFixed(2)}` : "Free"}</span></div>`)
        .join("")}
      ${totalPaid ? `<div class="bk-line"><span>Booking fee</span><span>£${fees.toFixed(2)}</span></div>` : ""}
      <div class="bk-line total"><span>Total ${totalPaid ? "paid" : ""}</span><span>${totalPaid ? `£${totalPaid.toFixed(2)}` : "Free"}</span></div>
      ${totalPaid ? `<div class="bk-line"><span>Payment</span><span>Card · Stripe ${_bkIc(BK_LOCK, 12)}</span></div>` : ""}
      ${totalPaid ? `<div class="tv-r-small">Sending a ticket to a friend? Any refund still comes back to this card.</div>` : ""}
      <div class="tv-r-foot">
        <span id="tv-receipt-status" class="tv-r-status">${_receiptStatusText(rState, bookingDraft.receiptTo)}</span>
        <button type="button" class="v-btn ghost sm" onclick="emailMyTicket('${escapeHtml(t0.ticketId)}')">Email me this receipt</button>
      </div>
    </div>
  </details>`;

  return `<div class="tv-page${just ? " just" : ""}">
    <div class="bk-top">
      ${
        just
          ? `<button class="bk-done" onclick="navStack=[];goFeed()">Done</button>`
          : `<button class="bk-back" onclick="goBack()" aria-label="Back">${_bkIc('<path d="M15 5l-7 7 7 7"/>', 20)}</button>`
      }
      ${just ? _bkSteps(3) : `<span class="tv-top-lbl">Your ticket${tickets.length > 1 ? "s" : ""}</span>`}
    </div>
    <header class="tv-head">
      <div class="v-kicker">${just ? (totalPaid ? "Payment confirmed" : "Booking confirmed") : st === "past" ? "Past event" : "Ready at the door"}</div>
      <h1 class="tv-h1">${just ? "You're in." : escapeHtml(ev.title)}</h1>
      <p class="v-sub">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ${received ? `sent to you by ${buyerFirst}` : totalPaid ? `£${totalPaid.toFixed(2)} paid` : "Free"}${just ? " · receipt on its way to your email" : ""}</p>
    </header>
    ${master}
    <div class="tv-stack">${cards}</div>
    ${actions}
    ${receipt}
    <p class="tv-policy">Free cancellation up to 24 hours before · <a href="terms.html" target="_blank">See full policy</a></p>
  </div>`;
}

function _receiptStatusText(s, to) {
  if (s === "sending") return "Sending your receipt…";
  if (s === "sent") return `${_bkIc(BK_CHECK, 13)} Emailed${to ? ` to ${escapeHtml(to)}` : " to you"}`;
  if (s === "failed") return "Couldn't email it yet — try the button";
  return "Keep a copy in your inbox";
}
function _setReceiptState(s, to) {
  bookingDraft.receiptState = s;
  if (to) bookingDraft.receiptTo = to;
  const el = document.getElementById("tv-receipt-status");
  if (el) el.innerHTML = _receiptStatusText(s, bookingDraft.receiptTo);
}

// "Email me this receipt" — the server builds and addresses it (your own
// account email only); see supabase/functions/send-receipt.
async function emailMyTicket(ticketId) {
  const t =
    (bookingDraft.confirmedTickets || []).find((x) => x.ticketId === ticketId) || myTickets.find((x) => x.ticketId === ticketId);
  if (!t) return showToast("Ticket not found", "error");
  _setReceiptState("sending");
  const res = await sendReceipt(t.bookingId || t.ticketId, false);
  if (res && res.ok) {
    _setReceiptState("sent", res.to);
    showToast("Receipt emailed", "success");
  } else {
    _setReceiptState("failed");
    showToast(res?.error && res.error !== "unavailable" ? res.error : "Couldn't send the email — try again", "error");
  }
}
