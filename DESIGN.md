---
name: Cumulus
description: London community-events PWA — a live map of your city's community
colors:
  bg: "#eceae4"
  bg-2: "#e1ded6"
  surface: "#f7f6f2"
  surface-2: "#ebe8e1"
  text: "#191a1c"
  text-soft: "#45474c"
  text-muted: "#6a6862"
  accent: "#c08a00"
  accent-deep: "#966a0a"
  gold: "#c08a00"
  gold-text: "#7a5900"
  silver: "#7e848c"
  silver-deep: "#5e636b"
  bg-dark: "#0d0e10"
  bg-2-dark: "#08090a"
  surface-dark: "#16181b"
  surface-2-dark: "#1f2226"
  text-dark: "#ece9e1"
  text-soft-dark: "#b4b0a7"
  text-muted-dark: "#88857c"
  accent-dark: "#ffcf33"
  accent-deep-dark: "#e0a800"
typography:
  display:
    fontFamily: "DM Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "DM Mono, SFMono-Regular, Consolas, monospace"
rounded:
  sm: "12px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  card: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.accent} 0%, {colors.accent-deep} 100%)"
    textColor: "#0a0a0a"
    rounded: "{rounded.pill}"
    padding: "11px 24px"
  event-card:
    backgroundColor: "{colors.surface}"
    rounded: "14px"
---

# Design System: Cumulus

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
- **Parchment Gold** (`#c08a00` light / `#ffcf33` dark): the one accent — buttons, links, active states, borders on emphasis, and the ambient glow behind the Social/Calendar/Profile tabs. Saturated enough to pop rather than sit quietly, but still one thread, not a second color; it never becomes a background fill. Vivid yellow physically cannot hold contrast against a light parchment page (yellow is inherently a high-luminance hue), so the light-mode value is pushed as rich/saturated as the cream background allows without failing the 3:1 UI-component floor; the dark-mode value has the contrast headroom to go genuinely electric against the near-black sky, which is where this system's "pop" reads loudest.

### Neutral
- **Parchment Cream** (`#eceae4` / dark: `#0d0e10`): the app background — the "paper" the whole interface sits on.
- **Card Parchment** (`#f7f6f2` / dark: `#16181b`): surface color for cards, panels, and the nav — one step lighter (day) / one step up (night) from the base background.
- **Ink** (`#191a1c` / dark: `#ece9e1`): primary text.
- **Soft Ink** (`#45474c` / dark: `#b4b0a7`): secondary text, sub-labels.
- **Muted Ink** (`#6a6862` / dark: `#88857c`): tertiary text, timestamps, meta.
- **Silver** (`#7e848c` / dark: `#c6cad1`): a secondary neutral accent used sparingly alongside gold for icons or muted UI chrome that shouldn't compete with the gold accent.

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
- **Label/Mono** (400–500, DM Mono): timestamps, codes (e.g. curator codes), technical or data-like fragments where a monospace read adds precision.

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
The map is the product, not chrome around it. A "Live" pulse indicator (dot + label) marks real-time event activity directly on the map caption bar, reinforcing that pins represent things happening now, in this city, not a static listing.

## 6. Do's and Don'ts

### Do:
- **Do** keep gold as the single accent across both light and dark themes — it is the one thread that survives the day/night flip.
- **Do** use soft, multi-layer, low-opacity shadows for any hover/elevation state; never a single hard drop shadow.
- **Do** let buttons and cards feel physically responsive (lift, shine, ripple) on interaction — this system is tactile and inviting, not flat-minimalist.
- **Do** keep event pins and details visible regardless of perk/curator-code gating — perks lock bonus content, never the core map.

### Don't:
- **Don't** introduce a second saturated accent color alongside gold — no dashboard-blue, no neon, no competing hue.
- **Don't** use generic corporate SaaS chrome: stock icons, enterprise dashboard panels, flat gray "tool" aesthetics.
- **Don't** reach for nightlife/club-app energy — no neon glows, no aggressive gradients — even for "Secret Social Club" curator-gated features; keep it warm, not flashy.
- **Don't** give cards or surfaces a resting shadow. Depth is earned by interaction, not sitting there by default.
- **Don't** use `border-left`/`border-right` colored stripes as an accent treatment anywhere in the system.
