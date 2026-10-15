/* Exam Simulator: hub, Listening and Reading simulations (Strict Exam Mode and Learning Mode).
   Writing and Speaking examinations live in their coach views and are linked from here. */
(function () {
  const U = IM.util, esc = U.esc, Q = () => IM.qengine;
  const S = () => IM.store.state;
  const PITCH = { N: { pitch: 0.9, rate: 0.95 }, A: { pitch: 1.12, rate: 1 }, B: { pitch: 0.85, rate: 1 }, C: { pitch: 0.97, rate: 1 } };

  /* ---------------------------------------------------------------- hub */
  IM.views.exam = function (root, params, parts) {
    if (parts[0] === 'listening' || parts[0] === 'reading') return runExam(root, parts[0], params);
    if (parts[0] === 'writing') { location.replace('#/writing?tab=exam'); return; }
    if (parts[0] === 'speaking') { location.replace('#/speaking?tab=exam'); return; }
    const last = k => { const m = S().mocks.filter(x => x.skill === k && x.scope === 'full').slice(-1)[0]; return m ? `Last full test: ${m.raw}/${m.max} (≈ band ${U.bandText(m.band)}) on ${U.fmtDate(m.date)}` : 'No full test recorded yet'; };
    const lw = S().writing.submissions.slice(-1)[0], ls = S().speaking.sessions.slice(-1)[0];
    root.innerHTML = `<h1>Exam Simulator</h1>
      <p>Four separate modules, each with <b>Strict Exam Mode</b> (timed, no answers, first attempt preserved) and <b>Learning Mode</b> (replay, pause, explanations and transcripts). You are preparing for IELTS <b>${S().settings.testType === 'academic' ? 'Academic' : 'General Training'}</b> (change this in Settings).</p>
      <div class="grid c2">
        <div class="card"><h2>🎧 Listening</h2><p>4 sections, 40 questions: forms, notes, tables, flow-charts, maps, multiple choice and matching.</p><p class="small muted">${last('listening')}</p><a class="btn" href="#/exam/listening">Open Listening</a></div>
        <div class="card"><h2>📖 Reading</h2><p>${S().settings.testType === 'academic' ? '3 passages, 40 questions, 60 minutes.' : '3 sections, 40 questions, 60 minutes.'} 13 question types including headings, True/False/Not Given and completion tasks.</p><p class="small muted">${last('reading')}</p><a class="btn" href="#/exam/reading">Open Reading</a></div>
        <div class="card"><h2>✍️ Writing</h2><p>Timed 60-minute examination with Task 1 and Task 2, a word counter and rubric-based estimated feedback.</p><p class="small muted">${lw ? 'Last estimate: ' + U.bandText(lw.est.overall) + ' on ' + U.fmtDate(lw.date) : 'No response yet'}</p><a class="btn" href="#/writing?tab=exam">Open Writing</a></div>
        <div class="card"><h2>🎤 Speaking</h2><p>Three-part interview with a virtual examiner, cue-card timers, optional recording and speech-to-text.</p><p class="small muted">${ls ? 'Last session: ' + U.fmtDate(ls.date) : 'No session yet'}</p><a class="btn" href="#/speaking?tab=exam">Open Speaking</a></div>
      </div>
      <div class="note info">Honest coverage: the starter library contains one full Listening test and one full Reading test for each of Academic and General Training. Passages are shorter than real IELTS passages, and the Listening audio is synthetic speech. Estimated bands use approximate, editable conversion tables.</div>
      ${S().mocks.length ? `<div class="card"><h2>Mock history</h2><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Skill</th><th>Mode</th><th>Scope</th><th>Raw</th><th>≈ Band</th></tr></thead><tbody>${S().mocks.slice(-10).reverse().map(m => `<tr><td>${U.fmtDate(m.date)}</td><td>${esc(m.skill)}${m.testType ? ' (' + esc(m.testType) + ')' : ''}</td><td>${esc(m.mode)}</td><td>${esc(m.scope)}${m.first === false ? ' (repeat)' : ''}</td><td>${m.raw}/${m.max}</td><td>${m.scope === 'full' ? U.bandText(m.band) : '—'}</td></tr>`).join('')}</tbody></table></div><p class="small muted">${esc(IM.data.scoring.disclaimers.objective)}</p></div>` : ''}`;
  };

  /* ---------------------------------------------------------------- shared exam runner */
  function specFor(skill, testType, partSel) {
    if (skill === 'listening') {
      const t = IM.data.listening.tests[0];
      const parts = t.sections.map(s => ({ key: 's' + s.n, title: 'Section ' + s.n, heading: s.title, context: s.context, transcript: s.transcript, audio: s.audio, groups: s.groups }));
      return { skill, testId: t.id, title: 'Listening ' + t.title, parts, minutes: IM.data.scoring.exam.listening.strictMinutes, tableName: 'listening' };
    }
    if (testType === 'general') {
      const g = IM.data.reading.general;
      const parts = g.sections.map(s => ({ key: 's' + s.n, title: 'Section ' + s.n, heading: s.title, intro: s.intro, texts: s.texts, groups: s.groups }));
      return { skill, testId: g.id, title: g.title, parts, minutes: g.minutes, tableName: 'readingGeneral' };
    }
    const a = IM.data.reading.academic;
    const parts = a.passages.map(p => ({ key: 'p' + p.n, title: 'Passage ' + p.n, heading: p.title, texts: [{ title: p.title, paragraphs: p.paragraphs }], groups: p.groups }));
    return { skill, testId: a.id, title: a.title, parts, minutes: a.minutes, tableName: 'readingAcademic' };
  }

  function paraHtml(p) {
    const t = typeof p === 'string' ? p : p.t, k = typeof p === 'string' ? '' : p.k;
    return `<p>${k ? `<span class="plabel">${esc(k)}</span>` : ''}${esc(t)}</p>`;
  }

  function runExam(root, skill, params) {
    const st = S();
    let testType = params.type || st.settings.testType;
    let spec = null, state = null, timerId = null, partIdx = 0, finished = false;
    const key = 'exam-' + skill;

    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
    function allGroups() { return spec.parts.flatMap(p => p.groups); }
    function totalQ() { return Q().allItems(allGroups()).length; }
    function partOf(n) { return spec.parts.findIndex(p => Q().allItems(p.groups).some(x => x.i.n === n)); }
    function persist() { IM.store.update(s => { s.inProgress[key] = state; }); }
    function syncAnswers() {
      if (finished || !state) return;
      const part = spec.parts[partIdx];
      const body = U.$('#qarea', root);
      if (!body) return;
      Q().allItems(part.groups).forEach(x => { delete state.answers[x.i.n]; });
      Object.assign(state.answers, Q().collect(body));
    }

    /* ----- setup ----- */
    function setup() {
      const saved = S().inProgress[key];
      const typeSel = skill === 'reading' ? `<div class="formrow"><label class="field" for="ttype">Test version</label><select id="ttype"><option value="academic" ${testType === 'academic' ? 'selected' : ''}>Academic (3 passages)</option><option value="general" ${testType === 'general' ? 'selected' : ''}>General Training (3 sections)</option></select></div>` : '';
      const sp = specFor(skill, testType);
      root.innerHTML = `<a class="back" href="#/exam">← Exam Simulator</a><h1>${skill === 'listening' ? '🎧 Listening' : '📖 Reading'} simulation</h1>
        ${saved && saved.skill === skill && !saved.done ? `<div class="note info"><b>Unfinished attempt found</b> (${esc(saved.mode)} mode, started ${U.fmtTime(saved.startedAt)}). <button class="btn small" data-act="resume">Resume</button> <button class="btn small ghost" data-act="discard">Discard</button></div>` : ''}
        <div class="card"><h2>${esc(sp.title)}</h2>${typeSel}
          <div class="grid c2">
            <label class="card" style="cursor:pointer;display:block"><input type="radio" name="mode" value="strict" checked style="width:auto;min-height:0"> <b>Strict Exam Mode</b><p class="small muted" style="margin:4px 0 0">${skill === 'listening' ? `Each section’s audio plays <b>once</b>, no pausing. A countdown of ${sp.minutes} minutes (practice setting: audio plus transfer time) runs for the whole test.` : `${sp.minutes}-minute countdown. No answers or hints until you submit.`} Answers are hidden until submission and your first attempt is the one that counts toward your estimate.</p></label>
            <label class="card" style="cursor:pointer;display:block"><input type="radio" name="mode" value="learning" style="width:auto;min-height:0"> <b>Learning Mode</b><p class="small muted" style="margin:4px 0 0">${skill === 'listening' ? 'Replay and pause the audio. Check each section as you go.' : 'Untimed. Check each passage as you go and see the evidence for every answer.'} Transcripts, explanations and targeted practice follow the attempt.</p></label>
          </div>
          <div class="formrow"><label class="field" for="scope">Scope</label><select id="scope"><option value="full">Full test (${sp.parts.length} ${skill === 'listening' ? 'sections' : testType === 'general' ? 'sections' : 'passages'}, 40 questions)</option>${sp.parts.map((p, i) => `<option value="${i}">${esc(p.title)} only: ${esc(p.heading)}</option>`).join('')}</select><p class="small muted">Single-part practice is useful for learning but is not converted to a band.</p></div>
          ${skill === 'listening' ? `<div class="note">The audio in this starter test is <b>synthetic text-to-speech practice audio</b>, not an authentic IELTS recording, and it is shorter than a real test. ${IM.audio.hasSpeech ? '' : '<b>Your browser cannot play speech, so you can read the transcript only in Learning Mode.</b>'}</div>` : ''}
          <div class="row"><button class="btn" data-act="start">Start</button></div></div>
        ${skill === 'reading' ? `<div class="card soft"><h3>Reading skills (Learning Mode shows these during the test)</h3>${IM.data.reading.skills.map(k => `<details><summary>${esc(k.title)}</summary><p>${esc(k.body)}</p></details>`).join('')}</div>` : ''}`;
    }

    function begin(mode, scope, resumeState) {
      spec = specFor(skill, testType);
      if (!resumeState) {
        if (scope !== 'full') spec.parts = [spec.parts[Number(scope)]];
        state = { skill, testType, testId: spec.testId, mode, scope: scope === 'full' ? 'full' : 'part', scopeIdx: scope, startedAt: Date.now(), deadline: mode === 'strict' ? Date.now() + (scope === 'full' ? spec.minutes : Math.round(spec.minutes / spec.parts.length * (skill === 'listening' ? 1.5 : 1))) * 60000 : null, answers: {}, played: {}, checked: {}, partIdx: 0 };
      } else {
        state = resumeState;
        if (state.scope === 'part') spec.parts = [spec.parts[Number(state.scopeIdx)]];
      }
      partIdx = state.partIdx || 0;
      finished = false;
      if (state.mode === 'strict') IM.activeExam = true;
      persist();
      draw();
      if (state.deadline) {
        const tick = () => {
          const left = Math.round((state.deadline - Date.now()) / 1000);
          const el = U.$('#timer', root); if (el) { el.textContent = U.mmss(left); el.classList.toggle('low', left <= 300); }
          if (left <= 0 && !finished) { stopTimer(); U.toast('Time is up: your answers were submitted.', 'warn'); submit(true); }
        };
        tick(); timerId = setInterval(tick, 500);
      } else {
        timerId = setInterval(() => { const el = U.$('#elapsed', root); if (el) el.textContent = U.mmss((Date.now() - state.startedAt) / 1000); }, 1000);
      }
    }

    /* ----- drawing the exam ----- */
    function palette() {
      const done = n => state.answers[n] != null && String(state.answers[n]).trim() !== '';
      const items = Q().allItems(spec.parts.flatMap(p => p.groups)).map(x => x.i.n);
      return `<div class="palette" role="group" aria-label="Question navigation">${items.map(n => `<button data-goto="${n}" class="${done(n) ? 'done' : ''}" aria-label="Question ${n}${done(n) ? ' answered' : ''}">${n}</button>`).join('')}</div>`;
    }
    function audioPanel(part) {
      const strict = state.mode === 'strict';
      const played = state.played[part.key];
      return `<div class="card"><h3>${esc(part.heading)}</h3><p class="muted">${esc(part.context)}</p>
        <div class="audio-ctl"><button class="btn" data-act="aplay" ${strict && played ? 'disabled' : ''}>${strict ? (played ? 'Audio played (once only)' : '▶ Play section audio') : '▶ Play'}</button>
        ${strict ? '' : '<button class="btn secondary" data-act="apause">⏸ Pause / resume</button><button class="btn secondary" data-act="astop">■ Stop</button>'}<span id="astat" class="small"></span></div>
        <p class="small muted">${strict ? 'Strict Exam Mode: this section plays once. Answer while you listen.' : 'Learning Mode: replay and pause as often as you like.'} Synthetic practice audio.${IM.audio.hasSpeech ? '' : ' <b>Speech playback is unavailable in this browser.</b>'}</p></div>`;
    }
    function draw() {
      const part = spec.parts[partIdx];
      const strict = state.mode === 'strict';
      const checked = !!state.checked[part.key];
      const ctx = { answers: state.answers, locked: checked, results: checked ? state.partResults[part.key] : null, showExplain: checked };
      const timer = strict ? '<span class="timer" id="timer">--:--</span>' : `<span class="timer" id="elapsed">${U.mmss((Date.now() - state.startedAt) / 1000)}</span><span class="small muted">elapsed (no limit)</span>`;
      const tabs = spec.parts.length > 1 ? `<div class="tabs">${spec.parts.map((p, i) => `<button class="tab ${i === partIdx ? 'active' : ''}" data-part="${i}">${esc(p.title)}</button>`).join('')}</div>` : '';
      let main;
      if (skill === 'listening') {
        main = `${audioPanel(part)}<div class="pane" id="qarea">${part.groups.map(g => Q().renderGroup(g, ctx)).join('')}</div>`;
      } else {
        const left = part.texts.map(t => `<h3>${esc(t.title)}</h3><div class="passage">${t.paragraphs.map(paraHtml).join('')}</div>`).join('');
        main = `<div class="split"><div class="pane passage-pane"><h2>${esc(part.title)}${part.intro ? '' : ''}</h2>${part.intro ? `<p class="muted small">${esc(part.intro)}</p>` : ''}${left}</div><div class="pane" id="qarea">${part.groups.map(g => Q().renderGroup(g, ctx)).join('')}</div></div>`;
      }
      root.innerHTML = `<div class="exam-bar"><b>${esc(spec.title)}</b>${IM.ui.badge(strict ? 'Strict Exam Mode' : 'Learning Mode', strict ? 'warn' : 'info')}${timer}<span class="small" id="prog"></span><div style="flex:1"></div><button class="btn" data-act="submit">Submit ${state.scope === 'full' ? 'test' : 'part'}</button></div>
        <details open><summary>Question navigation</summary><div id="pal">${palette()}</div></details>
        ${tabs}${state.mode === 'learning' ? `<details><summary>Reading and listening technique tips</summary>${(skill === 'reading' ? IM.data.reading.skills : [{ title: 'Read ahead', body: 'Use the pauses to read the next questions and predict the type of answer (a number, a name, a place).' }, { title: 'Watch for corrections', body: 'Speakers often correct themselves. The final version is the answer, so a first-mentioned number or date is often a distractor.' }, { title: 'Check the spelling', body: 'Wrong spelling is marked wrong. Write plural endings and capital letters for names carefully.' }]).map(k => `<p><b>${esc(k.title)}:</b> ${esc(k.body)}</p>`).join('')}</details>` : ''}
        ${main}
        ${state.mode === 'learning' && !checked ? '<div class="row"><button class="btn secondary" data-act="check">Check this part</button></div>' : ''}
        <div class="row" style="margin-top:12px">${partIdx > 0 ? '<button class="btn ghost" data-act="prevpart">← Previous</button>' : ''}${partIdx < spec.parts.length - 1 ? '<button class="btn ghost" data-act="nextpart">Next →</button>' : ''}</div>`;
      updateProgress();
      if (skill === 'listening' && !IM.audio.hasSpeech && strict) U.toast('Speech playback is unavailable, so Strict Exam Mode cannot play audio in this browser.', 'warn');
    }
    function updateProgress() {
      const el = U.$('#prog', root);
      if (el) el.textContent = Q().answeredCount(state.answers, totalQ()) + ' of ' + totalQ() + ' answered';
      const pal = U.$('#pal', root); if (pal) pal.innerHTML = palette();
    }

    /* ----- audio ----- */
    function playSection() {
      const part = spec.parts[partIdx], strict = state.mode === 'strict';
      if (strict && state.played[part.key]) return;
      if (!IM.audio.hasSpeech && !part.audio) { U.toast(IM.audio.unsupportedMessage, 'warn'); return; }
      if (strict) { state.played[part.key] = true; persist(); const b = U.$('[data-act=aplay]', root); if (b) { b.disabled = true; b.textContent = 'Playing (once only)…'; } }
      const s = S().settings;
      const items = part.transcript.map(t => ({ text: t.text, pitch: (PITCH[t.sp] || PITCH.A).pitch, rate: (PITCH[t.sp] || PITCH.A).rate, pause: t.sp === 'N' ? 900 : 450 }));
      const stat = U.$('#astat', root);
      const opts = { accent: s.accent, voiceURI: s.voiceURI, rate: 1, onItem: i => { if (stat) stat.innerHTML = `<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Playing…`; } };
      const p = part.audio ? IM.audio.playFile(part.audio, items, opts) : IM.audio.speakQueue(items, opts);
      p.catch(() => U.toast('The voice could not be played.', 'warn')).then(() => { const b = U.$('[data-act=aplay]', root); const t = U.$('#astat', root); if (t) t.textContent = 'Audio finished.'; if (b && strict) b.textContent = 'Audio played (once only)'; });
    }

    /* ----- marking ----- */
    function markPart(part) {
      const m = Q().markTest(part.groups, state.answers);
      const map = {};
      m.items.forEach(x => { map[x.n] = { correct: x.correct, expected: x.expected, given: x.given }; });
      return { m, map };
    }
    function check() {
      syncAnswers();
      const part = spec.parts[partIdx];
      const r = markPart(part);
      (state.partResults = state.partResults || {})[part.key] = r.map;
      state.checked[part.key] = true;
      persist();
      draw();
      U.toast(`This part: ${r.m.raw} of ${r.m.max} correct.`, r.m.raw === r.m.max ? 'good' : '');
    }

    function submit(auto) {
      if (finished) return;
      syncAnswers();
      const unanswered = totalQ() - Q().answeredCount(state.answers, totalQ());
      if (!auto && unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
      finished = true; stopTimer(); IM.audio.stop(); IM.activeExam = false;
      const groups = allGroups();
      const m = Q().markTest(groups, state.answers);
      const mins = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
      const full = state.scope === 'full';
      const band = full ? IM.analytics.mockBand(skill, testType, m.raw, m.max) : null;
      const prior = S().mocks.filter(x => x.skill === skill && x.testId === spec.testId && x.scope === state.scope && x.mode === state.mode).length;
      const first = prior === 0;
      const rec = { id: U.uid(), ts: Date.now(), date: U.today(), skill, testType: skill === 'reading' ? testType : 'both', testId: spec.testId, mode: state.mode, scope: full ? 'full' : 'part', raw: m.raw, max: m.max, band, byType: m.byType, first, minutes: mins, auto: !!auto };
      IM.store.update(s => { s.mocks.push(rec); if (s.mocks.length > 200) s.mocks.shift(); delete s.inProgress[key]; });
      if (full && first) IM.analytics.recordBaseline(skill, band);
      IM.analytics.recordArea(skill === 'listening' ? 'Listening comprehension' : 'Reading comprehension', m.raw, m.max);
      // spelling slips in completion answers feed the revision queue
      const slips = m.items.filter(x => !x.correct && x.type === 'completion' && x.given && IM.diff.lev(String(x.given).toLowerCase(), String(x.expected).toLowerCase()) <= 2 && /^[a-z]{4,}$/i.test(String(x.expected)));
      slips.forEach(x => { IM.srs.record('spell:' + String(x.expected).toLowerCase(), false, { context: 'mock', title: String(x.expected) }); IM.analytics.recordArea('Spelling', 0, 1); });
      IM.store.logActivity(skill, 'mock-' + state.mode, `${m.raw}/${m.max}`, m.raw, m.max, mins);
      results(m, rec, slips);
    }

    function results(m, rec, slips) {
      const full = rec.scope === 'full';
      const map = {}; m.items.forEach(x => { map[x.n] = { correct: x.correct, expected: x.expected, given: x.given }; });
      const bt = Object.entries(m.byType).map(([k, v]) => ({ label: k, pct: U.pct(v.c, v.t), n: v.t }));
      const ctxFor = p => ({ answers: state.answers, locked: true, results: map, showExplain: true });
      root.innerHTML = `<a class="back" href="#/exam">← Exam Simulator</a><h1>Results: ${esc(spec.title)}</h1>
        <div class="card"><div class="grid c3">${IM.ui.stat('Raw score', m.raw + ' / ' + m.max, 'exact, from the answer key')}${IM.ui.stat('Approximate band', full ? U.bandText(rec.band) : 'n/a', full ? 'practice conversion, not official' : 'single-part practice is not converted')}${IM.ui.stat('Time used', rec.minutes + ' min')}</div>
          ${rec.first === false ? '<p class="note">This was a repeat of a test you have already attempted in this mode, so it does not change your skill estimate (your first attempt is preserved).</p>' : ''}
          <p class="small muted">${esc(IM.data.scoring.disclaimers.objective)} ${esc(IM.data.scoring.conversionNote)}</p></div>
        <div class="card"><h3>Accuracy by question type</h3>${IM.charts.hbars(bt)}</div>
        ${slips.length ? `<div class="note"><b>Spelling slips:</b> ${slips.map(x => `“${esc(x.given)}” should be “${esc(x.expected)}”`).join('; ')}. These words were added to your revision queue.</div>` : ''}
        ${m.items.some(x => !x.correct) ? `<div class="card"><h3>Targeted practice</h3><ul>${weakAdvice(m).map(a => `<li>${a}</li>`).join('')}</ul></div>` : '<div class="note good">Every answer was correct.</div>'}
        <h2>Review every question</h2>
        ${spec.parts.map((p, pi) => `<div class="card"><h3>${esc(p.title)}: ${esc(p.heading)}</h3>${p.texts ? `<details><summary>Show the text</summary><div class="passage">${p.texts.map(t => `<h4>${esc(t.title)}</h4>${t.paragraphs.map(paraHtml).join('')}`).join('')}</div></details>` : ''}${p.groups.map(g => Q().renderGroup(g, ctxFor(p))).join('')}${p.transcript ? `<details><summary>Transcript of ${esc(p.title)}</summary><div class="transcript">${p.transcript.map(t => `<p>${t.sp === 'N' ? '<span class="sp">[Narrator]</span>' : '<span class="sp">Speaker ' + esc(t.sp) + ':</span>'} ${esc(t.text)}</p>`).join('')}</div></details>` : ''}</div>`).join('')}
        <div class="row"><a class="btn" href="#/exam/${skill}">Take another</a><a class="btn secondary" href="#/dashboard">Dashboard</a></div>`;
    }
    function weakAdvice(m) {
      const out = [];
      const bt = Object.entries(m.byType).filter(([, v]) => v.c < v.t).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
      bt.slice(0, 3).forEach(([k, v]) => {
        if (/True|Yes/.test(k)) out.push(`${esc(k)} (${v.c}/${v.t}): revise the difference between FALSE and NOT GIVEN. Underline the exact claim in the statement and look for contradicting evidence first.`);
        else if (/heading/i.test(k)) out.push(`${esc(k)} (${v.c}/${v.t}): summarise each paragraph in 3–4 words before reading the headings.`);
        else if (/Form|Note|Table|Flow|Sentence|Short|Summary/.test(k)) out.push(`${esc(k)} (${v.c}/${v.t}): check spelling, singular/plural and the word limit. Practise with <a href="#/dictation?cat=G">IELTS Listening answer dictation</a>.`);
        else if (/Map|Matching/.test(k)) out.push(`${esc(k)} (${v.c}/${v.t}): practise locating words such as “opposite”, “behind” and “next to”, and read the options before the audio or text.`);
        else out.push(`${esc(k)} (${v.c}/${v.t}): review your explanations below and try the same type again.`);
      });
      return out;
    }

    /* ----- events ----- */
    root.addEventListener('click', e => {
      const g = e.target.closest('[data-goto]');
      if (g && state) { syncAnswers(); const n = Number(g.dataset.goto), pi = partOf(n); if (pi >= 0 && pi !== partIdx) { partIdx = pi; state.partIdx = pi; persist(); draw(); } const el = document.getElementById('q-' + n); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el.focus) el.focus({ preventScroll: true }); } return; }
      const pt = e.target.closest('[data-part]');
      if (pt && state) { syncAnswers(); partIdx = Number(pt.dataset.part); state.partIdx = partIdx; persist(); IM.audio.stop(); draw(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'start': {
          const mode = (U.$('input[name=mode]:checked', root) || {}).value || 'strict';
          const scope = U.$('#scope', root).value;
          if (mode === 'strict' && skill === 'listening' && !IM.audio.hasSpeech) { U.toast('Strict Exam Mode needs speech playback, which this browser does not provide. Use Learning Mode to read transcripts.', 'warn'); return; }
          begin(mode, scope); break;
        }
        case 'resume': { const sv = S().inProgress[key]; testType = sv.testType; spec = specFor(skill, testType); if (sv.deadline && sv.deadline < Date.now()) { begin(sv.mode, sv.scopeIdx, sv); U.toast('The time for that attempt had already ended.', 'warn'); submit(true); } else begin(sv.mode, sv.scopeIdx, sv); break; }
        case 'discard': IM.store.update(s => { delete s.inProgress[key]; }); IM.activeExam = false; setup(); break;
        case 'aplay': playSection(); break;
        case 'apause': { if (a._p) { IM.audio.resume(); a._p = false; } else { IM.audio.pause(); a._p = true; } break; }
        case 'astop': IM.audio.stop(); break;
        case 'check': check(); break;
        case 'prevpart': syncAnswers(); partIdx--; state.partIdx = partIdx; persist(); IM.audio.stop(); draw(); break;
        case 'nextpart': syncAnswers(); partIdx++; state.partIdx = partIdx; persist(); IM.audio.stop(); draw(); break;
        case 'submit': submit(false); break;
      }
    });
    const onInput = U.debounce(() => { if (state && !finished) { syncAnswers(); persist(); updateProgress(); } }, 250);
    root.addEventListener('input', onInput);
    root.addEventListener('change', e => {
      if (e.target.id === 'ttype') { testType = e.target.value; setup(); return; }
      if (state && !finished) { syncAnswers(); persist(); updateProgress(); }
    });

    setup();
    return () => { stopTimer(); IM.audio.stop(); if (state && !finished) { try { syncAnswers(); persist(); } catch (e) { /* ignore */ } } IM.activeExam = false; };
  }
})();
