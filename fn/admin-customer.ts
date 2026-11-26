import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const R = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await svc.auth.getUser(jwt);
    if (!u?.user) return R({ error: 'unauthorized' }, 401);
    const { data: me } = await svc.from('profiles').select('role').eq('id', u.user.id).single();
    if (me?.role !== 'admin') return R({ error: 'forbidden' }, 403);
    const { action, phone } = await req.json();
    const l10 = String(phone || '').replace(/\D/g, '').slice(-10);
    if (l10.length < 10) return R({ error: 'bad_input' }, 400);
    const { data: ps } = await svc.from('profiles').select('*').in('phone', ['0' + l10, l10, '20' + l10, '+20' + l10]).eq('role', 'customer').limit(2);
    if (!ps || ps.length !== 1) return R({ error: 'not_found' }, 404);
    const c = ps[0];
    const log = (a: string) => svc.from('audit_log').insert({ actor: u.user.id, action: a, details: { customer: c.id, phone: c.phone } }).then(() => {}, () => {});
    if (action === 'search') {
      const [{ data: orders }, { data: notes }, { data: au }, { data: pushes }] = await Promise.all([
        svc.from('orders').select('id,order_no,service_name_ar,package_name_ar,total,status,created_at,payment_confirmed_at,due_at').eq('user_id', c.id).order('created_at', { ascending: false }),
        svc.from('notifications').select('title,body,type,created_at').eq('user_id', c.id).order('created_at', { ascending: false }).limit(20),
        svc.auth.admin.getUserById(c.id),
        svc.from('push_subscriptions').select('id').eq('user_id', c.id),
      ]);
      const bu = (au?.user as any)?.banned_until;
      const banned = !!bu && new Date(bu) > new Date();
      const spent = (orders || []).filter((o: any) => o.status === 'completed').reduce((s: number, o: any) => s + Number(o.total), 0);
      return R({ profile: { id: c.id, full_name: c.full_name, phone: c.phone, created_at: c.created_at, member_level: c.member_level, banned, last_sign_in_at: au?.user?.last_sign_in_at || null, devices: (pushes || []).length }, orders: orders || [], notifications: notes || [], spent });
    }
    if (action === 'ban' || action === 'unban') {
      const { error } = await svc.auth.admin.updateUserById(c.id, { ban_duration: action === 'ban' ? '876000h' : 'none' });
      if (error) return R({ error: 'failed' }, 500);
      await svc.from('profiles').update({ banned: action === 'ban' }).eq('id', c.id);
      if (action === 'ban') await svc.from('push_subscriptions').delete().eq('user_id', c.id);
      await log(action === 'ban' ? 'customer_banned' : 'customer_unbanned');
      return R({ ok: true });
    }
    if (action === 'delete') {
      const { data: files } = await svc.storage.from('receipts').list(c.id, { limit: 1000 });
      if (files?.length) await svc.storage.from('receipts').remove(files.map((f: any) => c.id + '/' + f.name));
      const { data: os } = await svc.from('orders').select('id').eq('user_id', c.id);
      const ids = (os || []).map((o: any) => o.id);
      if (ids.length) await svc.from('audit_log').delete().in('order_id', ids);
      await svc.from('notifications').delete().eq('user_id', c.id);
      await svc.from('push_subscriptions').delete().eq('user_id', c.id);
      const { error: e1 } = await svc.from('orders').delete().eq('user_id', c.id);
      if (e1) return R({ error: 'failed', step: 'orders' }, 500);
      const { error: e2 } = await svc.auth.admin.deleteUser(c.id);
      if (e2) return R({ error: 'failed', step: 'user' }, 500);
      await svc.from('profiles').delete().eq('id', c.id);
      await log('customer_deleted');
      return R({ ok: true });
    }
    return R({ error: 'bad_input' }, 400);
  } catch (_e) { return R({ error: 'failed' }, 500); }
});
