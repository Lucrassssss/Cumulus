// ── Map pins: "wheatpaste" poster markers ─────────────────────────────────
// Every event on the map is a tiny poster: the same generated art (or real
// photo) the Discover feed uses, on a white sticker border, slightly tilted
// like something pasted to a wall. Clusters are a stack of the actual
// posters inside them. Same-venue events merge into one pin with a count and
// open as a swipeable card carousel.
//
// Architecture
//   • Clustering stays in Mapbox's GeoJSON source (Supercluster, on a worker)
//     — fast, zoom-aware, and it aggregates live counts via clusterProperties.
//   • Rendering is DOM: only the clusters/pins inside currently loaded tiles
//     get an element (syncPins diffs them each frame the camera moves), so
//     the DOM stays small while every pin gets real CSS animation — springs,
//     staggered pop-ins, tilt, live rings — that a WebGL symbol layer can't do.
//   • An invisible circle layer keeps the source's tiles loaded so
//     querySourceFeatures has something to read.
//   • Zoom level-of-detail is a class on the map host (z-far / z-mid /
//     z-near); CSS morphs pins between dot → tile → tile + label.
//
// Contract kept for the rest of the app: removeActiveHtmlMarker(),
// htmlMarkerRefs (destroyMainMap iterates it), refreshMarkers(),
// attachMapLayers(), updateLivePulse()/stopLivePulse(), updateMapCaptionBar().

let htmlMarkerRefs = {}; // key → { marker, el, added }
let _pinDataVersion = 0; // bumped by buildEventsGeoJSON — cluster ids recycle per setData
let _pinSyncQueued = false;
let _selectedPinKey = null;
const _clusterLeafCache = {};

