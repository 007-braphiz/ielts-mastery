/* Dashboard: every figure is computed from recorded activity. Missing data is shown as unavailable, never invented. */
(function () {
  const U = IM.util, esc = U.esc;
  const SKILLS = [['listening', 'Listening', '🎧', '#/exam/listening'], ['reading', 'Reading', '📖', '#/exam/reading'], ['writing', 'Writing', '✍️', '#/writing'], ['speaking', 'Speaking', '🎤', '#/speaking']];

  IM.views.dashboard = function (root) {
    const s = IM.store.state;
    const A = IM.analytics;
    const est = A.estimates();
    const plan = IM.plan.today();
    const recs = IM.tutor.recommend();
    const vp = A.vocabProgress();
    const ds = A.dictationSummary();
    const dueN = IM.srs.due().length;
    const wk = A.weakestSkill();
    const errors = A.combinedErrorCategories().slice(0, 4);
    const recent = s.mocks.slice(-4).reverse();
    const tgt = s.settings.targets;
    const doneToday = plan.tasks.filter(IM.plan.isDone).length;
    const hasAny = s.activity.length > 0;

    const skillCard = ([k, name, ico, route]) => {
      const e = est.skills[k], b = e.band, t = tgt[k] || 8, base = s.diagnostic.baseline[k];
      const pctTo = b != null ? U.clamp(Math.round((b / t) * 100), 0, 100) : 0;
      return `<a class="modlink" href="${route}"><div class="card skillcard"><div class="band ${b == null ? 'none' : ''}">${b == null ? 'n/a' : b.toFixed(1)}</div>
        <div class="meta"><div><b>${ico} ${name}</b> <span class="muted small">target ${t.toFixed(1)}</span></div>
        ${b == null ? '<div class="small muted">No estimate yet. Complete a practice to see one.</div>' : `${IM.ui.bar(pctTo, name + ' progress towards target')}<div class="small muted">${esc(e.basis)}${base != null && base !== b ? ` · baseline ${base.toFixed(1)}` : ''}</div>`}</div></div></a>`;
    };

    const quick = [
      ['#/exam', '📝', 'Exam Simulator', 'Timed Listening, Reading, Writing and Speaking'], ['#/vocab', '📚', 'Vocabulary Mastery', '72 starter words across six levels'], ['#/dictation', '🎧', 'Dictation Laboratory', 'Hear it, type it, learn from errors'],
      ['#/english', '🔤', 'English Proficiency', 'Grammar, punctuation and the Sentence Clinic'], ['#/writing', '✍️', 'Writing Coach', 'Tasks 1 and 2 with criterion feedback'], ['#/speaking', '🎤', 'Speaking Coach', 'Parts 1–3, recording and pronunciation'],
      ['#/plan', '🗓️', 'Study Plan', 'Daily, weekly and monthly targets'], ['#/analytics', '📈', 'Progress Analytics', 'Bands, trends and error reports'], ['#/settings', '⚙️', 'Settings and Data', 'Targets, voices, export and import']
    ];

    root.innerHTML = `
      <div class="hero"><h1>${hasAny ? 'Welcome back' : 'Let’s begin'}</h1>
        <p>${est.overall != null ? `Estimated overall: <b>${est.overall.toFixed(1)}</b> (practice estimate) · target ${(tgt.overall || 8).toFixed(1)}.` : est.partial != null ? `Overall estimate is incomplete (still missing: ${est.missing.join(', ')}). Average of available skills: ${est.partial.toFixed(1)}.` : 'No progress estimates yet. Estimates appear after you complete assessments or practice tests.'}</p>
        <div class="row">${recs[0] ? `<a class="btn" href="${recs[0].route}">Next: ${esc(recs[0].title)}</a>` : ''}${!s.diagnostic.done ? '<a class="btn ghost" href="#/diagnostic">Take the diagnostic</a>' : ''}</div></div>

      <h2>Skill estimates</h2>
      <div class="grid c2">${SKILLS.map(skillCard).join('')}</div>
      <p class="small muted">Estimates combine your recent mock tests and rule-based feedback. They are practice estimates, not official IELTS bands. Overall: ${est.overall != null ? `<b>${est.overall.toFixed(1)}</b> (average of four skills, rounded to the nearest half band by IELTS convention)` : `unavailable until all four skills have an estimate (missing: ${est.missing.join(', ') || 'none'})`}.</p>

      <div class="grid c4" style="margin:16px 0">
        <div class="card">${IM.ui.stat('Study streak', IM.store.streak() + ' day' + (IM.store.streak() === 1 ? '' : 's'), A.minutesLast(7) + ' min in the last 7 days')}</div>
        <div class="card">${IM.ui.stat('Activities completed', s.activity.length, A.studiedDays(30) + ' study days in 30 days')}</div>
        <div class="card"><a href="#/revision" style="text-decoration:none;color:inherit">${IM.ui.stat('Revision items due', dueN, dueN ? 'Review now →' : 'All caught up')}</a></div>
        <div class="card">${IM.ui.stat('Weakest skill', wk ? wk.skill[0].toUpperCase() + wk.skill.slice(1) : 'n/a', wk ? `estimate ${wk.band.toFixed(1)} vs target ${(tgt[wk.skill] || 8).toFixed(1)}` : 'Needs at least one estimate')}</div>
      </div>

      <div class="grid c2">
        <div class="card"><h2>Today’s recommended exercises</h2>
          ${IM.ui.bar(U.pct(doneToday, plan.tasks.length), 'Daily plan progress')}<p class="small muted">${doneToday} of ${plan.tasks.length} complete</p>
          ${plan.tasks.map(t => `<div class="todo ${IM.plan.isDone(t) ? 'done' : ''}"><span>${IM.plan.isDone(t) ? '✅' : '⬜'}</span><div style="flex:1"><div class="tt"><b>${esc(t.title)}</b> <span class="badge">${t.minutes} min</span></div></div><a class="btn small secondary" href="${t.route}">Go</a></div>`).join('')}
          <p><a href="#/plan">Open the full study plan →</a></p></div>

        <div class="card"><h2>Recommended next actions</h2>
          ${recs.length ? recs.slice(0, 5).map(r => `<div class="rec"><div><p><b>${esc(r.title)}</b></p><p class="why">${esc(r.why)}</p></div><a class="btn small secondary" href="${r.route}">Open</a></div>`).join('') : IM.ui.empty('You are on track. Keep following your daily plan.')}</div>

        <div class="card"><h2>Vocabulary mastery</h2>
          ${IM.ui.bar(U.pct(vp.counts.mastered, vp.total), 'Vocabulary mastered')}
          <p><b>${vp.counts.mastered}</b> of ${vp.total} mastered · ${vp.counts.reviewing} reviewing · ${vp.counts.learning} learning · ${vp.counts.new} not started</p>
          <p class="small muted">Mastery needs repeated retrieval on different days and in different exercise types${vp.accuracy != null ? ` · answer accuracy ${vp.accuracy}% over ${vp.attempts} answers` : ''}.</p>
          <a class="btn small" href="#/vocab">Practise vocabulary</a></div>

        <div class="card"><h2>Dictation accuracy</h2>
          ${ds.total ? `<div class="grid c2"><div>${IM.ui.stat('Word accuracy (last 10)', ds.recentAvg + '%')}</div><div>${IM.ui.stat('Character accuracy', ds.charAvg + '%')}</div></div>
          <p class="small muted">${ds.total} attempt(s). First attempts average ${ds.firstAvg == null ? 'n/a' : ds.firstAvg + '%'}${ds.retryAvg != null ? `; retries ${ds.retryAvg}%` : ''}.</p>` : IM.ui.empty('No dictation attempts yet.')}
          <a class="btn small" href="#/dictation">Open the Dictation Laboratory</a></div>

        <div class="card"><h2>Most frequent error categories</h2>
          ${errors.length ? `<ul>${errors.map(e => `<li>${esc(e.label)} <span class="badge">${e.count}</span> <span class="muted small">${esc(e.source)}</span></li>`).join('')}</ul>` : IM.ui.empty('No errors recorded yet. They will appear as you practise.')}
          <a href="#/analytics">Full error report →</a></div>

        <div class="card"><h2>Recent mock examinations</h2>
          ${recent.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Skill</th><th>Raw</th><th>Est. band</th></tr></thead><tbody>${recent.map(m => `<tr><td>${U.fmtDate(m.date)}</td><td>${esc(m.skill)} (${esc(m.testType)})</td><td>${m.raw}/${m.max}</td><td>${U.bandText(m.band)}</td></tr>`).join('')}</tbody></table></div><p class="small muted">${esc(IM.data.scoring.disclaimers.objective)}</p>` : IM.ui.empty('No mock examinations yet.', '<a class="btn" href="#/exam">Open the Exam Simulator</a>')}</div>
      </div>

      <h2 style="margin-top:20px">All modules</h2>
      <div class="grid c3">${quick.map(q => `<a class="modlink" href="${q[0]}"><div class="card"><div class="ico" aria-hidden="true">${q[1]}</div><h3>${q[2]}</h3><p class="small muted" style="margin:0">${q[3]}</p></div></a>`).join('')}</div>`;
  };
})();
