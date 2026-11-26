import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
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
    webpush.setVapidDetails('mailto:scary01099283934@gmail.com', 'BArEwzaAmdhS4K9x6Pij_4-a7QxhL0I6_YcCh-2ZYUvQcWYsGOwHlY5wKPukVxxAXhmKoKL9JsbkTumZb-fMcnM', Deno.env.get('VAPID_PRIVATE')!);
    const { data: ns } = await svc.from('notifications').select('*').eq('push_status', 'pending').order('id').limit(500);
    const tally: Record<string, { ok: number; fail: number }> = {};
    for (const n of ns || []) {
      const { data: subs } = await svc.from('push_subscriptions').select('*').eq('user_id', n.user_id);
      let ok = 0, fail = 0;
      for (const s of subs || []) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, body: n.body, url: n.url || '#/notifications', id: n.id }), { TTL: 86400 });
          ok++;
        } catch (e) {
          fail++;
          if (e?.statusCode === 404 || e?.statusCode === 410) await svc.from('push_subscriptions').delete().eq('id', s.id);
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
