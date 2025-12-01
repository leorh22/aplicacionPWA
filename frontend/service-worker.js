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

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

// FETCH: manejar peticiones
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 👉 Si es una petición a /api/, NO la tocamos
  if (url.pathname.startsWith("/api/")) {
    return; // Dejar que el navegador la maneje normalmente
  }

  // Resto de archivos estáticos sí se cachean
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(event.request).then((fetchRes) => {
          return caches.open("fintrack-cache-v1").then((cache) => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "FinTrack";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: "/icons/no-bg.png",
    badge: "/icons/no-bg.png",
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