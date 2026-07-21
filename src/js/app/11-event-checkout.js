// ─── Render: Ticket selection ────────────────────────────────────────────
function renderBook() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return '<div class="empty-state">Event not found.</div>';
  const c = CATS[ev.category];
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const isFree = !eventPrice(ev);
  const qty = bookingDraft.qty;
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const finalTotal = baseTotal + feeTotal;
  const typeCards = types
    .map(
      (t) => `
    <div onclick="setBookingType('${t.id}')" style="border:2px solid ${bookingDraft.type === t.id ? c.color : "var(--line)"};border-radius:14px;padding:14px 16px;cursor:pointer;background:${bookingDraft.type === t.id ? hexToRgba(c.color, 0.07) : "var(--surface-2)"};transition:all .15s;margin-bottom:10px;" role="radio" tabindex="0" aria-checked="${bookingDraft.type === t.id ? "true" : "false"}" aria-label="${escapeHtml(t.label)}, ${t.price ? `£${t.price.toFixed(2)}` : "Free"}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div><div style="font-weight:700;font-size:14px;color:var(--text);">${t.label}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${t.desc}</div></div>
        <div style="font-size:18px;font-weight:800;color:${bookingDraft.type === t.id ? c.color : "var(--text)"};">${t.price ? `£${t.price.toFixed(2)}` : "Free"}</div>
      </div>
    </div>`,
    )
    .join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><span class="event-badge" style="--cat:;">${ev.category}</span><h2>${escapeHtml(ev.title)}</h2><p>${ev.date} · ${escapeHtml(ev.venue)}</p></div>
    <div class="section-title">Choose your ticket</div>
    ${typeCards}
    ${
      !isFree
        ? `
    <div class="section-title">Quantity</div>
    <div class="panel" style="--corner:var(--accent);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty - 1})">−</button>
      <div style="text-align:center;"><div style="font-size:30px;font-weight:800;color:var(--text);">${qty}</div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">ticket${qty !== 1 ? "s" : ""}</div></div>
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty + 1})">+</button>
    </div>`
        : ""
    }
    <div class="panel" style="--corner:${c.color};padding:16px 20px;background:${hexToRgba(c.color, 0.05)};margin-bottom:18px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:2px;">Order summary</div>
      <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">The price you see here is exactly what you'll pay — no surprise fees at checkout.</div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:6px;"><span>${sel.label}${!isFree ? ` × ${qty}` : ""}</span><span>${sel.price ? `£${baseTotal.toFixed(2)}` : "Free"}</span></div>
      ${
        !isFree
          ? `
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:4px;"><span>Cumulus platform fee</span><span>£${feeTotal.toFixed(2)}</span></div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-style:italic;">The host keeps 100% of their ticket price.</div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--text);padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span style="color:${c.color};">${finalTotal ? `£${finalTotal.toFixed(2)}` : "Free"}</span></div>
    </div>
    <label style="display:flex;align-items:flex-start;gap:9px;margin-bottom:16px;font-size:12px;color:var(--text-muted);line-height:1.5;cursor:pointer;">
      <input type="checkbox" id="book-marketing-optin" style="margin-top:2px;width:15px;height:15px;flex-shrink:0;accent-color:${c.color};"/>
      <span>Allow ${escapeHtml(ev.host || "the host")} to email me about future local events. Off by default — opting in is entirely your choice.</span>
    </label>
    <button class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;" onclick="${isFree ? `registerFree('${ev.id}')` : `proceedToCheckout()`}">${isFree ? "Register Free →" : `Continue to Payment · £${finalTotal.toFixed(2)} →`}</button>
    <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:10px;">Free cancellation up to 24 hours before the event (Cumulus's standard policy, unless the host states otherwise) · <a href="terms.html" target="_blank" style="color:var(--gold-text);">See full policy</a></p>`;
}

