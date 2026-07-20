# Cumulus — Go-Live Runbook

Single source of truth for taking Cumulus live. Everything already done is
checked off; the open items are all **Supabase-dashboard actions** that no API,
connector, or tool can perform for you.

---

## ✅ Already done (verified in production)

- **Auth model migrated to Supabase Auth** (Phase 1 + 2). Sign-up/login use email
  OTP; every request carries a JWT.
- **RLS hardened** on every table that existed at the time (`users`, `events`,
  `rsvps`, `tickets`, `host_applications`, `pending_events`, `admins`).
  Writes are constrained to `auth.uid()`. (`chat_messages`, `friends`, and
  `curator_codes` were dropped outright by the frictionless-ticketing pivot —
  see `supabase/migrations/20260720010000_pivot_frictionless_ticketing.sql`.)
- **Security hole closed:** 13 leftover wide-open `{public}` policies (incl.
  `public read users` / `public update users`) were dropped. Advisor: 0
  permissive public policies remain.
- **Clean slate:** all demo/seed events and old pre-auth accounts deleted.
- **Owner set up:** `gondoxml@gmail.com` is an admin + `partner_host`, with a
  real auth-linked profile.
- Migrations of record: `supabase/migrations/2026070*.sql`, `2026072*.sql`.

---

## ⬜ Remaining — all in the Supabase dashboard

### 1. Email template → send a 6-digit CODE (not a link) ← THE sign-in fix

`signInWithOtp` uses the **Magic Link** template, which by default sends a link.
The app asks for a code, so the template must include `{{ .Token }}`.

**Authentication → Emails → Templates → "Magic Link"** → set the body to:

```html
<h2>Your Cumulus sign-in code</h2>
<p>Enter this 6-digit code in the app:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;">{{ .Token }}</p>
<p style="color:#888;font-size:13px;">
  Expires in 1 hour. If you didn't request it, ignore this email.
</p>
```

Save. **This is the one edit that fixes "it sends a link, not a code."**

### 2. Email delivery — fix the rate limit

The built-in mailer is test-only and caps at a few emails/hour (that's the
"email rate limit exceeded" error). Two options:

- **Quick / today:** just wait ~1 hour for the limit to reset, then request a
  code. Enough to sign yourself in.
- **Real launch:** custom SMTP via **Resend** — removes the cap and lets you
  email real users. **Authentication → Emails → SMTP Settings** → enable custom
  SMTP:

  | Field        | Value                                                                            |
  | ------------ | -------------------------------------------------------------------------------- |
  | Sender email | `onboarding@resend.dev` (test) or `noreply@cumulusapp.co` (once domain verified) |
  | Sender name  | `Cumulus`                                                                        |
  | Host         | `smtp.resend.com`                                                                |
  | Port         | `465`                                                                            |
  | Username     | `resend`                                                                         |
  | Password     | your Resend API key (`re_…`)                                                     |

  Get the `re_…` key at resend.com → API Keys → Create. The `onboarding@resend.dev`
  sender needs **no DNS** but can only email your own Resend-account address —
  fine for testing as `gondoxml@gmail.com`. To email anyone, verify a domain in
  Resend (add its SPF+DKIM records **at your domain registrar**, not in Supabase).

### 3. Delete the typo account

**Authentication → Users** → `gondoxnl@gmail.com` (note the `n`) → ⋯ → Delete.
Keep `gondoxml@gmail.com`.

### 4. Test

Live site → sign in as `gondoxml@gmail.com` → 6-digit code arrives → enter it →
you're in as admin (admin panel + event approvals visible).

---

## Doing the connector-dependent bits in a fresh chat

Steps 2 (create Resend key) and 3 (delete typo user) can be done _for_ you by a
Claude with the Supabase + Resend connectors enabled. If this chat's connectors
are stuck disabled, open a **new chat** and paste:

> Using the Supabase and Resend connectors, for Supabase project ref
> `xyzrvgbdnevllwvxqcka`: (1) create a Resend API key named "Cumulus SMTP" with
> sending permission and show it to me; (2) delete the Supabase auth user
> `gondoxnl@gmail.com` (keep `gondoxml@gmail.com`, my admin); (3) check my auth
> logs and tell me if the email rate limit has reset. I'll paste the key into
> Supabase SMTP settings and set the Magic Link template to `{{ .Token }}` myself.

---

## Still on the roadmap (code, not config)

- Verify the map's day/night relight on the live site (Mapbox is blocked in CI).
- **Stripe Connect — needs a real account, not code.** Schema + 5 Edge
  Functions are written (`supabase/migrations/20260721000000_stripe_connect_scaffolding.sql`;
  see ARCHITECTURE.md → "Payments — Stripe Connect scaffolding") but
  NOT LIVE-TESTED anywhere. Before any of it can process a real purchase:
  1. Enable **Connect** on the platform's Stripe account (Dashboard →
     Connect → Get started).
  2. Set Edge Function secrets: `STRIPE_SECRET_KEY` (likely already set,
     reused from the now-deleted create-verification-session),
     `STRIPE_CHECKOUT_WEBHOOK_SECRET` (new — create a webhook endpoint
     pointed at `stripe-webhook`, subscribed to `checkout.session.completed`
     and `account.updated`, and use the `whsec_...` it gives you).
  3. Run one real test-mode purchase end to end and confirm a ticket row
     actually appears.
  4. Decide how `release-payout` gets called on a schedule — nothing in
     this repo currently triggers it automatically (Supabase Cron / pg_cron
     / an external scheduler hitting it with `RELEASE_PAYOUT_CRON_SECRET`
     are all options, none chosen yet).

(The velvet-rope hosting-eligibility checklist and curator-code perk gating
that used to be tracked here were removed outright by the
frictionless-ticketing pivot — see `docs/velvet-rope/README.md` for the
historical design they replaced.)
