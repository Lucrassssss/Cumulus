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
function renderBook() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return '<div class="empty-state">Event not found.</div>';
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const isFree = !eventPrice(ev);
  const qty = bookingDraft.qty;
  const each = sel.price + (sel.platformFee || 0);
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const finalTotal = baseTotal + feeTotal;
  const typeCards = types
    .map(
      (t) => `
    <div class="tt-card${bookingDraft.type === t.id ? " on" : ""}" onclick="setBookingType('${t.id}')" role="radio" tabindex="0" aria-checked="${bookingDraft.type === t.id ? "true" : "false"}" aria-label="${escapeHtml(t.label)}, ${t.price ? `£${(t.price + (t.platformFee || 0)).toFixed(2)} including booking fee` : "Free"}">
      <span class="tt-radio" aria-hidden="true"></span>
      <div class="tt-body"><div class="tt-name">${escapeHtml(t.label)}</div>${t.desc ? `<div class="tt-desc">${escapeHtml(t.desc)}</div>` : ""}</div>
      <div class="tt-price">${t.price ? `£${(t.price + (t.platformFee || 0)).toFixed(2)}<span class="tt-incl">£${t.price.toFixed(2)} + £${(t.platformFee || 0).toFixed(2)} fee</span>` : "Free"}</div>
    </div>`,
    )
    .join("");
  const cta = isFree
    ? `<button class="v-btn bk-cta-btn" onclick="registerFree('${ev.id}')">${_bkIc(BK_CHECK)}Get ${qty > 1 ? `${qty} free tickets` : "free ticket"}</button>`
    : `<button class="v-btn bk-cta-btn" onclick="proceedToCheckout()">Continue · £${finalTotal.toFixed(2)}</button>`;

  return `<div class="bk-page">
    <div class="bk-top"><button class="bk-back" onclick="goBack()" aria-label="Back">${_bkIc('<path d="M15 5l-7 7 7 7"/>', 20)}</button>${_bkSteps(1)}</div>
    ${_bkEventHead(ev)}

    <section class="bk-sec">
      <h2 class="bk-h">Choose your ticket</h2>
      <div class="bk-types" role="radiogroup" aria-label="Ticket type">${typeCards}</div>
    </section>

    <section class="bk-sec bk-qty-row">
      <div><h2 class="bk-h">How many?</h2><span class="bk-sub">${qty > 1 ? "You'll get one link to share seats with your group" : "Up to 10 per order"}</span></div>
      <div class="bk-stepper" role="group" aria-label="Number of tickets">
        <button onclick="setBookingQty(${qty - 1})" aria-label="One fewer" ${qty <= 1 ? "disabled" : ""}>−</button>
        <output aria-live="polite">${qty}</output>
        <button onclick="setBookingQty(${qty + 1})" aria-label="One more" ${qty >= 10 ? "disabled" : ""}>+</button>
      </div>
    </section>

    <section class="bk-sec bk-summary" aria-label="Order summary">
      <div class="bk-line"><span>${escapeHtml(sel.label)} × ${qty}</span><span>${sel.price ? `£${baseTotal.toFixed(2)}` : "Free"}</span></div>
      ${!isFree ? `<div class="bk-line"><span>Booking fee <em>(the host keeps 100% of their price)</em></span><span>£${feeTotal.toFixed(2)}</span></div>` : ""}
      <div class="bk-line total"><span>Total</span><span>${finalTotal ? `£${finalTotal.toFixed(2)}` : "Free"}</span></div>
      ${!isFree && qty > 1 ? `<div class="bk-each">£${each.toFixed(2)} each, everything included</div>` : ""}
    </section>

    ${
      !isFree
        ? `<details class="bk-promo"${bookingDraft.promoCode ? " open" : ""}>
      <summary>Have a promo code?</summary>
      <input id="book-promo-code" class="gate-input" placeholder="e.g. EARLYBIRD10" autocapitalize="characters" value="${escapeHtml(bookingDraft.promoCode || "")}" oninput="bookingDraft.promoCode=this.value.trim()"/>
      <p>Checked live on the next screen — your real total shows before you pay.</p>
    </details>`
        : ""
    }

    <label class="bk-optin">
      <input type="checkbox" id="book-marketing-optin" ${bookingDraft.marketingOptIn ? "checked" : ""} onchange="bookingDraft.marketingOptIn=this.checked"/>
      <span>Let ${escapeHtml(ev.host || "the host")} email me about their future events <em>(optional)</em></span>
    </label>

    <ul class="bk-trust">
      <li>${_bkIc(BK_CHECK)}<span><b>The price is the price</b> — no fees added later</span></li>
      ${!isFree ? `<li>${_bkIc(BK_LOCK)}<span><b>Secure payment</b> by Stripe — we never see your card</span></li>` : ""}
      <li>${_bkIc(BK_RETURN)}<span><b>Can't make it?</b> Free cancellation up to 24h before · <a href="terms.html" target="_blank">policy</a></span></li>
    </ul>

    <div class="bk-cta">
      <div class="bk-cta-total"><span>${qty} ticket${qty !== 1 ? "s" : ""}</span><b>${finalTotal ? `£${finalTotal.toFixed(2)}` : "Free"}</b></div>
      ${cta}
    </div>
  </div>`;
}

