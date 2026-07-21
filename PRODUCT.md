# Product

## Register

product

## Platform

web

## Users

Londoners discovering local community events near them — casual users who open the app to see what's happening nearby on a live map, RSVP, and buy a ticket in seconds. Every event is public, with no invite code or gating: the primary audience is the everyday local looking for something to do in their city. A secondary audience of hosts lists events (reviewed quickly, published instantly for admins) and keeps 100% of their ticket price.

## Product Purpose

Cumulus surfaces community events happening around London on an interactive map, so people can find things worth showing up to and actually go. The day/night theme, drifting clouds, and skyline motif tie the interface to the city and time of day the user is actually in, reinforcing "your city, your people" as more than a tagline.

## Positioning

A live map of your city's community, not a listings feed — Cumulus shows what's happening near you right now, tied to real place and real time, so finding an event feels like noticing your neighborhood rather than searching a database.

## Brand Personality

Warm, communal, local. The voice should feel like a friendly local tip-off, not a platform pitch — approachable and grounded in place (London-specific), never salesy or hype-driven. Every event is public and joining is frictionless; the warmth comes from place and community, not from manufactured exclusivity.

## Anti-references

Avoid generic corporate SaaS aesthetics — dashboard-blue palettes, stock icons, enterprise-tool chrome. Also avoid try-hard nightlife/club-app energy (neon, aggressive gradients) and any "secret club" / invite-only framing — the feel should stay warm, communal, and open, never flashy or exclusive-clubby.

## Design Principles

- Place and time are real, not decorative: the live day/night theme and map are the product, not garnish — never let chrome overshadow them.
- Warmth over polish-for-its-own-sake: prefer friendly, local-feeling details (clouds, skyline, grain texture) over corporate slickness.
- Frictionless, never gated: every event and every pin is visible to everyone, with no invite code, curator gate, or unlock step standing between a user and the map.
- Design for the return visit: since success is repeat engagement and community growth, interactions (RSVP, ticket claim, hosting) should feel satisfying enough to repeat, not just functional once.
- Never look like a SaaS dashboard or a club-app: if in doubt, pull toward "friendly city guide," away from both extremes.

## Accessibility & Inclusion

Standard WCAG AA — contrast, keyboard navigation, and reduced-motion support (respect `prefers-reduced-motion` for cloud drift and other ambient animation).

## Business Model (from the founding Master Blueprint)

Cumulus is bootstrapped and cash-flowing, not VC-funded — no "100M valuation mandate" shaping product decisions. Revenue is a flat £1.50–£4.50 booking fee paid by the buyer (see `getCumulusFee()` in `app.js`); hosts keep 100% of their base ticket price, always. Free community events cost the platform nothing to the host and nothing to attend — treated as a loss-leader for map density and user acquisition, not a lesser-tier product. The interface stays ad-free: no banners, no pop-ups, no funnels; monetization beyond the booking fee is meant to happen off-screen (experiential brand sponsorships, e.g. a brewery subsidizing a night's drinks) rather than in the UI itself — **not built as a feature in this codebase**, since the blueprint describes it as a manual sales/ops process, not a product surface. Expansion (a "City Director" per region, a specific London launch corridor, a 100-event launch target) is go-to-market strategy, not something the app enforces in code.
