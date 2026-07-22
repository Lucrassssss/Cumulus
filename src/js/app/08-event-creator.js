// ── Event flyer upload (Codex Page 2 / Page 5) ──────────────────────────────
// Client-side canvas re-encode before upload — no library, matching this
// app's "no build step" constraint. A real flyer replaces the category
// stock photo (catImg()) wherever an event's image renders; no flyer just
// falls back to that stock photo exactly as before, so this is additive.
// { square: true } (used by uploadAvatarPhoto, services.js) center-crops to
// a 1:1 canvas first — avatars render circular/square everywhere, so a
// non-square source would otherwise get squashed rather than cropped.
function compressImageFile(file, maxDim = 1600, quality = 0.75, opts = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      let sx = 0,
        sy = 0,
        sw = width,
        sh = height;
      if (opts.square) {
        sw = sh = Math.min(width, height);
        sx = (width - sw) / 2;
        sy = (height - sh) / 2;
        width = height = Math.min(sw, maxDim);
      } else if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

let _hostFlyerBlob = null;
async function handleHostFlyerSelect(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const preview = document.getElementById("host-flyer-preview");
  if (preview)
    preview.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">Compressing…</span>`;
  try {
    _hostFlyerBlob = await compressImageFile(file);
    const url = URL.createObjectURL(_hostFlyerBlob);
    if (preview) {
      preview.style.border = "none";
      preview.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;"/>`;
    }
  } catch (e) {
    _hostFlyerBlob = null;
    showToast("Couldn't process that image — try another", "error");
    if (preview) {
      preview.style.border = "2px dashed var(--line)";
      preview.innerHTML = `<span style="font-size:22px;">📷</span><span>Tap to upload a flyer photo</span>`;
    }
  }
}

// Uploads to the caller's own folder in the event-flyers bucket (RLS scopes
// writes to auth.uid() — see the migration) and returns its public URL, or
// null if there's nothing to upload or the upload fails (never blocks event
// submission; the category stock photo is always a safe fallback).
async function uploadHostFlyer() {
  if (!_hostFlyerBlob || !state.userId) return null;
  try {
    const path = `${state.userId}/${Date.now()}.jpg`;
    const { error } = await sb.storage
      .from("event-flyers")
      .upload(path, _hostFlyerBlob, { contentType: "image/jpeg", upsert: false });
    if (error) return null;
    const { data } = sb.storage.from("event-flyers").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    return null;
  }
}

function collectHostPriceTiers() {
  const toggle = document.getElementById("host-tiered-toggle");
  if (!toggle || !toggle.checked) return null;
  const rows = [
    { id: "early", label: "Early Bird" },
    { id: "general", label: "General" },
    { id: "final", label: "Final" },
  ];
  const tiers = [];
  for (const r of rows) {
    const priceEl = document.getElementById(`tier-${r.id}-price`);
    const cutoffEl = document.getElementById(`tier-${r.id}-cutoff`);
    const price = priceEl && priceEl.value ? parseFloat(priceEl.value) : null;
    if (price == null || Number.isNaN(price)) continue;
    const cutoff = cutoffEl && cutoffEl.value ? new Date(cutoffEl.value).toISOString() : null;
    tiers.push({ label: r.label, price, cutoff });
  }
  return tiers.length ? tiers : null;
}

async function submitHostEvent() {
  const title = (document.getElementById("host-title")?.value || "").trim();
  const cat = document.getElementById("host-cat")?.value;
  const startDate = document.getElementById("host-start-date")?.value;
  const startTime = document.getElementById("host-start-time")?.value;
  const endDate = document.getElementById("host-end-date")?.value;
  const endTime = document.getElementById("host-end-time")?.value;
  const startVal = startDate && startTime ? `${startDate}T${startTime}` : "";
  const endVal = endDate && endTime ? `${endDate}T${endTime}` : "";
  const areaName = (document.getElementById("host-area")?.value || "").trim();
  const venue = (document.getElementById("host-venue")?.value || "").trim();
  const capStr = document.getElementById("host-capacity")?.value;
  const priceStr = document.getElementById("host-price")?.value;
  let priceVal = priceStr ? parseFloat(priceStr) : 0;
  const priceTiers = collectHostPriceTiers();
  if (priceTiers) {
    // price column stays populated with today's active tier — a fallback
    // for any code path that hasn't been updated to read price_tiers, and
    // what shows in admin/ops tooling that only ever looked at `price`.
    const active = activeTicketTier({ priceTiers });
    priceVal = active ? Number(active.price) || 0 : priceVal;
  }
  const desc = (document.getElementById("host-desc")?.value || "").trim();
  if (!title || !startVal || !endVal || !venue || !capStr) {
    showToast(
      "Please fill in title, date & time, venue, and capacity.",
      "error",
    );
    return;
  }
  const stDate = new Date(startVal),
    enDate = new Date(endVal);
  if (stDate >= enDate) {
    showToast("End time must be after start time.", "error");
    return;
  }

  // Disable before the (potentially slow) flyer upload starts, not just
  // once we're inside one of the two insert branches below — otherwise the
  // button stayed clickable for the whole upload and a second click could
  // race a duplicate submission.
  const submitBtn = document.getElementById("host-submit-btn");
  const submitBtnOrigLabel = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading flyer…";
  }
  // Upload before either insert path so both the admin-direct and
  // pending_events rows get the same photo_url — a failed/skipped upload
  // just leaves it null, and the category stock photo covers the rest.
  const photoUrl = await uploadHostFlyer();
  if (submitBtn) submitBtn.textContent = submitBtnOrigLabel;

  // Every event is public. Admin submissions publish immediately; everyone
  // else goes via pending_events for a quick review (see the notify-admin
  // edge function, which emails on every new pending row).
  if (state.isAdmin) {
    const pubAddress =
      document.getElementById("host-address-search")?.value || "";
    const abtn = document.getElementById("host-submit-btn");
    if (abtn) {
      abtn.disabled = true;
      abtn.textContent = "Publishing…";
    }
    const { data: aData, error: aErr } = await sb
      .from("events")
      .insert({
        title,
        category: cat,
        host_id: state.userId,
        host_name: state.profileName,
        venue,
        area: areaName || "London",
        address: pubAddress,
        lat: newEventLat,
        lon: newEventLon,
        start_time: stDate.toISOString(),
        end_time: enDate.toISOString(),
        description: desc,
        capacity: parseInt(capStr, 10),
        price: priceVal,
        price_tiers: priceTiers,
        photo_url: photoUrl,
      })
      .select()
      .single();
    if (abtn) {
      abtn.disabled = false;
      abtn.textContent = "Publish event →";
    }
    if (aErr) {
      showToast("Failed to publish event — " + aErr.message, "error");
      return;
    }
    // Inject into local EVENTS array so map updates immediately
    const aEv = {
      id: aData.id,
      title: aData.title,
      category: aData.category,
      host: aData.host_name,
      hostId: aData.host_id,
      venue: aData.venue,
      area: aData.area,
      address: aData.address,
      lat: aData.lat,
      lon: aData.lon,
      startTime: aData.start_time,
      endTime: aData.end_time,
      desc: aData.description,
      capacity: aData.capacity,
      price: priceVal,
      priceTiers: aData.price_tiers || priceTiers,
      photoUrl: aData.photo_url || photoUrl,
    };
    computeEventDates(aEv);
    EVENTS.push(aEv);
    await sb
      .from("rsvps")
      .insert({
        event_id: aData.id,
        user_id: state.userId,
        user_name: state.profileName,
      })
      .catch(() => {});
    state.rsvps[aData.id] = [state.profileName];
    _hostFlyerBlob = null;
    showToast("Event published live to the map!", "success");
    openEvent(aData.id);
    return;
  }

  // Non-admin: queue in pending_events for owner approval
  const pubAddress =
    document.getElementById("host-address-search")?.value || "";
  const pending = {
    title,
    category: cat,
    host_id: state.userId || null,
    host_name: state.profileName || "",
    host_email: state.profileEmail || "",
    venue,
    area: areaName || "London",
    address: pubAddress,
    lat: newEventLat,
    lon: newEventLon,
    start_time: stDate.toISOString(),
    end_time: enDate.toISOString(),
    description: desc,
    capacity: parseInt(capStr, 10),
    price: priceVal,
    price_tiers: priceTiers,
    photo_url: photoUrl,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const pbtn = document.getElementById("host-submit-btn");
  if (pbtn) {
    pbtn.disabled = true;
    pbtn.textContent = "Submitting…";
  }
  let saved = false;
  try {
    const { error } = await sb.from("pending_events").insert(pending);
    if (!error) saved = true;
  } catch (e) {}
  if (!saved) {
    try {
      const arr = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      );
      arr.push({ ...pending, id: "local_" + Date.now() });
      localStorage.setItem("pending_events_local", JSON.stringify(arr));
      saved = true;
    } catch (e) {}
  }
  if (pbtn) {
    pbtn.disabled = false;
    pbtn.textContent = "Submit for review →";
  }
  showToast(
    saved
      ? "Submitted for review — we'll approve it shortly."
      : "Could not submit — please try again.",
    saved ? "success" : "error",
  );
  if (saved) {
    _hostFlyerBlob = null;
    state.view = "browse";
    renderNav();
    renderView();
  }
}

