/* InkConsent — service worker minimale.
   Cache-first per lo shell dell'app: una volta aperta con connessione,
   resta utilizzabile offline (i dati restano in localStorage, che il
   service worker non tocca). Le librerie esterne (jsPDF, QRCode, Google
   Fonts) hanno bisogno di rete la prima volta che servono. */

const CACHE_NAME = "inkconsent-v7";
const SHELL = [
  "/", "/index.html", "/manifest.json",
  "/icon-192.png", "/icon-512.png",
  "/body-man_front.png", "/body-man_back.png",
  "/body-girl_front.png", "/body-girl_back.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Per le navigazioni (apertura dalla home / cambio pagina): prova la rete,
  // e se fallisce torna sempre alla pagina principale invece di dare 404.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html").then((c) => c || caches.match("/")))
    );
    return;
  }

  // Altre risorse: cache-first, poi rete.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
