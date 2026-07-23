-- Account details (name/email/phone/avatar edit page) and real cross-user
-- host follows. Replaces the old localStorage-only follow "bookmark" —
-- that could never tell a host how many people actually follow them
-- (it lived in one browser, on one device, per follower), so the host
-- profile page's own comment explicitly declined to show a follower
-- count as a result: "never a real cross-user number... showing either
-- would be a fabricated trust signal." This makes it a real number.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number text;

CREATE TABLE IF NOT EXISTS public.host_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, host_id)
);

CREATE INDEX IF NOT EXISTS host_follows_host_id_idx
  ON public.host_follows (host_id);

ALTER TABLE public.host_follows ENABLE ROW LEVEL SECURITY;

-- Follow edges are public on every platform this is modeled on (Eventbrite,
-- Luma) — needed so any visitor's client can compute "N followers" and
-- "do I follow this host" without a server-side aggregation endpoint.
CREATE POLICY host_follows_select ON public.host_follows
  FOR SELECT USING (true);

CREATE POLICY host_follows_insert ON public.host_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY host_follows_delete ON public.host_follows
  FOR DELETE USING (follower_id = auth.uid());