function showMapLayer(visible) {
  ["main-map", "map-filters", "map-caption-bar"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
  });
  const fab = document.getElementById("owner-fin-fab");
  if (fab)
    fab.style.display =
      visible && state.profileEmail === "gondoxml@gmail.com" ? "block" : "none";
}

// ═══════════════════════════════════════════════════════
// OWNER FINANCIAL DASHBOARD
// ═══════════════════════════════════════════════════════

const OD_PRESETS = {
  Launch: {
    ev: 15,
    tx: 25,
    pr: 12,
    fep: 20,
    frp: 6,
    fev: 5,
    frv: 20,
    cb: 0.3,
    drop: 3,
    ctx: "<strong>Launch:</strong> Solo founder. Tier 1 events (£12 avg). Pre-VAT. Connect Standard — zero per-host fees. 48hr escrow hold is the fraud buffer.",
    cs: { cost: 0, l: "Not yet needed" },
    eng: { cost: 0, l: "You are the engineer" },
  },
  Traction: {
    ev: 80,
    tx: 35,
    pr: 14,
    fep: 120,
    frp: 7,
    fev: 20,
    frv: 35,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Traction:</strong> ~80 paid events/mo. £14 avg = Tier 1 (£1.50 fee). Monitor VAT threshold. In-app refund UX deflects chargebacks. Private + vetted free events.",
    cs: { cost: 1050, l: "Part-time CS (50%)" },
    eng: { cost: 350, l: "Engineer retainer 8 hrs/mo" },
  },
  Scaling: {
    ev: 350,
    tx: 50,
    pr: 18,
    fep: 500,
    frp: 7,
    fev: 80,
    frv: 40,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Scaling:</strong> £18 avg = Tier 2 threshold area. Approaching VAT at this volume. Connect Standard saves ~£2/mo per host vs Express.",
    cs: { cost: 2100, l: "Full-time CS rep" },
    eng: { cost: 4500, l: "Engineer pt contract 3d/wk" },
  },
  Dominance: {
    ev: 1500,
    tx: 75,
    pr: 22,
    fep: 2000,
    frp: 7,
    fev: 350,
    frv: 45,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Dominance:</strong> £22 avg = Tier 2 (£2.50 fee). VAT registered. Post-VAT net ~£1.67/ticket. Stripe revenue share negotiations should begin.",
    cs: { cost: 4200, l: "CS team × 2" },
    eng: { cost: 9000, l: "Senior engineer 5d/wk" },
  },
  CityLeader: {
    ev: 5000,
    tx: 90,
    pr: 22,
    fep: 6000,
    frp: 8,
    fev: 1000,
    frv: 50,
    cb: 0.4,
    drop: 3,
    ctx: "<strong>City Leader:</strong> 450k paid tickets/mo. VAT registered. Enterprise infra deals. Stripe Connect revenue share active.",
    cs: { cost: 18000, l: "Head of CS + 4 reps" },
    eng: { cost: 18000, l: "2 full-time engineers" },
  },
  London1: {
    ev: 12000,
    tx: 100,
    pr: 25,
    fep: 14000,
    frp: 8,
    fev: 2500,
    frv: 55,
    cb: 0.3,
    drop: 3,
    ctx: "<strong>London #1:</strong> 1.2M paid tickets/mo. Tier 2 fee (£2.50). VAT registered. Enterprise agreements across stack. Stripe Connect revenue share at maximum leverage.",
    cs: { cost: 45000, l: "CS team of 10 + manager" },
    eng: { cost: 50000, l: "Engineering team of 5" },
  },
  Custom: {
    ev: 80,
    tx: 35,
    pr: 14,
    fep: 120,
    frp: 7,
    fev: 20,
    frv: 35,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Custom:</strong> Adjust all inputs manually.",
    cs: { cost: 0, l: "Set manually" },
    eng: { cost: 0, l: "Set manually" },
  },
};
let _odCur = "Traction";

