/* Vocabulary Mastery Centre: six internal levels, twelve exercise types, spaced repetition and adaptive level. */
(function () {
  const U = IM.util, esc = U.esc;
  const E = () => IM.data.vocabulary.entries;
  const byId = id => E().find(e => e.id === id);
  const LV = () => IM.data.scoring.vocabLevels;

  function say(text, rate) {
    const st = IM.store.state.settings;
    if (!IM.audio.hasSpeech) { U.toast('Speech playback is not available in this browser.', 'warn'); return; }
    IM.audio.speak(text, { accent: st.accent, voiceURI: st.voiceURI, rate: rate || 0.9 }).catch(() => U.toast('The voice could not be played.', 'warn'));
  }

  function recommendLevel() {
    const st = IM.store.state.vocab;
    const cfg = IM.data.scoring.vocabAdaptive;
    let L = st.preferredLevel || 1;
    const recent = st.recent.filter(r => r.level === L).slice(-cfg.window);
    if (recent.length >= 8) {
      const acc = recent.filter(r => r.correct).length / recent.length;
      if (acc >= cfg.up && L < 6) L++;
      else if (acc < cfg.down && L > 1) L--;
    }
    return L;
  }

  function entryCard(e, opts) {
    opts = opts || {};
    const it = IM.srs.get('vocab:' + e.id);
    const status = IM.srs.status(it);
    return `<div class="card wordcard">
      <div class="row space"><div><h2>${esc(e.word)} <span class="muted small" style="font-family:var(--font)">${esc(e.pos)}</span></h2>
      <div><b>${esc(e.ipa)}</b> · say it: <i>${esc(e.respelling)}</i> <span class="muted small">(British English)</span></div></div>
      <div class="row"><button class="btn small secondary" data-say="${esc(e.word)}">🔊 Word</button><button class="btn small secondary" data-say="${esc(e.example)}">🔊 Example</button></div></div>
      <dl class="kv">
        <dt>Definition</dt><dd>${esc(e.definition)}</dd>
        <dt>Example</dt><dd><i>${esc(e.example)}</i></dd>
        <dt>Collocations</dt><dd>${e.collocations.map(esc).join(' · ')}</dd>
        ${e.synonyms.length ? `<dt>Synonyms</dt><dd>${e.synonyms.map(esc).join(', ')}</dd>` : ''}
        ${e.antonyms.length ? `<dt>Antonyms</dt><dd>${e.antonyms.map(esc).join(', ')}</dd>` : ''}
        <dt>Word family</dt><dd>${e.family.map(f => `${esc(f.word)} <span class="muted small">(${esc(f.pos)})</span>`).join(' · ')}</dd>
        <dt>Pattern</dt><dd>${esc(e.pattern)}</dd>
        <dt>Typical mistake</dt><dd>${esc(e.mistake)}</dd>
        <dt>Formality</dt><dd>${esc(e.register)}</dd>
        <dt>IELTS use</dt><dd>${esc(e.ielts)}</dd>
        <dt>Level and topic</dt><dd>Level ${e.level} · ${esc(e.category)}</dd>
        <dt>Mastery</dt><dd>${statusBadge(status)} ${it ? `<span class="small muted">${it.attempts} attempt(s), ${it.correct} correct, box ${it.box}/${IM.data.scoring.srs.intervalsDays.length - 1}, next review ${it.due ? U.fmtDate(it.due) : '—'}; ${it.days.length} day(s), ${it.contexts.length} exercise type(s)</span>` : '<span class="small muted">Not practised yet</span>'}</dd>
      </dl>${opts.after || ''}</div>`;
  }
  function statusBadge(s) { return `<span class="badge ${s === 'mastered' ? 'good' : s === 'new' ? '' : 'info'}">${s}</span>`; }

  IM.views.vocab = function (root, params) {
    const store = IM.store;
    const S = () => store.state;
    let mode = params.mode || 'home';
    let sel = { level: recommendLevel(), cat: '', n: 10 };
    let session = null;

    function pickItems(kind) {
      const n = sel.n;
      let items = [];
      const inFilter = e => (!sel.cat || e.category === sel.cat);
      if (kind === 'review') {
        items = IM.srs.due('vocab:').map(i => byId(i.key.slice(6))).filter(Boolean).slice(0, n);
      } else if (kind === 'weak') {
        items = IM.srs.weak('vocab:').map(i => byId(i.key.slice(6))).filter(Boolean).slice(0, n);
      } else {
        const due = IM.srs.due('vocab:').map(i => byId(i.key.slice(6))).filter(e => e && e.level === sel.level && inFilter(e)).slice(0, Math.ceil(n / 2));
        items = due.slice();
        const fresh = E().filter(e => e.level === sel.level && inFilter(e) && !IM.srs.get('vocab:' + e.id) && !items.includes(e));
        U.shuffle(fresh).slice(0, n - items.length).forEach(e => items.push(e));
        if (items.length < n) {
          const more = E().filter(e => e.level === sel.level && inFilter(e) && !items.includes(e)).sort((a, b) => ((IM.srs.get('vocab:' + a.id) || {}).box || 0) - ((IM.srs.get('vocab:' + b.id) || {}).box || 0));
          more.slice(0, n - items.length).forEach(e => items.push(e));
        }
      }
      return items;
    }

    function start(kind) {
      const items = pickItems(kind);
      if (!items.length) { U.toast(kind === 'review' ? 'No vocabulary reviews are due.' : kind === 'weak' ? 'No weak words yet.' : 'No words match this selection.', 'warn'); mode = 'home'; draw(); return; }
      store.update(s => { s.vocab.preferredLevel = sel.level; });
      session = { kind, items, i: 0, results: [], phase: 'learn', started: Date.now() };
      mode = 'session';
      draw();
    }

    function nextQuestion() {
      const e = session.items[session.i];
      const it = IM.srs.get('vocab:' + e.id);
      const types = IM.tutor.typesFor(e, it);
      session.q = IM.tutor.vocabQuestion(e, U.pick(types));
      session.answered = false;
      session.qStart = Date.now();
    }

    function drawSession() {
      const e = session.items[session.i];
      const total = session.items.length;
      const head = `<div class="row space"><h1>Vocabulary session</h1><button class="btn ghost small" data-act="quit">End session</button></div>
        <div class="progress-steps">${session.items.map((_, k) => `<span class="${k <= session.i ? 'on' : ''}"></span>`).join('')}</div>
        <p class="muted small">Word ${session.i + 1} of ${total} · Level ${e.level}</p>`;
      if (session.phase === 'learn') {
        const known = IM.srs.get('vocab:' + e.id);
        root.innerHTML = head + entryCard(e, { after: `<div class="row" style="margin-top:12px"><button class="btn" data-act="tryit">${known ? 'Test myself' : 'I have read it: test me'}</button></div>` });
        return;
      }
      const q = session.q;
      let body = `<div class="card"><p class="muted small">${esc(IM.tutor.TYPES[q.type])}</p><p style="font-size:1.1rem">${q.prompt}</p>`;
      if (session.answered) {
        const r = session.last;
        body += `<div class="explain ${r.correct ? 'good' : 'wrong'}"><b>${r.correct ? '✔ Correct' : '✘ Not quite'}</b>${q.typed || q.sentence ? '' : ''} ${r.msg || ''}<br>${esc(q.explain || '')}</div>`;
        if (q.options) body += q.options.map((o, k) => `<div class="optbtn ${k === q.answerIndex ? 'right' : (k === r.chosen ? 'wrong' : '')}">${esc(o)}</div>`).join('');
        body += `<div class="row" style="margin-top:12px"><button class="btn" data-act="next">${session.i + 1 < total ? 'Next word' : 'Finish'}</button><button class="btn secondary small" data-say="${esc(e.word)}">🔊 ${esc(e.word)}</button></div>`;
      } else if (q.options) {
        body += q.options.map((o, k) => `<button class="optbtn" data-choice="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('');
      } else if (q.sentence) {
        body += `<textarea id="ans" rows="3" aria-label="Your sentence" placeholder="Write your sentence here"></textarea><div class="row" style="margin-top:8px"><button class="btn" data-act="check">Check</button></div>`;
      } else {
        body += `<input id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"><div class="row" style="margin-top:8px"><button class="btn" data-act="check">Check</button></div>`;
      }
      root.innerHTML = head + body + '</div>';
      const inp = U.$('#ans', root); if (inp) inp.focus();
    }

    function finishAnswer(correct, extra) {
      const e = session.items[session.i], q = session.q;
      IM.srs.record('vocab:' + e.id, correct, { context: q.type, title: e.word, level: e.level, ms: Date.now() - session.qStart });
      store.update(s => { s.vocab.recent.push({ level: e.level, correct }); if (s.vocab.recent.length > 80) s.vocab.recent.shift(); s.vocab.studiedCount++; });
      IM.analytics.recordArea('Vocabulary', correct ? 1 : 0, 1);
      session.results.push({ e, correct, type: q.type });
      session.answered = true;
      session.last = Object.assign({ correct }, extra || {});
      drawSession();
    }

    function drawSummary() {
      const r = session.results, c = r.filter(x => x.correct).length;
      store.update(() => {});
      IM.store.logActivity('vocab', session.kind, `${c}/${r.length} correct`, c, r.length, Math.max(3, Math.round((Date.now() - session.started) / 60000)));
      const missed = r.filter(x => !x.correct);
      const rec = recommendLevel();
      root.innerHTML = `<h1>Session complete</h1>
        <div class="card"><div class="grid c3">${IM.ui.stat('Score', c + ' / ' + r.length)}${IM.ui.stat('Accuracy', U.pct(c, r.length) + '%')}${IM.ui.stat('Words tried', new Set(r.map(x => x.e.id)).size)}</div>
        ${rec !== sel.level ? `<p class="note info">Based on your recent accuracy, Level ${rec} is recommended next.</p>` : ''}
        <p class="small muted">One correct answer does not mean a word is mastered. Words return for review at growing intervals, in different exercise types.</p></div>
        ${missed.length ? `<div class="card"><h2>Words to revisit</h2>${missed.map(m => `<p><b>${esc(m.e.word)}</b>: ${esc(m.e.definition)} <span class="muted small">(typical mistake: ${esc(m.e.mistake)})</span></p>`).join('')}</div>` : '<div class="note good">No missed words in this session.</div>'}
        <div class="row"><button class="btn" data-act="again">Another session</button><button class="btn secondary" data-act="home">Back to vocabulary</button></div>`;
      session = null; mode = 'summary';
    }

    function drawHome() {
      const vp = IM.analytics.vocabProgress();
      const dueN = IM.srs.due('vocab:').length, weakN = IM.srs.weak('vocab:').length;
      const rec = recommendLevel();
      root.innerHTML = `<h1>Vocabulary Mastery Centre</h1>
        <div class="tabs"><button class="tab ${mode === 'home' ? 'active' : ''}" data-mode="home">Practise</button><button class="tab ${mode === 'browse' ? 'active' : ''}" data-mode="browse">Word list</button><button class="tab ${mode === 'progress' ? 'active' : ''}" data-mode="progress">Progress</button></div>
        ${mode === 'browse' ? browseHtml() : mode === 'progress' ? progressHtml(vp) : `
        <div class="card"><h2>Choose a level</h2><p class="small muted">Levels 1–6 are internal learning levels, not IELTS bands. Level ${rec} is recommended from your recent accuracy${S().vocab.recent.length < 8 ? ' (more answers are needed for a reliable recommendation)' : ''}.</p>
        <div class="grid c3">${LV().map(l => {
          const ents = E().filter(e => e.level === l.n), m = ents.filter(e => IM.srs.status(IM.srs.get('vocab:' + e.id)) === 'mastered').length;
          return `<button class="card levelbtn" style="cursor:pointer;border:2px solid ${sel.level === l.n ? 'var(--primary)' : 'var(--border)'}" data-level="${l.n}"><b>Level ${l.n}: ${esc(l.name)}</b>${rec === l.n ? ' <span class="badge info">recommended</span>' : ''}<p class="small muted" style="margin:4px 0">${esc(l.blurb)}</p>${IM.ui.bar(U.pct(m, ents.length))}<span class="small">${m}/${ents.length} mastered</span></button>`;
        }).join('')}</div>
        <div class="grid c3" style="margin-top:12px">
          <div><label class="field" for="cat">Topic</label><select id="cat"><option value="">All topics</option>${IM.data.vocabulary.categories.map(c => `<option ${sel.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          <div><label class="field" for="n">Words in the session</label><select id="n">${[5, 10, 15, 20].map(n => `<option ${sel.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="margin-top:12px"><button class="btn" data-act="startnew">Start learning (Level ${sel.level})</button>
        <button class="btn secondary" data-act="startreview" ${dueN ? '' : 'disabled'}>Review due words (${dueN})</button>
        <button class="btn secondary" data-act="startweak" ${weakN ? '' : 'disabled'}>Practise weak words (${weakN})</button></div></div>
        <div class="card soft"><h3>How a session works</h3><ol class="small"><li>You read a full word card: meaning, pronunciation, collocations, word family, typical mistakes and IELTS use.</li><li>You answer a question. Early questions use recognition; later ones remove the options and ask you to produce the word, a word-form, a paraphrase or your own sentence.</li><li>The word is rescheduled. A word counts as mastered only after repeated successful retrieval on different days and in different exercise types.</li></ol></div>`}`;
    }

    function browseHtml() {
      const q = (S().vocab.query || '').toLowerCase();
      const list = E().filter(e => (!sel.cat || e.category === sel.cat) && (!q || e.word.includes(q) || e.definition.toLowerCase().includes(q)));
      return `<div class="card"><div class="grid c3"><div><label class="field" for="q">Search</label><input id="q" type="search" value="${esc(q)}"></div><div><label class="field" for="cat">Topic</label><select id="cat"><option value="">All topics</option>${IM.data.vocabulary.categories.map(c => `<option ${sel.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>Word</th><th>Level</th><th>Topic</th><th>Status</th></tr></thead><tbody>${list.map(e => `<tr><td><a href="#" data-open="${esc(e.id)}"><b>${esc(e.word)}</b></a> <span class="muted small">${esc(e.pos)}</span></td><td>${e.level}</td><td>${esc(e.category)}</td><td>${statusBadge(IM.srs.status(IM.srs.get('vocab:' + e.id)))}</td></tr>`).join('')}</tbody></table></div></div><div id="detail"></div>`;
    }

    function progressHtml(vp) {
      const rows = LV().map(l => {
        const ents = E().filter(e => e.level === l.n);
        const c = { mastered: 0, reviewing: 0, learning: 0, new: 0 };
        ents.forEach(e => { c[IM.srs.status(IM.srs.get('vocab:' + e.id))]++; });
        return `<tr><td>Level ${l.n}</td><td>${ents.length}</td><td>${c.mastered}</td><td>${c.reviewing}</td><td>${c.learning}</td><td>${c.new}</td></tr>`;
      }).join('');
      const types = {};
      Object.values(S().srs).filter(i => i.kind === 'vocab').forEach(i => i.contexts.forEach(c => { types[c] = (types[c] || 0) + 1; }));
      return `<div class="card"><h2>Your vocabulary progress</h2><div class="grid c3">${IM.ui.stat('Mastered', vp.counts.mastered + ' / ' + vp.total)}${IM.ui.stat('Answer accuracy', vp.accuracy == null ? 'n/a' : vp.accuracy + '%')}${IM.ui.stat('Answers recorded', vp.attempts)}</div>
        <div class="table-wrap"><table class="t"><thead><tr><th>Level</th><th>Words</th><th>Mastered</th><th>Reviewing</th><th>Learning</th><th>New</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="small muted">Starter library: ${vp.total} words with full entries. Add more by appending lines to <code>data/vocabulary.js</code>.</p></div>`;
    }

    function draw() {
      if (mode === 'session' && session) {
        if (!session.q) nextQuestion();
        drawSession();
      } else drawHome();
    }

    root.addEventListener('click', e => {
      const say1 = e.target.closest('[data-say]');
      if (say1) { say(say1.dataset.say); return; }
      const m = e.target.closest('[data-mode]');
      if (m) { mode = m.dataset.mode; draw(); return; }
      const lv = e.target.closest('[data-level]');
      if (lv) { sel.level = Number(lv.dataset.level); draw(); return; }
      const op = e.target.closest('[data-open]');
      if (op) { e.preventDefault(); const en = byId(op.dataset.open); U.$('#detail', root).innerHTML = entryCard(en); U.$('#detail', root).scrollIntoView({ behavior: 'smooth' }); return; }
      const ch = e.target.closest('[data-choice]');
      if (ch && session && !session.answered) {
        const k = Number(ch.dataset.choice), q = session.q, ok = k === q.answerIndex;
        finishAnswer(ok, { chosen: k });
        return;
      }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      switch (a.dataset.act) {
        case 'startnew': start('new'); break;
        case 'startreview': start('review'); break;
        case 'startweak': start('weak'); break;
        case 'again': mode = 'home'; start('new'); break;
        case 'home': mode = 'home'; draw(); break;
        case 'quit': if (session && session.results.length) drawSummary(); else { session = null; mode = 'home'; draw(); } break;
        case 'tryit': session.phase = 'ask'; nextQuestion(); drawSession(); break;
        case 'next':
          if (session.i + 1 < session.items.length) { session.i++; session.phase = IM.srs.get('vocab:' + session.items[session.i].id) ? 'ask' : 'learn'; session.q = null; if (session.phase === 'ask') nextQuestion(); drawSession(); } else drawSummary();
          break;
        case 'check': {
          const q = session.q, val = (U.$('#ans', root).value || '').trim();
          if (!val) { U.toast('Type an answer first.', 'warn'); return; }
          if (q.sentence) {
            const stem = q.entry.word.toLowerCase().replace(/e$/, '');
            const hasWord = new RegExp('\\b' + stem, 'i').test(val);
            const words = U.countWords(val);
            const an = IM.tutor.analyse(val);
            const sure = an.issues.filter(i => i.confidence === 'sure');
            const ok = hasWord && words >= 7 && !sure.length;
            const msg = !hasWord ? `Your sentence does not contain “${esc(q.entry.word)}”.` : words < 7 ? 'Use at least 7 words so the context is clear.' : sure.length ? `Check: ${esc(sure[0].msg)} Suggested: “${esc(sure[0].corrected || sure[0].fix)}”.` : 'Good: the word is used in a full sentence and no common errors were detected. This check cannot judge meaning, so compare with the model sentence.';
            finishAnswer(ok, { msg });
          } else {
            const g = val.toLowerCase().replace(/[’]/g, "'");
            const ok = q.accept.includes(g);
            let msg = '';
            if (!ok) { const d = IM.diff.lev(g, q.answerText.toLowerCase()); msg = `Correct answer: <b>${esc(q.answerText)}</b>.${d <= 2 ? ' Your answer was very close: check the spelling.' : ''}`; }
            finishAnswer(ok, { msg });
          }
          break;
        }
      }
    });
    root.addEventListener('change', e => {
      if (e.target.id === 'cat') { sel.cat = e.target.value; draw(); }
      if (e.target.id === 'n') sel.n = Number(e.target.value);
    });
    root.addEventListener('input', e => { if (e.target.id === 'q') { S().vocab.query = e.target.value; const pos = e.target.selectionStart; draw(); const el = U.$('#q', root); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ans' && e.target.tagName === 'INPUT') { const b = U.$('[data-act=check]', root); if (b) b.click(); } });

    if (params.mode === 'review') start('review'); else if (params.mode === 'weak') start('weak'); else draw();
    return () => IM.audio.stop();
  };
})();
