// ── Day/night cycle ───────────────────────────────────────────────────────
// The whole app — landing diorama + explore/host maps — is lit by London's
// ACTUAL time of day, not the device's OS dark-mode setting: light 06:00–17:59,
// dark otherwise. One source of truth, re-checked every minute so the scene
// transitions live as the hour rolls over (and any open map re-lights with it).
function themeForNow() {
  try {
    const h = parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "numeric",
        hourCycle: "h23",
      }).format(new Date()),
      10,
    );
    return h >= 6 && h < 18 ? "light" : "dark";
  } catch (e) {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }
}
// Re-check the clock; if the day/night phase flipped, apply it everywhere.
function applyDayNight() {
  const t = themeForNow();
  if (t === state.theme) return;
  state.theme = t;
  applyTheme();
  if (lmap) applyMapChrome(lmap, true);
  if (hostMap) applyMapChrome(hostMap, false);
}
let _dayNightTimer = null;
function startDayNightCycle() {
  state.theme = themeForNow();
  applyTheme();
  if (lmap) applyMapChrome(lmap, true);
  if (hostMap) applyMapChrome(hostMap, false);
  if (_dayNightTimer) clearInterval(_dayNightTimer);
  _dayNightTimer = setInterval(applyDayNight, 60000);
}

// ---- MAPBOX TOKEN ----
const DEFAULT_MAPBOX_TOKEN =
  (window.CUMULUS_CONFIG && window.CUMULUS_CONFIG.MAPBOX_TOKEN) ||
  "pk.eyJ1IjoibHVjcmFzc3Nzc3MiLCJhIjoiY21xam1pcTJ4MGt0dTJzcXhobnQyZ3owMiJ9.RpRNYuS-zJnNdZ3wOGl61g";
let MAPBOX_TOKEN = DEFAULT_MAPBOX_TOKEN;
function mapboxConfigured() {
  return !!(MAPBOX_TOKEN && MAPBOX_TOKEN.trim());
}
// Switched to Mapbox Standard Style to seamlessly support toggle properties without map reload.
function mapboxStyleUrl() {
  return "mapbox://styles/mapbox/standard?optimize=true";
}
// Secret-club map chrome: theme-linked lighting, and on the explore map a
// decluttered "underground" feel — hide commercial POI + transit labels so
// the only pins that matter are our events. Safe no-op if the style isn't
// ready or a property is unsupported.
function applyMapChrome(map, declutter) {
  if (!map) return;
  try {
    map.setConfigProperty(
      "basemap",
      "lightPreset",
      state.theme === "dark" ? "night" : "day",
    );
    map.setConfigProperty("basemap", "show3dTrees", false); // Universally disable trees for performance
    if (declutter) {
      map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
      map.setConfigProperty("basemap", "showTransitLabels", false);
    }
  } catch (e) {}
}

// ---- GEOCODING ----
let geocodeCache = {},
  geocodingInProgress = false,
  geocodeProgress = { done: 0, total: 0 };
