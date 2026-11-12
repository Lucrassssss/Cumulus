// ── Real auth, step 2: verify the code, then finalise onboarding ──────────
async function verifyGateCode() {
  const p = _pendingAuth;
  if (!p) return;
  const code = (document.getElementById("gate-otp-input")?.value || "").trim();
  if (!/^\d{6}$/.test(code)) {
    otpErr("Enter the 6-digit code from your email.");
    return;
  }

  const vbtn = document.getElementById("gate-otp-verify");
  const vlabel = vbtn && vbtn.querySelector(".lp-claim-btn-text");
  if (vbtn) {
    vbtn.disabled = true;
    if (vlabel) vlabel.textContent = "Verifying…";
  }
  const reEnable = () => {
    if (vbtn) {
      vbtn.disabled = false;
      if (vlabel) vlabel.textContent = "Verify & continue";
    }
  };

  const res = await authVerifyCode(p.email, code);
  if (!res.ok || !res.userId) {
    reEnable();
    otpErr(
      res.error === "unavailable"
        ? "Verification is temporarily unavailable — try again shortly."
        : "That code didn’t match. Check it and try again.",
    );
    return;
  }

  // We now hold a real session. The DB trigger has created the profile row.
  state.userId = res.userId;
  let profile = await loadUserProfile(res.userId);

  if (p.isLogin) {
    if (profile && profile.name) {
      _restoreUserFromRow(profile);
      state.profileEmail = profile.email || p.email;
    } else {
      state.profileName = (profile && profile.name) || p.email.split("@")[0];
      state.profileEmail = p.email;
      state.profileId = generateUniqueId();
    }
  } else {
    state.profileName =
      p.name || (profile && profile.name) || p.email.split("@")[0];
    state.profileEmail = p.email;
    state.profileId = (profile && profile.profile_id) || generateUniqueId();
    state.specialBadges = (profile && profile.special_badges) || [];
    // Persist the display name + public profile id (RLS: id = auth.uid()).
    try {
      await sb
        .from("users")
        .update({ name: state.profileName, profile_id: state.profileId })
        .eq("id", res.userId);
    } catch (e) {}
  }

  await localSet("cumulus_email", p.email);
  await localSet("prefs", JSON.stringify({ theme: state.theme }));
  _cacheSession();

  // Host application (sign up as host)
  if (!p.isLogin && p.signupType === "host") {
    _hostCats = p.hostCats || [];
    await _submitHostApplication({
      name: state.profileName,
      email: p.email,
      phone: p.phone,
      bizName: p.bizName,
      hostDesc: p.hostDesc,
      whyHost: p.whyHost,
    });
    _pendingAuth = null;
    return;
  }

  _pendingAuth = null;
  document.body.style.overflow = "";
  document.getElementById("gate-root").innerHTML = "";
  // closeLpSignup() (not just clearing #gate-root) matters now that
  // showLpSignup() can lazily inject the modal directly onto <body> for a
  // guest mid-session (see enterGuestBrowse()/openBook()/openAccount()) —
  // in that path the modal was never inside #gate-root to begin with, so
  // clearing #gate-root alone left it stuck open, fixed, and covering the
  // freshly-entered authenticated app underneath.
  closeLpSignup();
  enterApp();
}

