// ── WebGL Lightning Beacon ────────────────────────────────────────────────
// Pure WebGL effect — zero DOM thrashing. Uses fill-extrusion (vertical
// beam) + circle (ground shockwave) driven by a requestAnimationFrame loop.
// Replaces mapboxgl.Marker() for the "selected event" highlight entirely.

/**
 * createGeoJSONCircle — builds a GeoJSON Polygon approximating a circle.
 * Mapbox fill-extrusion requires a polygon; it cannot extrude a Point.
 *
 * @param {[number,number]} center  [lng, lat]
 * @param {number}          radiusM Radius in metres
 * @param {number}          pts     Polygon vertex count (default 32)
 * @returns {object}  GeoJSON Feature<Polygon>
 */
function createGeoJSONCircle(center, radiusM, pts = 32) {
  const [lng, lat] = center;
  const coords = [];
  // Convert metres → rough degrees (equirectangular approximation fine at city scale)
  const dLat = radiusM / 111320; // metres per degree latitude
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= pts; i++) {
    const angle = (i / pts) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

/**
 * spawnLightningBeacon — adds a WebGL energy beacon at lngLat on mapInstance.
 *
 * Sources / layers added (all namespaced by eventId to allow coexistence):
 *   beacon-beam-src-{id}   GeoJSON polygon  → fill-extrusion (vertical beam)
 *   beacon-wave-src-{id}   GeoJSON point    → circle (ground shockwave)
 *
 * The rAF loop strobe-flickers the beam opacity (chaotic lightning feel) and
 * pulses the shockwave radius outward while fading opacity to zero.
 *
 * Usage (replaces new mapboxgl.Marker(el).setLngLat([lon,lat]).addTo(lmap)):
 *   const beacon = spawnLightningBeacon(lmap, [ev.lon, ev.lat], ev.id, color);
 *   // later: beacon.destroy();
 *
 * @param {mapboxgl.Map}     mapInstance
 * @param {[number,number]}  lngLat   [longitude, latitude]
 * @param {string|number}    eventId  Unique event identifier
 * @param {string}           color    CSS hex or rgb colour for the beam
 * @returns {{ destroy: Function }}  Call .destroy() to tear down cleanly
 */
function spawnLightningBeacon(mapInstance, lngLat, eventId, color = "#0ea5e9") {
  const id = String(eventId).replace(/[^a-zA-Z0-9]/g, "_");
  const beamSrcId = `beacon-beam-src-${id}`;
  const waveSrcId = `beacon-wave-src-${id}`;
  const beamLyrId = `beacon-beam-${id}`;
  const waveLyrId = `beacon-wave-${id}`;

  let rafId = null;
  let destroyed = false;

  // ── Add GeoJSON sources ──────────────────────────────────────────────────
  // Beam source: small polygon so fill-extrusion has geometry to extrude
  mapInstance.addSource(beamSrcId, {
    type: "geojson",
    data: createGeoJSONCircle(lngLat, 8, 32), // 8-metre footprint
  });

  // Shockwave source: simple Point for the flat circle
  mapInstance.addSource(waveSrcId, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: lngLat },
          properties: {},
        },
      ],
    },
  });

  // ── Add Layers ───────────────────────────────────────────────────────────
  // Beam: fill-extrusion shoots 2500 m into the sky with vertical gradient
  mapInstance.addLayer({
    id: beamLyrId,
    type: "fill-extrusion",
    source: beamSrcId,
    paint: {
      "fill-extrusion-color": color,
      "fill-extrusion-height": 2500,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.85,
      "fill-extrusion-vertical-gradient": true,
    },
  });

  // Shockwave: flat circle on the ground plane, pitch-aligned to the terrain
  mapInstance.addLayer({
    id: waveLyrId,
    type: "circle",
    source: waveSrcId,
    paint: {
      "circle-color": color,
      "circle-radius": 0,
      "circle-opacity": 0.8,
      "circle-pitch-alignment": "map", // lies flat on 3D terrain
      "circle-pitch-scale": "map",
    },
  });

  // ── Animation Loop ───────────────────────────────────────────────────────
  // Beam: chaotic lightning strobe — random flickers at ~60fps
  // Shockwave: radius expands 0→120px, opacity 0.8→0 over WAVE_PERIOD ms
  const WAVE_PERIOD = 2000; // ms for one full shockwave pulse
  const WAVE_MAX_R = 120; // px at 1:1 zoom — Mapbox scales automatically
  let waveStart = null;

  // Lightning uses a 3-frame strobe sequence seeded by noise for chaos
  let noiseT = Math.random() * 1000;

  function tick(ts) {
    if (destroyed) return;

    // Graceful exit: if either layer was removed externally, shut down
    if (!mapInstance.getLayer(beamLyrId) || !mapInstance.getLayer(waveLyrId)) {
      destroyed = true;
      return;
    }

    // ── Beam: chaotic lightning strobe ──
    // Mix two sine waves at irrational frequencies to avoid periodicity,
    // then clamp into a range that always keeps a minimum visible base.
    noiseT += 0.08;
    const n1 = Math.sin(noiseT * 1.7);
    const n2 = Math.sin(noiseT * 3.1 + 0.9);
    const n3 = Math.sin(noiseT * 7.3 + 2.1);
    // Occasional hard-flash on peaks for the spark/surge effect
    const flash = (n1 + n2 * 0.5 + n3 * 0.25 + 1.75) / 3.5; // 0–1
    const beamOpacity = 0.2 + flash * 0.75; // range: 0.2–0.95
    mapInstance.setPaintProperty(
      beamLyrId,
      "fill-extrusion-opacity",
      beamOpacity,
    );

    // ── Shockwave: expanding ring that resets every WAVE_PERIOD ms ──
    if (!waveStart) waveStart = ts;
    const elapsed = (ts - waveStart) % WAVE_PERIOD;
    const progress = elapsed / WAVE_PERIOD; // 0 → 1
    const waveR = WAVE_MAX_R * progress;
    const waveA = 0.8 * (1 - progress); // opacity fades out
    mapInstance.setPaintProperty(waveLyrId, "circle-radius", waveR);
    mapInstance.setPaintProperty(waveLyrId, "circle-opacity", waveA);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    destroy() {
      destroyed = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      try {
        mapInstance.removeLayer(beamLyrId);
      } catch (e) {}
      try {
        mapInstance.removeLayer(waveLyrId);
      } catch (e) {}
      try {
        mapInstance.removeSource(beamSrcId);
      } catch (e) {}
      try {
        mapInstance.removeSource(waveSrcId);
      } catch (e) {}
    },
  };
}