async function loadGeocodeCache() {
  try {
    const r = await storageGet("geocode_cache");
    geocodeCache = r ? JSON.parse(r) : {};
  } catch (e) {
    geocodeCache = {};
  }
}
async function persistGeocodeCache() {
  try {
    const keys = Object.keys(geocodeCache);
    if (keys.length > 300) {
      keys.slice(0, keys.length - 300).forEach((k) => delete geocodeCache[k]);
    }
    await storageSet("geocode_cache", JSON.stringify(geocodeCache));
  } catch (e) {}
}
function needsGeocode(ev) {
  return (ev.lat == null || ev.lon == null) && ev.address;
}
async function geocodeAddress(address) {
  if (geocodeCache[address]) return geocodeCache[address];
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=1&proximity=-0.1276,51.5072`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) throw new Error(`no match: ${address}`);
  const coords = { lat: f.center[1], lon: f.center[0] };
  geocodeCache[address] = coords;
  return coords;
}
function geocodeBannerHtml() {
  if (!geocodingInProgress) return "";
  return `<div class="map-caption" style="bottom:auto;top:calc(var(--top-h) + 10px);right:12px;left:auto;transform:none;font-size:10.5px;">${geocodeProgress.done}/${geocodeProgress.total} placed</div>`;
}
function updateGeocodeBanner() {
  const el = document.getElementById("geocode-banner");
  if (el) el.innerHTML = geocodeBannerHtml();
}
const AREA_FALLBACK_CENTER = { lat: 51.5072, lon: -0.1276 };
async function resolveEventLocations() {
  if (geocodingInProgress || !mapboxConfigured()) return;
  const pending = EVENTS.filter(needsGeocode);
  if (!pending.length) return;
  geocodingInProgress = true;
  geocodeProgress = { done: 0, total: pending.length };
  updateGeocodeBanner();
  const concurrency = 6;
  let idx = 0;
  async function worker() {
    while (idx < pending.length) {
      const ev = pending[idx++];
      try {
        const c = await geocodeAddress(ev.address);
        ev.lat = c.lat;
        ev.lon = c.lon;
      } catch (e) {
        const f = AREA_FALLBACK_CENTER;
        ev.lat = f.lat + (Math.random() - 0.5) * 0.06;
        ev.lon = f.lon + (Math.random() - 0.5) * 0.1;
      }
      geocodeProgress.done++;
      updateGeocodeBanner();
      if (state.view === "browse") refreshMarkers();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  await persistGeocodeCache();
  geocodingInProgress = false;
  updateGeocodeBanner();
}

function attendeesFor(id) {
  const out = DEMO_PEOPLE.filter((p) => p.events.includes(id)).map(
    (p) => p.name,
  );
  (state.rsvps[id] || []).forEach((n) => {
    if (!out.includes(n)) out.push(n);
  });
  return out;
}
/* toggleTheme removed */
async function persistProfile() {
  if (!state.profileId) state.profileId = generateUniqueId();
  const payload = {
    name: state.profileName,
    email: state.profileEmail,
    phone_number: state.profilePhone || null,
    avatar_url: state.profileAvatarUrl || null,
    cover_url: state.profileCoverUrl || null,
    profile_id: state.profileId,
    special_badges: state.specialBadges,
    theme: state.theme,
  };
  if (state.userId) payload.id = state.userId;
  const { data, error } = await sb
    .from("users")
    .upsert(payload, { onConflict: "email" })
    .select()
    .single();
  if (data && data.id) state.userId = data.id;
}
function computeEventDates(ev) {
  const st = new Date(ev.startTime),
    et = new Date(ev.endTime);
  ev.startsAt = st.getTime();
  ev.endsAt = et.getTime();
  const df = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const tf = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  ev.date = df.format(st);
  ev.time = `${tf.format(st)} - ${tf.format(et)}`;
}

async function start() {
  // Theme follows London's day/night cycle — not the OS setting or a saved
  // preference. startDayNightCycle() sets it now and keeps it in sync.
  startDayNightCycle();
  MAPBOX_TOKEN = DEFAULT_MAPBOX_TOKEN;

  // ── Session-first boot ──────────────────────────────────────────────────
  // Check for an existing Supabase Auth session BEFORE rendering the gate.
  // If the user is already logged in (reload / return visit), go straight
  // to the app — never show the gate at all. Only show the gate if there
  // is genuinely no active session. This prevents the "reload logs you out
  // then back in" loop where the gate would flash and accept inputs while
  // enterApp() was already booting in the background.
  let authUser = null;
  try {
    authUser = await authCurrentUser();
  } catch (e) {}

  if (authUser) {
    let profile = await loadUserProfile(authUser.id).catch(() => null);
    if (!profile) {
      // Authenticated but profile fetch failed (offline). Restore from cache.
      try {
        const raw = await localGet("cumulus_session");
        if (raw) {
          const s = JSON.parse(raw);
          if (s && s.userId === authUser.id && s.name) {
            profile = {
              id: s.userId,
              name: s.name,
              email: s.email,
              profile_id: s.profileId,
              special_badges: s.specialBadges,
            };
          }
        }
      } catch (e) {}
    }

    if (profile && profile.name) {
      // ── Returning user: skip the gate entirely ──
      _restoreUserFromRow(profile);
      state.profileEmail = profile.email || authUser.email || "";
      await localSet("cumulus_email", state.profileEmail);
      _cacheSession();

      // Show a minimal loading screen while the app boots (no gate flash)
      const gateRoot = document.getElementById("gate-root");
      if (gateRoot) {
        gateRoot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;
          background:var(--bg,#0d0e1a);flex-direction:column;gap:16px">
          <div style="width:36px;height:36px;border:3px solid rgba(255,207,51,0.25);
            border-top-color:#FFCF33;border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <span style="color:rgba(255,255,255,0.5);font-size:13px;font-family:sans-serif">Resuming session…</span>
        </div>`;
      }

      enterApp();
      return; // Done — no gate needed
    }
  }

  // No active session (or profile incomplete) → straight into guest
  // browsing (map/events, no marketing wall, no login prompt). The old
  // marketing landing page is now host-only — see the "Become a host"
  // brochure in renderHostApplyView() (09-host-analytics.js) — a plain
  // visitor's fastest path to "see an event, look into it, buy a ticket"
  // is the app itself, not a pitch page standing in front of it.
  enterGuestBrowse();
}

