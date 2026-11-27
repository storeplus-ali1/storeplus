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
    const { phone, password, full_name, discount } = await req.json();
    const l10 = String(phone || '').replace(/\D/g, '').slice(-10);
    const name = String(full_name || '').trim();
    const pct = Number(discount || 0);
    if (l10.length !== 10 || !/^1[0-9]{9}$/.test(l10) || String(password || '').length < 8 || name.length < 2 || !(pct >= 0 && pct <= 100)) return R({ error: 'bad_input' }, 400);
    const { data: ex } = await svc.from('profiles').select('id').in('phone', ['0' + l10, l10, '20' + l10, '+20' + l10]).limit(1);
    if (ex && ex.length) return R({ error: 'exists' }, 409);
    const { data: cu, error } = await svc.auth.admin.createUser({ email: 'scary01099283934+p' + l10 + '@gmail.com', password, email_confirm: true, user_metadata: { full_name: name, phone: '0' + l10 } });
    if (error || !cu?.user) return R({ error: /registered|exists/i.test(error?.message || '') ? 'exists' : 'failed' }, /registered|exists/i.test(error?.message || '') ? 409 : 500);
    if (pct > 0) await svc.from('customer_discounts').upsert({ user_id: cu.user.id, percent: pct });
    await svc.from('audit_log').insert({ actor: u.user.id, action: 'customer_created', details: { customer: cu.user.id, phone: '0' + l10, discount: pct } }).then(() => {}, () => {});
    return R({ ok: true, id: cu.user.id });
  } catch (_e) { return R({ error: 'failed' }, 500); }
});