let activePopup = null,
  activePopupEventId = null;
let activeHtmlMarker = null;
let activeBeacon = null; // current lightning beacon (WebGL, replaces DOM marker)
let hoverPopup = null,
  hoverPopupEventId = null; // pointer-hover preview, separate from the click/selected popup above

function removeHoverPopup() {
  if (hoverPopup) {
    try {
      hoverPopup.remove();
    } catch (e) {}
    hoverPopup = null;
    hoverPopupEventId = null;
  }
}

// ── Pin bounce animation ────────────────────────────────────────────────
// Mapbox GL only allows feature-state expressions on PAINT properties, not
// layout properties — icon-size is layout, so per-pin animated scale isn't
// possible on the WebGL symbol layer itself (confirmed: attempting it throws
// "feature-state data expressions are not supported with layout
// properties"). Two different techniques cover the two cases instead:
//   1. Entrance: a single synchronized rAF loop scales the WHOLE layer's
//      icon-size 0→1 with overshoot — a "the map pops in" moment, played
//      once on first load rather than per-pin.
//   2. Hover/click: a single reusable DOM element, styled with the exact
//      same pre-rendered pin image (captured as a data URL alongside the
//      WebGL icon in loadWebGLIcons), positioned over the hovered pin via
//      map.project() and CSS-transitioned with a bounce easing — real
//      per-pin scale, just done in the DOM instead of WebGL.
function easeOutBack(t) {
  const c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
let _pinLayerAnim = null;
function tweenPinLayerSize(from, to, duration, easing) {
  if (!lmap) return;
  if (_pinLayerAnim) cancelAnimationFrame(_pinLayerAnim);
  const start = performance.now();
  function frame(now) {
    const t = Math.max(0, Math.min(1, (now - start) / duration));
    const size = Math.max(0, from + (to - from) * easing(t));
    try {
      lmap.setLayoutProperty("unclustered-events", "icon-size", size);
    } catch (e) {}
    if (t < 1) _pinLayerAnim = requestAnimationFrame(frame);
    else _pinLayerAnim = null;
  }
  _pinLayerAnim = requestAnimationFrame(frame);
}
let _pinsEverLoaded = false;
// Plays the whole-layer pop-in once, the first time any pins ever appear
// (real initial load, or the first data arriving after a slow network) —
// not replayed on every incidental refresh/filter change.
function bounceInPinLayer(features) {
  if (_pinsEverLoaded || !features.length) return;
  _pinsEverLoaded = true;
  tweenPinLayerSize(0, 1, 550, easeOutBack);
}

// Data-URL cache of each category's pin image, captured in loadWebGLIcons —
// reused by the DOM hover-overlay so it's pixel-identical to the WebGL pin.
const pinImageDataUrls = {};
const pinFreeImageDataUrls = {};

let _pinOverlayEl = null;
function ensurePinOverlay() {
  if (_pinOverlayEl) return _pinOverlayEl;
  const host = document.getElementById("main-map");
  if (!host) return null;
  const el = document.createElement("div");
  el.className = "pin-hover-overlay";
  el.innerHTML = `<img alt="" />`;
  host.appendChild(el);
  _pinOverlayEl = el;
  // The wrapper stays pointer-events:none (see CSS) so it never eats clicks
  // meant for the map underneath it, but the <img> itself opts back in —
  // it's the img that visually grows 18% on hover, and without this the
  // grown outer ring of the pin looked clickable but silently did nothing,
  // since the underlying WebGL layer's hit-box never grew to match. A click
  // anywhere on the now fully-interactable pin (grown or not) opens it,
  // mirroring the WebGL layer's own click handler exactly.
  el.querySelector("img").addEventListener("click", (e) => {
    e.stopPropagation();
    if (_pinOverlayEvId == null) return;
    removeHoverPopup();
    hidePinOverlay();
    openActiveEventMarker(_pinOverlayEvId);
  });
  return el;
}
let _pinOverlayEvId = null;
function positionPinOverlay(lngLat) {
  if (!_pinOverlayEl || !lmap) return;
  const p = lmap.project(lngLat);
  _pinOverlayEl.style.transform = `translate(${p.x - 20}px, ${p.y - 50}px)`;
}
function showPinOverlay(ev) {
  const el = ensurePinOverlay();
  if (!el) return;
  _pinOverlayEvId = ev.id;
  const img = el.querySelector("img");
  const isFree = eventPrice(ev) <= 0;
  img.src =
    (isFree ? pinFreeImageDataUrls[ev.category] : pinImageDataUrls[ev.category]) || "";
  positionPinOverlay([ev.lon, ev.lat]);
  el.style.display = "block";
  // Always retrigger the bounce-in from a clean state, even when the
  // overlay is already showing a different pin (moving mouse from pin to
  // pin) — otherwise .grown was already applied and re-adding a class
  // that's already present is a no-op, so the pin just snapped to the new
  // position with no bounce, which read as a glitchy jump rather than a
  // deliberate hover transition.
  el.classList.remove("grown");
  void el.offsetWidth; // force reflow so the removal actually takes effect
  el.classList.add("grown");
}
function hidePinOverlay() {
  if (!_pinOverlayEl) return;
  _pinOverlayEl.classList.remove("grown");
  const el = _pinOverlayEl;
  setTimeout(() => {
    if (_pinOverlayEvId == null) el.style.display = "none";
  }, 220);
  _pinOverlayEvId = null;
}

function removeActiveHtmlMarker() {
  // Destroy WebGL beacon if one is live
  if (activeBeacon) {
    try {
      activeBeacon.destroy();
    } catch (e) {}
    activeBeacon = null;
  }
  if (activeHtmlMarker) {
    try {
      activeHtmlMarker.remove();
    } catch (e) {}
    activeHtmlMarker = null;
  }
  closeActivePopup();
}

function closeActivePopup() {
  if (activePopup) {
    try {
      activePopup.remove();
    } catch (e) {}
    activePopup = null;
    activePopupEventId = null;
  }
  if (activeHtmlMarker) {
    try {
      activeHtmlMarker.remove();
    } catch (e) {}
    activeHtmlMarker = null;
  }
  document
    .querySelectorAll(".evpin.open")
    .forEach((el) => el.classList.remove("open"));
}

let htmlMarkerRefs = {};

// Small bold glyph per category, drawn in the category colour inside the
// pin's white head-hole — filled geometric shapes (not thin strokes), since
// strokes disappear at this scale. cx/cy is the hole centre, r ~ hole radius.
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

function drawCategoryGlyph(ctx, name, cx, cy, r) {
  ctx.beginPath();
  if (name === "Creative") {
    // 4-point sparkle
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.25, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.25, cy + r * 0.25, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.25, cy + r * 0.25, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.25, cy - r * 0.25, cx, cy - r);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Gaming") {
    // D-pad cross
    const t = r * 0.5;
    ctx.rect(cx - t, cy - r, t * 2, r * 2);
    ctx.rect(cx - r, cy - t, r * 2, t * 2);
    ctx.fill();
  } else if (name === "Movie Nights") {
    // play triangle
    ctx.moveTo(cx - r * 0.55, cy - r * 0.8);
    ctx.lineTo(cx - r * 0.55, cy + r * 0.8);
    ctx.lineTo(cx + r * 0.85, cy);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Board Games") {
    // bold diamond — reads clearly at small scale where dice pips just blur
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.9, cy);
    ctx.lineTo(cx, cy + r * 0.9);
    ctx.lineTo(cx - r * 0.9, cy);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Meetups") {
    // two clearly-separated dots (not touching, so they don't blur into one blob)
    ctx.arc(cx - r * 0.52, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.52, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === "Food & Drink") {
    // coupe glass: triangle bowl + stem + base
    ctx.moveTo(cx - r * 0.75, cy - r * 0.65);
    ctx.lineTo(cx + r * 0.75, cy - r * 0.65);
    ctx.lineTo(cx, cy + r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - r * 0.09, cy + r * 0.15, r * 0.18, r * 0.45);
    ctx.fillRect(cx - r * 0.42, cy + r * 0.55, r * 0.84, r * 0.14);
  } else if (name === "Live Music") {
    // eighth note: notehead + stem
    ctx.ellipse(
      cx - r * 0.32,
      cy + r * 0.42,
      r * 0.42,
      r * 0.32,
      -0.35,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillRect(cx + r * 0.05, cy - r * 0.75, r * 0.16, r * 1.2);
  } else if (name === "Wellness & Outdoors") {
    // sun — bold circle + 4 short thick rays; more small-scale contrast
    // than a smooth leaf curve, which just blurred into a plain blob
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    const rayW = r * 0.26,
      rayLen = r * 0.38,
      gap = r * 0.5;
    [0, 90, 180, 270].forEach((deg) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-rayW / 2, -gap);
      ctx.lineTo(rayW / 2, -gap);
      ctx.lineTo(0, -gap - rayLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  } else if (name === "Tech & Talks") {
    // lightning bolt
    ctx.moveTo(cx + r * 0.12, cy - r * 0.85);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.08, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.12, cy + r * 0.85);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.12);
    ctx.lineTo(cx + r * 0.08, cy - r * 0.12);
    ctx.closePath();
    ctx.fill();
  }
}