// ── Helpers ───────────────────────────────────────────────────────────────
function _pinTilt(seedStr) {
  const s = _posterSeed(seedStr);
  return ((s % 9) - 4) * 1.4; // -5.6° … +5.6°
}
function _pinGlyphSvg(cat, size) {
  const inner = CATEGORY_CHIP_ICON_PATHS[cat] || '<circle cx="8" cy="8" r="3"/>';
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${inner}</svg>`;
}
function _pinTileStyle(ev) {
  // posterStyle() already emits --p-a/--p-b/--p-x/--p-y (+ photo URL).
  return posterStyle(ev);
}
function _pinTimeLabel(ev) {
  return eventStatus(ev) === "live" ? "LIVE" : feedTimeLabel(ev);
}
function _eventsForKey(idsJson) {
  let ids = [];
  try {
    ids = JSON.parse(idsJson);
  } catch (e) {}
  return ids
    .map((id) => EVENTS.find((e) => String(e.id) === String(id)))
    .filter(Boolean)
    .sort((a, b) => a.startsAt - b.startsAt);
}

// ── Element builders ──────────────────────────────────────────────────────
function _buildPinEl(props) {
  const evs = _eventsForKey(props.ids);
  const lead = evs[0];
  if (!lead) return null;
  const count = evs.length;
  const live = evs.some((e) => eventStatus(e) === "live");
  const price = eventPrice(lead);
  const el = document.createElement("div");
  el.className = "mp-root";
  el.innerHTML = `<button class="mp${live ? " is-live" : ""}${count > 1 ? " is-multi" : ""}" style="--tilt:${_pinTilt(props.key)}deg;--delay:${(_posterSeed(props.key) % 7) * 35}ms;" aria-label="${escapeHtml(lead.title)}${count > 1 ? ` and ${count - 1} more` : ""}">
      ${live ? '<span class="mp-ring" aria-hidden="true"></span>' : ""}
      <span class="mp-tile ${posterClass(lead)}" style="${_pinTileStyle(lead)}">
        ${lead.photoUrl || lead.nightShotUrl ? "" : `<span class="mp-glyph">${_pinGlyphSvg(lead.category, 18)}</span>`}
      </span>
      ${count > 1 ? `<span class="mp-count">${count}</span>` : ""}
      ${live ? '<span class="mp-live">LIVE</span>' : ""}
      <span class="mp-label"><b>${escapeHtml(_pinTimeLabel(lead))}</b>${count > 1 ? ` <em>+${count - 1} more</em>` : price ? ` · £${price}` : " · Free"}</span>
      <span class="mp-tail" aria-hidden="true"></span>
    </button>`;
  el.querySelector(".mp").addEventListener("click", (e) => {
    e.stopPropagation();
    selectPin(`p${props.key}|${props.ids}`, evs, [lead.lon, lead.lat]);
  });
  return el;
}

function _buildClusterEl(props, coords) {
  const n = props.events || props.point_count;
  const size = n >= 50 ? "xl" : n >= 15 ? "lg" : n >= 5 ? "md" : "sm";
  const el = document.createElement("div");
  el.className = "mc-root";
  el.innerHTML = `<button class="mc mc-${size}" aria-label="${n} events — zoom in">
      <span class="mc-stack">
        <span class="mc-card poster gen" style="--p-a:#8b5cff;--p-b:#ff3d6e;"></span>
        <span class="mc-card poster gen" style="--p-a:#d4ff3f;--p-b:#16a37f;"></span>
        <span class="mc-card poster gen" style="--p-a:#ff8a3d;--p-b:#6c2bff;"></span>
      </span>
      <span class="mc-count">${n}</span>
      ${props.live ? `<span class="mc-live"><i></i>${props.live} live</span>` : ""}
    </button>`;
  el.querySelector(".mc").addEventListener("click", (e) => {
    e.stopPropagation();
    zoomIntoCluster(props.cluster_id, coords);
  });
  _paintClusterLeaves(el, props.cluster_id);
  return el;
}

// Swap the placeholder gradients for the real posters inside the cluster.
function _paintClusterLeaves(el, clusterId) {
  const apply = (leaves) => {
    const evs = [];
    (leaves || []).forEach((f) => evs.push(..._eventsForKey(f.properties.ids)));
    const cards = el.querySelectorAll(".mc-card");
    evs.slice(0, 3).forEach((ev, i) => {
      if (!cards[i]) return;
      cards[i].className = `mc-card ${posterClass(ev)}`;
      cards[i].setAttribute("style", _pinTileStyle(ev));
    });
  };
  const ck = `${_pinDataVersion}-${clusterId}`;
  if (_clusterLeafCache[ck]) return apply(_clusterLeafCache[ck]);
  const src = lmap && lmap.getSource("events-source");
  if (!src) return;
  const done = (err, leaves) => {
    if (err) return;
    _clusterLeafCache[ck] = leaves;
    apply(leaves);
  };
  try {
    const r = src.getClusterLeaves(clusterId, 3, 0, done);
    if (r && typeof r.then === "function") r.then((l) => done(null, l), done);
  } catch (e) {}
}

function zoomIntoCluster(clusterId, coords) {
  const src = lmap && lmap.getSource("events-source");
  if (!src) return;
  const go = (err, zoom) => {
    if (err) return;
    lmap.flyTo({ center: coords, zoom: Math.min(zoom + 0.6, 17), speed: 1.4, curve: 1.3, essential: true });
  };
  try {
    const r = src.getClusterExpansionZoom(clusterId, go);
    if (r && typeof r.then === "function") r.then((z) => go(null, z), go);
  } catch (e) {}
}

// Only push data (and invalidate cluster ids) when it actually changed —
// the viewport fetch re-sends the same set after every pan, and a blind
// setData would rebuild every cluster marker each time.
let _lastPinDataSig = null;
function setEventsSourceData(src, geo) {
  const sig = JSON.stringify(geo.features.map((f) => f.properties));
  if (sig === _lastPinDataSig) return false;
  _lastPinDataSig = sig;
  _pinDataVersion++;
  src.setData(geo);
  schedulePinSync();
  return true;
}

// ── Sync DOM markers with the source ──────────────────────────────────────
function schedulePinSync() {
  if (_pinSyncQueued) return;
  _pinSyncQueued = true;
  requestAnimationFrame(() => {
    _pinSyncQueued = false;
    syncPins();
  });
}

function syncPins() {
  if (!lmap || !lmap.getSource("events-source") || !lmap.isSourceLoaded("events-source")) return;
  let feats = [];
  try {
    feats = lmap.querySourceFeatures("events-source");
  } catch (e) {
    return;
  }
  const seen = new Set();
  feats.forEach((f) => {
    const p = f.properties || {};
    const coords = f.geometry.coordinates;
    const key = p.cluster ? `c${_pinDataVersion}-${p.cluster_id}` : `p${p.key}|${p.ids}`;
    if (seen.has(key)) return; // features repeat across tile boundaries
    seen.add(key);
    let ref = htmlMarkerRefs[key];
    if (ref && ref.leaving) {
      clearTimeout(ref.leaving);
      ref.leaving = null;
      ref.el.classList.remove("leaving");
    }
    if (!ref) {
      const el = p.cluster ? _buildClusterEl(p, coords) : _buildPinEl(p);
      if (!el) return;
      const marker = new mapboxgl.Marker({ element: el, anchor: p.cluster ? "center" : "bottom" })
        .setLngLat(coords)
        .addTo(lmap);
      ref = htmlMarkerRefs[key] = { marker, el, added: true, cluster: !!p.cluster };
      if (key === _selectedPinKey) el.classList.add("selected");
    }
  });
  Object.keys(htmlMarkerRefs).forEach((key) => {
    if (seen.has(key)) return;
    const ref = htmlMarkerRefs[key];
    if (ref.leaving) return;
    ref.el.classList.add("leaving");
    ref.leaving = setTimeout(() => {
      try {
        ref.marker.remove();
      } catch (e) {}
      delete htmlMarkerRefs[key];
    }, 200);
  });
}

function _clearAllPins() {
  Object.values(htmlMarkerRefs).forEach((ref) => {
    try {
      ref.marker.remove();
    } catch (e) {}
    if (ref.leaving) clearTimeout(ref.leaving);
  });
  htmlMarkerRefs = {};
}

// Zoom level-of-detail classes on the map host.
function updatePinLOD() {
  const host = document.getElementById("main-map");
  if (!host || !lmap) return;
  const z = lmap.getZoom();
  host.classList.toggle("z-far", z < 11.2);
  host.classList.toggle("z-mid", z >= 11.2 && z < 14);
  host.classList.toggle("z-near", z >= 14);
}

// ── Selection: bottom card carousel ───────────────────────────────────────
function selectPin(key, evs, coords) {
  _selectedPinKey = key;
  Object.entries(htmlMarkerRefs).forEach(([k, r]) => r.el.classList.toggle("selected", k === key));
  const host = document.getElementById("main-map");
  if (host) host.classList.add("has-selection");
  showMapCards(evs);
  if (lmap) {
    lmap.easeTo({
      center: coords,
      offset: [0, -90], // keep the pin clear of the card sheet
      zoom: Math.max(lmap.getZoom(), 13.5),
      duration: 650,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
  }
}

function _mcardHtml(ev) {
  const st = eventStatus(ev);
  return `<article class="mcard" onclick="removeActiveHtmlMarker();openEvent('${ev.id}')" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)}">
    <div class="mcard-art ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}</div>
    <div class="mcard-body">
      <div class="fr-date${st === "live" ? " live" : ""}">${st === "live" ? '<span class="pulse"></span>' : ""}${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</div>
      <h3 class="mcard-title">${escapeHtml(ev.title)}</h3>
      <div class="fr-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
      <div class="mcard-foot"><span class="fr-price${eventPrice(ev) ? "" : " free"}">${feedPriceLabel(ev)}</span><span class="mcard-go">View →</span></div>
    </div>
  </article>`;
}

// Short "when" label for the date tabs: "LIVE", "Tonight 19:00", "Thu 20:00",
// "Sat 6 Dec" (date only once it's more than a week out).
function _mcardWhen(ev) {
  if (eventStatus(ev) === "live") return "Live now";
  const d = new Date(ev.startsAt);
  const day0 = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(new Date())) / 86400000);
  const t = feedTimeLabel(ev);
  if (diff === 0) return `${d.getHours() >= 17 ? "Tonight" : "Today"} ${t}`;
  if (diff === 1) return `Tomorrow ${t}`;
  if (diff < 7) return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${t}`;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function showMapCards(evs) {
  const host = document.getElementById("main-map");
  if (!host) return;
  let sheet = document.getElementById("map-cards");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "map-cards";
    sheet.className = "map-cards";
    host.appendChild(sheet);
  }
  const multi = evs.length > 1;
  const venue = evs[0] && (evs[0].venue || evs[0].area || "This spot");
  sheet.classList.toggle("multi", multi);
  sheet.innerHTML = multi
    ? `<div class="mcard-panel">
        <div class="mcard-top">
          <div class="mcard-where">
            <b>${escapeHtml(venue)}</b>
            <span><i class="mcard-count">${evs.length}</i> events at this spot</span>
          </div>
          <div class="mcard-nav">
            <button class="mcard-arrow" data-dir="-1" aria-label="Previous event"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
            <span class="mcard-pos" aria-live="polite">1 / ${evs.length}</span>
            <button class="mcard-arrow" data-dir="1" aria-label="Next event"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        <div class="mcard-dates" role="tablist" aria-label="When">${evs
          .map(
            (ev, i) =>
              `<button role="tab" class="mcard-date${i === 0 ? " on" : ""}${eventStatus(ev) === "live" ? " live" : ""}" data-i="${i}" aria-selected="${i === 0}">${eventStatus(ev) === "live" ? '<span class="pulse"></span>' : ""}${escapeHtml(_mcardWhen(ev))}</button>`,
          )
          .join("")}</div>
        <div class="mcard-rail">${evs.map(_mcardHtml).join("")}</div>
      </div>`
    : `<div class="mcard-rail">${evs.map(_mcardHtml).join("")}</div>`;
  if (multi) _wireMapCardPager(sheet, evs.length);
  sheet.classList.remove("out");
  void sheet.offsetWidth;
  sheet.classList.add("in");
}