const _odGbp = (v) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(v) || 0);
const _odFmt = (v) =>
  v >= 1e6
    ? (v / 1e6).toFixed(1) + "M"
    : v >= 1e3
      ? (v / 1e3).toFixed(1) + "k"
      : Math.round(v).toString();

async function clearAllTestData(confirmed) {
  if (state.profileEmail !== "gondoxml@gmail.com") {
    showToast("Owner only", "error");
    return;
  }
  if (!confirmed) {
    showConfirm(
      "Wipe all test data?",
      "This deletes every row in users, events, rsvps, and tickets in Supabase. Seed events in the app are unaffected (they're hardcoded). Cannot be undone.",
      "Wipe everything",
      "clearAllTestData",
    );
    return;
  }
  showToast("Wiping…", "info");
  try {
    await Promise.all([
      sb.from("rsvps").delete().not("id", "is", null),
      sb.from("tickets").delete().not("id", "is", null),
    ]);
    await sb.from("events").delete().not("id", "is", null);
    await sb.from("users").delete().not("id", "is", null);
    showToast("All test data wiped. Signing out…", "success");
    setTimeout(() => resetProfile(true), 1200);
  } catch (err) {
    showToast("Wipe failed — check console", "error");
  }
}

// Admin: clear ONLY the users table (all accounts / emails). Events & other
// test data are left intact. Owner-only, test-environment convenience.
async function clearAllUsers(confirmed) {
  if (state.profileEmail !== "gondoxml@gmail.com") {
    showToast("Owner only", "error");
    return;
  }
  if (!confirmed) {
    if (
      !confirm(
        "Delete ALL user accounts (every email) from the users table? Events and other data are kept. This cannot be undone.",
      )
    )
      return;
  }
  showToast("Clearing user accounts…", "info");
  try {
    const { error } = await sb.from("users").delete().not("id", "is", null);
    if (error) throw error;
    showToast("All user accounts cleared. Signing out…", "success");
    setTimeout(() => resetProfile(true), 1200);
  } catch (err) {
    showToast("Clear failed — check console", "error");
  }
}

