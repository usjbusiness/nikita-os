// Only the generic application shell is cached. No API response, PIN or personal
// data is cached. On logout or without connectivity, private data is not shown.
const CACHE='nikita-os-shell-v4-focus';
const SHELL=['/','/style.css?v=4.0.0','/v4.css?v=4.0.0','/planner.js?v=4.0.0','/app.js?v=4.0.0','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/brands/usj-bluejays.png','/brands/usj-seal.png','/brands/business-society.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname==='/health'||u.pathname==='/version.json'||u.pathname.startsWith('/update-check'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&SHELL.includes(u.pathname+u.search)){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('/'):Response.error()))));});
