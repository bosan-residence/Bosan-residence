const CACHE='bosan-pwa-v3';
const ASSETS=['./login.html','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  // Existing iPhone home-screen shortcuts may still open index.html.
  // Send those launches to the password login. After successful auth,
  // login.html opens index.html?auth=1, which is allowed through to the app.
  if(event.request.mode==='navigate' && (url.pathname==='/' || url.pathname.endsWith('/index.html')) && url.searchParams.get('auth')!=='1'){
    event.respondWith(
      fetch('./login.html',{cache:'no-store'})
        .catch(()=>caches.match('./login.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./login.html')))
  );
});