const CACHE = "cumulus-v60";
const ASSETS = [
  "./",
  "./index.html",
  "./src/css/styles.css",
  "./src/js/config.js",
  "./src/js/services.js",
  "./src/js/app/01-constants.js",
  "./src/js/app/02-utils.js",
  "./src/js/app/03-theme-boot-signin.js",
  "./src/js/app/04-auth-host-apply.js",
  "./src/js/app/05-data-nav-routing.js",
  "./src/js/app/06-map-pins-cards.js",
  "./src/js/app/07-map-setup-geocoding.js",
  "./src/js/app/08-host-create-owner-finance.js",
  "./src/js/app/09-host-admin-render-router.js",
  "./src/js/app/10-account-calendar-payments.js",
  "./src/js/app/11-checkout-confirmation.js",
  "./src/js/app/12-wallet-host-form-scanner.js",
  "./src/js/app/13-discover-feed.js",
  "./src/js/app/14-delight.js",
  "./src/css/v2.css",
  "./manifest.json",
  "./assets/icons/icon.svg?v=2",
  "./assets/icons/favicon-32.png?v=2",
  "./assets/icons/apple-touch-icon.png?v=2",
  "./assets/og-image.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Only the app shell is ours to cache. Supabase REST/auth, Mapbox tiles and
  // Stripe must go straight to the network — intercepting them added a hop
  // and, offline, resolved to `undefined` (a hard fetch failure).
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(e.request)
          .then((hit) => hit || caches.match("./index.html"))
          .then((hit) => hit || Response.error()),
      ),
  );
});
