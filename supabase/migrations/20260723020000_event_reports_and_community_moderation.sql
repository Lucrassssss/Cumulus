-- Community-driven event moderation — the zero-cost replacement for
-- per-upload AI content scanning (see 20260723010000_revert_image_
-- moderation.sql). Anyone signed in can flag an event; once 3 different
-- people have done so it auto-hides from the public map pending an
-- admin's review, instead of a slow/expensive pre-publish scan blocking
-- the 60-second publish flow this app is built around.

-- One row per (reporter, event) — the primary key itself enforces "one
-- report per person", which is exactly what the 3-reporter threshold
-- needs to count (no separate COUNT DISTINCT required).
CREATE TABLE IF NOT EXISTS public.event_reports (
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reporter_id, event_id)
);

ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Unlike host_follows, report rows aren't public — a reason can be
-- accusatory/sensitive. Only the reporting user (so the UI can tell
-- they've already reported) and admins (to review) can read rows.
CREATE POLICY event_reports_select ON public.event_reports
  FOR SELECT USING (reporter_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY event_reports_insert ON public.event_reports
  FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()));

-- Admin-only — used when dismissing reports on restore (see the app's
-- restoreReportedEvent()); also fires implicitly via ON DELETE CASCADE
-- above when an event itself is deleted.
CREATE POLICY event_reports_delete ON public.event_reports
  FOR DELETE USING (public.is_admin());

-- 'hidden' = auto-hidden pending admin review after 3+ unique reports.
-- Deliberately distinct from 'cancelled' (host-initiated, refunds issued
-- immediately) — a hidden event's tickets/bookings are left untouched
-- since the report could turn out to be unfounded and get restored.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_status_check CHECK (status IN ('active', 'cancelled', 'hidden'));

-- Auto-hide on the 3rd unique reporter. Runs SECURITY DEFINER (as the
-- trigger/table owner) so it can flip an event's status even though the
-- reporting user has no UPDATE grant on that row — counting and hiding
-- happens server-side, unconditionally, rather than trusting client code
-- to do it (which a motivated user could simply skip).
CREATE OR REPLACE FUNCTION public.handle_event_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.event_reports WHERE event_id = NEW.event_id;
  IF v_count >= 3 THEN
    UPDATE public.events SET status = 'hidden' WHERE id = NEW.event_id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_event_report() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS event_reports_after_insert ON public.event_reports;
CREATE TRIGGER event_reports_after_insert
  AFTER INSERT ON public.event_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_event_report();

-- Close a loophole the plain "host_id = auth.uid()" policies would
-- otherwise leave open: without this, a reported host could just run
-- their own UPDATE (e.g. from devtools) to flip status back to 'active'
-- the instant their event gets auto-hidden, defeating the whole point of
-- the report system. Once an event is 'hidden', only an admin — not even
-- its own host — may modify or delete it; that's what "goes to the admin
-- panel for manual review" has to mean for the report system to matter.
DROP POLICY IF EXISTS events_modify_own ON public.events;
CREATE POLICY events_modify_own ON public.events FOR UPDATE TO authenticated
  USING ((host_id = (SELECT auth.uid()) AND status <> 'hidden') OR is_admin())
  WITH CHECK ((host_id = (SELECT auth.uid()) AND status <> 'hidden') OR is_admin());

DROP POLICY IF EXISTS events_delete_own ON public.events;
CREATE POLICY events_delete_own ON public.events FOR DELETE TO authenticated
  USING ((host_id = (SELECT auth.uid()) AND status <> 'hidden') OR is_admin());