// The app's actual default entry point for anyone without a session —
// contradicting the product's own "no invite code, curator gate, or unlock
// step standing between a user and the map" principle (PRODUCT.md) would be
// showing a marketing page first and making a visitor click through it.
// events_read_anon (migration 20260723050000) grants the anon role SELECT on
// non-hidden/non-cancelled events, so enterApp() itself works fine with no
// session — state.userId simply stays unset, which every write path
// (openBook(), openAccount(), toggleFollowHost(), event reporting) already
// checks before calling showLpSignup() instead.
function enterGuestBrowse() {
  enterApp();
}

// Standalone sign-up/login overlay — injected on demand via showLpSignup()
// once inside the app (see enterGuestBrowse()), where #gate-root has
// already been cleared and nothing else would otherwise render this modal.
// Used whenever a guest hits a gated action mid-session (Book Now, Account,
// Follow a host…) — there is no separate marketing landing page anymore.
//
// No longer shows a "Cumulus Pass" card preview here — that member-card/
// badge system was removed from the product outright (see ARCHITECTURE.md
// "the gamified card/badge system removal"), but this onboarding teaser
// kept advertising it ("This is what you'll carry to every event.") with
// fake interest tags, promising a feature that no longer exists to every
// single new signup.
function signupModalHtml(prefillName, prefillEmail) {
  return `
    <div class="lp-signup-overlay" id="lp-signup-overlay" onclick="if(event.target===this)closeLpSignup()">
      <div class="lp-signup-modal">
        <button class="lp-signup-close" onclick="closeLpSignup()" aria-label="Close">✕</button>

        <!-- Auth mode: Sign up vs Log in -->
        <div class="auth-mode-sel">
          <button class="auth-mode-btn active" id="am-signup" onclick="switchAuthMode('signup')">Sign up</button>
          <button class="auth-mode-btn" id="am-login" onclick="switchAuthMode('login')">Log in</button>
        </div>

        <!-- Type selector: Attendee vs Host (sign up only) -->
        <div class="gate-type-sel" id="gate-type-sel">
          <button class="gate-type-btn active" id="gt-attendee" onclick="switchSignupType('attendee')">
            Join as attendee
          </button>
          <button class="gate-type-btn" id="gt-host" onclick="switchSignupType('host')">
            Become a host
          </button>
        </div>

        <!-- Host teaser (shown when host tab selected) -->
        <div id="gate-host-preview" style="display:none;margin-bottom:20px;padding:16px;background:color-mix(in srgb,var(--accent) 6%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);border-radius:14px;">
          <div style="font-size:22px;margin-bottom:8px;">🎪</div>
          <div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:4px;">Host verified events on Cumulus</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">Tell us about your venue or events. Applications are reviewed by our team — approved hosts can post public events, sell tickets, and access host analytics.</div>
        </div>

        <div class="lp-form-eyebrow" id="gate-form-eyebrow">Free to join · Takes 20 seconds</div>
        <h3 class="lp-form-title" id="gate-form-title">Join Cumulus</h3>
        <p class="lp-form-sub" id="gate-form-sub">Every event on Cumulus is public — join in seconds, no invite needed.</p>

        <div class="gate-field" id="gate-name-field">
          <label class="gate-label" for="gate-name">Full name</label>
          <input id="gate-name" class="gate-input" placeholder="e.g. Alex Rivera" value="${escapeHtml(prefillName || "")}" autocomplete="name"/>
        </div>
        <div class="gate-field">
          <label class="gate-label" for="gate-email">Email address</label>
          <input id="gate-email" class="gate-input" type="email" placeholder="you@email.com" value="${escapeHtml(prefillEmail || "")}" autocomplete="email"/>
        </div>

        <!-- Host-only extra fields -->
        <div id="gate-host-fields" style="display:none;" class="gate-host-extra">
          <div class="gate-field">
            <label class="gate-label" for="gate-biz-name">Venue or business name</label>
            <input id="gate-biz-name" class="gate-input" placeholder="e.g. The Sketch House" autocomplete="organization"/>
          </div>
          <div class="gate-field-group-label">Event types you'd host</div>
          <div class="host-cat-grid" id="host-cat-grid">
            ${["Creative", "Gaming", "Movie Nights", "Board Games", "Meetups", "Food &amp; Drink", "Live Music", "Wellness &amp; Outdoors", "Tech &amp; Talks"].map((c) => `<button class="host-cat-chip" data-hostcat="${escapeHtml(c.replace(/&amp;/g, "&"))}" onclick="toggleHostCat('${escapeHtml(c.replace(/&amp;/g, "&"))}')">${c}</button>`).join("")}
          </div>
          <div class="gate-field" style="margin-top:15px;">
            <label class="gate-label" for="gate-host-desc">About your events</label>
            <textarea id="gate-host-desc" class="gate-input" placeholder="What kind of events do you run? Describe the vibe, size, and frequency…" rows="3" maxlength="400"></textarea>
          </div>
          <div class="gate-field">
            <label class="gate-label" for="gate-why-host">Why host on Cumulus?</label>
            <textarea id="gate-why-host" class="gate-input" placeholder="Tell us what you're hoping to achieve…" rows="2" maxlength="300"></textarea>
          </div>
        </div>

        <p id="gate-field-error" class="gate-field-error"></p>
        <button class="lp-claim-btn" onclick="submitGate()">
          <span class="lp-claim-btn-text" id="gate-claim-label">Join Cumulus →</span>
          <div class="lp-claim-shimmer"></div>
        </button>

        <div class="lp-form-trust" id="gate-trust-strip">
          <span>Everyone welcome</span>
          <span>·</span>
          <span>Zero host fees</span>
          <span>·</span>
          <span>Leave anytime</span>
        </div>
      </div>
    </div>`;
}

