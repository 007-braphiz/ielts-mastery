/* Core utilities and the persistent store (LocalStorage). No external services are used. */
window.IM = window.IM || {};
IM.data = IM.data || {};
IM.views = IM.views || {};

/* ------------------------------------------------------------------ utilities */
IM.util = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const today = () => dateStr(new Date());
  const parseDate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); };
  const dayDiff = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const sum = a => a.reduce((s, x) => s + x, 0);
  const avg = a => (a.length ? sum(a) / a.length : null);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const fmtDate = s => { try { return parseDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return s; } };
  const fmtTime = ts => { try { return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const mmss = sec => { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); };
  const bandText = b => (b == null || isNaN(b) ? '—' : Number(b).toFixed(1));
  const countWords = t => { const m = String(t || '').trim().match(/[A-Za-z0-9£$€][A-Za-z0-9'’\-£$€.]*/g); return m ? m.length : 0; };
  const sentences = t => String(t || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z"“'‘(])/).map(s => s.trim()).filter(Boolean);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const plural = (n, w, p) => n + ' ' + (n === 1 ? w : (p || w + 's'));

  function toast(msg, kind) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3800);
  }

  return { esc, pad, dateStr, today, parseDate, addDays, dayDiff, clamp, sum, avg, pct, uid, pick, shuffle, fmtDate, fmtTime, mmss, bandText, countWords, sentences, $, $$, debounce, plural, toast };
})();

/* ------------------------------------------------------------------ UI snippets */
IM.ui = {
  bar(p, label, cls) {
    p = IM.util.clamp(Math.round(p || 0), 0, 100);
    return `<div class="bar ${cls || ''}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" ${label ? `aria-label="${IM.util.esc(label)}"` : ''}><span style="width:${p}%"></span></div>`;
  },
  empty(msg, actionHtml) {
    return `<div class="empty"><p>${msg}</p>${actionHtml || ''}</div>`;
  },
  badge(text, cls) { return `<span class="badge ${cls || ''}">${IM.util.esc(text)}</span>`; },
  note(text, cls) { return `<p class="note ${cls || ''}">${text}</p>`; },
  stat(label, value, sub) { return `<div class="stat"><div class="stat-v">${value}</div><div class="stat-l">${label}</div>${sub ? `<div class="stat-s">${sub}</div>` : ''}</div>`; },
  backLink(href, label) { return `<a class="back" href="${href}">← ${label}</a>`; }
};

/* ------------------------------------------------------------------ store */
IM.store = (function () {
  const KEY = 'ielts-mastery-v1';
  const VERSION = 1;
  let state = null;
  let storageOk = true;
  let memoryCopy = null;
  const listeners = [];

  function defaults() {
    return {
      version: VERSION,
      createdAt: Date.now(),
      settings: {
        onboarded: false, testType: 'academic',
        targets: { overall: 8, listening: 8, reading: 8, writing: 8, speaking: 8 },
        dailyMinutes: 45, studyDays: [1, 2, 3, 4, 5, 6], examDate: '', accent: 'en-GB', voiceURI: '', speechRate: 1,
        difficulties: [], theme: 'auto'
      },
      diagnostic: { done: false, skipped: false, takenAt: null, results: {}, baseline: {} },
      activity: [],
      days: {},
      srs: {},
      vocab: { recent: [], preferredLevel: 1, studiedCount: 0 },
      dictation: { attempts: [], recent: [], level: 1, errorStats: {}, words: {}, confusions: {}, missingWords: {} },
      proficiency: { areas: {}, lessons: {}, clinic: [] },
      mocks: [],
      writing: { submissions: [], notebook: [] },
      speaking: { sessions: [] },
      plan: { completed: {}, reviews: [] },
      achievements: {},
      inProgress: {}
    };
  }

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  /* Fill missing keys from defaults and coerce container types. Returns a fresh, valid state. */
  function repair(input) {
    const d = defaults();
    const out = {};
    Object.keys(d).forEach(k => {
      const dv = d[k], iv = input ? input[k] : undefined;
      if (Array.isArray(dv)) out[k] = Array.isArray(iv) ? iv : dv;
      else if (isObj(dv)) {
        out[k] = Object.assign({}, dv, isObj(iv) ? iv : {});
        Object.keys(dv).forEach(k2 => {
          if (Array.isArray(dv[k2]) && !Array.isArray(out[k][k2])) out[k][k2] = dv[k2];
          if (isObj(dv[k2]) && !isObj(out[k][k2])) out[k][k2] = dv[k2];
          else if (isObj(dv[k2])) out[k][k2] = Object.assign({}, dv[k2], out[k][k2]);
        });
      } else out[k] = iv !== undefined && typeof iv === typeof dv ? iv : dv;
    });
    out.version = VERSION;
    return out;
  }

  /* Strict validation for imports. Returns {ok, errors}. */
  function validate(obj) {
    const errors = [];
    if (!isObj(obj)) return { ok: false, errors: ['The file does not contain a JSON object.'] };
    if (typeof obj.version !== 'number') errors.push('Missing numeric "version".');
    else if (obj.version > VERSION) errors.push('This file was created by a newer version of the application (version ' + obj.version + ').');
    const objects = ['settings', 'diagnostic', 'days', 'srs', 'vocab', 'dictation', 'proficiency', 'writing', 'speaking', 'plan', 'achievements'];
    const arrays = ['activity', 'mocks'];
    objects.forEach(k => { if (!isObj(obj[k])) errors.push('"' + k + '" must be an object.'); });
    arrays.forEach(k => { if (!Array.isArray(obj[k])) errors.push('"' + k + '" must be an array.'); });
    if (isObj(obj.settings)) {
      const s = obj.settings;
      if (s.testType !== undefined && !['academic', 'general'].includes(s.testType)) errors.push('settings.testType must be "academic" or "general".');
      if (s.targets !== undefined) {
        if (!isObj(s.targets)) errors.push('settings.targets must be an object.');
        else Object.keys(s.targets).forEach(k => { const v = s.targets[k]; if (typeof v !== 'number' || v < 0 || v > 9) errors.push('settings.targets.' + k + ' must be a number between 0 and 9.'); });
      }
      if (s.dailyMinutes !== undefined && (typeof s.dailyMinutes !== 'number' || s.dailyMinutes < 5 || s.dailyMinutes > 600)) errors.push('settings.dailyMinutes must be a number between 5 and 600.');
    }
    if (isObj(obj.dictation) && obj.dictation.attempts !== undefined && !Array.isArray(obj.dictation.attempts)) errors.push('dictation.attempts must be an array.');
    if (isObj(obj.writing)) {
      if (obj.writing.submissions !== undefined && !Array.isArray(obj.writing.submissions)) errors.push('writing.submissions must be an array.');
      if (obj.writing.notebook !== undefined && !Array.isArray(obj.writing.notebook)) errors.push('writing.notebook must be an array.');
    }
    if (isObj(obj.speaking) && obj.speaking.sessions !== undefined && !Array.isArray(obj.speaking.sessions)) errors.push('speaking.sessions must be an array.');
    if (Array.isArray(obj.mocks)) obj.mocks.forEach((m, i) => { if (!isObj(m) || typeof m.raw !== 'number' || typeof m.max !== 'number' || typeof m.skill !== 'string') errors.push('mocks[' + i + '] is not a valid mock result.'); });
    return { ok: errors.length === 0, errors: errors.slice(0, 12) };
  }

  function safeParse(text) {
    try { return { ok: true, value: JSON.parse(text) }; } catch (e) { return { ok: false, error: e.message }; }
  }

  function storageGet() {
    try { return window.localStorage.getItem(KEY); } catch (e) { storageOk = false; return null; }
  }
  function storageSet(text) {
    try { window.localStorage.setItem(KEY, text); storageOk = true; return true; } catch (e) { storageOk = false; return false; }
  }

  function load() {
    const raw = storageGet();
    if (raw === null) { state = repair(memoryCopy ? JSON.parse(memoryCopy) : null); return { fresh: !memoryCopy }; }
    const p = safeParse(raw);
    if (!p.ok || !isObj(p.value)) {
      try { window.localStorage.setItem(KEY + '-corrupt-backup', raw); } catch (e) { /* ignore */ }
      state = repair(null);
      save();
      return { fresh: true, recovered: true };
    }
    state = repair(p.value);
    return { fresh: false };
  }

  function save() {
    if (!state) return false;
    const text = JSON.stringify(state);
    memoryCopy = text;
    const ok = storageSet(text);
    listeners.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
    return ok;
  }

  function update(fn) { fn(state); return save(); }

  function exportJSON() { return JSON.stringify(state, null, 2); }

  /* Parse and validate without replacing anything. Returns {ok, errors, summary}. */
  function checkImport(text) {
    const p = safeParse(text);
    if (!p.ok) return { ok: false, errors: ['The file is not valid JSON (' + p.error + ').'] };
    const v = validate(p.value);
    if (!v.ok) return v;
    const o = p.value;
    return { ok: true, errors: [], summary: { activities: o.activity.length, mocks: o.mocks.length, srsItems: Object.keys(o.srs).length, dictationAttempts: (o.dictation.attempts || []).length, writing: (o.writing.submissions || []).length, speaking: (o.speaking.sessions || []).length } };
  }

  function importJSON(text) {
    const p = safeParse(text);
    if (!p.ok) return { ok: false, errors: ['The file is not valid JSON (' + p.error + ').'] };
    const v = validate(p.value);
    if (!v.ok) return v;
    state = repair(p.value);
    save();
    return { ok: true, errors: [] };
  }

  function reset() {
    state = repair(null);
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    memoryCopy = null;
    save();
  }

  /* ---------- activity logging and streaks ---------- */
  function logActivity(module, kind, detail, score, max, minutes) {
    update(s => {
      const U = IM.util;
      const t = U.today();
      s.activity.push({ id: U.uid(), ts: Date.now(), date: t, module, kind, detail: detail || '', score: score == null ? null : score, max: max == null ? null : max, minutes: minutes || 2 });
      if (s.activity.length > 1500) s.activity.splice(0, s.activity.length - 1500);
      const d = s.days[t] || (s.days[t] = { minutes: 0, count: 0 });
      d.minutes += minutes || 2;
      d.count += 1;
    });
  }

  function streak() {
    const U = IM.util;
    const days = state.days;
    let n = 0;
    let d = U.today();
    if (!days[d]) d = U.addDays(d, -1);
    while (days[d]) { n++; d = U.addDays(d, -1); }
    return n;
  }

  return {
    get state() { return state; },
    get storageOk() { return storageOk; },
    KEY, VERSION, defaults, repair, validate, load, save, update, exportJSON, checkImport, importJSON, reset, logActivity, streak,
    onSave(fn) { listeners.push(fn); }
  };
})();
