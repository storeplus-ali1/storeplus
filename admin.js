// Store Plus admin panel
const app = $('#app');
const ADMIN_EMAIL = 'scary01099283934+admin@gmail.com'; // login username "Ali Henish" maps to this
let ME = null, CATS = [], SVCS = [], PKGS = [];
const TYPES = { new_offer: 'عرض جديد', new_service: 'خدمة جديدة', discount: 'خصم', important: 'تنبيه مهم' };
const ACTS = { order_created: 'إنشاء الطلب', proof_submitted: 'رفع إثبات الدفع', payment_confirmed: 'تأكيد الدفع', payment_rejected: 'رفض إثبات الدفع', status_in_progress: 'بدء التنفيذ', status_completed: 'إكمال الطلب', status_cancelled: 'إلغاء الطلب', order_deleted: 'حذف طلب', broadcast_deleted: 'حذف إشعار', service_deleted: 'حذف خدمة', notifications_cleared: 'مسح كل الإشعارات', customer_banned: 'حظر عميل', customer_unbanned: 'إلغاء حظر عميل', customer_deleted: 'حذف عميل', customer_password_reset: 'تغيير كلمة مرور عميل', customer_created: 'إنشاء حساب عميل', customer_discount_set: 'تعديل خصم عميل' };
function nav(a) {
  const t = [['dash', 'الرئيسية', 'chart'], ['orders', 'الطلبات', 'orders'], ['services', 'الخدمات', 'tag'], ['customers', 'العملاء', 'users'], ['notify', 'الإشعارات', 'bell'], ['settings', 'الإعدادات', 'gear']];
  $('#nav').hidden = !ME;
  $('#nav').innerHTML = t.map(([k, l, i]) => `<a href="#/${k}" class="${a === k ? 'on' : ''}">${ic(i)}<span>${l}</span></a>`).join('');
}
const head = (t, back) => `<div class="hd">${back ? `<a class="ib" href="${back}">${ic('back')}</a>` : ''}<h1>${t}</h1></div>`;
const FN = SUPABASE_URL + '/functions/v1/push-flush';
async function flushPush() {
  try { const { data: { session } } = await SB.auth.getSession(); const r = await fetch(FN, { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: '{}' }); return r.ok; } catch { return false; }
}
const loading = () => (app.innerHTML = '<div class="empty">جاري التحميل...</div>');

function viewLogin() {
  $('#nav').hidden = true;
  app.innerHTML = `<div class="auth"><img class="logo" src="logo.png"><h1>لوحة إدارة متجر بلس</h1><p class="sub">دخول المشرف فقط</p>
  <form id="f" style="margin-top:18px"><label class="lbl">اسم المستخدم</label><input class="in" name="u" value="Ali Henish" autocomplete="username">
  <label class="lbl">كلمة المرور</label><input class="in ltr" type="password" name="p" autocomplete="current-password">
  <button class="btn" style="width:100%;margin-top:18px">دخول</button></form></div>`;
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    const email = e.target.u.value.trim() === 'Ali Henish' ? ADMIN_EMAIL : e.target.u.value.trim();
    const { error } = await SB.auth.signInWithPassword({ email, password: e.target.p.value });
    if (error) return toast('بيانات الدخول غير صحيحة', true);
    boot();
  };
}
async function loadCat() {
  const [c, s, p] = await Promise.all([SB.from('categories').select('*').order('sort'), SB.from('services').select('*').order('id'), SB.from('packages').select('*').order('sort')]);
  CATS = c.data || []; SVCS = s.data || []; PKGS = p.data || [];
}
async function boot() {
  const p = await myProfile();
  if (!p) return viewLogin();
  if (p.role !== 'admin') { await SB.auth.signOut(); viewLogin(); return toast('هذا الحساب ليس حساب مشرف', true); }
  ME = p; await loadCat(); route();
}

async function vDash() {
  nav('dash'); loading();
  const { data: o } = await SB.from('orders').select('id,order_no,status,total,created_at,service_name_ar,package_name_ar').order('created_at', { ascending: false });
  const { count: cu } = await SB.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer');
  const L = o || [], today = new Date().toDateString();
  const c = (f) => L.filter(f).length;
  const rev = L.filter((x) => ['payment_confirmed', 'in_progress', 'completed'].includes(x.status)).reduce((a, x) => a + Number(x.total), 0);
  app.innerHTML = `<div class="top"><button class="ib" id="out">${ic('out')}</button><img class="logo" src="logo.png"></div><h1>لوحة التحكم</h1><p class="sub">أهلاً ${esc(ME.full_name)}</p>
  <div class="stats" style="margin-top:12px">
  <div class="st"><small>طلبات اليوم</small><b>${num(c((x) => new Date(x.created_at).toDateString() === today))}</b></div>
  <div class="st w"><small>تنتظر مراجعة الدفع</small><b>${num(c((x) => x.status === 'proof_submitted'))}</b></div>
  <div class="st"><small>جاري التنفيذ</small><b>${num(c((x) => ['payment_confirmed', 'in_progress'].includes(x.status)))}</b></div>
  <div class="st g"><small>مكتملة</small><b>${num(c((x) => x.status === 'completed'))}</b></div>
  <div class="st"><small>إجمالي المبيعات المؤكدة</small><b style="font-size:16px">${money(rev)}</b></div>
  <div class="st"><small>العملاء</small><b>${num(cu || 0)}</b></div></div>
  <div class="sec"><b>أحدث الطلبات</b><a href="#/orders">عرض الكل</a></div>
  ${L.slice(0, 5).map(orderRow).join('') || '<div class="empty">لا توجد طلبات بعد</div>'}
  <div class="sec"><b>سجل العمليات</b><a href="#/audit">عرض الكل</a></div>`;
  $('#out').onclick = async () => { await SB.auth.signOut(); ME = null; viewLogin(); };
}
const orderRow = (o) => `<a class="row" href="#/order/${o.id}"><div class="t"><b>${num(o.order_no)}</b><em>${esc(o.service_name_ar)} - ${esc(o.package_name_ar)}</em></div><div class="p">${money(o.total)}<br>${badge(o.status)}</div></a>`;