// Classic teardrop map-pin silhouette: white outer pin (border/shadow edge),
// category-colour inner pin, white circle "head-hole" near the top with a
// small category glyph inside it. The tip sits near the bottom of the canvas
// so icon-anchor:'bottom' on the symbol layer plants the tip — not the
// visual centre — on the event's coordinate.
// Codex pin taxonomy: "Standard Pins" (paid) vs "Ghost Pins" (free events,
// visually distinct/muted so a scan of the map reads price at a glance).
// "Sponsored Pins" from the same spec are deliberately not built — there's
// no brand/sponsorship data model anywhere in this schema, and drawing a
// glowing pin for a feature that doesn't exist would be UI for nothing (see
// PRODUCT.md — sponsorship is a manual sales process, not a product
// surface). A ghost pin is just the same silhouette in a muted grey instead
// of the category colour, at reduced opacity — still shows the category
// glyph, so "cheap/free" doesn't come at the cost of "what kind of event".
const GHOST_PIN_COLOR = "#9CA3AF";
function drawPinIcon(ctx, name, cat, muted) {
  const outerPin = new Path2D(
    "M20 3C11.72 3 5 9.72 5 18c0 11.6 15 31 15 31s15-19.4 15-31C35 9.72 28.28 3 20 3Z",
  );
  const innerPin = new Path2D(
    "M20 6C13.4 6 8 11.4 8 18c0 9.6 12 27 12 27s12-17.4 12-27C32 11.4 26.6 6 20 6Z",
  );
  const fill = muted ? GHOST_PIN_COLOR : cat.color;
  ctx.globalAlpha = muted ? 0.62 : 1;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";
  ctx.fill(outerPin);
  ctx.restore();
  ctx.fillStyle = fill;
  ctx.fill(innerPin);
  ctx.beginPath();
  ctx.arc(20, 18, 7.2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = fill;
  drawCategoryGlyph(ctx, name, 20, 18, 5.6);
  ctx.globalAlpha = 1;
}
function loadWebGLIcons() {
  if (!lmap) return;
  Object.entries(CATS).forEach(([name, cat]) => {
    const w = 40,
      h = 50;
    [false, true].forEach((muted) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      drawPinIcon(ctx, name, cat, muted);
      // ctx.getImageData() reads the actual pixel buffer back from the
      // canvas as a flat Uint8ClampedArray — the format Mapbox addImage()
      // requires.
      const imageData = ctx.getImageData(0, 0, w, h);
      const imgId = (muted ? "pin-free-" : "pin-") + name;
      try {
        lmap.addImage(imgId, { width: w, height: h, data: imageData.data });
      } catch (e) {}
      (muted ? pinFreeImageDataUrls : pinImageDataUrls)[name] = canvas.toDataURL();
    });
  });
}

