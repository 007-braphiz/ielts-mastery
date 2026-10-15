/* Writing Coach: practice and 60-minute examination, rubric-based estimated feedback, rewrite workflow and error notebook. */
(function () {
  const U = IM.util, esc = U.esc;
  const S = () => IM.store.state;
  const W = () => IM.data.writing;
  const CRIT = () => IM.data.scoring.writingCriteria;

  function tasksFor(type) {
    const t1 = type === 'academic' ? W().academicTask1 : W().generalTask1;
    return { t1, t2: W().task2 };
  }
  function findTask(id) { return W().academicTask1.concat(W().generalTask1, W().task2).find(t => t.id === id); }

  function highlighted(text, issues) {
    const list = issues.filter(i => i.start >= 0).sort((a, b) => a.start - b.start);
    let out = '', pos = 0;
    list.forEach(i => {
      if (i.start < pos) return;
      out += esc(text.slice(pos, i.start)) + `<span class="hl ${i.confidence === 'sure' ? '' : 'possible'}" title="${esc(i.cat + ': ' + i.msg)}">${esc(text.slice(i.start, Math.min(i.end, text.length)))}</span>`;
      pos = Math.min(i.end, text.length);
    });
    return out + esc(text.slice(pos));
  }

  IM.views.writing = function (root, params) {
    let tab = params.tab || 'practice';
    let task = null, mode = 'learning', timerId = null, deadline = null, draft = '', rewriteOf = null, examState = null;
    const tt = () => S().settings.testType;

    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

    function header() {
      return `<h1>Writing Coach</h1><div class="tabs">${[['practice', 'Practise'], ['exam', 'Examination'], ['notebook', 'Error notebook'], ['history', 'History']].map(t => `<button class="tab ${tab === t[0] ? 'active' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>`;
    }

    /* ---------------- practice list ---------------- */
    function practiceHtml() {
      const { t1, t2 } = tasksFor(tt());
      const card = t => { const n = S().writing.submissions.filter(s => s.taskId === t.id).length; return `<div class="card"><div class="row space"><b>${esc(t.type)}</b>${n ? IM.ui.badge(n + ' attempt(s)', 'info') : ''}</div><p class="small muted">${esc(t.prompt.split('\n')[0].slice(0, 130))}…</p><button class="btn small" data-task="${t.id}">Write this task</button></div>`; };
      return `<p class="note info">Showing IELTS <b>${tt() === 'academic' ? 'Academic' : 'General Training'}</b> Task 1. Estimated scores are rule-based practice estimates, not official bands.</p>
        <h2>Task 1 (${tt() === 'academic' ? 'charts, tables, maps and processes' : 'letters'}) · about 20 minutes · 150+ words</h2><div class="grid c2">${t1.map(card).join('')}</div>
        <h2 style="margin-top:20px">Task 2 (essays) · about 40 minutes · 250+ words</h2><div class="grid c2">${t2.map(card).join('')}</div>`;
    }

    /* ---------------- editor ---------------- */
    function taskHtml(t) {
      return `<div class="card"><div class="row space"><h3 style="margin:0">Task ${t.task}: ${esc(t.type)}</h3>${IM.ui.badge(t.task === 1 ? '150+ words, ~20 min' : '250+ words, ~40 min')}</div>
        <p style="white-space:pre-line">${esc(t.prompt)}</p>${t.chart ? `<div class="figure">${IM.charts.task1Visual(t.chart)}</div>` : ''}
        ${t.task === 2 ? '<p class="small muted">Give reasons for your answer and include any relevant examples from your own knowledge or experience.</p>' : ''}</div>`;
    }
    function openEditor(t, m, prefill, rw) {
      task = t; mode = m; draft = prefill || ''; rewriteOf = rw || null;
      stopTimer();
      const min = t.task === 1 ? 150 : 250;
      root.innerHTML = `<a class="back" href="#" data-act="exit">← Back</a><h1>${rw ? 'Rewrite' : 'Write'}: ${esc(t.type)}</h1>
        ${taskHtml(t)}
        ${m === 'learning' ? `<details><summary>Plan and paragraph organisation (Learning Mode)</summary><ol>${t.plan.map(p => `<li>${esc(p)}</li>`).join('')}</ol></details>` : ''}
        <div class="card"><div class="row space"><label class="field" for="essay" style="margin:0">Your response</label><span><span class="wc low" id="wc">0 words</span> <span class="small muted">minimum ${min}</span></span></div>
        <textarea id="essay" rows="16" spellcheck="true" autocapitalize="sentences" aria-describedby="wc">${esc(draft)}</textarea>
        <details style="margin-top:10px"><summary>Self-check before you submit (affects the Task Achievement estimate)</summary>
          <div class="checks"><label><input type="checkbox" id="sc1" checked> I answered every part of the task</label><label><input type="checkbox" id="sc2" checked> My ideas are explained and supported</label><label><input type="checkbox" id="sc3" checked> ${t.task === 1 ? 'I reported accurate data / covered every bullet point' : 'My position is clear and consistent'}</label></div></details>
        <div class="row" style="margin-top:12px"><button class="btn" data-act="submit">Submit for review</button><button class="btn ghost" data-act="savedraft">Save draft</button></div></div>`;
      const ta = U.$('#essay', root);
      const upd = () => { const n = U.countWords(ta.value); const el = U.$('#wc', root); el.textContent = n + ' words'; el.className = 'wc ' + (n >= min ? 'ok' : 'low'); };
      ta.addEventListener('input', upd); upd(); ta.focus();
    }

    /* ---------------- feedback ---------------- */
    function submit(text, extra) {
      extra = extra || {};
      const t = extra.task || task;
      const checklist = extra.noChecklist ? null : { a: (U.$('#sc1', root) || {}).checked !== false, b: (U.$('#sc2', root) || {}).checked !== false, c: (U.$('#sc3', root) || {}).checked !== false };
      const est = IM.tutor.estimateWriting(text, t, { checklist });
      const sub = { id: U.uid(), ts: Date.now(), date: U.today(), taskId: t.id, task: t.task, type: t.type, text, words: est.words, est: Object.assign({}, est.scores, { overall: est.overall }), rewriteOf: extra.rewriteOf || rewriteOf || null, mode: extra.mode || mode };
      IM.store.update(s => { s.writing.submissions.push(sub); if (s.writing.submissions.length > 200) s.writing.submissions.shift(); });
      est.issues.filter(i => i.confidence === 'sure' || i.cat === 'Spelling').slice(0, 8).forEach(i => IM.notebook.add(i, 'writing'));
      IM.analytics.recordBaseline('writing', est.overall);
      IM.analytics.recordArea('Academic writing', est.overall >= 6 ? 1 : 0, 1);
      IM.analytics.recordArea('Cohesion and logical expression', est.scores.cc >= 6 ? 1 : 0, 1);
      IM.analytics.recordArea('Grammar', est.scores.gra >= 6 ? 1 : 0, 1);
      est.issues.filter(i => i.cat === 'Spelling').forEach(() => IM.analytics.recordArea('Spelling', 0, 1));
      IM.store.logActivity('writing', 'writing-' + t.task, `Task ${t.task}: est. ${est.overall}`, est.overall, 9, extra.minutes || 20);
      if (extra.silent) return { sub, est };
      showFeedback(sub, est, t);
    }

    function critHtml(est) {
      const names = { ta: 'Task Achievement / Response', cc: 'Coherence and Cohesion', lr: 'Lexical Resource', gra: 'Grammatical Range and Accuracy' };
      return `<div class="criteria">${CRIT().map(c => `<div class="crit"><h4><span>${names[c.id]}</span><span class="score">${est.scores[c.id].toFixed(1)}</span></h4><p class="small muted" style="margin:0 0 4px">${esc(W().rubric[c.id][est.scores[c.id] >= 6.5 ? 0 : est.scores[c.id] >= 5.5 ? 1 : 2])}</p><ul class="small">${est.evidence[c.id].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    }

    function showFeedback(sub, est, t) {
      const prev = sub.rewriteOf ? S().writing.submissions.find(s => s.id === sub.rewriteOf) : null;
      root.innerHTML = `<a class="back" href="#" data-act="exit">← Back to Writing Coach</a><h1>Feedback: ${esc(t.type)}</h1>
        <div class="card"><div class="grid c3">${IM.ui.stat('Estimated practice score', est.overall.toFixed(1), 'not an official band')}${IM.ui.stat('Words', est.words, 'minimum ' + (t.task === 1 ? 150 : 250))}${IM.ui.stat('Issues detected', est.issues.length, est.register.length + ' style note(s)')}</div>
        <p class="note">${esc(est.note)} It counts patterns such as paragraphing, linkers, word variety and common errors. It cannot judge the quality of an argument, the accuracy of data, or the naturalness of your style. Automated scores here are capped at 7.5 for that reason, and length alone never raises a score.</p>
        ${prev ? `<p class="note good"><b>Compared with your previous draft:</b> ${prev.est.overall.toFixed(1)} → ${est.overall.toFixed(1)} (${CRIT().map(c => `${c.short} ${prev.est[c.id].toFixed(1)}→${est.scores[c.id].toFixed(1)}`).join(', ')}); ${prev.words} → ${est.words} words.</p>` : ''}</div>
        <div class="card"><h2>Criterion-by-criterion feedback</h2>${critHtml(est)}</div>
        <div class="grid c2"><div class="card"><h3>Strengths</h3>${est.strengths.length ? `<ul>${est.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No clear strengths were detected by the rules. Compare your text with the model answer.</p>'}</div>
        <div class="card"><h3>Specific weaknesses</h3>${est.weaknesses.length ? `<ul>${est.weaknesses.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No weaknesses were detected by the rules.</p>'}</div></div>
        <div class="card"><h3>Your text with detected issues</h3><p class="small muted">Red = likely error, amber = possible issue. Hover for the explanation.</p><div class="highlighted">${highlighted(sub.text, est.issues)}</div></div>
        ${est.examples.length ? `<div class="card"><h3>Examples from your writing, with improvements</h3>${est.examples.map(x => `<div class="explain wrong"><b>${esc(x.cat)}</b><br>Original: ${esc(x.original)}<br><b>Improved:</b> ${esc(x.corrected)}<br><span class="small">${esc(x.msg)}</span></div>`).join('')}<p class="small muted">These sentences were added to your error notebook so you can practise fixing them.</p></div>` : ''}
        ${est.register.length ? `<div class="card"><h3>Style and register notes</h3><ul>${est.register.slice(0, 8).map(r => `<li>“${esc(r.match)}”: ${esc(r.msg)}</li>`).join('')}</ul></div>` : ''}
        <div class="card"><h3>Practical recommendations</h3><ul>${est.recommendations.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p><b>Follow-up exercise:</b> ${esc(est.followUp)}</p></div>
        <div class="card"><h3>Model response</h3><details><summary>Show the model answer (${U.countWords(t.model)} words)</summary><div class="highlighted">${esc(t.model)}</div><p class="small muted">A model shows one possible approach. Notice the structure, the linking and the range of vocabulary, then rewrite your own text rather than copying.</p></details></div>
        <div class="row"><button class="btn" data-act="rewrite" data-id="${sub.id}">Rewrite this response</button><button class="btn secondary" data-tab="notebook">Open the error notebook</button><button class="btn ghost" data-act="exit">Done</button></div>`;
      root.dataset.lastSub = sub.id;
    }

    /* ---------------- exam ---------------- */
    function examHtml() {
      const { t1, t2 } = tasksFor(tt());
      if (examState) return examRunHtml();
      return `<div class="card"><h2>Full Writing examination (${IM.data.scoring.exam.writing.strictMinutes} minutes)</h2><p>Task 1 and Task 2 in one sitting. Suggested timing: about 20 minutes on Task 1 and 40 minutes on Task 2. There are no plans, hints or feedback until you submit. Both responses are then reviewed against the four criteria as <b>estimated practice scores</b>.</p>
        <p class="small muted">Version: ${tt() === 'academic' ? 'Academic' : 'General Training'} (change in Settings).</p><button class="btn" data-act="startexam">Start the examination</button></div>`;
    }
    function startExam() {
      const { t1, t2 } = tasksFor(tt());
      const done = new Set(S().writing.submissions.filter(s => s.mode === 'exam').map(s => s.taskId));
      const pick = l => l.find(x => !done.has(x.id)) || U.pick(l);
      examState = { t1: pick(t1), t2: pick(t2), started: Date.now(), deadline: Date.now() + IM.data.scoring.exam.writing.strictMinutes * 60000, which: 1, texts: { 1: '', 2: '' } };
      IM.activeExam = true;
      tab = 'exam'; drawExam();
    }
    function examRunHtml() {
      const t = examState.which === 1 ? examState.t1 : examState.t2;
      return `<div class="exam-bar"><b>Writing examination</b>${IM.ui.badge('Strict Exam Mode', 'warn')}<span class="timer" id="timer">--:--</span><div style="flex:1"></div><button class="btn" data-act="submitexam">Submit both tasks</button></div>
        <div class="tabs"><button class="tab ${examState.which === 1 ? 'active' : ''}" data-which="1">Task 1</button><button class="tab ${examState.which === 2 ? 'active' : ''}" data-which="2">Task 2</button></div>
        ${taskHtml(t)}<div class="card"><div class="row space"><label class="field" for="essay" style="margin:0">Your response</label><span class="wc" id="wc">0 words</span></div><textarea id="essay" rows="16" spellcheck="false">${esc(examState.texts[examState.which])}</textarea></div>`;
    }
    function drawExam() {
      root.innerHTML = header() + examHtml();
      if (!examState) return;
      const ta = U.$('#essay', root), min = examState.which === 1 ? 150 : 250;
      const upd = () => { examState.texts[examState.which] = ta.value; const n = U.countWords(ta.value); const el = U.$('#wc', root); el.textContent = n + ' words (minimum ' + min + ')'; el.className = 'wc ' + (n >= min ? 'ok' : 'low'); };
      ta.addEventListener('input', upd); upd();
      stopTimer();
      const tick = () => { const left = Math.round((examState.deadline - Date.now()) / 1000); const el = U.$('#timer', root); if (el) { el.textContent = U.mmss(left); el.classList.toggle('low', left <= 300); } if (left <= 0) { stopTimer(); U.toast('Time is up: your responses were submitted.', 'warn'); submitExam(); } };
      tick(); timerId = setInterval(tick, 500);
    }
    function submitExam() {
      if (!examState) return;
      stopTimer(); IM.activeExam = false;
      const es = examState; examState = null;
      const r1 = es.texts[1].trim() ? submit(es.texts[1], { task: es.t1, mode: 'exam', silent: true, noChecklist: true, minutes: 20 }) : null;
      const r2 = es.texts[2].trim() ? submit(es.texts[2], { task: es.t2, mode: 'exam', silent: true, noChecklist: true, minutes: 40 }) : null;
      if (!r1 && !r2) { U.toast('Nothing was written, so nothing was recorded.', 'warn'); tab = 'exam'; drawAll(); return; }
      const parts = [r1 && { r: r1, t: es.t1 }, r2 && { r: r2, t: es.t2 }].filter(Boolean);
      const overall = r1 && r2 ? IM.analytics.roundBand((r1.est.overall + 2 * r2.est.overall) / 3) : null;
      root.innerHTML = `<h1>Examination results</h1><div class="card"><div class="grid c3">${IM.ui.stat('Task 1 estimate', r1 ? r1.est.overall.toFixed(1) : 'not written')}${IM.ui.stat('Task 2 estimate', r2 ? r2.est.overall.toFixed(1) : 'not written')}${IM.ui.stat('Weighted Writing estimate', overall == null ? 'incomplete' : overall.toFixed(1), 'Task 2 counts double')}</div><p class="note">${esc(IM.data.scoring.disclaimers.writing)}</p></div>
        ${parts.map(p => `<div class="card"><h2>Task ${p.t.task}: ${esc(p.t.type)} (${p.r.est.words} words)</h2>${critHtml(p.r.est)}<p><b>Weaknesses:</b> ${p.r.est.weaknesses.map(esc).join(' ') || 'none detected'}</p><details><summary>Model answer</summary><div class="highlighted">${esc(p.t.model)}</div></details></div>`).join('')}
        <div class="row"><button class="btn" data-tab="notebook">Error notebook</button><button class="btn secondary" data-act="exit">Done</button></div>`;
    }

    /* ---------------- notebook / history ---------------- */
    function notebookHtml() {
      const nb = S().writing.notebook;
      if (!nb.length) return IM.ui.empty('Your error notebook is empty. Submit a writing response and detected errors will be saved here with an explanation and an improved version.', '<button class="btn" data-tab="practice">Write something</button>');
      const open = nb.filter(n => !n.resolved).length;
      const cats = IM.analytics.writingErrorStats();
      return `<div class="card"><p><b>${nb.length}</b> entries · <b>${open}</b> still to fix. Top categories: ${cats.slice(0, 4).map(c => `${esc(c.label)} (${c.count})`).join(', ')}.</p><a class="btn small" href="#/english?tab=clinic&start=1">Open the Sentence Clinic</a></div>
        ${nb.slice().reverse().slice(0, 40).map(n => `<div class="card"><div class="row space"><b>${esc(n.category)}</b><span>${n.resolved ? IM.ui.badge('fixed', 'good') : IM.ui.badge('to fix', 'warn')} <span class="small muted">${U.fmtDate(n.date)} · ${n.attempts.length} attempt(s)</span></span></div>
          <p><b>Original:</b> ${esc(n.sentence)}</p><p><b>Why:</b> ${esc(n.msg)}</p>${n.improved ? `<p><b>Improved:</b> ${esc(n.improved)}</p>` : ''}
          ${n.attempts.length ? `<p class="small muted">Your last attempt: “${esc(n.attempts[n.attempts.length - 1].text)}” ${n.attempts[n.attempts.length - 1].fixed ? '✔' : '✘'}</p>` : ''}
          <div class="row"><input type="text" data-nb="${n.id}" placeholder="Rewrite the sentence correctly" aria-label="Rewrite the sentence" style="flex:1;min-width:200px"><button class="btn small" data-act="nbcheck" data-id="${n.id}">Check</button></div><div class="small" id="nbm-${n.id}"></div></div>`).join('')}`;
    }
    function historyHtml() {
      const subs = S().writing.submissions;
      if (!subs.length) return IM.ui.empty('No writing history yet.', '<button class="btn" data-tab="practice">Start writing</button>');
      const series = CRIT().map(c => ({ name: c.short, ys: subs.slice(-12).map(s => s.est[c.id]) }));
      return `<div class="card"><h3>Criterion trends (last ${Math.min(12, subs.length)} responses)</h3>${IM.charts.line({ xs: subs.slice(-12).map((s, i) => String(i + 1)), series, min: 3, max: 8, title: 'Estimated practice scores' })}<p class="small muted">Estimated practice scores, not official bands.</p></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Task</th><th>Words</th><th>TA/TR</th><th>CC</th><th>LR</th><th>GRA</th><th>Est.</th></tr></thead><tbody>${subs.slice().reverse().map(s => `<tr><td>${U.fmtDate(s.date)}</td><td>${esc(s.type)}${s.rewriteOf ? ' (rewrite)' : ''}${s.mode === 'exam' ? ' (exam)' : ''}</td><td>${s.words}</td><td>${s.est.ta}</td><td>${s.est.cc}</td><td>${s.est.lr}</td><td>${s.est.gra}</td><td><b>${s.est.overall}</b></td></tr>`).join('')}</tbody></table></div></div>`;
    }

    function drawAll() {
      stopTimer();
      if (tab === 'exam') { drawExam(); return; }
      root.innerHTML = header() + (tab === 'practice' ? practiceHtml() : tab === 'notebook' ? notebookHtml() : historyHtml());
    }

    root.addEventListener('click', e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { e.preventDefault(); if (examState && tb.dataset.tab !== 'exam' && !window.confirm('Leave the examination? Your responses will be submitted.')) return; if (examState) submitExam(); tab = tb.dataset.tab; drawAll(); return; }
      const tk = e.target.closest('[data-task]'); if (tk) { openEditor(findTask(tk.dataset.task), 'learning'); return; }
      const wh = e.target.closest('[data-which]'); if (wh && examState) { examState.which = Number(wh.dataset.which); drawExam(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'exit': e.preventDefault(); stopTimer(); examState = null; IM.activeExam = false; tab = tab === 'exam' ? 'practice' : tab; drawAll(); break;
        case 'savedraft': { const t = U.$('#essay', root).value; IM.store.update(s => { s.inProgress['draft-' + task.id] = { text: t, ts: Date.now() }; }); U.toast('Draft saved in this browser.', 'good'); break; }
        case 'submit': {
          const text = U.$('#essay', root).value;
          if (U.countWords(text) < 20) { U.toast('Write at least a few sentences before submitting.', 'warn'); return; }
          submit(text); break;
        }
        case 'rewrite': { const sub = S().writing.submissions.find(s => s.id === a.dataset.id); openEditor(findTask(sub.taskId), 'learning', sub.text, sub.id); break; }
        case 'startexam': startExam(); break;
        case 'submitexam': if (window.confirm('Submit both tasks now?')) submitExam(); break;
        case 'nbcheck': {
          const id = a.dataset.id, inp = U.$('[data-nb="' + id + '"]', root), msg = U.$('#nbm-' + id, root);
          const r = IM.notebook.retry(id, inp.value.trim());
          if (r) msg.innerHTML = r.fixed ? '<span style="color:var(--good)">✔ ' + esc(r.why) + '</span>' : '<span style="color:var(--bad)">✘ ' + esc(r.why) + '</span>';
          if (r && r.fixed) setTimeout(() => { tab = 'notebook'; drawAll(); }, 900);
          break;
        }
      }
    });

    drawAll();
    return () => { stopTimer(); IM.activeExam = false; };
  };
})();
