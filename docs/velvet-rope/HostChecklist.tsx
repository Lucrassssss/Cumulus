'use client';

/**
 * HostChecklist — the "Host a Private Event" tab for an `eventee`.
 *
 * Renders the gamified "Unlock Private Hosting" checklist and gates the
 * create-event CTA behind the three server-verified Proof-of-Participation
 * steps. Eligibility is NEVER decided here — `progress` comes from the
 * `get_hosting_progress()` RPC, and the RLS policy on `events` re-checks
 * `can_host_connections_event()` on INSERT regardless of what this UI shows.
 *
 * Accessibility (WCAG 2.2 AA) is built in, not bolted on:
 *   1.4.1 Use of Color     — every state carries an icon + text, never colour alone.
 *   1.4.3 Contrast         — all text ≥ 4.5:1 (see per-class notes below).
 *   2.4.7 Focus Visible    — explicit focus-visible rings, never `outline-none` alone.
 *   2.4.11 Focus Not Obscured — scroll-margin so a focused row is never hidden under sticky UI.
 *   2.5.8 Target Size      — interactive controls are ≥ 44×44 CSS px.
 *   3.3.8 Accessible Auth  — verification is device/biometric; no memory/puzzle test.
 *   4.1.3 Status Messages  — progress announced via an aria-live region.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Lock,
  CheckCircle2,
  ShieldCheck,
  Ticket,
  Users,
  Fingerprint,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';

/* ── Types (server-authoritative shape returned by get_hosting_progress) ── */
export interface HostingProgress {
  ageVerified: boolean;
  eventsCheckedIn: number;
  eventsRequired: number;
  connections: number;
  connectionsRequired: number;
  eligible: boolean;
}

type StepId = 'age' | 'checkin' | 'connections';

interface Step {
  id: StepId;
  title: string;
  /** Human sentence for screen readers — fuller than the visible label. */
  srSummary: string;
  icon: typeof ShieldCheck;
  done: boolean;
  /** e.g. "1 / 3" for countable steps, undefined for the boolean age step. */
  count?: { value: number; target: number };
}

interface HostChecklistProps {
  progress: HostingProgress;
  /** Kick off the third-party identity flow (Stripe Identity / Yoti). */
  onStartAgeVerification: () => Promise<void> | void;
  /** Re-fetch get_hosting_progress() after any step may have changed. */
  onRefresh: () => Promise<void> | void;
  /** Navigate to the connections- and events-finding surfaces. */
  onFindEvents?: () => void;
  onFindConnections?: () => void;
  /** Shown once eligible. */
  onCreateEvent?: () => void;
}

