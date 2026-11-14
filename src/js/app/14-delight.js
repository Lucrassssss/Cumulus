// ─── Delight: the small things that make Cumulus feel alive ───────────────
// Everything here is decorative and self-contained. Each effect:
//   • plays once where it matters (the Home "level load" once per visit),
//   • uses transform/opacity only (no layout thrash),
//   • is skipped entirely under prefers-reduced-motion.
const _reduceMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

// ── 1. Boot screen: loading tips + progress, then an iris-wipe reveal ─────
// (Game loading screens: a tip line and a bar that never lies about being
// "done" until the data really is.)
const BOOT_TIPS = [
  "Warming up London…",
  "Counting tonight's gigs…",
  "Checking who's on the decks…",
  "Finding you a good table…",
  "Mapping the good stuff…",
];
(function bootScreen() {
  const loader = document.getElementById("cumulus-loader");
  if (!loader) return;
  const tip = loader.querySelector(".boot-tip");
  const bar = loader.querySelector(".boot-bar i");
  let i = 0;
  let p = 0.08;
  const tick = () => {
    if (!document.getElementById("cumulus-loader") || loader.dataset.hiding) return;
    // ease toward 90% — the last 10% only fills when the app is ready
    p += (0.9 - p) * 0.08;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
    setTimeout(tick, 120);
  };
  tick();
  if (tip && !_reduceMotion())
    loader._tipTimer = setInterval(() => {
      i = (i + 1) % BOOT_TIPS.length;
      tip.classList.remove("in");
      void tip.offsetWidth;
      tip.textContent = BOOT_TIPS[i];
      tip.classList.add("in");
    }, 900);
})();

// Called by hideBootLoader(): bar to 100%, then the screen opens like an iris.
function bootReveal(loader) {
  clearInterval(loader._tipTimer);
  const bar = loader.querySelector(".boot-bar i");
  if (bar) bar.style.transform = "scaleX(1)";
  if (_reduceMotion() || !CSS.supports("mask-image", "radial-gradient(black, transparent)") && !CSS.supports("-webkit-mask-image", "radial-gradient(black, transparent)")) {
    loader.style.opacity = "0";
    return setTimeout(() => loader.remove(), 400);
  }
  setTimeout(() => loader.classList.add("iris"), 160);
  setTimeout(() => loader.remove(), 900);
}

// ── 2. Home "level load": the page assembles itself, once per visit ────────
// (A game HUD booting / Persona-style menus snapping in: the kicker types
// out, the headline rises like a title card, posters are dealt like cards,
// chips and rows snap into place, numbers count up.)
let _feedBootPlayed = false;
function delightFeedBoot(root) {
  if (_feedBootPlayed || _reduceMotion() || !root) return;
  _feedBootPlayed = true;
  const app = document.getElementById("app");
  // stagger indexes for groups
  const idx = (sel, max) =>
    root.querySelectorAll(sel).forEach((el, k) => k < max && el.style.setProperty("--bi", k));
  idx(".fp-card", 8);
  idx(".feed-sticky-filters .v-chip", 12);
  idx("#feed-results .fr-row", 8);
  const kicker = root.querySelector(".feed-kicker");
  if (kicker) kicker.style.setProperty("--chars", Math.max(8, (kicker.textContent || "").trim().length));
  app.classList.add("boot-play");
  root.querySelectorAll("[data-countup]").forEach((el) => countUp(el, 650, 420));
  setTimeout(() => {
    app.classList.remove("boot-play");
    if (window._quietPending) {
      window._quietPending = false;
      if (typeof renderViewQuiet === "function") renderViewQuiet();
    }
  }, 2300);
}

