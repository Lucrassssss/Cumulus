// ── Bounding-box event refresh via PostGIS RPC ────────────────────────────
// fetchVisibleEvents() queries only the events within the current map
// viewport using the get_events_geojson Postgres RPC. The RPC is a
// micro-payload (id/category/start_time + geometry only — see the Phase A
// migration) so it stays cheap on every pan; loadRealEvents() already
// hydrates the full EVENTS array once at boot, so almost every id here is
// already known locally. The rare exception (an event someone else created
// mid-session) gets its full row fetched individually via
// fetchEventDetails() — never a whole-table refetch.
//
// The debounced moveend listener (300ms) batches rapid pans so we never
// fire more than one RPC per camera settle. Falls back to the local
// buildEventsGeoJSON() if the RPC is unavailable (offline / not deployed).

let _bboxFetchTimer = null;

async function fetchVisibleEvents() {
  if (!lmap || typeof mapboxgl === "undefined") return;
  const src = lmap.getSource("events-source");
  if (!src) return;

  // Extract SW / NE corners of the current viewport
  const bounds = lmap.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // Pad bbox slightly (10%) so pins near the edge don't pop in/out abruptly
  const lngSpan = (ne.lng - sw.lng) * 0.1;
  const latSpan = (ne.lat - sw.lat) * 0.1;

  const bbox = {
    min_lng: sw.lng - lngSpan,
    min_lat: sw.lat - latSpan,
    max_lng: ne.lng + lngSpan,
    max_lat: ne.lat + latSpan,
  };

  // Call the PostGIS RPC (defined in services.js) — a micro-payload
  // FeatureCollection, id/category/start_time only
  const geojson = await fetchEventsGeoJSON(bbox);

  if (!geojson || !Array.isArray(geojson.features)) {
    // RPC unavailable (offline / not deployed yet) — fall back gracefully
    src.setData(buildEventsGeoJSON());
    return;
  }

  // Fetch full details only for ids we've genuinely never seen this session
  const unseenIds = geojson.features
    .map((f) => f.properties && f.properties.id)
    .filter((id) => id && !EVENTS.find((e) => e.id === id));

  if (unseenIds.length) {
    const rows = await Promise.all(unseenIds.map((id) => fetchEventDetails(id)));
    rows.forEach((ev) => {
      if (!ev || EVENTS.find((e) => e.id === ev.id)) return;
      const mapped = {
        id: ev.id,
        title: ev.title,
        category: ev.category,
        host: ev.host_name,
        hostId: ev.host_id,
        venue: ev.venue,
        area: ev.area,
        address: ev.address,
        lat: ev.lat,
        lon: ev.lon,
        startTime: ev.start_time,
        endTime: ev.end_time,
        desc: ev.description,
        capacity: ev.capacity,
        price: ev.price || 0,
        priceTiers: ev.price_tiers || null,
        nightShotUrl: ev.night_shot_url || null,
        photoUrl: ev.photo_url || null,
      };
      computeEventDates(mapped);
      EVENTS.push(mapped);
    });
  }

  // Apply client-side filters (category, live/hot toggles, search) and push
  // the resulting GeoJSON directly to the WebGL source
  const filteredGeo = buildEventsGeoJSON();
  src.setData(filteredGeo);
  updateMapEmptyState(filteredGeo.features.length);
  updateLivePulse();
}

// Debounce helper — executes fn at most once every `wait` ms after last call
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Register the debounced bbox fetch on map moveend (registered once in
// attachMapLayers so it survives style reloads cleanly)
const _debouncedFetchVisible = debounce(fetchVisibleEvents, 300);

// Empty-state overlay on the map when no events are visible — distinguishes
// "no events exist yet" from "your filters/search matched nothing".
function updateMapEmptyState(count) {
  const host = document.getElementById("main-map");
  if (!host) return;
  let el = document.getElementById("map-empty");
  if (count > 0) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "map-empty";
    el.className = "map-empty";
    host.appendChild(el);
  }
  const filtered =
    state.selectedCategory !== "all" ||
    state.liveOnly ||
    state.hotOnly ||
    state.startingSoonOnly ||
    !!(document.getElementById("search-input")?.value || "").trim();
  el.innerHTML = filtered
    ? `<div class="map-empty-card" role="status">
         <div class="me-emoji" aria-hidden="true">🔍</div>
         <div class="me-title">No events match</div>
         <div class="me-sub">Nothing fits those filters right now. Try clearing them.</div>
         <button class="btn" onclick="clearMapFilters()">Clear filters</button>
       </div>`
    : `<div class="map-empty-card" role="status">
         <div class="me-emoji" aria-hidden="true">🗺️</div>
         <div class="me-title">No events on the map yet</div>
         <div class="me-sub">Cumulus is just getting started in London. Be the first to put something on.</div>
         <button class="btn" onclick="openHost()">Host an event</button>
       </div>`;
}