// ─── Step 2: pay ──────────────────────────────────────────────────────────
// Real Stripe payment via a PaymentIntent + Payment Element (create-
// checkout-session computes the authoritative price server-side; the
// numbers here are display only). Elements (not Checkout) so the form can
// be themed — see stripeAppearanceForCurrentTheme(). The element starts
// loading the moment this screen mounts (afterRenderCheckout()).
function renderCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return "";
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const qty = bookingDraft.qty;
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const total = (baseTotal + feeTotal).toFixed(2);

  return `<div class="bk-page bk-pay">
    <div class="bk-top"><button class="bk-back" onclick="goBack()" aria-label="Back">${_bkIc('<path d="M15 5l-7 7 7 7"/>', 20)}</button>${_bkSteps(2)}</div>
    <div class="checkout-layout">
      <div class="checkout-summary-col">
        ${_bkEventHead(ev)}
        <section class="bk-sec bk-summary" id="checkout-summary" aria-label="Order summary">
          <div class="bk-line"><span>${escapeHtml(sel.label)} × ${qty}</span><span>£${baseTotal.toFixed(2)}</span></div>
          <div class="bk-line"><span>Booking fee</span><span>£${feeTotal.toFixed(2)}</span></div>
          <div class="bk-line total"><span>Total</span><span>£${total}</span></div>
          ${bookingDraft.promoCode ? `<div class="bk-each">Promo "${escapeHtml(bookingDraft.promoCode)}" is checked now — the pay button shows your real total.</div>` : ""}
        </section>
        <div class="bk-secure">${_bkIc(BK_LOCK, 15)}<span><b>Encrypted &amp; processed by Stripe.</b> Cumulus never sees or stores your card.</span></div>
      </div>
      <div class="checkout-main-col">
        <h2 class="bk-h">Pay securely</h2>
        <div class="bk-sec checkout-payment-panel">
          <div id="checkout-status" class="checkout-status" role="status" aria-busy="true" aria-live="polite">
            <span class="sr-only">Loading payment form…</span>
            <div class="checkout-skeleton" aria-hidden="true">
              <div class="checkout-skeleton-row" style="width:55%;"></div>
              <div class="checkout-skeleton-row" style="height:46px;"></div>
              <div class="checkout-skeleton-row" style="height:46px;"></div>
              <div class="checkout-skeleton-row" style="width:35%;"></div>
            </div>
          </div>
          <div id="payment-element"></div>
        </div>
        <p class="checkout-footer-note">By paying you agree to the <a href="terms.html" target="_blank">Terms</a> · <a href="privacy.html" target="_blank">Privacy</a></p>
        <div class="checkout-cta-bar bk-cta" id="checkout-cta-bar">
          <div class="bk-cta-total"><span>Total</span><b>£${total}</b></div>
          <button id="pay-btn" class="v-btn bk-cta-btn checkout-pay-btn" data-label="${_bkIc(BK_LOCK).replace(/"/g, "&quot;")}Pay £${total}" onclick="submitStripePayment()">${_bkIc(BK_LOCK)}Pay £${total}</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Fired from renderView() right after the checkout screen mounts.
function afterRenderCheckout() {
  startStripeCheckout();
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
    el.innerHTML = `<div class="po-card"><span class="po-ring" aria-hidden="true"></span><b class="po-msg"></b><span class="po-sub">${_bkIc(BK_LOCK, 13)} Secure payment · don't close this page</span></div>`;
  }
  el.querySelector(".po-msg").textContent = msg || "Processing…";
}
// Turns the processing overlay into a clear outcome card, on this screen:
// kind = "failed" | "pending". Big, readable, and announced to screen
// readers — the opposite of a toast at the bottom.
function showPayResult(kind, o) {
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
function hidePayOverlay() {
  const el = document.getElementById("pay-overlay");
  if (!el) return;
  el.classList.remove("in");
  setTimeout(() => el.remove(), 250);
}

// ─── Step 3: you're in ────────────────────────────────────────────────────
// Shared by card payments (finalizeStripePayment) and free registrations.
function showConfirmedAfterPurchase() {
  hidePayOverlay();
  bookingDraft.justPurchased = true;
  bookingDraft.receiptState = "sending";
  navStack = [];
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0 });
  const tickets = bookingDraft.confirmedTickets || [];
  const ev = tickets[0] && EVENTS.find((e) => e.id === tickets[0].eventId);
  playPurchaseCelebration(ev, tickets.length, !tickets.reduce((s, t) => s + (t.total || 0), 0));
  // Receipt + ticket email, once (server-side idempotent).
  const bookingId = tickets[0] && tickets[0].bookingId;
  sendReceipt(bookingId, true).then((res) => _setReceiptState(res && res.ok ? "sent" : "failed", res && res.to));
}