// Attaches the Enter-to-advance keydown handlers on the sign-up modal's name/
// email fields. Called once after the modal's markup lands in the DOM, the
// first time showLpSignup() injects it on demand mid-session.
function attachSignupModalListeners() {
  const nameEl = document.getElementById("gate-name");
  const emailEl = document.getElementById("gate-email");
  if (nameEl)
    nameEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") emailEl?.focus();
    });
  if (emailEl)
    emailEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitGate();
    });
}

let _signupType = "attendee";
let _hostCats = [];
let _authMode = "signup"; // 'signup' | 'login'

function switchAuthMode(mode) {
  _authMode = mode;
  const isLogin = mode === "login";
  document.getElementById("am-signup")?.classList.toggle("active", !isLogin);
  document.getElementById("am-login")?.classList.toggle("active", isLogin);
  // Sign-up-only sections (class beats CSS !important display via source order)
  const hide = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("auth-hidden", cond);
  };
  hide("gate-type-sel", isLogin);
  hide("gate-name-field", isLogin);
  hide("gate-host-preview", isLogin || _signupType !== "host");
  hide("gate-host-fields", isLogin || _signupType !== "host");
  const eyebrow = document.getElementById("gate-form-eyebrow");
  const title = document.getElementById("gate-form-title");
  const sub = document.getElementById("gate-form-sub");
  const label = document.getElementById("gate-claim-label");
  const trust = document.getElementById("gate-trust-strip");
  if (isLogin) {
    if (eyebrow) eyebrow.textContent = "Welcome back";
    if (title) title.textContent = "Log in";
    if (sub)
      sub.textContent = "Enter your email to pick up right where you left off.";
    if (label) label.textContent = "Log in →";
    if (trust)
      trust.innerHTML =
        "<span>No password needed</span><span>·</span><span>Just your email</span>";
  } else {
    // Restore sign-up copy for the current attendee/host type
    switchSignupType(_signupType);
  }
}

