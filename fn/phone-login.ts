import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const bad = () => new Response(JSON.stringify({ error: 'invalid' }), { status: 401, headers: cors });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { phone, password } = await req.json();
    const digits = String(phone || '').replace(/\D/g, ''); const l10 = digits.slice(-10);
    if (l10.length < 10 || !password) return bad();
    const url = Deno.env.get('SUPABASE_URL')!;
    const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: ps } = await svc.from('profiles').select('id').in('phone', ['0' + l10, l10, '20' + l10, '+20' + l10]).limit(2);
    if (!ps || ps.length !== 1) return bad();
    const { data: u } = await svc.auth.admin.getUserById(ps[0].id);
    if (!u?.user?.email) return bad();
    const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || (req.headers.get('apikey') || ''));
    const { data, error } = await anon.auth.signInWithPassword({ email: u.user.email, password });
    if (error || !data.session) return bad();
    return new Response(JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }), { headers: cors });
  } catch (_e) { return bad(); }
});