function clearMapFilters() {
  state.selectedCategory = "all";
  state.liveOnly = false;
  state.hotOnly = false;
  state.startingSoonOnly = false;
  const si = document.getElementById("search-input");
  if (si) si.value = "";
  refreshFilters();
  refreshMarkers();
}

window.CUMULUS_WEATHER_MODE = "live";

class WeatherControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Weather: Live (London)";
    btn.innerHTML = "🌍";
    btn.style.fontSize = "16px";

    this._states = ["live", "clear", "dawn", "dusk", "rain", "snow", "fog"];
    this._currentState = 0;

    btn.onclick = () => {
      this._currentState = (this._currentState + 1) % this._states.length;
      window.CUMULUS_WEATHER_MODE = this._states[this._currentState];
      this.applyState(window.CUMULUS_WEATHER_MODE, btn);
    };

    this._container.appendChild(btn);
    return this._container;
  }

  applyState(stateName, btn) {
    if (!this._map.setRain) return;

    if (stateName === "live") {
      btn.innerHTML = "🌍";
      btn.title = "Weather: Live (London)";
      applyRealWeather(this._map, true);
      return;
    }

    // For simulated states, first clear everything
    this._map.setRain(null);
    this._map.setSnow(null);
    this._map.setFog(null);
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const light = isDark ? "night" : "day";
    this._map.setConfigProperty("basemap", "lightPreset", light);
    this._map.setConfigProperty("basemap", "show3dTrees", false);

    if (stateName === "clear") {
      btn.innerHTML = "☀️";
      btn.title = "Weather: Simulated Clear";
    } else if (stateName === "dawn") {
      btn.innerHTML = "🌅";
      btn.title = "Weather: Simulated Dawn";
      this._map.setConfigProperty("basemap", "lightPreset", "dawn");
    } else if (stateName === "dusk") {
      btn.innerHTML = "🌇";
      btn.title = "Weather: Simulated Dusk";
      this._map.setConfigProperty("basemap", "lightPreset", "dusk");
    } else if (stateName === "rain") {
      btn.innerHTML = "🌧️";
      btn.title = "Weather: Simulated Rain";
      this._map.setConfigProperty("basemap", "lightPreset", "dusk");
      this._map.setRain({ density: 1, intensity: 1, color: "#a0b0c0" });
      this._map.setFog({
        range: [1, 5],
        color: "#111",
        "high-color": "#222",
        "space-color": "#000",
        "star-intensity": 0.5,
      });
    } else if (stateName === "snow") {
      btn.innerHTML = "❄️";
      btn.title = "Weather: Simulated Snow";
      this._map.setConfigProperty("basemap", "lightPreset", light);
      this._map.setSnow({ density: 1, intensity: 1, color: "#ffffff" });
      this._map.setFog({
        range: [1, 4],
        color: isDark ? "#223" : "#eef2f5",
        "high-color": isDark ? "#112" : "#d9e2e8",
        "space-color": "#000",
        "star-intensity": isDark ? 1.0 : 0,
      });
    } else if (stateName === "fog") {
      btn.innerHTML = "🌫️";
      btn.title = "Weather: Simulated Fog";
      this._map.setConfigProperty("basemap", "lightPreset", light);
      this._map.setFog({
        range: [0.5, 3],
        color: isDark ? "#111" : "#e0e5eb",
        "high-color": isDark ? "#222" : "#b0c4de",
        "space-color": "#000",
        "star-intensity": isDark ? 0.8 : 0,
      });
    }
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

let _weatherPollInterval = null;

async function applyRealWeather(map, force = false) {
  if (window.CUMULUS_WEATHER_MODE !== "live" && !force) return;

  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276&current_weather=true&daily=sunrise,sunset&timezone=Europe%2FLondon",
    );
    const data = await res.json();
    const w = data.current_weather;
    if (!w) return;

    if (!map.setRain) return;
    map.setRain(null);
    map.setSnow(null);
    map.setFog(null);

    // Calculate precision day/dawn/dusk/night based on real local time
    const now = new Date();
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);

    let light = "day";
    const msIn45Mins = 45 * 60 * 1000;

    if (now < new Date(sunrise.getTime() - msIn45Mins)) {
      light = "night";
    } else if (now < sunrise) {
      light = "dawn";
    } else if (now < sunset) {
      light = "day";
    } else if (now < new Date(sunset.getTime() + msIn45Mins)) {
      light = "dusk";
    } else {
      light = "night";
    }

    map.setConfigProperty("basemap", "lightPreset", light);
    map.setConfigProperty("basemap", "show3dTrees", false);

    // Weather codes (WMO)
    const code = w.weathercode;

    // Fog (45, 48)
    if (code === 45 || code === 48) {
      map.setFog({
        range: [0.5, 3],
        color: light === "day" ? "#e0e5eb" : "#111",
        "high-color": light === "day" ? "#b0c4de" : "#222",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 0.8 : 0,
      });
    }
    // Drizzle / Rain (51-67, 80-82)
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      map.setRain({
        density: 1,
        intensity: code >= 63 ? 1 : 0.5,
        color: light === "day" ? "#8a9ba8" : "#a0b0c0",
      });
      map.setFog({
        range: [1, 5],
        color: light === "day" ? "#c8d2d9" : "#111",
        "high-color": light === "day" ? "#9fb1be" : "#222",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 0.5 : 0,
      });
    }
    // Snow (71-77, 85-86)
    else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      map.setSnow({
        density: 1,
        intensity: code >= 73 ? 1 : 0.5,
        color: "#ffffff",
      });
      map.setFog({
        range: [1, 4],
        color: light === "day" ? "#eef2f5" : "#223",
        "high-color": light === "day" ? "#d9e2e8" : "#112",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 1.0 : 0,
      });
    }
    // Thunderstorm (95, 96, 99)
    else if (code >= 95) {
      map.setRain({ density: 1, intensity: 1, color: "#556677" });
      if (light === "day")
        map.setConfigProperty("basemap", "lightPreset", "dusk"); // Darken for storm
    }

    // Schedule next poll in 15 minutes to keep it continuously synced
    if (!_weatherPollInterval) {
      _weatherPollInterval = setInterval(
        () => {
          applyRealWeather(map);
        },
        15 * 60 * 1000,
      );
    }
  } catch (e) {
  }
}