// Numbers tick up from zero (scoreboards, Wrapped-style stats).
function countUp(el, ms = 700, delay = 0) {
  const to = parseInt(el.textContent, 10);
  if (!to || _reduceMotion()) return;
  el.textContent = "0";
  setTimeout(() => {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, delay);
}

// ── 3. Save = a tiny confetti pop around the heart ─────────────────────────
function saveBurst(btn) {
  if (!btn || _reduceMotion()) return;
  const r = btn.getBoundingClientRect();
  if (!r.width) return;
  const wrap = document.createElement("div");
  wrap.className = "save-burst";
  wrap.style.left = `${r.left + r.width / 2}px`;
  wrap.style.top = `${r.top + r.height / 2}px`;
  const cols = ["var(--hot)", "var(--volt)", "var(--uv)", "#ffb547", "var(--hot)", "var(--volt)", "var(--uv)", "#5ee6ff"];
  wrap.innerHTML = cols
    .map((c, k) => {
      const a = (k / cols.length) * Math.PI * 2 + Math.random() * 0.4;
      const d = 18 + Math.random() * 10;
      return `<i style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;background:${c}"></i>`;
    })
    .join("");
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 700);
}

// ── 4. Holo tilt on posters (mouse/trackpad only) ──────────────────────────
// (Pokémon holo cards / Apple TV posters: the card leans toward the cursor
// and a soft sheen follows it.)
(function holoTilt() {
  if (!window.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let card = null;
  let raf = 0;
  let ev = null;
  const apply = () => {
    raf = 0;
    if (!card || !ev) return;
    const r = card.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--tilt-x", (-y).toFixed(3));
    card.style.setProperty("--tilt-y", x.toFixed(3));
    card.style.setProperty("--tilt-a", `${(Math.hypot(x, y) * 14).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const reset = (c) => {
    if (!c) return;
    c.classList.remove("tilting");
    ["--tilt-x", "--tilt-y", "--tilt-a"].forEach((p) => c.style.removeProperty(p));
  };
  document.addEventListener(
    "pointermove",
    (e) => {
      if (_reduceMotion()) return;
      const c = e.target.closest && e.target.closest(".fp-card");
      if (c !== card) {
        reset(card);
        card = c;
        if (card) card.classList.add("tilting");
      }
      ev = e;
      if (card && !raf) raf = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => (reset(card), (card = null)), { passive: true });
})();

// ── 5. The orb easter egg ──────────────────────────────────────────────────
// Tap the little Cumulus orb: it spins. Keep going and it gets excited.
let _orbTaps = [];
document.addEventListener("click", (e) => {
  const mark = e.target.closest && e.target.closest(".feed-mark");
  if (!mark) return;
  e.stopPropagation(); // the orb is a toy, not the "back to top" button
  const now = Date.now();
  _orbTaps = _orbTaps.filter((t) => now - t < 2500).concat(now);
  mark.classList.remove("spin", "party");
  void mark.offsetWidth;
  if (_orbTaps.length >= 5) {
    _orbTaps = [];
    mark.classList.add("party");
    saveBurst(mark);
    setTimeout(() => saveBurst(mark), 140);
    showToast("You found the orb. It likes you.", "success");
  } else mark.classList.add("spin");
}, true);

// ── 6. Opening an event: the poster jumps in, the ticket tears off ────────
// (Shared-element transitions in iOS / Material.) The event page's main
// button is a ticket (ticketButtonHtml in 09). When you open an event by
// tapping its poster, that ticket flies out of the poster, hovers over the
// buy bar, then presses down into place with a glint. The page itself just
// appears underneath, once. Deep links and Back show it already in place.
const JUMP_SOURCES = [
  [".fr-row", ".fr-thumb"],
  [".fp-card", ".poster"],
  [".mcard", ".mcard-art"],
  [".up-next", ".un-art"],
];
let _evJump = null;
document.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest || e.target.closest(".save-btn, .v-btn, button:not(.fr-row):not(.mcard)")) return;
    for (const [card, art] of JUMP_SOURCES) {
      const c = e.target.closest(card);
      if (!c) continue;
      const a = c.querySelector(art) || c;
      const r = a.getBoundingClientRect();
      if (r.width < 20) return;
      _evJump = { r, t: performance.now() };
      return;
    }
  },
  true,
);

function _endEvJump() {
  document.getElementById("app")?.classList.remove("ev-jump");
  if (window._quietPending) {
    window._quietPending = false;
    if (typeof renderViewQuiet === "function") renderViewQuiet();
  }
}

function delightEventJump(container) {
  const src = _evJump;
  _evJump = null;
  const app = document.getElementById("app");
  if (!src || performance.now() - src.t > 900 || _reduceMotion()) return;
  if (app.classList.contains("same-view") || app.classList.contains("nav-back")) return;
  const btn = container.querySelector(".ev-buybar .tk-btn");
  if (!btn) return;
  app.classList.add("ev-jump");
  container.querySelector(".ev-page")?.classList.add("jumped");
  // measure after openEvent()'s scroll-to-top has happened
  requestAnimationFrame(() => {
    if (!btn.isConnected) return _endEvJump();
    const R = btn.getBoundingClientRect();
    // A twin flies above everything (the buy bar's blur would trap a fixed
    // child); the real button waits invisibly in place, so nothing shifts.
    const ghost = btn.cloneNode(true);
    ghost.removeAttribute("onclick");
    ghost.classList.add("tk-btn-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.tabIndex = -1;
    ghost.style.cssText = `left:${R.left}px;top:${R.top}px;width:${R.width}px;height:${R.height}px;`;
    document.body.appendChild(ghost);
    btn.classList.add("tk-btn-wait");
    // start as the tapped poster: same centre, scaled to its width
    const s0 = Math.max(src.r.width / R.width, 0.15);
    const dx = src.r.left + src.r.width / 2 - (R.left + R.width / 2);
    const dy = src.r.top + src.r.height / 2 - (R.top + R.height / 2);
    const fly = ghost.animate(
      [
        { translate: `${dx}px ${dy}px`, scale: s0, rotate: "0deg", boxShadow: "0 0 0 rgba(0,0,0,0)" },
        { translate: `${dx * 0.9}px ${dy * 0.9 - 14}px`, scale: s0 * 1.1, rotate: "-4deg", boxShadow: "0 14px 26px rgba(0,0,0,.3)", offset: 0.14 },
        { translate: "0px -26px", scale: 1.06, rotate: "-3deg", boxShadow: "0 30px 40px rgba(0,0,0,.4)", offset: 0.64 },
        { translate: "0px 0px", scale: 0.97, rotate: "0deg", boxShadow: "0 1px 2px rgba(0,0,0,.4)", offset: 0.86 },
        { translate: "0px 0px", scale: 1, rotate: "0deg", boxShadow: "0 0 0 rgba(0,0,0,0)" },
      ],
      { duration: 640, easing: "cubic-bezier(.33,.7,.22,1)" },
    );
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      btn.classList.remove("tk-btn-wait");
      btn.classList.add("shine");
      ghost.remove();
      setTimeout(_endEvJump, 120);
    };
    fly.onfinish = land;
    fly.oncancel = land;
  });
}

// A spray-painted stroke under a heading's last word ("Tonight in London").
function sprayLastWord(text) {
  const t = String(text || "").trim();
  const i = t.lastIndexOf(" ");
  if (i < 0) return `<span class="spray-word">${escapeHtml(t)}</span>`;
  return `${escapeHtml(t.slice(0, i))} <span class="spray-word">${escapeHtml(t.slice(i + 1))}</span>`;
}

// ── Street wall: the spray-paint layer behind every page ──────────────────
// (Brand: Cumulus = a cloud, so the tag is a dripping spray-painted cloud.)
// One fixed SVG behind everything (z-index -1, never catches a tap), hidden
// on the map. It paints itself in once per visit — mist first, then the tag
// is drawn, drips run, the stencil and doodles land — and drifts a touch as
// you scroll. Seeded, so the wall looks the same every visit.
function _rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
function streetWallSvg() {
  const r = _rng(1337);
  // overspray: speckles clustered around each painted area
  const speck = (cx, cy, spread, n, cls) =>
    Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * spread;
      return `<circle class="${cls}" cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d * 0.8).toFixed(1)}" r="${(0.5 + r() * 2.2).toFixed(2)}"/>`;
    }).join("");
  const drip = (x, y, len, cls, delay) =>
    `<g class="sw-drip ${cls}" style="--dl:${delay}s"><path d="M${x} ${y}v${len}"/><circle cx="${x}" cy="${y + len}" r="4.6"/><circle class="sw-drop" cx="${x}" cy="${y + len + 6}" r="3.4"/></g>`;
  return `<svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <filter id="sw-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>
      <filter id="sw-mist" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>
    </defs>
    <g class="sw-mists">
      <ellipse class="sw-m sw-a" cx="1010" cy="170" rx="230" ry="150"/>
      <ellipse class="sw-m sw-b" cx="150" cy="760" rx="260" ry="160"/>
      <ellipse class="sw-m sw-c" cx="640" cy="470" rx="180" ry="120"/>
    </g>
    <g class="sw-speck">${speck(1000, 170, 230, 140, "sw-a")}${speck(160, 750, 250, 120, "sw-b")}${speck(640, 470, 200, 50, "sw-c")}</g>
    <g class="sw-tag" filter="url(#sw-rough)">
      <path class="sw-line sw-a" pathLength="1" d="M880 250c-46 0-70-34-58-66 10-28 44-40 70-28 6-44 52-70 94-58 30 8 50 32 54 58 34-12 70 10 74 44 4 34-22 54-52 54H880z"/>
      ${drip(918, 252, 46, "sw-a", 1.3)}${drip(1004, 252, 74, "sw-a", 1.45)}${drip(1072, 252, 30, "sw-a", 1.6)}
      <path class="sw-line sw-b sw-thin" pathLength="1" d="M846 120l10 18 20-4-14 15 9 18-18-9-15 14 3-20-18-9 20-4z"/>
    </g>
    <g class="sw-stencil" filter="url(#sw-rough)" transform="rotate(-8 190 700)">
      <text x="40" y="760" class="sw-b">LDN</text>
      ${drip(108, 770, 40, "sw-b", 2)}${drip(232, 770, 64, "sw-b", 2.15)}
    </g>
    <g class="sw-doodles" filter="url(#sw-rough)">
      <path class="sw-line sw-c sw-thin" pathLength="1" d="M520 120q30-40 60 0t60 0 60 0"/>
      <path class="sw-line sw-a sw-thin" pathLength="1" d="M70 150l40 40m0-40l-40 40"/>
      <path class="sw-line sw-b sw-thin" pathLength="1" d="M1080 600l14 24 26 4-19 18 5 26-26-13-24 13 5-26-19-18 26-4z"/>
      <path class="sw-line sw-c sw-thin" pathLength="1" d="M300 300c40-24 80 24 120 0s80 24 120 0"/>
      <text x="760" y="860" class="sw-word sw-c" transform="rotate(4 760 860)">TONIGHT</text>
    </g>
  </svg>`;
}
(function streetWall() {
  if (document.getElementById("street-wall")) return;
  const wall = document.createElement("div");
  wall.id = "street-wall";
  wall.innerHTML = streetWallSvg();
  document.body.insertBefore(wall, document.body.firstChild);
  let played = false;
  try {
    played = sessionStorage.getItem("cu_wall") === "1";
    sessionStorage.setItem("cu_wall", "1");
  } catch (e) {}
  if (!played && !_reduceMotion()) wall.classList.add("paint");
  else wall.classList.add("painted");
  // gentle parallax: the wall drifts a little slower than the page
  if (_reduceMotion()) return;
  let raf = 0;
  addEventListener(
    "scroll",
    () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        wall.style.setProperty("--sy", `${Math.min(scrollY, 4000) * -0.06}px`);
      });
    },
    { passive: true },
  );
})();

// ── Boot ──────────────────────────────────────────────────────────────────
// Lives in the LAST app script so every function start() can reach is
// already defined. Never let an unexpected rejection leave a blank screen.
start().catch((e) => {
  console.error("[cumulus] boot failed", e);
  try {
    enterGuestBrowse();
  } catch (_) {}
});
