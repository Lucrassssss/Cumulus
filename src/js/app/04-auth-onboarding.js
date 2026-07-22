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

  _welcomeCardPending = !p.isLogin;
  _pendingAuth = null;
  document.body.style.overflow = "";
  document.getElementById("gate-root").innerHTML = "";
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
  openProfile();
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

  // First-run: a brand-new member builds their pass while the map
  // initialises behind the overlay — the dead loader wait becomes the
  // account/card setup step. Returning logins go straight to the map.
  if (_welcomeCardPending) {
    _welcomeCardPending = false;
    const loader = document.getElementById("cumulus-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }
    openCardEditor(null, true);
  }

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

function openCardEditor(eventId, welcome) {
  cardEditorEventId = eventId ?? null;
  cardEditorWelcome = !!welcome;
  // Draft always seeds from the DB-backed state.myCard — the same source
  // openExpandedCard()/the host profile read — never from the old
  // device-local card_ext/card_photo blobs.
  const ex = state.myCard;
  const accentDef = ex && CARD_ACCENT_COLORS.find((c) => c.id === ex.accent);
  cardDraft = ex
    ? {
        theme: ex.theme || "obsidian",
        bgStyle: ex.theme || "obsidian",
        accentColor: (accentDef && accentDef.hex) || "#FFCF33",
        border: ex.border || "classic",
        layout: ex.layout || "standard",
        font: ex.font || "inter",
        bio: ex.bio || "",
        motto: "",
        interests: "",
        fact: ex.fact || "",
        photo: "",
        avatarUrl: ex.avatarUrl || "",
        areas: Array.isArray(ex.areas) ? ex.areas.slice() : [],
        _appliedLook: null,
      }
    : {
        theme: "obsidian",
        bgStyle: "obsidian",
        accentColor: "#FFCF33",
        border: "classic",
        layout: "standard",
        font: "inter",
        bio: "",
        motto: "",
        interests: "",
        fact: "",
        photo: "",
        avatarUrl: "",
        areas: [],
        _appliedLook: null,
      };
  renderCardEditor();
}
function captureDraftFields() {
  const b = document.getElementById("card-bio");
  if (b) cardDraft.bio = b.value;
  const f = document.getElementById("card-fact");
  if (f) cardDraft.fact = f.value;
  const m = document.getElementById("card-motto");
  if (m) cardDraft.motto = m.value;
}
function handleCardPhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    // Resize to max 480px to keep localStorage size manageable
    const img = new Image();
    img.onload = function () {
      const MAX = 480;
      let w = img.width,
        h = img.height;
      if (w > h) {
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
      } else {
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cardDraft.photo = canvas.toDataURL("image/jpeg", 0.78);
      // Update zone UI without full re-render
      const zone = document.getElementById("ce-photo-zone");
      if (zone)
        zone.innerHTML = `<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
        <img src="${cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
        <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
        <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function removeCardPhoto() {
  cardDraft.photo = "";
  cardDraft.avatarUrl = "";
  cardDraft.avatarRemoved = true;
  const zone = document.getElementById("ce-photo-zone");
  if (zone)
    zone.innerHTML = `<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
    <div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    </div>
    <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`;
}
// A manual tweak on any single axis means the draft no longer matches
// whichever Signature Look (if any) seeded it — un-mark it rather than
// leave a stale "active" preset that no longer reflects the real draft.
function _clearAppliedLook() {
  if (!cardDraft._appliedLook) return;
  cardDraft._appliedLook = null;
  document.querySelectorAll(".ce-look-card").forEach((b) => b.classList.remove("active"));
}
function selectCardTheme(id) {
  captureDraftFields();
  cardDraft.theme = id;
  cardDraft.bgStyle = id;
  _clearAppliedLook();
  updateCardPreview();
  document
    .querySelectorAll(".cc-style-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
}
function selectCardAccentColor(hex, id) {
  captureDraftFields();
  cardDraft.accentColor = hex;
  _clearAppliedLook();
  updateCardPreview();
  document
    .querySelectorAll(".cc-swatch")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
}
function selectCardBorder(id) {
  captureDraftFields();
  cardDraft.border = id;
  _clearAppliedLook();
  updateCardPreview();
  document
    .querySelectorAll("[data-border]")
    .forEach((b) => b.classList.toggle("active", b.dataset.border === id));
}
function selectCardLayout(id) {
  captureDraftFields();
  cardDraft.layout = id;
  _clearAppliedLook();
  updateCardPreview();
  document
    .querySelectorAll("[data-layout]")
    .forEach((b) => b.classList.toggle("active", b.dataset.layout === id));
}
function selectCardFont(id) {
  captureDraftFields();
  cardDraft.font = id;
  _clearAppliedLook();
  updateCardPreview();
  document
    .querySelectorAll("[data-font]")
    .forEach((b) => b.classList.toggle("active", b.dataset.font === id));
}
function toggleCardArea(area) {
  const idx = cardDraft.areas.indexOf(area);
  if (idx !== -1) {
    cardDraft.areas.splice(idx, 1);
  } else if (cardDraft.areas.length < 3) {
    cardDraft.areas.push(area);
  }
  // Patch pills without re-render
  document.querySelectorAll(".ce-area-pill").forEach((btn) => {
    const a = btn.dataset.area;
    const sel = cardDraft.areas.includes(a);
    btn.classList.toggle("active", sel);
    btn.disabled = !sel && cardDraft.areas.length >= 3;
  });
  const hint = document.getElementById("ce-area-hint");
  if (hint)
    hint.textContent = `${cardDraft.areas.length}/3 selected${cardDraft.areas.length === 3 ? " · tap to deselect" : ""}`;
  const tags = document.getElementById("ce-preview-tags");
  if (tags) {
    const t = resolveCardColors(cardDraft.bgStyle || cardDraft.theme, cardDraft.accentColor);
    tags.innerHTML = cardDraft.areas
      .map(
        (s) =>
          `<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`,
      )
      .join("");
  }
}
function updateCardPreview() {
  const t = resolveCardColors(
    cardDraft.bgStyle || cardDraft.theme,
    cardDraft.accentColor,
  );
  const el = document.getElementById("ce-live-card");
  if (!el) return;
  el.style.background = t.bg;
  el.style.color = t.text;
  el.style.borderColor = t.border;
  const nm = document.getElementById("ce-preview-name");
  if (nm) nm.style.color = t.text;
  const ac = document.getElementById("ce-preview-accent");
  if (ac) ac.style.background = t.accent;
  const bio = document.getElementById("card-bio");
  const pbio = document.getElementById("ce-preview-bio");
  if (pbio && bio) {
    pbio.textContent = bio.value || "Tell your story…";
    pbio.style.color = t.textSoft;
  }
  const motto = document.getElementById("card-motto");
  const pmotto = document.getElementById("ce-preview-motto");
  if (pmotto && motto) {
    pmotto.textContent = motto.value ? `"${motto.value}"` : "";
    pmotto.style.color = t.accent;
  }
  const tags = document.getElementById("ce-preview-tags");
  if (tags) {
    tags.innerHTML = cardDraft.areas
      .map(
        (s) =>
          `<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`,
      )
      .join("");
  }
  const lbl = document.getElementById("ce-preview-label");
  if (lbl) lbl.style.color = t.textSoft;
  const det = document.getElementById("ce-preview-detail");
  if (det) {
    det.style.color = t.textSoft;
    det.textContent = cardDraft.areas.length
      ? cardDraft.areas.join(" · ")
      : "London Community Member";
  }
  const wm = document.getElementById("ce-preview-wm");
  if (wm) wm.style.color = t.accent;
  const ph = document.getElementById("ce-preview-photo");
  if (ph && ph.tagName === "IMG") {
    ph.style.borderColor = t.accent;
  }
}
// Applying a Signature Look just seeds the five underlying fields
// (theme/accent/border/layout/font) that the granular pickers already
// control — nothing new to persist, saveCard() sends the same patch either
// way. Re-renders the whole editor rather than patching each tab/preview
// individually since a look touches every tab at once.
function applySignatureLook(id) {
  const look = CARD_SIGNATURE_LOOKS.find((l) => l.id === id);
  if (!look) return;
  const accentDef = CARD_ACCENT_COLORS.find((c) => c.id === look.accent);
  captureDraftFields();
  cardDraft.theme = look.theme;
  cardDraft.bgStyle = look.theme;
  cardDraft.accentColor = (accentDef && accentDef.hex) || cardDraft.accentColor;
  cardDraft.border = look.border;
  cardDraft.layout = look.layout;
  cardDraft.font = look.font;
  cardDraft._appliedLook = id;
  renderCardEditor();
}

function renderCardEditor() {
  const allowSkip = true;
  const t = resolveCardColors(
    cardDraft.bgStyle || cardDraft.theme,
    cardDraft.accentColor,
  );

  const signatureLooksHtml = `<div class="ce-looks-row">
    ${CARD_SIGNATURE_LOOKS.map((look) => {
      const looksAccent = CARD_ACCENT_COLORS.find((c) => c.id === look.accent);
      const looksTheme = CARD_BG_STYLES.find((s) => s.id === look.theme);
      const active = cardDraft._appliedLook === look.id;
      return `<button class="ce-look-card${active ? " active" : ""}" onclick="applySignatureLook('${look.id}')" title="${escapeHtml(look.blurb)}">
        <span class="ce-look-swatch" style="background:${looksTheme ? looksTheme.bg : "#222"};">
          <span class="ce-look-swatch-dot" style="background:${looksAccent ? looksAccent.hex : "#FFCF33"};"></span>
        </span>
        <span class="ce-look-name">${escapeHtml(look.name)}</span>
      </button>`;
    }).join("")}
  </div>`;

  // Build color swatch grid by color family
  const colorFamilies = [
    {
      label: "Blues",
      ids: [
        "sky",
        "blue",
        "cobalt-ac",
        "sapphire",
        "navy",
        "ice",
        "periwinkle",
        "cerulean",
        "steel",
        "powder",
        "azure",
        "denim-ac",
        "ocean-ac",
        "cobalt-light",
        "powder-deep",
      ],
    },
    {
      label: "Purples",
      ids: [
        "violet",
        "purple",
        "lavender",
        "indigo",
        "grape",
        "mauve",
        "lilac",
        "heather",
        "amethyst-ac",
        "byzantium",
        "wisteria",
        "aubergine-ac",
        "orchid-ac",
      ],
    },
    {
      label: "Pinks & Reds",
      ids: [
        "hot-pink",
        "rose-ac",
        "crimson-ac",
        "coral",
        "blush-ac",
        "magenta",
        "scarlet",
        "flamingo",
        "salmon",
        "ruby",
        "candy",
        "cherry-ac",
        "bubblegum",
        "cerise",
        "carnation",
      ],
    },
    {
      label: "Oranges & Yellows",
      ids: [
        "amber",
        "gold",
        "tangerine",
        "peach",
        "copper-ac",
        "honey",
        "sunshine",
        "butter",
        "saffron",
        "apricot",
        "mustard",
        "burnt-orange",
        "lemon",
        "goldenrod",
      ],
    },
    {
      label: "Greens",
      ids: [
        "emerald",
        "mint",
        "jade-ac",
        "sage-ac",
        "lime",
        "teal",
        "seafoam",
        "moss",
        "forest-ac",
        "olive",
        "lime-green",
        "pine-green",
        "viridian",
        "sage-green",
        "hunter",
      ],
    },
    {
      label: "Warm Tones",
      ids: [
        "terracotta",
        "brick",
        "rust",
        "bronze",
        "hazel",
        "maple",
        "cinnamon",
      ],
    },
    {
      label: "Cool Tones",
      ids: [
        "slate-blue-ac",
        "arctic-ac",
        "powder-blue",
        "muted-teal",
        "seafoam-deep",
        "mint-fresh",
        "glacier",
      ],
    },
    {
      label: "Neutrals",
      ids: [
        "white",
        "silver",
        "platinum",
        "champagne",
        "sand",
        "slate-ac",
        "warm-white",
        "oyster",
        "stone",
        "pewter",
        "graphite-ac",
      ],
    },
    { label: "Metallics", ids: ["gold-foil", "rose-gold-ac", "neon-cyan"] },
  ];
  const colorSwatchesHtml = colorFamilies
    .map(
      (fam) => `
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-color-grid">
      ${fam.ids
        .map((cid) => {
          const c = CARD_ACCENT_COLORS.find((x) => x.id === cid);
          if (!c) return "";
          const isActive = cardDraft.accentColor === c.hex;
          return `<button class="cc-swatch${isActive ? " active" : ""}" data-id="${c.id}" title="${c.name}"
          style="background:${c.hex};"
          onclick="selectCardAccentColor('${c.hex}','${c.id}')">
          <span class="cc-swatch-label">${c.name}</span>
        </button>`;
        })
        .join("")}
    </div>`,
    )
    .join("");

  // Build background style grid
  const styleFamilies = [
    {
      label: "Dark Tones",
      ids: [
        "midnight",
        "obsidian",
        "charcoal",
        "slate",
        "ink",
        "abyss",
        "noir",
        "volcanic",
        "cosmos",
        "carbon",
        "graphite",
        "pitch",
        "nightfall",
        "anthracite",
        "void",
      ],
    },
    {
      label: "Light Tones",
      ids: [
        "cloud",
        "pearl",
        "cream",
        "cotton",
        "frost",
        "linen-bg",
        "chalk",
        "mist",
        "blush",
        "sage-light",
        "snow",
        "ivory",
        "eggshell",
        "lilac-mist",
        "peach-mist",
      ],
    },
    {
      label: "Rich & Deep",
      ids: [
        "ocean",
        "forest",
        "cherry",
        "cobalt",
        "jade",
        "amber-dark",
        "plum",
        "crimson",
        "denim",
        "copper-bg",
        "burgundy",
        "pine",
        "aubergine",
        "mahogany",
        "steel-dark",
      ],
    },
    {
      label: "Gradient Moods",
      ids: [
        "aurora",
        "sunset",
        "twilight",
        "deepspace",
        "summer",
        "arctic",
        "jungle",
        "lagoon",
        "fire",
        "violet-storm",
        "ember",
        "northern-lights",
        "galaxy",
        "bloom",
        "citrus",
        "rose-gold",
        "forest-floor",
        "prism",
        "vapor",
        "mango-glow",
        "midnight-ocean",
        "magma",
        "royal-purple",
        "deep-teal",
        "spring",
        "arctic-dawn",
        "amethyst",
        "deep-rose",
        "peach-glow",
        "forest-night",
      ],
    },
    {
      label: "Cloud Classics",
      ids: [
        "storm",
        "nimbus",
        "electric",
        "thunder",
        "cirrus",
        "dusk",
        "overcast",
        "haze",
        "squall",
        "altitude",
      ],
    },
    {
      label: "Vintage & Warm",
      ids: [
        "sepia",
        "warm-stone",
        "terracotta-bg",
        "parchment",
        "antique",
        "washed-denim",
        "dusty-rose",
        "harvest",
        "cedar",
        "tobacco",
        "wheat",
        "clay",
        "bourbon",
        "sand-dune",
        "amber-cream",
      ],
    },
  ];
  const styleGridHtml = styleFamilies
    .map(
      (fam) => `
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-style-grid">
      ${fam.ids
        .map((sid) => {
          const s = CARD_BG_STYLES.find((x) => x.id === sid);
          if (!s) return "";
          const isActive = (cardDraft.bgStyle || cardDraft.theme) === s.id;
          const nameColor = s.dark
            ? "rgba(255,255,255,0.85)"
            : "rgba(0,0,0,0.72)";
          return `<button class="cc-style-btn${isActive ? " active" : ""}" data-id="${s.id}"
          onclick="selectCardTheme('${s.id}')" title="${s.name}">
          <div class="cc-style-preview" style="background:${s.bg};">
            <span class="cc-style-name" style="color:${nameColor};">${s.name}</span>
          </div>
        </button>`;
        })
        .join("")}
    </div>`,
    )
    .join("");

  // Frame tab: border, layout, and typeface — the three remaining
  // customization axes (theme lives on Card Base, accent has its own tab).
  const borderGridHtml = `<div class="cc-pattern-grid">
    ${CARD_BORDERS.map(
      (b) =>
        `<button class="cc-pattern-btn${cardDraft.border === b.id ? " active" : ""}" data-border="${b.id}" onclick="selectCardBorder('${b.id}')" title="${escapeHtml(b.desc)}">${escapeHtml(b.name)}</button>`,
    ).join("")}
  </div>`;
  const layoutGridHtml = `<div class="cc-pattern-grid">
    ${CARD_LAYOUTS.map(
      (l) =>
        `<button class="cc-pattern-btn${cardDraft.layout === l.id ? " active" : ""}" data-layout="${l.id}" onclick="selectCardLayout('${l.id}')" title="${escapeHtml(l.desc)}">${escapeHtml(l.name)}</button>`,
    ).join("")}
  </div>`;
  const fontGridHtml = `<div class="cc-pattern-grid">
    ${CARD_FONTS.map(
      (f) =>
        `<button class="cc-pattern-btn${cardDraft.font === f.id ? " active" : ""}" data-font="${f.id}" onclick="selectCardFont('${f.id}')" style="font-family:${f.family};font-weight:${f.weight};${f.italic ? "font-style:italic;" : ""}">${escapeHtml(f.name)}</button>`,
    ).join("")}
  </div>`;

  const areaPillsHtml = LONDON_AREAS.map((a) => {
    const sel = cardDraft.areas.includes(a);
    const disabled = !sel && cardDraft.areas.length >= 3;
    return `<button class="ce-area-pill${sel ? " active" : ""}" data-area="${escapeHtml(a)}" onclick="toggleCardArea('${escapeHtml(a)}')" ${disabled ? "disabled" : ""}>${escapeHtml(a)}</button>`;
  }).join("");

  const liveCardHtml = `<div class="ce-live-card" id="ce-live-card" style="background:${t.bg};border-color:${t.border};">
    ${
      cardDraft.photo || cardDraft.avatarUrl
        ? `<img src="${cardDraft.photo || cardDraft.avatarUrl}" id="ce-preview-photo" style="position:absolute;top:0;right:0;width:56px;height:56px;object-fit:cover;border-radius:0 6px 0 10px;border-left:1.5px solid ${t.accent};border-bottom:1.5px solid ${t.accent};z-index:3;" alt=""/>`
        : `<div id="ce-preview-photo"></div>`
    }
    <div class="ce-card-shine"></div>
    <div class="ce-card-body">
      <div class="ce-card-top-row">
        <div>
          <div class="ce-preview-label" id="ce-preview-label" style="color:${t.textSoft};">// Cumulus Pass</div>
          <div class="ce-preview-accent" id="ce-preview-accent" style="background:${t.accent};"></div>
        </div>
      </div>
      <div class="ce-preview-name" id="ce-preview-name" style="color:${t.text};">${escapeHtml(state.profileName || "Your Name")}</div>
      <div class="ce-preview-motto" id="ce-preview-motto" style="color:${t.accent};">${cardDraft.motto ? `"${escapeHtml(cardDraft.motto)}"` : ""}</div>
      <div class="ce-preview-bio" id="ce-preview-bio" style="color:${t.textSoft};">${cardDraft.bio || "Tell your story…"}</div>
      <div class="ce-preview-tags" id="ce-preview-tags">
        ${cardDraft.areas
          .map(
            (s) =>
              `<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`,
          )
          .join("")}
      </div>
    </div>
    <div class="ce-preview-wm" id="ce-preview-wm" style="color:${t.accent};">CU</div>
  </div>`;

  document.getElementById("card-editor-root").innerHTML = `
  <div class="ce-overlay">

    <!-- Top bar -->
    <div class="ce-topbar">
      <button class="ce-topbar-back" onclick="closeCardEditor()">←</button>
      <div class="ce-topbar-title">${cardEditorWelcome ? "Welcome — build your pass" : "Card builder"}</div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${allowSkip ? `<button class="ce-topbar-skip" onclick="skipCard()">Skip</button>` : cardEditorWelcome ? `<button class="ce-topbar-skip" onclick="closeCardEditor()">Skip for now</button>` : ""}
        <button class="ce-topbar-save" onclick="saveCard()">Save</button>
      </div>
    </div>
    ${cardEditorWelcome ? `<div class="ce-welcome-note">This is the pass you'll carry to every event — make it yours while the map warms up behind. You can change it any time from your Pass.</div>` : ""}

    <!-- Split: preview | controls -->
    <div class="ce-shell">

      <!-- LEFT — live card preview only -->
      <div class="ce-left">
        <div class="ce-card-wrap">
          ${liveCardHtml}
        </div>
        <div class="ce-spin-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Drag to spin
        </div>
        <div class="ce-left-actions">
          <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
          ${
            allowSkip
              ? `<button class="btn btn-outline" onclick="skipCard()">Skip</button>`
              : `<button class="btn btn-outline" onclick="closeCardEditor()">${cardEditorWelcome ? "Skip for now" : "Cancel"}</button>`
          }
        </div>
      </div>

      <!-- RIGHT — tabbed controls -->
      <div class="ce-right">

        <!-- Signature Looks: curated one-tap presets across all 5 axes,
             sitting above the granular pickers as the fast path to a good
             result — see CARD_SIGNATURE_LOOKS. -->
        <div class="ce-section ce-looks-section">
          <div class="ce-section-label">Signature looks</div>
          ${signatureLooksHtml}
        </div>

        <!-- Tab bar: Card Base | Frame | Accent | About You -->
        <div class="ce-tabs-bar">
          <button class="ce-tab-btn active" data-tab="base"   onclick="switchCeTab('base')">Card Base</button>
          <button class="ce-tab-btn"        data-tab="frame"  onclick="switchCeTab('frame')">Frame</button>
          <button class="ce-tab-btn"        data-tab="accent" onclick="switchCeTab('accent')">Accent</button>
          <button class="ce-tab-btn"        data-tab="about"  onclick="switchCeTab('about')">About You</button>
        </div>

        <!-- ─ CARD BASE TAB ─ -->
        <div class="ce-tab-panel active" data-tab="base">
          <div class="ce-section">
            <div class="ce-section-label">Card background</div>
            ${styleGridHtml}
          </div>
        </div>

        <!-- ─ FRAME TAB — border/material, badge layout, typeface ─ -->
        <div class="ce-tab-panel" data-tab="frame">
          <div class="ce-section">
            <div class="ce-section-label">Border &amp; material</div>
            ${borderGridHtml}
          </div>
          <div class="ce-section">
            <div class="ce-section-label">Badge &amp; stats layout</div>
            ${layoutGridHtml}
          </div>
          <div class="ce-section">
            <div class="ce-section-label">Typeface</div>
            ${fontGridHtml}
          </div>
        </div>

        <!-- ─ ACCENT TAB ─ -->
        <div class="ce-tab-panel" data-tab="accent">
          <div class="ce-section">
            <div class="ce-section-label">Highlight colour</div>
            ${colorSwatchesHtml}
          </div>
        </div>

        <!-- ─ ABOUT YOU TAB ─ -->
        <div class="ce-tab-panel" data-tab="about">

          <div class="ce-section">
            <div class="ce-section-label">Your photo <span class="ce-optional">optional</span></div>
            <div class="ce-photo-about" id="ce-photo-zone">
              <input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
              ${
                cardDraft.photo || cardDraft.avatarUrl
                  ? `<img src="${cardDraft.photo || cardDraft.avatarUrl}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
                  <div class="ce-photo-about-lbl">Tap to change<span>Shows on your pass &amp; host profile</span></div>
                  <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`
                  : `<div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                  </div>
                  <div class="ce-photo-about-lbl">Add photo<span>Shows on your pass &amp; host profile</span></div>`
              }
            </div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your motto <span class="ce-optional">optional · 60 chars</span></div>
            <input id="card-motto" class="ce-input" placeholder="e.g. Always up for something new" value="${escapeHtml(cardDraft.motto)}" oninput="updateCardPreview()" autocomplete="off" maxlength="60"/>
            <div class="ce-char-hint">Shown under your name — takes priority over "About you" below if both are filled in</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">About you <span class="ce-optional">optional</span></div>
            <textarea id="card-bio" class="ce-input ce-textarea" rows="3" placeholder="What brings you to events like these?" oninput="updateCardPreview()">${escapeHtml(cardDraft.bio)}</textarea>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Fun fact <span class="ce-optional">optional</span></div>
            <input id="card-fact" class="ce-input" placeholder="e.g. once got lost in IKEA for 3 hours" value="${escapeHtml(cardDraft.fact)}" oninput="updateCardPreview()" autocomplete="off"/>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your local spots <span class="ce-optional">pick up to 3</span></div>
            <div class="ce-char-hint" id="ce-area-hint" style="margin-bottom:14px;">${cardDraft.areas.length}/3 selected${cardDraft.areas.length === 3 ? " — tap any to deselect" : ""}</div>
            <div class="ce-area-grid" id="ce-area-grid">${areaPillsHtml}</div>
          </div>

          <div class="ce-save-row">
            <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
            ${allowSkip ? `<button class="btn btn-outline" onclick="skipCard()">Skip</button>` : `<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
          </div>

        </div>

      </div><!-- /ce-right -->
    </div><!-- /ce-shell -->
  </div>`;
  // 3D drag-to-spin with spring return
  const liveCard = document.getElementById("ce-live-card");
  liveCard.style.cursor = "grab";
  let _ceSpin = false,
    _ceStartX = 0,
    _ceStartY = 0,
    _cePrevX = 0,
    _cePrevY = 0;
  let _ceRotY = 0,
    _ceRotX = 0,
    _ceVelY = 0,
    _ceVelX = 0,
    _ceRaf = 0;
  function _ceSetT(ry, rx) {
    liveCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function _ceSpring() {
    _ceVelY = _ceVelY * 0.82 - _ceRotY * 0.12;
    _ceVelX = _ceVelX * 0.82 - _ceRotX * 0.12;
    _ceRotY += _ceVelY;
    _ceRotX += _ceVelX;
    _ceSetT(_ceRotY, _ceRotX);
    if (
      Math.abs(_ceRotY) < 0.1 &&
      Math.abs(_ceRotX) < 0.1 &&
      Math.abs(_ceVelY) < 0.1 &&
      Math.abs(_ceVelX) < 0.1
    ) {
      _ceRotY = 0;
      _ceRotX = 0;
      _ceVelY = 0;
      _ceVelX = 0;
      _ceSetT(0, 0);
    } else {
      _ceRaf = requestAnimationFrame(_ceSpring);
    }
  }
  liveCard.addEventListener("pointerdown", (e) => {
    _ceSpin = true;
    _ceStartX = _cePrevX = e.clientX;
    _ceStartY = _cePrevY = e.clientY;
    _ceRotY = 0;
    _ceRotX = 0;
    _ceVelY = 0;
    _ceVelX = 0;
    cancelAnimationFrame(_ceRaf);
    liveCard.setPointerCapture(e.pointerId);
    liveCard.style.cursor = "grabbing";
    e.preventDefault();
  });
  liveCard.addEventListener("pointermove", (e) => {
    if (!_ceSpin) return;
    const dx = e.clientX - _ceStartX,
      dy = e.clientY - _ceStartY;
    _ceVelY = (e.clientX - _cePrevX) * 0.18;
    _ceVelX = -(e.clientY - _cePrevY) * 0.12;
    _cePrevX = e.clientX;
    _cePrevY = e.clientY;
    _ceRotY = dx * 0.18;
    _ceRotX = -dy * 0.12;
    _ceSetT(_ceRotY, _ceRotX);
  });
  const _ceEnd = () => {
    if (!_ceSpin) return;
    _ceSpin = false;
    liveCard.style.cursor = "grab";
    _ceRaf = requestAnimationFrame(_ceSpring);
  };
  liveCard.addEventListener("pointerup", _ceEnd);
  liveCard.addEventListener("pointercancel", _ceEnd);
}
function switchCeTab(tab) {
  captureDraftFields();
  document
    .querySelectorAll(".ce-tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document
    .querySelectorAll(".ce-tab-panel")
    .forEach((p) => p.classList.toggle("active", p.dataset.tab === tab));
}
async function saveCard() {
  captureDraftFields();
  // motto takes priority over bio for display (see openExpandedCard) —
  // whichever the user actually filled in is what gets persisted as the
  // one canonical card_bio, rather than keeping motto as a second
  // local-only concept layered on top of a DB-backed bio.
  const displayBio = (cardDraft.motto || cardDraft.bio || "").trim();
  const accentMatch = CARD_ACCENT_COLORS.find(
    (c) => c.hex === cardDraft.accentColor,
  );
  const patch = {
    theme: cardDraft.bgStyle || cardDraft.theme || "crimson",
    accent: (accentMatch && accentMatch.id) || "gold",
    border: cardDraft.border || "classic",
    layout: cardDraft.layout || "standard",
    font: cardDraft.font || "inter",
    bio: displayBio,
    areas: Array.isArray(cardDraft.areas) ? cardDraft.areas : [],
    fact: (cardDraft.fact || "").trim(),
  };
  if (cardDraft.photo) {
    const blob = dataUrlToBlob(cardDraft.photo);
    const url = blob ? await uploadAvatarPhoto(blob) : null;
    if (url) patch.avatarUrl = url;
  } else if (cardDraft.avatarRemoved) {
    patch.avatarUrl = "";
  }
  await saveMyCardFields(patch);
  document.getElementById("card-editor-root").innerHTML = "";
  renderNav();
  renderView();
}
// canvas.toDataURL() (the onboarding photo-capture step, captureDraftFields
// above) yields a base64 data URL, not a File/Blob — uploadAvatarPhoto
// (services.js) needs a real Blob to run through compressImageFile's
// canvas re-encode, same as a normal file-input upload would provide.
function dataUrlToBlob(dataUrl) {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch (e) {
    return null;
  }
}
function skipCard() {
  document.getElementById("card-editor-root").innerHTML = "";
}
function closeCardEditor() {
  document.getElementById("card-editor-root").innerHTML = "";
}

async function initApp() {
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

  if (!state.myCard) {
    const cardRaw = await localGet(`card:${state.profileName}`);
    if (cardRaw) {
      try {
        state.myCard = JSON.parse(cardRaw);
      } catch (e) {}
    }
  }

  // Refresh view quietly once real data is in (still on map = update markers)
  if (state.view === "browse") renderView();
}

