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

  // No active session (or profile incomplete) → show the landing gate
  renderGate();
}

// "Explore the Map →" on the landing hero used to call showLpSignup()
// directly — a visitor asking to see the map got a sign-up form instead,
// contradicting the product's own "no invite code, curator gate, or unlock
// step standing between a user and the map" principle (PRODUCT.md) and
// worse than every competitor researched (Eventbrite/DICE/Skiddle all allow
// anonymous browsing, gating only at RSVP/checkout). events_read_anon
// (migration 20260723050000) now grants the anon role SELECT on non-hidden/
// non-cancelled events, so enterApp() itself works fine with no session —
// state.userId simply stays unset, which every write path (openBook(),
// openAccount(), toggleFollowHost(), event reporting) already checks (or
// now checks — see those functions) before calling showLpSignup() instead.
function enterGuestBrowse() {
  enterApp();
}

/* ── Landing diorama — layered paper-cut London, theme-lit ──────────────
 * Two inline SVGs (back haze + front landmarks) so CSS [data-theme] drives
 * the lighting: bright flat facades by day, silhouettes with lit windows,
 * clock face and aviation beacons at night. preserveAspectRatio slice keeps
 * the scene edge-to-edge at any viewport width. Window grids are SVG
 * patterns (cheap); .dio-wins groups fade in staggered like dusk. */
