// Store Plus customer app
const app = $('#app');
let ME = null, SETTINGS = {}, CATS = [], SERVICES = [], PKGS = [], UNREAD = 0;
let SUPPORT_CTX = '';

const logoTop = () => `<div class="top"><a class="ib" href="#/notifications">${ic('bell')}${UNREAD ? `<span class="dot">${UNREAD > 9 ? '9+' : UNREAD}</span>` : ''}</a><img class="logo" src="logo.png" alt="متجر بلس"></div>`;
const minPrice = (sid) => { const p = PKGS.filter((x) => x.service_id === sid); return p.length ? Math.min(...p.map((x) => Number(x.price))) : null; };
const svcCard = (s) => `<a class="svc" href="#/service/${s.id}"><img src="${esc(s.image || 'logo.png')}" alt="" loading="lazy"><b>${esc(s.name_ar)}</b><em>${esc(s.name_en)}</em><div class="p">من ${money(minPrice(s.id) ?? 0)}</div></a>`;

function navBar(active) {
  const wa = waLink();
  $('#nav').hidden = !ME;
  $('#nav').innerHTML = `
  <a href="#/" class="${active === 'home' ? 'on' : ''}">${ic('home')}<span>الرئيسية</span></a>
  <a href="#/orders" class="${active === 'orders' ? 'on' : ''}">${ic('orders')}<span>طلباتي</span></a>
  <a href="${wa}" target="_blank" rel="noopener" class="cs"><i>${ic('support', 24)}</i><span>خدمة العملاء</span></a>
  <a href="#/notifications" class="${active === 'notif' ? 'on' : ''}">${ic('bell')}<span>الإشعارات</span></a>
  <a href="#/account" class="${active === 'account' ? 'on' : ''}">${ic('user')}<span>حسابي</span></a>`;
}
function waLink(orderNo) {
  const n = (SETTINGS.support_whatsapp || '201064774759').replace(/\D/g, '');
  const msg = orderNo ? `مرحبًا، أريد الاستفسار عن الطلب رقم ${orderNo}` : 'مرحبًا، أحتاج مساعدة في متجر بلس';
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}

async function loadCatalog() {
  const [c, s, p] = await Promise.all([
    SB.from('categories').select('*').eq('active', true).order('sort'),
    SB.from('services').select('*').eq('active', true).order('id', { ascending: false }),
    SB.from('packages').select('*').eq('active', true).order('sort'),
  ]);
  CATS = c.data || []; SERVICES = s.data || []; PKGS = p.data || [];
}
async function refreshUnread() {
  if (!ME) return;
  const { count } = await SB.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', ME.id).eq('read', false);
  UNREAD = count || 0;
}