function od_tog(id) {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const h = wrap.querySelector("#od-sh-" + id),
    b = wrap.querySelector("#od-sb-" + id);
  if (!h || !b) return;
  const o = b.classList.contains("open");
  b.classList.toggle("open", !o);
  h.classList.toggle("open", !o);
  h.setAttribute("aria-expanded", String(!o));
}

function _odPlatformFee(pr) {
  if (pr <= 15)
    return { fee: 1.5, tier: 1, label: "Tier 1", badge: "badge-t1" };
  if (pr <= 40)
    return { fee: 2.5, tier: 2, label: "Tier 2", badge: "badge-t2" };
  if (pr <= 71)
    return { fee: 3.5, tier: 3, label: "Tier 3", badge: "badge-t3" };
  return { fee: 4.5, tier: 4, label: "Tier 4", badge: "badge-t4" };
}
function _odVatOnFee(fee, vatReg) {
  return vatReg ? fee / 6 : 0;
}
function _odStripeCost(total) {
  return total * 0.015 + 0.2;
}
function _odBarCol(p) {
  return p < 60 ? "#22C55E" : p < 85 ? "#E0B23C" : "#E24B4A";
}
function _odTierCls(p) {
  return p < 60 ? "tbadge tok" : p < 85 ? "tbadge twarn" : "tbadge tdanger";
}
function _odSetBar(g, id, p) {
  const el = g(id);
  if (el) {
    el.style.width = Math.min(p, 100) + "%";
    el.style.background = _odBarCol(Math.min(p, 100));
  }
}
function _odSetTier(g, id, l, p) {
  const el = g(id);
  if (el) {
    el.className = _odTierCls(Math.min(p, 100));
    el.textContent = l;
  }
}
function _odCalcSupa(r, m) {
  const o = r > 500000 || m > 50000;
  return {
    cost: o ? 20 : 0,
    rp: Math.min((r / 500000) * 100, 100),
    mp: Math.min((m / 50000) * 100, 100),
    over: o,
  };
}
function _odCalcMb(l) {
  if (l <= 50000) return { cost: 0, p: (l / 50000) * 100, t: "Free" };
  return {
    cost: Math.round(((l - 50000) / 1000) * 0.4 * 100) / 100,
    p: 100,
    t: "Paid",
  };
}
function _odCalcEm(e) {
  if (e <= 3000) return { cost: 0, p: (e / 3000) * 100, t: "Free" };
  if (e <= 50000) return { cost: 15, p: (e / 50000) * 100, t: "Starter" };
  return { cost: 35, p: (e / 100000) * 100, t: "Pro" };
}
function _odCalcVc(i) {
  if (i <= 1e6) return { cost: 0, p: (i / 1e6) * 100, t: "Free" };
  return { cost: 18, p: 100, t: "Pro" };
}

function od_renderStaff() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const st = (id, v) => {
    const el = g(id);
    if (el) el.textContent = v;
  };
  const p = OD_PRESETS[_odCur];
  const list = g("od-staff-list");
  if (!list) return;
  list.innerHTML = "";
  [
    { name: "CS team", data: p.cs },
    { name: "Engineering", data: p.eng },
  ].forEach((r) => {
    const el = document.createElement("div");
    el.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1E1F24;border-radius:10px;margin-bottom:6px;";
    const z = r.data.cost === 0;
    el.innerHTML =
      '<div><div style="font-size:12px;font-weight:500;color:#C5C6CB">' +
      r.name +
      '</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">' +
      r.data.l +
      '</div></div><div><div style="font-family:&quot;SF Mono&quot;,monospace;font-size:13px;font-weight:600;color:' +
      (z ? "#5F5E5A" : "#E24B4A") +
      '">' +
      _odGbp(r.data.cost) +
      "/mo</div></div>";
    list.appendChild(el);
  });
  const tot = p.cs.cost + p.eng.cost;
  st("od-staff-total", _odGbp(tot));
  st("od-shv-staff", _odGbp(tot) + "/mo");
}

