/* Оболочка приложения в кэше: открывается мгновенно и не падает при слабой связи в зале.
   Данные (stock/bc/upt/bask/buy-*.json) — ВСЕГДА сначала из сети: остатки и план закупа
   не должны «залипать», кэш для них только подстраховка, когда сети нет совсем. */
var V='161c7823', C='fm-'+V;
var SHELL=['./','index.html','pick.html','upt.html','bask.html','buy.html','ship.html','recv.html','manifest.webmanifest','scan/zxing.js',
           'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-180.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(SHELL);})
    .then(function(){return self.skipWaiting();}).catch(function(){}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){return k===C?null:caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url;
  try{url=new URL(req.url);}catch(err){return;}
  if(url.origin!==location.origin)return;
  /* данные грузятся с ?v=…, поэтому в кэш кладём по адресу БЕЗ параметров —
     иначе каждый час копился бы новый экземпляр файла */
  var key=url.origin+url.pathname;
  var live=/\/(stock|bc|upt|bask)\.json$/.test(url.pathname)||/\/buy\.json$/.test(url.pathname)||req.mode==='navigate';
  if(live){
    e.respondWith(fetch(req).then(function(r){
      var cp=r.clone(); caches.open(C).then(function(c){c.put(key,cp);}); return r;
    }).catch(function(){
      return caches.match(key).then(function(m){return m||caches.match('index.html');});
    }));
  }else{
    e.respondWith(caches.match(key).then(function(m){
      return m||fetch(req).then(function(r){
        var cp=r.clone(); caches.open(C).then(function(c){c.put(key,cp);}); return r;
      });
    }));
  }
});
