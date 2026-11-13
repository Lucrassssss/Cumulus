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
// (Shared-element transitions in iOS / Material, crossed with slapping a
// sticker on a poster.) Every event page carries a small ticket sticker on
// its poster. When you open an event by tapping its poster, that sticker
// is what flies: it lifts off the list, hovers over its spot, then presses
// down and settles at its slight angle with a glint. The page itself just
// appears underneath, once, with no staged rebuild. Deep links and Back
// show the sticker already in place.
const JUMP_SOURCES = [
  [".fr-row", ".fr-thumb"],
  [".fp-card", ".poster"],
  [".mcard", ".mcard-art"],
  [".up-next", ".un-art"],
  [".event-list-card", ".elc-img"],
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

// The ticket sticker on an event page's poster: a whole ticket (art,
// notched perforation, stub) with a die-cut white edge. Rendered by
// renderDetail(); decorative for now, built to be reused.
function eventStickerHtml(ev) {
  const d = new Date(ev.startsAt);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
  const no = String((_posterSeed(ev.id) % 900) + 100);
  return `<div class="ev-stk" aria-hidden="true"><div class="ev-stk-cut"><div class="ev-stk-tk">
      <div class="ev-stk-art ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}<span class="ev-stk-date">${escapeHtml(day)}</span></div>
      <div class="ev-stk-perf"></div>
      <div class="ev-stk-stub"><b>${escapeHtml(ev.title)}</b><span>${feedPriceLabel(ev)} · No.${no}</span></div>
    </div></div></div>`;
}

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
  const stk = container.querySelector(".ev-stk");
  if (!stk) return;
  app.classList.add("ev-jump");
  container.querySelector(".ev-page")?.classList.add("jumped");
  // measure after openEvent()'s scroll-to-top has happened
  requestAnimationFrame(() => {
    if (!stk.isConnected) return _endEvJump();
    const R = stk.getBoundingClientRect(); // rotated box; its centre is the true centre
    const w = stk.offsetWidth;
    const h = stk.offsetHeight;
    const cx = R.left + R.width / 2;
    const cy = R.top + R.height / 2;
    // Fly above the page (the hero clips its children), then go home.
    const home = stk.parentNode;
    const next = stk.nextSibling;
    stk.style.cssText = `position:fixed;left:${cx - w / 2}px;top:${cy - h / 2}px;right:auto;bottom:auto;width:${w}px;z-index:950;`;
    document.body.appendChild(stk);
    const s0 = Math.max(src.r.width / w, 0.2);
    const dx = src.r.left + src.r.width / 2 - cx;
    const dy = src.r.top + src.r.height / 2 - cy;
    const rest = getComputedStyle(stk).rotate;
    const fly = stk.animate(
      [
        { translate: `${dx}px ${dy}px`, scale: s0, rotate: "0deg", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0))" },
        { translate: `${dx * 0.92}px ${dy * 0.92 - 16}px`, scale: s0 * 1.08, rotate: "3deg", filter: "drop-shadow(0 14px 16px rgba(0,0,0,.3))", offset: 0.12 },
        { translate: "0px -20px", scale: 1.18, rotate: "-13deg", filter: "drop-shadow(0 30px 24px rgba(0,0,0,.32))", offset: 0.62 },
        { translate: "0px 0px", scale: 0.95, rotate: "-5deg", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))", offset: 0.84 },
        { translate: "0px 0px", scale: 1, rotate: rest === "none" ? "0deg" : rest, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.35))" },
      ],
      { duration: 640, easing: "cubic-bezier(.33,.7,.22,1)" },
    );
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      stk.style.cssText = "";
      if (home && home.isConnected) {
        home.insertBefore(stk, next && next.parentNode === home ? next : null);
        stk.classList.add("shine");
      } else stk.remove();
      setTimeout(_endEvJump, 120);
    };
    fly.onfinish = land;
    fly.oncancel = land;
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────
// Lives in the LAST app script so every function start() can reach is
// already defined. Never let an unexpected rejection leave a blank screen.
start().catch((e) => {
  console.error("[cumulus] boot failed", e);
  try {
    enterGuestBrowse();
  } catch (_) {}
});
