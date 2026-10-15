/* Personalised study plan, weekly/monthly targets, readiness and the revision queue. */
(function () {
  const U = IM.util, esc = U.esc;
  const A = () => IM.analytics;
  const SKILL_ROUTE = { listening: '#/exam/listening', reading: '#/exam/reading', writing: '#/writing', speaking: '#/speaking' };

  /* ---------------------------------------------------------------- plan generation */
  function dictationFocus() {
    const top = A().dictationErrorStats()[0];
    if (!top || top.count < 2) return { cat: '', label: 'Dictation: spelling and listening drill' };
    const map = { 'plural-ending': ['G', 'plural endings'], 'verb-ending': ['G', 'word endings'], homophone: ['C', 'homophones'], 'double-letter': ['D', 'double letters'], 'silent-letter': ['D', 'silent letters'], 'vowel-combo': ['D', 'vowel spellings'], omission: ['E', 'missing words'], order: ['E', 'word order'] };
    const m = map[top.tag];
    return m ? { cat: m[0], label: 'Dictation drill: ' + m[1] } : { cat: 'E', label: 'Dictation: sentence accuracy' };
  }

  function buildToday() {
    const s = IM.store.state;
    const dow = new Date().getDay();
    const studyDay = s.settings.studyDays.includes(dow);
    const budget = studyDay ? s.settings.dailyMinutes : 10;
    const tasks = [];
    const due = IM.srs.due();
    if (due.length) tasks.push({ id: 'revision', module: 'revision', title: `Revision queue (${Math.min(due.length, 25)} due)`, minutes: Math.min(15, Math.max(5, Math.ceil(due.length * 0.6))), route: '#/revision', why: 'Overdue items are reviewed first, because forgetting is cheapest to fix early.' });
    const df = dictationFocus();
    const wk = A().weakestSkill();
    const order = ['listening', 'reading', 'writing', 'speaking'];
    const rotation = order[dow % 4];
    const focus = wk && dow % 2 === 0 ? wk.skill : rotation;
    const focusTask = {
      listening: { title: 'Listening: timed section practice', route: '#/exam/listening', minutes: 20 },
      reading: { title: 'Reading: timed passage practice', route: '#/exam/reading', minutes: 20 },
      writing: { title: 'Writing: one task with feedback and rewrite', route: '#/writing', minutes: 30 },
      speaking: { title: 'Speaking: Part 2 long turn and review', route: '#/speaking', minutes: 15 }
    }[focus];
    const weakArea = Object.entries(A().areaStats()).filter(([k, v]) => v.attempts >= 3).sort((a, b) => a[1].pct - b[1].pct)[0];
    const openNotebook = s.writing.notebook.filter(n => !n.resolved).length;

    const pool = [
      { id: 'vocab', module: 'vocab', title: 'Vocabulary: new words and active recall', minutes: 10, route: '#/vocab', why: 'Daily vocabulary builds Lexical Resource steadily.', p: 2 },
      { id: 'dictation', module: 'dictation', title: df.label, minutes: 10, route: '#/dictation' + (df.cat ? '?cat=' + df.cat : ''), why: A().dictationErrorStats().length ? 'Chosen from your most frequent dictation error.' : 'Regular listening-and-typing drills improve spelling and listening.', p: 3 },
      { id: 'focus-' + focus, module: focus, title: focusTask.title, minutes: focusTask.minutes, route: focusTask.route, why: wk && wk.skill === focus ? 'This is currently your weakest skill against its target.' : 'Planned rotation so that all four skills are practised each week.', p: 1 },
      { id: 'grammar', module: 'english', title: weakArea ? `Grammar and language: ${weakArea[0].toLowerCase()}` : 'Grammar lesson and short assessment', minutes: 10, route: '#/english', why: weakArea ? `Accuracy in this area is ${weakArea[1].pct}%.` : 'Language accuracy supports every skill.', p: 4 }
    ];
    if (openNotebook) pool.push({ id: 'clinic', module: 'clinic', title: `Sentence Clinic: fix ${Math.min(3, openNotebook)} sentence(s) from your error notebook`, minutes: 8, route: '#/english?tab=clinic', why: 'Re-writing your own errors is the quickest way to stop repeating them.', p: 3 });
    const lastMock = s.mocks.length ? s.mocks[s.mocks.length - 1].ts : 0;
    if (Date.now() - lastMock > 14 * 86400000 && (dow === 6 || dow === 0)) pool.push({ id: 'mock', module: 'mock', title: 'Full-length mock examination (one skill)', minutes: 60, route: '#/exam', why: 'No mock test recorded in the last 14 days.', p: 1 });

    pool.sort((a, b) => a.p - b.p);
    let used = U.sum(tasks.map(t => t.minutes));
    pool.forEach(t => { if (used + t.minutes <= budget || tasks.length < 2) { tasks.push(t); used += t.minutes; } });
    if (!studyDay) tasks.forEach(t => { t.light = true; });
    return { tasks, budget, studyDay, minutes: used };
  }

  function isDone(t) {
    const s = IM.store.state, d = U.today();
    if (s.plan.completed[d + ':' + t.id]) return true;
    return s.activity.some(a => a.date === d && a.module === t.module);
  }

  /* ---------------------------------------------------------------- targets */
  function moduleCount(mod, days) {
    const since = U.addDays(U.today(), -(days - 1));
    return IM.store.state.activity.filter(a => a.date >= since && a.module === mod).length;
  }
  function targetsFor(days) {
    const k = days / 7;
    const base = [
      { mod: 'vocab', label: 'Vocabulary sessions', n: 4 }, { mod: 'dictation', label: 'Dictation exercises', n: 5 }, { mod: 'english', label: 'Grammar / language lessons', n: 2 },
      { mod: 'listening', label: 'Listening practice (sections or tests)', n: 1 }, { mod: 'reading', label: 'Reading practice (passages or tests)', n: 1 },
      { mod: 'writing', label: 'Writing responses (Task 1 and Task 2)', n: 2 }, { mod: 'speaking', label: 'Speaking practice sessions', n: 2 }, { mod: 'revision', label: 'Revision sessions', n: 3 }
    ];
    const dayFactor = IM.store.state.settings.studyDays.length / 6;
    return base.map(b => ({ label: b.label, mod: b.mod, target: Math.max(1, Math.round(b.n * k * dayFactor)), done: moduleCount(b.mod, days) }));
  }

  function weeklyReview() {
    const s = IM.store.state;
    const thisW = A().minutesLast(7);
    let prev = 0;
    for (let i = 7; i < 14; i++) { const d = s.days[U.addDays(U.today(), -i)]; if (d) prev += d.minutes; }
    const days = A().studiedDays(7);
    const planned = s.settings.studyDays.length;
    const ds = A().dictationSummary();
    const prevAt = s.dictation.attempts.filter(a => a.date < U.addDays(U.today(), -6));
    const thisAt = s.dictation.attempts.filter(a => a.date >= U.addDays(U.today(), -6) && a.first);
    const improved = [], weak = [];
    if (thisAt.length && prevAt.length) {
      const a1 = U.avg(thisAt.map(a => a.wordAccuracy)), a0 = U.avg(prevAt.filter(a => a.first).map(a => a.wordAccuracy));
      if (a1 > a0 + 2) improved.push(`Dictation word accuracy rose from ${Math.round(a0)}% to ${Math.round(a1)}%.`);
      else if (a1 < a0 - 2) weak.push(`Dictation word accuracy fell from ${Math.round(a0)}% to ${Math.round(a1)}%.`);
    }
    if (thisW > prev && prev > 0) improved.push(`Study time increased from ${prev} to ${thisW} minutes.`);
    else if (thisW < prev) weak.push(`Study time fell from ${prev} to ${thisW} minutes.`);
    Object.entries(A().areaStats()).forEach(([k, v]) => { if (v.attempts >= 5 && v.pct < 60) weak.push(`${k}: ${v.pct}% accuracy over ${v.attempts} answers.`); });
    const est = A().estimates();
    const wk = A().weakestSkill();
    if (wk) weak.push(`Weakest skill against target: ${wk.skill} (estimate ${wk.band.toFixed(1)}).`);
    const errs = A().combinedErrorCategories().slice(0, 3);
    const consist = days >= Math.min(planned, 4) ? `You studied on ${days} of the last 7 days (plan: ${planned} days a week).` : `You studied on ${days} of the last 7 days, below your plan of ${planned} days a week.`;
    return { date: U.today(), thisW, prev, days, planned, improved, weak, errs, consist, recs: IM.tutor.recommend().slice(0, 3), estimates: est, sample: ds.total };
  }

  IM.plan = { today: buildToday, isDone, targetsFor, weeklyReview };

  /* ---------------------------------------------------------------- views */
  function taskRow(t) {
    const done = isDone(t);
    return `<div class="todo ${done ? 'done' : ''}"><input type="checkbox" data-id="${esc(t.id)}" ${done ? 'checked' : ''} aria-label="Mark ${esc(t.title)} as done"><div style="flex:1"><div class="tt"><b>${esc(t.title)}</b> <span class="badge">${t.minutes} min</span>${t.light ? ' <span class="badge info">light day</span>' : ''}</div><div class="small muted">${esc(t.why || '')}</div></div><a class="btn small secondary" href="${t.route}">Start</a></div>`;
  }

  function targetRows(list) {
    return list.map(t => `<div style="margin:10px 0"><div class="row space small"><span>${esc(t.label)}</span><span><b>${t.done}</b> / ${t.target}</span></div>${IM.ui.bar(U.pct(Math.min(t.done, t.target), t.target), t.label, t.done >= t.target ? 'good' : '')}</div>`).join('');
  }

  IM.views.plan = function (root, params) {
    const s = IM.store.state;
    let tab = params.tab || 'today';
    function phaseText() {
      if (!s.settings.examDate) return 'No examination date is set. Add one in Settings to see a countdown and a suggested training phase.';
      const days = U.dayDiff(U.today(), s.settings.examDate);
      if (days < 0) return 'The examination date you entered has passed. Update it in Settings.';
      const ph = days > 60 ? 'Foundation phase: build vocabulary, grammar and spelling, and take untimed practice to learn the question types.' : days > 28 ? 'Consolidation phase: add timed sections, full Writing tasks and recorded Speaking practice.' : 'Examination phase: prioritise full mock tests in strict mode, review your error notebook and rest well.';
      return `<b>${days} day${days === 1 ? '' : 's'}</b> until your examination on ${U.fmtDate(s.settings.examDate)}. ${ph}`;
    }
    function body() {
      if (tab === 'today') {
        const p = buildToday();
        const done = p.tasks.filter(isDone).length;
        return `<div class="card"><h2>Today’s plan</h2>
          <p class="muted">${p.studyDay ? `Budget ${p.budget} minutes (planned ${p.minutes}).` : 'Today is not one of your study days. A light 10-minute review is suggested; extra practice is always welcome.'}</p>
          ${IM.ui.bar(U.pct(done, p.tasks.length), 'Tasks complete')}<p class="small muted">${done} of ${p.tasks.length} tasks complete</p>
          ${p.tasks.map(taskRow).join('')}
          <p class="small muted" style="margin-top:12px">Tasks are chosen from your recorded performance: due reviews, your weakest skill and most frequent errors. A short day? Do the first two tasks only. Completing a task in its module ticks it automatically.</p></div>
          <div class="card soft"><h3>Where you are in your preparation</h3><p>${phaseText()}</p></div>`;
      }
      if (tab === 'week') {
        const wr = weeklyReview();
        const dayCells = [];
        for (let i = 6; i >= 0; i--) {
          const d = U.addDays(U.today(), -i), rec = s.days[d], dow = U.parseDate(d).getDay();
          dayCells.push(`<div class="card soft center" style="padding:8px"><div class="small muted">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]}</div><div style="font-size:1.4rem">${rec ? '✅' : (s.settings.studyDays.includes(dow) ? '⬜' : '·')}</div><div class="small">${rec ? rec.minutes + ' min' : ''}</div></div>`);
        }
        return `<div class="card"><h2>This week</h2><div class="grid" style="grid-template-columns:repeat(7,1fr);gap:6px">${dayCells.join('')}</div>
          <p class="small muted">✅ studied · ⬜ planned but not yet studied · · rest day</p>
          <h3>Weekly targets</h3>${targetRows(targetsFor(7))}</div>
          <div class="card"><h2>Weekly progress review</h2>${reviewHtml(wr)}<div class="row"><button class="btn" data-act="savereview">Save this review</button></div></div>
          ${s.plan.reviews.length ? `<div class="card"><h3>Saved reviews</h3><ul>${s.plan.reviews.slice(-5).reverse().map(r => `<li>${U.fmtDate(r.date)}: ${r.thisW} minutes, studied ${r.days} day(s). ${esc(r.consist)}</li>`).join('')}</ul></div>` : ''}`;
      }
      if (tab === 'month') {
        const lastMocks = {};
        s.mocks.forEach(m => { lastMocks[m.skill] = m.ts; });
        const mockRows = ['listening', 'reading'].map(k => { const t = lastMocks[k]; const due = t ? U.addDays(U.dateStr(new Date(t)), 14) : U.today(); return `<tr><td>${k}</td><td>${t ? U.fmtDate(U.dateStr(new Date(t))) : 'None yet'}</td><td>${due <= U.today() ? '<b>Due now</b>' : U.fmtDate(due)}</td></tr>`; }).join('');
        return `<div class="card"><h2>This month (last 30 days)</h2>${targetRows(targetsFor(30))}
          <p class="small muted">Monthly targets scale with your chosen study days. They are guides, not guarantees of any result.</p></div>
          <div class="card"><h3>Full mock examinations</h3><p>Plan a full-length mock for each skill about every two weeks.</p>
          <div class="table-wrap"><table class="t"><thead><tr><th>Skill</th><th>Last mock</th><th>Next suggested</th></tr></thead><tbody>${mockRows}<tr><td>writing</td><td>${s.writing.submissions.length ? U.fmtDate(s.writing.submissions[s.writing.submissions.length - 1].date) : 'None yet'}</td><td>Weekly</td></tr><tr><td>speaking</td><td>${s.speaking.sessions.length ? U.fmtDate(s.speaking.sessions[s.speaking.sessions.length - 1].date) : 'None yet'}</td><td>Twice weekly</td></tr></tbody></table></div></div>`;
      }
      // readiness
      const r = A().readiness();
      return `<div class="card"><h2>Examination readiness</h2><p class="muted">A transparent checklist, not a prediction. “Ready” means your recorded estimates meet the target within half a band, you have enough practice attempts, and your results are consistent.</p>
        ${r.map(x => `<div class="card soft"><div class="row space"><h3 style="margin:0;text-transform:capitalize">${x.skill}</h3>${x.ready ? '<span class="badge good">Meets readiness checks</span>' : '<span class="badge warn">Not yet</span>'}</div><ul class="small">${x.checks.map(c => `<li>${c.ok ? '✅' : '⬜'} ${esc(c.text)}</li>`).join('')}</ul></div>`).join('')}
        <p class="note">Readiness here is based only on your practice data in this app. It cannot guarantee an official result.</p></div>`;
    }
    function reviewHtml(wr) {
      return `<p>${esc(wr.consist)} Study time: <b>${wr.thisW}</b> minutes this week (<b>${wr.prev}</b> the week before).</p>
        <h4>What improved</h4>${wr.improved.length ? `<ul>${wr.improved.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted small">Not enough data yet to show improvement. Keep practising for at least two weeks.</p>'}
        <h4>What remains weak</h4>${wr.weak.length ? `<ul>${wr.weak.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted small">No weak areas detected from the data so far.</p>'}
        <h4>Recurring errors</h4>${wr.errs.length ? `<ul>${wr.errs.map(x => `<li>${esc(x.label)} (${x.count}, ${esc(x.source)})</li>`).join('')}</ul>` : '<p class="muted small">No recurring errors recorded yet.</p>'}
        <h4>Priorities for next week</h4>${wr.recs.length ? `<ul>${wr.recs.map(x => `<li><a href="${x.route}">${esc(x.title)}</a> <span class="muted small">— ${esc(x.why)}</span></li>`).join('')}</ul>` : '<p class="muted small">Keep up your daily plan.</p>'}`;
    }
    function draw() {
      root.innerHTML = `<h1>Personalised study plan</h1>
        <div class="tabs" role="tablist">${[['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['ready', 'Readiness']].map(t => `<button class="tab" role="tab" aria-selected="${tab === t[0]}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>${body()}`;
    }
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; draw(); return; }
      if (e.target.closest('[data-act=savereview]')) { const wr = weeklyReview(); IM.store.update(st => { st.plan.reviews.push({ date: wr.date, thisW: wr.thisW, days: wr.days, consist: wr.consist }); }); U.toast('Review saved.', 'good'); draw(); }
    });
    root.addEventListener('change', e => {
      const c = e.target.closest('.todo input[type=checkbox]');
      if (c) { IM.store.update(st => { st.plan.completed[U.today() + ':' + c.dataset.id] = c.checked; }); draw(); }
    });
    draw();
  };

  /* ---------------------------------------------------------------- revision queue */
  IM.views.revision = function (root) {
    const due = IM.srs.due();
    const groups = { vocab: [], spell: [], dict: [], gram: [], clinic: [], other: [] };
    due.forEach(it => { (groups[it.kind] || groups.other).push(it); });
    const weak = IM.srs.weak();
    const row = (label, list, route, btn) => `<div class="rec"><div><p><b>${label}</b> <span class="badge ${list.length ? 'warn' : ''}">${list.length} due</span></p><p class="why">${list.length ? esc(list.slice(0, 5).map(x => x.title).join(', ')) + (list.length > 5 ? '…' : '') : 'Nothing due.'}</p></div>${list.length ? `<a class="btn small" href="${route}">${btn}</a>` : ''}</div>`;
    root.innerHTML = `<h1>Revision queue</h1>
      <div class="card"><p>Items return for review on a schedule that grows when you remember and shrinks when you forget. Intervals (days) by box: ${IM.data.scoring.srs.intervalsDays.join(' → ')}. An item is treated as mastered only after repeated successful retrieval on different days and in different exercise types.</p>
      ${due.length ? '' : IM.ui.empty('Nothing is due for review right now. New items appear here after you practise vocabulary, dictation and lessons.', '<a class="btn" href="#/vocab">Learn new words</a>')}
      ${row('Vocabulary', groups.vocab, '#/vocab?mode=review', 'Review words')}
      ${row('Spelling and dictation', groups.spell.concat(groups.dict), '#/dictation?mode=review', 'Review spellings')}
      ${row('Grammar questions', groups.gram, '#/english?review=1', 'Review grammar')}
      ${row('Sentence Clinic skills', groups.clinic, '#/english?tab=clinic', 'Open the clinic')}</div>
      ${weak.length ? `<div class="card"><h2>Items you keep missing</h2><p class="small muted">A remedial step is suggested before returning to harder exercises.</p><ul>${weak.slice(0, 10).map(w => `<li><b>${esc(w.title)}</b> <span class="muted small">(${w.lapses} lapses, accuracy ${Math.round(IM.srs.accuracy(w) * 100)}%)</span></li>`).join('')}</ul></div>` : ''}`;
  };
})();
