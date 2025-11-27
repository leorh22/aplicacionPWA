// Nombre de caches
const STATIC_CACHE = "gastos-static-v1";
const API_CACHE = "gastos-api-v1";

// Archivos estáticos que forman el "app shell"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/graficas.js",
  "/js/filtros.js",
  "/manifest.json",
  //"/icon-192.png",
  //"/icon-512.png",
  // Si mantienes CDNs:
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11"
];

// INSTALL: cachear el shell de la aplicación
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE: limpiar caches viejos
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// FETCH: manejar peticiones
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) API de gastos: estrategia "network first, cache fallback"
  if (url.pathname.startsWith("/api/gastos") && req.method === "GET") {
    event.respondWith(networkFirstForGastos(req));
    return;
  }

  // 2) Navegación y estáticos: estrategia "cache first, network fallback"
  if (req.method === "GET") {
    event.respondWith(cacheFirst(req));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Notificación", body: event.data.text() };
    }
  }

  const title = data.title || "FinTrack";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: "../icons/FinTrack-icon.png",
    badge: "../icons/FinTrack-icon.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Estrategia: primero intentamos red; si falla, usamos lo último cacheado
async function networkFirstForGastos(req) {
  try {
    const fetchResponse = await fetch(req);

    // Si la respuesta es OK, la guardamos en el cache de API
    if (fetchResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(req, fetchResponse.clone());
    }

    return fetchResponse;
  } catch (err) {
    console.warn("[SW] Sin red, devolviendo datos cacheados de /api/gastos");
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(req);
    if (cached) {
      return cached;
    }

    // Si nunca se ha cacheado nada, devolvemos una respuesta vacía "amigable"
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Estrategia: cache first para estáticos
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const fetchResponse = await fetch(req);
    // Opcional: cachear recursos estáticos nuevos
    if (
      req.url.startsWith(self.location.origin) &&
      fetchResponse.ok &&
      req.method === "GET"
    ) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, fetchResponse.clone());
    }
    return fetchResponse;
  } catch (err) {
    // Aquí podrías devolver una página offline personalizada si quieres
    return cached || Response.error();
  }
}