// Swap the gate form for the 6-digit code entry step (same modal).
function showOtpStep(email) {
  const modal = document.querySelector(".lp-signup-modal");
  if (!modal) return;
  let panel = document.getElementById("gate-otp-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "gate-otp-panel";
    modal.appendChild(panel);
  }
  panel.innerHTML = `
    <button class="gate-otp-back" onclick="backToGateForm()" aria-label="Back to sign-in form">←</button>
    <div class="lp-form-eyebrow">Check your inbox</div>
    <h3 class="lp-form-title">Enter your code</h3>
    <p class="lp-form-sub">We emailed a 6-digit code to <strong>${escapeHtml(email)}</strong>. It expires in a few minutes.</p>
    <div class="gate-field">
      <label class="gate-label" for="gate-otp-input">6-digit code</label>
      <input id="gate-otp-input" class="gate-input gate-otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-describedby="gate-otp-error" oninput="this.value=this.value.replace(/\D/g,'')"/>
    </div>
    <p id="gate-otp-error" class="gate-field-error" role="alert"></p>
    <button id="gate-otp-verify" class="lp-claim-btn" onclick="verifyGateCode()">
      <span class="lp-claim-btn-text">Verify &amp; continue</span>
    </button>
    <button class="gate-otp-resend" onclick="resendGateCode()">Didn’t get it? Resend code</button>`;
  modal.classList.add("otp-active");
  const inp = document.getElementById("gate-otp-input");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") verifyGateCode();
    });
  }
}
function backToGateForm() {
  const m = document.querySelector(".lp-signup-modal");
  if (m) m.classList.remove("otp-active");
  const e = document.getElementById("gate-field-error");
  if (e) e.classList.remove("show");
}
function otpErr(msg) {
  const e = document.getElementById("gate-otp-error");
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}
async function resendGateCode() {
  if (!_pendingAuth) return;
  const b = document.querySelector(".gate-otp-resend");
  if (b) {
    b.disabled = true;
    b.textContent = "Sending…";
  }
  const res = await authSendCode(
    _pendingAuth.email,
    _pendingAuth.isLogin ? {} : { name: _pendingAuth.name },
  );
  if (b) {
    b.disabled = false;
    b.textContent = res.ok ? "Code re-sent ✓" : "Resend failed — try again";
  }
}

async function _submitHostApplication({
  name,
  email,
  phone,
  bizName,
  hostDesc,
  whyHost,
}) {
  await _saveHostApplicationRow({ name, email, phone, bizName, hostDesc, whyHost });
  state.hostApplicationStatus = "pending";

  // Show success screen inside modal
  const modal = document.querySelector(".lp-signup-modal");
  if (modal) {
    modal.innerHTML = `
      <div class="gate-host-success">
        <div class="gate-host-success-icon">🎉</div>
        <div class="gate-host-success-title">Application submitted!</div>
        <div class="gate-host-success-sub">Thanks ${escapeHtml(name)} — we'll review your application and get back to you within 48 hours. In the meantime, you can explore Cumulus as an attendee.</div>
        <button class="btn" style="width:100%;margin-top:24px;" onclick="document.body.style.overflow='';document.getElementById('gate-root').innerHTML='';enterApp();">Explore Cumulus →</button>
      </div>`;
  }
}

