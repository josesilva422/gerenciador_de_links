const CACHE_NAME = "comurg-portal-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/tools.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/logo-comurg.png",
  "./icons/logo-remove.png",
  "./icons/logo-opev.png",
  "./icons/logo-urbantrim.png",
  "./icons/logo-pesocerto.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Só cuida do "shell" do próprio portal (mesma origem).
// Links externos das plataformas seguem direto para a rede.
// Estratégia "network-first": sempre tenta buscar a versão mais nova primeiro
// (assim quem já tem o app aberto/instalado vê as plataformas novas na hora),
// e só usa o cache como reserva quando está offline.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("./index.html"))
      )
  );
});
