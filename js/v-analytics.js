/* Progress analytics: every number is computed from recorded activity; nothing is invented. */
(function () {
  const U = IM.util, esc = U.esc;

  IM.views.analytics = function (root) {
    const s = IM.store.state, A = IM.analytics;
    const est = A.estimates(), t = s.settings.targets;
    const dsum = A.dictationSummary(), vp = A.vocabProgress(), qt = A.questionTypeAccuracy();
    const areas = A.areaStats(), errs = A.combinedErrorCategories().slice(0, 8);
    const wk = A.weakestSkill(), recs = IM.tutor.recommend();
    const base = s.diagnostic.baseline;

    const skillRows = A.SK.map(k => {
      const e = est.skills[k], b = e.band, cons = A.consistency(e.values);
      return `<tr><td style="text-transform:capitalize"><b>${k}</b></td><td>${b == null ? 'unavailable' : b.toFixed(1)}</td><td>${(t[k] || 8).toFixed(1)}</td><td>${base[k] != null ? Number(base[k]).toFixed(1) : '—'}</td><td>${e.basis || 'no data yet'}</td><td>${cons ? (cons.consistent ? 'consistent' : 'varies by ' + cons.spread.toFixed(1)) : '—'}</td></tr>`;
    }).join('');

    const mockSeries = ['listening', 'reading'].map(k => ({ name: k, vals: s.mocks.filter(m => m.skill === k && m.scope === 'full') })).filter(x => x.vals.length);
    const wsubs = s.writing.submissions.slice(-12);
    const days14 = [];
    for (let i = 13; i >= 0; i--) { const d = U.addDays(U.today(), -i); days14.push({ d, m: (s.days[d] || {}).minutes || 0 }); }

    // what improved: compare first and latest estimate per criterion
    const improved = [], weak = [];
    if (wsubs.length > 1) { const f = wsubs[0].est, l = wsubs[wsubs.length - 1].est; IM.data.scoring.writingCriteria.forEach(c => { if (l[c.id] > f[c.id]) improved.push(`Writing ${c.short}: ${f[c.id]} → ${l[c.id]}`); else if (l[c.id] < f[c.id]) weak.push(`Writing ${c.short} fell from ${f[c.id]} to ${l[c.id]}`); }); }
    ['listening', 'reading'].forEach(k => { const v = est.skills[k].values; if (v.length > 1) { if (v[v.length - 1] > v[0]) improved.push(`${k}: ${v[0]} → ${v[v.length - 1]}`); else if (v[v.length - 1] < v[0]) weak.push(`${k} estimate fell from ${v[0]} to ${v[v.length - 1]}`); } });
    Object.entries(areas).forEach(([k, v]) => { const b0 = base.areas && base.areas[k]; if (v.attempts >= 5 && b0 != null) { if (v.pct > b0 + 5) improved.push(`${k}: ${b0}% (diagnostic) → ${v.pct}%`); else if (v.pct < 60) weak.push(`${k}: ${v.pct}% accuracy`); } else if (v.attempts >= 5 && v.pct < 60) weak.push(`${k}: ${v.pct}% accuracy`); });

    root.innerHTML = `<h1>Progress analytics</h1>
      <div class="card"><h2>Band estimates</h2>
        <div class="grid c4">${A.SK.map(k => `<div>${IM.ui.stat(k[0].toUpperCase() + k.slice(1), est.skills[k].band == null ? 'n/a' : est.skills[k].band.toFixed(1), 'target ' + (t[k] || 8).toFixed(1))}</div>`).join('')}</div>
        <p style="margin-top:12px"><b>Overall estimate: ${est.overall == null ? 'incomplete' : est.overall.toFixed(1)}</b> ${est.overall == null ? `<span class="muted">(missing: ${est.missing.join(', ')}; the overall score needs all four skills, so none is shown)</span>` : `<span class="muted">(mean of four skills rounded to the nearest half band; target ${(t.overall || 8).toFixed(1)})</span>`}</p>
        <div class="table-wrap"><table class="t"><thead><tr><th>Skill</th><th>Current estimate</th><th>Target</th><th>First measurement</th><th>Based on</th><th>Consistency</th></tr></thead><tbody>${skillRows}</tbody></table></div>
        <p class="small muted">Listening and Reading estimates come from raw scores out of 40 converted with approximate, editable tables (first attempt of full tests only). Writing and Speaking are rule-based practice estimates. None of these are official IELTS results.</p></div>

      <div class="grid c2">
        <div class="card"><h3>Mock examination history</h3>${mockSeries.length ? IM.charts.line({ xs: Array.from({ length: Math.max(...mockSeries.map(x => x.vals.length)) }, (_, i) => String(i + 1)), series: mockSeries.map(x => ({ name: x.name + ' raw /40', ys: x.vals.map(m => m.raw) })), min: 0, max: 40 }) + `<p class="small muted">Raw scores out of 40 by attempt.</p>` : IM.ui.empty('No full mock tests yet.', '<a class="btn" href="#/exam">Open the Exam Simulator</a>')}</div>
        <div class="card"><h3>Writing criterion trends</h3>${wsubs.length > 1 ? IM.charts.line({ xs: wsubs.map((x, i) => String(i + 1)), series: IM.data.scoring.writingCriteria.map(c => ({ name: c.short, ys: wsubs.map(x => x.est[c.id]) })), min: 3, max: 8 }) : IM.ui.empty('Submit at least two writing responses to see trends.')}</div>
        <div class="card"><h3>Accuracy by question type</h3>${qt.length ? IM.charts.hbars(qt.map(r => ({ label: r.type, pct: r.pct, n: r.t }))) : IM.ui.empty('Complete a mock test to see this.')}</div>
        <div class="card"><h3>Study consistency (14 days)</h3>${IM.charts.bar({ cats: days14.map(d => d.d.slice(8)), series: [{ name: 'Minutes', vals: days14.map(d => d.m) }], h: 200, title: 'Minutes studied per day' })}<p class="small muted">Studied on ${A.studiedDays(14)} of the last 14 days · current streak ${IM.store.streak()} day(s).</p></div>
        <div class="card"><h3>Dictation spelling accuracy</h3>${dsum.total ? `<div class="grid c2">${IM.ui.stat('Word accuracy (last 10)', dsum.recentAvg + '%')}${IM.ui.stat('Character accuracy', dsum.charAvg + '%')}</div>${IM.charts.hbars(dsum.byLevel.map(r => ({ label: 'Level ' + r.key, pct: r.pct, n: r.n })))}` : IM.ui.empty('No dictation attempts yet.')}</div>
        <div class="card"><h3>Vocabulary retention</h3><p><b>${vp.counts.mastered}</b> of ${vp.total} words mastered; answer accuracy ${vp.accuracy == null ? 'n/a' : vp.accuracy + '%'} over ${vp.attempts} answers.</p>${IM.ui.bar(U.pct(vp.counts.mastered, vp.total))}${(() => { const it = Object.values(s.srs).filter(i => i.kind === 'vocab' && i.attempts >= 2); const rec = it.length ? Math.round(U.avg(it.map(i => IM.srs.accuracy(i))) * 100) : null; return `<p class="small muted">${rec == null ? 'Retention appears after words have been reviewed at least twice.' : 'Average accuracy on words reviewed more than once: ' + rec + '%.'}</p>`; })()}</div>
      </div>

      <div class="card"><h2>Language areas</h2>${IM.charts.hbars(Object.entries(areas).filter(([, v]) => v.attempts).map(([k, v]) => ({ label: k, pct: v.pct, n: v.attempts })))}${Object.values(areas).every(v => !v.attempts) ? IM.ui.empty('Practise lessons, vocabulary and dictation to populate this chart.') : ''}</div>

      <div class="card"><h2>Recurring errors</h2>${errs.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Error category</th><th>Count</th><th>Source</th></tr></thead><tbody>${errs.map(e => `<tr><td>${esc(e.label)}</td><td>${e.count}</td><td>${esc(e.source)}</td></tr>`).join('')}</tbody></table></div>` : IM.ui.empty('No errors recorded yet.')}</div>

      <div class="card"><h2>Report</h2>
        <h4>What improved</h4>${improved.length ? `<ul>${improved.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">Nothing can be shown yet: improvement needs at least two measurements of the same skill.</p>'}
        <h4>What remains weak</h4>${weak.length ? `<ul>${weak.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No weak areas detected from the current data.</p>'}
        <h4>Weakest skill</h4><p>${wk ? `<b>${wk.skill}</b>: estimate ${wk.band.toFixed(1)} against target ${(t[wk.skill] || 8).toFixed(1)}.` : 'Unavailable until at least one skill has an estimate.'}</p>
        <h4>Is performance consistent?</h4><ul>${A.SK.map(k => { const c = A.consistency(est.skills[k].values); return `<li style="text-transform:capitalize">${k}: ${c ? (c.consistent ? 'consistent across recent attempts' : 'varies by ' + c.spread.toFixed(1) + ' bands: more attempts are needed') : 'not enough attempts to judge'}</li>`; }).join('')}</ul>
        <h4>Activities to prioritise</h4>${recs.length ? `<ul>${recs.slice(0, 5).map(r => `<li><a href="${r.route}">${esc(r.title)}</a> <span class="muted small">— ${esc(r.why)}</span></li>`).join('')}</ul>` : '<p class="muted">Keep following your plan.</p>'}
        <h4>Recommended next action</h4><p>${recs[0] ? `<a class="btn" href="${recs[0].route}">${esc(recs[0].title)}</a>` : 'Continue with today’s plan.'}</p></div>`;
  };
})();
