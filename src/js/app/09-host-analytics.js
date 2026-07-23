// ── LIVE FINANCIAL DATA ──────────────────────────────────────────────
let ownerLiveData = null;
let _ownerLiveLoading = false;

async function loadOwnerLiveData() {
  if (_ownerLiveLoading) return;
  _ownerLiveLoading = true;
  const btn = document.getElementById("od-live-refresh");
  if (btn) {
    btn.textContent = "↻ Loading…";
    btn.disabled = true;
  }
  try {
    const [tkRes, evRes, usRes, rvRes] = await Promise.all([
      sb.from("tickets").select("price_per_ticket, total, purchased_at"),
      sb.from("events").select("id, price, start_time"),
      sb.from("users").select("id, created_at"),
      sb.from("rsvps").select("id, created_at"),
    ]);
    const tix = tkRes.data || [];
    const evs = evRes.data || [];
    const users = usRes.data || [];
    const rsvps = rvRes.data || [];

    const paid = tix.filter((t) => (t.price_per_ticket || 0) > 0);
    const free = tix.filter((t) => !((t.price_per_ticket || 0) > 0));
    const grossRev = tix.reduce((s, t) => s + (t.total || 0), 0);
    const feeRev = paid.reduce(
      (s, t) => s + getCumulusFee(t.price_per_ticket || 0),
      0,
    );
    const stripeCosts = paid.reduce((s, t) => {
      const fee = getCumulusFee(t.price_per_ticket || 0);
      return s + ((t.price_per_ticket || 0) + fee) * 0.015 + 0.2;
    }, 0);

    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mTix = tix.filter(
      (t) => t.purchased_at && new Date(t.purchased_at) >= mStart,
    );
    const mPaid = mTix.filter((t) => (t.price_per_ticket || 0) > 0);
    const mGross = mTix.reduce((s, t) => s + (t.total || 0), 0);
    const mFeeRev = mPaid.reduce(
      (s, t) => s + getCumulusFee(t.price_per_ticket || 0),
      0,
    );

    ownerLiveData = {
      totalTickets: tix.length,
      paidTickets: paid.length,
      freeTickets: free.length,
      grossRev,
      feeRev,
      stripeCosts,
      netFeeRev: feeRev - stripeCosts,
      totalEvents: evs.length,
      paidEvents: evs.filter((e) => (e.price || 0) > 0).length,
      totalUsers: users.length,
      totalRsvps: rsvps.length,
      mTickets: mTix.length,
      mGross,
      mFeeRev,
      updatedAt: new Date(),
    };
    _renderOwnerLivePanel();
  } catch (err) {
    const p = document.getElementById("od-live-panel");
    if (p)
      p.querySelector(".od-live-loading").textContent =
        "Could not load data — check console.";
  } finally {
    _ownerLiveLoading = false;
    const btn2 = document.getElementById("od-live-refresh");
    if (btn2) {
      btn2.textContent = "↻ Refresh";
      btn2.disabled = false;
    }
  }
}