// ─── Render: Mock payment ────────────────────────────────────────────────
// Real Stripe Checkout redirect (create-checkout-session computes the
// authoritative price server-side from the events table — the numbers
// rendered here are for display only, never sent as the charge amount).
function renderCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return "";
  const c = CATS[ev.category];
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const total = (
    (sel.price + (sel.platformFee || 0)) *
    bookingDraft.qty
  ).toFixed(2);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Payment</h2><p>${escapeHtml(ev.title)} · ${sel.label} × ${bookingDraft.qty}</p></div>
    <div class="panel intro-form" style="--corner:${c.color};">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-soft);margin-bottom:6px;"><span>${sel.label} × ${bookingDraft.qty}</span><span>£${(sel.price * bookingDraft.qty).toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-soft);margin-bottom:10px;"><span>Booking fee</span><span>£${((sel.platformFee || 0) * bookingDraft.qty).toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--text);padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span>£${total}</span></div>
    </div>
    <button id="pay-btn" class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;margin-top:14px;" onclick="startStripeCheckout()">Pay with card — £${total} →</button>
    <div id="stripe-checkout-embedded" style="margin-top: 20px;"></div>`;
}

// ─── Render: Ticket confirmation ─────────────────────────────────────────
function renderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length)
    return '<div class="empty-state">No tickets found.</div>';
  const t0 = tickets[0];
  const ev = EVENTS.find((e) => e.id === t0.eventId);
  if (!ev) return "";
  const c = CATS[ev.category];
  const purchased = new Date(t0.purchasedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const totalPaid = tickets.reduce((s, t) => s + (t.total || 0), 0);
  const ticketCards = tickets
    .map(
      (t, i) => `
    <div class="panel" style="--corner:${c.color};overflow:visible;margin-bottom:${i < tickets.length - 1 ? "20" : "0"}px;border-radius:20px;">
      <div style="position:relative;padding:18px 18px 20px;border-bottom:2px dashed var(--line);">
        <div style="position:absolute;left:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        <div style="position:absolute;right:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        ${tickets.length > 1 ? `<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.color};margin-bottom:6px;">Ticket ${t.seatNum} of ${t.totalSeats}</div>` : ""}
        <span class="event-badge" style="--cat:;margin-bottom:6px;">${ev.category}</span>
        <div style="font-size:17px;font-weight:800;margin:6px 0 4px;line-height:1.2;color:var(--text);">${escapeHtml(ev.title)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:1px;">${ev.date} · ${ev.time}</div>
        <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
        <div style="margin-top:12px;display:flex;gap:8px;font-size:12px;">
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Type</div><div style="font-weight:700;color:var(--text);margin-top:1px;">${t.typeLabel}</div></div>
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Paid</div><div style="font-weight:700;color:${c.color};margin-top:1px;">${t.total ? `£${t.total.toFixed(2)}` : "Free"}</div></div>
        </div>
      </div>
      <div style="padding:18px;text-align:center;">
        <div id="ticket-qr-${i}" style="width:134px;height:134px;margin:0 auto 10px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:7px;"></div>
        <div style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:var(--text);letter-spacing:1.5px;">${t.ticketId}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Show at the door · Purchased ${purchased}</div>
      </div>
    </div>`,
    )
    .join("");
  // Codex "Group Logic": one master QR for the whole squad purchase,
  // "Valid for N Entries" — instead of juggling N separate ticket images at
  // the door. Encodes SQUAD:<squad_id>; check_in_squad_ticket() (scanned via
  // checkInSquadScan()) checks in the next still-active seat per scan, so
  // it's still one tap per person arriving, just from a single QR. The
  // individual ticket cards below still work too — this is additive, not a
  // replacement, for groups that split up before doors.
  const masterQrSection =
    tickets.length > 1 && t0.squadId
      ? `<div class="panel" style="--corner:${c.color};overflow:visible;margin-bottom:20px;border-radius:20px;padding:20px;text-align:center;">
        <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.color};margin-bottom:10px;">✦ Valid for ${tickets.length} entries</div>
        <div id="squad-master-qr" style="width:150px;height:150px;margin:0 auto 10px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px;"></div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.5;">One code for your whole group — show this at the door, scanned once per person as you arrive.</div>
      </div>`
      : "";

  // Squad ticketing — the blueprint's "Magic Link" model: ONE shareable
  // group link, not a code per ticket. Whoever opens it claims whichever
  // seat is still free (claim_group_ticket(), FOR UPDATE SKIP LOCKED),
  // including auto-provisioning their account via email OTP if they aren't
  // signed in yet — see checkSquadGroupClaim() at boot.
  const unclaimedCount = tickets.filter((t) => t.claimCode).length;
  const squadSection =
    unclaimedCount > 0 && t0.squadId
      ? `<div class="hp-panel" style="margin-top:20px;">
        <div class="hp-title">👥 Share with your squad</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You bought ${tickets.length} tickets — drop this ONE link in your group chat. Whoever opens it first claims a seat, no phone-number swapping needed.</div>
        <button class="btn btn-outline" style="width:100%;" onclick="shareSquadGroupLink('${t0.squadId}','${escapeHtml(ev.title).replace(/'/g, "&#39;")}',${unclaimedCount})">📱 Send to your squad on WhatsApp (${unclaimedCount} seat${unclaimedCount > 1 ? "s" : ""} open)</button>
      </div>`
      : "";

  // Wallet passes aren't real yet — no Apple/Google signing credentials
  // exist for this project — so they show as an honest "Coming soon"
  // rather than a fake button. Email backup is the one that actually works.
  const walletSection = `<div class="hp-panel" style="margin-top:20px;">
    <div class="hp-title">🎟️ Ticket backup</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Keep a copy of your own ticket (${t0.ticketId}) somewhere else too.</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn btn-outline" onclick="emailMyTicket('${t0.ticketId}')">Email my ticket</button>
      <button class="btn btn-outline" disabled style="opacity:0.5;cursor:not-allowed;" title="Coming soon">Add to Apple Wallet — Coming soon</button>
      <button class="btn btn-outline" disabled style="opacity:0.5;cursor:not-allowed;" title="Coming soon">Add to Google Wallet — Coming soon</button>
    </div>
  </div>`;

  return `<div style="text-align:center;padding:20px 0 16px;">
      <div style="width:58px;height:58px;border-radius:50%;background:#22C55E;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;box-shadow:0 4px 18px rgba(34,197,94,0.3);">${checkIconSvg(28)}</div>
      <div style="font-size:21px;font-weight:800;color:var(--text);">${totalPaid ? "Payment confirmed!" : "You're registered!"}</div>
      <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ${totalPaid ? `£${totalPaid.toFixed(2)} total` : "Free"}</div>
    </div>
    ${masterQrSection}
    ${ticketCards}
    ${squadSection}
    ${walletSection}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
      <button class="btn" style="background:${c.color};" onclick="downloadICS('${ev.id}')">+ Add to Calendar</button>
      <button class="btn btn-text" onclick="openTicketsTab()">View all my tickets →</button>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:14px;">Free cancellation up to 24 hours before the event · <a href="terms.html" target="_blank" style="color:var(--gold-text);">See full policy</a></p>`;
}

