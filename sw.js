/* InkConsent — service worker v12
   Cambiato rispetto alla v11:
   • jspdf e qrcodejs ora sono file locali e vanno in cache: senza,
     in un seminterrato senza campo il PDF e il QR non partono.
   • precache completo di sagome e icone categoria.
   • navigate: network-first con fallback all'index in cache, così
     un aggiornamento arriva subito ma offline l'app si apre lo stesso.

   Nota: i dati (consensi, magazzino) NON passano da qui. Stanno in
   IndexedDB sul dispositivo e il service worker non li tocca mai.   */

const CACHE = "inkconsent-v16";

const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "consensi.json",

  /* librerie — prima erano su cdnjs, ora locali */
  "jspdf.umd.min.js",
  "qrcode.min.js",

  /* sagome anatomiche */
  "body-man_front.png",
  "body-man_back.png",
  "body-girl_front.png",
  "body-girl_back.png",

  /* icone app */
  "icon-192.png",
  "icon-512.png",

  /* icone categoria magazzino */
  "cat-carta.png",
  "cat-cartastesa.png",
  "cat-cartucce.png",
  "cat-disinfettante.png",
  "cat-greensoap.png",
  "cat-guanti.png",
  "cat-inkcaps.png",
  "cat-macchinette.png",
  "cat-pellicole.png",
  "cat-rasoi.png",
  "cat-stencil.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* uno alla volta: se manca un file, non deve far fallire tutto
       il precache come farebbe addAll() */
    await Promise.all(PRECACHE.map(async (url) => {
      try { await cache.add(new Request(url, { cache: "reload" })); }
      catch (e) { console.warn("[sw] non messo in cache:", url); }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  /* i font di Google restano online: se non ci sono, l'app usa i
     font di sistema e funziona comunque */
  if (url.origin !== self.location.origin) return;

  /* navigazione: prima la rete (così gli aggiornamenti arrivano),
     se non c'è si apre la copia in cache */
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match("index.html")) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }

  /* tutto il resto: prima la cache, poi la rete (e ci si tiene la copia) */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return Response.error();
    }
  })());
});
