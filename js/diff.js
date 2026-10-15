/* Dictation comparison engine.
   Method (shown to learners): 1) split both texts into words; 2) align the words with a word-level
   edit-distance algorithm (Levenshtein dynamic programme) in which a near-match counts as a spelling slip and
   a different word counts as a substitution; 3) classify each difference (missing, added, misspelled,
   substituted, homophone, word order); 4) compare capitalisation and punctuation of matched words separately.
   The result is a practice measure, not an IELTS band. */
IM.diff = (function () {
  const G = () => IM.data.grammar;

  function norm(s) { return String(s == null ? '' : s).replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-'); }

  function tokenise(text) {
    const t = norm(text).trim();
    if (!t) return [];
    const out = [];
    t.split(/\s+/).forEach(raw => {
      const m = raw.match(/^([^A-Za-z0-9£$€]*)(.*?)([^A-Za-z0-9]*)$/);
      let lead = m[1], core = m[2], trail = m[3];
      if (!core) { if (out.length) out[out.length - 1].trail += raw; return; }
      out.push({ raw, lead, core, trail, key: core.toLowerCase().replace(/^-+|-+$/g, '') });
    });
    return out;
  }

  function lev(a, b) {
    const n = a.length, m = b.length;
    if (!n) return m;
    if (!m) return n;
    let prev = new Array(m + 1), cur = new Array(m + 1);
    for (let j = 0; j <= m; j++) prev[j] = j;
    for (let i = 1; i <= n; i++) {
      cur[0] = i;
      for (let j = 1; j <= m; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      [prev, cur] = [cur, prev];
    }
    return prev[m];
  }

  let known = null;
  function knownWords() {
    if (known) return known;
    known = new Set();
    const add = t => String(t || '').toLowerCase().replace(/[’]/g, "'").match(/[a-z']+/g)?.forEach(w => known.add(w));
    try {
      (IM.data.dictation?.items || []).forEach(i => add(i.text));
      (IM.data.vocabulary?.entries || []).forEach(e => { add(e.example); add(e.word); e.family.forEach(f => add(f.word)); });
      (IM.data.reading?.academic?.passages || []).forEach(p => p.paragraphs.forEach(x => add(x.t)));
      Object.values(G().misspellings).forEach(add);
      'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were has had been being am does did done'.split(' ').forEach(w => known.add(w));
    } catch (e) { /* ignore */ }
    return known;
  }

  const variantPairs = (() => { const m = {}; Object.entries(G().variants).forEach(([uk, us]) => { m[us] = uk; }); return m; })();
  function isVariant(refKey, respKey) {
    const v = G().variants;
    return (v[refKey] && v[refKey] === respKey) || (variantPairs[respKey] && variantPairs[respKey] === refKey);
  }

  function homophoneGroup(a, b) {
    return G().homophones.find(g => g.words.includes(a) && g.words.includes(b)) || null;
  }

  function closeEnough(a, b) {
    const ml = Math.max(a.length, b.length);
    if (ml < 3) return false;
    const d = lev(a, b);
    return d <= Math.max(1, Math.floor(ml * 0.4));
  }

  function subCost(r, s, opts) {
    if (r.key === s.key) return 0;
    if (!opts.strictUK && isVariant(r.key, s.key)) return 0;
    if (homophoneGroup(r.key, s.key)) return 0.9;
    if (closeEnough(r.key, s.key) && !knownWords().has(s.key)) return 0.6;
    if (closeEnough(r.key, s.key)) return 0.8;
    return 1;
  }

  function align(ref, resp, opts) {
    const n = ref.length, m = resp.length;
    const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
    for (let i = 1; i <= n; i++) D[i][0] = i;
    for (let j = 1; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + subCost(ref[i - 1], resp[j - 1], opts));
      }
    }
    const ops = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + subCost(ref[i - 1], resp[j - 1], opts))) < 1e-9) {
        ops.push({ type: 'pair', ref: ref[i - 1], resp: resp[j - 1] }); i--; j--;
      } else if (i > 0 && Math.abs(D[i][j] - (D[i - 1][j] + 1)) < 1e-9) {
        ops.push({ type: 'missing', ref: ref[i - 1], resp: null }); i--;
      } else {
        ops.push({ type: 'added', ref: null, resp: resp[j - 1] }); j--;
      }
    }
    return ops.reverse();
  }

  /* Letter-level markup: wrong or extra letters in the learner's spelling, and letters they omitted. */
  function charAlign(ref, resp) {
    const a = ref.toLowerCase(), b = resp.toLowerCase();
    const n = a.length, m = b.length;
    const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) D[i][0] = i;
    for (let j = 0; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    const respMarks = [], refMarks = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
        const same = a[i - 1] === b[j - 1];
        respMarks.push({ ch: resp[j - 1], bad: !same }); refMarks.push({ ch: ref[i - 1], bad: !same }); i--; j--;
      } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { refMarks.push({ ch: ref[i - 1], bad: true }); respMarks.push({ ch: '·', bad: true, gap: true }); i--; }
      else { respMarks.push({ ch: resp[j - 1], bad: true }); j--; }
    }
    return { resp: respMarks.reverse(), ref: refMarks.reverse() };
  }
  function charHtml(marks, cls) {
    return marks.map(m => (m.bad ? `<mark class="${cls}${m.gap ? ' gap' : ''}">${IM.util.esc(m.ch)}</mark>` : IM.util.esc(m.ch))).join('');
  }

  /* Analyse a misspelling and return {tag, text}. */
  function explainSpelling(refKey, respKey, item) {
    const r = refKey, s = respKey;
    const sortChars = x => x.split('').sort().join('');
    const dbl = /([a-z])\1/;
    if (r.endsWith('s') && r.slice(0, -1) === s) return { tag: 'plural-ending', text: 'The plural ending -s was missing. Listen for the final /s/ or /z/ sound.' };
    if (s.endsWith('s') && s.slice(0, -1) === r) return { tag: 'plural-ending', text: 'An extra -s was added. Check whether the word really is plural.' };
    if (/ed$/.test(r) && r.slice(0, -2) === s || /ed$/.test(r) && r.slice(0, -1) === s) return { tag: 'verb-ending', text: 'The -ed (past tense) ending was missing.' };
    if (/ing$/.test(r) && !/ing$/.test(s)) return { tag: 'verb-ending', text: 'The -ing ending was missing or incorrect.' };
    if (sortChars(r) === sortChars(s)) {
      if (/ie|ei/.test(r) && /ie|ei/.test(s)) return { tag: 'vowel-combo', text: 'Letters are in the wrong order: check “ie” and “ei”. The rule is “i before e, except after c”, with exceptions.' };
      return { tag: 'spelling-other', text: 'All the right letters were used but in the wrong order. Say the word slowly, syllable by syllable.' };
    }
    if (r.length === s.length + 1) {
      for (let k = 0; k < r.length; k++) {
        if (r.slice(0, k) + r.slice(k + 1) === s) {
          const ch = r[k];
          if ((r[k - 1] === ch) || (r[k + 1] === ch)) return { tag: 'double-letter', text: `A double letter was missed: the correct spelling has “${ch}${ch}”.` };
          return { tag: /^[bkpswtgh]$/.test(ch) ? 'silent-letter' : 'spelling-other', text: `The letter “${ch}” is missing${/^[bkpswtgh]$/.test(ch) ? ' (it may be a silent letter, so it is easy to miss when listening)' : ''}.` };
        }
      }
    }
    if (s.length === r.length + 1) {
      for (let k = 0; k < s.length; k++) {
        if (s.slice(0, k) + s.slice(k + 1) === r) {
          const ch = s[k];
          if (s[k - 1] === ch || s[k + 1] === ch) return { tag: 'double-letter', text: `An extra letter was added: the correct spelling has only one “${ch}” here.` };
          return { tag: 'spelling-other', text: `An extra letter “${ch}” was added.` };
        }
      }
    }
    if (dbl.test(r) && !dbl.test(s)) return { tag: 'double-letter', text: 'This word contains a double letter that was not written.' };
    if (/[aeiou]/.test(r.replace(/[^aeiou]/g, '')) && lev(r.replace(/[^aeiou]/g, ''), s.replace(/[^aeiou]/g, '')) > 0 && lev(r.replace(/[aeiou]/g, ''), s.replace(/[aeiou]/g, '')) === 0) return { tag: 'vowel-combo', text: 'The consonants are right but a vowel is wrong. Vowel sounds have several spellings, so learn this word as a whole.' };
    return { tag: 'spelling-other', text: 'The spelling differs in more than one place. Compare the highlighted letters and copy the correct word three times from memory.' };
  }

  function compare(ref, resp, options) {
    const opts = options || {};
    const item = opts.item || null;
    const rt = tokenise(ref), st = tokenise(resp);
    const result = { refWords: rt.length, ops: [], errors: [], counts: { correct: 0, spelling: 0, missing: 0, added: 0, substituted: 0, order: 0, homophone: 0, capitalisation: 0, punctuation: 0, variant: 0 }, tags: {} };
    const tag = t => { result.tags[t] = (result.tags[t] || 0) + 1; };

    // Whole-answer alternatives (IELTS-style short answers, numbers and so on).
    const squash = x => norm(x).toLowerCase().replace(/[^a-z0-9£$€]/g, '');
    if (item) {
      const accepted = [item.text].concat(item.accept || []);
      if (item.mode === 'answer' && st.length && accepted.some(a => squash(a) === squash(resp))) {
        result.exact = true;
        result.counts.correct = rt.length;
        rt.forEach((t, i) => result.ops.push({ type: 'ok', ref: t, resp: st[Math.min(i, st.length - 1)] }));
        return finish(result, ref, resp, opts);
      }
      if (item.mode !== 'answer' && (item.accept || []).some(a => norm(a).trim() === norm(resp).trim()) && st.length) {
        result.exact = true;
        result.counts.correct = rt.length;
        rt.forEach((t, i) => result.ops.push({ type: 'ok', ref: t, resp: st[Math.min(i, st.length - 1)] }));
        return finish(result, ref, resp, opts);
      }
    }

    let ops = align(rt, st, opts);

    // Alternative accepted tokens (item.accept as single words).
    const out = [];
    ops.forEach(o => {
      if (o.type === 'pair') {
        const r = o.ref, s = o.resp;
        if (r.key === s.key) {
          out.push({ type: 'ok', ref: r, resp: s });
        } else if (!opts.strictUK && isVariant(r.key, s.key)) {
          out.push({ type: 'variant', ref: r, resp: s });
        } else {
          const hg = homophoneGroup(r.key, s.key);
          if (hg) out.push({ type: 'homophone', ref: r, resp: s, group: hg });
          else if (closeEnough(r.key, s.key) && !knownWords().has(s.key)) out.push({ type: 'spelling', ref: r, resp: s });
          else if (closeEnough(r.key, s.key) && lev(r.key, s.key) === 1 && r.key.length >= 5) out.push({ type: 'spelling', ref: r, resp: s });
          else out.push({ type: 'substituted', ref: r, resp: s });
        }
      } else out.push(o);
    });

    // Word order: a word that is missing in one place and appears in another (including swapped neighbours) is a displaced word.
    const cand = out.filter(o => ['substituted', 'missing', 'added'].includes(o.type));
    const dropped = new Set();
    cand.forEach(o => {
      if (!o.ref || o.type === 'order' || dropped.has(o)) return;
      const mate = cand.find(p => p !== o && !dropped.has(p) && p.type !== 'order' && p.resp && p.resp.key === o.ref.key);
      if (!mate) return;
      o.type = 'order'; o.resp = mate.resp;
      if (mate.type === 'added' || (mate.ref && mate.ref.key === o.resp.key)) dropped.add(mate);
      else { mate.type = 'missing'; mate.resp = null; }
    });
    for (let k = out.length - 1; k >= 0; k--) if (dropped.has(out[k])) out.splice(k, 1);

    // Tally
    out.forEach((o, idx) => {
      const c = result.counts;
      if (o.type === 'ok' || o.type === 'variant') {
        c.correct++;
        if (o.type === 'variant') { c.variant++; }
        if (o.ref.core !== o.resp.core && o.ref.core.toLowerCase() === o.resp.core.toLowerCase()) {
          c.capitalisation++; o.cap = true;
          result.errors.push({ type: 'capitalisation', ref: o.ref.core, resp: o.resp.core, tag: 'capitalisation', text: o.ref.core[0] !== o.ref.core[0].toLowerCase() ? `“${o.ref.core}” needs a capital letter (a name, the start of a sentence or “I”).` : `“${o.ref.core}” does not need a capital letter here.` });
          tag('capitalisation');
        }
        const rp = (o.ref.lead + o.ref.trail).replace(/\s/g, ''), sp = (o.resp.lead + o.resp.trail).replace(/\s/g, '');
        if (rp !== sp && !opts.ignorePunctuation) {
          c.punctuation++; o.punct = true;
          const missing = rp.length > sp.length;
          result.errors.push({ type: 'punctuation', ref: o.ref.raw, resp: o.resp.raw, tag: 'punctuation', text: missing ? `Punctuation missing after or around “${o.ref.core}”: expected “${o.ref.raw}”.` : `Check the punctuation around “${o.ref.core}”: expected “${o.ref.raw}”.` });
          tag('punctuation');
        }
      } else if (o.type === 'spelling') {
        c.spelling++;
        const ex = explainSpelling(o.ref.key, o.resp.key, item);
        o.explain = ex;
        o.charDiff = charAlign(o.ref.core, o.resp.core);
        result.errors.push({ type: 'spelling', ref: o.ref.core, resp: o.resp.core, tag: ex.tag, text: ex.text, charDiff: o.charDiff });
        tag(ex.tag);
        if (item && item.note && item.text.split(/\s+/).length === 1) result.errors[result.errors.length - 1].note = item.note;
      } else if (o.type === 'homophone') {
        c.homophone++; c.substituted++;
        result.errors.push({ type: 'homophone', ref: o.ref.core, resp: o.resp.core, tag: 'homophone', text: `You wrote “${o.resp.core}” but the sentence needs “${o.ref.core}”. ${o.group.tip}` });
        tag('homophone');
      } else if (o.type === 'substituted') {
        c.substituted++;
        result.errors.push({ type: 'substituted', ref: o.ref.core, resp: o.resp.core, tag: 'substitution', text: `You wrote “${o.resp.core}” where the speaker said “${o.ref.core}”. Replay that phrase and listen to the first and last sounds of the word.` });
        tag('substitution');
      } else if (o.type === 'missing') {
        c.missing++;
        const fn = /^(a|an|the|of|to|in|on|at|and|or|but|is|are|was|were|has|have|had|it|its|that|this|for|with|by)$/.test(o.ref.key);
        result.errors.push({ type: 'missing', ref: o.ref.core, resp: '', tag: 'omission', text: fn ? `You left out the small word “${o.ref.core}”. Function words are weak in speech, so they are easy to miss.` : `You left out “${o.ref.core}”.` });
        tag('omission');
      } else if (o.type === 'added') {
        c.added++;
        result.errors.push({ type: 'added', ref: '', resp: o.resp.core, tag: 'addition', text: `You added “${o.resp.core}”, which was not in the dictation.` });
        tag('addition');
      } else if (o.type === 'order') {
        c.order++;
        result.errors.push({ type: 'order', ref: o.ref.core, resp: o.resp.core, tag: 'order', text: `“${o.ref.core}” was heard in a different position. Check the word order.` });
        tag('order');
      }
    });
    result.ops = out;
    return finish(result, ref, resp, opts);
  }

  function finish(result, ref, resp, opts) {
    const c = result.counts;
    const n = Math.max(1, result.refWords);
    const strictLoss = c.spelling + c.substituted + c.missing + c.order + 0.5 * (c.capitalisation + c.punctuation) + 0.5 * c.added;
    result.wordAccuracy = Math.round((Math.max(0, c.correct - c.homophone * 0) / n) * 100);
    result.strictScore = Math.max(0, Math.round(((n - strictLoss) / n) * 100));
    const cn = s => norm(s).toLowerCase().replace(/[^a-z0-9£$€' ]/g, '').replace(/\s+/g, ' ').trim();
    const a = cn(ref), b = cn(resp);
    result.charAccuracy = a.length || b.length ? Math.max(0, Math.round((1 - lev(a, b) / Math.max(a.length, b.length, 1)) * 100)) : 100;
    result.perfect = result.errors.length === 0 && c.added === 0;
    result.respWords = tokenise(resp).length;
    return result;
  }

  return { tokenise, lev, compare, charHtml, charAlign, norm, explainSpelling };
})();
