-- ============================================================================
-- Cumulus — PostGIS GeoJSON RPC for bounding-box event fetching
-- ----------------------------------------------------------------------------
-- Instead of returning raw rows and building GeoJSON on the client
-- (costly CPU on mobile), this function constructs a fully-formed
-- GeoJSON FeatureCollection inside Postgres and returns it as a
-- single jsonb object.
--
-- Usage: supabase.rpc('get_events_geojson', { min_lng, min_lat, max_lng, max_lat })
--
-- Performance notes:
--   • The bbox filter happens in Postgres before any JSON serialisation,
--     so only matching rows are touched.
--   • lat/lon are double precision floats → we build a Point geometry
--     inline with ST_MakePoint rather than storing a geometry column.
--   • A composite index on (lat, lon) allows a fast range scan for the
--     bbox condition without PostGIS spatial index overhead.
-- ============================================================================

-- Composite index so the bbox WHERE clause can avoid a full table scan
create index if not exists events_lat_lon_idx on public.events (lat, lon);

-- ── RPC: get_events_geojson ──────────────────────────────────────────────────
-- Returns a single GeoJSON FeatureCollection with every event whose
-- centroid falls inside the supplied bounding box. All client-needed
-- fields are embedded in each Feature's `properties` object so the
-- frontend can hydrate its EVENTS array without additional fetches.
--
-- Security: SECURITY INVOKER — inherits the caller's RLS policies.
--   The anon key can only read rows that existing RLS permits.
create or replace function public.get_events_geojson(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision
)
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'type',     'FeatureCollection',
    'features', coalesce(jsonb_agg(feature), '[]'::jsonb)
  )
  from (
    select jsonb_build_object(
      'type',       'Feature',
      -- Build a GeoJSON Point from the stored float columns
      'geometry',   jsonb_build_object(
                      'type',        'Point',
                      'coordinates', jsonb_build_array(e.lon, e.lat)
                    ),
      -- All fields the client needs to populate its EVENTS array
      -- and to render map pins, list cards, and detail views
      'properties', jsonb_build_object(
                      'id',            e.id,
                      'title',         e.title,
                      'category',      e.category,
                      'host_name',     e.host_name,
                      'host_id',       e.host_id,
                      'venue',         e.venue,
                      'area',          e.area,
                      'address',       e.address,
                      'lat',           e.lat,
                      'lon',           e.lon,
                      'start_time',    e.start_time,
                      'end_time',      e.end_time,
                      'description',   e.description,
                      'capacity',      e.capacity,
                      'price',         e.price,
                      'night_shot_url',e.night_shot_url
                    )
    ) as feature
    from public.events e
    where
      -- Bounding box filter: only events within the visible map viewport
      e.lat is not null
      and e.lon is not null
      and e.lat between min_lat and max_lat
      and e.lon between min_lng and max_lng
    order by e.start_time asc
  ) sub;
$$;

-- Grant execute to the anon and authenticated roles so the frontend
-- can call it without the service key
grant execute on function public.get_events_geojson(
  double precision, double precision, double precision, double precision
) to anon, authenticated;
