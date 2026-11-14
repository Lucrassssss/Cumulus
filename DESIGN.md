---
name: Odd Flock
description: London events app — "Afterglow" system (v2, Nov 2026)
colors:
  volt: "#d4ff3f"
  volt-ink: "#0b0d02"
  uv: "#8b5cff"
  hot: "#ff3d6e"
  bg-dark: "#08080a"
  surface-dark: "#121215"
  surface-2-dark: "#1c1c21"
  text-dark: "#f6f5f1"
  muted-dark: "#8c8a96"
  bg-light: "#f3f1ec"
  surface-light: "#ffffff"
  text-light: "#0b0b0d"
  accent-text-light: "#4d6b00"
typography:
  display: "Bricolage Grotesque 800, wdth 78–82, tracking -0.045em"
  body: "Inter 400–750"
  mono: "JetBrains Mono 500–700 (dates, prices, codes, kickers)"
rounded:
  sm: "12px"
  md: "18px"
  lg: "26px"
  xl: "34px"
  pill: "999px"
---

# Design System: Odd Flock (formerly Cumulus) v2 — "Afterglow"

## Brand mark

Three penguins standing close: two emperors (one head bowed, one tall) and a
rockhopper turned in to face them. Flat silhouettes in a linocut style; the
only colour is the yellow (Volt) on the emperors' neck patches and the
rockhopper's crest. In the app it's `BRAND_MARK` (`01-constants.js`):
`currentColor` paints the birds, `--hm-cut` the gaps between them (set it to
whatever sits behind), `--hm-patch` the yellow. App icons and the share image
in `assets/` are rendered from the same drawing.

**Source of truth:** `src/css/v2.css` (loaded after `styles.css`; redefines every
token the legacy cascade reads, then restyles each surface). The v1
"Parchment & Gold" notes further down are kept for history only.

**North star:** a black-glass night-out app that looks like a wall of gig
posters. Three moves make it recognisable:

1. **Generated posters.** Every event without a photo gets a deterministic
   mesh-gradient poster from its category palette (`POSTER_PALETTES` in
   `13-discover-feed.js`) plus film grain and a giant glyph. No grey placeholders, ever.
2. **Huge condensed type.** Page titles and event names are Bricolage
   Grotesque 800 at 44–92px with tight tracking. Labels, dates and prices are
   JetBrains Mono caps.
3. **One electric accent — Volt (`#d4ff3f`).** At night it fills CTAs (ink text).
   By day Volt can't carry text on paper, so CTAs flip to ink fill + volt text
   (`--cta-bg`/`--cta-fg`) and accent *text* becomes olive `#4d6b00`. `--hot`
   (`#ff3d6e`) is reserved for LIVE / scarcity; `--uv` only appears inside
   gradients.

**Layout rules:** Discover feed is home (not the map). Bottom nav is a
floating glass pill; the active tab is a filled CTA pill. The event page
hides the dock and owns the bottom edge with a sticky price + CTA bar.
Everything is a pill or a 26px card — no square buttons.

**Day/night** still follows London time (themes swap tokens only).

**Map:** Mapbox Standard, default (full-colour) theme — the basemap is left
as-is; don't switch it to `monochrome`/`faded`. Pins
are "wheatpaste" posters — the event's poster on a white sticker border,
tilted ±6°, with a tail on the venue (`06-map-pins-cards.js`). Clustering is
the GeoJSON source's Supercluster (`clusterRadius 48`, `clusterMaxZoom 14`,
`clusterProperties` for event + live totals); rendering is DOM markers diffed
per frame for real CSS motion. Clusters are a fanned stack of their real
posters + a Volt count; same-venue events merge into one pin with a count and
open a swipeable card sheet. Zoom LOD: `z-far` dots → `z-mid` tiles →
`z-near` tiles + time/price label. Live = `--hot` ring + LIVE tag.


<!-- ── v1 (superseded) ─────────────────────────────── -->


# v1 Design System (superseded): Cumulus

## 1. Overview

**Creative North Star: "The Parchment & Gold Rule"**

