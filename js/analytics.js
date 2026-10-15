/* Analytics: band conversion, estimates, error statistics, readiness and recommendations.
   Estimates are derived only from recorded activity; nothing is invented when data are missing. */
IM.analytics = (function () {
  const U = IM.util;
  const S = () => IM.store.state;
  const SK = ['listening', 'reading', 'writing', 'speaking'];

  function table(name) { return IM.data.scoring.bandConversions[name]; }
  function rawToBand(tableName, raw) {
    const rows = table(tableName);
    for (const [min, band] of rows) if (raw >= min) return band;
    return rows[rows.length - 1][1];
  }
  function mockBand(skill, testType, raw, max) {
    const scaled = max === 40 ? raw : Math.round((raw / max) * 40);
    if (skill === 'listening') return rawToBand('listening', scaled);
    return rawToBand(testType === 'general' ? 'readingGeneral' : 'readingAcademic', scaled);
  }

  /* IELTS rounding: the average of four skills is rounded to the nearest half band; .25 rounds up to .5 and .75 up to the next whole band. */
  function roundBand(avg) {
    const f = Math.floor(avg), r = avg - f;
    if (r < 0.25) return f;
    if (r < 0.75) return f + 0.5;
    return f + 1;
  }
  function roundHalf(x) { return Math.round(x * 2) / 2; }
  function overall(b) {
    const vals = SK.map(k => b[k]);
    if (vals.some(v => v == null || isNaN(v))) return null;
    return roundBand(U.sum(vals) / 4);
  }

  /* ---------- skill estimates ---------- */
  function lastN(arr, n) { return arr.slice(-n); }

  function estimate(skill) {
    const s = S();
    let list = [], basis = null;
    if (skill === 'listening' || skill === 'reading') {
      const mocks = s.mocks.filter(m => m.skill === skill && m.scope === 'full' && m.first !== false);
      list = lastN(mocks, 3).map(m => m.band);
      if (list.length) basis = list.length + (list.length === 1 ? ' mock test' : ' mock tests');
      else if (s.diagnostic.baseline && s.diagnostic.baseline[skill] != null) { list = [s.diagnostic.baseline[skill]]; basis = 'diagnostic (short, rough)'; }
    } else if (skill === 'writing') {
      const subs = lastN(s.writing.submissions.filter(x => x.est), 4);
      list = subs.map(x => x.est.overall);
      if (list.length) basis = list.length + (list.length === 1 ? ' estimated response' : ' estimated responses');
    } else if (skill === 'speaking') {
      const ss = lastN(s.speaking.sessions.filter(x => x.est && x.est.overall != null), 4);
      list = ss.map(x => x.est.overall);
      if (list.length) basis = list.length + (list.length === 1 ? ' speaking session' : ' speaking sessions');
    }
    if (!list.length) return { band: null, basis: null, count: 0, values: [] };
    return { band: roundHalf(U.avg(list)), basis, count: list.length, values: list };
  }

  function estimates() {
    const o = {};
    SK.forEach(k => { o[k] = estimate(k); });
    const bands = {};
    SK.forEach(k => { bands[k] = o[k].band; });
    const ov = overall(bands);
    const have = SK.filter(k => o[k].band != null);
    return { skills: o, bands, overall: ov, missing: SK.filter(k => o[k].band == null), partial: have.length ? roundHalf(U.avg(have.map(k => o[k].band))) : null };
  }

  function consistency(values) {
    if (!values || values.length < 2) return null;
    const spread = Math.max(...values) - Math.min(...values);
    return { spread, consistent: spread <= IM.data.scoring.readiness.consistencyBandSpread };
  }

  function recordBaseline(skill, band) {
    const s = S();
    if (s.diagnostic.baseline[skill] == null && band != null) IM.store.update(st => { st.diagnostic.baseline[skill] = band; });
  }

  /* ---------- proficiency areas ---------- */
  function recordArea(area, correct, total) {
    IM.store.update(s => {
      const a = s.proficiency.areas[area] || (s.proficiency.areas[area] = { attempts: 0, correct: 0, history: [] });
      a.attempts += total; a.correct += correct;
      a.history.push({ d: U.today(), c: correct, t: total });
      if (a.history.length > 60) a.history.shift();
    });
  }
  function areaStats() {
    const out = {};
    IM.data.scoring.areas.forEach(a => {
      const x = S().proficiency.areas[a];
      out[a] = x && x.attempts ? { attempts: x.attempts, correct: x.correct, pct: Math.round((x.correct / x.attempts) * 100), recent: recentArea(x) } : { attempts: 0, correct: 0, pct: null, recent: null };
    });
    return out;
  }
  function recentArea(x) {
    const h = x.history.slice(-8);
    const c = U.sum(h.map(v => v.c)), t = U.sum(h.map(v => v.t));
    return t ? Math.round((c / t) * 100) : null;
  }

  /* ---------- error statistics ---------- */
  const TAG_LABELS = {
    'plural-ending': 'Plural endings (-s)', 'verb-ending': 'Verb endings (-ed / -ing / -s)', 'double-letter': 'Double letters', 'silent-letter': 'Silent letters',
    'vowel-combo': 'Vowel combinations (ie / ei and others)', homophone: 'Homophones and similar-sounding words', omission: 'Missing words', addition: 'Added words',
    substitution: 'Word substitutions', order: 'Word order', capitalisation: 'Capitalisation', punctuation: 'Punctuation', 'spelling-other': 'Other spelling'
  };
  function dictationErrorStats() {
    const st = S().dictation.errorStats;
    return Object.keys(st).map(k => ({ tag: k, label: TAG_LABELS[k] || k, count: st[k] })).sort((a, b) => b.count - a.count);
  }
  function writingErrorStats() {
    const m = {};
    S().writing.notebook.forEach(n => { m[n.category] = (m[n.category] || 0) + 1; });
    return Object.keys(m).map(k => ({ label: k, count: m[k] })).sort((a, b) => b.count - a.count);
  }
  function grammarErrorStats() {
    const m = {};
    IM.data.grammar.lessons.forEach(l => {
      const rec = S().proficiency.lessons[l.id];
      if (rec && rec.wrong) m[l.title] = (m[l.title] || 0) + rec.wrong;
    });
    return Object.keys(m).map(k => ({ label: k, count: m[k] })).sort((a, b) => b.count - a.count);
  }
  function combinedErrorCategories() {
    const rows = [];
    dictationErrorStats().forEach(e => rows.push({ label: e.label, count: e.count, source: 'Dictation' }));
    writingErrorStats().forEach(e => rows.push({ label: e.label, count: e.count, source: 'Writing' }));
    grammarErrorStats().forEach(e => rows.push({ label: e.label, count: e.count, source: 'Grammar lessons' }));
    return rows.sort((a, b) => b.count - a.count);
  }

  function dictationSummary() {
    const at = S().dictation.attempts;
    const firsts = at.filter(a => a.first);
    const retries = at.filter(a => !a.first);
    const byLevel = {}, byCat = {}, bySpeed = {};
    at.filter(a => a.first).forEach(a => {
      (byLevel[a.level] = byLevel[a.level] || []).push(a.wordAccuracy);
      (byCat[a.cat] = byCat[a.cat] || []).push(a.wordAccuracy);
      const sp = String(a.rate || 1);
      (bySpeed[sp] = bySpeed[sp] || []).push(a.wordAccuracy);
    });
    const mean = o => Object.keys(o).sort().map(k => ({ key: k, pct: Math.round(U.avg(o[k])), n: o[k].length }));
    return {
      total: at.length,
      firstAvg: firsts.length ? Math.round(U.avg(firsts.map(a => a.wordAccuracy))) : null,
      retryAvg: retries.length ? Math.round(U.avg(retries.map(a => a.wordAccuracy))) : null,
      byLevel: mean(byLevel), byCat: mean(byCat), bySpeed: mean(bySpeed),
      recentAvg: at.length ? Math.round(U.avg(at.slice(-10).map(a => a.wordAccuracy))) : null,
      charAvg: at.length ? Math.round(U.avg(at.slice(-10).map(a => a.charAccuracy))) : null,
      words: S().dictation.words
    };
  }

  function questionTypeAccuracy() {
    const m = {};
    S().mocks.forEach(k => { Object.keys(k.byType || {}).forEach(t => { const x = m[t] || (m[t] = { c: 0, t: 0 }); x.c += k.byType[t].c; x.t += k.byType[t].t; }); });
    return Object.keys(m).map(t => ({ type: t, c: m[t].c, t: m[t].t, pct: Math.round((m[t].c / m[t].t) * 100) })).sort((a, b) => a.pct - b.pct);
  }

  function vocabProgress() {
    const entries = IM.data.vocabulary.entries;
    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    entries.forEach(e => { counts[IM.srs.status(IM.srs.get('vocab:' + e.id))]++; });
    const answered = Object.values(S().srs).filter(i => i.kind === 'vocab');
    const att = U.sum(answered.map(i => i.attempts)), cor = U.sum(answered.map(i => i.correct));
    return { total: entries.length, counts, accuracy: att ? Math.round((cor / att) * 100) : null, attempts: att };
  }

  function weakestSkill() {
    const e = estimates();
    const t = S().settings.targets;
    let worst = null;
    SK.forEach(k => {
      const b = e.skills[k].band;
      if (b == null) return;
      const gap = (t[k] || 8) - b;
      if (!worst || gap > worst.gap) worst = { skill: k, gap, band: b };
    });
    return worst;
  }

  /* ---------- readiness ---------- */
  function readiness() {
    const e = estimates();
    const t = S().settings.targets;
    const req = IM.data.scoring.readiness;
    return SK.map(k => {
      const mocksOrWork = k === 'listening' || k === 'reading' ? S().mocks.filter(m => m.skill === k).length : (k === 'writing' ? S().writing.submissions.length : S().speaking.sessions.length);
      const b = e.skills[k].band;
      const cons = consistency(e.skills[k].values);
      const checks = [
        { ok: b != null && b >= (t[k] || 8) - 0.5, text: b == null ? 'No estimate yet' : 'Estimate ' + b.toFixed(1) + ' against target ' + (t[k] || 8).toFixed(1) },
        { ok: mocksOrWork >= req.minMocksPerSkill, text: mocksOrWork + ' of ' + req.minMocksPerSkill + ' required practice attempts' },
        { ok: cons ? cons.consistent : false, text: cons ? 'Spread across recent attempts: ' + cons.spread.toFixed(1) + ' band' : 'Needs at least two attempts to judge consistency' }
      ];
      return { skill: k, band: b, ready: checks.every(c => c.ok), checks };
    });
  }

  /* ---------- time ---------- */
  function minutesLast(days) {
    let m = 0;
    for (let i = 0; i < days; i++) { const d = S().days[U.addDays(U.today(), -i)]; if (d) m += d.minutes; }
    return m;
  }
  function studiedDays(days) {
    let n = 0;
    for (let i = 0; i < days; i++) if (S().days[U.addDays(U.today(), -i)]) n++;
    return n;
  }

  function activityByModule(days) {
    const since = U.addDays(U.today(), -(days - 1));
    const m = {};
    S().activity.filter(a => a.date >= since).forEach(a => { m[a.module] = (m[a.module] || 0) + 1; });
    return m;
  }

  return {
    rawToBand, mockBand, roundBand, overall, estimate, estimates, consistency, recordBaseline, recordArea, areaStats,
    dictationErrorStats, writingErrorStats, grammarErrorStats, combinedErrorCategories, dictationSummary, questionTypeAccuracy,
    vocabProgress, weakestSkill, readiness, minutesLast, studiedDays, activityByModule, TAG_LABELS, SK
  };
})();