// Shared by the landing-page "Become a host" signup flow and the in-app
// "Apply to host" flow (submitHostApplyForm) — writes one host_applications
// row (real auth.uid() session required by RLS in both cases), falling back
// to localStorage only if the write itself fails (offline/misconfigured).
async function _saveHostApplicationRow({ name, email, phone, bizName, hostDesc, whyHost }) {
  const appPayload = {
    name,
    email,
    phone,
    user_id: state.userId || null,
    business_name: bizName,
    event_types: _hostCats.join(","),
    description: hostDesc,
    why_host: whyHost,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  let savedToDb = false;
  try {
    const { error } = await sb.from("host_applications").insert(appPayload);
    if (!error) savedToDb = true;
  } catch (e) {}

  if (!savedToDb) {
    try {
      const apps = JSON.parse(
        localStorage.getItem("host_applications_local") || "[]",
      );
      apps.push({ ...appPayload, id: "local_" + Date.now() });
      localStorage.setItem("host_applications_local", JSON.stringify(apps));
    } catch (e) {}
  }
  return savedToDb;
}

// ── In-app "Become a host" apply flow (already-signed-in eventees) ─────────
// _hostApplyStep gates the brochure vs. the actual form: every fresh visit
// to this flow starts on the brochure (former marketing-landing "For
// Venues" pitch, now scoped to prospective hosts only — see 03-core-theme.js
// removing the general-visitor marketing gate) so hosting still gets a real
// sales pitch even though a plain attendee never sees one.
let _hostApplyStep = "brochure";
function openHostApply() {
  pushNav();
  _hostCats = [];
  _hostApplyStep = "brochure";
  state.view = "host-apply";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hostApplyShowForm() {
  // The brochure itself is fine for a guest to see (that's the point of a
  // pitch page), but host_applications' INSERT policy is authenticated-only
  // (user_id = auth.uid()) — a guest who filled in the real form would get
  // a fake "Application submitted!" toast while _saveHostApplicationRow()
  // silently fell back to localStorage, never reaching the real review
  // queue. Gate here, same pattern as openAccount()/openBook().
  if (!state.userId) {
    showToast("Sign in to apply — takes 20 seconds", "info");
    showLpSignup();
    return;
  }
  _hostApplyStep = "form";
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHostApplyView() {
  if (_hostApplyStep === "form") {
    if (isApprovedHost()) {
      return `<button class="back-btn" onclick="goBack()">←</button>
      <div class="connect-header"><h2>You're already a host</h2><p>Head to the Host tab to publish an event.</p></div>`;
    }
    if (state.hostApplicationStatus === "pending") {
      return `<button class="back-btn" onclick="goBack()">←</button>
      <div class="connect-header"><h2>Application pending</h2><p>We're reviewing your host application — usually within 48 hours. You'll get the Host tab as soon as it's approved.</p></div>`;
    }
    return renderHostApplyForm();
  }
  return renderHostApplyBrochure();
}

// The host info / pitch page — reached from the Discover feed's "For
// organisers" box and Account → Become a host. Everything on it is real:
// 0% host fee and the flat buyer fee come from getCumulusFee(), payouts
// from the 24h/48h trust-tier release schedule, features that exist today.
// Its one CTA adapts: apply → (approved) create an event → (pending) note.
function hostInfoCta(big) {
  const cls = `v-btn${big ? " wide hx-cta-big" : ""}`;
  if (isApprovedHost())
    return `<button class="${cls}" onclick="openHost()">Create an event →</button>`;
  if (state.hostApplicationStatus === "pending")
    return `<button class="${cls} ghost" disabled>Application pending · ~48h</button>`;
  return `<button class="${cls}" onclick="hostApplyShowForm()">Apply to host →</button>`;
}

function renderHostApplyBrochure() {
  const ic = (d) =>
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const features = [
    [ic('<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>'), "On the map, instantly", "Your event becomes a poster pin on London's live map and a card in the Discover feed."],
    [ic('<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>'), "Keep 100% of the ticket", "No percentage cut. The buyer pays a small flat platform fee on top — never you."],
    [ic('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.7-3.4 3.2-5 6-5s5.3 1.6 6 5M15 15.2c2.6 0 4.6 1.4 5.2 4.8"/>'), "Squad tickets", "One person buys for the group and shares claim links — friends turn up together."],
    [ic('<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 12h10"/>'), "Door scanner", "Check guests in from your phone. Works offline and syncs when you're back on signal."],
    [ic('<path d="M4 19V5M4 19h16"/><path d="m8 15 3-4 3 2 4-6"/>'), "Live numbers", "See sales, check-ins and repeat attendees as they happen."],
    [ic('<path d="M4 6h16M4 12h10M4 18h7"/><path d="m16 15 2 2 4-4"/>'), "Waitlists & promo codes", "Sold out? A freed spot goes straight to the next person in line. Run discount codes in a tap."],
  ];
  const fee = typeof getCumulusFee === "function" ? getCumulusFee(20) : 2.5;
  // Decorative poster wall — sample categories, not real listings.
  const wall = [
    ["Live Music", -9, 6, 0],
    ["Food & Drink", 7, 62, 1],
    ["Creative", -4, 30, 2],
    ["Gaming", 11, 80, 3],
    ["Movie Nights", -12, 48, 4],
  ]
    .map(([cat, rot, left, i]) => {
      const ev = { id: "hx" + i, category: cat };
      return `<span class="hx-poster ${posterClass(ev)}" style="${posterStyle(ev)}--r:${rot}deg;left:${left}%;--i:${i};">${posterGlyph(ev)}</span>`;
    })
    .join("");
  const ticker = ["0% host fee", "Paid out in 24–48h", "Squad tickets", "Door scanner", "Waitlists", "Promo codes", "Live map + feed"];

  setTimeout(initHostInfoReveal, 0);
  return `<div class="hx">
    <section class="hx-hero">
      <div class="hx-wall" aria-hidden="true">${wall}</div>
      <div class="hx-hero-bar">
        <button class="glass-btn" onclick="goBack()" aria-label="Back"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      </div>
      <div class="hx-hero-copy">
        <div class="hx-kicker">For organisers</div>
        <h1 class="hx-h1">Throw<br/>something.</h1>
        <p class="hx-lede">Put your night on London's live map. Sell tickets, keep every penny of the price, and get paid out fast.</p>
        <div class="hx-hero-ctas">
          ${hostInfoCta(false)}
          <button class="v-btn ghost hx-ghost" onclick="document.getElementById('hx-how')?.scrollIntoView({behavior:'smooth'})">How it works ↓</button>
        </div>
      </div>
    </section>

    <div class="hx-ticker" aria-hidden="true"><div class="hx-ticker-track">${[...ticker, ...ticker, ...ticker]
      .map((t) => `<span>${t}</span><i>✦</i>`)
      .join("")}</div></div>

    <section class="hx-sec">
      <div class="hx-stats hx-reveal">
        <div><b>0%</b><span>Host fee</span></div>
        <div><b>24–48h</b><span>Payouts</span></div>
        <div><b>${Object.keys(CATS).length}</b><span>Categories</span></div>
      </div>
    </section>

    <section class="hx-sec">
      <h2 class="hx-h2 hx-reveal">Everything you need.<br/><em>Nothing you don't.</em></h2>
      <div class="hx-grid">${features
        .map(
          ([icon, t, d], i) => `<article class="hx-card hx-reveal" style="--d:${i * 70}ms"><div class="hx-ic">${icon}</div><h3>${t}</h3><p>${d}</p></article>`,
        )
        .join("")}</div>
    </section>

    <section class="hx-sec hx-money hx-reveal">
      <div class="hx-kicker dark">The maths</div>
      <h2 class="hx-h2">Your £20 ticket<br/>is your £20.</h2>
      <div class="hx-receipt">
        <div><span>Ticket price</span><b>£20.00</b></div>
        <div><span>Cumulus fee to you</span><b>£0.00</b></div>
        <div class="tot"><span>You receive</span><b>£20.00</b></div>
        <div class="note"><span>The buyer pays a flat £${fee.toFixed(2)} platform fee on top — no percentage cuts.</span></div>
      </div>
    </section>

    <section class="hx-sec" id="hx-how">
      <h2 class="hx-h2 hx-reveal">Live in three steps</h2>
      <ol class="hx-steps">
        <li class="hx-reveal" style="--d:0ms"><span class="hx-num">01</span><div><h3>Apply</h3><p>Tell us who you are and what you run. Takes two minutes; we review within about 48 hours.</p></div></li>
        <li class="hx-reveal" style="--d:90ms"><span class="hx-num">02</span><div><h3>Build your event</h3><p>Add a flyer, price tiers and a venue. Drop your pin on the map and watch your poster appear.</p></div></li>
        <li class="hx-reveal" style="--d:180ms"><span class="hx-num">03</span><div><h3>Fill the room</h3><p>Sell tickets, scan people in at the door, and get paid out 24–48h after the event.</p></div></li>
      </ol>
    </section>

    <section class="hx-sec hx-reveal">
      <div class="hx-quote">Built on one belief: the best things happen when people who live near each other actually meet — not online.</div>
    </section>

    <div class="hx-bar">
      <div class="hx-bar-copy"><b>Ready?</b><span>${isApprovedHost() ? "You're approved to host" : "Free to apply"}</span></div>
      ${hostInfoCta(true)}
    </div>
  </div>`;
}

// Scroll-reveal for the host page — one observer, disconnected once every
// element has shown (no leaked observers across re-renders).
let _hxObserver = null;
function initHostInfoReveal() {
  if (_hxObserver) _hxObserver.disconnect();
  const els = document.querySelectorAll(".hx .hx-reveal:not(.in)");
  if (!els.length) return;
  if (!window.IntersectionObserver) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  let left = els.length;
  _hxObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        _hxObserver.unobserve(e.target);
        if (--left === 0) _hxObserver.disconnect();
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  els.forEach((el) => _hxObserver.observe(el));
}

function renderHostApplyForm() {
  return `
    <button class="back-btn" onclick="_hostApplyStep='brochure';renderView();">←</button>
    <div class="connect-header" style="padding-top:16px;"><h2>Become a host</h2><p>Tell us about your venue or events. Our team reviews every application to keep quality high on Cumulus.</p></div>
    <div class="host-section">
      <label class="intro-field-label">Venue or business name</label>
      <input id="apply-biz-name" class="gate-input" placeholder="e.g. The Sketch House"/>
      <label class="intro-field-label" style="margin-top:14px;">Contact email</label>
      <input id="apply-contact-email" class="gate-input" type="email" placeholder="you@email.com" value="${escapeHtml(state.profileEmail || "")}"/>
      <label class="intro-field-label" style="margin-top:14px;">Phone number</label>
      <input id="apply-phone" class="gate-input" type="tel" placeholder="e.g. 07123 456789"/>
      <div class="host-notice" style="margin-top:10px;">We may call to talk through your event and how we can help — never shared or used for anything else.</div>
      <div class="gate-field-group-label" style="margin-top:14px;">Event types you'd host</div>
      <div class="host-cat-grid" id="apply-host-cat-grid">
        ${["Creative", "Gaming", "Movie Nights", "Board Games", "Meetups", "Food &amp; Drink", "Live Music", "Wellness &amp; Outdoors", "Tech &amp; Talks"].map((c) => `<button class="host-cat-chip" data-hostcat="${escapeHtml(c.replace(/&amp;/g, "&"))}" onclick="toggleHostCat('${escapeHtml(c.replace(/&amp;/g, "&"))}')">${c}</button>`).join("")}
      </div>
      <label class="intro-field-label" style="margin-top:14px;">About your events</label>
      <textarea id="apply-host-desc" class="gate-input" placeholder="What kind of events do you run? Describe the vibe, size, and frequency…" rows="3" maxlength="400"></textarea>
      <label class="intro-field-label">Why host on Cumulus?</label>
      <textarea id="apply-why-host" class="gate-input" placeholder="Tell us what you're hoping to achieve…" rows="2" maxlength="300"></textarea>
    </div>
    <p id="apply-host-error" class="gate-field-error"></p>
    <button class="btn" style="width:100%;margin-bottom:16px;" onclick="submitHostApplyForm()">Submit application →</button>`;
}

async function submitHostApplyForm() {
  const errEl = document.getElementById("apply-host-error");
  if (errEl) errEl.classList.remove("show");
  const bizName = (document.getElementById("apply-biz-name")?.value || "").trim();
  const contactEmail = (document.getElementById("apply-contact-email")?.value || "").trim();
  const phone = (document.getElementById("apply-phone")?.value || "").trim();
  const hostDesc = (document.getElementById("apply-host-desc")?.value || "").trim();
  const whyHost = (document.getElementById("apply-why-host")?.value || "").trim();
  const err = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add("show");
    }
  };
  if (!bizName) return err("Please enter your venue or business name.");
  if (!EMAIL_PATTERN.test(contactEmail)) return err("Please enter a valid contact email.");
  if (!phone) return err("Please add a phone number so we can reach you.");
  if (_hostCats.length === 0) return err("Please select at least one event type.");
  if (!hostDesc) return err("Please add a brief description of your events.");

  const btn = document.querySelector('[onclick="submitHostApplyForm()"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting…";
  }
  const ok = await _saveHostApplicationRow({
    name: state.profileName,
    email: contactEmail,
    phone,
    bizName,
    hostDesc,
    whyHost,
  });
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Submit application →";
  }
  if (!ok) {
    showToast("Couldn't reach the server — application saved locally, will retry.", "error");
  }
  state.hostApplicationStatus = "pending";
  showToast("Application submitted — we'll be in touch within 48 hours.", "success");
  navStack = [];
  openAccount();
}
// Cloud loading transition removed — enter the app directly.