// Pin canvas is 40x50 (loadWebGLIcons) with icon-anchor:'bottom', so the
// event coordinate sits at the pin's TIP — the visual pin extends ~50px up
// the screen from that point, growing to ~59px on hover (.grown scale 1.18).
// The old bottom offset (-14) cleared only the tip, so the tooltip rendered
// overlapping the pin's own head/icon instead of sitting above it. -66
// clears the full grown pin plus a small breathing gap. Shared by both the
// click popup and the hover popup so they can never drift out of sync.
const PIN_POPUP_OFFSET = {
  top: [0, 8],
  bottom: [0, -66],
  left: [22, 0],
  right: [-22, 0],
};

function openActiveEventMarker(evId) {
  removeActiveHtmlMarker(); // tears down prior beacon + popup
  const ev = EVENTS.find((e) => String(e.id) === String(evId));
  if (!ev || ev.lat == null || ev.lon == null) return;

  const catData = CATS[ev.category] || {};
  const color = catData.color || "#FFCF33";
  const status = eventStatus(ev);

  // ── WebGL Lightning Beacon (replaces DOM evpin marker entirely) ──────────
  // spawnLightningBeacon returns a { destroy() } handle stored in activeBeacon.
  // removeActiveHtmlMarker() calls .destroy() next time a new pin is selected
  // or the map canvas is tapped empty.
  if (lmap && ev.lon != null && ev.lat != null) {
    activeBeacon = spawnLightningBeacon(lmap, [ev.lon, ev.lat], ev.id, color);
  }

  // ── Mapbox Popup (unchanged — still a lightweight overlay, not DOM-heavy) ─
  const popup = new mapboxgl.Popup({
    offset: PIN_POPUP_OFFSET,
    closeButton: false,
    closeOnClick: false,
    className: "evtip-popup",
    anchor: "bottom",
    maxWidth: "240px",
  })
    .setLngLat([ev.lon, ev.lat])
    .setHTML(pinTooltipHtml(ev))
    .addTo(lmap);
  activePopup = popup;
  activePopupEventId = ev.id;

  const popupEl = popup.getElement();
  if (popupEl) {
    popupEl.addEventListener("click", (e) => {
      e.stopPropagation();
      removeActiveHtmlMarker();
      openEvent(ev.id);
    });
    popupEl.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeActiveHtmlMarker();
        openEvent(ev.id);
      },
      { passive: false },
    );
  }
  lmap.easeTo({ center: [ev.lon, ev.lat] });
}