export default function HostChecklist({
  progress,
  onStartAgeVerification,
  onRefresh,
  onFindEvents,
  onFindConnections,
  onCreateEvent,
}: HostChecklistProps) {
  const headingId = useId();
  const liveId = useId();

  /* Focus management: we own the trigger ref so we can guarantee focus returns
   * to it when the identity modal closes. Radix already restores focus to the
   * element that opened the dialog, but we make it explicit + resilient to
   * re-renders that could swap the node out from under Radix. */
  const ageTriggerRef = useRef<HTMLButtonElement>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const steps: Step[] = [
    {
      id: 'age',
      title: 'Verify you’re 18 or over',
      srSummary: progress.ageVerified
        ? 'Step 1 of 3, complete: your age is verified.'
        : 'Step 1 of 3, incomplete: verify your age with your device to continue.',
      icon: ShieldCheck,
      done: progress.ageVerified,
    },
    {
      id: 'checkin',
      title: 'Check in at a real event',
      srSummary: `Step 2 of 3, ${
        progress.eventsCheckedIn >= progress.eventsRequired ? 'complete' : 'incomplete'
      }: ${progress.eventsCheckedIn} of ${progress.eventsRequired} events attended in person.`,
      icon: Ticket,
      done: progress.eventsCheckedIn >= progress.eventsRequired,
      count: { value: progress.eventsCheckedIn, target: progress.eventsRequired },
    },
    {
      id: 'connections',
      title: 'Make 3 mutual connections',
      srSummary: `Step 3 of 3, ${
        progress.connections >= progress.connectionsRequired ? 'complete' : 'incomplete'
      }: ${progress.connections} of ${progress.connectionsRequired} connections accepted.`,
      icon: Users,
      done: progress.connections >= progress.connectionsRequired,
      count: { value: progress.connections, target: progress.connectionsRequired },
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  /* Explicit focus return when the modal closes (belt-and-braces over Radix). */
  const handleOpenChange = useCallback((open: boolean) => {
    setVerifyOpen(open);
    if (!open) {
      // Wait a frame so the dialog is unmounted before we move focus.
      requestAnimationFrame(() => ageTriggerRef.current?.focus());
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    try {
      await onStartAgeVerification();
      await onRefresh();
    } finally {
      setVerifying(false);
      handleOpenChange(false);
    }
  }, [onStartAgeVerification, onRefresh, handleOpenChange]);

  /* ── Eligible: replace the checklist with the unlocked CTA. ── */
  if (progress.eligible) {
    return (
      <section
        aria-labelledby={headingId}
        className="mx-auto max-w-md rounded-2xl border border-amber-300/30 bg-zinc-900 p-6 text-zinc-100"
      >
        <PartyPopper aria-hidden className="h-8 w-8 text-amber-300" />
        <h2 id={headingId} className="mt-3 text-xl font-bold tracking-tight">
          Private hosting unlocked
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          {/* zinc-300 (#d4d4d8) on zinc-900 (#18181b) ≈ 10.4:1 */}
          You’ve met every requirement. You can now host{' '}
          <span className="font-semibold text-zinc-100">connections-only</span> events for people
          you’re connected with.
        </p>
        <button
          type="button"
          onClick={onCreateEvent}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 font-semibold text-zinc-950 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transition-none"
        >
          Create a private event
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </section>
    );
  }

  /* ── Not yet eligible: the gamified checklist. ── */
  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-100"
    >
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          {/* amber-300 (#fcd34d) on zinc-900 ≈ 11.8:1 */}
          Members’ track
        </p>
        <h2 id={headingId} className="mt-1 text-xl font-bold tracking-tight">
          Unlock private hosting
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Complete three steps to host <span className="font-semibold">connections-only</span>{' '}
          events. Progress is verified by Cumulus — no need to prove anything twice.
        </p>

        {/* Visible progress meter + accessible name. */}
        <div className="mt-4">
          <div
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuetext={`${completed} of ${steps.length} steps complete`}
            className="h-2 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-amber-300 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-200">
            {completed} of {steps.length} complete
          </p>
        </div>

        {/* 4.1.3 — announce changes without moving focus. */}
        <p id={liveId} aria-live="polite" className="sr-only">
          {completed} of {steps.length} steps complete toward unlocking private hosting.
        </p>
      </header>

      <ol className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              // 2.4.11 — keep a focused row clear of any sticky header.
              className="scroll-mt-24 rounded-xl border border-white/10 bg-zinc-950/60 p-4"
            >
              <div className="flex items-start gap-3">
                {/* State icon — carries meaning, so it is NOT aria-hidden’s job
                    alone; the sr-only sentence below is the real label. */}
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" /> /* #4 ade80 ≈ 9:1 */
                  ) : (
                    <Lock className="h-5 w-5 text-zinc-400" /> /* #a1a1aa ≈ 6.4:1 */
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon aria-hidden className="h-4 w-4 text-zinc-400" />
                    <h3
                      className={
                        step.done
                          ? 'text-sm font-semibold text-zinc-400 line-through'
                          : 'text-sm font-semibold text-zinc-100'
                      }
                    >
                      {step.title}
                    </h3>
                  </div>

                  {/* Visible status text — second, non-colour signal. */}
                  <p className="mt-1 text-xs font-medium">
                    {step.done ? (
                      <span className="text-green-400">Done</span>
                    ) : step.count ? (
                      <span className="text-zinc-300">
                        {step.count.value} / {step.count.target}
                      </span>
                    ) : (
                      <span className="text-zinc-300">Not started</span>
                    )}
                  </p>

                  {/* Per-step action for the incomplete steps. */}
                  {!step.done && step.id === 'age' && (
                    <Dialog.Root open={verifyOpen} onOpenChange={handleOpenChange}>
                      <Dialog.Trigger asChild>
                        <button
                          ref={ageTriggerRef}
                          type="button"
                          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none"
                        >
                          <Fingerprint aria-hidden className="h-4 w-4" />
                          Verify with your device
                        </button>
                      </Dialog.Trigger>
                      <AgeVerifyModal verifying={verifying} onConfirm={handleVerify} />
                    </Dialog.Root>
                  )}

                  {!step.done && step.id === 'checkin' && (
                    <button
                      type="button"
                      onClick={onFindEvents}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none"
                    >
                      Find an event near you
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </button>
                  )}

                  {!step.done && step.id === 'connections' && (
                    <button
                      type="button"
                      onClick={onFindConnections}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none"
                    >
                      Find people to connect with
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* The real, meaningful label for assistive tech. */}
              <span className="sr-only">{step.srSummary}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Identity verification modal ──────────────────────────────────────────
 * 3.3.8 Accessible Authentication: the copy makes clear verification is done
 * with the device (Face ID / fingerprint / banking app) — no password to
 * memorise, no CAPTCHA or puzzle. The launch button just hands off to the
 * provider SDK. Radius Dialog gives us the focus trap + Esc-to-close; we add
 * an explicit description via aria-describedby. */
function AgeVerifyModal({
  verifying,
  onConfirm,
}: {
  verifying: boolean;
  onConfirm: () => void;
}) {
  const descId = useId();
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in motion-reduce:animate-none" />
      <Dialog.Content
        aria-describedby={descId}
        className="fixed left-1/2 top-1/2 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-100 shadow-2xl focus:outline-none"
      >
        <Fingerprint aria-hidden className="h-8 w-8 text-amber-300" />
        <Dialog.Title className="mt-3 text-lg font-bold">Verify your age</Dialog.Title>
        <p id={descId} className="mt-2 text-sm text-zinc-300">
          We’ll confirm you’re 18 or over using your device — Face ID, a fingerprint, or your
          banking app. There’s nothing to memorise and no puzzle to solve. Cumulus never sees your
          documents.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={verifying}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 font-semibold text-zinc-950 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-60 motion-reduce:transition-none"
          >
            {verifying ? 'Opening secure check…' : 'Continue with device'}
          </button>
          <Dialog.Close asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-zinc-300 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transition-none"
            >
              Not now
            </button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
