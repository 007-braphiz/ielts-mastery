/* Dictation Laboratory: an audio-first listening-and-typing workflow.
   The learner hears the content and types it. The reference transcript stays hidden until the answer is submitted. */
(function () {
  const U = IM.util, esc = U.esc;
  const D = () => IM.data.dictation;
  const SC = () => IM.data.scoring.dictation;
  const METHOD = 'How this is scored: your text and the reference are split into words and aligned with an edit-distance algorithm. A near-match counts as a spelling error; a different word counts as a substitution; words you left out or added are counted separately. <b>Word accuracy</b> = correctly transcribed words ÷ reference words. <b>Strict score</b> also removes full credit for each spelling, substitution, missing and word-order error and half credit for each punctuation, capitalisation or added-word difference. <b>Character accuracy</b> = 1 − (letter edit distance ÷ length). Accepted alternative spellings (such as colour/color) are not penalised. This is a custom practice measure, not an IELTS band.';

  function wordItem(word, level, tags) {
    return { id: 'w:' + word.toLowerCase(), cat: 'A', level: level || 3, say: word + '. ' + word + '.', text: word, note: '', hint: '', tags: tags || [], focus: [word.toLowerCase()], mode: 'text', dynamic: true };
  }
  function findItem(id) { return D().items.find(i => i.id === id); }

  function recommendLevel() {
    const st = IM.store.state.dictation, cfg = SC().adaptive;
    const L = st.level || 1;
    const rec = st.recent.filter(r => r.level === L).slice(-cfg.window);
    if (rec.length >= 4) {
      const avg = U.avg(rec.map(r => r.score)) / 100;
      if (avg >= cfg.up && L < 6) return L + 1;
      if (avg < cfg.down && L > 1) return L - 1;
    }
    return L;
  }

  function pool(cat, level, n) {
    const att = {};
    IM.store.state.dictation.attempts.forEach(a => { att[a.itemId] = a.ts; });
    const sorter = (a, b) => (att[a.id] || 0) - (att[b.id] || 0) || Math.random() - 0.5;
    let items = D().items.filter(i => i.cat === cat && i.level === level).sort(sorter);
    if (items.length < n) items = items.concat(D().items.filter(i => i.cat === cat && Math.abs(i.level - level) === 1 && !items.includes(i)).sort(sorter));
    if (items.length < n) items = items.concat(D().items.filter(i => i.cat === cat && !items.includes(i)).sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level)));
    return items.slice(0, n);
  }

  function recordAttempt(item, res, meta) {
    const store = IM.store;
    const date = U.today();
    store.update(s => {
      const d = s.dictation;
      d.attempts.push({ id: U.uid(), ts: Date.now(), date, itemId: item.id, cat: item.cat, level: item.level, mode: meta.mode, rate: meta.rate, replays: meta.replays, first: meta.first, wordAccuracy: res.wordAccuracy, strictScore: res.strictScore, charAccuracy: res.charAccuracy, refWords: res.refWords, counts: res.counts, seconds: meta.seconds });
      if (d.attempts.length > 600) d.attempts.splice(0, d.attempts.length - 600);
      if (meta.first) {
        Object.keys(res.tags).forEach(t => { d.errorStats[t] = (d.errorStats[t] || 0) + res.tags[t]; });
        res.ops.forEach(o => {
          const w = (o.ref ? o.ref.key : null);
          if (w) {
            const rec = d.words[w] || (d.words[w] = { miss: 0, hit: 0 });
            if (o.type === 'ok' || o.type === 'variant') rec.hit++; else rec.miss++;
            if (o.type === 'missing') d.missingWords[w] = (d.missingWords[w] || 0) + 1;
          }
          if (o.type === 'homophone' || o.type === 'spelling' || o.type === 'substituted') { const k = o.ref.key + ' → ' + o.resp.key; d.confusions[k] = (d.confusions[k] || 0) + 1; }
        });
        d.recent.push({ level: item.level, score: res.strictScore });
        if (d.recent.length > 40) d.recent.shift();
        if (item.level === d.level || !d.attempts.length) { /* level moves only through adaptive recommendation */ }
      }
    });
    // spaced repetition: the item itself, and every individual word that was missed or misspelled
    if (!item.dynamic) IM.srs.record('dict:' + item.id, (item.cat === 'S' ? res.perfect : res.strictScore >= 90), { context: 'dictation-' + meta.mode, title: item.cat + ' ' + (item.text.length > 40 ? item.text.slice(0, 40) + '…' : item.text), level: item.level });
    const seen = new Set();
    res.ops.forEach(o => {
      if (!o.ref || o.ref.key.length < 3 || seen.has(o.ref.key)) return;
      const bad = ['spelling', 'homophone', 'substituted', 'missing', 'order'].includes(o.type);
      if (bad || (item.cat === 'A' || item.cat === 'D' || item.cat === 'S') && o.type === 'ok') { seen.add(o.ref.key); IM.srs.record('spell:' + o.ref.key, !bad, { context: 'dictation', title: o.ref.core }); }
    });
    IM.analytics.recordArea('Spelling', res.counts.spelling + res.counts.homophone === 0 ? 1 : 0, 1);
    IM.analytics.recordArea('Listening comprehension', res.wordAccuracy >= 80 ? 1 : 0, 1);
    if (res.counts.punctuation + res.counts.capitalisation > 0 || meta.first) IM.analytics.recordArea('Punctuation', res.counts.punctuation + res.counts.capitalisation === 0 ? 1 : 0, 1);
    if (meta.first) store.logActivity('dictation', 'dictation-' + item.cat, `${item.cat} level ${item.level}: ${res.wordAccuracy}%`, res.wordAccuracy, 100, 2);
  }

  /* ---------------------------------------------------------------- annotated transcript */
  function annotate(res) {
    const ref = [], resp = [];
    res.ops.forEach(o => {
      const rawRef = o.ref ? o.ref.raw : '';
      const sayAttr = o.ref ? ` data-say="${esc(o.ref.core)}" role="button" tabindex="0" title="Click to hear this word"` : '';
      if (o.type === 'ok' || o.type === 'variant') {
        ref.push(`<span class="w ${o.type === 'variant' ? 'variant' : 'ok'}"${sayAttr}>${esc(rawRef)}</span>`);
        const flag = o.cap ? 'cap' : o.punct ? 'punct' : (o.type === 'variant' ? 'variant' : 'ok');
        resp.push(`<span class="w ${flag}" title="${o.cap ? 'capitalisation' : o.punct ? 'punctuation' : o.type === 'variant' ? 'accepted alternative spelling' : ''}">${esc(o.resp.raw)}</span>`);
      } else if (o.type === 'spelling') {
        ref.push(`<span class="w spell"${sayAttr}>${IM.diff.charHtml(o.charDiff.ref, 'd-ref')}${esc(o.ref.trail)}</span>`);
        resp.push(`<span class="w spell">${IM.diff.charHtml(o.charDiff.resp, 'd-resp')}${esc(o.resp.trail)}</span>`);
      } else if (o.type === 'homophone') {
        ref.push(`<span class="w homo"${sayAttr}>${esc(rawRef)}</span>`); resp.push(`<span class="w homo">${esc(o.resp.raw)}</span>`);
      } else if (o.type === 'substituted') {
        ref.push(`<span class="w sub"${sayAttr}>${esc(rawRef)}</span>`); resp.push(`<span class="w sub">${esc(o.resp.raw)}</span>`);
      } else if (o.type === 'missing') {
        ref.push(`<span class="w miss"${sayAttr}>${esc(rawRef)}</span>`); resp.push('<span class="w miss" title="missing">∅</span>');
      } else if (o.type === 'order') {
        ref.push(`<span class="w order"${sayAttr}>${esc(rawRef)}</span>`); resp.push(`<span class="w order">${esc(o.resp.raw)}</span>`);
      } else if (o.type === 'added') {
        resp.push(`<span class="w add">${esc(o.resp.raw)}</span>`);
      }
    });
    return { ref: ref.join(' '), resp: resp.join(' ') };
  }

  const LEGEND = '<div class="legend"><span><span class="w ok">correct</span></span><span><span class="w spell">spelling</span></span><span><span class="w homo">homophone</span></span><span><span class="w sub">substituted</span></span><span><span class="w miss">missing</span></span><span><span class="w add">added</span></span><span><span class="w order">word order</span></span><span><span class="w cap">capital / punctuation</span></span></div>';

  function feedbackHtml(item, res, extra) {
    const a = annotate(res), c = res.counts;
    extra = extra || {};
    return `<div class="card">
      <div class="grid c4">
        ${IM.ui.stat('Word accuracy', res.wordAccuracy + '%', c.correct + ' of ' + res.refWords + ' words')}
        ${IM.ui.stat('Strict score', res.strictScore + '%', 'penalises every error type')}
        ${IM.ui.stat('Character accuracy', res.charAccuracy + '%')}
        ${IM.ui.stat('Replays used', extra.replays == null ? '—' : extra.replays)}
      </div>
      <p class="small">Reference words <b>${res.refWords}</b> · correct <b>${c.correct}</b> · misspelled <b>${c.spelling}</b> · homophone confusions <b>${c.homophone}</b> · other substitutions <b>${c.substituted - c.homophone}</b> · missing <b>${c.missing}</b> · added <b>${c.added}</b> · word order <b>${c.order}</b> · capitalisation <b>${c.capitalisation}</b> · punctuation <b>${c.punctuation}</b>${c.variant ? ` · accepted variant spellings <b>${c.variant}</b>` : ''}</p>
      ${res.perfect ? '<p class="note good"><b>Perfect transcription.</b> One correct answer is not mastery: the item will return for review on a schedule.</p>' : ''}
      ${LEGEND}
      <h4 style="margin-top:10px">Reference transcript (revealed after submission)</h4><div class="diff" id="refline">${a.ref}</div>
      <h4>Your answer</h4><div class="diff">${a.resp || '<span class="muted">(nothing typed)</span>'}</div>
      ${item.note && !item.dynamic ? `<p class="note info"><b>Note:</b> ${esc(item.note)}</p>` : ''}
      ${item.hint && !item.dynamic ? `<p class="small muted">Meaning: ${esc(item.hint)}</p>` : ''}
      ${res.errors.length ? `<h4>Error-by-error explanations</h4><ol class="errlist">${res.errors.map(er => `<li><b>${labelFor(er.type)}</b>: ${er.type === 'spelling' ? `<span class="diff" style="font-size:1rem">${IM.diff.charHtml(er.charDiff.resp, 'd-resp')} → ${IM.diff.charHtml(er.charDiff.ref, 'd-ref')}</span><br>` : ''}${esc(er.text).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')}</li>`).join('')}</ol>` : ''}
      ${remedial(res)}
      <details><summary>How was this scored?</summary><p class="small">${METHOD}</p></details></div>`;
  }
  function labelFor(t) { return ({ spelling: 'Spelling', homophone: 'Homophone', substituted: 'Substitution', missing: 'Missing word', added: 'Added word', order: 'Word order', capitalisation: 'Capitalisation', punctuation: 'Punctuation' })[t] || t; }

  function remedial(res) {
    const tags = Object.keys(res.tags);
    if (!tags.length) return '';
    const recs = [];
    if (tags.includes('plural-ending') || tags.includes('verb-ending')) recs.push('Endings (-s, -ed, -ing) are easy to miss in connected speech. Practise <a href="#/dictation?cat=G">IELTS Listening answer dictation</a>, where singular/plural forms decide the mark.');
    if (tags.includes('homophone')) recs.push('Practise <a href="#/dictation?cat=C">homophones in context</a>.');
    if (tags.includes('double-letter') || tags.includes('silent-letter') || tags.includes('vowel-combo')) recs.push('Drill the <a href="#/dictation?cat=D">commonly misspelled words</a>, which include spelling rules for each word.');
    if (tags.includes('omission')) recs.push('Missing words suggest you stopped listening while typing. In Learning Mode, replay one segment at a time and type each segment before the next.');
    if (tags.includes('order')) recs.push('Word-order slips often mean you typed from memory of the meaning. Listen again for the exact words.');
    return recs.length ? `<div class="note info"><b>Recommended practice</b><ul style="margin:6px 0 0">${recs.map(r => `<li>${r}</li>`).join('')}</ul></div>` : '';
  }

  /* ---------------------------------------------------------------- view */
  IM.views.dictation = function (root, params) {
    const store = IM.store;
    const S = () => store.state;
    let tab = params.tab || 'lab';
    const cfg = { cat: params.cat && 'ABCDEFGHS'.includes(params.cat) ? params.cat : 'E', level: params.level ? Number(params.level) : 'adaptive', n: 5, mode: 'learning' };
    let run = null;
    let timerId = null;
    let lastPlayState = false;

    function stopTimers() { if (timerId) { clearInterval(timerId); timerId = null; } }

    /* ----- starting ----- */
    function startRun(items, mode, label) {
      if (!items.length) { U.toast('No dictation items are available for that selection.', 'warn'); return; }
      if (!IM.audio.hasSpeech && !items.some(i => i.audio)) { U.toast(IM.audio.unsupportedMessage, 'warn'); return; }
      run = { items, i: 0, mode, label, results: [], stage: 'listen', plays: 0, replays: 0, attempts: {}, started: Date.now(), segIdx: -1, rate: defaultRate(items[0]) };
      tab = 'run';
      showItem(true);
    }
    function defaultRate(item) { return item.level <= 1 ? 0.8 : item.level <= 3 ? 0.9 : 1; }

    function startFromConfig() {
      const level = cfg.level === 'adaptive' ? recommendLevel() : cfg.level;
      const n = ['F', 'H'].includes(cfg.cat) ? Math.min(cfg.n, 3) : cfg.n;
      startRun(pool(cfg.cat, level, n), cfg.mode, `${D().categories.find(c => c.id === cfg.cat).name}, level ${level}`);
    }

    function startReview() {
      const due = IM.srs.due().filter(i => i.kind === 'spell' || i.kind === 'dict').slice(0, 8);
      const items = [];
      due.forEach(d => {
        if (d.kind === 'dict') { const it = findItem(d.key.slice(5)); if (it) items.push(it); }
        else items.push(wordItem(d.key.slice(6), 3));
      });
      if (!items.length) { U.toast('No spelling or dictation items are due for review.', 'warn'); tab = 'lab'; draw(); return; }
      startRun(items, 'learning', 'Revision queue');
    }

    function drillMissed(res, item) {
      const words = [];
      res.ops.forEach(o => { if (o.ref && ['spelling', 'homophone', 'substituted', 'missing', 'order'].includes(o.type) && o.ref.key.length >= 3 && !words.includes(o.ref.key)) words.push(o.ref.key); });
      if (!words.length) { U.toast('There are no missed words to drill.'); return; }
      stopAudio();
      startRun(words.slice(0, 8).map(w => wordItem(w, item.level)), 'learning', 'Missed-word drill');
    }

    /* ----- audio ----- */
    function stopAudio() { IM.audio.stop(); }
    function segments(item) { return IM.audio.chunk(item.say, item.cat === 'A' || item.cat === 'D' ? 80 : 130); }
    function pauseFor(txt) { const w = U.countWords(txt); return Math.min(3000, 500 + w * 230); }
    function playAll(first) {
      const item = run.items[run.i], st = S().settings;
      if (run.mode === 'exam' && run.plays >= 1 + SC().exam.maxReplaysPerSegment) { U.toast('No replays left in Exam Simulation Mode.', 'warn'); return; }
      run.plays++;
      if (run.plays > 1) run.replays++;
      updateCounters();
      const segs = segments(item);
      const items = segs.map(t => ({ text: t, pause: pauseFor(t) }));
      const opts = { accent: st.accent, voiceURI: st.voiceURI, rate: run.mode === 'exam' ? 1 : run.rate, onItem: i => setSeg(i, segs.length) };
      const p = item.audio ? IM.audio.playFile(item.audio, items, opts) : IM.audio.speakQueue(items, opts);
      p.catch(() => { U.toast('The voice could not be played. Check your device volume and that a voice is installed.', 'warn'); }).then(() => setSeg(-1, segs.length));
    }
    function playSegment(k) {
      const item = run.items[run.i], st = S().settings, segs = segments(item);
      run.plays++; run.replays++;
      updateCounters();
      IM.audio.speakQueue([{ text: segs[k] }], { accent: st.accent, voiceURI: st.voiceURI, rate: run.rate, onItem: () => setSeg(k, segs.length) }).catch(() => U.toast('The voice could not be played.', 'warn')).then(() => setSeg(-1, segs.length));
    }
    function setSeg(i, n) {
      const el = U.$('#segstatus', root); if (!el) return;
      el.innerHTML = i < 0 ? '<span class="muted">Stopped</span>' : `<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Playing segment ${i + 1} of ${n}`;
    }
    function updateCounters() {
      const el = U.$('#counters', root); if (!el) return;
      const left = run.mode === 'exam' ? Math.max(0, 1 + SC().exam.maxReplaysPerSegment - run.plays) : null;
      el.innerHTML = `Plays: <b>${run.plays}</b>${run.mode === 'exam' ? ` · replays left: <b>${left}</b>` : ` · replays: <b>${run.replays}</b>`}`;
      const btn = U.$('[data-act=play]', root); if (btn && run.mode === 'exam') btn.disabled = left <= 0;
    }

    /* ----- item display ----- */
    function showItem(autoplay) {
      stopTimers();
      const item = run.items[run.i];
      run.stage = 'listen'; run.plays = 0; run.replays = 0; run.startTime = Date.now(); run.rate = run.rate || defaultRate(item);
      const segN = segments(item).length;
      const isAnswer = item.mode === 'answer';
      const words = U.countWords(item.text);
      run.deadline = run.mode === 'exam' ? Date.now() + Math.max(SC().exam.minSeconds, words * SC().exam.secondsPerWord) * 1000 + segN * 4000 : null;
      root.innerHTML = `
        <div class="row space"><h1>Dictation: ${esc(run.label)}</h1><button class="btn ghost small" data-act="quit">End exercise</button></div>
        <div class="progress-steps">${run.items.map((_, k) => `<span class="${k <= run.i ? 'on' : ''}"></span>`).join('')}</div>
        <div class="card">
          <div class="row space"><b>Item ${run.i + 1} of ${run.items.length}</b><span>${IM.ui.badge(run.mode === 'exam' ? 'Exam Simulation Mode' : 'Learning Mode', run.mode === 'exam' ? 'warn' : 'info')} ${IM.ui.badge('Level ' + item.level)}</span>${run.deadline ? '<span class="timer" id="timer" aria-live="off">--:--</span>' : ''}</div>
          <p>${item.dynamic ? 'Listen to the word and type it.' : item.cat === 'G' ? 'Listen, then type the answer that a form or note would need.' : item.cat === 'A' || item.cat === 'D' ? 'Listen to the word and the sentence, then type the word.' : 'Listen carefully and type exactly what you hear, including punctuation.'}</p>
          <div class="audio-ctl" role="group" aria-label="Audio controls">
            <button class="btn" data-act="play">▶ Play</button>
            <button class="btn secondary" data-act="stop">■ Stop</button>
            ${run.mode === 'learning' ? `<label class="small" for="rate">Speed</label><select id="rate" style="width:auto">${SC().learning.rates.map(r => `<option value="${r}" ${r === run.rate ? 'selected' : ''}>${r}×</option>`).join('')}</select>` : '<span class="small muted">Normal speed. Practice rule: one replay allowed.</span>'}
            <span id="counters" class="small"></span><span id="segstatus" class="small" aria-live="polite"></span>
          </div>
          ${run.mode === 'learning' && segN > 1 ? `<div class="row" style="margin-top:8px"><span class="small muted">Replay one segment:</span>${Array.from({ length: segN }, (_, k) => `<button class="btn small ghost" data-seg="${k}">${k + 1}</button>`).join('')}</div>` : ''}
          <div class="formrow" style="margin-top:14px"><label class="field" for="ans">Type what you hear</label>
          ${isAnswer || item.cat === 'A' || item.cat === 'D' || item.dynamic ? '<input id="ans" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">' : `<textarea id="ans" rows="${Math.min(10, 2 + Math.round(words / 12))}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>`}</div>
          <div class="row"><button class="btn" data-act="submit">Submit answer</button><button class="btn ghost" data-act="skip">I could not hear it: skip</button></div>
          <p class="small muted">The transcript is hidden until you submit.${IM.audio.hasSpeech ? '' : ' Speech playback is unavailable in this browser.'}</p>
        </div>`;
      updateCounters();
      const inp = U.$('#ans', root); if (inp) inp.focus();
      if (run.deadline) {
        const tick = () => { const left = Math.round((run.deadline - Date.now()) / 1000), t = U.$('#timer', root); if (t) { t.textContent = U.mmss(left); t.classList.toggle('low', left <= 15); } if (left <= 0) { stopTimers(); U.toast('Time is up: your answer was submitted.', 'warn'); submit(); } };
        tick(); timerId = setInterval(tick, 500);
      }
      if (autoplay) setTimeout(() => { if (run && run.stage === 'listen' && run.plays === 0) playAll(true); }, 250);
    }

    function submit(skipped) {
      if (!run || run.stage !== 'listen') return;
      stopTimers(); stopAudio();
      const item = run.items[run.i];
      const val = skipped ? '' : (U.$('#ans', root) ? U.$('#ans', root).value : '');
      const res = IM.diff.compare(item.text, val, { item });
      const key = item.id;
      const first = !run.attempts[key];
      run.attempts[key] = (run.attempts[key] || 0) + 1;
      const meta = { mode: run.mode, rate: run.mode === 'exam' ? 1 : run.rate, replays: run.replays, first, seconds: Math.round((Date.now() - run.startTime) / 1000) };
      recordAttempt(item, res, meta);
      if (first) run.results.push({ item, res, meta, resp: val });
      run.stage = 'feedback';
      if (run.mode === 'exam') { advance(); return; }
      renderFeedback(item, res, meta);
    }

    function renderFeedback(item, res, meta) {
      const last = run.i + 1 >= run.items.length;
      root.innerHTML = `<div class="row space"><h1>Feedback</h1><button class="btn ghost small" data-act="quit">End exercise</button></div>
        <div class="progress-steps">${run.items.map((_, k) => `<span class="${k <= run.i ? 'on' : ''}"></span>`).join('')}</div>
        ${feedbackHtml(item, res, { replays: meta.replays })}
        <div class="row"><button class="btn secondary" data-act="replay-fb">🔊 Hear it again</button><button class="btn secondary" data-act="retry">↻ Try this item again</button>${res.errors.some(e => ['spelling', 'homophone', 'substituted', 'missing', 'order'].includes(e.type)) ? '<button class="btn secondary" data-act="drill">Practise missed words</button>' : ''}<button class="btn" data-act="next">${last ? 'Finish' : 'Next item'}</button></div>
        <p class="small muted">The first attempt is kept for your statistics. Retries are recorded separately and do not replace it.</p>`;
      run.lastFeedback = { item, res };
    }

    function advance() {
      if (run.i + 1 < run.items.length) { run.i++; run.rate = defaultRate(run.items[run.i]); showItem(true); } else finish();
    }

    function finish() {
      stopTimers(); stopAudio();
      const r = run.results;
      const avg = r.length ? Math.round(U.avg(r.map(x => x.res.wordAccuracy))) : 0;
      const strict = r.length ? Math.round(U.avg(r.map(x => x.res.strictScore))) : 0;
      // adaptive level: consider the exercise level
      const lv = r.length ? Math.round(U.avg(r.map(x => x.item.level))) : 1;
      const rec = recommendLevel();
      store.update(s => { s.dictation.level = rec; });
      const mode = run.mode, label = run.label;
      const itemsHtml = r.map((x, k) => `<details ${mode === 'exam' ? '' : ''}><summary>Item ${k + 1}: ${x.res.wordAccuracy}% word accuracy, strict ${x.res.strictScore}%</summary>${feedbackHtml(x.item, x.res, { replays: x.meta.replays })}</details>`).join('');
      root.innerHTML = `<h1>${mode === 'exam' ? 'Exam Simulation results' : 'Exercise complete'}</h1>
        <div class="card"><div class="grid c3">${IM.ui.stat('Word accuracy (first attempts)', avg + '%')}${IM.ui.stat('Strict score', strict + '%')}${IM.ui.stat('Items', r.length)}</div>
        ${mode === 'exam' ? '<p class="note">Exam Simulation Mode uses practice restrictions (normal speed, a limited number of replays and a timer). They are practice settings and do not claim to reproduce official IELTS rules exactly. Explanations are shown now because the exercise has ended.</p>' : ''}
        ${rec > lv ? '<p class="note good">Your accuracy suggests trying a higher level next time.</p>' : rec < lv ? '<p class="note info">An easier level may build accuracy before moving on.</p>' : ''}
        <p class="small muted">Missed items and words have been added to your revision queue.</p></div>
        <h2>Review every item</h2>${itemsHtml}
        <div class="row"><button class="btn" data-act="again">Another exercise</button><a class="btn secondary" href="#/dictation?tab=progress">My dictation progress</a></div>`;
      run = null;
    }

    /* ----- setup, progress ----- */
    function drawLab() {
      const ds = IM.analytics.dictationSummary();
      const rec = recommendLevel();
      const dueN = IM.srs.due().filter(i => i.kind === 'spell' || i.kind === 'dict').length;
      const count = c => D().items.filter(i => i.cat === c).length;
      root.innerHTML = `<h1>Dictation Laboratory</h1>
        <div class="tabs"><button class="tab ${tab === 'lab' ? 'active' : ''}" data-tab="lab">Practise</button><button class="tab ${tab === 'words100' ? 'active' : ''}" data-tab="words100">100 Words</button><button class="tab ${tab === 'progress' ? 'active' : ''}" data-tab="progress">My progress</button></div>
        ${tab === 'words100' ? words100Html() : tab === 'progress' ? progressHtml(ds) : `
        <div class="card"><h2>1. Choose a category</h2>
          <div class="grid c2">${D().categories.map(c => `<label class="card" style="cursor:pointer;border:2px solid ${cfg.cat === c.id ? 'var(--primary)' : 'var(--border)'};display:block"><input type="radio" name="cat" value="${c.id}" ${cfg.cat === c.id ? 'checked' : ''} style="width:auto;min-height:0"> <b>${c.id}. ${esc(c.name)}</b><br><span class="small muted">${esc(c.blurb)} (${count(c.id)} items)</span></label>`).join('')}</div></div>
        <div class="card"><h2>2. Level, length and mode</h2>
          <div class="grid c3">
            <div><label class="field" for="lvl">Difficulty level</label><select id="lvl"><option value="adaptive" ${cfg.level === 'adaptive' ? 'selected' : ''}>Adaptive (recommended: level ${rec})</option>${IM.data.scoring.dictationLevels.map(l => `<option value="${l.n}" ${cfg.level === l.n ? 'selected' : ''}>Level ${l.n}: ${esc(l.blurb)}</option>`).join('')}</select></div>
            <div><label class="field" for="len">Exercise length</label><select id="len">${[1, 3, 5, 8, 10].map(n => `<option ${cfg.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="small muted">items (paragraph categories use up to 3)</span></div>
            <div><label class="field" for="mode">Mode</label><select id="mode"><option value="learning" ${cfg.mode === 'learning' ? 'selected' : ''}>Learning Mode</option><option value="exam" ${cfg.mode === 'exam' ? 'selected' : ''}>Exam Simulation Mode</option></select></div>
          </div>
          <div class="note info" style="margin-top:12px">${cfg.mode === 'learning' ? '<b>Learning Mode:</b> unlimited replays, adjustable speed, segment-by-segment replay, instant feedback with explanations, retries and targeted practice.' : '<b>Exam Simulation Mode:</b> normal speed, one replay, a timer, no feedback until the exercise ends, and the first attempt is preserved. These are practice settings, not official rules.'}</div>
          <h3 style="margin-top:14px">Instructions</h3><ol class="small"><li>Press <b>Start</b>. A voice reads the content aloud.</li><li>Listen and type what you hear in the box. The transcript is hidden.</li><li>Submit. The app compares your text with the reference, highlights each error and explains it.</li><li>Practise the words you missed. Missed items join your revision queue.</li></ol>
          <div class="row"><button class="btn" data-act="start">▶ Start the exercise</button><button class="btn secondary" data-act="review" ${dueN ? '' : 'disabled'}>Review due spellings (${dueN})</button></div>
          ${IM.audio.hasSpeech ? '' : `<p class="note">${esc(IM.audio.unsupportedMessage)}</p>`}
          <p class="small muted">Voices are provided by your browser and operating system, so pronunciation and speed vary by device. Bundled recordings can be added per item through the <code>audio</code> field in <code>data/dictation.js</code>.</p></div>`}`;
    }

    /* ----- the 100-word study guide ----- */
    const g100 = () => IM.data.spelling100.guide;
    const rec100 = g => IM.srs.get('dict:' + g.id);
    function words100Html() {
      const list = g100();
      const f = cfg.f100 || 'all', q = (cfg.q100 || '').toLowerCase();
      const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
      list.forEach(g => { counts[IM.srs.status(rec100(g))]++; });
      const dueN = IM.srs.due('dict:S').length, weakN = IM.srs.weak('dict:S').length;
      const shown = list.filter(g => {
        const st = IM.srs.status(rec100(g));
        const missed = rec100(g) && rec100(g).lapses >= 1;
        return (f === 'all' || f === st || (f === 'weak' && missed)) && (!q || g.entry.toLowerCase().includes(q) || g.error.includes(q));
      });
      return `<div class="card"><h2>100 Commonly Misspelled Words</h2>
        <p>Your study guide, built into the Dictation Laboratory. Each word is dictated inside a sentence: you hear it, type it, and the app shows the common error and the memory cue. A word counts as <b>mastered</b> only after you spell it exactly right on several different days and in both Learning and Exam modes, so one lucky answer never counts.</p>
        ${IM.ui.bar(U.pct(counts.mastered, 100), 'Words mastered')}
        <p><b>${counts.mastered}</b> of 100 mastered · ${counts.reviewing} reviewing · ${counts.learning} learning · ${counts.new} not started</p>
        <div class="row"><button class="btn" data-w100="new">▶ Next 10 new words</button>
        <button class="btn secondary" data-w100="due" ${dueN ? '' : 'disabled'}>Review due (${dueN})</button>
        <button class="btn secondary" data-w100="weak" ${weakN ? '' : 'disabled'}>Weak words (${weakN})</button>
        <button class="btn secondary" data-w100="test">Exam Simulation: 20 random words</button></div>
        <p class="small muted">Spelling is exact here. Where US and UK spellings differ (jewelry/jewellery, judgment/judgement, license/licence, maneuver/manoeuvre, neighbor/neighbour), both are accepted. “Humourous” is not accepted: the standard spelling in both US and UK English is “humorous”.</p></div>
        <div class="card"><div class="grid c3"><div><label class="field" for="f100">Show</label><select id="f100">${[['all', 'All 100'], ['new', 'Not started'], ['learning', 'Learning'], ['reviewing', 'Reviewing'], ['mastered', 'Mastered'], ['weak', 'Ever missed']].map(o => `<option value="${o[0]}" ${f === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
        <div><label class="field" for="q100">Search</label><input id="q100" type="search" value="${esc(cfg.q100 || '')}"></div></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>#</th><th>Correct spelling</th><th>Common error</th><th>Memory cue</th><th>Status</th><th></th></tr></thead><tbody>${shown.map(g => { const r = rec100(g); const st = IM.srs.status(r); return `<tr><td>${g.n}</td><td><b>${esc(g.entry)}</b></td><td><span class="muted">${esc(g.error)}</span></td><td class="small">${esc(g.cue)}</td><td><span class="badge ${st === 'mastered' ? 'good' : st === 'new' ? '' : 'info'}">${st}</span>${r ? `<div class="small muted">${r.correct}/${r.attempts} right</div>` : ''}</td><td><button class="btn small ghost" data-say="${esc(g.entry)}" aria-label="Hear ${esc(g.entry)}">🔊</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
    }
    function start100(kind) {
      const all = g100().map(g => findItem(g.id));
      let items = [];
      if (kind === 'new') {
        items = all.filter(i => !IM.srs.get('dict:' + i.id)).slice(0, 10);
        if (items.length < 10) items = items.concat(all.filter(i => IM.srs.get('dict:' + i.id) && IM.srs.status(IM.srs.get('dict:' + i.id)) !== 'mastered').sort((a, b) => IM.srs.get('dict:' + a.id).box - IM.srs.get('dict:' + b.id).box).slice(0, 10 - items.length));
      } else if (kind === 'due') items = IM.srs.due('dict:S').slice(0, 10).map(d => findItem(d.key.slice(5))).filter(Boolean);
      else if (kind === 'weak') items = IM.srs.weak('dict:S').slice(0, 10).map(d => findItem(d.key.slice(5))).filter(Boolean);
      else items = U.shuffle(all).slice(0, 20);
      if (!items.length) { U.toast(kind === 'new' ? 'All 100 words are mastered. Well done!' : 'Nothing to practise in that group yet.', 'warn'); return; }
      startRun(items, kind === 'test' ? 'exam' : 'learning', kind === 'test' ? '100 words: exam simulation' : '100 commonly misspelled words');
    }

    function progressHtml(ds) {
      if (!ds.total) return IM.ui.empty('No dictation attempts yet. Complete an exercise to see your statistics.', '<button class="btn" data-tab="lab">Start practising</button>');
      const st = S().dictation;
      const words = Object.entries(st.words).filter(([, v]) => v.miss > 0).sort((a, b) => b[1].miss - a[1].miss).slice(0, 10);
      const confus = Object.entries(st.confusions).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const missing = Object.entries(st.missingWords).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const errs = IM.analytics.dictationErrorStats();
      const catName = c => (D().categories.find(x => x.id === c) || {}).name || c;
      const recs = [];
      errs.slice(0, 3).forEach(e => { if (e.count >= 3) recs.push(`${e.label}: ${e.count} errors recorded.`); });
      return `<div class="grid c4"><div class="card">${IM.ui.stat('Attempts', ds.total)}</div><div class="card">${IM.ui.stat('First-attempt accuracy', ds.firstAvg == null ? 'n/a' : ds.firstAvg + '%')}</div><div class="card">${IM.ui.stat('Retry accuracy', ds.retryAvg == null ? 'n/a' : ds.retryAvg + '%')}</div><div class="card">${IM.ui.stat('Last 10 attempts', ds.recentAvg + '%')}</div></div>
        <div class="grid c2"><div class="card"><h3>Accuracy by level (first attempts)</h3>${IM.charts.hbars(ds.byLevel.map(r => ({ label: 'Level ' + r.key, pct: r.pct, n: r.n })))}</div>
        <div class="card"><h3>Accuracy by category</h3>${IM.charts.hbars(ds.byCat.map(r => ({ label: r.key + '. ' + catName(r.key), pct: r.pct, n: r.n })))}</div>
        <div class="card"><h3>Accuracy by playback speed</h3>${ds.bySpeed.length ? IM.charts.hbars(ds.bySpeed.map(r => ({ label: r.key + '× speed', pct: r.pct, n: r.n }))) : '<p class="muted">No data.</p>'}</div>
        <div class="card"><h3>Error types</h3>${errs.length ? `<ul>${errs.map(e => `<li>${esc(e.label)} <span class="badge">${e.count}</span></li>`).join('')}</ul>` : '<p class="muted">No errors recorded.</p>'}</div>
        <div class="card"><h3>Frequently misspelled or missed words</h3>${words.length ? `<ul>${words.map(([w, v]) => `<li><b>${esc(w)}</b> <span class="muted small">missed ${v.miss}×, correct ${v.hit}×</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}</div>
        <div class="card"><h3>Homophone and spelling confusions</h3>${confus.length ? `<ul>${confus.map(([k, n]) => `<li>${esc(k)} <span class="badge">${n}</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}<h3>Words often left out</h3>${missing.length ? `<p>${missing.map(([w, n]) => `${esc(w)} (${n})`).join(', ')}</p>` : '<p class="muted">None yet.</p>'}</div></div>
        ${recs.length ? `<div class="card"><h3>Recommended targeted practice</h3><ul>${recs.map(r => `<li>${esc(r)}</li>`).join('')}</ul><p class="small">Open the matching category in the Practise tab, for example plural and verb endings in category G, homophones in C, and difficult spellings in D.</p></div>` : ''}`;
    }

    function draw() {
      if (run) return;
      drawLab();
    }

    /* ----- events ----- */
    root.addEventListener('click', e => {
      const say = e.target.closest('[data-say]');
      if (say) { const st = S().settings; IM.audio.speak(say.dataset.say, { accent: st.accent, voiceURI: st.voiceURI, rate: 0.8 }).catch(() => {}); return; }
      const tb = e.target.closest('[data-tab]');
      if (tb) { tab = tb.dataset.tab; draw(); return; }
      const w1 = e.target.closest('[data-w100]');
      if (w1) { start100(w1.dataset.w100); return; }
      const sg = e.target.closest('[data-seg]');
      if (sg && run) { playSegment(Number(sg.dataset.seg)); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'start': startFromConfig(); break;
        case 'review': startReview(); break;
        case 'play': if (run) playAll(false); break;
        case 'stop': stopAudio(); setSeg(-1, 0); break;
        case 'submit': submit(false); break;
        case 'skip': submit(true); break;
        case 'quit': if (run && run.results.length) { finish(); } else { stopTimers(); stopAudio(); run = null; tab = 'lab'; draw(); } break;
        case 'replay-fb': { const it = run.lastFeedback.item, st = S().settings; IM.audio.speakQueue(segments(it).map(t => ({ text: t, pause: 600 })), { accent: st.accent, voiceURI: st.voiceURI, rate: run.rate }).catch(() => {}); break; }
        case 'retry': { const item = run.lastFeedback.item; run.rate = run.rate || defaultRate(item); showItem(true); break; }
        case 'drill': drillMissed(run.lastFeedback.res, run.lastFeedback.item); break;
        case 'next': advance(); break;
        case 'again': tab = 'lab'; draw(); break;
      }
    });
    root.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-say]')) { e.preventDefault(); e.target.click(); }
      if (e.key === 'Enter' && e.target.id === 'ans' && e.target.tagName === 'INPUT' && run && run.stage === 'listen') { e.preventDefault(); submit(false); }
    });
    root.addEventListener('input', e => {
      if (e.target.id === 'q100') { cfg.q100 = e.target.value; const pos = e.target.selectionStart; draw(); const el = U.$('#q100', root); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
    });
    root.addEventListener('change', e => {
      if (e.target.name === 'cat') { cfg.cat = e.target.value; draw(); }
      if (e.target.id === 'f100') { cfg.f100 = e.target.value; draw(); }
      if (e.target.id === 'lvl') { cfg.level = e.target.value === 'adaptive' ? 'adaptive' : Number(e.target.value); }
      if (e.target.id === 'len') cfg.n = Number(e.target.value);
      if (e.target.id === 'mode') { cfg.mode = e.target.value; draw(); }
      if (e.target.id === 'rate' && run) run.rate = Number(e.target.value);
    });

    if (params.mode === 'review') startReview(); else draw();
    return () => { stopTimers(); IM.audio.stop(); };
  };
})();