// Keeps arrows, "n / N" and the date tabs in sync with the card rail —
// whether the person swipes, taps an arrow or taps a date.
function _wireMapCardPager(sheet, count) {
  const rail = sheet.querySelector(".mcard-rail");
  const pos = sheet.querySelector(".mcard-pos");
  const dates = [...sheet.querySelectorAll(".mcard-date")];
  const [prev, next] = sheet.querySelectorAll(".mcard-arrow");
  const cards = [...rail.querySelectorAll(".mcard")];
  let current = 0;
  const go = (i) => {
    i = Math.max(0, Math.min(count - 1, i));
    const c = cards[i];
    if (c) rail.scrollTo({ left: c.offsetLeft - rail.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
    mark(i);
  };
  const mark = (i) => {
    if (i === current && pos.textContent.startsWith(`${i + 1} `)) return;
    current = i;
    pos.textContent = `${i + 1} / ${count}`;
    prev.disabled = i === 0;
    next.disabled = i === count - 1;
    dates.forEach((d, k) => {
      d.classList.toggle("on", k === i);
      d.setAttribute("aria-selected", k === i ? "true" : "false");
    });
    const tab = dates[i];
    if (tab) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    cards.forEach((c, k) => c.classList.toggle("on", k === i));
  };
  [prev, next].forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      go(current + Number(b.dataset.dir));
    }),
  );
  dates.forEach((d) =>
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      go(Number(d.dataset.i));
    }),
  );
  let raf = null;
  rail.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0,
        bestD = Infinity;
      cards.forEach((c, k) => {
        const d = Math.abs(c.offsetLeft - rail.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      mark(best);
    });
  });
  current = -1;
  mark(0);
}