Cumulus reads as a warm, sun-worn sheet of city paper with a live wire of gold running through it. By day, the surface is a soft parchment cream (`#eceae4`) and the gold is a rich, saturated amber (`#c08a00`) — vivid enough to pop off the paper without breaking contrast. By night — driven by actual London time, not a manual toggle — the surface flips to a near-black sky (`#0d0e10`) and the gold turns electric (`#ffcf33`), a thunderstorm-yellow that glows against the dark the way the muted daytime version never could. The interface is meant to feel like a physical object tied to the city outside the user's window, never a dashboard.

This system explicitly rejects generic corporate SaaS chrome (dashboard-blue, stock icons, enterprise panels) and try-hard nightlife/club-app energy (neon, aggressive gradients). Gold is the one accent color and it is used sparingly and consistently across both themes — it never competes with a second bright hue.

**Key Characteristics:**
- One accent (gold/ochre) carries identity across both light and dark themes; it is never joined by a second saturated hue.
- Day/night is real, driven by time-of-day, not user preference — the theme itself is part of the product's honesty about place and time.
- Buttons and cards are tactile and inviting: they lift, shine, and respond to touch rather than sitting flat and inert.
- Shadows are soft, diffuse, and ambient — they bloom on interaction, not at rest.

## 2. Colors

A warm neutral parchment paired with a single gold accent that survives the day/night flip; no secondary or tertiary hue is introduced.

### Primary
- **Parchment Gold** (`#c08a00` light / `#ffcf33` dark): the one accent — buttons, links, active states, borders on emphasis, and the ambient glow behind the Host/Account/Admin tabs. Saturated enough to pop rather than sit quietly, but still one thread, not a second color; it never becomes a background fill. Vivid yellow physically cannot hold contrast against a light parchment page (yellow is inherently a high-luminance hue), so the light-mode value is pushed as rich/saturated as the cream background allows without failing the 3:1 UI-component floor; the dark-mode value has the contrast headroom to go genuinely electric against the near-black sky, which is where this system's "pop" reads loudest.

### Neutral
- **Parchment Cream** (`#eceae4` / dark: `#0d0e10`): the app background — the "paper" the whole interface sits on.
- **Card Parchment** (`#f7f6f2` / dark: `#16181b`): surface color for cards, panels, and the nav — one step lighter (day) / one step up (night) from the base background.
- **Ink** (`#191a1c` / dark: `#ece9e1`): primary text.
- **Soft Ink** (`#45474c` / dark: `#b4b0a7`): secondary text, sub-labels.
- **Muted Ink** (`#6a6862` / dark: `#88857c`): tertiary text, timestamps, meta.
- **Silver** (`#7e848c` / dark: `#c6cad1`): a secondary neutral accent used sparingly alongside gold for icons or muted UI chrome that shouldn't compete with the gold accent.

### Marketing Hero Sky & Diorama
The landing-page hero's sky (`--hero-sky`) and London-skyline diorama (`--dio-back/-front/-front-2/-chimney/-face`) are built from the same warm parchment/ink family as the rest of the system, not a separate palette — light mode is a warm cream-to-gold haze ending exactly at `--bg` so it blends into the page below; dark mode is near-black with gold-lit windows (`--dio-win`). Never reintroduce a blue/cool-toned sky or skyline — that reads as generic stock-SaaS hero art and breaks the One Thread Rule.

### Named Rules
**The One Thread Rule.** Gold is the only accent color in the system. It appears consistently across both day and night themes so the identity never breaks when the sky changes — silver and grays support it, they never replace it.

## 3. Typography

**Display Font:** DM Sans (with Inter, system sans fallback)
**Body Font:** Inter (variable, with optical sizing) (with system sans fallback)
**Label/Mono Font:** DM Mono (with SFMono-Regular, Consolas fallback)

**Character:** DM Sans carries the confident, slightly geometric display voice (headings, buttons, nav), while Inter's variable optical sizing keeps body copy warm and readable at any size — the pairing feels friendly and current, never corporate.

### Hierarchy
- **Display** (700, DM Sans): event titles, hero headings, primary CTAs.
- **Body** (400, Inter): descriptions, list content, general copy.
- **Label/Mono** (400–500, DM Mono): timestamps, codes (e.g. squad ticket claim codes), technical or data-like fragments where a monospace read adds precision.

## 4. Elevation

Soft ambient lift, flat at rest. Surfaces sit quietly at rest with no resting shadow; elevation appears only as a response to interaction (hover, focus), expressed as multi-layer, low-opacity shadow blooms rather than a single hard drop shadow.