// ---------- auth ----------
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function viewAuth(mode = (location.hash === '#/signup' ? 'signup' : 'login')) {
  $('#nav').hidden = true;
  app.innerHTML = `<div class="auth"><div class="hero"><img class="logo" src="logo.png" alt=""><h1>أهلاً بك في متجر بلس</h1><div class="sub">خدماتك الرقمية بأفضل الأسعار، وتتبع طلبك لحظة بلحظة</div>
  <div class="mq"><div class="tr"><div class="lc" style="--c:#e50914" title="Netflix"><span><img class="" src="brands/netflix.svg" alt=""></span></div><div class="lc" style="--c:#00a8e1" title="Prime"><span><img class="" src="brands/primevideo.svg" alt=""></span></div><div class="lc" style="--c:#00c389" title="Shahid"><span><i>Sh</i></span></div><div class="lc" style="--c:#7b61ff" title="Gemini"><span><img class="" src="brands/googlegemini.svg" alt=""></span></div><div class="lc" style="--c:#9fb0d8" title="CapCut"><span><i>Ca</i></span></div><div class="lc w" style="--c:#fff" title="Canva"><span><img class="fc" src="brands/c-canva.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="WE"><span><img class="fc" src="brands/c-we.svg" alt=""></span></div><div class="lc" style="--c:#e60000" title="Vodafone"><span><img class="" src="brands/vodafone.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="Orange"><span><img class="fc" src="brands/c-orange.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="Etisalat"><span><img class="fc" src="brands/c-etisalat.svg" alt=""></span></div><div class="lc" style="--c:#f2a900" title="PUBG"><span><img class="" src="brands/pubg.svg" alt=""></span></div><div class="lc" style="--c:#2f7bff" title="eFootball"><span><img class="" src="brands/konami.svg" alt=""></span></div><div class="lc" style="--c:#00d2ff" title="EA FC"><span><img class="" src="brands/ea.svg" alt=""></span></div><div class="lc" style="--c:#ff6a00" title="Free Fire"><span><i>Fr</i></span></div><div class="lc" style="--c:#8aa0b8" title="CoD M"><span><img class="" src="brands/activision.svg" alt=""></span></div><div class="lc" style="--c:#e50914" title="Netflix"><span><img class="" src="brands/netflix.svg" alt=""></span></div><div class="lc" style="--c:#00a8e1" title="Prime"><span><img class="" src="brands/primevideo.svg" alt=""></span></div><div class="lc" style="--c:#00c389" title="Shahid"><span><i>Sh</i></span></div><div class="lc" style="--c:#7b61ff" title="Gemini"><span><img class="" src="brands/googlegemini.svg" alt=""></span></div><div class="lc" style="--c:#9fb0d8" title="CapCut"><span><i>Ca</i></span></div><div class="lc w" style="--c:#fff" title="Canva"><span><img class="fc" src="brands/c-canva.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="WE"><span><img class="fc" src="brands/c-we.svg" alt=""></span></div><div class="lc" style="--c:#e60000" title="Vodafone"><span><img class="" src="brands/vodafone.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="Orange"><span><img class="fc" src="brands/c-orange.svg" alt=""></span></div><div class="lc w" style="--c:#fff" title="Etisalat"><span><img class="fc" src="brands/c-etisalat.svg" alt=""></span></div><div class="lc" style="--c:#f2a900" title="PUBG"><span><img class="" src="brands/pubg.svg" alt=""></span></div><div class="lc" style="--c:#2f7bff" title="eFootball"><span><img class="" src="brands/konami.svg" alt=""></span></div><div class="lc" style="--c:#00d2ff" title="EA FC"><span><img class="" src="brands/ea.svg" alt=""></span></div><div class="lc" style="--c:#ff6a00" title="Free Fire"><span><i>Fr</i></span></div><div class="lc" style="--c:#8aa0b8" title="CoD M"><span><img class="" src="brands/activision.svg" alt=""></span></div></div></div>
  <div class="chips"><span>${ic('bell', 16)} إشعارات فورية</span><span>${ic('check', 16)} تأكيد الدفع</span><span>${ic('clock', 16)} تنفيذ خلال 24 ساعة</span></div></div>
  <div class="tabs" style="margin-top:18px"><button class="${mode === 'login' ? 'on' : ''}" id="t1">تسجيل الدخول</button><button class="${mode === 'signup' ? 'on' : ''}" id="t2">حساب جديد</button></div>
  <form id="f">
  ${mode === 'signup' ? `<label class="lbl">رقم الهاتف</label><input class="in ltr" name="phone" required inputmode="numeric" pattern="01[0-9]{9}" placeholder="01XXXXXXXXX" autocomplete="tel">
  <label class="lbl">الاسم الثلاثي</label><input class="in" name="name" required minlength="6" autocomplete="name">` : ''}
  <label class="lbl">حساب Gmail</label><input class="in ltr" type="email" name="email" required autocomplete="email">
  <label class="lbl">كلمة المرور</label><input class="in ltr" type="password" name="pw" required minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
  <div style="height:16px"></div><button class="btn" type="submit">${mode === 'login' ? 'دخول' : 'إنشاء الحساب'}</button>
  ${mode === 'login' ? '<div style="height:12px"></div><button class="btn o s" type="button" id="forgot">نسيت كلمة المرور؟</button>' : ''}
  </form></div>`;
  $('#t1').onclick = () => viewAuth('login'); $('#t2').onclick = () => viewAuth('signup');
  const f = $('#f');
  f.onsubmit = async (e) => {
    e.preventDefault(); try { if (!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) && 'Notification' in window && Notification.permission === 'default' && !(isIOS && !isStandalone)) await Notification.requestPermission(); } catch (e2) {} const d = Object.fromEntries(new FormData(f)); const b = f.querySelector('button[type=submit]'); b.disabled = true;
    if (mode === 'login') {
      const { error } = await SB.auth.signInWithPassword({ email: d.email.trim(), password: d.pw });
      if (error) { toast('البريد أو كلمة المرور غير صحيحة', true); b.disabled = false; return; }
    } else {
      const { data, error } = await SB.auth.signUp({ email: d.email.trim(), password: d.pw, options: { data: { full_name: d.name.trim(), phone: d.phone.trim() } } });
      if (error) { toast(/already|registered|Database error/i.test(error.message) ? 'البريد أو رقم الهاتف مسجل من قبل' : 'تعذر إنشاء الحساب: ' + error.message, true); b.disabled = false; return; }
      if (!data.session) { app.innerHTML = '<div class="auth"><h1>تحقق من بريدك</h1><div class="sub">أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتحه ثم سجّل الدخول.</div></div>'; return; }
    }
    await boot();
  };
  const fg = $('#forgot');
  if (fg) fg.onclick = async () => {
    const email = f.email.value.trim(); if (!email) return toast('اكتب بريدك أولًا', true);
    await SB.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    toast('إن كان البريد مسجلًا فسيصلك رابط الاستعادة');
  };
}
function viewRecovery() {
  $('#nav').hidden = true;
  app.innerHTML = `<div class="auth"><img class="logo" src="logo.png" alt=""><h1>كلمة مرور جديدة</h1><form id="f"><label class="lbl">كلمة المرور الجديدة</label><input class="in ltr" type="password" name="pw" minlength="8" required><div style="height:16px"></div><button class="btn">حفظ</button></form></div>`;
  $('#f').onsubmit = async (e) => { e.preventDefault(); const { error } = await SB.auth.updateUser({ password: e.target.pw.value }); if (error) return toast(error.message, true); toast('تم تغيير كلمة المرور'); location.hash = '#/'; await boot(); };
}