function removeActiveHtmlMarker() {
  _selectedPinKey = null;
  Object.values(htmlMarkerRefs).forEach((r) => r.el.classList.remove("selected"));
  const host = document.getElementById("main-map");
  if (host) host.classList.remove("has-selection");
  const sheet = document.getElementById("map-cards");
  if (sheet && sheet.classList.contains("in")) {
    sheet.classList.remove("in");
    sheet.classList.add("out");
  }
}
function closeActivePopup() {
  removeActiveHtmlMarker();
}
// Kept for callers that open a specific event's pin (e.g. deep links).
function openActiveEventMarker(evId) {
  const ev = EVENTS.find((e) => String(e.id) === String(evId));
  if (!ev || ev.lat == null || ev.lon == null) return;
  selectPin(`${ev.lon.toFixed(6)},${ev.lat.toFixed(6)}`, [ev], [ev.lon, ev.lat]);
}

// ── Source + layers ───────────────────────────────────────────────────────
function attachMapLayers() {
  if (!lmap || lmap.getSource("events-source")) return;
  _lastPinDataSig = null; // fresh source — must receive data again
  _clearAllPins();

  lmap.addSource("events-source", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    // Pins are ~52px poster tiles, so merge anything that would overlap
    // at that size; let go at street level where venues are distinct.
    clusterRadius: 48,
    clusterMaxZoom: 14,
    clusterProperties: {
      events: ["+", ["get", "count"]],
      live: ["+", ["get", "live"]],
    },
  });
  // Invisible: only here so the source's tiles load for querySourceFeatures.
  lmap.addLayer({
    id: "events-anchor",
    type: "circle",
    source: "events-source",
    paint: { "circle-radius": 1, "circle-opacity": 0, "circle-stroke-opacity": 0 },
  });

  lmap.on("sourcedata", (e) => {
    if (e.sourceId === "events-source" && e.isSourceLoaded) schedulePinSync();
  });
  lmap.on("move", schedulePinSync);
  lmap.on("moveend", schedulePinSync);
  lmap.on("zoom", updatePinLOD);
  updatePinLOD();

  // Tap on empty map closes the card sheet (pin clicks stopPropagation).
  lmap.on("click", () => removeActiveHtmlMarker());

  // After each camera settle, fetch only the events within the new viewport.
  lmap.on("moveend", () => _debouncedFetchVisible());

  if (state.view === "browse") setTimeout(refreshMarkers, 0);
}