function switchSignupType(type) {
  _signupType = type;
  _hostCats = [];
  document
    .getElementById("gt-attendee")
    .classList.toggle("active", type === "attendee");
  document
    .getElementById("gt-host")
    .classList.toggle("active", type === "host");
  document.getElementById("gate-host-preview").style.display =
    type === "host" ? "" : "none";
  document.getElementById("gate-host-fields").style.display =
    type === "host" ? "" : "none";
  const eyebrow = document.getElementById("gate-form-eyebrow");
  const title = document.getElementById("gate-form-title");
  const sub = document.getElementById("gate-form-sub");
  const label = document.getElementById("gate-claim-label");
  const trust = document.getElementById("gate-trust-strip");
  if (type === "host") {
    if (eyebrow) eyebrow.textContent = "Subject to review · Free to apply";
    if (title) title.textContent = "Apply to host";
    if (sub)
      sub.textContent =
        "Tell us about your events. Our team reviews every application to keep quality high on Cumulus.";
    if (label) label.textContent = "Submit application →";
    if (trust)
      trust.innerHTML =
        "<span>Free to apply</span><span>·</span><span>Reviewed within 48 hrs</span><span>·</span><span>No lock-in</span>";
  } else {
    if (eyebrow) eyebrow.textContent = "Free to join · Takes 20 seconds";
    if (title) title.textContent = "Join Cumulus";
    if (sub)
      sub.textContent =
        "Every event on Cumulus is public — join in seconds, no invite needed.";
    if (label) label.textContent = "Join Cumulus →";
    if (trust)
      trust.innerHTML =
        "<span>Everyone welcome</span><span>·</span><span>Zero host fees</span><span>·</span><span>Leave anytime</span>";
  }
  // Reset chip selections
  document
    .querySelectorAll(".host-cat-chip")
    .forEach((c) => c.classList.remove("active"));
}

function toggleHostCat(cat) {
  const btn = document.querySelector(`[data-hostcat="${CSS.escape(cat)}"]`);
  if (_hostCats.includes(cat)) {
    _hostCats = _hostCats.filter((c) => c !== cat);
    if (btn) btn.classList.remove("active");
  } else {
    _hostCats.push(cat);
    if (btn) btn.classList.add("active");
  }
}