function playPurchaseCelebration(ev, n, free) {
  if (!ev) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = "yi-overlay";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "assertive");
  const bits = reduce
    ? ""
    : Array.from({ length: 28 }, (_, i) => {
        const x = Math.round(Math.random() * 100);
        const d = (Math.random() * 0.5).toFixed(2);
        const r = Math.round(Math.random() * 360);
        const c = ["var(--volt)", "var(--hot)", "#7c5cff", "#ffffff"][i % 4];
        return `<i style="left:${x}%;--d:${d}s;--r:${r}deg;background:${c}"></i>`;
      }).join("");
  el.innerHTML = `<div class="yi-confetti" aria-hidden="true">${bits}</div>
    <div class="yi-card">
      <svg class="yi-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="m15 27 7 7 15-16"/></svg>
      <div class="yi-title">You're in!</div>
      <div class="yi-sub">${n > 1 ? `${n} tickets` : "Your ticket"} for ${escapeHtml(ev.title)}${free ? "" : " · paid"}</div>
    </div>`;
  const close = () => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 350);
  };
  el.addEventListener("click", close);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(close, reduce ? 1200 : 2100);
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
        <div class="tv-meta"><span>${escapeHtml(t.typeLabel || "General")}</span><span>Admit one</span>${t.claimCode ? `<span class="tv-open">Seat open to share</span>` : ""}</div>
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
  const receipt = `<details class="tv-receipt" id="tv-receipt">
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
      <div class="tv-r-foot">
        <span id="tv-receipt-status" class="tv-r-status">${_receiptStatusText(rState, bookingDraft.receiptTo)}</span>
        <button type="button" class="v-btn ghost sm" onclick="emailMyTicket('${escapeHtml(t0.ticketId)}')">Email me this receipt</button>
      </div>
    </div>
  </details>`;

  return `<div class="tv-page${just ? " just" : ""}">
    <div class="bk-top">
      <button class="bk-back" onclick="${just ? "navStack=[];goFeed()" : "goBack()"}" aria-label="${just ? "Done" : "Back"}">${_bkIc(just ? BK_CHECK : '<path d="M15 5l-7 7 7 7"/>', 20)}</button>
      ${just ? _bkSteps(3) : `<span class="tv-top-lbl">Your ticket${tickets.length > 1 ? "s" : ""}</span>`}
    </div>
    <header class="tv-head">
      <div class="v-kicker">${just ? (totalPaid ? "Payment confirmed" : "Booking confirmed") : st === "past" ? "Past event" : "Ready at the door"}</div>
      <h1 class="tv-h1">${just ? "You're in." : escapeHtml(ev.title)}</h1>
      <p class="v-sub">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ${totalPaid ? `£${totalPaid.toFixed(2)} paid` : "Free"}${just ? " · receipt on its way to your email" : ""}</p>
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
