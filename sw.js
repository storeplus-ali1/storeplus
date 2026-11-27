const C='sp-v5';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});
self.addEventListener('push',e=>{
  let d={}; try{d=e.data.json()}catch(_){d={title:'متجر بلس',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'متجر بلس',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',dir:'rtl',lang:'ar',data:{url:d.url||'./index.html'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close(); const u=new URL(e.notification.data.url,self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c){c.navigate(u);return c.focus()}}return clients.openWindow(u)}));
});
