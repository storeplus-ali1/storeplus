// AdMob (Android app only). IDs come from ads-config.js (generated at build time).
(function () {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform() || !window.ADS_CONFIG) return;
  const A = C.Plugins && C.Plugins.AdMob; if (!A) return;
  const cfg = window.ADS_CONFIG; let ready = false, bannerOn = false, shown = false, prepared = false;
  const isHome = () => { const h = location.hash.replace(/^#/, ''); return h === '' || h === '/'; };
  const loggedIn = () => !!document.querySelector('#nav') && !document.querySelector('#nav').hidden;
  async function init() { try { await A.initialize({ initializeForTesting: cfg.test }); ready = true; } catch (e) { console.warn('admob init', e); } }
  async function banner(on) {
    if (!ready) return;
    try {
      if (on && !bannerOn) { bannerOn = true; await A.showBanner({ adId: cfg.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 64, isTesting: cfg.test }); }
      else if (!on && bannerOn) { bannerOn = false; await A.removeBanner(); }
    } catch (e) { bannerOn = false; console.warn('banner', e); }
  }
  async function prep() { if (!ready || prepared) return; prepared = true; try { await A.prepareInterstitial({ adId: cfg.interstitial, isTesting: cfg.test }); } catch (e) { prepared = false; } }
  async function interstitial() {
    if (shown || !ready) return; shown = true;
    try { await A.showInterstitial(); } catch (e) { console.warn('interstitial', e); }
  }
  async function onRoute() {
    if (!loggedIn()) { banner(false); return; }
    if (isHome()) { banner(true); prep(); }
    else { banner(false); if (prepared) interstitial(); } // once per launch, on first leaving home
  }
  window.addEventListener('hashchange', onRoute);
  init().then(() => setInterval(onRoute, 2500));
})();