function showLpSignup(mode) {
  let ov = document.getElementById("lp-signup-overlay");
  if (!ov) {
    // Not already in the DOM — a guest triggered a gated action mid-session
    // (Book Now, Account, Follow a host…). Inject the modal fresh rather
    // than silently no-op'ing.
    document.body.insertAdjacentHTML("beforeend", signupModalHtml());
    ov = document.getElementById("lp-signup-overlay");
    attachSignupModalListeners();
  }
  ov.classList.add("open");
  document.body.style.overflow = "hidden";
  switchAuthMode(mode === "login" ? "login" : "signup");
}
function showLpLogin() {
  showLpSignup("login");
}
function closeLpSignup() {
  const ov = document.getElementById("lp-signup-overlay");
  if (ov) {
    ov.classList.remove("open");
    document.body.style.overflow = "";
  }
}
function gateErr(msg) {
  const el = document.getElementById("gate-field-error");
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
  }
}
// Turn a raw auth error into human copy — never leak a non-message value
// (e.g. an empty "{}" body some mail providers return on a misconfigured
// SMTP send) to the sign-in screen or a toast.
function authErrMsg(err) {
  const s = typeof err === "string" ? err.trim() : "";
  if (/rate limit/i.test(s))
    return "Too many code requests just now — wait a minute, then try again.";
  if (!s || s === "unavailable" || s.charAt(0) === "{" || s.charAt(0) === "[")
    return "We couldn't send your code. Check your email address, or try again shortly.";
  return s;
}
// Persist a lightweight session snapshot so a reload can restore instantly and
// still boot the app if Supabase is momentarily unreachable.
function _cacheSession() {
  try {
    localStorage.setItem(
      "cumulus_session",
      JSON.stringify({
        userId: state.userId,
        profileId: state.profileId,
        name: state.profileName,
        email: state.profileEmail,
        specialBadges: state.specialBadges || [],
        theme: state.theme,
      }),
    );
  } catch (e) {}
}
function _restoreUserFromRow(existing) {
  state.userId = existing.id;
  state.profileId = existing.profile_id || generateUniqueId();
  state.profileName = existing.name;
  state.profileEmail = existing.email;
  state.profilePhone = existing.phone_number || "";
  state.profileAvatarUrl = existing.avatar_url || "";
  state.profileCoverUrl = existing.cover_url || "";
  state.specialBadges = existing.special_badges || [];
  // Theme is driven by the day/night cycle, not the saved profile value.
}

async function submitGate() {
  const isLogin = _authMode === "login";
  const email = (document.getElementById("gate-email").value || "").trim();
  const name = isLogin
    ? ""
    : (document.getElementById("gate-name").value || "").trim();
  const errEl = document.getElementById("gate-field-error");
  if (errEl) errEl.classList.remove("show");
  if (!isLogin && !name) {
    gateErr("Please add your name.");
    return;
  }
  if (!EMAIL_PATTERN.test(email)) {
    gateErr("Please enter a valid email address.");
    return;
  }

  // Host-specific validation (sign up only)
  let bizName = "",
    hostDesc = "",
    whyHost = "";
  if (!isLogin && _signupType === "host") {
    bizName = (document.getElementById("gate-biz-name")?.value || "").trim();
    hostDesc = (document.getElementById("gate-host-desc")?.value || "").trim();
    whyHost = (document.getElementById("gate-why-host")?.value || "").trim();
    if (!bizName) {
      gateErr("Please enter your venue or business name.");
      return;
    }
    if (_hostCats.length === 0) {
      gateErr("Please select at least one event type.");
      return;
    }
    if (!hostDesc) {
      gateErr("Please add a brief description of your events.");
      return;
    }
  }

  // ── Real auth, step 1: email the one-time code ──────────────────────────
  // We don't create/validate anything yet — name and host application both
  // happen in verifyGateCode() once we hold a real session (auth.uid()), so
  // RLS is satisfied and nothing can be forged client-side.
  const btn = document.querySelector(".lp-claim-btn");
  const label = () => btn && btn.querySelector("#gate-claim-label");
  const origLabel = label() ? label().textContent : "Continue →";
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Sending code…";
  }

  const res = await authSendCode(email, isLogin ? {} : { name });
  if (btn) {
    btn.disabled = false;
    if (label()) label().textContent = origLabel;
  }
  if (!res.ok) {
    gateErr(authErrMsg(res.error));
    return;
  }

  // Stash everything the verify step needs, then swap to the code entry panel.
  _pendingAuth = {
    isLogin,
    name,
    email,
    signupType: _signupType,
    bizName,
    hostDesc,
    whyHost,
    hostCats: [..._hostCats],
  };
  showOtpStep(email);
}

// Pending onboarding context between "send code" and "verify code".
let _pendingAuth = null;