// ====== DEVICE TIER PROFILER ======
function getDeviceTier() {
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const devicePixelRatio = window.devicePixelRatio || 1;
  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        renderer = gl
          .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          .toLowerCase();
      }
    }
  } catch (e) {}

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // All desktop and laptop web browsers are strictly 2D for maximum performance
  if (!isMobile) {
    return "low";
  }

  // Phone devices get 3D optimized
  const isAppleGPU = /apple/i.test(renderer);
  const isHighEndMaliOrAdreno = /mali-g7|adreno (6|7)/i.test(renderer);

  if (hardwareConcurrency <= 4 && !isAppleGPU && !isHighEndMaliOrAdreno) {
    return "low"; // Extremely budget phones get 2D
  } else if (hardwareConcurrency >= 8 || isAppleGPU || isHighEndMaliOrAdreno) {
    return "high"; // Powerful phones get full 3D (Antialiasing + Trees)
  }

  return "mid"; // Standard phones get 3D optimized (No Antialiasing, No Trees)
}

// Retry state for initLeaflet() — see the comment inside for why this exists.
let _initLeafletRetried = false;

function initLeaflet() {
  if (lmap) return;
  // mapbox-gl.js loads via <script defer>, so it can still be mid-download
  // the first time renderView() reaches "browse" (e.g. a fast session
  // restore). Previously this just bailed with no retry, permanently
  // orphaning the #cumulus-loader overlay since its removal is solely
  // gated on this map's "idle" event. Retry once, shortly after, instead
  // of giving up outright — renderView("browse") only calls this once per
  // render, so without a retry a mistimed first call meant the map (and
  // the loader hiding it) never had a second chance this session.
  if (typeof mapboxgl === "undefined") {
    if (!_initLeafletRetried) {
      _initLeafletRetried = true;
      setTimeout(initLeaflet, 300);
    }
    return;
  }
  if (!mapboxConfigured()) return;
  const host = document.getElementById("main-map");
  if (!host) return;
  mapboxgl.accessToken = MAPBOX_TOKEN;

  const tier = getDeviceTier();
  const mapConfig = {
    container: host,
    style: mapboxStyleUrl(), // Standard style is required to support live weather colours
    center: [-0.1276, 51.5072],
    zoom: 12,
    fadeDuration: 300,
    attributionControl: false,
    crossSourceCollisions: false,
    localIdeographFontFamily:
      "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
    prefetchZoomDelta: 2,
  };

  if (tier === "low") {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 60;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = false;
  } else if (tier === "mid") {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 60;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = false;
  } else {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 85;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = true;
  }

  lmap = new mapboxgl.Map(mapConfig);
  lmap.addControl(
    new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
    "top-right",
  );
  // Dev-only: manual weather-state cycling button for testing. Real users
  // always get applyRealWeather()'s live London weather; never show the
  // test control off localhost (same gate as loadDevFixtureEvents() above).
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    lmap.addControl(new WeatherControl(), "top-right");
  }

  // Prevent DOM thrashing (throttled via requestAnimationFrame)
  let movestartScheduled = false;
  lmap.on("movestart", () => {
    if (movestartScheduled) return;
    movestartScheduled = true;
    requestAnimationFrame(() => {
      document.body.classList.add("map-moving");
      movestartScheduled = false;
    });
  });

  let moveendScheduled = false;
  lmap.on("moveend", () => {
    if (moveendScheduled) return;
    moveendScheduled = true;
    requestAnimationFrame(() => {
      document.body.classList.remove("map-moving");
      moveendScheduled = false;
    });
  });

  lmap.on("style.load", () => {
    applyMapChrome(lmap, true);
    attachMapLayers();

    // Default to time-based theme for safety, overridden by real weather shortly
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    lmap.setConfigProperty("basemap", "lightPreset", isDark ? "night" : "day");

    // Performance optimizations
    lmap.setConfigProperty("basemap", "show3dTrees", tier === "high");
    lmap.setConfigProperty("basemap", "show3dObjects", tier !== "low"); // Flat buildings on low tier to save FPS
    lmap.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    lmap.setConfigProperty("basemap", "showTransitLabels", false);

    // Fog Occlusion Culling for Low/Mid tiers
    if (tier === "low" || tier === "mid") {
      const bgColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim() || "#0F0E0C";
      lmap.setFog({
        range: [0.5, 2],
        color: bgColor,
        "horizon-blend": 0.1,
      });
    }

    // Fetch and apply real London weather!
    applyRealWeather(lmap);
  });

  // Hide the immersive loader once Mapbox has fully compiled shaders and loaded tiles
  // We add a 2.5 second buffer after 'idle' to ensure HTML markers are fully painted and JIT is settled
  lmap.once("idle", () => {
    setTimeout(() => {
      const loader = document.getElementById("cumulus-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 500);
      }
      // If we were background loading, transition into the app now!
      if (typeof window.resolveBgLoad === "function") {
        window.resolveBgLoad();
      }
    }, 2500);
  });
}

