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
// (Shared-element transitions in iOS / Material, plus a real ticket being
// laid on a table and torn.) The poster you tapped lifts off the list,
// prints out into a ticket — the same art + perforation + stub look as the
// wallet — and lays itself onto the page with its perforation on the seam
// between the hero and the details. Then it tears: the art half becomes
// the hero (or, on desktop with a photo, the flyer slot), the stub drops
// into the details, the rest deals in and the buy bar slides up last.
// Without a tapped poster (deep link, Back) the page uses its ordinary
// drop-in.
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

// A pre-purchase ticket for an event, in the wallet's ticket style
// (.tk / .tk-art / .tk-perf / .tk-stub). Used by the jump-in; kept separate
// so other screens can lay the same ticket down.
function eventTicketHtml(ev, { extraClass = "" } = {}) {
  const d = new Date(ev.startsAt);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const no = String((_posterSeed(ev.id) % 900) + 100);
  return `<div class="tk ev-tk ${extraClass}" aria-hidden="true">
    <div class="tk-art ${posterClass(ev)}" style="${posterStyle(ev)}">
      ${posterGlyph(ev)}
      <div class="tk-art-foot">
        <span class="fp-date">${feedDateLabel(ev)} · ${feedTimeLabel(ev)}</span>
        <h3 class="tk-title">${escapeHtml(ev.title)}</h3>
        <div class="tk-venue">${escapeHtml(ev.venue || "")}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
      </div>
    </div>
    <div class="tk-perf"></div>
    <div class="tk-stub">
      <div class="tk-row">
        <div><span class="tk-lbl">Admit one</span><b>${escapeHtml(day)}</b></div>
        <div><span class="tk-lbl">From</span><b>${feedPriceLabel(ev)}</b></div>
        <div><span class="tk-lbl">No.</span><b class="mono">${no}</b></div>
      </div>
    </div>
  </div>`;
}

function delightEventJump(container) {
  const src = _evJump;
  _evJump = null;
  const app = document.getElementById("app");
  if (!src || performance.now() - src.t > 900 || _reduceMotion()) return;
  if (app.classList.contains("same-view") || app.classList.contains("nav-back")) return;
  const hero = container.querySelector(".ev-hero");
  const facts = container.querySelector(".ev-facts");
  const ev = EVENTS.find((e) => String(e.id) === String(state.selectedEventId));
  if (!hero || !facts || !ev) return;
  app.classList.add("ev-jump");
  // measure after openEvent()'s scroll-to-top has happened
  requestAnimationFrame(() => {
    const H = hero.getBoundingClientRect();
    const desk = innerWidth >= 761;
    const img = hero.style.getPropertyValue("--p-img");
    // Where the ticket's art half rests, and what it turns into after the tear.
    let rest, artTo;
    if (desk) {
      // The flyer slot on the right of the wide banner (.ev-hero.has-photo in v2.css).
      const h = H.height - 104;
      let ratio = 0.8;
      if (img) {
        const probe = new Image();
        probe.src = (img.match(/url\(["']?([^"')]+)/) || [])[1] || "";
        if (probe.naturalWidth && probe.naturalHeight) ratio = probe.naturalWidth / probe.naturalHeight;
      }
      const w = Math.max(240, h * ratio);
      rest = { left: H.right - 28 - w, top: H.top + 76, width: w, artH: h };
      artTo = img ? { left: rest.left, top: rest.top, width: w, height: h } : H;
    } else {
      const F = facts.getBoundingClientRect();
      const artH = Math.min(F.width * 1.02, H.height * 0.62);
      // perforation on the hero/details seam, but never so low the stub is off-screen
      const seam = Math.min(H.bottom, innerHeight - 150);
      rest = { left: F.left, top: seam - artH, width: F.width, artH };
      artTo = H;
    }

    const wrap = document.createElement("div");
    wrap.innerHTML = eventTicketHtml(ev, { extraClass: "ev-ghost" + (desk ? " is-desk" : "") });
    const ghost = wrap.firstElementChild;
    ghost.style.cssText = `left:${rest.left}px;top:${rest.top}px;width:${rest.width}px;--art-h:${rest.artH}px;`;
    document.body.appendChild(ghost);
    const artEl = ghost.querySelector(".tk-art");
    const stubH = ghost.offsetHeight - rest.artH;

    // FLIP: start as the tapped poster (art only, scaled to its width), end at rest.
    const s = src.r.width / rest.width;
    const dx = src.r.left - rest.left;
    const dy = src.r.top - rest.top;
    const clipArt = `inset(0 0 ${stubH}px 0 round ${12 / s}px)`;
    const clipAll = "inset(0 0 0 0 round 18px)";
    const fly = ghost.animate(
      [
        { transform: `translate(${dx}px,${dy}px) scale(${s})`, clipPath: clipArt, boxShadow: "0 0 0 rgba(0,0,0,0)" },
        { transform: `translate(${dx}px,${dy - 10}px) scale(${s * 1.08}) rotate(-3deg)`, clipPath: clipArt, boxShadow: "0 18px 40px rgba(0,0,0,.4)", offset: 0.14 },
        { transform: "translate(0,-18px) scale(1.04) rotate(1.5deg)", clipPath: clipAll, boxShadow: "0 40px 70px rgba(0,0,0,.5)", offset: 0.7 },
        { transform: "translate(0,0) scale(.985) rotate(0deg)", clipPath: clipAll, boxShadow: "0 6px 14px rgba(0,0,0,.35)", offset: 0.88 },
        { transform: "none", clipPath: clipAll, boxShadow: "0 10px 26px rgba(0,0,0,.3)" },
      ],
      { duration: 640, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" },
    );

    let done = false;
    const tear = () => {
      if (done) return;
      done = true;
      app.classList.add("ev-split");
      ghost.classList.add("torn");
      hero.insertAdjacentHTML("beforeend", '<i class="ev-perf" aria-hidden="true"></i>');
      const A = artEl.getBoundingClientRect();
      // art half grows (uniformly, centre to centre) into what it becomes and
      // dissolves into the real page; its caption goes first so text never doubles
      const k = Math.max(artTo.width / A.width, artTo.height / A.height);
      const tx = artTo.left + artTo.width / 2 - (A.left + (A.width * k) / 2);
      const ty = artTo.top + artTo.height / 2 - (A.top + (A.height * k) / 2);
      ghost.querySelector(".tk-art-foot")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, fill: "forwards" });
      artEl.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translate(${tx}px,${ty}px) scale(${k})`, opacity: 0 },
        ],
        { duration: 340, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" },
      );
      // stub tears off and drops into the details
      ghost.querySelectorAll(".tk-perf, .tk-stub").forEach((n) =>
        n.animate(
          [
            { translate: "0 0", rotate: "0deg", opacity: 1 },
            { translate: "6px 26px", rotate: "2.5deg", opacity: 0 },
          ],
          { duration: 320, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" },
        ),
      );
      ghost.animate([{ boxShadow: "0 10px 26px rgba(0,0,0,.3)" }, { boxShadow: "0 0 0 rgba(0,0,0,0)" }], { duration: 200, fill: "forwards" });
      setTimeout(() => ghost.remove(), 420);
      setTimeout(() => {
        app.classList.remove("ev-jump", "ev-split");
        hero.querySelector(".ev-perf")?.remove();
      }, 1400);
    };
    fly.onfinish = tear;
    fly.oncancel = tear;
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
