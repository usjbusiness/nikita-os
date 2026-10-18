// Only the generic application shell is cached. No API response, PIN or personal
// data is cached. On logout or without connectivity, private data is not shown.
const CACHE='nikita-os-shell-v2';
const SHELL=['/','/style.css','/app.js','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/brands/usj-bluejays.png','/brands/usj-seal.png','/brands/business-society.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname==='/health')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&SHELL.includes(u.pathname)){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('/'):Response.error()))));});