function initHostMap() {
  if (hostMap) {
    hostMap.remove();
    hostMap = null;
    hostMarker = null;
  }
  const el = document.getElementById("host-map-picker");
  if (!el || typeof mapboxgl === "undefined" || !mapboxConfigured()) return;
  mapboxgl.accessToken = MAPBOX_TOKEN;
  hostMap = new mapboxgl.Map({
    container: el,
    style: mapboxStyleUrl(),
    center: [newEventLon, newEventLat],
    zoom: 13,
    fadeDuration: 300,
    attributionControl: false,
    maxPitch: 0,
    pitch: 0,
    dragPitch: false,
    touchPitch: false,
    pitchWithRotate: false,
    crossSourceCollisions: false,
    localIdeographFontFamily:
      "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
    prefetchZoomDelta: 2,
  });
  hostMap.addControl(
    new mapboxgl.NavigationControl({ showCompass: true }),
    "top-right",
  );
  hostMap.on("style.load", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    hostMap.setConfigProperty(
      "basemap",
      "lightPreset",
      isDark ? "night" : "day",
    );
    hostMap.setConfigProperty("basemap", "show3dTrees", false);
    hostMap.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    hostMap.setConfigProperty("basemap", "showTransitLabels", false);
    hostMap.setFog(null);
    hostMap.setRain(null);
    hostMap.setSnow(null);
  });
  hostMap.on("style.load", () => {
    applyMapChrome(hostMap, false);
  });
  const hostEl = document.createElement("div");
  hostEl.className = "evpin-wrap";
  hostEl.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);border:2.5px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block;"></span></div>`;
  hostMarker = new mapboxgl.Marker({ element: hostEl })
    .setLngLat([newEventLon, newEventLat])
    .addTo(hostMap);
  hostMap.on("click", function (e) {
    newEventLat = e.lngLat.lat;
    newEventLon = e.lngLat.lng;
    hostMarker.setLngLat([newEventLon, newEventLat]);
    const el = document.getElementById("host-lat-lon-text");
    if (el)
      el.innerText = `Location Pinned: (${newEventLat.toFixed(4)}, ${newEventLon.toFixed(4)})`;
  });
  setTimeout(() => hostMap.resize(), 50);
}