let OFILT = 'all';
async function vOrders() {
  nav('orders'); loading();
  const { data } = await SB.from('orders').select('id,order_no,status,total,created_at,service_name_ar,package_name_ar').order('created_at', { ascending: false });
  const fl = [['all', 'الكل'], ['proof_submitted', 'مراجعة الدفع'], ['awaiting_payment', 'بانتظار الدفع'], ['payment_confirmed', 'تم تأكيد الدفع'], ['in_progress', 'جاري التنفيذ'], ['completed', 'مكتمل'], ['cancelled', 'ملغي']];
  const draw = () => {
    const L = (data || []).filter((o) => OFILT === 'all' || o.status === OFILT);
    $('#ol').innerHTML = L.map(orderRow).join('') || '<div class="empty">لا توجد طلبات</div>';
  };
  app.innerHTML = `${head('الطلبات')}<div class="search">${ic('search', 18)}<input id="q" placeholder="ابحث برقم الطلب"></div><div class="flt">${fl.map(([k, l]) => `<button data-k="${k}" class="${OFILT === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="ol"></div>`;
  $$('.flt button').forEach((b) => (b.onclick = () => { OFILT = b.dataset.k; $$('.flt button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  $('#q').oninput = (e) => { const v = e.target.value.trim().toLowerCase(); $('#ol').innerHTML = (data || []).filter((o) => o.order_no.toLowerCase().includes(v)).map(orderRow).join('') || '<div class="empty">لا نتائج</div>'; };
  draw();
}
async function vOrder(id) {
  nav('orders'); loading();
  const { data: o } = await SB.from('orders').select('*').eq('id', id).single();
  if (!o) return (location.hash = '#/orders');
  const [{ data: u }, { data: lg }] = await Promise.all([SB.from('profiles').select('full_name,phone,email').eq('id', o.user_id).single(), SB.from('audit_log').select('*').eq('order_id', id).order('created_at', { ascending: false })]);
  let rurl = '';
  if (o.receipt_path) { const r = await SB.storage.from('receipts').createSignedUrl(o.receipt_path, 600); rurl = r.data?.signedUrl || ''; }
  const fv = Object.entries(o.field_values || {});
  const act = [];
  if (o.status === 'proof_submitted') act.push(`<div class="sw"><button class="btn" id="ok">تأكيد الدفع</button><button class="btn r" id="no">رفض الإثبات</button></div>`);
  if (o.status === 'payment_confirmed') act.push(`<button class="btn" id="st1" data-s="in_progress">بدء التنفيذ</button>`);
  if (['payment_confirmed', 'in_progress'].includes(o.status)) act.push(`<button class="btn" id="st2" data-s="completed" style="margin-top:8px">تم التنفيذ</button>`);
  if (!['completed', 'cancelled'].includes(o.status)) act.push(`<button class="btn r" id="st3" data-s="cancelled" style="margin-top:8px">إلغاء الطلب</button>`);
  app.innerHTML = `${head('تفاصيل الطلب', '#/orders')}
  <div class="card"><div class="kv"><span>رقم الطلب</span><span>${num(o.order_no)}</span></div><div class="kv"><span>الحالة</span><span>${badge(o.status)}</span></div>
  <div class="kv"><span>الخدمة</span><span>${esc(o.service_name_ar)}</span></div><div class="kv"><span>الباقة</span><span>${esc(o.package_name_ar)}</span></div>
  ${Number(o.discount) > 0 ? `<div class="kv"><span>السعر قبل الكود</span><span>${money(o.price)}</span></div><div class="kv"><span>${o.discount_source === 'account' ? 'خصم الحساب' : 'كود الخصم ' + esc(o.promo_code)}</span><span>- ${money(o.discount)}</span></div>` : ''}<div class="kv"><span>الإجمالي</span><span>${money(o.total)}</span></div><div class="kv"><span>تاريخ الطلب</span><span>${num(dt(o.created_at))}</span></div>
  ${o.due_at ? `<div class="kv"><span>موعد التنفيذ المتوقع</span><span>${num(dt(o.due_at))}</span></div>` : ''}</div>
  <div class="card"><b>العميل</b><div class="kv"><span>الاسم</span><span>${esc(u?.full_name)}</span></div><div class="kv"><span>الهاتف</span><span>${num(u?.phone)}</span></div><div class="kv"><span>البريد</span><span class="ltr">${esc(u?.email)}</span></div></div>
  ${fv.length ? `<div class="card"><b>بيانات الطلب</b>${fv.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><span class="ltr">${esc(v)}</span></div>`).join('')}</div>` : ''}
  <div class="card"><b>إثبات الدفع</b>${rurl ? `<a href="${esc(rurl)}" target="_blank"><img class="recv" src="${esc(rurl)}" style="margin-top:8px"></a><div class="kv"><span>رقم العملية</span><span>${num(o.payment_ref || '-')}</span></div>` : '<div class="empty">لم يرفع العميل إثبات الدفع بعد</div>'}</div>
  <div class="card"><b>سجل الطلب</b>${(lg || []).map((l) => `<div class="kv"><span>${ACTS[l.action] || l.action}</span><span>${num(dt(l.created_at))}</span></div>`).join('') || '<div class="empty">لا توجد عمليات</div>'}</div>
  ${act.join('')}<button class="btn r" id="odel" style="margin-top:8px">حذف الطلب نهائياً</button>`;
  $('#odel').onclick = async () => { if (!confirm('حذف الطلب ' + o.order_no + ' نهائياً مع إشعاراته وإثبات الدفع؟ لا يمكن التراجع.')) return; const { data: rp, error } = await SB.rpc('admin_delete_order', { p_id: id }); if (error) return toast(error.message, true); if (rp) await SB.storage.from('receipts').remove([rp]); toast('تم حذف الطلب'); location.hash = '#/orders'; };
  const run = async (fn, m) => { const { error } = await fn(); if (error) return toast(error.message, true); toast(m); flushPush(); vOrder(id); };
  if ($('#ok')) $('#ok').onclick = () => confirm('تأكيد استلام المبلغ وبدء مدة الـ 24 ساعة؟') && run(() => SB.rpc('admin_confirm_payment', { p_order: id }), 'تم تأكيد الدفع');
  if ($('#no')) $('#no').onclick = () => { const n = prompt('سبب الرفض (يظهر للعميل)'); if (n !== null) run(() => SB.rpc('admin_reject_payment', { p_order: id, p_note: n }), 'تم رفض الإثبات'); };
  ['st1', 'st2', 'st3'].forEach((k) => $('#' + k) && ($('#' + k).onclick = () => confirm('تأكيد تغيير الحالة؟') && run(() => SB.rpc('admin_set_status', { p_order: id, p_status: $('#' + k).dataset.s }), 'تم تحديث الحالة')));
}

async function vServices() {
  nav('services'); await loadCat();
  app.innerHTML = `${head('الخدمات والباقات')}<button class="btn s" id="addS" style="margin-bottom:12px">${ic('plus', 18)} خدمة جديدة</button>` + SVCS.map((s) => `<a class="row" href="#/svc/${s.id}"><img src="${esc(s.image || 'logo.png')}"><div class="t"><b>${esc(s.name_ar)}</b><em>${esc(s.name_en)} - ${num(PKGS.filter((p) => p.service_id === s.id).length)} باقات</em></div><div class="p">${s.active ? '<span class="badge g">ظاهرة</span>' : '<span class="badge r">مخفية</span>'}</div></a>`).join('');
  $('#addS').onclick = async () => { const n = prompt('اسم الخدمة بالعربي'); if (!n) return; const e = prompt('الاسم بالإنجليزي') || n; const { data, error } = await SB.from('services').insert({ name_ar: n, name_en: e, category_id: CATS[0]?.id, active: false }).select().single(); if (error) return toast(error.message, true); location.hash = '#/svc/' + data.id; };
}
async function vSvc(id) {
  nav('services'); await loadCat();
  const s = SVCS.find((x) => x.id == id); if (!s) return (location.hash = '#/services');
  const ps = PKGS.filter((p) => p.service_id == id);
  app.innerHTML = `${head(esc(s.name_ar), '#/services')}
  <div class="card"><label class="lbl">صورة الخدمة</label><img id="simg" src="${esc(s.image || 'logo.png')}" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin:6px 0"><label class="btn o" style="display:block;text-align:center;cursor:pointer">اختيار صورة جديدة<input type="file" id="sfile" accept="image/*" hidden></label><div class="sub" id="smsg"></div></div>
  <div class="card"><label class="lbl">الاسم بالعربي</label><input class="in" id="na" value="${esc(s.name_ar)}"><label class="lbl">الاسم بالإنجليزي</label><input class="in ltr" id="ne" value="${esc(s.name_en)}">
  <label class="lbl">الوصف</label><textarea class="in" id="ds">${esc(s.description_ar)}</textarea>
  <label class="lbl">القسم</label><select class="in" id="ct">${CATS.map((c) => `<option value="${c.id}" ${c.id === s.category_id ? 'selected' : ''}>${esc(c.name_ar)}</option>`).join('')}</select>
  <label class="chk"><input type="checkbox" id="ac" ${s.active ? 'checked' : ''}> الخدمة ظاهرة للعملاء</label>
  <label class="chk"><input type="checkbox" id="ft" ${s.featured ? 'checked' : ''}> ضمن العروض المميزة</label>
  <button class="btn" id="sv" style="margin-top:12px">حفظ</button></div>
  <div class="sec"><b>الباقات</b></div>
  ${ps.map((p) => `<div class="card" data-p="${p.id}"><input class="in" value="${esc(p.name_ar)}" data-f="name_ar"><div class="sw" style="margin-top:8px"><input class="in ltr" type="number" value="${p.price}" data-f="price"><input class="in ltr" type="number" placeholder="السعر القديم" value="${p.old_price ?? ''}" data-f="old_price"></div>
  <label class="chk"><input type="checkbox" data-f="active" ${p.active ? 'checked' : ''}> ظاهرة</label><button class="btn s o psv">حفظ الباقة</button></div>`).join('')}
  <button class="btn o" id="addP">${ic('plus', 18)} باقة جديدة</button><button class="btn r" id="sdel" style="margin-top:24px">حذف الخدمة نهائياً</button>`;
  $('#sdel').onclick = async () => { if (!confirm('حذف خدمة ' + s.name_ar + ' وكل باقاتها نهائياً؟ الطلبات القديمة تبقى محفوظة بأسمائها.')) return; const { data, error } = await SB.rpc('admin_delete_service', { p_id: +id }); if (error) return toast(error.message, true); toast('تم حذف الخدمة وباقاتها' + (data ? ' (الطلبات المرتبطة: ' + data + ')' : '')); location.hash = '#/services'; };
  $('#sfile').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) return toast('اختر ملف صورة', true);
    $('#smsg').textContent = 'جاري رفع الصورة...';
    try {
      const bm = await createImageBitmap(f), k = Math.min(1, 900 / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
      const path = `svc-${id}-${Date.now()}.jpg`;
      const u = await SB.storage.from('service-images').upload(path, blob, { contentType: 'image/jpeg' });
      if (u.error) throw u.error;
      const url = SB.storage.from('service-images').getPublicUrl(path).data.publicUrl;
      const { error } = await SB.from('services').update({ image: url }).eq('id', id); if (error) throw error;
      $('#simg').src = url; $('#smsg').textContent = ''; toast('تم تغيير الصورة');
    } catch (err) { $('#smsg').textContent = ''; toast('تعذر رفع الصورة: ' + (err.message || err), true); }
  };
  $('#sv').onclick = async () => { const { error } = await SB.from('services').update({ name_ar: $('#na').value, name_en: $('#ne').value, description_ar: $('#ds').value, category_id: +$('#ct').value, active: $('#ac').checked, featured: $('#ft').checked }).eq('id', id); toast(error ? error.message : 'تم الحفظ', !!error); };
  $$('.psv').forEach((b) => (b.onclick = async () => { const c = b.closest('[data-p]'), v = {}; $$('[data-f]', c).forEach((i) => (v[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.dataset.f === 'name_ar' ? i.value : i.value === '' ? null : +i.value)); const { error } = await SB.from('packages').update(v).eq('id', c.dataset.p); toast(error ? error.message : 'تم حفظ الباقة', !!error); }));
  $('#addP').onclick = async () => { const n = prompt('اسم الباقة'); const pr = +prompt('السعر بالجنيه المصري'); if (!n || !(pr >= 0)) return; const { error } = await SB.from('packages').insert({ service_id: +id, name_ar: n, price: pr }); if (error) return toast(error.message, true); vSvc(id); };
}

async function admFn(name, body) {
  const { data: { session } } = await SB.auth.getSession();
  const r = await fetch(SUPABASE_URL + '/functions/v1/' + name, { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch (e) {} return { ok: r.ok, j };
}
async function vCustomers() {
  nav('customers'); loading();
  const { data } = await SB.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
  app.innerHTML = `${head('العملاء')}<div class="card"><h2>إنشاء حساب عميل</h2><label class="lbl">الاسم</label><input class="in" id="ncn"><label class="lbl">رقم الهاتف</label><input class="in ltr" id="ncp" inputmode="numeric" placeholder="01XXXXXXXXX"><label class="lbl">كلمة المرور (8 أحرف على الأقل)</label><input class="in ltr" id="ncw" autocomplete="off"><label class="lbl">خصم دائم على الحساب % (اختياري)</label><input class="in ltr" id="ncd" type="number" min="0" max="100" step="any" inputmode="decimal"><div style="height:12px"></div><button class="btn" id="ncb">إنشاء الحساب</button></div><div class="card"><h2>بحث برقم الهاتف</h2><input class="in ltr" id="sp" inputmode="numeric" placeholder="01XXXXXXXXX"><div style="height:12px"></div><button class="btn" id="sb">بحث</button></div><div id="cres"></div>` + ((data || []).map((u) => `<div class="row" data-ph="${esc(u.phone)}" style="cursor:pointer"><div class="t"><b>${esc(u.full_name)}</b><em><span class="ltr">${num(u.phone)}</span></em></div><div class="p">${num(dt(u.created_at).slice(0, 10))}</div></div>`).join('') || '<div class="empty">لا يوجد عملاء</div>');
  const find = async (ph) => {
    if (ph.replace(/\D/g, '').length < 10) return toast('أدخل رقم هاتف صحيح', true);
    $('#cres').innerHTML = '<div class="empty">جاري البحث...</div>';
    const { ok, j } = await admFn('admin-customer', { action: 'search', phone: ph });
    if (!ok) { $('#cres').innerHTML = ''; return toast(j.error === 'not_found' ? 'لا يوجد عميل بهذا الرقم' : 'تعذر البحث', true); }
    const p = j.profile; const { data: cd } = await SB.from('customer_discounts').select('percent').eq('user_id', p.id).maybeSingle(); const ST = { awaiting_payment: 'بانتظار الدفع', proof_submitted: 'تم رفع الإثبات', payment_confirmed: 'تم تأكيد الدفع', in_progress: 'قيد التنفيذ', completed: 'تم التسليم', rejected: 'مرفوض', cancelled: 'ملغي' };
    $('#cres').innerHTML = `<div class="card"><h2>${esc(p.full_name)} <span class="badge ${p.banned ? 'r' : 'g'}">${p.banned ? 'محظور' : 'نشط'}</span></h2>
    <div class="kv"><span>رقم الهاتف</span><span>${num(p.phone)}</span></div><div class="kv"><span>تاريخ التسجيل</span><span>${num(dt(p.created_at))}</span></div><div class="kv"><span>آخر دخول</span><span>${p.last_sign_in_at ? num(dt(p.last_sign_in_at)) : 'لم يدخل'}</span></div><div class="kv"><span>الأجهزة المفعّلة للإشعارات</span><span>${num(p.devices)}</span></div><div class="kv"><span>عدد الطلبات</span><span>${num(j.orders.length)}</span></div><div class="kv"><span>إجمالي المشتريات المسلّمة</span><span>${num(j.spent)} جنيه مصري</span></div>
    <p class="sub">المتجر يعمل بالدفع اليدوي عبر فودافون كاش لكل طلب، فلا توجد محفظة رصيد. كل المدفوعات ظاهرة في الطلبات.</p>
    <div style="height:10px"></div><button class="btn ${p.banned ? '' : 'r'}" id="bn">${p.banned ? 'إلغاء الحظر' : 'حظر العميل'}</button><div style="height:8px"></div><button class="btn r" id="dl">حذف الحساب نهائياً</button></div>
    <div class="card"><h2>خصم الحساب</h2><p class="sub">نسبة تُطبَّق تلقائيًا على كل طلبات هذا العميل. لو العميل أدخل كود خصم، يُطبَّق الأكبر فقط. اكتب 0 للإلغاء.</p><label class="lbl">نسبة الخصم %</label><input class="in ltr" id="dpc" type="number" min="0" max="100" step="any" inputmode="decimal" value="${cd ? Number(cd.percent) : 0}"><div style="height:12px"></div><button class="btn" id="dsv">حفظ الخصم</button></div><div class="card"><h2>تغيير كلمة المرور</h2><label class="lbl">كلمة المرور الجديدة (8 أحرف على الأقل)</label><input class="in ltr" id="rw" minlength="8"><div style="height:12px"></div><button class="btn" id="rb">حفظ كلمة المرور الجديدة</button></div>
    <div class="sec"><b>الطلبات</b></div>${j.orders.map((o) => `<a class="row" href="#/order/${o.id}"><div class="t"><b>${num(o.order_no)}</b><em>${esc(o.service_name_ar)} - ${esc(o.package_name_ar)}</em></div><div class="p">${num(o.total)} جنيه مصري<br><span class="sub">${ST[o.status] || o.status}</span></div></a>`).join('') || '<div class="empty">لا توجد طلبات</div>'}
    <div class="sec"><b>آخر الإشعارات</b></div>${j.notifications.map((n) => `<div class="card"><b>${esc(n.title)}</b><p class="sub">${esc(n.body)}</p><div class="sub">${num(dt(n.created_at))}</div></div>`).join('') || '<div class="empty">لا توجد إشعارات</div>'}`;
    $('#bn').onclick = async () => { const act = p.banned ? 'unban' : 'ban'; if (!confirm((p.banned ? 'إلغاء حظر ' : 'حظر ') + 'العميل صاحب الرقم ' + p.phone + '؟')) return; const r = await admFn('admin-customer', { action: act, phone: p.phone }); toast(r.ok ? (p.banned ? 'تم إلغاء الحظر' : 'تم حظر العميل') : 'تعذر التنفيذ', !r.ok); if (r.ok) find(p.phone); };
    $('#dl').onclick = async () => { if (!confirm('حذف حساب ' + p.full_name + ' وكل طلباته وإشعاراته نهائياً؟ لا يمكن التراجع.')) return; if (prompt('اكتب رقم الهاتف للتأكيد') !== p.phone) return toast('الرقم غير مطابق، لم يتم الحذف', true); const r = await admFn('admin-customer', { action: 'delete', phone: p.phone }); toast(r.ok ? 'تم حذف الحساب' : 'تعذر الحذف', !r.ok); if (r.ok) vCustomers(); };
    $('#rb').onclick = async () => { const pw = $('#rw').value; if (pw.length < 8) return toast('كلمة المرور 8 أحرف على الأقل', true); if (!confirm('تغيير كلمة مرور العميل صاحب الرقم ' + p.phone + '؟')) return; try { const r = await admFn('admin-set-password', { phone: p.phone, password: pw }); if (!r.ok) return toast('تعذر تغيير كلمة المرور', true); $('#rw').value = ''; toast('تم تغيير كلمة المرور. أبلغ العميل بها'); } catch (e) { toast('تعذر الاتصال', true); } };
    $('#dsv').onclick = async () => { const v = +$('#dpc').value || 0; if (v < 0 || v > 100) return toast('النسبة من 0 إلى 100', true); if (!confirm(v ? `تطبيق خصم ${v}% على كل طلبات ${p.full_name}؟` : 'إلغاء خصم الحساب؟')) return; const { error } = await SB.rpc('admin_set_discount', { p_user: p.id, p_percent: v }); toast(error ? error.message : 'تم حفظ الخصم', !!error); };
    $('#cres').scrollIntoView();
  };
  $('#sb').onclick = () => find($('#sp').value.trim());
  $('#ncb').onclick = async () => {
    const name = $('#ncn').value.trim(), ph = $('#ncp').value.trim(), pw = $('#ncw').value, dc = +$('#ncd').value || 0;
    if (name.length < 2) return toast('اكتب اسم العميل', true);
    if (!/^01[0-9]{9}$/.test(ph.replace(/\D/g, '').replace(/^20/, '0'))) return toast('رقم الهاتف غير صحيح', true);
    if (pw.length < 8) return toast('كلمة المرور 8 أحرف على الأقل', true);
    if (dc < 0 || dc > 100) return toast('نسبة الخصم من 0 إلى 100', true);
    if (!confirm(`إنشاء حساب للعميل ${name} برقم ${ph}${dc ? ' بخصم ' + dc + '%' : ''}؟`)) return;
    $('#ncb').disabled = true;
    const { ok, j } = await admFn('admin-create-customer', { full_name: name, phone: ph.replace(/\D/g, '').replace(/^20/, '0'), password: pw, discount: dc });
    $('#ncb').disabled = false;
    if (!ok) return toast(j.error === 'exists' ? 'الرقم مسجل بالفعل' : 'تعذر إنشاء الحساب', true);
    $('#ncw').value = ''; $('#ncn').value = ''; toast('تم إنشاء الحساب. سلّم الرقم وكلمة المرور للعميل.'); $('#sp').value = ph; $('#sb').onclick();
  };
  $$('[data-ph]').forEach((r) => (r.onclick = () => { $('#sp').value = r.dataset.ph; find(r.dataset.ph); }));
}

async function vNotify() {
  nav('notify');
  const [{ data: logs }, { data: cs }] = await Promise.all([SB.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(30), SB.from('profiles').select('id,full_name,phone').eq('role', 'customer').order('full_name')]);
  app.innerHTML = `${head('مركز الإشعارات')}
  <div class="card"><h2>إرسال إشعار جديد</h2>
  <label class="lbl">عنوان الإشعار</label><input class="in" id="t" maxlength="60">
  <label class="lbl">نص الإشعار</label><textarea class="in" id="b" maxlength="200"></textarea>
  <label class="lbl">نوع الإشعار</label><select class="in" id="ty">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
  <label class="lbl">المستلمون</label><select class="in" id="rc"><option value="all">كل العملاء</option><option value="sel">عملاء محددون</option></select>
  <div id="pick" hidden style="max-height:180px;overflow:auto;margin-top:8px">${(cs || []).map((c) => `<label class="chk"><input type="checkbox" value="${c.id}"> ${esc(c.full_name)} <span class="sub">${num(c.phone)}</span></label>`).join('') || '<div class="empty">لا يوجد عملاء</div>'}</div>
  <label class="lbl">الصفحة التي تفتح عند الضغط</label><select class="in" id="ur"><option value="#/">الرئيسية</option><option value="#/notifications">الإشعارات</option><option value="#/orders">طلباتي</option>${SVCS.filter((s) => s.active).map((s) => `<option value="#/service/${s.id}">خدمة: ${esc(s.name_ar)}</option>`).join('')}</select>
  <label class="lbl">معاينة</label><div class="pv"><img src="icons/icon-192.png"><div><b id="pt">عنوان الإشعار</b><p id="pb">نص الإشعار</p></div></div>
  <button class="btn" id="go" style="margin-top:14px">${ic('send', 18)} مراجعة وإرسال</button></div>
  <div class="sec"><b>سجل الإشعارات المرسلة</b>${(logs || []).length ? '<button class="btn s r" id="clr">مسح الكل</button>' : ''}</div>
  ${(logs || []).map((l) => `<div class="card"><b>${esc(l.title)}</b><p class="sub">${esc(l.body)}</p><button class="btn s r bdel" data-b="${l.id}" style="margin:6px 0">حذف هذا الإشعار</button><div class="kv"><span>النوع</span><span>${TYPES[l.type] || l.type}</span></div><div class="kv"><span>التاريخ</span><span>${num(dt(l.created_at))}</span></div><div class="kv"><span>عدد المستلمين</span><span>${num(l.recipients)}</span></div><div class="kv"><span>الحالة</span><span><span class="badge ${l.push_status === 'failed' ? 'r' : 'g'}">${l.push_status === 'failed' ? 'فشل (لا توجد أجهزة مفعّلة أو رُفضت)' : l.push_status === 'accepted' ? 'قبلتها خدمة الإشعارات (' + l.push_ok + ' جهاز، فشل ' + l.push_failed + ')' : 'تم الحفظ - بانتظار الإرسال'}</span></span></div></div>`).join('') || '<div class="empty">لم يتم إرسال إشعارات بعد</div>'}
  <p class="sub">ملاحظة: الحالة تعني أن خدمة الإشعارات قبلت الرسالة أو رفضتها، ولا تعني أن العميل فتحها. على الآيفون تصل الإشعارات فقط بعد إضافة التطبيق للشاشة الرئيسية.</p>`;
  $('#t').oninput = () => ($('#pt').textContent = $('#t').value || 'عنوان الإشعار');
  $('#b').oninput = () => ($('#pb').textContent = $('#b').value || 'نص الإشعار');
  $('#rc').onchange = () => ($('#pick').hidden = $('#rc').value !== 'sel');
  if ($('#clr')) $('#clr').onclick = async () => { if (!confirm('مسح كل الإشعارات المرسلة وسجلها من كل العملاء؟ لا يمكن التراجع.')) return; const { error } = await SB.rpc('admin_clear_notifications'); if (error) return toast(error.message, true); toast('تم مسح كل الإشعارات'); vNotify(); };
  $$('.bdel').forEach((b) => (b.onclick = async () => { if (!confirm('حذف هذا الإشعار من سجل الإرسال ومن إشعارات العملاء؟')) return; const { error } = await SB.rpc('admin_delete_broadcast', { p_id: +b.dataset.b }); if (error) return toast(error.message, true); toast('تم حذف الإشعار'); vNotify(); }));
  $('#go').onclick = async () => {
    const t = $('#t').value.trim(), b = $('#b').value.trim(); if (!t || !b) return toast('اكتب العنوان والنص', true);
    const users = $('#rc').value === 'sel' ? $$('#pick input:checked').map((i) => i.value) : null;
    if (users && !users.length) return toast('اختر عميلًا واحدًا على الأقل', true);
    if (!confirm(`سيتم إرسال "${t}" إلى ${users ? users.length + ' عميل' : 'كل العملاء'}. تأكيد الإرسال؟`)) return;
    const { error } = await SB.rpc('admin_broadcast', { p_title: t, p_body: b, p_type: $('#ty').value, p_users: users, p_url: $('#ur').value });
    if (error) return toast(error.message, true); toast('جاري إرسال الإشعار...'); await flushPush(); toast('تم إرسال الإشعار'); vNotify();
  };
}

async function vSettings() {
  nav('settings'); const S = await getSettings();
  const f = [['wallet_number', 'رقم محفظة فودافون كاش'], ['support_whatsapp', 'رقم واتساب خدمة العملاء (بالصيغة الدولية)'], ['execution_hours', 'مدة التنفيذ بالساعات']];
  app.innerHTML = `${head('الإعدادات')}<div class="card">${f.map(([k, l]) => `<label class="lbl">${l}</label><input class="in ltr" data-k="${k}" value="${esc(S[k])}">`).join('')}<button class="btn" id="sv" style="margin-top:14px">حفظ الإعدادات</button></div>
  <a class="btn o" href="#/promos" style="margin-bottom:10px">أكواد الخصم</a><a class="btn o" href="#/update" style="margin-bottom:10px">تنبيه تحديث التطبيق</a><a class="btn o" href="#/audit" style="margin-bottom:10px">سجل العمليات</a><button class="btn r" id="out">تسجيل الخروج</button>`;
  $('#sv').onclick = async () => { for (const i of $$('[data-k]')) { const { error } = await SB.from('settings').upsert({ key: i.dataset.k, value: i.value.trim(), updated_at: new Date().toISOString() }); if (error) return toast(error.message, true); } toast('تم حفظ الإعدادات'); };
  $('#out').onclick = async () => { await SB.auth.signOut(); ME = null; viewLogin(); };
}
async function vPromos() {
  nav('settings'); loading();
  const [{ data: cs }, { data: os }] = await Promise.all([SB.from('promo_codes').select('*').order('created_at', { ascending: false }), SB.from('orders').select('promo_code,status').not('promo_code', 'is', null)]);
  const used = {}; (os || []).filter((o) => !['cancelled', 'rejected'].includes(o.status)).forEach((o) => (used[o.promo_code] = (used[o.promo_code] || 0) + 1));
  const val = (c) => (c.kind === 'percent' ? num(Number(c.value) + '%') : money(c.value));
  app.innerHTML = `${head('أكواد الخصم', '#/settings')}
  <div class="card"><h2>كود جديد</h2>
  <label class="lbl">الكود (حروف إنجليزية وأرقام)</label><input class="in ltr" id="pcode" maxlength="32" autocapitalize="characters" style="text-transform:uppercase">
  <label class="lbl">نوع الخصم</label><select class="in" id="pk"><option value="percent">نسبة مئوية %</option><option value="fixed">مبلغ ثابت بالجنيه</option></select>
  <label class="lbl">قيمة الخصم</label><input class="in ltr" id="pv" type="number" min="1" step="any" inputmode="decimal">
  <label class="lbl">أقصى عدد استخدامات (اتركه فارغًا لغير محدود)</label><input class="in ltr" id="pm" type="number" min="1" inputmode="numeric">
  <label class="lbl">عدد مرات الاستخدام لكل عميل</label><input class="in ltr" id="pu" type="number" min="1" value="1" inputmode="numeric">
  <label class="lbl">أقل سعر باقة (اختياري)</label><input class="in ltr" id="pn" type="number" min="0" inputmode="decimal">
  <label class="lbl">تاريخ الانتهاء (اختياري)</label><input class="in ltr" id="pe" type="date">
  <button class="btn" id="padd" style="margin-top:12px">إضافة الكود</button></div>
  <div class="sec"><b>الأكواد الحالية</b></div>
  ${(cs || []).map((c) => `<div class="card"><b class="ltr">${esc(c.code)}</b> <span class="badge ${c.active ? 'g' : 'r'}">${c.active ? 'مفعّل' : 'متوقف'}</span>
  <div class="kv"><span>الخصم</span><span>${val(c)}</span></div><div class="kv"><span>الاستخدامات</span><span>${num(used[c.code] || 0)}${c.max_uses ? ' / ' + num(c.max_uses) : ''}</span></div>
  <div class="kv"><span>لكل عميل</span><span>${num(c.per_user_limit)}</span></div>${Number(c.min_total) > 0 ? `<div class="kv"><span>أقل سعر باقة</span><span>${money(c.min_total)}</span></div>` : ''}${c.expires_at ? `<div class="kv"><span>ينتهي</span><span>${num(dt(c.expires_at))}</span></div>` : ''}
  <div class="sw" style="margin-top:8px"><button class="btn s o ptg" data-i="${c.id}" data-a="${c.active}">${c.active ? 'إيقاف' : 'تفعيل'}</button><button class="btn s r pdl" data-i="${c.id}" data-c="${esc(c.code)}">حذف</button></div></div>`).join('') || '<div class="empty">لا توجد أكواد بعد</div>'}`;
  $('#padd').onclick = async () => {
    const code = $('#pcode').value.trim().toUpperCase(), v = +$('#pv').value, k = $('#pk').value;
    if (!/^[A-Z0-9_-]{2,32}$/.test(code)) return toast('الكود حروف إنجليزية وأرقام فقط', true);
    if (!(v > 0) || (k === 'percent' && v > 100)) return toast('قيمة الخصم غير صحيحة', true);
    const row = { code, kind: k, value: v, per_user_limit: +$('#pu').value || 1, min_total: +$('#pn').value || 0, max_uses: $('#pm').value ? +$('#pm').value : null, expires_at: $('#pe').value ? new Date($('#pe').value + 'T23:59:59').toISOString() : null };
    if (!confirm(`إضافة الكود ${code} بخصم ${k === 'percent' ? v + '%' : v + ' جنيه'}؟`)) return;
    const { error } = await SB.from('promo_codes').insert(row); if (error) return toast(/duplicate|unique/.test(error.message) ? 'الكود موجود بالفعل' : error.message, true);
    toast('تمت إضافة الكود'); vPromos();
  };
  $$('.ptg').forEach((b) => (b.onclick = async () => { const { error } = await SB.from('promo_codes').update({ active: b.dataset.a !== 'true' }).eq('id', +b.dataset.i); if (error) return toast(error.message, true); vPromos(); }));
  $$('.pdl').forEach((b) => (b.onclick = async () => { if (!confirm('حذف الكود ' + b.dataset.c + '؟ الطلبات القديمة تبقى كما هي.')) return; const { error } = await SB.from('promo_codes').delete().eq('id', +b.dataset.i); if (error) return toast(error.message, true); vPromos(); }));
}

async function vUpdate() {
  nav('settings'); const S = await getSettings();
  app.innerHTML = `${head('تنبيه تحديث التطبيق', '#/settings')}<div class="card">
  <p class="sub">بعد نشر نسخة جديدة، اكتب رقمها هنا. العملاء اللي نسختهم أقدم هتظهر لهم نافذة التحديث على الشاشة الرئيسية. لإيقاف التنبيه اكتب 0.</p>
  <label class="lbl">رقم النسخة الجديدة</label><input class="in ltr" id="ub" type="number" min="0" inputmode="numeric" value="${esc(S.update_build || 0)}">
  <label class="lbl">عنوان النافذة</label><input class="in" id="ut" maxlength="60" value="${esc(S.update_title || 'يتوفر تحديث جديد')}">
  <label class="lbl">نص النافذة</label><textarea class="in" id="ux" maxlength="300">${esc(S.update_text || '')}</textarea>
  <label class="lbl">رابط التحديث (المتجر أو رابط التحميل)</label><input class="in ltr" id="ul" value="${esc(S.update_url || '')}">
  <button class="btn" id="usv" style="margin-top:14px">حفظ ونشر التنبيه</button></div>`;
  $('#usv').onclick = async () => {
    const b = Math.max(0, parseInt($('#ub').value, 10) || 0), u = $('#ul').value.trim();
    if (b > 0 && !/^https:\/\//.test(u)) return toast('الرابط لازم يبدأ بـ https://', true);
    if (!confirm(b ? `نشر تنبيه التحديث للنسخة ${b}؟ هيظهر للعملاء اللي نسختهم أقدم.` : 'إيقاف تنبيه التحديث؟')) return;
    for (const [k, v] of [['update_build', String(b)], ['update_title', $('#ut').value.trim()], ['update_text', $('#ux').value.trim()], ['update_url', u]]) { const { error } = await SB.from('settings').upsert({ key: k, value: v, updated_at: new Date().toISOString() }); if (error) return toast(error.message, true); }
    toast('تم الحفظ');
  };
}

async function vAudit() {
  nav('settings'); loading();
  const { data } = await SB.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
  const ids = [...new Set((data || []).map((x) => x.order_id).filter(Boolean))];
  const { data: os } = ids.length ? await SB.from('orders').select('id,order_no').in('id', ids) : { data: [] };
  const m = Object.fromEntries((os || []).map((o) => [o.id, o.order_no]));
  app.innerHTML = `${head('سجل العمليات', '#/settings')}` + ((data || []).map((l) => `<div class="card"><b>${ACTS[l.action] || l.action}</b><div class="kv"><span>الطلب</span><span>${num(m[l.order_id] || '-')}</span></div><div class="kv"><span>الوقت</span><span>${num(dt(l.created_at))}</span></div></div>`).join('') || '<div class="empty">لا توجد عمليات بعد</div>');
}

function route() {
  if (!ME) return viewLogin();
  const p = (location.hash.replace(/^#/, '') || '/dash').split('/').filter(Boolean);
  const k = p[0] || 'dash';
  ({ dash: vDash, orders: vOrders, order: () => vOrder(p[1]), services: vServices, svc: () => vSvc(p[1]), customers: vCustomers, notify: vNotify, settings: vSettings, promos: vPromos, update: vUpdate, audit: vAudit }[k] || vDash)();
}
window.addEventListener('hashchange', route);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
