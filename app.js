/* Application bootstrap: navigation, hash router, theme and global warnings.
   Views live in js/v-*.js and register themselves with IM.views[name] = function (root, params, parts) { ...; return cleanup; } */
(function () {
  const U = IM.util;
  IM.views = IM.views || {};

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'exam', label: 'Exam Simulator', icon: '📝' },
    { id: 'vocab', label: 'Vocabulary Mastery', icon: '📚' },
    { id: 'dictation', label: 'Dictation Laboratory', icon: '🎧' },
    { id: 'english', label: 'English Proficiency Centre', icon: '🔤' },
    { id: 'writing', label: 'Writing Coach', icon: '✍️' },
    { id: 'speaking', label: 'Speaking Coach', icon: '🎤' },
    { id: 'plan', label: 'Personalised Study Plan', icon: '🗓️' },
    { id: 'analytics', label: 'Progress Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings and Data', icon: '⚙️' }
  ];
  IM.nav = NAV;

  const TITLES = { diagnostic: 'Diagnostic assessment', revision: 'Revision queue', onboarding: 'Welcome' };
  let cleanup = null;
  let currentRoute = '';

  function parseHash() {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const params = {};
    (query || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { name: parts[0] || 'dashboard', parts: parts.slice(1), params };
  }

  function renderNav(active) {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(n => `<a href="#/${n.id}" class="nav-item ${n.id === active ? 'active' : ''}" ${n.id === active ? 'aria-current="page"' : ''}><span class="nav-ico" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`).join('');
    const s = IM.store.state;
    const st = document.getElementById('streak');
    if (st) st.textContent = '🔥 ' + IM.store.streak() + '-day streak';
  }

  function route() {
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    IM.audio.stop();
    const r = parseHash();
    const s = IM.store.state;
    if (!s.settings.onboarded && r.name !== 'onboarding' && r.name !== 'settings') { location.replace('#/onboarding'); return; }
    const view = IM.views[r.name];
    const main = document.getElementById('view');
    document.body.classList.remove('nav-open');
    renderNav(r.name === 'diagnostic' || r.name === 'revision' ? (r.name === 'diagnostic' ? 'english' : 'plan') : r.name);
    if (!view) {
      main.innerHTML = `<div class="view-root"><h1 tabindex="-1">Page not found</h1><p>That page does not exist. <a href="#/dashboard">Return to the dashboard</a>.</p></div>`;
      return;
    }
    const root = document.createElement('div');
    root.className = 'view-root';
    main.innerHTML = '';
    main.appendChild(root);
    try {
      cleanup = view(root, r.params, r.parts) || null;
    } catch (e) {
      console.error(e);
      root.innerHTML = `<h1>Something went wrong</h1><p>This page could not be displayed. Your data is safe. <a href="#/dashboard">Return to the dashboard</a>.</p><pre class="err">${U.esc(e.message)}</pre>`;
    }
    const nav = NAV.find(n => n.id === r.name);
    document.title = (nav ? nav.label : TITLES[r.name] || 'IELTS Band 8 Mastery') + ' · IELTS Band 8 Mastery';
    const h1 = root.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); if (currentRoute !== location.hash) h1.focus({ preventScroll: true }); }
    if (currentRoute !== location.hash) window.scrollTo(0, 0);
    currentRoute = location.hash;
  }

  function applyTheme() {
    const t = IM.store.state.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  function banners() {
    const b = document.getElementById('banners');
    const msgs = [];
    if (!IM.store.storageOk) msgs.push('Your browser is blocking local storage, so progress will be lost when you close this tab. Allow site data for this page to keep your progress.');
    if (!IM.audio.hasSpeech) msgs.push('This browser does not support speech playback, so audio-first features (Dictation, Listening, Speaking examiner voice) will not play sound. Use a current version of Chrome, Edge or Safari.');
    b.innerHTML = msgs.map(m => `<div class="banner warn" role="alert">${U.esc(m)}</div>`).join('');
  }

  function boot() {
    const res = IM.store.load();
    applyTheme();
    document.getElementById('nav-toggle').addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      document.getElementById('nav-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('nav').addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
    banners();
    if (res.recovered) U.toast('Saved data could not be read, so a fresh profile was created. A backup of the damaged data was kept.', 'warn');
    window.addEventListener('hashchange', route);
    window.addEventListener('beforeunload', e => {
      if (IM.activeExam) { e.preventDefault(); e.returnValue = ''; }
    });
    IM.applyTheme = applyTheme;
    IM.refreshBanners = banners;
    IM.audio.ready().then(() => { if (typeof IM.onVoices === 'function') IM.onVoices(); });
    route();
  }

  IM.route = route;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
