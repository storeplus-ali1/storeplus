import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };

let _tok: { t: string; e: number } | null = null;
function b64u(b: ArrayBuffer | string) { const a = typeof b === 'string' ? btoa(b) : btoa(String.fromCharCode(...new Uint8Array(b))); return a.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function fcmToken(sa: any) {
  if (_tok && _tok.e > Date.now() + 60000) return _tok.t;
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + head + '.' + claim + '.' + b64u(sig) });
  const j = await r.json(); if (!j.access_token) throw new Error('fcm oauth ' + JSON.stringify(j));
  _tok = { t: j.access_token, e: Date.now() + j.expires_in * 1000 }; return _tok.t;
}
async function sendFcm(sa: any, token: string, n: any) {
  const r = await fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', { method: 'POST', headers: { Authorization: 'Bearer ' + await fcmToken(sa), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token, notification: { title: n.title, body: n.body }, data: { url: String(n.url || '#/notifications'), id: String(n.id) }, android: { priority: 'HIGH', notification: { channel_id: 'default', sound: 'default' } } } }) });
  if (!r.ok) { const t = await r.text(); const e: any = new Error('fcm ' + r.status + ' ' + t); e.statusCode = r.status; e.body = t; throw e; }
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await svc.auth.getUser(jwt);
    if (!u?.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
    const { data: me } = await svc.from('profiles').select('role').eq('id', u.user.id).single();
    if (me?.role !== 'admin') return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors });
    const vp = Deno.env.get('VAPID_PRIVATE');
    if (vp) { try { webpush.setVapidDetails('mailto:scary01099283934@gmail.com', 'BArEwzaAmdhS4K9x6Pij_4-a7QxhL0I6_YcCh-2ZYUvQcWYsGOwHlY5wKPukVxxAXhmKoKL9JsbkTumZb-fMcnM', vp.trim()); } catch (e) { console.log('vapid', String(e)); } }
    let sa: any = null; try { const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT'); sa = saRaw ? JSON.parse(saRaw) : null; } catch (e) { console.log('sa parse', String(e), 'len', (Deno.env.get('FCM_SERVICE_ACCOUNT')||'').length, JSON.stringify((Deno.env.get('FCM_SERVICE_ACCOUNT')||'').slice(0,14)), JSON.stringify((Deno.env.get('FCM_SERVICE_ACCOUNT')||'').slice(-4))); }
    const { data: ns } = await svc.from('notifications').select('*').eq('push_status', 'pending').order('id').limit(500);
    const tally: Record<string, { ok: number; fail: number }> = {};
    for (const n of ns || []) {
      const { data: subs } = await svc.from('push_subscriptions').select('*').eq('user_id', n.user_id);
      let ok = 0, fail = 0;
      for (const s of subs || []) {
        try {
          if (s.endpoint.startsWith('fcm:')) { if (!sa) throw new Error('no FCM key'); await sendFcm(sa, s.endpoint.slice(4), n); } else await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, body: n.body, url: n.url || '#/notifications', id: n.id }), { TTL: 86400 });
          ok++;
        } catch (e) {
          fail++; console.log('send fail', s.endpoint.slice(0, 12), String(e?.message || e).slice(0, 400));
          if (e?.statusCode === 404 || e?.statusCode === 410 || (e?.body || '').includes('UNREGISTERED')) await svc.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
      const st = ok > 0 ? 'accepted' : fail > 0 ? 'failed' : 'no_subscription';
      await svc.from('notifications').update({ push_status: st }).eq('id', n.id);
      if (n.broadcast_id) { const t = (tally[n.broadcast_id] ||= { ok: 0, fail: 0 }); if (ok > 0) t.ok++; else t.fail++; }
    }
    for (const [bid, t] of Object.entries(tally)) {
      const { data: b } = await svc.from('broadcasts').select('push_ok,push_failed').eq('id', bid).single();
      const o = (b?.push_ok || 0) + t.ok, f = (b?.push_failed || 0) + t.fail;
      await svc.from('broadcasts').update({ push_ok: o, push_failed: f, push_status: o > 0 ? 'accepted' : 'failed' }).eq('id', bid);
    }
    return new Response(JSON.stringify({ processed: (ns || []).length }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