// Emails the signed-in user a backup of their own ticket (QR + details) via
// the email-ticket edge function — the real fallback while Apple/Google
// Wallet passes are still "Coming soon" (no signing credentials exist for
// this project). Renders a throwaway, off-screen QR with the same QRCode
// library already used elsewhere to get a clean data URL to attach.
async function emailMyTicket(ticketId) {
  const t =
    (bookingDraft.confirmedTickets || []).find(
      (x) => x.ticketId === ticketId,
    ) || myTickets.find((x) => x.ticketId === ticketId);
  if (!t) {
    showToast("Ticket not found", "error");
    return;
  }
  const ev = EVENTS.find((e) => e.id === t.eventId);
  if (!ev || !state.profileEmail) {
    showToast("No email on file for this account", "error");
    return;
  }
  showToast("Sending…", "info");

  const holder = document.createElement("div");
  holder.style.display = "none";
  document.body.appendChild(holder);
  let qrDataUrl = null;
  try {
    new QRCode(holder, {
      text: ticketId,
      width: 240,
      height: 240,
      colorDark: "#000",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.M,
    });
    // Read the <canvas> directly, not the library's <img> — the img's src
    // is set asynchronously after the canvas draws, so it's empty this
    // early; the canvas itself is drawn synchronously.
    const canvas = holder.querySelector("canvas");
    qrDataUrl = canvas ? canvas.toDataURL("image/png") : null;
  } catch (e) {}
  holder.remove();
  if (!qrDataUrl) {
    showToast("Could not generate a QR code", "error");
    return;
  }

  try {
    const { error } = await sb.functions.invoke("email-ticket", {
      body: {
        recipientEmail: state.profileEmail,
        ticketId,
        eventTitle: ev.title,
        eventDate: `${ev.date} · ${ev.time}`,
        venue: ev.venue,
        qrDataUrl,
      },
    });
    if (error) throw error;
    showToast("Ticket emailed!", "success");
  } catch (e) {
    showToast("Could not send the email — try again", "error");
  }
}