function updateClusterPaint() {
  if (!lmap || !lmap.getLayer("clusters")) return;
  const dk = state.theme === "dark";
  const c0 = dk ? "#FFCF33" : "#E0A800";
  const c1 = dk ? "#E0A800" : "#966A0A";
  const c2 = dk ? "#966A0A" : "#8A5C0A";
  lmap.setPaintProperty("clusters", "circle-color", [
    "step",
    ["get", "point_count"],
    c0,
    10,
    c1,
    30,
    c2,
  ]);
  lmap.setPaintProperty(
    "clusters",
    "circle-stroke-color",
    dk ? "rgba(232,184,75,0.55)" : "rgba(255,255,255,0.85)",
  );
}

function attachMapLayers() {
  if (!lmap || lmap.getSource("events-source")) return;

  // Load WebGL custom pin icons
  loadWebGLIcons();

  lmap.addSource("events-source", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  // Native Mapbox GL cluster layers — palette matches light/dark via updateClusterPaint()
  lmap.addLayer({
    id: "clusters",
    type: "circle",
    source: "events-source",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#FFCF33",
        10,
        "#E0A800",
        30,
        "#966A0A",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 10, 24, 30, 28],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-opacity": 0.95,
    },
  });

  lmap.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "events-source",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(0,0,0,0.15)",
      "text-halo-width": 1,
    },
  });
  updateClusterPaint();

  // Live-pulse ring: a WebGL circle rendered BEHIND the pin symbols, shown
  // ONLY for events whose status is "live" (happening right now). Non-live
  // pins get no ring. Radius/opacity are animated by the rAF loop in
  // updateLivePulse(); static event pins stay completely still.
  lmap.addLayer({
    id: "live-pulse",
    type: "circle",
    source: "events-source",
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "status"], "live"],
    ],
    paint: {
      "circle-color": ["get", "color"],
      "circle-opacity": 0,
      "circle-radius": 8,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.5,
    },
  });

  // Native WebGL symbol layer to render all individual event pins directly in WebGL
  lmap.addLayer({
    id: "unclustered-events",
    type: "symbol",
    source: "events-source",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": [
        "concat",
        ["case", ["==", ["get", "free"], true], "pin-free-", "pin-"],
        ["get", "category"],
      ],
      "icon-size": 1.0,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  // Click handler to open the single active HTML marker and details
  lmap.on("click", "unclustered-events", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["unclustered-events"],
    });
    if (!features.length) return;
    const evId = features[0].properties.id;
    removeHoverPopup();
    hidePinOverlay();
    openActiveEventMarker(evId);
  });
  lmap.on("mouseenter", "unclustered-events", () => {
    lmap.getCanvas().style.cursor = "pointer";
  });
  lmap.on("mouseleave", "unclustered-events", () => {
    lmap.getCanvas().style.cursor = "";
    removeHoverPopup();
    hidePinOverlay();
  });

  // Hover preview (pointer/mouse devices only — touch never fires mousemove
  // here) — shows the same info as the click popup, without the click's
  // lightning-beacon "selected" effect. Click still behaves exactly as
  // before; this is purely additive. The DOM overlay pin (same image as the
  // WebGL icon, see showPinOverlay) gives a real per-pin hover-grow bounce
  // that a WebGL layout property can't do on its own.
  lmap.on("mousemove", "unclustered-events", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["unclustered-events"],
    });
    if (!features.length) return;
    const evId = features[0].properties.id;
    if (evId === hoverPopupEventId || evId === activePopupEventId) return;
    removeHoverPopup();
    const ev = EVENTS.find((e2) => String(e2.id) === String(evId));
    if (!ev || ev.lon == null || ev.lat == null) return;
    showPinOverlay(ev);
    hoverPopup = new mapboxgl.Popup({
      offset: PIN_POPUP_OFFSET,
      closeButton: false,
      closeOnClick: false,
      className: "evtip-popup",
      anchor: "bottom",
      maxWidth: "240px",
    })
      .setLngLat([ev.lon, ev.lat])
      .setHTML(pinTooltipHtml(ev))
      .addTo(lmap);
    hoverPopupEventId = ev.id;
  });
  lmap.on("move", () => {
    if (_pinOverlayEvId != null) {
      const ev = EVENTS.find((e2) => String(e2.id) === String(_pinOverlayEvId));
      if (ev) positionPinOverlay([ev.lon, ev.lat]);
    }
  });

  // Cluster click → zoom in
  lmap.on("click", "clusters", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    if (!features.length) return;
    lmap
      .getSource("events-source")
      .getClusterExpansionZoom(
        features[0].properties.cluster_id,
        (err, zoom) => {
          if (!err)
            lmap.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom + 0.8,
            });
        },
      );
  });
  lmap.on("mouseenter", "clusters", () => {
    lmap.getCanvas().style.cursor = "pointer";
  });
  lmap.on("mouseleave", "clusters", () => {
    lmap.getCanvas().style.cursor = "";
  });

  lmap.on("click", (e) => {
    const hits = lmap.queryRenderedFeatures(e.point, {
      layers: ["clusters", "unclustered-events"],
    });
    if (!hits.length) removeActiveHtmlMarker();
  });

  // After each camera settle, fetch only the events within the new viewport.
  // The 300ms debounce means rapid pans generate exactly ONE RPC call when
  // the user stops, preventing Supabase spam and keeping bandwidth minimal.
  lmap.on("moveend", () => _debouncedFetchVisible());

  if (state.view === "browse") setTimeout(refreshMarkers, 0);
}

