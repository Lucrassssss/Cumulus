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

// ── Boot ──────────────────────────────────────────────────────────────────
// Lives in the LAST app script so every function start() can reach is
// already defined. Never let an unexpected rejection leave a blank screen.
start().catch((e) => {
  console.error("[cumulus] boot failed", e);
  try {
    enterGuestBrowse();
  } catch (_) {}
});