function _renderOwnerLivePanel() {
  const panel = document.getElementById("od-live-panel");
  if (!panel || !ownerLiveData) return;
  const d = ownerLiveData;
  const fmt = (n) =>
    n >= 1000000
      ? (n / 1000000).toFixed(1) + "M"
      : n >= 1000
        ? (n / 1000).toFixed(1) + "k"
        : String(n);
  const fmtGbp = (n) => {
    const abs = Math.abs(n);
    const s =
      abs >= 1000 ? "£" + (abs / 1000).toFixed(1) + "k" : "£" + abs.toFixed(2);
    return n < 0 ? "-" + s : s;
  };
  const ts = d.updatedAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const pct = (a, b) => (b > 0 ? " (" + Math.round((a / b) * 100) + "%)" : "");

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Live Platform Data</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">Updated ${ts} · from Supabase</div>
      </div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>

    <div class="od-live-stat-grid">
      <div class="od-live-stat">
        <div class="od-live-stat-label">Tickets Sold</div>
        <div class="od-live-stat-value" style="color:var(--accent);">${fmt(d.totalTickets)}</div>
        <div class="od-live-stat-sub">${d.paidTickets} paid · ${d.freeTickets} free</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">Users</div>
        <div class="od-live-stat-value">${fmt(d.totalUsers)}</div>
        <div class="od-live-stat-sub">registered</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">RSVPs</div>
        <div class="od-live-stat-value">${fmt(d.totalRsvps)}</div>
        <div class="od-live-stat-sub">${d.totalEvents} events</div>
      </div>
    </div>

    <div style="background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:10px;">Revenue — All Time</div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Gross Ticket Revenue</div><div class="od-live-rev-sub">sum of buyer checkout totals</div></div>
        <div class="od-live-rev-val" style="color:var(--text);">${fmtGbp(d.grossRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Cumulus Fee Revenue</div><div class="od-live-rev-sub">${d.paidTickets} paid tickets × tiered fee</div></div>
        <div class="od-live-rev-val" style="color:#22C55E;">${fmtGbp(d.feeRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Stripe Processing Costs</div><div class="od-live-rev-sub">1.5% + 20p per transaction${pct(d.stripeCosts, d.feeRev)}</div></div>
        <div class="od-live-rev-val" style="color:#E24B4A;">-${fmtGbp(d.stripeCosts)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label" style="font-weight:700;color:var(--text);">Net Fee Revenue</div><div class="od-live-rev-sub">after processing costs</div></div>
        <div class="od-live-rev-val" style="color:${d.netFeeRev >= 0 ? "#22C55E" : "#E24B4A"};font-size:16px;">${fmtGbp(d.netFeeRev)}</div>
      </div>
    </div>

    ${
      d.mTickets > 0 || d.mGross > 0
        ? `
    <div class="od-live-month">
      <div class="od-live-month-label">This Month</div>
      <div class="od-live-month-stats">
        <div><div class="od-live-mstat-val">${d.mTickets}</div><div class="od-live-mstat-key">tickets</div></div>
        <div><div class="od-live-mstat-val" style="color:#22C55E;">${fmtGbp(d.mFeeRev)}</div><div class="od-live-mstat-key">fee revenue</div></div>
        <div><div class="od-live-mstat-val" style="color:var(--text-soft);">${fmtGbp(d.mGross)}</div><div class="od-live-mstat-key">gross</div></div>
      </div>
    </div>`
        : `
    <div style="text-align:center;padding:10px;font-size:12px;color:var(--text-muted);">No transactions this month yet</div>`
    }
  `;
}
// ─────────────────────────────────────────────────────────────────────

function renderOwnerDash() {
  const isOwner = state.profileEmail === "gondoxml@gmail.com";
  if (!isOwner)
    return `<div class="empty-state" style="padding:40px 20px;text-align:center;"><div style="margin-bottom:12px;color:var(--text-muted);">${lockIconSvg(32)}</div><div style="font-weight:700;margin-bottom:6px;">Restricted</div><div style="color:var(--text-muted);font-size:13px;">Owner access only.</div></div>`;

  const p = OD_PRESETS[_odCur];
  return `
  <button class="back-btn" onclick="goBack()">←</button>
  <div class="connect-header" style="padding-top:8px;">
    <h2>Finances</h2>
    <p>Live data · P&amp;L projections · Risk analysis</p>
  </div>

  <!-- Live Supabase data panel -->
  <div class="od-live-panel" id="od-live-panel">
    <div class="od-live-loading">
      <div style="font-size:13px;color:var(--text-muted);">Loading live data…</div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="margin-top:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>
  </div>

  <!-- P&L Projection Model -->
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px;padding:2px 0;">P&amp;L Projection Model</div>
  <div id="od-wrap">
    <div class="pb" id="od-presets">
      <button data-odp="Launch">Launch</button>
      <button data-odp="Traction" class="a">Traction</button>
      <button data-odp="Scaling">Scaling</button>
      <button data-odp="Dominance">Dominance</button>
      <button class="hype" data-odp="CityLeader">City Leader</button>
      <button class="hype" data-odp="London1">London #1</button>
      <button data-odp="Custom">Custom</button>
    </div>
    <div class="ctx" id="od-ctx"></div>

    <div class="status-bar">
      <div class="status-pill sp-blue" id="od-pill-tier">—</div>
      <div class="status-pill sp-green" id="od-pill-vat">Pre-VAT</div>
      <div class="status-pill sp-blue" id="od-pill-stripe">Stripe</div>
      <div class="status-pill sp-green" id="od-pill-net">—</div>
    </div>

    <div class="pitfall-alert info" id="od-alert-vat">ℹ VAT threshold crossed — 20% absorbed from platform fee. Checkout price unchanged. Net margin per ticket reduces.</div>
    <div class="pitfall-alert warn" id="od-alert-cb">⚠ Chargeback fees exceeding £500/mo — ensure in-app refund UX is prominent to deflect bank disputes.</div>
    <div class="pitfall-alert warn" id="od-alert-stripe">⚠ Stripe fees over 40% of fee revenue — consider raising average ticket price above £15 to unlock Tier 2.</div>
    <div class="pitfall-alert danger" id="od-alert-margin">⚠ Pre-tax margin negative — costs outpacing revenue. Review staffing timing.</div>
    <div class="pitfall-alert warn" id="od-alert-ratio">⚠ Free event load above 60% of total RSVPs — tighten vetted organiser criteria.</div>

    <!-- PAID EVENTS -->
    <div class="section-h open" id="od-sh-paid" onclick="od_tog('paid')" role="button" tabindex="0" aria-expanded="true" aria-controls="od-sb-paid">
      <span class="sh-t"><span class="od-dot" style="background:#5B9FD9"></span> Paid events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-paid">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b open" id="od-sb-paid">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Monthly paid events</span><span class="od-vb" id="od-lev">—</span></div><input type="range" id="od-sl-ev" min="1" max="10000" step="1" value="${p.ev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. tickets per event</span><span class="od-vb" id="od-ltx">—</span></div><input type="range" id="od-sl-tx" min="5" max="500" step="1" value="${p.tx}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. ticket price (host cut)</span><span class="od-vb" id="od-lpr">—</span></div><input type="range" id="od-sl-pr" min="1" max="200" step="1" value="${p.pr}"></div>
        <div class="tier-box">
          <div class="tb-row" id="od-tbr-t1"><span class="tb-label">£0–£15 <span class="tb-badge badge-t1">Tier 1</span></span><span class="tb-val" style="color:#5B9FD9">£1.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t2"><span class="tb-label">£16–£40 <span class="tb-badge badge-t2">Tier 2</span></span><span class="tb-val" style="color:#22C55E">£2.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t3"><span class="tb-label">£41–£71 <span class="tb-badge badge-t3">Tier 3</span></span><span class="tb-val" style="color:#E0B23C">£3.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t4"><span class="tb-label">£72+ <span class="tb-badge badge-t4">Tier 4</span></span><span class="tb-val" style="color:#AFA9EC">£4.50 fee</span></div>
          <div class="tb-div"></div>
          <div class="tb-row"><span class="tb-label">Host sets price</span><span class="tb-val" id="od-tb-host">—</span></div>
          <div class="tb-row"><span class="tb-label">Cumulus fee (Tier <span id="od-tb-tiern">—</span>)</span><span class="tb-val" style="color:#22C55E" id="od-tb-fee">—</span></div>
          <div class="tb-row"><span class="tb-label">Stripe on total (1.5%+20p)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-stripe">—</span></div>
          <div class="tb-row"><span class="tb-label">VAT from fee (if >£90k/yr)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-vat">—</span></div>
          <div class="tb-div"></div>
          <div class="tb-total"><span style="color:#C5C6CB">Attendee pays</span><span style="color:#F1F1EF" id="od-tb-checkout">—</span></div>
          <div class="tb-total" style="margin-top:4px"><span style="color:#C5C6CB">Cumulus nets/ticket</span><span id="od-tb-net" style="color:#22C55E">—</span></div>
        </div>
      </div>
    </div>

    <!-- FREE EVENTS -->
    <div class="section-h" id="od-sh-free" onclick="od_tog('free')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-free">
      <span class="sh-t"><span class="od-dot" style="background:#D4537E"></span> Free events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-free">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-free">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Small free events/mo (RSVP cap 10)</span><span class="od-vp" id="od-lfe-p">—</span></div><input type="range" id="od-sl-fe-p" min="0" max="5000" step="1" value="${p.fep}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs (max 10)</span><span class="od-vp" id="od-lfr-p">—</span></div><input type="range" id="od-sl-fr-p" min="2" max="10" step="1" value="${p.frp}"></div>
        <div style="height:1px;background:#2A2B32;margin:8px 0"></div>
        <div class="od-sr"><div class="od-st"><span>Vetted organiser free events/mo</span><span class="od-vp" id="od-lfe-v">—</span></div><input type="range" id="od-sl-fe-v" min="0" max="3000" step="1" value="${p.fev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs per vetted event</span><span class="od-vp" id="od-lfr-v">—</span></div><input type="range" id="od-sl-fr-v" min="5" max="200" step="1" value="${p.frv}"></div>
        <div style="margin-top:10px;padding:10px 12px;background:#1E1F24;border-radius:10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Total free RSVPs/mo</span><span style="font-family:'SF Mono',monospace;color:#D4537E" id="od-total-free">—</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Free vs total load</span><span style="font-family:'SF Mono',monospace" id="od-load-ratio">—</span></div>
          <div style="height:5px;background:#0F1117;border-radius:3px;overflow:hidden"><div id="od-load-bar" style="height:100%;border-radius:3px;background:#D4537E;width:0%"></div></div>
          <div style="font-size:10px;color:#5F5E5A;margin-top:5px">Private events capped at 10 RSVPs · vetted requires 3 successful paid events</div>
        </div>
      </div>
    </div>

    <!-- HOST VETTING -->
    <div class="section-h" id="od-sh-vet" onclick="od_tog('vet')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-vet">
      <span class="sh-t"><span class="od-dot" style="background:#E0B23C"></span> Host vetting tiers</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-vet">Active</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-vet">
      <div class="od-card">
        <div style="font-size:11px;color:#868C96;margin-bottom:8px;line-height:1.5">Vetting scales with financial risk. Graduated hosts (3+ paid events, zero disputes) bypass all gates.</div>
        <div class="vetting-grid">
          <div class="vet-card" id="od-vc1"><div class="vc-tier" style="color:#5B9FD9">Tier 1 · Under £20</div><div class="vc-rule">Instant publish. 48hr escrow hold is security buffer.</div></div>
          <div class="vet-card" id="od-vc2"><div class="vc-tier" style="color:#22C55E">Tier 2 · £20–£49</div><div class="vc-rule">Requires social graph verification or community website.</div></div>
          <div class="vet-card" id="od-vc3"><div class="vc-tier" style="color:#E0B23C">Tier 3 · £50+</div><div class="vc-rule">Queue pause. Host submits justification or venue docs. 4hr review target.</div></div>
          <div class="vet-card" id="od-vc4"><div class="vc-tier" style="color:#AFA9EC">Graduated</div><div class="vc-rule">3 successful paid events, zero dispute flags — all gates removed permanently.</div></div>
        </div>
      </div>
    </div>

    <!-- RISK INPUTS -->
    <div class="section-h" id="od-sh-risk" onclick="od_tog('risk')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-risk">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Risk inputs</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risk">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risk">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Chargeback rate (% paid tickets)</span><span class="od-vr" id="od-lcb">—</span></div><input type="range" id="od-sl-cb" min="0" max="2" step="0.1" value="${p.cb}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px;margin-bottom:10px">CNP industry avg 0.6–1.0% · in-app refund UX deflects to ~0.3–0.5% · £15 fee per dispute</div>
        <div class="od-sr"><div class="od-st"><span>Fee drop-off at checkout (%)</span><span class="od-vr" id="od-ldrop">—</span></div><input type="range" id="od-sl-drop" min="0" max="20" step="1" value="${p.drop}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px">Tickets lost due to visible fee — lower with DICE-style upfront pricing (3% realistic)</div>
      </div>
    </div>

    <!-- STAFFING -->
    <div class="section-h" id="od-sh-staff" onclick="od_tog('staff')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-staff">
      <span class="sh-t"><span class="od-dot" style="background:#7F77DD"></span> Staffing</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-staff">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-staff">
      <div class="od-card">
        <div id="od-staff-list"></div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total team staffing/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:14px;font-weight:600;color:#7F77DD" id="od-staff-total">£0</span>
        </div>
        <div style="height:1px;background:#2A2B32;margin:12px 0"></div>
        <div class="od-lbl"><span class="od-dot" style="background:#22C55E"></span> Founder draw (automatic)</div>
        <div class="founder-box">
          <div class="founder-row"><span>Below £10k profit</span><span style="font-family:'SF Mono',monospace;color:#C5C6CB">Take all of it</span></div>
          <div class="founder-row"><span>£10k – £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Draw £10k · rest reinvests</span></div>
          <div class="founder-row" style="margin-bottom:0"><span>Above £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Hard cap £20k · rest reinvests</span></div>
        </div>
      </div>
    </div>

    <!-- P&L -->
    <div style="margin-top:10px">
      <div class="od-card">
        <div class="od-stats3">
          <div class="od-sc"><div class="od-sl">Paid tickets</div><div class="od-sv bl" id="od-st-ptx">—</div></div>
          <div class="od-sc"><div class="od-sl">Platform fee</div><div class="od-sv gn" id="od-st-fee">—</div></div>
          <div class="od-sc"><div class="od-sl">Buyer pays</div><div class="od-sv" id="od-st-checkout" style="color:#F1F1EF">—</div></div>
        </div>

        <div class="od-stag">Revenue</div>
        <div class="plr"><div class="pll">Platform fees collected<small id="od-pf-note">—</small></div><div class="plv gn" id="od-pl-pf">—</div></div>
        <div class="plr"><div class="pll">UK VAT withheld (if applicable)<small id="od-vat-note">—</small></div><div class="plv rd" id="od-pl-vat">—</div></div>
        <div class="plr"><div class="pll s">Net fee revenue (ex-VAT)</div><div class="plv" id="od-pl-netrev">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Payment costs (Connect Standard)</div>
        <div class="plr"><div class="pll">Stripe processing (1.5% + 20p)<small id="od-str-note">—</small></div><div class="plv str" id="od-pl-str">—</div></div>
        <div class="plr"><div class="pll">Chargebacks<small id="od-cb-note">—</small></div><div class="plv rd" id="od-pl-cb">—</div></div>
        <div class="plr"><div class="pll s">Gross profit after payments</div><div class="plv" id="od-pl-gp">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Infrastructure</div>
        <div class="plr"><div class="pll">Supabase<small id="od-sb-pl">—</small></div><div class="plv am" id="od-pl-sb">£0</div></div>
        <div class="plr"><div class="pll">Mapbox<small id="od-mb-pl">—</small></div><div class="plv am" id="od-pl-mb">£0</div></div>
        <div class="plr"><div class="pll">Resend<small id="od-em-pl">—</small></div><div class="plv am" id="od-pl-em">£0</div></div>
        <div class="plr"><div class="pll">Vercel<small id="od-vc-pl">—</small></div><div class="plv am" id="od-pl-vc">£0</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Staffing</div>
        <div class="plr"><div class="pll">CS team<small id="od-cs-n">—</small></div><div class="plv pu" id="od-pl-cs">—</div></div>
        <div class="plr"><div class="pll">Engineering<small id="od-eng-n">—</small></div><div class="plv pu" id="od-pl-eng">—</div></div>

        <div class="od-div"></div>
        <div class="plr"><div class="pll s">Total OpEx</div><div class="plv am" id="od-pl-opex">—</div></div>
        <div class="plr"><div class="pll s">Pre-tax net margin</div><div class="plv" id="od-pl-pre">—</div></div>
        <div class="plr"><div class="pll">UK corp tax<small id="od-tax-l">—</small></div><div class="plv rd" id="od-pl-tax">—</div></div>
        <div class="plr"><div class="pll">Founder draw<small id="od-draw-note">—</small></div><div class="plv gn" id="od-pl-draw">—</div></div>

        <div class="od-th">
          <div><div class="od-t1">Reinvestment pool</div><div class="od-t2">Profit returned to business after your draw</div></div>
          <div style="text-align:right">
            <div class="od-thv pos" id="od-pl-net">—</div>
            <div style="font-size:11px;margin-top:4px;font-family:'SF Mono',monospace;color:#868C96">your draw: <span id="od-draw-display" style="color:#22C55E">—</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- PITFALL ANALYSIS -->
    <div class="section-h" id="od-sh-risks" onclick="od_tog('risks')" style="margin-top:10px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-risks">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Pitfall analysis</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risks">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risks">
      <div class="od-card" style="margin-top:4px"><div id="od-risk-list"></div></div>
    </div>

    <!-- INFRASTRUCTURE -->
    <div class="section-h" id="od-sh-infra" onclick="od_tog('infra')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-infra">
      <span class="sh-t"><span class="od-dot" style="background:#1D9E75"></span> Infrastructure headroom</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-infra">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-infra">
      <div class="od-card" style="margin-top:4px">
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase rows <span class="tbadge tok" id="od-sb-t">Free</span></span><span class="ibar-nums" id="od-sb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-sb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 500k → Pro £20</span><span class="uc ok" id="od-sb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase MAUs <span class="tbadge tok" id="od-mau-t">Free</span></span><span class="ibar-nums" id="od-mau-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mau-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → Pro 100k</span><span class="uc ok" id="od-mau-c">incl.</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Mapbox <span class="tbadge tok" id="od-mb-t">Free</span></span><span class="ibar-nums" id="od-mb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → £0.40/1k</span><span class="uc ok" id="od-mb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Resend <span class="tbadge tok" id="od-em-t">Free</span></span><span class="ibar-nums" id="od-em-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-em-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 3k → Starter £15 → Pro £35</span><span class="uc ok" id="od-em-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Vercel <span class="tbadge tok" id="od-vc-t">Free</span></span><span class="ibar-nums" id="od-vc-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-vc-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 1M → Pro £18</span><span class="uc ok" id="od-vc-c">£0</span></div>
        </div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total infra/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:13px;font-weight:600;color:#F1F1EF" id="od-infra-tot">£0</span>
        </div>
      </div>
    </div>

    <!-- DEV TOOLS -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #2A2B32;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5F5E5A;margin-bottom:10px;">Developer tools</div>
      <button onclick="clearAllTestData()" style="width:100%;padding:11px;background:transparent;border:1px solid #E24B4A44;border-radius:10px;color:#E24B4A;font-size:12px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;letter-spacing:0.01em;">🗑 Wipe all Supabase test data &amp; sign out</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// HOST PAYOUTS PANEL
// ═══════════════════════════════════════════════════════
// state.hostPayouts is a lazy cache: undefined = not yet fetched (kicks off
// fetchHostPayouts() and re-renders when it lands), array = fetched (empty
// array included). fetchHostPayouts() also lazily flips any row past its
// scheduled_release_at to 'released' server-side before returning.
function renderHostPayoutsPanel() {
  if (state.hostPayouts === undefined) {
    state.hostPayouts = null; // guard against a double-fetch while in flight
    fetchHostPayouts().then((rows) => {
      state.hostPayouts = rows;
      renderView();
    });
  }

  const rows = state.hostPayouts;
  const statusLabel = { pending: "Held", released: "Released", disputed: "Disputed" };
  const statusColor = { pending: "var(--text-muted)", released: "#147136", disputed: "#b3261e" };
  const payoutRows = (rows || [])
    .map((p) => {
      const ev = EVENTS.find((e) => e.id === p.event_id);
      const when =
        p.status === "released"
          ? `Released ${new Date(p.released_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
          : `Releases ${new Date(p.scheduled_release_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
      return `<div class="hp-tier-row">
        <span class="hp-tier-label">${escapeHtml(ev ? ev.title : "Event")} · £${Number(p.net_amount).toFixed(2)}</span>
        <span class="hp-tier-fee" style="color:${statusColor[p.status] || "var(--text-muted)"}">${statusLabel[p.status] || p.status} · ${when}</span>
      </div>`;
    })
    .join("");

  // Bookkeeping only — no payment processor is wired up in this codebase yet,
  // so this tracks WHEN/WHOM a payout would go to, but never moves real money.
  return `
  <div class="hp-panel">
    <div class="hp-title">💸 Your payouts explained</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You set the ticket price and <strong style="color:var(--text);">keep 100% of it</strong> — always. Buyers pay a small platform fee at checkout that covers card processing and running Cumulus. It's added on top of your price, so it never comes out of your earnings.</div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Your ticket price</span>
      <span class="hp-tier-fee" style="color:#147136">You keep 100%</span>
    </div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Platform fee</span>
      <span class="hp-tier-fee" style="color:var(--text-muted)">Added at checkout · paid by the buyer</span>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--surface-2);border-radius:10px;font-size:11px;color:var(--text-muted);line-height:1.6;">
      <strong style="color:var(--text);">Payout timeline:</strong> Funds release 24 hours after your event ends once you've hosted 3+ dispute-free events — 48 hours before that, as a fraud-protection buffer.
    </div>
    ${
      rows === null
        ? `<div style="margin-top:12px;font-size:12px;color:var(--text-muted);">Loading your payouts…</div>`
        : rows && rows.length
          ? `<div style="margin-top:12px;">${payoutRows}</div>`
          : `<div style="margin-top:12px;font-size:12px;color:var(--text-muted);">No ticket sales yet — payouts appear here once your event starts selling.</div>`
    }
  </div>`;
}

// state.myConnectStatus follows the same lazy-cache pattern as
// state.hostPayouts (undefined = not fetched, null = in flight, object =
// loaded). Separate from state.hostPayouts because it reads `users`, not
// `event_payouts`.
function renderConnectStatusPanel() {
  if (state.myConnectStatus === undefined) {
    state.myConnectStatus = null;
    fetchMyConnectStatus(state.userId).then((data) => {
      state.myConnectStatus = data || {};
      renderView();
    });
  }
  const s = state.myConnectStatus;
  if (s === null) {
    return `<div class="hp-panel" style="margin-top:16px;">
      <div class="hp-title">🏦 Payout account</div>
      <div style="font-size:12px;color:var(--text-muted);">Loading…</div>
    </div>`;
  }
  const connected = !!s.stripe_connect_payouts_enabled;
  const pending = !!s.stripe_connect_account_id && !connected;
  return `<div class="hp-panel" style="margin-top:16px;">
    <div class="hp-title">🏦 Payout account</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">${
      connected
        ? "Your bank account is connected — payouts release automatically on the schedule above."
        : pending
          ? "Stripe is still verifying your details. This usually takes a few minutes — refresh this page to check again."
          : "Connect a bank account with Stripe so we have somewhere to actually send your payouts. Free events don't need this."
    }</div>
    ${
      connected
        ? `<div class="hp-tier-row"><span class="hp-tier-label">Status</span><span class="hp-tier-fee" style="color:#147136">Connected</span></div>`
        : `<button class="btn btn-outline" style="width:100%;" onclick="beginConnectOnboarding()">${pending ? "Finish setup" : "Connect payout account"} →</button>`
    }
  </div>`;
}

async function beginConnectOnboarding() {
  showToast("Redirecting to Stripe…", "info");
  const res = await startConnectOnboarding();
  if (!res || res.error || !res.url) {
    showToast(res?.error || "Could not start onboarding — try again", "error");
    return;
  }
  location.href = res.url;
}

// Boot-time handler for the browser coming back from Stripe Connect
// onboarding (connect-onboarding's refresh_url/return_url). Neither URL
// guarantees onboarding actually finished — account.updated (stripe-webhook)
// is the real source of truth — this just refreshes the cached status so a
// completed setup shows up without a manual reload.
async function checkConnectReturn() {
  const params = new URLSearchParams(location.search);
  const status = params.get("connect");
  if (!status) return;
  history.replaceState(null, "", location.pathname);
  if (status === "return" || status === "refresh") {
    state.myConnectStatus = undefined; // force a re-fetch next render
    showToast("Checking your payout account status…", "info");
  }
}

// Lists this host's own upcoming/live events with a "Cancel & refund" action
// — the frontend entry point for cancel-event-refund. Past events aren't
// offered here: cancelling something that already happened doesn't refund
// anyone anything meaningful and event_payouts for a past event may already
// be released.
function renderMyHostedEventsCancelPanel() {
  if (!state.userId) return "";
  const mine = EVENTS.filter(
    (e) =>
      e.hostId === state.userId &&
      e.status !== "cancelled" &&
      eventStatus(e) !== "past",
  );
  if (!mine.length) return "";
  const rows = mine
    .map(
      (ev) => `<div class="hp-tier-row">
        <span class="hp-tier-label">${escapeHtml(ev.title)} · ${ev.date}</span>
        <button class="btn btn-outline btn-small" style="min-height:32px;padding:0 12px;color:#b3261e;border-color:#b3261e;" onclick="hostCancelEvent('${ev.id}','${escapeHtml(ev.title).replace(/'/g, "&#39;")}')">Cancel &amp; refund</button>
      </div>`,
    )
    .join("");
  return `<div class="hp-panel" style="margin-top:16px;">
    <div class="hp-title">⚠️ Cancel an event</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">Cancelling refunds every ticket automatically and takes the event off the map. This can't be undone.</div>
    ${rows}
  </div>`;
}

async function hostCancelEvent(eventId, title) {
  if (
    !confirm(
      `Cancel "${title}"? Every ticket will be refunded automatically. This cannot be undone.`,
    )
  )
    return;
  showToast("Cancelling and refunding…", "info");
  const res = await cancelEventRefund(eventId);
  if (!res || !res.ok) {
    showToast(res?.error || "Could not cancel the event — try again", "error");
    return;
  }
  const ev = EVENTS.find((e) => e.id === eventId);
  if (ev) ev.status = "cancelled";
  showToast(
    res.warning
      ? "Event cancelled — some refunds need manual follow-up, see console."
      : "Event cancelled and refunded.",
    res.warning ? "error" : "success",
  );
  if (res.warning) console.warn("cancel-event-refund:", res);
  renderView();
}

// Admin — its own owner-only nav tab (gated by isAdminAccount() in
// renderNav(), 05-data-loaders.js). Used to be a section buried at the
// bottom of the old Profile screen, reachable only by scrolling past the
// whole gamified card/badges layout — now it's one tap away and nothing
// else shares the screen with it.
function openAdmin() {
  pushNav();
  state.view = "admin";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAdmin() {
  return `
    <div class="connect-header"><h2>Admin</h2><p>Approvals, hosts &amp; finances</p></div>
    <div class="prof-action-list">
      ${
        // Admin status is now auto-verified at boot (initApp() calls
        // isAdminSession()) for any account actually listed in
        // public.admins — this manual re-verify row only still matters as
        // a fallback for the rare case that check didn't run this session
        // (e.g. a transient network error), which is why it's hidden once
        // state._verifiedAdmin confirms the automatic check already ran.
        state._verifiedAdmin
          ? ""
          : `<button class="prof-action-row" onclick="promptAdminSignIn()">
        <span class="prof-action-label">Admin sign-in<span class="prof-action-sub" id="admin-auth-sub">Verify with a one-time code to approve events</span></span>
        <span class="prof-action-right">›</span>
      </button>`
      }
      <button class="prof-action-row" onclick="openOwnerDash()">
        <span class="prof-action-label">Finances<span class="prof-action-sub">Live revenue &amp; payouts</span></span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row" onclick="openReview()">
        <span class="prof-action-label">Host applications<span class="prof-action-sub">Review &amp; approve hosts</span></span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row" onclick="openEventApprovals()">
        <span class="prof-action-label">Event approvals<span class="prof-action-sub">Review &amp; publish public events</span></span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row" onclick="openReportedEvents()">
        <span class="prof-action-label">Reported events<span class="prof-action-sub">Auto-hidden after 3+ community reports</span></span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-danger" onclick="clearAllUsers()">
        <span class="prof-action-label">Clear all users<span class="prof-action-sub">Delete every account &amp; email (keeps events)</span></span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-danger" onclick="if(confirm('Delete ALL rows in users, events, rsvps, tickets? This cannot be undone.')){clearAllTestData(true)}">
        <span class="prof-action-label">Wipe all test data<span class="prof-action-sub">Users + events + everything</span></span>
        <span class="prof-action-right">›</span>
      </button>
    </div>
  `;
}

function openOwnerDash() {
  pushNav();
  state.view = "owner-dash";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════════════════════════
   HOST REVIEW — admin only
   ══════════════════════════════════════════════════ */
function openReview() {
  pushNav();
  state.view = "review";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderReview() {
  const container = document.getElementById("view-container");
  container.innerHTML = `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Host Review</h2>
      <p>Applications to host public events on Cumulus</p>
    </div>
    <div id="review-content">
      <div class="review-empty">
        <div class="review-empty-icon">📋</div>
        <div>Loading applications…</div>
      </div>
    </div>`;
  setTimeout(loadAndRenderReview, 0);
}

async function loadAndRenderReview() {
  const content = document.getElementById("review-content");
  if (!content) return;

  let apps = [];
  // Supabase
  try {
    const { data, error } = await sb
      .from("host_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) apps = [...apps, ...data];
  } catch (e) {}
  // localStorage fallback
  try {
    const local = JSON.parse(
      localStorage.getItem("host_applications_local") || "[]",
    );
    // Deduplicate by email+created_at
    const existingKeys = new Set(apps.map((a) => a.email + "|" + a.created_at));
    apps = [
      ...apps,
      ...local.filter((a) => !existingKeys.has(a.email + "|" + a.created_at)),
    ];
  } catch (e) {}

  if (!apps.length) {
    content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No host applications yet.</div></div>`;
    return;
  }

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  content.innerHTML = `
    ${pending.length ? `<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildReviewCard).join("")}` : ""}
    ${reviewed.length ? `<div class="review-section-hd" style="margin-top:${pending.length ? "20px" : "0"};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildReviewCard).join("")}` : ""}
  `;
}

function _buildReviewCard(app) {
  let date = "";
  if (app.created_at) {
    const d = new Date(app.created_at);
    if (!isNaN(d)) {
      date = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      date = escapeHtml(app.created_at);
    }
  }
  const isPending = app.status === "pending";
  const id = escapeHtml(app.id || app.email);
  const email = escapeHtml(app.email);
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(app.name)}</div>
        <div class="review-card-email">${email}</div>
      </div>
      <span class="review-status-badge ${app.status}">${app.status}</span>
    </div>
    ${app.business_name ? `<div class="review-detail"><div class="review-detail-lbl">Venue / Business</div><div class="review-detail-val">${escapeHtml(app.business_name)}</div></div>` : ""}
    ${app.event_types ? `<div class="review-detail"><div class="review-detail-lbl">Event types</div><div class="review-detail-val">${escapeHtml(app.event_types)}</div></div>` : ""}
    ${app.description ? `<div class="review-detail"><div class="review-detail-lbl">About their events</div><div class="review-detail-val">${escapeHtml(app.description)}</div></div>` : ""}
    ${app.why_host ? `<div class="review-detail"><div class="review-detail-lbl">Why they want to host</div><div class="review-detail-val">${escapeHtml(app.why_host)}</div></div>` : ""}
    ${date ? `<div style="font-size:10px;color:var(--text-muted);margin-top:8px;">Applied ${date}</div>` : ""}
    ${
      isPending
        ? `<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="reviewHost('${id}','${email}','approved')">Approve</button>
      <button class="btn btn-outline btn-small review-reject-btn"  style="flex:1;" onclick="reviewHost('${id}','${email}','rejected')">Reject</button>
    </div>`
        : ""
    }
  </div>`;
}

async function reviewHost(appId, email, decision) {
  // Update Supabase
  try {
    await sb
      .from("host_applications")
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq("id", appId);
  } catch (e) {}
  // Update localStorage fallback
  try {
    let apps = JSON.parse(
      localStorage.getItem("host_applications_local") || "[]",
    );
    apps = apps.map((a) =>
      a.email === email || a.id === appId ? { ...a, status: decision } : a,
    );
    localStorage.setItem("host_applications_local", JSON.stringify(apps));
  } catch (e) {}
  // If approved: add verified-host badge to the user
  if (decision === "approved") {
    try {
      const { data: u } = await sb
        .from("users")
        .select("id,special_badges")
        .eq("email", email)
        .single();
      if (u) {
        const badges = [...(u.special_badges || [])];
        if (!badges.includes("verified-host")) badges.push("verified-host");
        await sb
          .from("users")
          .update({ special_badges: badges })
          .eq("id", u.id);
      }
    } catch (e) {}
  }
  showToast(
    decision === "approved"
      ? `${email} approved as host`
      : `Application rejected`,
    "success",
  );
  await loadAndRenderReview();
}

/* ══════════════════════════════════════════════════
   EVENT APPROVALS — admin only. Public events submitted by hosts
   queue here for review before they are published to the map.
   ══════════════════════════════════════════════════ */
function openEventApprovals() {
  pushNav();
  state.view = "event-approvals";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Admin sign-in via Supabase Auth OTP — reuses the same 6-digit email code
// flow as normal login so there is no separate credential to remember.
// The flow: enter email → receive 6-digit OTP → verify → is_admin() checked.
//
// This runs as an in-page modal rather than window.prompt(). Native prompt()
// dialogs get auto-dismissed by the browser/OS when the tab loses focus —
// which is exactly what happens the moment you switch to your email app to
// read the code, wiping out the pending prompt and forcing a restart. A
// regular DOM modal has no such issue: switching tabs to grab the code and
// coming back leaves it exactly as you left it.
let _adminPendingEmail = null;

function promptAdminSignIn() {
  const old = document.getElementById("admin-auth-overlay");
  if (old) old.remove();

  const html = `<div class="card-xl-overlay open" id="admin-auth-overlay" onclick="if(event.target===this)closeAdminSignIn()">
    <div class="admin-auth-modal">
      <button class="card-xl-close" onclick="closeAdminSignIn()" aria-label="Close">✕</button>
      <div id="admin-auth-panel"></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  renderAdminEmailStep(state.profileEmail || "");
}

function closeAdminSignIn() {
  const ov = document.getElementById("admin-auth-overlay");
  if (ov) ov.remove();
  _adminPendingEmail = null;
}

function renderAdminEmailStep(prefill) {
  const panel = document.getElementById("admin-auth-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="lp-form-eyebrow">Admin access</div>
    <h3 class="lp-form-title">Sign in as admin</h3>
    <p class="lp-form-sub">Enter your admin email — we'll send a 6-digit code.</p>
    <div class="gate-field">
      <label class="gate-label" for="admin-auth-email">Email</label>
      <input id="admin-auth-email" class="gate-input" type="email" autocomplete="email" placeholder="you@example.com" value="${escapeHtml(prefill)}" aria-describedby="admin-auth-error"/>
    </div>
    <p id="admin-auth-error" class="gate-field-error" role="alert"></p>
    <button id="admin-auth-send" class="lp-claim-btn" onclick="adminSendCode()">
      <span class="lp-claim-btn-text">Send code</span>
    </button>`;
  const inp = document.getElementById("admin-auth-email");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") adminSendCode();
    });
  }
}

function adminAuthErr(msg) {
  const e = document.getElementById("admin-auth-error");
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}

async function adminSendCode() {
  const email = (
    document.getElementById("admin-auth-email")?.value || ""
  ).trim();
  const errEl = document.getElementById("admin-auth-error");
  if (errEl) errEl.classList.remove("show");
  if (!EMAIL_PATTERN.test(email)) {
    adminAuthErr("Please enter a valid email address.");
    return;
  }

  const btn = document.getElementById("admin-auth-send");
  const label = () => btn && btn.querySelector(".lp-claim-btn-text");
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Sending…";
  }

  // Use the same authSendCode helper as normal login — sends the Supabase
  // magic-link / OTP email. Admin email just needs to be in public.admins.
  const sent = await authSendCode(email, {});
  if (btn) {
    btn.disabled = false;
    if (label()) label().textContent = "Send code";
  }
  if (!sent.ok) {
    adminAuthErr(authErrMsg(sent.error));
    return;
  }

  _adminPendingEmail = email;
  const sub = document.getElementById("admin-auth-sub");
  if (sub) sub.textContent = "Code sent — check your email";
  renderAdminOtpStep(email);
}

function renderAdminOtpStep(email) {
  const panel = document.getElementById("admin-auth-panel");
  if (!panel) return;
  panel.innerHTML = `
    <button class="gate-otp-back" onclick="renderAdminEmailStep('${escapeHtml(email)}')" aria-label="Back">←</button>
    <div class="lp-form-eyebrow">Check your inbox</div>
    <h3 class="lp-form-title">Enter your code</h3>
    <p class="lp-form-sub">We emailed a 6-digit code to <strong>${escapeHtml(email)}</strong>. Switch to your email app and come back — this stays open.</p>
    <div class="gate-field">
      <label class="gate-label" for="admin-otp-input">6-digit code</label>
      <input id="admin-otp-input" class="gate-input gate-otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-describedby="admin-auth-error" oninput="this.value=this.value.replace(/\\D/g,'')"/>
    </div>
    <p id="admin-auth-error" class="gate-field-error" role="alert"></p>
    <button id="admin-auth-verify" class="lp-claim-btn" onclick="adminVerifyCode()">
      <span class="lp-claim-btn-text">Verify &amp; sign in</span>
    </button>
    <button class="gate-otp-resend" onclick="adminResendCode()">Didn't get it? Resend code</button>`;
  const inp = document.getElementById("admin-otp-input");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") adminVerifyCode();
    });
  }
}

async function adminResendCode() {
  if (!_adminPendingEmail) return;
  const b = document.querySelector(".gate-otp-resend");
  if (b) {
    b.disabled = true;
    b.textContent = "Sending…";
  }
  const res = await authSendCode(_adminPendingEmail, {});
  if (b) {
    b.disabled = false;
    b.textContent = res.ok ? "Code re-sent ✓" : "Resend failed — try again";
  }
}

async function adminVerifyCode() {
  const email = _adminPendingEmail;
  if (!email) return;
  const code = (document.getElementById("admin-otp-input")?.value || "").trim();
  const errEl = document.getElementById("admin-auth-error");
  if (errEl) errEl.classList.remove("show");
  if (!/^\d{6}$/.test(code)) {
    adminAuthErr("Enter the 6-digit code from your email.");
    return;
  }

  const btn = document.getElementById("admin-auth-verify");
  const label = () => btn && btn.querySelector(".lp-claim-btn-text");
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Verifying…";
  }

  // authVerifyCode is the shared OTP verifier — it returns the Supabase session
  const res = await authVerifyCode(email, code);
  if (!res.ok) {
    if (btn) {
      btn.disabled = false;
      if (label()) label().textContent = "Verify & sign in";
    }
    adminAuthErr("That code didn't match. Check it and try again.");
    return;
  }

  _adminPendingEmail = null;
  const sub = document.getElementById("admin-auth-sub");

  // Check is_admin() server-side — prevents non-admin accounts from gaining access
  const isAdmin = await isAdminSession();
  if (isAdmin) {
    state.isAdmin = true; // unlocks all hosting gates client-side
    // Marks that THIS session passed the real server-side is_admin() check,
    // so the TEMP admin-preview toggle below is only ever offered to a
    // confirmed admin — never to an arbitrary logged-in user.
    state._verifiedAdmin = true;
    showToast("Admin verified — all gates bypassed", "success");
    if (sub) sub.textContent = "Admin session active — full access";
    closeAdminSignIn();
  } else {
    showToast(
      "Signed in, but this account is not in the admins table",
      "error",
    );
    if (sub) sub.textContent = "Not an admin account";
    closeAdminSignIn();
  }
}

function renderEventApprovals() {
  const container = document.getElementById("view-container");
  container.innerHTML = `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Event Approvals</h2>
      <p>Public events awaiting review before they go live</p>
    </div>
    <div id="evapp-content">
      <div class="review-empty"><div class="review-empty-icon">📋</div><div>Loading events…</div></div>
    </div>`;
  setTimeout(loadAndRenderEventApprovals, 0);
}

function _pendingEventKey(e) {
  return e.id != null
    ? String(e.id)
    : (e.title || "") + "|" + (e.created_at || "");
}

async function loadAndRenderEventApprovals() {
  const content = document.getElementById("evapp-content");
  if (!content) return;
  try {
    let evs = [];
    try {
      const { data, error } = await sb
        .from("pending_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) evs = [...evs, ...data];
    } catch (e) {
    }
    try {
      const local = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      ).filter((e) => e != null);
      const keys = new Set(evs.filter((e) => e != null).map(_pendingEventKey));
      evs = [
        ...evs,
        ...local.filter((e) => e != null && !keys.has(_pendingEventKey(e))),
      ];
    } catch (e) {
    }

    evs = evs.filter((e) => e != null);

    if (!evs.length) {
      content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No public events awaiting approval.</div></div>`;
      return;
    }
    const pending = evs.filter((e) => e.status === "pending");
    const reviewed = evs.filter((e) => e.status !== "pending");
    content.innerHTML = `
      ${pending.length ? `<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildEventApprovalCard).join("")}` : ""}
      ${reviewed.length ? `<div class="review-section-hd" style="margin-top:${pending.length ? "20px" : "0"};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildEventApprovalCard).join("")}` : ""}`;
  } catch (err) {
    content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">⚠️</div><div style="font-weight:700;margin-bottom:4px;">Error Loading Panel</div><div>${escapeHtml(err.message)}</div></div>`;
  }
}

function _buildEventApprovalCard(ev) {
  const id = escapeHtml(String(ev.id != null ? ev.id : ""));
  let when = "";
  if (ev.start_time) {
    const d = new Date(ev.start_time);
    if (!isNaN(d)) {
      when = d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      when = escapeHtml(ev.start_time);
    }
  }
  const isPending = ev.status === "pending";
  // Raw pending_events row (snake_case), not a mapped EVENTS item — reuse
  // the same active-tier rule via a quick adapter rather than duplicate it.
  const reviewPrice = eventPrice({ price: ev.price, priceTiers: ev.price_tiers });
  const priceLbl = reviewPrice > 0 ? `£${reviewPrice.toFixed(2)}` : "Free";
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(ev.title || "Untitled event")}</div>
        <div class="review-card-email">${escapeHtml(ev.host_name || "Unknown host")}${ev.host_email ? " · " + escapeHtml(ev.host_email) : ""}</div>
      </div>
      <span class="review-status-badge ${escapeHtml(ev.status || "pending")}">${escapeHtml(ev.status || "pending")}</span>
    </div>
    ${ev.category ? `<div class="review-detail"><div class="review-detail-lbl">Category</div><div class="review-detail-val">${escapeHtml(ev.category)}</div></div>` : ""}
    ${when ? `<div class="review-detail"><div class="review-detail-lbl">When</div><div class="review-detail-val">${when}</div></div>` : ""}
    ${ev.venue ? `<div class="review-detail"><div class="review-detail-lbl">Venue</div><div class="review-detail-val">${escapeHtml(ev.venue)}${ev.area ? ", " + escapeHtml(ev.area) : ""}</div></div>` : ""}
    <div class="review-detail"><div class="review-detail-lbl">Capacity · Ticket price</div><div class="review-detail-val">${ev.capacity != null ? escapeHtml(String(ev.capacity)) : "—"} · ${priceLbl}</div></div>
    ${ev.description ? `<div class="review-detail"><div class="review-detail-lbl">Description</div><div class="review-detail-val">${escapeHtml(ev.description)}</div></div>` : ""}
    ${
      isPending
        ? `<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="decideEvent('${id}','approved')">Approve &amp; publish</button>
      <button class="btn btn-outline btn-small review-reject-btn" style="flex:1;" onclick="decideEvent('${id}','rejected')">Reject</button>
    </div>`
        : ""
    }
  </div>`;
}

async function decideEvent(pendingId, decision) {
  // Locate the pending record — Supabase first, then the local fallback store.
  let rec = null;
  try {
    const { data } = await sb
      .from("pending_events")
      .select("*")
      .eq("id", pendingId)
      .single();
    rec = data;
  } catch (e) {}
  if (!rec) {
    try {
      const arr = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      );
      rec = arr.find((e) => String(e.id) === String(pendingId)) || null;
    } catch (e) {}
  }
  if (decision === "approved" && rec) {
    const ok = await _publishApprovedEvent(rec);
    if (!ok) return; // Halt if publication failed
  }
  // Record the decision (both stores, whichever exists)
  try {
    await sb
      .from("pending_events")
      .update({ status: decision })
      .eq("id", pendingId);
  } catch (e) {}
  try {
    let arr = JSON.parse(localStorage.getItem("pending_events_local") || "[]");
    arr = arr.map((e) =>
      String(e.id) === String(pendingId) ? { ...e, status: decision } : e,
    );
    localStorage.setItem("pending_events_local", JSON.stringify(arr));
  } catch (e) {}
  showToast(
    decision === "approved" ? "Event approved & published" : "Event rejected",
    "success",
  );
  await loadAndRenderEventApprovals();
}

async function _publishApprovedEvent(rec) {
  let inserted = null;
  try {
    let { data, error } = await sb
      .from("events")
      .insert({
        title: rec.title,
        category: rec.category,
        host_id: rec.host_id,
        host_name: rec.host_name,
        venue: rec.venue,
        area: rec.area || "London",
        address: rec.address || "",
        lat: rec.lat,
        lon: rec.lon,
        start_time: rec.start_time,
        end_time: rec.end_time,
        description: rec.description,
        capacity: rec.capacity,
        price: rec.price || 0,
        price_tiers: rec.price_tiers || null,
        photo_url: rec.photo_url || null,
      })
      .select()
      .single();
    if (error) {
      if (error.message && error.message.includes("events_host_id_fkey")) {
        const retryRes = await sb
          .from("events")
          .insert({
            title: rec.title,
            category: rec.category,
            host_id: null,
            host_name: rec.host_name,
            venue: rec.venue,
            area: rec.area || "London",
            address: rec.address || "",
            lat: rec.lat,
            lon: rec.lon,
            start_time: rec.start_time,
            end_time: rec.end_time,
            description: rec.description,
            capacity: rec.capacity,
            price: rec.price || 0,
            photo_url: rec.photo_url || null,
          })
          .select()
          .single();
        if (retryRes.error) {
          showToast(
            "Failed to publish event: " + retryRes.error.message,
            "error",
          );
          return false;
        }
        data = retryRes.data;
      } else {
        showToast("Failed to publish event: " + error.message, "error");
        return false;
      }
    }
    inserted = data;
  } catch (e) {
    showToast("Failed to publish event: " + e.message, "error");
    return false;
  }
  const src = inserted || rec;
  const newEvent = {
    id: inserted ? inserted.id : "local_ev_" + Date.now(),
    title: src.title,
    category: src.category,
    host: src.host_name,
    hostId: src.host_id,
    venue: src.venue,
    area: src.area || "London",
    address: src.address || "",
    lat: src.lat,
    lon: src.lon,
    startTime: src.start_time,
    endTime: src.end_time,
    desc: src.description,
    capacity: src.capacity,
    price: src.price || 0,
    priceTiers: src.price_tiers || null,
    photoUrl: src.photo_url || null,
  };
  computeEventDates(newEvent);
  if (!EVENTS.some((e) => String(e.id) === String(newEvent.id)))
    EVENTS.push(newEvent);
  return true;
}

function renderView() {
  const app = document.getElementById("app");
  const container = document.getElementById("view-container");
  // Lets CSS scope per-view chrome (e.g. the ambient tab backdrops)
  // without touching the render functions themselves. Lives on #app, not
  // #view-container: the container's will-change:transform makes it a
  // fixed-position containing block, which would clip a viewport layer.
  app.dataset.view = state.view;
  if (state.view !== "host") destroyHostMap();

  if (state.view === "browse") {
    app.classList.add("map-home");
    document.body.classList.add("no-scroll");
    container.innerHTML = "";
    showMapLayer(true);
    initLeaflet();
    refreshFilters();
    refreshMarkers();
    setTimeout(() => {
      if (lmap) lmap.resize();
    }, 60);
    return;
  }

  showMapLayer(false);
  stopLivePulse(); // halt the live-pin rAF while the map isn't on screen
  app.classList.remove("map-home");
  document.body.classList.remove("no-scroll");
  if (state.view === "detail")
    container.innerHTML = renderDetail(state.selectedEventId);
  else if (state.view === "host-profile")
    container.innerHTML = renderHostProfile();
  else if (state.view === "account") container.innerHTML = renderAccount();
  else if (state.view === "account-details")
    container.innerHTML = renderAccountDetails();
  else if (state.view === "admin") container.innerHTML = renderAdmin();
  else if (state.view === "calendar") container.innerHTML = renderCalendar();
  else if (state.view === "host") {
    container.innerHTML = renderHostView();
    if (mapboxConfigured()) setTimeout(initHostMap, 0);
  } else if (state.view === "book") container.innerHTML = renderBook();
  else if (state.view === "checkout") {
    container.innerHTML = renderCheckout();
    setTimeout(afterRenderCheckout, 0);
  } else if (state.view === "confirmed") {
    container.innerHTML = renderConfirmed();
    setTimeout(afterRenderConfirmed, 60);
  } else if (state.view === "calendar-day")
    container.innerHTML = renderCalendarDay();
  else if (state.view === "scan-picker")
    container.innerHTML = renderScannerPicker();
  else if (state.view === "scan") container.innerHTML = renderScanner();
  else if (state.view === "owner-dash") {
    container.innerHTML = renderOwnerDash();
    setTimeout(initOwnerDash, 0);
  } else if (state.view === "review") {
    renderReview();
    return;
  } else if (state.view === "event-approvals") {
    renderEventApprovals();
    return;
  } else if (state.view === "reported-events") {
    renderReportedEvents();
    return;
  } else if (state.view === "host-apply") {
    container.innerHTML = renderHostApplyView();
  }
}

function getFilteredEvents() {
  const q = (
    document.getElementById("search-input")?.value || ""
  ).toLowerCase();
  let list = EVENTS.filter((ev) => {
    // Cancelled/hidden events stay in EVENTS (a ticket-holder can still
    // open one from My Tickets to see the notice) but never show up on
    // the map or in browse/search results. "hidden" = auto-hidden by the
    // community-report trigger pending admin review (see event_reports).
    if (ev.status === "cancelled" || ev.status === "hidden") return false;
    // Ended events stay findable through Calendar (renderCalendar/
    // eventListCardHtml show them greyed out as "Event ended") but never as
    // a live pin or in browse/search — a map full of pins for things that
    // already happened would just confuse people looking for what's on now.
    if (eventStatus(ev) === "past") return false;
    const hasLocation = ev.lat != null && ev.lon != null;
    const mc =
      state.selectedCategory === "all" ||
      ev.category === state.selectedCategory;
    const mq =
      !q ||
      (ev.title + ev.venue + ev.area + ev.category + ev.host)
        .toLowerCase()
        .includes(q);
    return hasLocation && mc && mq;
  });
  if (state.liveOnly) list = list.filter((ev) => eventStatus(ev) === "live");
  if (state.hotOnly) list = list.filter((ev) => isHotEvent(ev));
  if (state.startingSoonOnly) list = list.filter((ev) => isStartingSoon(ev));
  if (state.dateFilter && state.dateFilter !== "all")
    list = list.filter((ev) => eventInDateRange(ev, state.dateFilter));
  return list;
}
// Shared by the map's Today/This weekend chips and the Calendar List quick
// filters — one definition of "today" and "this weekend" for the whole app.
function eventInDateRange(ev, range) {
  if (ev.startsAt == null) return false;
  const d = new Date(ev.startsAt);
  const now = new Date();
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (range === "today") {
    return startOfDay(d) === startOfDay(now);
  }
  if (range === "weekend") {
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const satOffset = (6 - day + 7) % 7;
    const sat = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + satOffset),
    );
    const sunEnd = sat + 2 * 86400000; // through end of Sunday
    const t = startOfDay(d);
    return t >= sat && t < sunEnd;
  }
  return true;
}
function setDateFilter(mode) {
  state.dateFilter = state.dateFilter === mode ? "all" : mode;
  renderView();
}
function toggleLiveOnly() {
  state.liveOnly = !state.liveOnly;
  if (state.liveOnly) {
    state.hotOnly = false;
    state.startingSoonOnly = false;
  }
  renderView();
}
function toggleHotOnly() {
  state.hotOnly = !state.hotOnly;
  if (state.hotOnly) {
    state.liveOnly = false;
    state.startingSoonOnly = false;
  }
  renderView();
}
// Blueprint whitespace: "Real-Time Spontaneity Filter... own the 8pm
// walk-up market." Events already live or already past don't count as
// "about to start" — this is specifically the pre-doors window.
function isStartingSoon(ev) {
  if (typeof ev.startsAt !== "number") return false;
  const mins = (ev.startsAt - Date.now()) / 60000;
  return mins > 0 && mins <= 120;
}
function toggleStartingSoonOnly() {
  state.startingSoonOnly = !state.startingSoonOnly;
  if (state.startingSoonOnly) {
    state.liveOnly = false;
    state.hotOnly = false;
  }
  renderView();
}
function refreshFilters() {
  const el = document.getElementById("map-filters");
  if (!el) return;
  const aa = state.selectedCategory === "all";
  let html = `<button class="mchip ${aa ? "active" : ""}" style="${aa ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setCategory('all')">All</button>`;
  html += Object.entries(CATS)
    .map(([cat, c]) => {
      const a = state.selectedCategory === cat;
      return `<button class="mchip ${a ? "active" : ""}" style="${a ? `background:${c.color};color:#fff;border-color:transparent;` : ""}" onclick="setCategory('${cat}')"><span style="color:${a ? "#fff" : c.color};display:inline-flex;">${categoryChipIconSvg(cat)}</span>${cat}</button>`;
    })
    .join("");
  html += `<button class="mchip ${state.liveOnly ? "active" : ""}" style="${state.liveOnly ? "background:#E23B3B;color:#fff;border-color:transparent;" : ""}" onclick="toggleLiveOnly()"><span style="width:6px;height:6px;border-radius:50%;background:${state.liveOnly ? "#fff" : "#E23B3B"};display:inline-block;margin-right:2px;animation:${state.liveOnly ? "blink 1.3s ease-in-out infinite" : "none"}"></span>Live</button>`;
  html += `<button class="mchip ${state.hotOnly ? "active" : ""}" style="${state.hotOnly ? "background:#F97316;color:#fff;border-color:transparent;" : ""}" onclick="toggleHotOnly()"><span style="display:inline-flex;color:#F97316;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 3 5 6 5 10a5 5 0 0 1-10 0c0-1.8.7-3 1.6-4.1.2 1.3.9 2 1.8 2.3-.4-2.7.4-5.3 1.6-8.2Z"/></svg></span> Hot</button>`;
  html += `<button class="mchip ${state.startingSoonOnly ? "active" : ""}" style="${state.startingSoonOnly ? "background:#8B5CF6;color:#fff;border-color:transparent;" : ""}" onclick="toggleStartingSoonOnly()"><span style="display:inline-flex;color:${state.startingSoonOnly ? "#fff" : "#8B5CF6"};"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg></span> Starting soon</button>`;
  html += `<button class="mchip ${state.dateFilter === "today" ? "active" : ""}" style="${state.dateFilter === "today" ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setDateFilter('today')">Today</button>`;
  html += `<button class="mchip ${state.dateFilter === "weekend" ? "active" : ""}" style="${state.dateFilter === "weekend" ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setDateFilter('weekend')">This weekend</button>`;
  el.innerHTML = html;
  // Finances now live in Profile → Admin & Finances (no floating map button)
  const fab = document.getElementById("owner-fin-fab");
  if (fab) fab.innerHTML = "";
}

function pinTooltipHtml(ev) {
  const status = eventStatus(ev);
  const c = CATS[ev.category];
  const att = attendeesFor(ev.id);
  const statusBadge =
    status === "live"
      ? `<span class="tip-live"><span class="d"></span>LIVE NOW</span>`
      : `<span class="tip-up">${status === "past" ? "Ended" : "Upcoming"}</span>`;
  let goingLine;
  if (att.length === 0) {
    goingLine = `<div class="tip-going none">No one yet — be the first!</div>`;
  } else {
    const names = att.slice(0, 3).map(escapeHtml);
    const extra = att.length > 3 ? ` +${att.length - 3}` : "";
    goingLine = `<div class="tip-going"><strong>${att.length} going</strong> — ${names.join(", ")}${extra}</div>`;
  }
  const capLine = ev.capacity
    ? `<div class="tip-going" style="margin-top:2px;"><strong>${Math.max(0, ev.capacity - att.length)} spaces left</strong></div>`
    : "";
  return `<div class="evtip-inner" style="--c:${c.color}">
    <div class="tip-top">${statusBadge}<span class="tip-cat" style="background:${c.color}">${ev.category}</span></div>
    <div class="tip-title">${escapeHtml(ev.title)}</div>
    <div class="tip-meta">${ev.date} · ${ev.time}</div>
    <div class="tip-meta">${escapeHtml(ev.venue)}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
    ${goingLine}${capLine}
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:700;color:${c.color};letter-spacing:0.04em;">
      <span>Open &amp; RSVP</span>
      <span style="font-size:13px;opacity:0.85;">→</span>
    </div>
  </div>`;
}

function shareEvent(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return;
  const text = `${ev.title} — ${ev.date}, ${ev.venue}${ev.area ? ", " + ev.area : ""}. Find it on Cumulus.`;
  const url = "https://cumulusapp.co/";
  if (navigator.share) {
    navigator.share({ title: ev.title, text, url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`${text} ${url}`).then(
      () => showToast("Copied to clipboard", "success"),
      () => showToast("Couldn't copy — try again"),
    );
  } else {
    showToast("Share not supported on this browser");
  }
}

// Community-driven moderation UI — a lightweight reason-picker modal
// (reuses the .card-xl-overlay/.card-xl-close chrome the admin sign-in
// modal already uses) rather than window.prompt(), which gets silently
// dismissed the moment the tab loses focus (see promptAdminSignIn's
// comment above for the same reasoning). Submitting inserts into
// public.event_reports; a DB trigger auto-hides the event once 3
// different people have reported it — see the migration that replaced
// per-upload AI image moderation with this.
const REPORT_REASONS = [
  "Inappropriate or explicit content",
  "Spam or scam",
  "Misleading event details",
  "Something else",
];

function openReportEventModal(eventId) {
  if (!state.userId) {
    showToast("Sign in to report an event", "error");
    return;
  }
  const old = document.getElementById("report-event-overlay");
  if (old) old.remove();
  const html = `<div class="card-xl-overlay open" id="report-event-overlay" onclick="if(event.target===this)closeReportEventModal()">
    <div class="admin-auth-modal">
      <button class="card-xl-close" onclick="closeReportEventModal()" aria-label="Close">✕</button>
      <div class="lp-form-eyebrow">Report event</div>
      <h3 class="lp-form-title">What's wrong with this event?</h3>
      <p class="lp-form-sub">If enough people report it, it's hidden automatically pending review.</p>
      <div id="report-event-reasons">
        ${REPORT_REASONS.map(
          (r, i) =>
            `<label class="report-reason-option"><input type="radio" name="report-reason" value="${escapeHtml(r)}" ${i === 0 ? "checked" : ""}/> ${escapeHtml(r)}</label>`,
        ).join("")}
      </div>
      <p id="report-event-error" class="gate-field-error" role="alert"></p>
      <button class="lp-claim-btn" onclick="submitEventReport('${eventId}')">
        <span class="lp-claim-btn-text">Submit report</span>
      </button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

function closeReportEventModal() {
  const ov = document.getElementById("report-event-overlay");
  if (ov) ov.remove();
}

async function submitEventReport(eventId) {
  const checked = document.querySelector('input[name="report-reason"]:checked');
  const reason = checked ? checked.value : null;
  const res = await reportEvent(eventId, reason);
  if (!res.ok) {
    const err = document.getElementById("report-event-error");
    if (err) {
      err.textContent = res.error || "Couldn't submit your report — try again.";
      err.classList.add("show");
    }
    return;
  }
  closeReportEventModal();
  showToast("Report submitted — thanks for flagging this", "success");
}

// Squad ticketing: a share link for one unclaimed ticket from a multi-ticket
// purchase. Opening it (see checkSquadClaim() at boot) calls claim_ticket(),
// which race-safely reassigns that specific ticket to whoever claims it.
// Self-serve ticket transfer: puts a fresh claim link on a ticket the caller
// owns (start_ticket_transfer RPC) and shares it the same way a Squad claim
// link works — claim_ticket() (pivot migration) already reassigns ownership
// to whoever opens it, transfer or squad-share alike.
// WhatsApp-first sharing for ticket links — the codex's "core viral
// acquisition engine": hijack an existing group chat rather than asking a
// friend to install anything first. wa.me works cross-platform (opens the
// app on mobile via its own redirect, WhatsApp Web on desktop) unlike the
// app-only whatsapp:// scheme, which only fires on mobile. Falls back to
// the native share sheet, then clipboard, only if the WhatsApp tab itself
// couldn't open (e.g. a popup blocker with no prior user gesture — shouldn't
// happen here since every call site is a direct click handler).
function shareTicketLink(title, text, url, copiedMsg) {
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
  const opened = window.open(waUrl, "_blank", "noopener");
  if (opened) return;
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`${text} ${url}`).then(
      () => showToast(copiedMsg, "success"),
      () => showToast("Couldn't copy — try again"),
    );
  } else {
    showToast("Share not supported on this browser");
  }
}

async function transferMyTicket(ticketCode, eventTitle) {
  const res = await startTicketTransfer(ticketCode);
  if (!res || !res.ok) {
    showToast(res?.error || "Could not start the transfer — try again", "error");
    return;
  }
  const url = `${location.origin}${location.pathname}?claim=${res.claim_code}`;
  const text = `Here's my ticket to ${eventTitle} on Cumulus — tap to claim it:`;
  shareTicketLink(
    "Transfer a Cumulus ticket",
    text,
    url,
    "Transfer link copied — send it to whoever's taking the ticket",
  );
}

function shareSquadTicket(code, eventTitle) {
  const url = `${location.origin}${location.pathname}?claim=${code}`;
  const text = `You're on my squad for ${eventTitle} on Cumulus — tap to claim your ticket:`;
  shareTicketLink("Claim your Cumulus ticket", text, url, "Claim link copied");
}

// Runs once at boot: if the URL carries a Squad claim link (?claim=CODE),
// claim it for whoever is signed in and strip the param from the URL.
async function checkSquadClaim() {
  const params = new URLSearchParams(location.search);
  const code = params.get("claim");
  if (!code) return;
  history.replaceState(null, "", location.pathname);
  if (!state.userId) return; // claimed after sign-in isn't wired up — keep simple for now
  const res = await claimTicket(code);
  if (res && res.ok) {
    showToast("Ticket claimed — welcome to the squad!", "success");
    await loadMyTickets();
    renderView();
  } else {
    showToast("That claim link isn't valid or was already used.", "error");
  }
}

// Blueprint "Magic Link" flow: shares ONE group link (event_squads.id)
// rather than a code per ticket — whoever opens it grabs whichever seat is
// still free (claim_group_ticket(), race-safe server-side).
function shareSquadGroupLink(squadId, eventTitle, seatsOpen) {
  const url = `${location.origin}${location.pathname}?squad=${squadId}`;
  const text = `You're on my squad for ${eventTitle} on Cumulus — tap to claim your ticket:`;
  shareTicketLink("Claim your Cumulus ticket", text, url, "Squad link copied");
}

// Companion to checkSquadClaim() for the group-link flow. Deliberately does
// NOT bail when signed out (unlike checkSquadClaim's ?claim= case) — the
// whole point of the blueprint's Magic Link is that a friend with no
// Cumulus account yet can still claim. If there's no session, the URL
// param is simply left in place (this is a static SPA with no real
// navigation, so it survives untouched) and the landing gate is nudged
// into signup mode; once verifyGateCode()/enterApp() completes and
// initApp() calls this again, state.userId now exists and the claim goes
// through on that second pass.
async function checkSquadGroupClaim() {
  const params = new URLSearchParams(location.search);
  const squadId = params.get("squad");
  if (!squadId) return;
  if (!state.userId) return; // resumed after sign-up — see nudgeGateForSquadClaim()
  history.replaceState(null, "", location.pathname);
  const res = await claimGroupTicket(squadId);
  if (res && res.ok) {
    showToast("Ticket claimed — welcome to the squad! 🎉", "success");
    await loadMyTickets();
    renderView();
  } else {
    const reason =
      res?.error === "no_tickets_remaining"
        ? "All the seats in that squad have already been claimed."
        : res?.error === "already_claimed"
          ? "You've already got a ticket from this squad."
          : "That squad link isn't valid.";
    showToast(reason, "error");
  }
}

// Called once from renderGate() when a ?squad= link lands on a signed-out
// visitor — auto-opens the sign-up modal with claim-specific copy so the
// person doesn't have to figure out on their own that signing up is how
// they get their ticket.
function nudgeGateForSquadClaim() {
  const params = new URLSearchParams(location.search);
  if (!params.get("squad")) return;
  showLpSignup();
  const title = document.getElementById("gate-form-title");
  const sub = document.getElementById("gate-form-sub");
  const label = document.getElementById("gate-claim-label");
  if (title) title.textContent = "Claim your ticket";
  if (sub)
    sub.textContent =
      "Enter your email — we'll send a 6-digit code, then your ticket is yours.";
  if (label) label.textContent = "Claim my ticket →";
}

// Host credibility + follow, shown inline in the event byline. The events-
// hosted count is computed from EVENTS actually loaded this session (real
// data, not a fabricated backend stat) and only shown once it's meaningful.
function renderHostByline(ev) {
  const hostKey = ev.hostId || ev.host;
  const hostCount = EVENTS.filter((e) => e.host === ev.host).length;
  const following = isFollowingHost(hostKey);
  const safeKey = escapeHtml(String(hostKey)).replace(/'/g, "&#39;");
  const safeName = escapeHtml(ev.host).replace(/'/g, "&#39;");
  // Only claim "reviewed" for a real DB-backed host (went through the actual
  // approval flow) — never shown for hostId-less fixture/test data, so this
  // is never a fabricated trust signal.
  const reviewed = ev.hostId != null;
  return `<span class="detail-host-byline">
    <span>Hosted by <button type="button" class="host-byline-link" onclick="openHostProfile('${safeKey}','${safeName}')">${escapeHtml(ev.host)}</button>${hostCount >= 2 ? ` · ${hostCount} events hosted` : ""}${reviewed ? ` <span class="host-reviewed-badge" title="Host reviewed by Cumulus">${checkIconSvg(11)} Reviewed</span>` : ""}</span>
    ${reviewed ? `<button class="btn-follow-host${following ? " following" : ""}" onclick="toggleFollowHost('${safeKey}','${safeName}')">${following ? "Following" : "Follow"}</button>` : ""}
  </span>`;
}

// ── Host Profile ──────────────────────────────────────────────────────────
// Eventbrite-style organizer page, built only from data that's actually
// real: events hosted, tickets/attendees across those events (from EVENTS
// loaded this session — same "real data only" convention as hostCount
// above), the real cross-user follower count (public.host_follows), and
// the existing Reviewed badge. No star rating (no reviews/ratings model
// exists anywhere in this schema) — showing one would be a fabricated
// trust signal.
function openHostProfile(hostKey, hostName) {
  pushNav();
  state.selectedHostKey = hostKey;
  state.selectedHostName = hostName;
  state.viewedHostAvatarUrl = null;
  state.viewedHostCoverUrl = null;
  state.viewedHostMemberSince = null;
  state.viewedHostFollowerCount = null;
  state.view = "host-profile";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
  // hostKey is only a real users.id (so these lookups are possible) for
  // reviewed hosts — legacy events store a bare name string in e.host with
  // no linked account. Both fetched in the background so nav never blocks
  // on them; only re-renders if still on this same host's page once they
  // resolve.
  const isRealHost = EVENTS.some((e) => e.hostId === hostKey);
  if (!isRealHost) return;
  fetchHostProfileExtras(hostKey).then((profile) => {
    if (state.view !== "host-profile" || state.selectedHostKey !== hostKey)
      return;
    state.viewedHostAvatarUrl = profile?.avatar_url || null;
    state.viewedHostCoverUrl = profile?.cover_url || null;
    state.viewedHostMemberSince = profile?.created_at || null;
    renderView();
  });
  getHostFollowerCount(hostKey).then((count) => {
    if (state.view !== "host-profile" || state.selectedHostKey !== hostKey)
      return;
    state.viewedHostFollowerCount = count;
    renderView();
  });
}

// Big square card for the host profile's horizontally-scrolling event row —
// deliberately a different, larger format from eventListCardHtml's compact
// list rows (Calendar/search results): this is a browsing surface for one
// host's own lineup, closer to how a portfolio or gallery presents a body of
// work, so each event gets real visual weight instead of a dense row.
function hostEventBigCardHtml(ev) {
  const c = CATS[ev.category] || { color: "var(--accent)", textColor: "#fff" };
  const price = eventPrice(ev);
  const img = ev.photoUrl || ev.nightShotUrl || catImg(ev.category);
  return `<button type="button" class="host-event-card" style="--corner:${c.color};" onclick="openEvent('${ev.id}')">
    <div class="host-event-card-img" style="background-image:url('${img}');">
      <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};position:absolute;top:10px;left:10px;margin-bottom:0;">${ev.category}</span>
    </div>
    <div class="host-event-card-body">
      <div class="host-event-card-title">${escapeHtml(ev.title)}</div>
      <div class="host-event-card-meta">${escapeHtml(ev.date)} · ${escapeHtml(ev.time)}</div>
      <div class="host-event-card-price">${price ? `From £${price}` : "Free"}</div>
    </div>
  </button>`;
}

// Deterministic 2-letter monogram from a host's display name — "Nova
// Collective" -> "NC", a single-word name -> its first two letters. Used for
// the avatar placeholder in place of a real photo, since no avatar_url (or
// any host-facing photo field) exists anywhere in the schema yet — see
// PRODUCT.md/ARCHITECTURE.md for the real-data-only convention this follows.
function hostInitials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function _memberSinceLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Member since ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}

function renderHostProfile() {
  const hostKey = state.selectedHostKey;
  const hostName = state.selectedHostName;
  if (!hostKey || !hostName)
    return `<div class="empty-state">Host not found.</div>`;
  const hostEvents = EVENTS.filter(
    (e) => (e.hostId || e.host) === hostKey || e.host === hostName,
  );
  const reviewed = hostEvents.some((e) => e.hostId != null);
  const totalAttendees = hostEvents.reduce(
    (sum, e) => sum + attendeesFor(e.id).length,
    0,
  );
  const upcoming = hostEvents
    .filter((e) => {
      const st = eventStatus(e);
      return (st === "live" || st === "upcoming") && e.status !== "cancelled";
    })
    .sort((a, b) => a.startsAt - b.startsAt);
  const following = isFollowingHost(hostKey);
  const safeKey = escapeHtml(String(hostKey)).replace(/'/g, "&#39;");
  const safeName = escapeHtml(hostName).replace(/'/g, "&#39;");
  const avatarHtml = state.viewedHostAvatarUrl
    ? `<div class="host-profile-avatar host-profile-avatar-photo"><img src="${state.viewedHostAvatarUrl}" alt=""/></div>`
    : `<div class="host-profile-avatar">${hostInitials(hostName)}</div>`;
  const coverStyle = state.viewedHostCoverUrl
    ? ` style="background-image:url('${state.viewedHostCoverUrl}');background-size:cover;background-position:center;"`
    : "";
  const memberSince = _memberSinceLabel(state.viewedHostMemberSince);
  // Follower count resolves async (getHostFollowerCount) — null on first
  // paint means "still loading", not "zero", so the stat card shows a
  // placeholder dash rather than a wrong number that then jumps.
  const followerCount = state.viewedHostFollowerCount;

  const statsHtml = `<div class="host-stats-row">
    <div class="host-stat"><div class="host-stat-num">${hostEvents.length}</div><div class="host-stat-label">Event${hostEvents.length !== 1 ? "s" : ""} hosted</div></div>
    <div class="host-stat"><div class="host-stat-num">${totalAttendees}</div><div class="host-stat-label">Attendee${totalAttendees !== 1 ? "s" : ""}</div></div>
    <div class="host-stat"><div class="host-stat-num">${followerCount == null ? "–" : followerCount}</div><div class="host-stat-label">Follower${followerCount === 1 ? "" : "s"}</div></div>
  </div>`;

  const upcomingHtml = upcoming.length
    ? `<div class="host-event-row">${upcoming.map(hostEventBigCardHtml).join("")}</div>`
    : `<div class="map-empty-card" role="status" style="max-width:100%;margin:0 auto;">
        <div class="me-title">Nothing upcoming right now</div>
        <div class="me-sub">${escapeHtml(hostName)} doesn't have any upcoming events listed at the moment.</div>
      </div>`;

  return `<button class="back-btn host-profile-back" onclick="goBack()">←</button>
    <div class="host-profile-cover"${coverStyle}></div>
    <div class="host-profile-avatar-wrap">${avatarHtml}</div>
    <div class="host-profile-header">
      <div class="host-profile-identity">
        <h2>${escapeHtml(hostName)}${reviewed ? ` <span class="host-reviewed-badge" title="Host reviewed by Cumulus">${checkIconSvg(12)} Reviewed</span>` : ""}</h2>
        <p>Event host</p>
        ${memberSince ? `<p class="host-profile-member-since">${memberSince}</p>` : ""}
      </div>
      ${
        reviewed
          ? `<button class="btn-follow-host${following ? " following" : ""}" onclick="toggleFollowHost('${safeKey}','${safeName}')">${following ? "Following" : "Follow"}</button>`
          : ""
      }
    </div>
    ${statsHtml}
    <div class="section-title">Upcoming events</div>
    ${upcomingHtml}`;
}

function renderDetail(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return `<div class="empty-state">Event not found.</div>`;
  const c = CATS[ev.category];
  const attendees = attendeesFor(id);
  const status = eventStatus(ev);
  const ticket = getTicketForEvent(id);
  const price = eventPrice(ev);
  const spacesLeft = ev.capacity
    ? Math.max(0, ev.capacity - attendees.length)
    : null;
  const isFull = spacesLeft !== null && spacesLeft <= 0 && !ticket;
  const statusChip =
    status === "live"
      ? `<button class="live-chip" style="border:none;background:none;cursor:pointer;padding:0;" onclick="document.getElementById('going-section')?.scrollIntoView({behavior:'smooth'})"><span class="dot"></span>Live now</button>`
      : `<span class="upcoming-chip">${status === "past" ? "Ended" : "Upcoming"}</span>`;
  const capBadge = ev.capacity
    ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text) !important;border:1px solid var(--line);margin-left:6px;font-size:10px;">${spacesLeft} spaces left</span>`
    : "";
  const priceBadge = price
    ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text) !important;border:1px solid var(--line);margin-left:6px;font-size:10px;">From £${price}</span>`
    : `<span class="event-badge" style="background:#14713622;color:#147136 !important;border:1px solid #14713644;margin-left:6px;font-size:10px;">Free</span>`;
  let bookBtn = "";
  if (ev.status === "hidden") {
    // Auto-hidden by the community-report trigger (3+ unique reporters) —
    // pending an admin's review, not a host-initiated cancellation, so
    // existing tickets/bookings are left untouched in case it's restored.
    bookBtn = `<div style="background:#b3261e18;border:1px solid #b3261e55;color:#b3261e;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700;text-align:center;">This event has been reported by the community and is under review.</div>`;
  } else if (ev.status === "cancelled") {
    bookBtn = `<div style="background:#b3261e18;border:1px solid #b3261e55;color:#b3261e;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700;text-align:center;">This event was cancelled${ticket ? " — your ticket has been refunded." : "."}</div>`;
  } else if (ticket) {
    bookBtn = `<button class="btn" style="background:transparent;border:2px solid #147136;color:#147136;box-shadow:none;width:100%;" onclick="openViewTicket('${id}')">${checkIconSvg(15)} You have a ticket — View it</button>`;
  } else if (status === "past") {
    // Ended events are locked — never bookable, no matter capacity/tier
    // state. Ticket-holders still get the branch above (their own record
    // stays viewable); everyone else sees this instead of a live Book Now.
    bookBtn = `<div style="background:var(--surface-2);border:1px solid var(--line);color:var(--text-muted);border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700;text-align:center;">This event has ended.</div>`;
  } else if (isFull) {
    bookBtn = `<button class="btn" style="background:var(--surface-2);color:var(--text-muted);cursor:not-allowed;width:100%;">Sold Out</button>`;
  } else {
    bookBtn = `<button class="btn" style="background:${c.color};color:#fff;width:100%;font-size:15px;" onclick="openBook('${id}')">${price ? `Book Now · From £${price}` : "Register Free"} →</button>`;
  }
  const going = attendees.includes(state.profileName);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="panel detail-card" style="--corner:${c.color};">
      <div class="detail-hero" style="background-image:url('${ev.photoUrl || catImg(ev.category)}');">
        <button class="detail-share-btn detail-report-btn" onclick="openReportEventModal('${ev.id}')" aria-label="Report event"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4a1 1 0 0 1 1-1h11l-1.5 5L18 13H6"/></svg></button>
        <button class="detail-share-btn" onclick="shareEvent('${ev.id}')" aria-label="Share event"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4"/></svg></button>
      </div>
      <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};">${ev.category}</span>${statusChip}${capBadge}${priceBadge}
      <h2 class="detail-title">${ev.title}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:700;color:${c.textColor};">📅 ${ev.date}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);">· ${ev.time}</span>
      </div>
      <div class="detail-meta-row"><span>${ev.venue}${ev.area ? `, ${ev.area}` : ""}</span>${renderHostByline(ev)}</div>
      <div class="detail-desc">${ev.desc}</div>
      ${bookBtn}
      <div class="attendee-section">
        <h3>${attendees.length} going${ev.capacity ? ` (Limit ${ev.capacity})` : ""}</h3>
        <div class="attendee-list">${
          attendees.length
            ? attendees
                .map(
                  (n) =>
                    `<div class="attendee-chip"><div class="avatar" style="margin-left:0">${initials(n)}</div><span>${escapeHtml(n)}</span></div>`,
                )
                .join("")
            : `<span style="color:var(--text-muted);font-size:13px;">No bookings yet.</span>`
        }</div>
      </div>
      ${ev.hostId === state.userId && ev.status !== "hidden" ? `<div style="margin-top:10px;"><button class="btn btn-outline" style="width:100%;" onclick="inviteMyPastAttendees('${id}','${escapeHtml(ev.title).replace(/'/g, "&#39;")}')">📣 Invite past attendees</button></div>` : ""}
      ${
        // Once reported+hidden, only an admin may delete it — a host losing
        // write access to their own flagged event (see events_modify_own/
        // events_delete_own) is the whole point of the report system.
        state.isAdmin || (ev.hostId === state.userId && ev.status !== "hidden")
          ? `<div style="margin-top:10px;"><button class="btn btn-outline" style="color:#E23B3B;border-color:#E23B3B;width:100%;" onclick="if(confirm('Delete this event permanently?')) deleteEvent('${id}')">Delete Event</button></div>`
          : ""
      }
    </div>`;
}

// Blueprint B2B2C flywheel: "One-Click Blast" — invite-past-attendees
// re-derives the recipient list server-side; this just tells it which
// event to promote and reports the result.
async function inviteMyPastAttendees(eventId, eventTitle) {
  if (
    !confirm(
      `Email everyone who's attended one of your past events about "${eventTitle}"?`,
    )
  )
    return;
  showToast("Sending invites…", "info");
  const res = await invitePastAttendees(eventId);
  if (!res || res.error) {
    showToast(res?.error || "Could not send invites — try again", "error");
    return;
  }
  showToast(
    res.sent > 0
      ? `Invited ${res.sent} past attendee${res.sent !== 1 ? "s" : ""}!`
      : res.note || "No past attendees to invite yet",
    res.sent > 0 ? "success" : "info",
  );
}

async function deleteEvent(id) {
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) {
    showToast("Error deleting event: " + error.message, "error");
    return;
  }
  showToast("Event deleted", "success");
  EVENTS = EVENTS.filter((e) => String(e.id) !== String(id));
  goBack();
}

/* ══════════════════════════════════════════════════
   REPORTED EVENTS — admin only. Community-flagged events land here once
   3+ unique users have reported them (handle_event_report() trigger sets
   status='hidden') — the zero-cost replacement for pre-publish AI image
   moderation. Same review-card pattern as event approvals: Restore
   dismisses the reports and un-hides the event; Delete removes it (and
   its reports, via ON DELETE CASCADE) for good.
   ══════════════════════════════════════════════════ */
function openReportedEvents() {
  pushNav();
  state.view = "reported-events";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderReportedEvents() {
  const container = document.getElementById("view-container");
  container.innerHTML = `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Reported Events</h2>
      <p>Auto-hidden after 3+ unique community reports</p>
    </div>
    <div id="reportedev-content">
      <div class="review-empty"><div class="review-empty-icon">🚩</div><div>Loading reports…</div></div>
    </div>`;
  setTimeout(loadAndRenderReportedEvents, 0);
}

async function loadAndRenderReportedEvents() {
  const content = document.getElementById("reportedev-content");
  if (!content) return;
  try {
    const { data: hidden, error } = await sb
      .from("events")
      .select("*")
      .eq("status", "hidden")
      .order("start_time", { ascending: true });
    if (error) throw error;
    if (!hidden || !hidden.length) {
      content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No events currently reported.</div></div>`;
      return;
    }
    const ids = hidden.map((e) => e.id);
    const { data: reports } = await sb
      .from("event_reports")
      .select("event_id, reason, created_at")
      .in("event_id", ids);
    content.innerHTML = hidden
      .map((ev) =>
        _buildReportedEventCard(
          ev,
          (reports || []).filter((r) => r.event_id === ev.id),
        ),
      )
      .join("");
  } catch (err) {
    content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">⚠️</div><div style="font-weight:700;margin-bottom:4px;">Error Loading Panel</div><div>${escapeHtml(err.message)}</div></div>`;
  }
}

function _buildReportedEventCard(ev, reports) {
  const id = escapeHtml(String(ev.id));
  let when = "";
  if (ev.start_time) {
    const d = new Date(ev.start_time);
    if (!isNaN(d)) {
      when = d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  const reasonsList = reports.length
    ? `<div class="review-detail"><div class="review-detail-lbl">${reports.length} report${reports.length === 1 ? "" : "s"}</div><div class="review-detail-val">${reports.map((r) => escapeHtml(r.reason || "No reason given")).join(" · ")}</div></div>`
    : "";
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(ev.title || "Untitled event")}</div>
        <div class="review-card-email">${escapeHtml(ev.host_name || "Unknown host")}</div>
      </div>
      <span class="review-status-badge hidden">hidden</span>
    </div>
    ${when ? `<div class="review-detail"><div class="review-detail-lbl">When</div><div class="review-detail-val">${when}</div></div>` : ""}
    ${ev.venue ? `<div class="review-detail"><div class="review-detail-lbl">Venue</div><div class="review-detail-val">${escapeHtml(ev.venue)}${ev.area ? ", " + escapeHtml(ev.area) : ""}</div></div>` : ""}
    ${reasonsList}
    <div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="restoreReportedEvent('${id}')">Restore</button>
      <button class="btn btn-outline btn-small review-reject-btn" style="flex:1;" onclick="if(confirm('Delete this event permanently?')) deleteReportedEvent('${id}')">Delete permanently</button>
    </div>
  </div>`;
}

// Dismisses every report on the event and restores it to 'active'. Reports
// are cleared (not just the status flipped) because handle_event_report()
// counts ALL rows for the event — leaving old ones in place would re-hide
// it the instant a 4th report ever landed, even years later.
async function restoreReportedEvent(id) {
  try {
    await sb.from("event_reports").delete().eq("event_id", id);
    const { error } = await sb
      .from("events")
      .update({ status: "active" })
      .eq("id", id);
    if (error) throw error;
    showToast("Event restored", "success");
  } catch (e) {
    showToast("Couldn't restore that event — try again", "error");
    return;
  }
  await loadAndRenderReportedEvents();
}

async function deleteReportedEvent(id) {
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) {
    showToast("Error deleting event: " + error.message, "error");
    return;
  }
  showToast("Event deleted", "success");
  EVENTS = EVENTS.filter((e) => String(e.id) !== String(id));
  await loadAndRenderReportedEvents();
}


// Follow a host to flag interest in their future events — a real
// cross-user edge (public.host_follows), not a local bookmark, so it can
// back an honest follower count on the host's own profile page.
// isFollowingHost() reads the in-memory cache loaded once at boot
// (loadMyFollows(), state.followedHostIds) so it stays synchronous — the
// event-detail byline renders synchronously and can't await a DB call
// mid-render. toggleFollowHost() updates that cache optimistically and
// fires the real write in the background.
function isFollowingHost(hostKey) {
  return (state.followedHostIds || []).includes(hostKey);
}
async function toggleFollowHost(hostKey, hostName) {
  if (!state.userId) {
    showToast("Sign in to follow hosts", "error");
    return;
  }
  const list = state.followedHostIds || [];
  const idx = list.indexOf(hostKey);
  const nowFollowing = idx === -1;
  if (nowFollowing) list.push(hostKey);
  else list.splice(idx, 1);
  state.followedHostIds = list;
  renderView();
  const ok = nowFollowing
    ? await followHost(hostKey)
    : await unfollowHost(hostKey);
  if (!ok) {
    // Roll back on failure — the optimistic toggle above didn't stick.
    state.followedHostIds = nowFollowing
      ? state.followedHostIds.filter((id) => id !== hostKey)
      : [...state.followedHostIds, hostKey];
    showToast("Couldn't reach the server — try again", "error");
    renderView();
    return;
  }
  showToast(
    nowFollowing ? `Following ${hostName}` : `Unfollowed ${hostName}`,
    "success",
  );
}

