const CACHE_NAME = "dashboard-gastos-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11"
];

// Instalar el service worker y guardar los archivos en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  console.log("Service Worker instalado");
});

// Interceptar peticiones y responder desde caché si no hay conexión
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});