// ---------- views ----------
async function viewHome() {
  navBar('home');
  const first = (ME.full_name || '').split(' ')[0];
  const offers = PKGS.filter((p) => p.old_price && Number(p.old_price) > Number(p.price));
  const latest = SERVICES.slice(0, 8);
  const most = [...SERVICES].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 6);
  app.innerHTML = `${logoTop()}
  <h1>أهلاً بك، ${esc(ME.full_name)}</h1><div class="sub">اختر الخدمة اللي تناسبك واطلبها في دقايق</div>
  <div class="search">${ic('search', 20)}<input id="q" placeholder="ابحث عن خدمة..."></div>
  <div id="res"></div>
  <div class="sec"><b>أقسام الخدمات</b></div>
  <div class="cats">${CATS.map((c) => `<a class="cat" href="#/cat/${c.id}"><i>${catArt(c.id)}</i>${esc(c.name_ar)}</a>`).join('')}</div>
  <div class="sec"><b>العروض والخصومات المميزة</b></div>
  ${offers.length ? `<div class="hs">${offers.map((p) => { const s = SERVICES.find((x) => x.id === p.service_id); if (!s) return ''; const pc = Math.round((1 - p.price / p.old_price) * 100); return `<a class="offer" href="#/service/${s.id}"><small>خصم ${num(pc + '%')}</small><h3>${esc(s.name_ar)} – ${esc(p.name_ar)}</h3><div class="pr">${money(p.price)}<s>${money(p.old_price)}</s></div></a>`; }).join('')}</div>` : '<div class="empty">لا توجد عروض حاليًا</div>'}
  <div class="sec"><b>أحدث الخدمات المضافة</b></div><div class="hs">${latest.map(svcCard).join('')}</div>
  <div class="sec"><b>الخدمات الأكثر طلبًا</b></div><div class="grid2">${most.map(svcCard).join('')}</div>`;
  $('#q').oninput = (e) => {
    const t = e.target.value.trim().toLowerCase(); const r = $('#res');
    if (!t) { r.innerHTML = ''; return; }
    const m = SERVICES.filter((s) => (s.name_ar + ' ' + s.name_en).toLowerCase().includes(t));
    r.innerHTML = m.length ? `<div class="grid2">${m.map(svcCard).join('')}</div>` : '<div class="empty">لا توجد نتائج</div>';
  };
}
function viewCat(id) {
  navBar('home'); const c = CATS.find((x) => x.id == id); const l = SERVICES.filter((s) => s.category_id == id);
  app.innerHTML = `<div class="hd"><a class="ib" href="#/">${ic('back')}</a><h1>${esc(c ? c.name_ar : 'القسم')}</h1></div>${l.length ? `<div class="grid2">${l.map(svcCard).join('')}</div>` : '<div class="empty">لا توجد خدمات في هذا القسم حاليًا</div>'}`;
}
let SEL = null;
function viewService(id) {
  navBar('home'); const s = SERVICES.find((x) => x.id == id); if (!s) return (location.hash = '#/');
  const pk = PKGS.filter((p) => p.service_id === s.id); if (!SEL || SEL.sid !== s.id) SEL = { sid: s.id, pid: pk[0]?.id };
  app.innerHTML = `<div class="hd"><a class="ib" href="javascript:goBack()">${ic('back')}</a><h1>تفاصيل الخدمة</h1></div>
  <div class="card" style="text-align:center"><img src="${esc(s.image || 'logo.png')}" style="width:100%;border-radius:14px;margin-bottom:10px"><h1>${esc(s.name_ar)}</h1><div class="sub ltr" style="text-align:center">${esc(s.name_en)}</div></div>
  <div class="card"><b style="font-size:14px">الوصف</b><div class="sub" style="font-size:12px;margin-top:6px">${esc(s.description_ar || '')}</div></div>
  <div class="sec"><b>الباقات المتاحة</b></div>
  <div id="pks">${pk.map((p) => `<div class="pk ${SEL.pid === p.id ? 'sel' : ''}" data-id="${p.id}"><span>${esc(p.name_ar)}</span><span>${p.old_price ? `<s>${money(p.old_price)}</s>` : ''}${money(p.price)}</span></div>`).join('')}</div>
  <div class="sub" style="margin:8px 0 14px">${ic('clock', 14)} مدة التنفيذ المتوقعة: خلال ${num(SETTINGS.execution_hours || 24)} ساعة من تأكيد الدفع</div>
  <button class="btn" id="go">اطلب الخدمة</button>`;
  $$('#pks .pk').forEach((e) => (e.onclick = () => { SEL.pid = +e.dataset.id; $$('#pks .pk').forEach((x) => x.classList.toggle('sel', x === e)); }));
  $('#go').onclick = () => (location.hash = `#/order/${s.id}/${SEL.pid}`);
}
function viewOrderForm(sid, pid) {
  navBar('home'); const s = SERVICES.find((x) => x.id == sid), p = PKGS.find((x) => x.id == pid); if (!s || !p) return (location.hash = '#/');
  const fields = s.fields || [];
  app.innerHTML = `<div class="hd"><a class="ib" href="javascript:goBack()">${ic('back')}</a><h1>مراجعة الطلب</h1></div>
  <form id="f"><div class="card"><div class="kv"><span>الاسم الثلاثي</span><span>${esc(ME.full_name)}</span></div><div class="kv"><span>رقم الهاتف</span><span>${num(ME.phone)}</span></div><div class="kv"><span>الخدمة</span><span>${esc(s.name_ar)}</span></div><div class="kv"><span>الباقة</span><span>${esc(p.name_ar)}</span></div></div>
  <div class="card"><b style="font-size:14px">البيانات المطلوبة للتفعيل</b>${fields.map((f) => `<label class="lbl">${esc(f.label_ar)}</label><input class="in ${f.type === 'text' ? '' : 'ltr'}" name="${esc(f.key)}" type="${f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}" ${f.required ? 'required' : ''}>`).join('') || '<div class="sub">لا توجد بيانات مطلوبة</div>'}</div>
  <div class="card">${p.old_price ? `<div class="kv"><span>السعر الأصلي</span><span>${money(p.old_price)}</span></div><div class="kv"><span>قيمة الخصم</span><span>- ${money(p.old_price - p.price)}</span></div>` : ''}<div class="kv"><span>السعر النهائي</span><span style="color:#38d9ff;font-size:16px;font-weight:700">${money(p.price)}</span></div><div class="kv"><span>مدة التنفيذ</span><span>${num(SETTINGS.execution_hours || 24)} ساعة بعد تأكيد الدفع</span></div><div class="kv"><span>طريقة الدفع</span><span>Vodafone Cash</span></div></div>
  <div class="sub" style="margin-bottom:10px">سيظهر رقم الطلب بعد الإنشاء.</div><button class="btn" id="b">إنشاء الطلب والانتقال للدفع</button></form>`;
  $('#f').onsubmit = async (e) => {
    e.preventDefault(); const b = $('#b'); b.disabled = true; const vals = Object.fromEntries(new FormData(e.target));
    const { data, error } = await SB.rpc('create_order', { p_package: p.id, p_fields: vals });
    if (error) { toast('تعذر إنشاء الطلب: ' + error.message, true); b.disabled = false; return; }
    location.hash = '#/pay/' + data.id;
  };
}
async function getOrder(id) { const { data } = await SB.from('orders').select('*').eq('id', id).single(); return data; }
async function viewPay(id) {
  navBar('orders'); const o = await getOrder(id); if (!o) return (location.hash = '#/orders');
  SUPPORT_CTX = o.order_no; navBar('orders');
  app.innerHTML = `<div class="hd"><a class="ib" href="#/orders">${ic('back')}</a><h1>الدفع عبر Vodafone Cash</h1></div>
  <div class="card"><div class="kv"><span>الخدمة</span><span>${esc(o.service_name_ar)} – ${esc(o.package_name_ar)}</span></div><div class="kv"><span>رقم الطلب</span><span>${num(o.order_no)}</span></div><div class="sub" style="text-align:center;margin-top:8px">المبلغ المطلوب تحويله</div><div class="big">${money(o.total)}</div></div>
  <div class="card"><div class="sub">حوّل المبلغ إلى محفظة Vodafone Cash</div><div class="wallet" id="w" style="margin-top:8px"><span class="num">${esc(SETTINGS.wallet_number || '')}</span><span style="color:#38d9ff">${ic('copy')}</span></div><div class="sub" style="font-size:11px;margin-top:10px">1) افتح تطبيق المحفظة وحوّل المبلغ بالضبط. 2) ارجع هنا وارفع صورة الإيصال. 3) اكتب رقم العملية. لا تشارك الرقم السري أو كود OTP مع أحد، ولا يطلبهما التطبيق أبدًا.</div></div>
  ${o.status === 'awaiting_payment' || o.status === 'proof_submitted' ? `<div class="card"><span class="lbl" style="margin-top:0">صورة إيصال التحويل</span><label class="up" id="up"><input type="file" accept="image/*" id="file" hidden><span id="uph">${ic('upload', 26)}<br>اضغط لرفع صورة الإيصال</span></label><label class="lbl">رقم العملية / الرقم المرجعي</label><input class="in ltr" id="ref" inputmode="numeric" value="${esc(o.payment_ref || '')}"></div><button class="btn" id="send">إرسال إثبات الدفع</button>` : `<div class="card">${badge(o.status)}</div>`}`;
  $('#w').onclick = () => copyText(SETTINGS.wallet_number);
  let file = null;
  const fi = $('#file');
  if (fi) {
    fi.onchange = () => { file = fi.files[0]; if (file) { $('#uph').innerHTML = `<img src="${URL.createObjectURL(file)}">`; } };
    $('#send').onclick = async () => {
      if (!file && !o.receipt_path) return toast('ارفع صورة الإيصال أولًا', true);
      if (file && (!/^image\//.test(file.type) || file.size > 6 * 1024 * 1024)) return toast('الملف لازم يكون صورة أقل من 6 ميجا', true);
      const b = $('#send'); b.disabled = true;
      let path = o.receipt_path;
      if (file) {
        const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        path = `${ME.id}/${o.id}-${Date.now()}.${ext}`;
        const up = await SB.storage.from('receipts').upload(path, file, { contentType: file.type });
        if (up.error) { toast('فشل رفع الصورة', true); b.disabled = false; return; }
      }
      const { error } = await SB.rpc('submit_proof', { p_order: o.id, p_path: path, p_ref: $('#ref').value });
      if (error) { toast('تعذر الإرسال: ' + error.message, true); b.disabled = false; return; }
      app.innerHTML = `<div class="auth"><h1>تم استلام إثبات الدفع</h1><div class="sub" style="font-size:14px;margin:14px 0">تم استلام إثبات الدفع، وسيتم مراجعته وتأكيد طلبك في أقرب وقت</div><div class="card">رقم طلبك: ${num(o.order_no)}</div><a class="btn" href="#/order/${o.id}">متابعة الطلب</a></div>`;
    };
  }
}
async function viewOrders() {
  navBar('orders'); SUPPORT_CTX = '';
  const { data } = await SB.from('orders').select('id,order_no,service_name_ar,package_name_ar,total,status,created_at').order('created_at', { ascending: false });
  app.innerHTML = `<div class="hd"><a class="ib" href="#/">${ic('back')}</a><h1>طلباتي</h1></div>${(data || []).map((o) => `<a class="row" href="#/order/${o.id}"><div class="t">${esc(o.service_name_ar)} – ${esc(o.package_name_ar)}<em>${num(o.order_no)} · ${num(dt(o.created_at))}</em>${badge(o.status)}</div><div class="p">${money(o.total)}</div></a>`).join('') || '<div class="empty">لا توجد طلبات بعد</div>'}`;
}
let tick = null;
async function viewOrder(id) {
  navBar('orders'); const o = await getOrder(id); if (!o) return (location.hash = '#/orders');
  const f = o.field_values || {};
  app.innerHTML = `<div class="hd"><a class="ib" href="#/orders">${ic('back')}</a><h1>تفاصيل الطلب</h1></div>
  <div class="card"><div class="kv"><span>رقم الطلب</span><span>${num(o.order_no)}</span></div><div class="kv"><span>الحالة</span><span>${badge(o.status)}</span></div><div class="kv"><span>الخدمة</span><span>${esc(o.service_name_ar)}</span></div><div class="kv"><span>الباقة</span><span>${esc(o.package_name_ar)}</span></div>${Object.entries(f).map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><span>${num(v)}</span></div>`).join('')}<div class="kv"><span>المبلغ</span><span>${money(o.total)}</span></div><div class="kv"><span>تاريخ الطلب</span><span>${num(dt(o.created_at))}</span></div></div>
  ${o.due_at && !['completed', 'cancelled'].includes(o.status) ? `<div class="card"><div class="sub" style="text-align:center">الوقت المتبقي للتنفيذ</div><div class="timer" id="tm"></div></div>` : ''}
  ${['awaiting_payment', 'proof_submitted'].includes(o.status) ? `<a class="btn" href="#/pay/${o.id}">${o.status === 'awaiting_payment' ? 'إكمال الدفع' : 'تعديل إثبات الدفع'}</a><div style="height:10px"></div>` : ''}
  <a class="btn o" target="_blank" rel="noopener" href="${waLink(o.order_no)}">${ic('support')} تواصل مع خدمة العملاء بخصوص هذا الطلب</a>`;
  SUPPORT_CTX = o.order_no; navBar('orders');
  clearInterval(tick);
  if (o.due_at) { const t = () => { const el = $('#tm'); if (!el) return clearInterval(tick); let ms = new Date(o.due_at) - Date.now(); if (ms < 0) { el.textContent = 'انتهت المدة المتوقعة'; return; } const h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60; el.innerHTML = num([h, m, s].map((x) => String(x).padStart(2, '0')).join(':')); }; t(); tick = setInterval(t, 1000); }
}
async function viewNotifs() {
  navBar('notif');
  const { data } = await SB.from('notifications').select('*').eq('user_id', ME.id).order('created_at', { ascending: false }).limit(60);
  app.innerHTML = `<div class="hd"><a class="ib" href="#/">${ic('back')}</a><h1>الإشعارات</h1></div><button class="btn o s" id="pushb" style="margin-bottom:12px">${ic('bell', 18)} تفعيل إشعارات الجهاز</button>${(data || []).map((n) => `<a class="nt ${n.read ? '' : 'un'}" href="${esc(n.url || '#/notifications')}" data-id="${n.id}"><div><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${num(dt(n.created_at))}</small></div></a>`).join('') || '<div class="empty">لا توجد إشعارات</div>'}`;
  $("#pushb").onclick = () => enablePush();
  $$('.nt').forEach((a) => (a.onclick = () => SB.from('notifications').update({ read: true }).eq('id', a.dataset.id)));
  await SB.from('notifications').update({ read: true }).eq('user_id', ME.id).eq('read', false); UNREAD = 0;
}
function viewAccount() {
  navBar('account');
  app.innerHTML = `<div class="hd"><a class="ib" href="#/">${ic('back')}</a><h1>حسابي</h1></div><div class="card"><div class="kv"><span>الاسم</span><span>${esc(ME.full_name)}</span></div><div class="kv"><span>الهاتف</span><span>${num(ME.phone)}</span></div><div class="kv"><span>البريد</span><span class="ltr">${esc(ME.email || '')}</span></div></div><button class="btn o" id="pushb">${ic('bell', 18)} تفعيل إشعارات الجهاز</button><div style="height:10px"></div><button class="btn r" id="out">${ic('out', 18)} تسجيل الخروج</button>`;
  $("#pushb").onclick = () => enablePush(); $('#out').onclick = async () => { await SB.auth.signOut(); ME = null; location.hash = '#/'; viewAuth(); };
}

// ---------- router ----------
async function route() {
  if (!ME) return;
  const h = location.hash.replace(/^#/, '') || '/'; const p = h.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  try {
    if (!p.length) await viewHome();
    else if (p[0] === 'cat') viewCat(p[1]);
    else if (p[0] === 'service') viewService(p[1]);
    else if (p[0] === 'order' && p.length === 3) viewOrderForm(p[1], p[2]);
    else if (p[0] === 'order') await viewOrder(p[1]);
    else if (p[0] === 'pay') await viewPay(p[1]);
    else if (p[0] === 'orders') await viewOrders();
    else if (p[0] === 'notifications') await viewNotifs();
    else if (p[0] === 'account') viewAccount();
    else await viewHome();
  } catch (e) { console.error(e); app.innerHTML = '<div class="empty">حدث خطأ، حاول مرة أخرى</div>'; }
}
async function boot() {
  try { const PN0 = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications; if (PN0 && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) { const st0 = await PN0.checkPermissions(); if (st0.receive !== 'granted') await PN0.requestPermissions(); } } catch (e) { console.error(e); }
  const { data: { session } } = await SB.auth.getSession();
  if (!session) { ME = null; return viewAuth(); }
  ME = await myProfile();
  if (!ME) { await SB.auth.signOut(); return viewAuth(); }
  if (ME.role === 'admin') { location.replace('admin.html'); return; }
  const [s] = await Promise.all([getSettings(), loadCatalog(), refreshUnread()]); SETTINGS = s;
  if ((window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || ('Notification' in window && Notification.permission === 'granted' && VAPID_PUBLIC)) enablePush(true).catch(() => {});
  await route();
}
window.addEventListener('hashchange', route);
SB.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY') viewRecovery(); });
setInterval(async () => { if (ME) { await refreshUnread(); const d = $('.top .dot'); } }, 30000);
boot();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

function goBack() { if (history.length > 1) history.back(); else location.hash = '#/'; }
window.goBack = goBack;
(function () {
  const CA = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
  if (!CA || !Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;
  CA.addListener('backButton', () => {
    const h = location.hash.replace(/^#/, '');
    if (h === '' || h === '/' || (document.querySelector('#nav') || {}).hidden) CA.exitApp();
    else location.hash = '#/';
  });
})();