// Pulses are CSS now (.mp-ring) — these stay as no-op-safe hooks for the
// rest of the app that still calls them.
function stopLivePulse() {}
function updateLivePulse() {}

// Small inline-SVG versions of the same category glyph concepts drawn onto
// the map pins (drawCategoryGlyph below) — used on filter chips so pins and
// chips read as the same icon language. Kept as separate small SVGs (rather
// than reusing the pins' rendered PNGs) so chips don't depend on the map's
// canvas/WebGL icons having finished generating first.
const CATEGORY_CHIP_ICON_PATHS = {
  Creative:
    '<path d="M8 1c.7 2.3 1.7 3.3 4 4-2.3.7-3.3 1.7-4 4-.7-2.3-1.7-3.3-4-4 2.3-.7 3.3-1.7 4-4Z"/>',
  Gaming:
    '<path d="M6.3 1h3.4v3.3H13v3.4H9.7V11H6.3V7.7H3V4.3h3.3V1Z"/>',
  "Movie Nights": '<path d="M4.2 2v12l8.6-6-8.6-6Z"/>',
  "Board Games": '<path d="M8 1.5 13 8 8 14.5 3 8 8 1.5Z"/>',
  Meetups: '<circle cx="5.3" cy="8" r="2.4"/><circle cx="10.7" cy="8" r="2.4"/>',
  "Food & Drink":
    '<path d="M4 2.5h8L8.7 7.4v3.1h1.5v1.3H5.8v-1.3h1.5V7.4L4 2.5Z"/>',
  "Live Music":
    '<ellipse cx="5.6" cy="10.6" rx="2.2" ry="1.6" transform="rotate(-25 5.6 10.6)"/><rect x="7.5" y="1.8" width="1.3" height="8.8" rx="0.4"/>',
  "Wellness & Outdoors":
    '<circle cx="8" cy="8" r="2.3"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 2v1.7M8 12.3V14M2 8h1.7M12.3 8H14M3.5 3.5l1.2 1.2M11.3 11.3l1.2 1.2M12.5 3.5l-1.2 1.2M4.7 11.3l-1.2 1.2"/></g>',
  "Tech & Talks": '<path d="M8.8 1 3.6 8.8h3l-.4 6.2 5.6-8.6h-3.2L8.8 1Z"/>',
};
function categoryChipIconSvg(name) {
  const inner = CATEGORY_CHIP_ICON_PATHS[name] || "";
  return `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style="display:inline-block;vertical-align:-2px;">${inner}</svg>`;
}

// The floating caption pill above the bottom nav used to just say the
// static, meaningless "Live events pulse · tap pin to view" — no actual
// information about what's live right now. Give it the real count and
// spell out what tapping a pin does; also switches to a warmer glowing
// treatment when something really is live so it reads as a live signal,
// not decoration.
function updateMapCaptionBar() {
  const bar = document.getElementById("map-caption-bar");
  const copy = document.getElementById("map-caption-copy");
  if (!bar || !copy) return;
  const liveCount = getFilteredEvents().filter(
    (ev) => eventStatus(ev) === "live",
  ).length;
  const isLive = liveCount > 0;
  bar.classList.toggle("has-live", isLive);
  copy.innerHTML = isLive
    ? `<strong>${liveCount}</strong> pulsing live now`
    : "Nothing live right now";
}

function refreshMarkers() {
  if (!lmap || typeof mapboxgl === "undefined") return;
  const src = lmap.getSource("events-source");
  if (!src) {
    lmap.once("load", refreshMarkers);
    return;
  }

  removeActiveHtmlMarker();

  const geo = buildEventsGeoJSON();
  setEventsSourceData(src, geo);

  const visibleEvents = getFilteredEvents();
  updateMapEmptyState(visibleEvents.length);
  updateMapCaptionBar();

  if (!lmapFitted && geo.features.length > 0) {
    const coords = geo.features.map((f) => f.geometry.coordinates);
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );
    lmap.fitBounds(bounds, {
      padding: { top: 140, bottom: 170, left: 50, right: 50 },
      maxZoom: 13.5,
      duration: 900,
    });
    lmapFitted = true;
  }
}