### Shadow Vocabulary
- **Card at rest** (`box-shadow: none` / relies on surface-color contrast): cards don't carry a resting shadow; separation comes from the parchment/card-surface tone shift.
- **Card hover** (`0 8px 28px var(--shadow)` plus `translateY(-3px)`): the card physically lifts toward the user.
- **Elevated stack** (`0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.06), 0 16px 40px rgba(0,0,0,.05)`): used for prominent hover/expanded states — three soft, wide layers rather than one tight shadow.
- **Button glow** (`0 2px 8px rgba(0,0,0,.14), 0 6px 20px rgba(0,0,0,.1)`): the primary-button shadow, paired with a gold-tinted glow on hover.

### Named Rules
**The Flat-By-Default Rule.** Nothing casts a shadow at rest. Depth is earned only through interaction — a hover, a press, a focus ring — never sitting there unprompted.

## 5. Components

Tactile and inviting: buttons and cards are built to feel physically responsive — they lift, catch light, and shine on touch, never flat or purely graphic.

### Buttons
- **Shape:** full pill (`border-radius: 999px`)
- **Primary:** gold gradient background (`linear-gradient(135deg, var(--accent), var(--accent-deep))`), dark ink text (`#0a0a0a`) for contrast against gold, bold DM Sans (700, 14px), padding `11px 24px`.
- **Hover / Focus:** a diagonal light-sweep animation crosses the button (`background-position` shift on a semi-transparent gradient overlay) alongside a soft gold-tinted shadow bloom; a brief ripple effect on press reinforces the tactile feel.
- **Secondary / Ghost:** `.btn-outline` and `.btn-text` variants drop the gold fill in favor of a gold border or bare gold text, for lower-emphasis actions.

### Cards
- **Corner Style:** 14–20px radius (`--radius-card: 20px`, event cards at 14px).
- **Background:** card-surface neutral (`--surface`), one tone lifted from the page background.
- **Shadow Strategy:** flat at rest; on hover, lifts `-3px` with a soft ambient shadow bloom (see Elevation).
- **Border:** none by default; gold border reserved for active/selected/emphasis states.

### Navigation
- Fixed nav bar (`--nav-h: 72px`), respects safe-area insets on mobile (notch/home-indicator aware). Uses the display font for wayfinding labels; gold marks the active/current state.

### Map & Live Indicator (signature component)
The map is the product, not chrome around it. A "Live" pulse indicator (dot + label) marks real-time event activity directly on the map caption bar, reinforcing that pins represent things happening now, in this city, not a static listing. The marketing hero echoes this directly: instead of decorative-only trust badges, it shows small pin-style cards (`.lp-hero-pin`) styled like real map-tooltip popups (`.evtip-inner`), so the hero previews the actual product rather than generic illustration alone.

### Icons
Stroke-based, Phosphor-style line icons only (`fill:none`, `stroke:currentColor`, `stroke-width:1.75`, rounded caps/joins) — never filled Material-style glyphs, and never emoji for structural/navigational icons (nav tabs, filter chips). Decorative/personality copy (perk list, host-teaser flourishes) may still use emoji sparingly where it reads as product voice rather than UI chrome.

## 6. Do's and Don'ts

### Do:
- **Do** keep gold as the single accent across both light and dark themes — it is the one thread that survives the day/night flip.
- **Do** use soft, multi-layer, low-opacity shadows for any hover/elevation state; never a single hard drop shadow.
- **Do** let buttons and cards feel physically responsive (lift, shine, ripple) on interaction — this system is tactile and inviting, not flat-minimalist.
- **Do** keep every event pin and event detail fully visible and bookable to everyone — no invite code, curator gate, or unlock step ever stands between a user and the map.

### Don't:
- **Don't** introduce a second saturated accent color alongside gold — no dashboard-blue, no neon, no competing hue.
- **Don't** use generic corporate SaaS chrome: stock icons, enterprise dashboard panels, flat gray "tool" aesthetics.
- **Don't** reach for nightlife/club-app energy — no neon glows, no aggressive gradients — and no "secret club" / invite-only framing anywhere; keep it warm and open, not flashy or exclusive.
- **Don't** give cards or surfaces a resting shadow. Depth is earned by interaction, not sitting there by default.
- **Don't** use `border-left`/`border-right` colored stripes as an accent treatment anywhere in the system.
