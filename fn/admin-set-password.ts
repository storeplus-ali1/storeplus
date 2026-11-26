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
    const { phone, password } = await req.json();
    const l10 = String(phone || '').replace(/\D/g, '').slice(-10);
    if (l10.length < 10 || String(password || '').length < 8) return R({ error: 'bad_input' }, 400);
    const { data: ps } = await svc.from('profiles').select('id,role').in('phone', ['0' + l10, l10, '20' + l10, '+20' + l10]).eq('role', 'customer').limit(2);
    if (!ps || ps.length !== 1) return R({ error: 'not_found' }, 404);
    const { error } = await svc.auth.admin.updateUserById(ps[0].id, { password });
    if (error) return R({ error: 'failed' }, 500);
    await svc.from('audit_log').insert({ actor_id: u.user.id, action: 'customer_password_reset', details: { customer: ps[0].id } }).then(() => {}, () => {});
    return R({ ok: true });
  } catch (_e) { return R({ error: 'failed' }, 500); }
});
