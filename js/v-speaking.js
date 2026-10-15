/* Speaking Coach: three-part practice and examination with a virtual examiner, optional recording and speech-to-text,
   pronunciation, shadowing and fluency exercises. Fluency/pronunciation judgements rely on the learner's self-rating. */
(function () {
  const U = IM.util, esc = U.esc;
  const S = () => IM.store.state;
  const SP = () => IM.data.speaking;
  const CRIT = () => IM.data.scoring.speakingCriteria;

  function hear(text, rate, pitch) {
    const s = S().settings;
    if (!IM.audio.hasSpeech) { U.toast('Speech playback is not available in this browser.', 'warn'); return Promise.resolve(); }
    return IM.audio.speak(text, { accent: s.accent, voiceURI: s.voiceURI, rate: rate || 0.95, pitch: pitch || 1.05 }).catch(() => U.toast('The voice could not be played.', 'warn'));
  }

  /* Answer capture widget. Records audio and transcribes where supported; typed input is always available. */
  function capture(host, o) {
    const sr = IM.audio.recognition.supported, rec = IM.audio.recorder.supported;
    host.innerHTML = `<div class="card soft"><div class="row"><button class="btn" data-c="start">${rec || sr ? '● Start answering' : '▶ Start the timer'}</button><button class="btn secondary" data-c="stop" disabled>■ Stop</button><span class="timer" data-c="clock">00:00</span><span class="small muted" data-c="status"></span></div>
      <p class="small muted">${rec ? 'Your microphone will be used to record your answer; the recording stays in this browser tab and is never uploaded.' : 'Recording is not available in this browser, so speak aloud and the timer will measure your duration.'} ${sr ? 'Speech-to-text is on, so a transcript will appear below.' : 'Speech-to-text is not supported here: type a summary of what you said below for text-based feedback.'}</p>
      <label class="field" for="tr-${o.id}">Transcript or typed answer ${sr ? '(you can edit it)' : '(optional, enables vocabulary and grammar checks)'}</label><textarea id="tr-${o.id}" rows="4" data-c="text"></textarea><div data-c="audio"></div></div>`;
    const q = s => host.querySelector('[data-c=' + s + ']');
    let t0 = 0, tick = null, srH = null, recH = null, blobUrl = null, stopped = true, dur = 0;
    const clock = () => { const d = Math.round((Date.now() - t0) / 1000); q('clock').textContent = U.mmss(d); if (o.maxSec && d >= o.maxSec) stop(); };
    async function start() {
      if (!stopped) return;
      q('status').textContent = '';
      try { if (rec) recH = await IM.audio.recorder.start(); } catch (e) { recH = null; q('status').textContent = 'Microphone unavailable (' + (e.name || 'error') + '): continuing without recording.'; }
      try { if (sr) srH = IM.audio.recognition.start({ lang: S().settings.accent === 'en-US' ? 'en-US' : 'en-GB', onText: (f, i) => { q('text').value = (f + ' ' + i).trim(); }, onError: er => { q('status').textContent = 'Speech recognition: ' + er + '. You can type instead.'; } }); } catch (e) { srH = null; }
      stopped = false; t0 = Date.now(); tick = setInterval(clock, 500);
      q('start').disabled = true; q('stop').disabled = false;
      if (!q('status').textContent) q('status').innerHTML = '<span class="rec-dot"></span>Answering…';
    }
    async function stop() {
      if (stopped) return;
      stopped = true; clearInterval(tick); dur = Math.round((Date.now() - t0) / 1000);
      if (srH) { const t = srH.text; srH.stop(); if (t && !q('text').value.trim()) q('text').value = t; }
      if (recH) { const blob = await recH.stop(); blobUrl = URL.createObjectURL(blob); q('audio').innerHTML = `<p class="small">Playback of your recording:</p><audio controls src="${blobUrl}" style="width:100%"></audio>`; }
      q('start').disabled = false; q('start').textContent = '↻ Record again'; q('stop').disabled = true; q('status').textContent = 'Stopped.';
      if (o.onDone) setTimeout(() => o.onDone({ durationSec: dur, transcript: q('text').value.trim(), audioUrl: blobUrl }), srH ? 600 : 0);
    }
    host.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; if (b.dataset.c === 'start') start(); if (b.dataset.c === 'stop') stop(); });
    return { stop, destroy() { clearInterval(tick); if (srH) srH.abort(); if (recH) recH.stop(); if (blobUrl) URL.revokeObjectURL(blobUrl); }, text: () => q('text').value.trim(), duration: () => dur };
  }

  function ratingForm(id) {
    return `<h4>Rate yourself (1 = weak, 5 = strong)</h4><div class="criteria">${CRIT().map(c => `<div class="crit"><h4>${esc(c.name)}</h4><div class="rate" role="radiogroup" aria-label="${esc(c.name)}">${[1, 2, 3, 4, 5].map(n => `<label title="${esc(SP().descriptors[c.id][n - 1])}"><input type="radio" name="${id}-${c.id}" value="${n}"> ${n}</label>`).join('')}</div><details><summary class="small">What do the ratings mean?</summary><ol class="small">${SP().descriptors[c.id].map(d => `<li>${esc(d)}</li>`).join('')}</ol></details></div>`).join('')}</div>`;
  }
  function readRatings(host, id) {
    const o = {};
    CRIT().forEach(c => { const r = host.querySelector(`input[name=${id}-${c.id}]:checked`); if (r) o[c.id] = Number(r.value); });
    return o;
  }

  function feedbackHtml(est, transcript, model, extra) {
    const o = est.objective;
    const names = { fc: 'Fluency and Coherence', lr: 'Lexical Resource', gra: 'Grammatical Range and Accuracy', pr: 'Pronunciation' };
    return `<div class="card"><h3>Objective indicators (measured)</h3><div class="grid c4">${IM.ui.stat('Duration', o.durationSec + ' s', 'practice target ≈ ' + o.targetSec + ' s')}${IM.ui.stat('Words', o.words == null ? 'n/a' : o.words, o.words == null ? 'no transcript' : '')}${IM.ui.stat('Speed', o.wpm == null ? 'n/a' : o.wpm + ' wpm', 'about 100–190 is typical')}${IM.ui.stat('Filler words', o.fillers == null ? 'n/a' : o.fillers, o.fillersPer100 == null ? '' : o.fillersPer100 + ' per 100 words')}</div>
      <p class="small">Linking expressions used: ${o.connectors == null ? 'n/a' : o.connectors.length ? o.connectors.map(esc).join(', ') : 'none detected'}. Word variety ratio: ${o.uniqueRatio == null ? 'n/a' : o.uniqueRatio}. Possible grammar issues in the transcript: ${o.grammarIssues == null ? 'n/a' : o.grammarIssues}.</p>
      <p class="note info small">Speech-to-text may mis-hear words, which affects transcript-based indicators. Pronunciation and true fluency cannot be measured by this application.</p></div>
      <div class="card"><h3>Estimated practice scores</h3><div class="grid c4">${['fc', 'lr', 'gra', 'pr'].map(k => `<div class="crit"><h4><span class="small">${names[k]}</span><span class="score">${est.scores[k] == null ? '—' : est.scores[k].toFixed(1)}</span></h4><div class="small muted">${esc(est.basis[k])}</div></div>`).join('')}</div>
      <p><b>Overall speaking estimate: ${est.overall == null ? 'incomplete' : est.overall.toFixed(1)}</b></p>${est.notes.map(n => `<p class="note small">${esc(n)}</p>`).join('')}<p class="small muted">${esc(est.disclaimer)}</p></div>
      ${o.issues.length ? `<div class="card"><h3>Grammar patterns to check</h3><ul>${o.issues.slice(0, 6).map(i => `<li>“${esc(i.match)}” → ${esc(i.fix || '')} <span class="small muted">${esc(i.msg)}</span></li>`).join('')}</ul></div>` : ''}
      ${model ? `<div class="card"><h3>Model answer</h3><p>${esc(model)}</p><div class="row"><button class="btn secondary small" data-hear="model">🔊 Hear the model</button></div><p class="small muted">An example, not the only correct answer. Notice the structure: direct answer, reason, example, and a link back to the question.</p></div>` : ''}`;
  }

  IM.views.speaking = function (root, params) {
    let tab = params.tab || 'practice';
    let cap = null, prepTimer = null, cur = null, exam = null;
    const modelStore = {};

    function clean() { if (cap) { cap.destroy(); cap = null; } if (prepTimer) { clearInterval(prepTimer); prepTimer = null; } IM.audio.stop(); }
    const header = () => `<h1>Speaking Coach</h1><div class="tabs">${[['practice', 'Practise'], ['exam', 'Examination'], ['pron', 'Pronunciation'], ['shadow', 'Shadowing'], ['fluency', 'Fluency'], ['history', 'History']].map(t => `<button class="tab ${tab === t[0] ? 'active' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>`;

    function saveSession(rec) {
      IM.store.update(s => { s.speaking.sessions.push(rec); if (s.speaking.sessions.length > 200) s.speaking.sessions.shift(); });
      if (rec.est && rec.est.overall != null) IM.analytics.recordBaseline('speaking', rec.est.overall);
      if (rec.self && rec.self.pr) IM.analytics.recordArea('Pronunciation', rec.self.pr >= 3 ? 1 : 0, 1);
      if (rec.est && rec.est.scores.fc != null) IM.analytics.recordArea('Fluency', rec.est.scores.fc >= 6 ? 1 : 0, 1);
      IM.store.logActivity('speaking', 'speaking-' + rec.part, rec.topic, rec.est ? rec.est.overall : null, 9, Math.max(3, Math.round(rec.durationSec / 60) + 2));
    }

    /* ---------------- practice ---------------- */
    function practiceHome() {
      const cards = SP().part2;
      return `<div class="grid c3"><div class="card"><h3>Part 1: Introduction and interview</h3><p class="small muted">Short answers on familiar topics (4–5 minutes in the real test).</p>${SP().part1.map(t => `<button class="btn small secondary" style="margin:2px" data-p1="${t.id}">${esc(t.title)}</button>`).join('')}</div>
        <div class="card"><h3>Part 2: Individual long turn</h3><p class="small muted">One minute to prepare, up to two minutes to speak.</p>${cards.map(c => `<button class="btn small secondary" style="margin:2px;text-align:left" data-p2="${c.id}">${esc(c.title)}</button>`).join('')}</div>
        <div class="card"><h3>Part 3: Discussion</h3><p class="small muted">Abstract questions linked to a Part 2 topic.</p>${cards.map(c => `<button class="btn small secondary" style="margin:2px;text-align:left" data-p3="${c.id}">${esc(c.title)}</button>`).join('')}</div></div>
        <div class="note info">${IM.audio.recorder.supported ? '' : '<b>Recording is unavailable</b> in this browser. '}${IM.audio.recognition.supported ? '' : '<b>Speech-to-text is unavailable</b> (typed answers and self-assessment are used instead). '}You can still practise with the timer and the virtual examiner voice.</div>`;
    }

    function questionScreen(spec) {
      clean();
      cur = spec;
      const examiner = `<div class="examiner"><div class="avatar" aria-hidden="true">👤</div><div class="bubble"><b>Examiner</b><p style="margin:4px 0" id="qtext">${esc(spec.q)}</p><button class="btn small secondary" data-act="ask">🔊 Hear the examiner</button></div></div>`;
      root.innerHTML = `<a class="back" href="#" data-act="back">← Back</a><h2>${esc(spec.title)}</h2>${examiner}
        ${spec.cue ? `<div class="cue" style="margin:12px 0">${esc(spec.cue)}</div>` : ''}
        ${spec.prep ? `<div class="card soft" id="prepbox"><h4>Preparation time</h4><p class="small muted">You have one minute to make notes. Notes are for you only.</p><textarea id="notes" rows="3" placeholder="Make brief notes here"></textarea><div class="row"><span class="timer" id="preptimer">01:00</span><button class="btn" data-act="startprep">Start the 1-minute preparation</button><button class="btn ghost" data-act="skipprep">Skip preparation</button></div></div>` : ''}
        <div id="capbox" ${spec.prep ? 'hidden' : ''}></div><div id="fb"></div>`;
      if (!spec.prep) mountCapture();
      if (IM.audio.hasSpeech) setTimeout(() => hear(spec.q), 300);
    }
    function mountCapture() {
      const box = U.$('#capbox', root); box.hidden = false;
      cap = capture(box, { id: 'c' + Date.now(), maxSec: cur.part === 2 ? IM.data.scoring.exam.speaking.part2SpeakSeconds : 0, onDone: r => finishAnswer(r) });
    }
    function finishAnswer(r) {
      const fb = U.$('#fb', root);
      cur.result = r;
      fb.innerHTML = `<div class="card"><h3>How did that feel?</h3>${ratingForm('self')}<div class="row"><button class="btn" data-act="getfb">Get feedback</button></div><p class="small muted">Rate honestly: pronunciation and fluency are judged by you, not measured by the app.</p></div>`;
      fb.scrollIntoView({ behavior: 'smooth' });
    }
    function getFeedback() {
      const r = cur.result, self = readRatings(root, 'self');
      const tr = r.transcript;
      const est = IM.tutor.estimateSpeaking({ transcript: tr, durationSec: r.durationSec, part: cur.part, self });
      saveSession({ id: U.uid(), ts: Date.now(), date: U.today(), part: cur.part, topic: cur.title, q: cur.q, durationSec: r.durationSec, words: U.countWords(tr), transcript: tr, self, est: { fc: est.scores.fc, lr: est.scores.lr, gra: est.scores.gra, pr: est.scores.pr, overall: est.overall }, wpm: est.objective.wpm });
      const prev = S().speaking.sessions.filter(s => s.q === cur.q).slice(-2, -1)[0];
      U.$('#fb', root).innerHTML = feedbackHtml(est, tr, cur.model) + (prev ? `<div class="note good">Compared with your previous attempt at this question: ${prev.durationSec}s → ${r.durationSec}s, ${prev.words} → ${U.countWords(tr)} words.</div>` : '') + `<div class="row"><button class="btn" data-act="repeat">↻ Repeat and improve</button><button class="btn secondary" data-act="back">Choose another</button></div>`;
    }

    /* ---------------- exam ---------------- */
    function examStart() {
      const t1 = U.pick(SP().part1), c = U.pick(SP().part2);
      const qs = [].concat(t1.qs.slice(0, 4).map(q => ({ part: 1, title: 'Part 1: ' + t1.title, q })), [{ part: 2, title: 'Part 2: ' + c.title, q: 'Now I am going to give you a topic and I would like you to talk about it for one to two minutes. Before you talk, you have one minute to think about what you are going to say.', cue: c.card, prep: true, model: c.model }], c.part3.map(q => ({ part: 3, title: 'Part 3: ' + c.title, q })));
      exam = { qs, i: 0, results: [] };
      examQuestion();
    }
    function examQuestion() {
      const spec = exam.qs[exam.i];
      questionScreen(spec);
      const fb = U.$('#fb', root);
      // in the exam, no feedback until the end: replace the capture completion handler
      cur.examMode = true;
      const origDone = finishAnswer;
      finishAnswer = r => { exam.results.push({ spec, r }); fb.innerHTML = `<div class="row"><button class="btn" data-act="examnext">${exam.i + 1 < exam.qs.length ? 'Next question' : 'Finish the examination'}</button></div>`; finishAnswer = origDone; };
    }
    function examFinish() {
      root.innerHTML = `<h1>Examination complete</h1><div class="card"><p>Rate your own performance across the whole interview. Feedback is then calculated for each part.</p>${ratingForm('ex')}<button class="btn" data-act="examfb">Show feedback</button></div>`;
    }
    function examFeedback() {
      const self = readRatings(root, 'ex');
      const byPart = {};
      exam.results.forEach(x => { const p = x.spec.part; (byPart[p] = byPart[p] || { tr: '', dur: 0, q: [] }); byPart[p].tr += ' ' + x.r.transcript; byPart[p].dur += x.r.durationSec; byPart[p].q.push(x.spec.q); });
      let html = '<h1>Examination feedback</h1>';
      const all = [];
      Object.keys(byPart).forEach(p => {
        const b = byPart[p];
        const est = IM.tutor.estimateSpeaking({ transcript: b.tr.trim(), durationSec: b.dur, part: Number(p), self });
        all.push(est);
        saveSession({ id: U.uid(), ts: Date.now(), date: U.today(), part: Number(p), topic: 'Examination part ' + p, q: b.q[0], durationSec: b.dur, words: U.countWords(b.tr), transcript: b.tr.trim(), self, est: { fc: est.scores.fc, lr: est.scores.lr, gra: est.scores.gra, pr: est.scores.pr, overall: est.overall }, exam: true });
        html += `<h2>Part ${p}</h2>` + feedbackHtml(est, b.tr, null);
      });
      root.innerHTML = html + '<div class="row"><button class="btn" data-tab="practice">Back to practice</button></div>';
      exam = null;
    }

    /* ---------------- pronunciation / shadowing / fluency ---------------- */
    function pronHtml() {
      const P = SP().pronunciation;
      return `<div class="card"><h2>Minimal pairs</h2><p class="small muted">Listen to each word. Say them aloud and notice the difference in the vowel or consonant. The voice is a synthetic model: accents and quality vary by device.</p>
        <div class="grid c3">${P.minimalPairs.map(p => `<div class="card soft center"><button class="btn small secondary" data-say="${p[0]}">🔊 ${p[0]}</button> <button class="btn small secondary" data-say="${p[1]}">🔊 ${p[1]}</button></div>`).join('')}</div></div>
        <div class="card"><h2>Word stress</h2><div class="table-wrap"><table class="t"><thead><tr><th>Word</th><th>Stress pattern</th><th></th></tr></thead><tbody>${P.wordStress.map(w => `<tr><td><b>${esc(w.w)}</b></td><td>${esc(w.s)}</td><td><button class="btn small secondary" data-say="${esc(w.w)}">🔊</button></td></tr>`).join('')}</tbody></table></div></div>`;
    }
    function shadowHtml() {
      return `<div class="card"><h2>Shadowing practice</h2><p>Hear a sentence, then say it straight afterwards, copying the rhythm, stress and intonation. ${IM.audio.recognition.supported ? 'Press “Test me” and the app will compare what it heard with the sentence.' : 'Speech recognition is not available here, so judge yourself honestly after each attempt.'}</p>
        ${SP().pronunciation.shadowing.map((s, i) => `<div class="card soft"><p style="font-size:1.05rem">${esc(s)}</p><div class="row"><button class="btn small secondary" data-say="${esc(s)}">🔊 Listen</button><button class="btn small secondary" data-say="${esc(s)}" data-slow="1">🔊 Slowly</button>${IM.audio.recognition.supported ? `<button class="btn small" data-shadow="${i}">🎤 Test me</button>` : ''}<button class="btn small ghost" data-self="${i}:1">I said it well</button><button class="btn small ghost" data-self="${i}:0">Needs work</button></div><div class="small" id="sh-${i}"></div></div>`).join('')}</div>`;
    }
    function fluencyHtml() {
      return `<div class="card"><h2>Fluency and coherence exercises</h2><p>Talk without stopping. If you forget a word, describe it. Aim to link ideas (because, so, for example, however).</p>${SP().fluency.map(f => `<div class="card soft"><b>${esc(f.title)}</b><p>${esc(f.prompt)}</p><button class="btn small" data-flu="${f.id}">Start this drill</button></div>`).join('')}
        <details><summary>Linking expressions to practise</summary><p>${SP().connectors.map(esc).join(' · ')}</p></details></div>`;
    }
    function historyHtml() {
      const ss = S().speaking.sessions;
      if (!ss.length) return IM.ui.empty('No speaking sessions yet.', '<button class="btn" data-tab="practice">Start practising</button>');
      const withEst = ss.filter(s => s.est && s.est.overall != null).slice(-12);
      return `${withEst.length > 1 ? `<div class="card"><h3>Estimated overall (practice) over time</h3>${IM.charts.line({ xs: withEst.map((s, i) => String(i + 1)), series: [{ name: 'Speaking estimate', ys: withEst.map(s => s.est.overall) }], min: 3, max: 8 })}</div>` : ''}
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Part</th><th>Topic</th><th>Seconds</th><th>Words</th><th>wpm</th><th>Est.</th></tr></thead><tbody>${ss.slice().reverse().slice(0, 40).map(s => `<tr><td>${U.fmtDate(s.date)}</td><td>${s.part}${s.exam ? ' (exam)' : ''}</td><td>${esc(s.topic)}</td><td>${s.durationSec}</td><td>${s.words || '—'}</td><td>${s.wpm || '—'}</td><td>${s.est && s.est.overall != null ? s.est.overall : '—'}</td></tr>`).join('')}</tbody></table></div><p class="small muted">Duration, words and speed are measured; estimates combine them with your self-ratings and are not official.</p></div>`;
    }

    function draw() {
      clean(); exam = null;
      let body;
      if (tab === 'practice') body = practiceHome();
      else if (tab === 'exam') body = `<div class="card"><h2>Speaking examination (about 11–14 minutes)</h2><p>A virtual examiner asks four Part 1 questions, gives you a Part 2 cue card with one minute of preparation and up to two minutes of speaking, then asks four Part 3 questions. Feedback is shown at the end only.</p><p class="small muted">Microphone access is requested only if your browser supports recording, and recordings are never uploaded. The examiner voice is synthetic.</p><button class="btn" data-act="examstart">Start the examination</button></div>`;
      else if (tab === 'pron') body = pronHtml();
      else if (tab === 'shadow') body = shadowHtml();
      else if (tab === 'fluency') body = fluencyHtml();
      else body = historyHtml();
      root.innerHTML = header() + body;
    }

    root.addEventListener('click', e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { e.preventDefault(); tab = tb.dataset.tab; draw(); return; }
      const p1 = e.target.closest('[data-p1]');
      if (p1) { const t = SP().part1.find(x => x.id === p1.dataset.p1); const k = Number(root.dataset.q1 || 0) % t.qs.length; root.dataset.q1 = k + 1; questionScreen({ part: 1, title: 'Part 1: ' + t.title, q: t.qs[k], model: t.model, topicId: t.id }); return; }
      const p2 = e.target.closest('[data-p2]');
      if (p2) { const c = SP().part2.find(x => x.id === p2.dataset.p2); questionScreen({ part: 2, title: 'Part 2: ' + c.title, q: 'Describe the topic on the card. You have one minute to prepare, then speak for one to two minutes.', cue: c.card, prep: true, model: c.model, cardId: c.id }); return; }
      const p3 = e.target.closest('[data-p3]');
      if (p3) { const c = SP().part2.find(x => x.id === p3.dataset.p3); const k = Number(root.dataset.q3 || 0) % c.part3.length; root.dataset.q3 = k + 1; questionScreen({ part: 3, title: 'Part 3: ' + c.title, q: c.part3[k], model: 'In my view, this depends on the individual. On the one hand, there are clear benefits, for example greater convenience and wider choice. On the other hand, there can be drawbacks, such as cost or less personal contact. Overall, I think the advantages outweigh the disadvantages, provided that people use it sensibly.', cardId: c.id }); return; }
      const say = e.target.closest('[data-say]'); if (say) { hear(say.dataset.say, say.dataset.slow ? 0.6 : 0.85); return; }
      const hm = e.target.closest('[data-hear]'); if (hm) { hear(cur.model, 0.95); return; }
      const sh = e.target.closest('[data-shadow]');
      if (sh) {
        const i = Number(sh.dataset.shadow), target = SP().pronunciation.shadowing[i], out = U.$('#sh-' + i, root);
        out.textContent = 'Listening… say the sentence now.';
        try { const h = IM.audio.recognition.start({ lang: 'en-GB', onText: () => {}, onError: er => { out.textContent = 'Recognition error: ' + er; }, onEnd: txt => { const r = IM.diff.compare(target, txt); out.innerHTML = txt ? `Heard: “${esc(txt)}” — word match ${r.wordAccuracy}%. ${r.counts.missing ? 'Missing: ' + r.errors.filter(x => x.type === 'missing').map(x => esc(x.ref)).join(', ') + '.' : ''} <span class="muted">Recognition can be wrong; use it as a guide.</span>` : 'Nothing was heard. Check your microphone permission.'; IM.analytics.recordArea('Pronunciation', r.wordAccuracy >= 80 ? 1 : 0, 1); } }); setTimeout(() => h.stop(), 7000); } catch (er) { out.textContent = 'Speech recognition could not start.'; }
        return;
      }
      const sf = e.target.closest('[data-self]');
      if (sf) { const [i, v] = sf.dataset.self.split(':'); IM.analytics.recordArea('Pronunciation', Number(v), 1); U.$('#sh-' + i, root).textContent = v === '1' ? 'Recorded: well done.' : 'Recorded: listen again and try slowly.'; return; }
      const fl = e.target.closest('[data-flu]');
      if (fl) { const f = SP().fluency.find(x => x.id === fl.dataset.flu); questionScreen({ part: 2, title: 'Fluency drill: ' + f.title, q: f.prompt, model: null }); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'back': e.preventDefault(); draw(); break;
        case 'ask': hear(cur.q); break;
        case 'startprep': {
          const a2 = a; a2.disabled = true; let left = IM.data.scoring.exam.speaking.part2PrepSeconds;
          prepTimer = setInterval(() => { left--; U.$('#preptimer', root).textContent = U.mmss(left); if (left <= 0) { clearInterval(prepTimer); prepTimer = null; U.toast('Preparation time is over. Start speaking.', 'good'); mountCapture(); } }, 1000);
          break;
        }
        case 'skipprep': if (prepTimer) { clearInterval(prepTimer); prepTimer = null; } mountCapture(); break;
        case 'getfb': getFeedback(); break;
        case 'repeat': questionScreen(Object.assign({}, cur, { result: null })); break;
        case 'examstart': examStart(); break;
        case 'examnext': exam.i++; if (exam.i < exam.qs.length) examQuestion(); else examFinish(); break;
        case 'examfb': examFeedback(); break;
      }
    });
    draw();
    return clean;
  };
})();