// ---- ADDRESS SEARCH ----
function generateSessionToken() {
  if (window.crypto && window.crypto.randomUUID)
    return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
let searchSessionToken = generateSessionToken();
let autocompleteTimeout = null;
function handleAddressAutocomplete() {
  const query = (
    document.getElementById("host-address-search")?.value || ""
  ).trim();
  const resultsDiv = document.getElementById("autocomplete-results");
  clearTimeout(autocompleteTimeout);
  if (query.length < 3) {
    resultsDiv.innerHTML = "";
    resultsDiv.style.display = "none";
    return;
  }
  if (!mapboxConfigured()) {
    resultsDiv.innerHTML = `<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">A Mapbox token is required.</div>`;
    resultsDiv.style.display = "block";
    return;
  }
  autocompleteTimeout = setTimeout(async () => {
    resultsDiv.innerHTML =
      '<div style="padding:10px 16px;font-size:13.5px;color:var(--text-muted);">Searching…</div>';
    resultsDiv.style.display = "block";
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}&country=gb&language=en&limit=6&types=address,poi,place,locality,neighborhood,postcode`;
      const res = await fetch(url);
      if (!res.ok) {
        let r = `Error (${res.status}).`;
        if (res.status === 401 || res.status === 403) r = "Token rejected.";
        else if (res.status === 429) r = "Rate limit hit.";
        resultsDiv.innerHTML = `<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">${r}</div>`;
        return;
      }
      const data = await res.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        resultsDiv.innerHTML = data.suggestions
          .map((s) => {
            const fullAddress = s.full_address || s.place_formatted || s.name;
            const placeText = s.name || fullAddress;
            const mapboxId = (s.mapbox_id || "").replace(/'/g, "'");
            return `<div style="padding:10px 14px;cursor:pointer;font-size:13.5px;border-bottom:1px solid var(--line-soft);color:var(--text);" onclick="selectSearchSuggestion('${mapboxId}','${escapeHtml(fullAddress).replace(/'/g, "'")}','${escapeHtml(placeText).replace(/'/g, "'")}')" role="button" tabindex="0">
            <div style="font-weight:600;">${escapeHtml(placeText)}</div>
            ${s.place_formatted ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(s.place_formatted)}</div>` : ""}
          </div>`;
          })
          .join("");
      } else {
        resultsDiv.innerHTML =
          '<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">No matches found</div>';
      }
    } catch (e) {
      resultsDiv.innerHTML = `<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Network error. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;font-size:11px;cursor:pointer;">Retry</button></div>`;
    }
  }, 350);
}
async function selectSearchSuggestion(mapboxId, fullAddress, placeText) {
  const resultsDiv = document.getElementById("autocomplete-results");
  document.getElementById("host-address-search").value = fullAddress;
  resultsDiv.innerHTML =
    '<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">Pinpointing…</div>';
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}`,
    );
    if (!res.ok) throw new Error(`retrieve ${res.status}`);
    const data = await res.json();
    const f = data && data.features && data.features[0];
    if (!f) throw new Error("no feature");
    const [lon, lat] = f.geometry.coordinates;
    selectAutocompleteAddress(lat, lon, fullAddress, placeText);
    resultsDiv.style.display = "none";
  } catch (e) {
    resultsDiv.innerHTML = `<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Couldn't pinpoint. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;cursor:pointer;font-size:11px;">Retry</button></div>`;
  } finally {
    searchSessionToken = generateSessionToken();
  }
}
function selectAutocompleteAddress(lat, lon, fullAddress, name) {
  newEventLat = lat;
  newEventLon = lon;
  document.getElementById("host-address-search").value = fullAddress;
  document.getElementById("autocomplete-results").style.display = "none";
  if (hostMap && hostMarker) {
    hostMarker.setLngLat([lon, lat]);
    hostMap.flyTo({ center: [lon, lat], zoom: 15 });
  }
  const el = document.getElementById("host-lat-lon-text");
  if (el)
    el.innerText = `Location Pinned: (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  const venueInput = document.getElementById("host-venue");
  if (name && venueInput && !venueInput.value && isNaN(name))
    venueInput.value = name.trim();
}

// Blueprint table-stakes: "automatic schema triggers for pricing tiers
// (e.g., Early Bird £8, General £10, Final £15)." Reads the optional
// tiered-pricing rows from the host form (hidden by default — see
// renderHostView() — to keep the default flow simple/fast, matching the
// SAME doc's "60-second mobile publish" demand). Returns null (use the
// flat price field) unless the host actually filled in at least one row.
