// Store Plus shared code
const SUPABASE_URL = 'https://vwuicbxjnayszplhhoyg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KjT2ghlwKUAXxPAIVYlGlg_yRHwXSW3';
const VAPID_PUBLIC = 'BArEwzaAmdhS4K9x6Pij_4-a7QxhL0I6_YcCh-2ZYUvQcWYsGOwHlY5wKPukVxxAXhmKoKL9JsbkTumZb-fMcnM';
const SB = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// numbers always Western digits, isolated LTR so they never flip in RTL text
const num = (v) => `<bdi dir="ltr" class="num">${esc(v)}</bdi>`;
const money = (v) => `${num(Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }))} جنيه مصري`;
const dt = (s) => s ? new Date(s).toLocaleString('en-GB', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

const STATUS = {
  awaiting_payment: ['في انتظار الدفع', 'w'],
  proof_submitted: ['في انتظار مراجعة الدفع', 'w'],
  payment_confirmed: ['تم تأكيد الدفع', 'g'],
  in_progress: ['جاري التنفيذ', 'b'],
  completed: ['مكتمل', 'g'],
  rejected: ['مرفوض', 'r'],
  cancelled: ['ملغي', 'r'],
};
const badge = (st) => { const [t, c] = STATUS[st] || [st, 'b']; return `<span class="badge ${c}">${t}</span>`; };

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
  orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  support: '<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.5-2 2-5 2"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M17 5a3.5 3.5 0 010 7M22 20c0-2.5-1.5-4-4-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  out: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

// category art (self-drawn SVG)
const G = (k) => `<defs><linearGradient id="${k}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fd4ff"/><stop offset="1" stop-color="#2b5cff"/></linearGradient><linearGradient id="${k}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset="1" stop-color="#7a4dff"/></linearGradient><linearGradient id="${k}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd35a"/><stop offset="1" stop-color="#ff7a3d"/></linearGradient></defs>`;
const ART = {
  1: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<line x1="32" y1="6" x2="32" y2="14" stroke="#2fd4ff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="6" r="3.5" fill="#ffd35a"/><rect x="10" y="14" width="44" height="34" rx="12" fill="url(#${u}a)"/><rect x="16" y="22" width="32" height="18" rx="8" fill="#06142f"/><circle cx="25" cy="31" r="4" fill="#38f0ff"/><circle cx="39" cy="31" r="4" fill="#38f0ff"/><rect x="4" y="26" width="6" height="12" rx="3" fill="#7a4dff"/><rect x="54" y="26" width="6" height="12" rx="3" fill="#7a4dff"/><rect x="20" y="50" width="24" height="8" rx="4" fill="#2b5cff"/></svg>`,
  2: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<rect x="3" y="8" width="28" height="28" rx="8" fill="url(#${u}a)"/><path d="M17 14l7 10-7 8-7-8z" fill="#fff"/><rect x="33" y="6" width="28" height="28" rx="8" fill="url(#${u}b)"/><path d="M42 14l10 6-10 6z" fill="#fff"/><rect x="17" y="32" width="30" height="28" rx="8" fill="url(#${u}c)"/><path d="M26 52l14-14M36 38l4 4" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
  3: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<rect x="6" y="12" width="52" height="34" rx="8" fill="url(#${u}a)"/><rect x="11" y="17" width="42" height="24" rx="4" fill="#06142f"/><path d="M28 23l12 6-12 6z" fill="#ff5a7a"/><path d="M20 54h24" stroke="#7a8fcf" stroke-width="4" stroke-linecap="round"/><path d="M50 4l2 4 4 .6-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.6z" fill="#ffd35a"/></svg>`,
  4: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<path d="M14 20h36c7 0 10 6 11 16l1 10c.5 6-6 8-10 3l-6-7H18l-6 7c-4 5-10 3-10-3l1-10c1-10 4-16 11-16z" fill="url(#${u}a)"/><path d="M16 29v10M11 34h10" stroke="#06142f" stroke-width="3.5" stroke-linecap="round"/><circle cx="43" cy="30" r="3" fill="#ffd35a"/><circle cx="50" cy="36" r="3" fill="#ff5a7a"/><circle cx="36" cy="36" r="3" fill="#38e8a0"/><circle cx="52" cy="12" r="8" fill="url(#${u}c)"/></svg>`,
  5: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<circle cx="32" cy="30" r="22" fill="none" stroke="url(#${u}a)" stroke-width="4"/><ellipse cx="32" cy="30" rx="9" ry="22" fill="none" stroke="url(#${u}a)" stroke-width="3"/><path d="M10 30h44M14 18h36M14 42h36" stroke="url(#${u}a)" stroke-width="2.5"/><rect x="14" y="48" width="36" height="10" rx="5" fill="url(#${u}b)"/><circle cx="22" cy="53" r="2" fill="#fff"/><circle cx="29" cy="53" r="2" fill="#fff"/></svg>`,
  6: (u) => `<svg width="56" height="56" viewBox="0 0 64 64">${G(u)}<rect x="10" y="28" width="44" height="30" rx="6" fill="url(#${u}a)"/><rect x="6" y="20" width="52" height="12" rx="5" fill="url(#${u}b)"/><rect x="28" y="20" width="8" height="38" fill="#ffd35a"/><path d="M32 20c-4-12-18-12-14-4 2 4 14 4 14 4zM32 20c4-12 18-12 14-4-2 4-14 4-14 4z" fill="none" stroke="#ffd35a" stroke-width="3.5"/></svg>`,
};
const catArt = (id) => (ART[id] || ART[6])('c' + id);

const toast = (msg, bad) => { const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); };
const copyText = async (t) => { try { await navigator.clipboard.writeText(t); toast('تم النسخ'); } catch { toast('انسخ الرقم يدويًا', true); } };

async function getSettings() {
  const { data } = await SB.from('settings').select('key,value');
  const o = {}; (data || []).forEach((r) => (o[r.key] = r.value)); return o;
}
async function myProfile() {
  const { data: { user } } = await SB.auth.getUser();
  if (!user) return null;
  const { data } = await SB.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

// ---- Web Push ----
function b64u(s) { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = (s + p).replace(/-/g, '+').replace(/_/g, '/'); const r = atob(b); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }
async function enablePush(quiet) {
  const T = (m, b) => { if (!quiet) toast(m, b); };
  const C = window.Capacitor, PN = C && C.Plugins && C.Plugins.PushNotifications;
  if (C && C.isNativePlatform && C.isNativePlatform() && PN) {
    try {
      let st = await PN.checkPermissions(); if (st.receive !== 'granted') st = await PN.requestPermissions();
      if (st.receive !== 'granted') { T('لم يتم السماح بالإشعارات', true); return false; }
      try { await PN.createChannel({ id: 'sp_alert', name: 'إشعارات متجر بلس', description: 'إشعارات الطلبات والعروض', importance: 5, vibration: true, visibility: 1 }); } catch (e) {}
      await PN.removeAllListeners();
      PN.addListener('registration', async (t) => {
        const { data: { user } } = await SB.auth.getUser(); if (!user) return;
        const { error } = await SB.from('push_subscriptions').upsert({ user_id: user.id, endpoint: 'fcm:' + t.value, p256dh: 'fcm', auth: 'fcm' }, { onConflict: 'endpoint' });
        if (!error) T('تم تفعيل الإشعارات');
      });
      PN.addListener('pushNotificationActionPerformed', (a) => { const u = a.notification && a.notification.data && a.notification.data.url; if (u) location.hash = u.replace(/^.*#/, '#'); });
      await PN.register(); return true;
    } catch (e) { T('تعذر تفعيل الإشعارات', true); return false; }
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) { T('المتصفح لا يدعم الإشعارات. على الآيفون أضف التطبيق للشاشة الرئيسية أولًا', true); return false; }
  if (!VAPID_PUBLIC) { T('الإشعارات لم تُفعّل بعد من الخادم', true); return false; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { T('لم يتم السماح بالإشعارات', true); return false; }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { data: { user } } = await SB.auth.getUser();
  const { error } = await SB.from('push_subscriptions').upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
  if (error) { T('تعذر حفظ الاشتراك', true); return false; }
  T('تم تفعيل الإشعارات'); return true;
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
