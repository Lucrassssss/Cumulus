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
  bizName,
  hostDesc,
  whyHost,
}) {
  await _saveHostApplicationRow({ name, email, bizName, hostDesc, whyHost });
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
async function _saveHostApplicationRow({ name, email, bizName, hostDesc, whyHost }) {
  const appPayload = {
    name,
    email,
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
function openHostApply() {
  pushNav();
  _hostCats = [];
  state.view = "host-apply";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHostApplyView() {
  if (isApprovedHost()) {
    return `<button class="back-btn" onclick="goBack()">←</button>
      <div class="connect-header"><h2>You're already a host</h2><p>Head to the Host tab to publish an event.</p></div>`;
  }
  if (state.hostApplicationStatus === "pending") {
    return `<button class="back-btn" onclick="goBack()">←</button>
      <div class="connect-header"><h2>Application pending</h2><p>We're reviewing your host application — usually within 48 hours. You'll get the Host tab as soon as it's approved.</p></div>`;
  }
  return `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header" style="padding-top:16px;"><h2>Become a host</h2><p>Tell us about your venue or events. Our team reviews every application to keep quality high on Cumulus.</p></div>
    <div class="host-section">
      <label class="intro-field-label">Venue or business name</label>
      <input id="apply-biz-name" class="gate-input" placeholder="e.g. The Sketch House"/>
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
  const hostDesc = (document.getElementById("apply-host-desc")?.value || "").trim();
  const whyHost = (document.getElementById("apply-why-host")?.value || "").trim();
  const err = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add("show");
    }
  };
  if (!bizName) return err("Please enter your venue or business name.");
  if (_hostCats.length === 0) return err("Please select at least one event type.");
  if (!hostDesc) return err("Please add a brief description of your events.");

  const btn = document.querySelector('[onclick="submitHostApplyForm()"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting…";
  }
  const ok = await _saveHostApplicationRow({
    name: state.profileName,
    email: state.profileEmail,
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
  // Always boot to the map — never restore a stale tab from memory
  state.view = "browse";
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
  // Auto-detect admin status for the signed-in session — server-verified via
  // is_admin() (checks the real auth.uid() against public.admins), so it
  // can't be spoofed client-side. Previously this only ever got set inside
  // the "Admin sign-in" OTP modal, but that modal lives *inside* the Admin
  // nav tab, which itself only renders once state.isAdmin is already true —
  // a real account in public.admins had no way to ever reach it after a
  // normal sign-in. Admin status should just be on by default for an actual
  // admin account, not gated behind a second manual re-verification step.
  if (state.userId) {
    try {
      if (await isAdminSession()) {
        state.isAdmin = true;
        state._verifiedAdmin = true;
        renderNav();
      }
    } catch (e) {}
  }

  // Background data load — enterApp() rendered the shell already; this fills it
  // with real events from Supabase without blocking the cloud animation. With no
  // seed data, the map/list show empty states until this resolves (or stay empty
  // if there genuinely are no events yet).
  await loadRealEvents();

  await loadGeocodeCache();
  EVENTS.forEach((ev) => {
    if (needsGeocode(ev) && geocodeCache[ev.address]) {
      ev.lat = geocodeCache[ev.address].lat;
      ev.lon = geocodeCache[ev.address].lon;
    }
  });
  if (mapboxConfigured()) resolveEventLocations();
  checkEventDeepLink();

  await loadMyTickets();
  await loadAllRsvps();
  await checkSquadClaim();
  await checkSquadGroupClaim();
  await checkStripeCheckoutReturn();
  await checkConnectReturn();
  if (!isApprovedHost() && state.userId) {
    state.hostApplicationStatus = await getMyHostApplicationStatus(state.userId);
  }
  if (state.userId) state.followedHostIds = await loadMyFollows();
  if (state.userId) state.myWaitlist = await loadMyWaitlist();

  // Refresh view quietly once real data is in (still on map = update markers)
  if (state.view === "browse") renderView();
}