const DIORAMA_BACK_SVG = `
<svg viewBox="0 0 2400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <g fill="var(--dio-back)">
    <circle cx="130" cy="252" r="46" fill="none" stroke="var(--dio-back)" stroke-width="4" opacity="0.55"/>
    <circle cx="130" cy="252" r="46" fill="var(--dio-back)" opacity="0.25"/>
    <rect x="0" y="228" width="58" height="72"/>
    <rect x="196" y="212" width="44" height="88"/>
    <rect x="252" y="238" width="60" height="62"/>
    <rect x="360" y="220" width="38" height="80"/>
    <rect x="430" y="196" width="52" height="104"/>
    <rect x="540" y="228" width="64" height="72"/>
    <rect x="648" y="204" width="34" height="96"/>
    <polygon points="700,300 700,196 716,178 732,196 732,300"/>
    <rect x="788" y="222" width="56" height="78"/>
    <rect x="876" y="188" width="40" height="112"/>
    <rect x="948" y="234" width="66" height="66"/>
    <rect x="1046" y="206" width="44" height="94"/>
    <rect x="1120" y="230" width="58" height="70"/>
    <rect x="1236" y="52" width="18" height="248"/>
    <rect x="1228" y="88" width="8" height="12"/>
    <rect x="1254" y="102" width="8" height="12"/>
    <rect x="1228" y="122" width="8" height="10"/>
    <rect x="1243" y="22" width="4" height="30"/>
    <rect x="1310" y="214" width="48" height="86"/>
    <rect x="1394" y="192" width="36" height="108"/>
    <rect x="1470" y="226" width="62" height="74"/>
    <rect x="1580" y="204" width="42" height="96"/>
    <rect x="1662" y="232" width="58" height="68"/>
    <rect x="1758" y="198" width="38" height="102"/>
    <rect x="1840" y="224" width="54" height="76"/>
    <rect x="1936" y="206" width="40" height="94"/>
    <rect x="2010" y="238" width="60" height="62"/>
    <rect x="2150" y="120" width="64" height="180"/>
    <polygon points="2150,120 2182,86 2214,120"/>
    <circle cx="2182" cy="82" r="2.5" class="dio-beacon"/>
    <rect x="2226" y="152" width="54" height="148"/>
    <rect x="2292" y="136" width="58" height="164"/>
    <polygon points="2292,136 2321,108 2350,136"/>
    <rect x="2360" y="180" width="40" height="120"/>
  </g>
</svg>`;
const DIORAMA_FRONT_SVG = `
<svg viewBox="0 0 2400 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <pattern id="dioWinA" width="14" height="18" patternUnits="userSpaceOnUse">
      <rect x="3" y="4" width="5" height="7" rx="0.8" fill="var(--dio-win)"/>
    </pattern>
    <pattern id="dioWinB" width="12" height="15" patternUnits="userSpaceOnUse">
      <rect x="2.5" y="3.5" width="4" height="5.5" rx="0.7" fill="var(--dio-win)"/>
    </pattern>
    <pattern id="dioWinC" width="18" height="15" patternUnits="userSpaceOnUse">
      <rect x="2" y="4" width="12" height="3.4" rx="1" fill="var(--dio-win)"/>
    </pattern>
    <linearGradient id="dioGlow" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#C89B3C" stop-opacity="0.28"/>
      <stop offset="0.6" stop-color="#C89B3C" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#C89B3C" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="170" width="2400" height="170" fill="url(#dioGlow)" class="dio-glow"/>

  <!-- Battersea Power Station -->
  <g>
    <polygon points="58,236 74,236 71,152 61,152" fill="var(--dio-chimney)"/>
    <polygon points="98,236 114,236 111,152 101,152" fill="var(--dio-chimney)"/>
    <polygon points="206,236 222,236 219,152 209,152" fill="var(--dio-chimney)"/>
    <polygon points="246,236 262,236 259,152 249,152" fill="var(--dio-chimney)"/>
    <rect x="44" y="232" width="44" height="108" fill="var(--dio-front)"/>
    <rect x="232" y="232" width="44" height="108" fill="var(--dio-front)"/>
    <rect x="80" y="252" width="160" height="88" fill="var(--dio-front-2)"/>
    <rect x="92" y="266" width="136" height="58" fill="url(#dioWinC)" class="dio-wins dw1"/>
  </g>

  <!-- Terrace row -->
  <g>
    <polygon points="297,286 321,266 345,286" fill="var(--dio-front)"/>
    <rect x="300" y="284" width="42" height="56" fill="var(--dio-front-2)"/>
    <polygon points="343,286 367,266 391,286" fill="var(--dio-front)"/>
    <rect x="346" y="284" width="42" height="56" fill="var(--dio-front)"/>
    <polygon points="389,286 413,266 437,286" fill="var(--dio-front)"/>
    <rect x="392" y="284" width="42" height="56" fill="var(--dio-front-2)"/>
    <rect x="330" y="270" width="7" height="12" fill="var(--dio-front)"/>
    <rect x="422" y="270" width="7" height="12" fill="var(--dio-front)"/>
    <rect x="306" y="292" width="122" height="42" fill="url(#dioWinB)" class="dio-wins dw2"/>
  </g>

  <!-- Palace of Westminster + Elizabeth Tower -->
  <g>
    <rect x="452" y="246" width="20" height="94" fill="var(--dio-front)"/>
    <polygon points="452,246 462,230 472,246" fill="var(--dio-front)"/>
    <rect x="452" y="266" width="144" height="74" fill="var(--dio-front-2)"/>
    <rect x="576" y="246" width="20" height="94" fill="var(--dio-front)"/>
    <polygon points="576,246 586,230 596,246" fill="var(--dio-front)"/>
    <rect x="460" y="274" width="128" height="58" fill="url(#dioWinB)" class="dio-wins dw1"/>
    <rect x="604" y="152" width="32" height="188" fill="var(--dio-front)"/>
    <rect x="609" y="176" width="22" height="148" fill="url(#dioWinB)" class="dio-wins dw3"/>
    <rect x="599" y="134" width="42" height="30" fill="var(--dio-front)"/>
    <circle cx="620" cy="149" r="11" class="dio-clock"/>
    <polygon points="599,134 641,134 628,102 620,84 612,102" fill="var(--dio-front)"/>
    <rect x="618" y="72" width="4" height="14" fill="var(--dio-front)"/>
  </g>

  <!-- London Eye -->
  <g>
    <polygon points="770,196 724,340 740,340 770,214 800,340 816,340" fill="var(--dio-front)"/>
    <g stroke="var(--dio-front)" stroke-width="2" opacity="0.75">
      <line x1="770" y1="190" x2="864" y2="190"/><line x1="770" y1="190" x2="851" y2="237"/>
      <line x1="770" y1="190" x2="817" y2="271"/><line x1="770" y1="190" x2="770" y2="284"/>
      <line x1="770" y1="190" x2="723" y2="271"/><line x1="770" y1="190" x2="689" y2="237"/>
      <line x1="770" y1="190" x2="676" y2="190"/><line x1="770" y1="190" x2="689" y2="143"/>
      <line x1="770" y1="190" x2="723" y2="109"/><line x1="770" y1="190" x2="770" y2="96"/>
      <line x1="770" y1="190" x2="817" y2="109"/><line x1="770" y1="190" x2="851" y2="143"/>
    </g>
    <circle cx="770" cy="190" r="96" fill="none" stroke="var(--dio-front)" stroke-width="5"/>
    <circle cx="770" cy="190" r="87" fill="none" stroke="var(--dio-front)" stroke-width="1.6" opacity="0.5"/>
    <circle cx="770" cy="190" r="8" fill="var(--dio-front)"/>
    <g class="dio-pods">
      <circle cx="866" cy="190" r="5.5"/><circle cx="853" cy="238" r="5.5"/><circle cx="818" cy="273" r="5.5"/>
      <circle cx="770" cy="286" r="5.5"/><circle cx="722" cy="273" r="5.5"/><circle cx="687" cy="238" r="5.5"/>
      <circle cx="674" cy="190" r="5.5"/><circle cx="687" cy="142" r="5.5"/><circle cx="722" cy="107" r="5.5"/>
      <circle cx="770" cy="94" r="5.5"/><circle cx="818" cy="107" r="5.5"/><circle cx="853" cy="142" r="5.5"/>
    </g>
  </g>

  <!-- Southbank blocks -->
  <rect x="880" y="262" width="52" height="78" fill="var(--dio-front-2)"/>
  <rect x="886" y="270" width="40" height="62" fill="url(#dioWinA)" class="dio-wins dw2"/>
  <rect x="938" y="238" width="66" height="102" fill="var(--dio-front)"/>
  <rect x="946" y="248" width="50" height="84" fill="url(#dioWinA)" class="dio-wins dw4"/>

  <!-- St Paul's Cathedral -->
  <g>
    <rect x="1038" y="246" width="20" height="66" fill="var(--dio-front)"/>
    <circle cx="1048" cy="242" r="8" fill="var(--dio-front)"/>
    <rect x="1148" y="246" width="20" height="66" fill="var(--dio-front)"/>
    <circle cx="1158" cy="242" r="8" fill="var(--dio-front)"/>
    <rect x="1028" y="274" width="150" height="66" fill="var(--dio-front-2)"/>
    <rect x="1040" y="284" width="126" height="48" fill="url(#dioWinB)" class="dio-wins dw3"/>
    <rect x="1072" y="236" width="62" height="40" fill="var(--dio-front)"/>
    <path d="M1064,238 Q1103,162 1142,238 Z" fill="var(--dio-front)"/>
    <rect x="1098" y="184" width="10" height="20" fill="var(--dio-front)"/>
    <circle cx="1103" cy="181" r="7" fill="var(--dio-front)"/>
    <rect x="1101" y="158" width="4" height="18" fill="var(--dio-front)"/>
  </g>

  <!-- City cluster -->
  <rect x="1200" y="206" width="44" height="134" fill="var(--dio-front)"/>
  <rect x="1206" y="214" width="32" height="118" fill="url(#dioWinA)" class="dio-wins dw1"/>
  <rect x="1252" y="178" width="56" height="162" fill="var(--dio-front-2)"/>
  <rect x="1259" y="188" width="42" height="144" fill="url(#dioWinA)" class="dio-wins dw3"/>
  <rect x="1314" y="224" width="34" height="116" fill="var(--dio-front)"/>
  <rect x="1319" y="232" width="24" height="100" fill="url(#dioWinB)" class="dio-wins dw2"/>

  <!-- The Gherkin -->
  <g>
    <path d="M1366,340 C1362,258 1372,186 1399,152 C1426,186 1436,258 1432,340 Z" fill="var(--dio-front)"/>
    <path d="M1372,300 Q1399,282 1426,300" fill="none" class="dio-lattice" stroke-width="2"/>
    <path d="M1370,252 Q1399,234 1428,252" fill="none" class="dio-lattice" stroke-width="2"/>
    <path d="M1376,206 Q1399,192 1422,206" fill="none" class="dio-lattice" stroke-width="2"/>
    <g class="dio-wins dw4">
      <rect x="1386" y="216" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1406" y="238" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1390" y="266" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1412" y="288" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1396" y="310" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
    </g>
  </g>

  <!-- The Cheesegrater -->
  <g>
    <polygon points="1456,340 1456,168 1552,340" fill="var(--dio-front-2)"/>
    <g stroke="var(--dio-face)" stroke-width="1.5" class="dio-face-lines">
      <line x1="1456" y1="200" x2="1474" y2="200"/><line x1="1456" y1="240" x2="1496" y2="240"/>
      <line x1="1456" y1="280" x2="1518" y2="280"/><line x1="1456" y1="318" x2="1540" y2="318"/>
    </g>
  </g>

  <!-- The Walkie-Talkie -->
  <g>
    <path d="M1596,340 L1586,226 C1582,182 1682,182 1680,226 L1670,340 Z" fill="var(--dio-front)"/>
    <rect x="1600" y="200" width="64" height="126" fill="url(#dioWinC)" class="dio-wins dw2"/>
  </g>

  <!-- The Shard -->
  <g>
    <polygon points="1726,340 1772,58 1772,340" fill="var(--dio-front-2)"/>
    <polygon points="1772,340 1772,58 1818,340" fill="var(--dio-front)"/>
    <circle cx="1772" cy="52" r="3" class="dio-beacon"/>
    <g class="dio-wins dw3">
      <rect x="1762" y="130" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1776" y="168" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1756" y="212" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1782" y="248" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1764" y="286" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1790" y="300" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
    </g>
  </g>

  <!-- Tower Bridge -->
  <g>
    <path d="M1856,304 Q1876,240 1892,222" fill="none" stroke="var(--dio-front)" stroke-width="3"/>
    <path d="M2088,222 Q2104,240 2124,304" fill="none" stroke="var(--dio-front)" stroke-width="3"/>
    <rect x="1936" y="206" width="108" height="8" fill="var(--dio-front)"/>
    <rect x="1936" y="224" width="108" height="8" fill="var(--dio-front)"/>
    <path d="M1936,340 Q1990,298 2044,340 Z" fill="var(--dio-front)"/>
    <rect x="1888" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="1932" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="2040" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="2084" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="1892" y="186" width="44" height="154" fill="var(--dio-front-2)"/>
    <rect x="2044" y="186" width="44" height="154" fill="var(--dio-front-2)"/>
    <polygon points="1888,186 1914,140 1940,186" fill="var(--dio-front)"/>
    <polygon points="2040,186 2066,140 2092,186" fill="var(--dio-front)"/>
    <rect x="1856" y="298" width="268" height="10" fill="var(--dio-front)"/>
    <rect x="1898" y="196" width="32" height="134" fill="url(#dioWinB)" class="dio-wins dw1"/>
    <rect x="2050" y="196" width="32" height="134" fill="url(#dioWinB)" class="dio-wins dw4"/>
  </g>

  <!-- East wharf -->
  <rect x="2140" y="232" width="52" height="108" fill="var(--dio-front)"/>
  <rect x="2146" y="240" width="40" height="92" fill="url(#dioWinA)" class="dio-wins dw2"/>
  <rect x="2200" y="208" width="62" height="132" fill="var(--dio-front-2)"/>
  <rect x="2208" y="218" width="46" height="114" fill="url(#dioWinA)" class="dio-wins dw3"/>
  <rect x="2270" y="244" width="48" height="96" fill="var(--dio-front)"/>
  <rect x="2276" y="252" width="36" height="80" fill="url(#dioWinB)" class="dio-wins dw1"/>
  <rect x="2326" y="190" width="74" height="150" fill="var(--dio-front-2)"/>
  <rect x="2334" y="200" width="58" height="132" fill="url(#dioWinA)" class="dio-wins dw4"/>

  <rect x="0" y="330" width="2400" height="10" fill="var(--dio-front)"/>
</svg>`;