function enterApp() {
  document.getElementById("gate-root").innerHTML = "";
  document.body.style.overflow = "";
  const app = document.getElementById("app");
  app.style.display = "";
  // The 5 ambient .bg-blot decorations + grain overlay are landing-page-only
  // texture: position:fixed, 96px blur filter, continuously transform-
  // animating (42s loops) for the life of the tab. They were never scoped to
  // the gate/landing screen, so they kept compositing (blur recompute) behind
  // the ENTIRE app for the whole session — a steady background tax on every
  // view, not just the map. Hide them for good once real app UI is showing.
  document.body.classList.add("app-active");
  // Always boot to the Discover feed — never restore a stale tab from memory
  state.view = "feed";
  EVENTS.forEach((ev) => computeEventDates(ev));
  renderNav();
  renderView();
  // Load real data in the background without blocking
  initApp();

  // Safety net: the #cumulus-loader overlay is normally hidden by lmap's
  // "idle" event inside initLeaflet(), but that path never fires if Mapbox
  // GL JS's <script defer> hasn't finished loading yet when initLeaflet()
  // runs (it bails out silently with no retry), or if WebGL/the map fails
  // to initialize for any other reason (unsupported device, network error,
  // missing token). With no retry, the loader — which fully covers the
  // viewport at z-index 99999 — would otherwise stay stuck forever even
  // though the app underneath is fully interactive (it's pointer-events:
  // none). Force it gone after a generous timeout so a map failure never
  // blocks the rest of the app from being seen.
  setTimeout(() => {
    const loader = document.getElementById("cumulus-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }
  }, 8000);
}

async function initApp() {
  // Last-known tickets for this account, so "Up next" is on the very first
  // real paint instead of popping in a few round-trips later.
  if (state.userId && (typeof myTickets === "undefined" || !myTickets.length)) {
    try {
      const cached = JSON.parse(localStorage.getItem(`cumulus_tix_${state.userId}`) || "null");
      if (Array.isArray(cached)) myTickets = cached;
    } catch (e) {}
  }
  // Auto-detect admin status for the signed-in session — server-verified via
  // is_admin() (checks the real auth.uid() against public.admins), so it
  // can't be spoofed client-side. Previously this only ever got set inside
  // the "Admin sign-in" OTP modal, but that modal lives *inside* the Admin
  // nav tab, which itself only renders once state.isAdmin is already true —
  // a real account in public.admins had no way to ever reach it after a
  // normal sign-in. Admin status should just be on by default for an actual
  // admin account, not gated behind a second manual re-verification step.
  // Admin check runs alongside the events load rather than in front of it.
  const adminCheck = state.userId
    ? isAdminSession()
        .then((ok) => {
          if (ok) {
            state.isAdmin = true;
            state._verifiedAdmin = true;
            renderNav();
          }
        })
        .catch(() => {})
    : Promise.resolve();

  // Everything the first screen shows loads AT ONCE, behind the boot
  // loader, so Discover appears a single time already complete — events,
  // "Up next", going counts, followed hosts, crew — instead of painting and
  // then filling in (which reads as the page loading twice).
  const safe = (pr) => Promise.resolve(pr).catch(() => {});
  const personal = Promise.all([
    adminCheck,
    safe(loadAllRsvps()),
    safe(loadTicketCounts()),
    ...(state.userId
      ? [
          safe(loadMyTickets()),
          safe(loadMyFollows().then((v) => (state.followedHostIds = v || []))),
          safe(loadMyWaitlist().then((v) => (state.myWaitlist = v || []))),
          safe(loadCrewGoing()),
          safe(syncSavedEvents()),
        ]
      : []),
  ]);
  await loadRealEvents();
  state.eventsLoaded = true;
  // Don't hold the screen hostage on a slow personal call: past ~1.2s, show
  // the events and let the rest slot in quietly.
  await Promise.race([personal, new Promise((r) => setTimeout(r, 1200))]);
  if (state.view === "feed") renderViewQuiet();
  else if (state.view === "browse") renderView();
  hideBootLoader(); // real content is on screen now — hand over in one go
  await personal;

  await loadGeocodeCache();
  EVENTS.forEach((ev) => {
    if (needsGeocode(ev) && geocodeCache[ev.address]) {
      ev.lat = geocodeCache[ev.address].lat;
      ev.lon = geocodeCache[ev.address].lon;
    }
  });
  if (mapboxConfigured()) resolveEventLocations();
  checkEventDeepLink();
  checkPlansLink();

  await checkSquadClaim();
  await checkSquadGroupClaim();
  await checkStripeCheckoutReturn();
  await checkConnectReturn();
  if (!isApprovedHost() && state.userId) {
    state.hostApplicationStatus = await getMyHostApplicationStatus(state.userId);
  }

  // Refresh quietly once everything's in (map = update markers, feed = add
  // anything personal that changed) — in place, never a second page load.
  if (state.view === "feed") renderViewQuiet();
  else if (state.view === "browse") renderView();
}