function od_recalc() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const gv = (id) => {
    const el = g(id);
    return el ? Number(el.value) : 0;
  };
  const st = (id, v) => {
    const el = g(id);
    if (el) el.textContent = v;
  };

  const ev = gv("od-sl-ev"),
    tx = gv("od-sl-tx"),
    pr = gv("od-sl-pr");
  const fep = gv("od-sl-fe-p"),
    frp = gv("od-sl-fr-p"),
    fev = gv("od-sl-fe-v"),
    frv = gv("od-sl-fr-v");
  const cbRate = gv("od-sl-cb") / 100,
    dropRate = gv("od-sl-drop") / 100;

  st("od-lev", ev.toLocaleString());
  st("od-ltx", tx.toLocaleString());
  st("od-lpr", "£" + pr);
  st("od-lfe-p", fep.toLocaleString());
  st("od-lfr-p", Math.min(frp, 10));
  st("od-lfe-v", fev.toLocaleString());
  st("od-lfr-v", frv);
  st("od-lcb", gv("od-sl-cb").toFixed(1) + "%");
  st("od-ldrop", gv("od-sl-drop") + "%");
  st("od-shv-paid", ev.toLocaleString() + " events · £" + pr);

  const { fee, tier, label } = _odPlatformFee(pr);
  const checkoutPrice = pr + fee;
  const stripePerTx = _odStripeCost(checkoutPrice);
  const grossTix = ev * tx;
  const annFeeRev = grossTix * fee * 12;
  const vatReg = annFeeRev >= 90000;
  const vatPerTix = _odVatOnFee(fee, vatReg);
  const netFeePerTix = fee - vatPerTix - stripePerTx;
  const dropTix = Math.round(grossTix * dropRate);
  const paidTix = Math.max(0, grossTix - dropTix);

  // Tier box
  ["t1", "t2", "t3", "t4"].forEach((t, i) => {
    const el = g("od-tbr-" + t);
    if (el) el.className = "tb-row" + (tier === i + 1 ? " active" : "");
  });
  st("od-tb-tiern", tier);
  st("od-tb-host", "£" + pr.toFixed(2));
  const elFee = g("od-tb-fee");
  if (elFee) elFee.textContent = "£" + fee.toFixed(2);
  const elStr = g("od-tb-stripe");
  if (elStr) elStr.textContent = "-£" + stripePerTx.toFixed(2);
  const elVat = g("od-tb-vat");
  if (elVat)
    elVat.textContent = vatReg
      ? "-£" + vatPerTix.toFixed(2)
      : "£0.00 (pre-threshold)";
  st("od-tb-checkout", "£" + checkoutPrice.toFixed(2));
  const elNet = g("od-tb-net");
  if (elNet) {
    elNet.textContent =
      (netFeePerTix < 0 ? "-" : "") + "£" + Math.abs(netFeePerTix).toFixed(2);
    elNet.style.color =
      netFeePerTix < 0.2
        ? "#E24B4A"
        : netFeePerTix < 0.5
          ? "#E0B23C"
          : "#22C55E";
  }

  st("od-st-ptx", _odFmt(paidTix));
  st("od-st-fee", "£" + fee.toFixed(2));
  st("od-st-checkout", "£" + checkoutPrice.toFixed(2));

  // Revenue
  const grossFeeRev = paidTix * fee;
  const totalVat = paidTix * vatPerTix;
  const netFeeRev = grossFeeRev - totalVat;
  const totalStripe = paidTix * stripePerTx;
  const cbCount = Math.round(paidTix * cbRate);
  const cbCost = cbCount * 15;
  const gp = netFeeRev - totalStripe - cbCost;

  st("od-pl-pf", _odGbp(grossFeeRev));
  const pfNote = g("od-pf-note");
  if (pfNote)
    pfNote.textContent =
      _odFmt(paidTix) + " tickets × £" + fee.toFixed(2) + " (" + label + ")";
  const plVat = g("od-pl-vat");
  if (plVat) {
    plVat.textContent = vatReg ? "-" + _odGbp(totalVat) : "£0";
    plVat.className = "plv " + (vatReg ? "rd" : "dim");
  }
  const vatNote = g("od-vat-note");
  if (vatNote)
    vatNote.textContent = vatReg
      ? "Registered · annualised £" +
        Math.round(annFeeRev / 1000) +
        "k > £90k threshold"
      : "Pre-threshold · annualised £" +
        Math.round(annFeeRev / 1000) +
        "k / £90k";
  st("od-pl-netrev", _odGbp(netFeeRev));
  const plStr = g("od-pl-str");
  if (plStr) {
    plStr.textContent = "-" + _odGbp(totalStripe);
    plStr.className = "plv str";
  }
  const strNote = g("od-str-note");
  if (strNote)
    strNote.textContent =
      "1.5%+20p on £" +
      checkoutPrice.toFixed(2) +
      " × " +
      _odFmt(paidTix) +
      " txns";
  const plCb = g("od-pl-cb");
  if (plCb) {
    plCb.textContent = cbCount > 0 ? "-" + _odGbp(cbCost) : "£0";
    plCb.className = "plv " + (cbCount > 0 ? "rd" : "dim");
  }
  const cbNote = g("od-cb-note");
  if (cbNote)
    cbNote.textContent =
      cbCount > 0 ? cbCount + " disputes × £15" : "No disputes modelled";
  st("od-pl-gp", _odGbp(gp));

  // Infra
  const privRsvp = fep * Math.min(frp, 10),
    vetRsvp = fev * frv,
    totalFree = privRsvp + vetRsvp;
  const totalLoad = paidTix + totalFree;
  const freeRatio = totalLoad > 0 ? totalFree / totalLoad : 0;
  st("od-total-free", _odFmt(totalFree));
  st("od-load-ratio", Math.round(freeRatio * 100) + "% free");
  const lb = g("od-load-bar");
  if (lb) {
    lb.style.width = Math.min(freeRatio * 100, 100) + "%";
    lb.style.background = _odBarCol(Math.min((freeRatio / 0.6) * 100, 100));
  }
  st("od-shv-free", _odFmt(totalFree) + " free RSVPs/mo");

  const dbRows = totalLoad * 5,
    maus = Math.round(totalLoad * 0.6),
    mapLoads = paidTix * 2,
    emails = totalLoad * 1.5,
    inv = totalLoad * 8;
  const sb = _odCalcSupa(dbRows, maus),
    mb = _odCalcMb(mapLoads),
    em = _odCalcEm(emails),
    vc = _odCalcVc(inv);
  _odSetBar(g, "od-sb-b", sb.rp);
  _odSetTier(
    g,
    "od-sb-t",
    sb.over ? "Over free" : sb.rp > 60 ? "Near limit" : "Free",
    sb.rp,
  );
  st("od-sb-n", _odFmt(dbRows));
  const sbC = g("od-sb-c");
  if (sbC) {
    sbC.textContent = "£" + sb.cost;
    sbC.className = "uc " + (sb.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-mau-b", sb.mp);
  _odSetTier(
    g,
    "od-mau-t",
    sb.over ? "Over free" : sb.mp > 60 ? "Near limit" : "Free",
    sb.mp,
  );
  st("od-mau-n", _odFmt(maus) + " MAUs");
  _odSetBar(g, "od-mb-b", mb.p);
  _odSetTier(g, "od-mb-t", mb.t, mb.p);
  st("od-mb-n", _odFmt(mapLoads));
  const mbC = g("od-mb-c");
  if (mbC) {
    mbC.textContent = "£" + Math.round(mb.cost);
    mbC.className = "uc " + (mb.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-em-b", em.p);
  _odSetTier(g, "od-em-t", em.t, em.p);
  st("od-em-n", _odFmt(emails));
  const emC = g("od-em-c");
  if (emC) {
    emC.textContent = "£" + em.cost;
    emC.className = "uc " + (em.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-vc-b", vc.p);
  _odSetTier(g, "od-vc-t", vc.t, vc.p);
  st("od-vc-n", _odFmt(inv));
  const vcC = g("od-vc-c");
  if (vcC) {
    vcC.textContent = "£" + vc.cost;
    vcC.className = "uc " + (vc.cost > 0 ? "bad" : "ok");
  }
  const totalInfra = sb.cost + Math.round(mb.cost) + em.cost + vc.cost;
  st("od-infra-tot", "£" + totalInfra.toLocaleString());
  st("od-shv-infra", "£" + totalInfra + "/mo");
  const plSb = g("od-pl-sb");
  if (plSb) {
    plSb.textContent = sb.cost > 0 ? "-£" + sb.cost : "£0";
    plSb.className = "plv " + (sb.cost > 0 ? "am" : "dim");
  }
  const sbPl = g("od-sb-pl");
  if (sbPl) sbPl.textContent = sb.cost > 0 ? "Pro" : "Free";
  const plMb = g("od-pl-mb");
  if (plMb) {
    plMb.textContent = mb.cost > 0 ? "-£" + Math.round(mb.cost) : "£0";
    plMb.className = "plv " + (mb.cost > 0 ? "am" : "dim");
  }
  const mbPl = g("od-mb-pl");
  if (mbPl) mbPl.textContent = mb.t;
  const plEm = g("od-pl-em");
  if (plEm) {
    plEm.textContent = em.cost > 0 ? "-£" + em.cost : "£0";
    plEm.className = "plv " + (em.cost > 0 ? "am" : "dim");
  }
  const emPl = g("od-em-pl");
  if (emPl) emPl.textContent = em.t;
  const plVc = g("od-pl-vc");
  if (plVc) {
    plVc.textContent = vc.cost > 0 ? "-£" + vc.cost : "£0";
    plVc.className = "plv " + (vc.cost > 0 ? "am" : "dim");
  }
  const vcPl = g("od-vc-pl");
  if (vcPl) vcPl.textContent = vc.t;

  // Staffing
  const p = OD_PRESETS[_odCur];
  const csC = p.cs.cost,
    engC = p.eng.cost,
    totalStaff = csC + engC,
    totalOpex = totalInfra + totalStaff;
  const plCs = g("od-pl-cs");
  if (plCs) {
    plCs.textContent = csC > 0 ? "-" + _odGbp(csC) : "£0";
    plCs.className = "plv " + (csC > 0 ? "pu" : "dim");
  }
  const csN = g("od-cs-n");
  if (csN) csN.textContent = p.cs.l;
  const plEng = g("od-pl-eng");
  if (plEng) {
    plEng.textContent = engC > 0 ? "-" + _odGbp(engC) : "£0";
    plEng.className = "plv " + (engC > 0 ? "pu" : "dim");
  }
  const engN = g("od-eng-n");
  if (engN) engN.textContent = p.eng.l;
  st("od-pl-opex", "-" + _odGbp(totalOpex));

  // Tax + founder draw
  const pre = gp - totalOpex,
    ann = pre * 12,
    tr = pre > 0 ? (ann > 50000 ? 0.25 : 0.19) : 0,
    tax = pre > 0 ? pre * tr : 0,
    netAfterTax = pre - tax;
  const DRAW_TARGET = 10000,
    DRAW_CAP = 20000;
  let actualDraw, drawLabel, reinvest;
  if (netAfterTax <= 0) {
    actualDraw = 0;
    drawLabel = "Business not yet profitable";
    reinvest = 0;
  } else if (netAfterTax < DRAW_TARGET) {
    actualDraw = netAfterTax;
    drawLabel = "Below £10k — taking all profit as draw";
    reinvest = 0;
  } else if (netAfterTax < DRAW_CAP) {
    actualDraw = DRAW_TARGET;
    drawLabel = "£10k/mo draw · surplus reinvested";
    reinvest = netAfterTax - actualDraw;
  } else {
    actualDraw = DRAW_CAP;
    drawLabel = "£20k/mo hard cap reached · everything above reinvests";
    reinvest = netAfterTax - actualDraw;
  }

  st("od-pl-pre", _odGbp(pre));
  const taxL = g("od-tax-l");
  if (taxL) taxL.textContent = "UK corp tax · " + tr * 100 + "% effective rate";
  st("od-pl-tax", "-" + _odGbp(tax));
  const plDraw = g("od-pl-draw");
  if (plDraw)
    plDraw.textContent = actualDraw > 0 ? "-" + _odGbp(actualDraw) : "£0";
  const drawNote = g("od-draw-note");
  if (drawNote) drawNote.textContent = drawLabel;
  const drawDisplay = g("od-draw-display");
  if (drawDisplay) drawDisplay.textContent = _odGbp(actualDraw) + "/mo";
  const neEl = g("od-pl-net");
  if (neEl) {
    neEl.textContent = _odGbp(reinvest);
    neEl.className =
      "od-thv " + (reinvest > 0 ? "pos" : netAfterTax <= 0 ? "neg" : "pos");
  }

  // Status pills
  const pillTier = g("od-pill-tier");
  if (pillTier) {
    pillTier.textContent = label + " · £" + fee.toFixed(2) + "/ticket";
    pillTier.className =
      "status-pill " +
      (tier === 1
        ? "sp-blue"
        : tier === 2
          ? "sp-green"
          : tier === 3
            ? "sp-amber"
            : "sp-purple");
  }
  const pillVat = g("od-pill-vat");
  if (pillVat) {
    pillVat.textContent = vatReg
      ? "VAT Registered"
      : "Pre-VAT (£" + Math.round(annFeeRev / 1000) + "k/£90k)";
    pillVat.className = "status-pill " + (vatReg ? "sp-red" : "sp-green");
  }
  const pillStripe = g("od-pill-stripe");
  if (pillStripe) {
    pillStripe.textContent = "Stripe · £" + stripePerTx.toFixed(2) + "/txn";
    pillStripe.className = "status-pill sp-blue";
  }
  const pillNet = g("od-pill-net");
  if (pillNet) {
    pillNet.textContent = "Net £" + netFeePerTix.toFixed(2) + "/ticket";
    pillNet.className =
      "status-pill " +
      (netFeePerTix < 0.2
        ? "sp-red"
        : netFeePerTix < 0.6
          ? "sp-amber"
          : "sp-green");
  }

  // Vetting highlight
  ["od-vc1", "od-vc2", "od-vc3", "od-vc4"].forEach((id) => {
    const el = g(id);
    if (el) el.className = "vet-card";
  });
  if (pr < 20) {
    const el = g("od-vc1");
    if (el) el.className = "vet-card active";
  } else if (pr < 50) {
    const el = g("od-vc2");
    if (el) el.className = "vet-card active";
  } else {
    const el = g("od-vc3");
    if (el) el.className = "vet-card active";
  }

  // Alerts
  const stripePct = netFeeRev > 0 ? (totalStripe / netFeeRev) * 100 : 0;
  const aVat = g("od-alert-vat");
  if (aVat) aVat.className = "pitfall-alert " + (vatReg ? "info show" : "");
  const aCb = g("od-alert-cb");
  if (aCb) aCb.className = "pitfall-alert " + (cbCost > 500 ? "warn show" : "");
  const aStr = g("od-alert-stripe");
  if (aStr)
    aStr.className = "pitfall-alert " + (stripePct > 40 ? "warn show" : "");
  const aMar = g("od-alert-margin");
  if (aMar) aMar.className = "pitfall-alert " + (pre < 0 ? "danger show" : "");
  const aRat = g("od-alert-ratio");
  if (aRat)
    aRat.className = "pitfall-alert " + (freeRatio > 0.6 ? "warn show" : "");

  // Risk list
  const risks = [
    {
      n: "Net margin per ticket",
      d: "After Stripe + VAT (ex-infra/staff)",
      v: "£" + netFeePerTix.toFixed(2),
      cls: netFeePerTix < 0.2 ? "bad" : netFeePerTix < 0.5 ? "warn" : "ok",
      note: netFeePerTix < 0.2 ? "Below safety floor" : "Healthy",
    },
    {
      n: "VAT status",
      d: vatReg
        ? "Registered · 20% absorbed from fee"
        : "Pre-threshold — build reserves",
      v: vatReg ? _odGbp(totalVat) + "/mo withheld" : "Pre-VAT",
      cls: vatReg ? "warn" : "ok",
      note: vatReg
        ? "Checkout price unchanged"
        : "Cross £90k annualised fee revenue to trigger",
    },
    {
      n: "Stripe fee drag",
      d: "Processing as % of net fee revenue",
      v: Math.round(stripePct) + "%",
      cls: stripePct > 40 ? "bad" : stripePct > 25 ? "warn" : "ok",
      note:
        stripePct > 40 ? "Raise ticket price to Tier 2 range" : "Acceptable",
    },
    {
      n: "Chargeback exposure",
      d: cbCount + " disputes · £15 each",
      v: _odGbp(cbCost) + "/mo",
      cls: cbCost > 2000 ? "bad" : cbCost > 500 ? "warn" : "ok",
      note: "In-app refund UX deflects most",
    },
    {
      n: "Free load ratio",
      d: Math.round(freeRatio * 100) + "% of RSVPs are free",
      v: Math.round(freeRatio * 100) + "%",
      cls: freeRatio > 0.8 ? "bad" : freeRatio > 0.6 ? "warn" : "ok",
      note: "Private cap (10) + vetting keeps this manageable",
    },
    {
      n: "Staffing vs gross profit",
      d: "Staff cost as % of gross profit",
      v: gp > 0 ? Math.round((totalStaff / gp) * 100) + "%" : "N/A",
      cls:
        gp > 0 && totalStaff > gp
          ? "bad"
          : gp > 0 && totalStaff / gp > 0.6
            ? "warn"
            : "ok",
      note: "Hire too early = margin squeeze",
    },
  ];
  const rl = g("od-risk-list");
  if (!rl) return;
  rl.innerHTML = "";
  let score = 0;
  risks.forEach((r) => {
    if (r.cls === "bad") score += 2;
    else if (r.cls === "warn") score += 1;
    const el = document.createElement("div");
    el.className = "risk-row";
    el.innerHTML =
      '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;color:#C5C6CB">' +
      r.n +
      '</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">' +
      r.d +
      '</div><div style="font-size:10px;color:#5B9FD9;margin-top:2px">' +
      r.note +
      '</div></div><div style="text-align:right;flex-shrink:0;margin-left:8px"><div class="rc ' +
      r.cls +
      '">' +
      r.v +
      "</div></div>";
    rl.appendChild(el);
  });
  st(
    "od-shv-risks",
    score === 0
      ? "All clear"
      : score <= 2
        ? "Low risk"
        : score <= 4
          ? "Watch"
          : score <= 6
            ? "High risk"
            : "Critical",
  );
  st(
    "od-shv-risk",
    gv("od-sl-cb").toFixed(1) + "% CB · " + gv("od-sl-drop") + "% drop",
  );
}

function initOwnerDash() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const sv2 = (id, v) => {
    const el = g(id);
    if (el) el.value = v;
  };

  [
    "od-sl-ev",
    "od-sl-tx",
    "od-sl-pr",
    "od-sl-fe-p",
    "od-sl-fr-p",
    "od-sl-fe-v",
    "od-sl-fr-v",
    "od-sl-cb",
    "od-sl-drop",
  ].forEach((id) => {
    const el = g(id);
    if (!el) return;
    el.addEventListener("input", () => {
      _odCur = "Custom";
      wrap.querySelectorAll("[data-odp]").forEach((b) => {
        b.classList.remove("a");
        if (b.dataset.odp === "Custom") b.classList.add("a");
      });
      const ctx = g("od-ctx");
      if (ctx) ctx.innerHTML = OD_PRESETS.Custom.ctx;
      od_renderStaff();
      od_recalc();
    });
  });

  const presetsEl = g("od-presets");
  if (presetsEl) {
    presetsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-odp]");
      if (!btn) return;
      const n = btn.dataset.odp;
      _odCur = n;
      wrap.querySelectorAll("[data-odp]").forEach((b) => {
        b.classList.remove("a");
        if (b.classList.contains("hype")) b.classList.remove("a");
      });
      btn.classList.add("a");
      const p = OD_PRESETS[n];
      sv2("od-sl-ev", p.ev);
      sv2("od-sl-tx", p.tx);
      sv2("od-sl-pr", p.pr);
      sv2("od-sl-fe-p", p.fep);
      sv2("od-sl-fr-p", p.frp);
      sv2("od-sl-fe-v", p.fev);
      sv2("od-sl-fr-v", p.frv);
      sv2("od-sl-cb", p.cb);
      sv2("od-sl-drop", p.drop);
      const ctx = g("od-ctx");
      if (ctx) ctx.innerHTML = p.ctx;
      od_renderStaff();
      od_recalc();
    });
  }

  const ctx = g("od-ctx");
  if (ctx) ctx.innerHTML = OD_PRESETS[_odCur].ctx;
  od_renderStaff();
  od_recalc();
  // Kick off live Supabase data load
  loadOwnerLiveData();
}