// ── Live-pulse animation ──────────────────────────────────────────────────
// Drives the "live-pulse" circle layer so pins for events happening RIGHT NOW
// breathe an outward ring. Only runs while at least one live event is on the
// map; stops entirely otherwise (no idle rAF burn). Honours reduced-motion by
// painting a single static ring instead of animating.
let _livePulseRAF = null;
function stopLivePulse() {
  if (_livePulseRAF) {
    cancelAnimationFrame(_livePulseRAF);
    _livePulseRAF = null;
  }
}
function updateLivePulse() {
  if (!lmap || !lmap.getLayer("live-pulse")) return;
  const hasLive = getFilteredEvents().some((ev) => eventStatus(ev) === "live");
  if (!hasLive) {
    stopLivePulse();
    return;
  }
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    stopLivePulse();
    try {
      lmap.setPaintProperty("live-pulse", "circle-radius", 15);
      lmap.setPaintProperty("live-pulse", "circle-stroke-opacity", 0.45);
    } catch (e) {}
    return;
  }
  if (_livePulseRAF) return; // already animating
  const PERIOD = 2200; // ms per breath
  function tick(ts) {
    if (!lmap || !lmap.getLayer("live-pulse")) {
      _livePulseRAF = null;
      return;
    }
    const t = (ts % PERIOD) / PERIOD; // 0 → 1
    const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic expansion
    try {
      lmap.setPaintProperty("live-pulse", "circle-radius", 9 + eased * 15);
      lmap.setPaintProperty("live-pulse", "circle-stroke-opacity", 0.55 * (1 - t));
    } catch (e) {}
    _livePulseRAF = requestAnimationFrame(tick);
  }
  _livePulseRAF = requestAnimationFrame(tick);
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
  src.setData(geo);
  bounceInPinLayer(geo.features);

  const visibleEvents = getFilteredEvents();
  updateMapEmptyState(visibleEvents.length);
  updateLivePulse();

  if (!lmapFitted && geo.features.length > 0) {
    const coords = geo.features.map((f) => f.geometry.coordinates);
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );
    lmap.fitBounds(bounds, {
      padding: { top: 120, bottom: 140, left: 40, right: 40 },
      maxZoom: 12,
    });
    lmapFitted = true;
  }
}

