const CACHE = "cumulus-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./src/css/styles.css",
  "./src/js/config.js",
  "./src/js/services.js",
  "./src/js/app/01-core-constants.js",
  "./src/js/app/02-core-storage.js",
  "./src/js/app/03-core-theme.js",
  "./src/js/app/04-auth-onboarding.js",
  "./src/js/app/05-data-loaders.js",
  "./src/js/app/06-map-animations.js",
  "./src/js/app/07-discovery-map.js",
  "./src/js/app/08-event-creator.js",
  "./src/js/app/09-host-analytics.js",
  "./src/js/app/10-badges.js",
  "./src/js/app/11-event-checkout.js",
  "./src/js/app/12-ticket-wallet.js",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/icons/favicon-32.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/clouds/cloud1.webp",
  "./assets/clouds/cloud2.webp",
  "./assets/clouds/cloud3.webp",
  "./assets/clouds/cloud4.webp",
  "./assets/clouds/cloud5.webp",
  "./assets/img/connect.svg",
  "./assets/img/discover.svg",
  "./assets/img/hero-rooftops.svg",
  "./assets/img/pass.svg",
  "./assets/img/venues-network.svg",
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
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