// Standalone sign-up/login overlay — used both as part of renderGate()'s
// landing-page markup and injected on demand via showLpSignup() once inside
// the app (see enterGuestBrowse()), where #gate-root has already been
// cleared and nothing else would otherwise render this modal. Previously
// inlined only inside renderGate(); pulled out so a guest mid-session (e.g.
// tapping "Book Now") can still reach it.
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
// email fields. Called once after the modal's markup lands in the DOM —
// either as part of renderGate()'s initial render, or lazily the first time
// showLpSignup() injects it on demand mid-session.
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

function renderGate(prefillName, prefillEmail) {
  const loader = document.getElementById("cumulus-loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
  }
  document.getElementById("gate-root").innerHTML = `
  <div class="lp-root">

    <!-- ── STICKY NAV ── -->
    <nav class="lp-nav">
      <div class="lp-nav-inner">
        <div class="lp-nav-logo">${BLOT_SVG}<span>Cumulus</span></div>
        <div class="lp-nav-links hide-mobile">
          <a href="#" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'});return false;">Features</a>
          <a href="#" onclick="document.getElementById('lp-venues-anchor').scrollIntoView({behavior:'smooth'});return false;">For Venues</a>
        </div>
        <div class="lp-nav-auth">
          <button class="lp-nav-login" onclick="showLpLogin()">Log in</button>
          <button class="btn lp-nav-btn" onclick="showLpSignup()">Join Cumulus</button>
        </div>
      </div>
    </nav>

    <!-- ── HERO ── -->
    <section class="lp-hero">
      <div class="lp-hero-sky" aria-hidden="true"></div>
      <div class="lp-dio-back" aria-hidden="true">${DIORAMA_BACK_SVG}</div>
      <div class="lp-cloud-layer" aria-hidden="true">
        <!-- Cumulus bank on the horizon: low band, tops free, bottoms dissolved
             by a CSS mask and tucked behind the front skyline. Very slow drift. -->
        <div class="lp-cld" style="top:38%;width:44vw;--dur:210s;--dly:-30s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:45%;width:34vw;--dur:252s;--dly:-140s;--ar:1951/583; background-image:url('assets/clouds/cloud1.webp')"></div>
        <div class="lp-cld" style="top:41%;width:56vw;--dur:184s;--dly:-90s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
        <div class="lp-cld" style="top:51%;width:48vw;--dur:232s;--dly:-55s; --ar:2049/701; background-image:url('assets/clouds/cloud4.webp')"></div>
        <div class="lp-cld" style="top:56%;width:52vw;--dur:268s;--dly:-170s;--ar:2049/1152;background-image:url('assets/clouds/cloud3.webp')"></div>
      </div>
      <div class="lp-hero-scrim" aria-hidden="true"></div>
      <div class="lp-dio-front" aria-hidden="true">${DIORAMA_FRONT_SVG}</div>
      <div class="lp-hero-content">
        <div class="lp-hero-kicker">
          <span class="lp-live-dot"></span>
          London · Community events club
        </div>
        <h1 class="lp-hero-title">Find what's on.<br><span class="lp-hero-gradient">Zero fees for hosts.</span></h1>
        <p class="lp-hero-sub">Cumulus is a live map of grassroots events across London. Every event is public — no invite, no curator code. Hosts keep 100% of their ticket price.</p>
        <div class="lp-hero-actions">
          <button class="btn lp-hero-btn-primary" onclick="enterGuestBrowse()">Explore the Map →</button>
          <button class="btn btn-outline lp-hero-btn-secondary" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">How it works ↓</button>
        </div>
        <p class="lp-hero-trust-note">${checkIconSvg(12)} Every public host is reviewed before their event goes live</p>
        <div class="lp-hero-pins" aria-hidden="true">
          <div class="lp-hero-pin" style="--c:#8FC63D;">
            <span class="lp-hero-pin-live"><span class="d"></span>Live</span>
            <span class="lp-hero-pin-title">Sunset Yoga</span>
            <span class="lp-hero-pin-meta">Victoria Park · Now</span>
          </div>
          <div class="lp-hero-pin" style="--c:#F0687E;">
            <span class="lp-hero-pin-title">Vinyl &amp; Wine</span>
            <span class="lp-hero-pin-meta">Peckham · Fri, 7pm</span>
          </div>
          <div class="lp-hero-pin" style="--c:#FFCF33;">
            <span class="lp-hero-pin-title">Life Drawing</span>
            <span class="lp-hero-pin-meta">Hackney · Sat, 2pm</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FEATURES ── -->
    <section class="lp-features" id="lp-features-anchor">
      <div style="text-align:center;margin-bottom:52px;">
        <h2 class="lp-section-title">One map. Your whole city.</h2>
      </div>
      <div class="lp-features-grid">
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/discover.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></div>
          <div class="lp-feat-card-title">Discover locally</div>
          <div class="lp-feat-card-desc">Browse events happening in your neighbourhood — from jazz nights and gallery openings to supper clubs and community walks.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/pass.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M9 10.5l1.8 1.8L15 8.5"/></svg></div>
          <div class="lp-feat-card-title">Checkout in seconds</div>
          <div class="lp-feat-card-desc">Pay by card, Apple Pay or Google Pay right in the app — no redirect, no new tab. Your QR ticket is ready the moment payment clears.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/connect.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.8 13.2c2 .2 3.6 1.7 4.1 4.3"/></svg></div>
          <div class="lp-feat-card-title">Bring your squad</div>
          <div class="lp-feat-card-desc">Buying more than one ticket? Share an instant claim link with each friend — everyone gets their own ticket, no faff at the door.</div>
        </div>
      </div>
    </section>

    <!-- ── VENUE PITCH ── -->
    <section class="lp-venues-section" id="lp-venues-anchor">
      <div class="lp-venues-inner">
        <div class="lp-venues-text">
          <div class="lp-section-kicker" style="color:var(--gold);">For Venues &amp; Promoters</div>
          <h2 class="lp-section-title" style="color:#fff;">Your event.<br>Our audience.</h2>
          <p style="color:rgba(255,255,255,0.72);font-size:15px;line-height:1.75;max-width:480px;">List your venue on Cumulus and reach thousands of active Londoners who are already looking for their next night out. We handle discovery, ticketing, and payouts — you focus on the event.</p>
          <div class="lp-venue-features">
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></div><div><div class="lp-feat-title">Map-first discovery</div><div class="lp-feat-desc">Your venue pinned and filterable across London's live event map.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg></div><div><div class="lp-feat-title">Zero-fee ticketing</div><div class="lp-feat-desc">Hosts keep 100% of their price. Cumulus adds only a flat platform fee to the buyer — no percentage cuts, ever.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H9l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg></div><div><div class="lp-feat-title">Squad ticketing</div><div class="lp-feat-desc">Groups buy together and share instant claim links — higher show-up rates, no faff at the door.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z"/></svg></div><div><div class="lp-feat-title">Featured placement</div><div class="lp-feat-desc">Major events get priority placement across the Cumulus platform.</div></div></div>
          </div>
          <button class="btn lp-venues-cta" onclick="showLpSignup()">Get started — it's free →</button>
        </div>
        <div class="lp-venues-stats">
          <div class="lp-vstat"><div class="lp-vstat-num">0%</div><div class="lp-vstat-label">Host fees</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">9</div><div class="lp-vstat-label">Categories</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">32</div><div class="lp-vstat-label">London boroughs</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">100%</div><div class="lp-vstat-label">Community-led</div></div>
        </div>
      </div>
    </section>

    <!-- ── COMMUNITY PROOF ── -->
    <section style="padding:80px 24px;background:var(--bg);position:relative;overflow:hidden;">
      <div style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:52px;align-items:center;">
        <div>
          <h2 class="lp-join-headline">This isn't about events.<br>It's about <em>your people.</em></h2>
          <p class="lp-join-body">Cumulus was built on one belief — the best things happen when people who live near each other actually meet. Not online. In the same room, at the same table, under the same open sky.</p>
          <div class="lp-join-proof" style="margin-top:24px;">
            <span class="lp-join-live"><span class="d"></span>Live</span>
            <span class="lp-proof-text">New events added by hosts across London every day</span>
          </div>
          <button class="btn lp-hero-btn-primary" style="margin-top:28px;" onclick="showLpSignup()">Join them →</button>
        </div>
        <div class="lp-community-stack">
          <div class="lp-comm-card lp-comm-c1">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">AR</div>
              <div class="lp-comm-av">PS</div>
              <div class="lp-comm-av">TB</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Jazz in the Park</div>
              <div class="lp-comm-sub">Herne Hill · Sat, 6pm</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
          <div class="lp-comm-card lp-comm-c2">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">ML</div>
              <div class="lp-comm-av">JC</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Ceramics &amp; Chill</div>
              <div class="lp-comm-sub">Bermondsey · Sun, 11am</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
          <div class="lp-comm-card lp-comm-c3">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">SO</div>
              <div class="lp-comm-av">OW</div>
              <div class="lp-comm-av">CD</div>
              <div class="lp-comm-av lp-comm-av-more">+12</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Supper Club — Fulham</div>
              <div class="lp-comm-sub">Fulham · Fri, 8pm</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="lp-footer">
      <div class="lp-nav-logo" style="margin-bottom:10px;">${BLOT_SVG}<span style="font-size:16px;font-weight:800;color:var(--text-muted);">Cumulus</span></div>
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 10px;">London Community Events · ${new Date().getFullYear()}</p>
      <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
        <a href="privacy.html" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Privacy</a>
        <a href="terms.html" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Terms</a>
        <a href="mailto:hello@cumulusapp.co" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Contact</a>
      </div>
    </footer>

    ${signupModalHtml(prefillName, prefillEmail)}

  </div>`;

  // Auto-open modal if prefill data was provided (returning user flow)
  if (prefillName || prefillEmail) showLpSignup();
  nudgeGateForSquadClaim(); // ?squad= link landing on a signed-out visitor

  attachSignupModalListeners();

  requestAnimationFrame(() => {
    document.querySelectorAll(".lp-venue-feat").forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-12px)";
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.transition = `opacity 0.4s ease ${i * 0.09}s, transform 0.4s ease ${i * 0.09}s`;
              e.target.style.opacity = "1";
              e.target.style.transform = "translateX(0)";
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.2 },
      );
      obs.observe(el);
    });
    document.querySelectorAll(".lp-feat-card").forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.transition = `opacity 0.45s ease ${i * 0.1}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`;
              e.target.style.opacity = "1";
              e.target.style.transform = "translateY(0)";
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
    });
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
  hide("gate-attendee-preview", isLogin || _signupType === "host");
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
    // Not on the landing page (renderGate() already tore #gate-root down) —
    // a guest triggered a gated action mid-session (Book Now, Account, Follow
    // a host…). Inject the same modal fresh rather than silently no-op'ing.
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

