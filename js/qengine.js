/* Question engine shared by the Listening and Reading simulators: renders question groups and marks answers deterministically
   against the answer key. Marking is never based on plausibility. */
IM.qengine = (function () {
  const esc = s => IM.util.esc(s);

  function normAnswer(s) {
    return String(s == null ? '' : s).trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '');
  }
  function stripOrdinal(s) { return s.replace(/(\d)(st|nd|rd|th)\b/g, '$1'); }
  function squashNumber(s) { return stripOrdinal(s).replace(/[\s\-]/g, ''); }
  function isNumeric(s) { return /^[£$€]?[\d][\d.,\s]*$/.test(s); }

  /* Returns {correct, expected, given}. */
  function markItem(group, item, given) {
    const type = group.type;
    const g = normAnswer(given);
    if (type === 'completion') {
      const accepted = Array.isArray(item.a) ? item.a : [item.a];
      let correct = false;
      if (g) {
        correct = accepted.some(a => {
          const na = normAnswer(a);
          if (na === g) return true;
          if (/\d/.test(na)) {
            let gg = squashNumber(g);
            if (isNumeric(na) || /^[£$€]/.test(na)) gg = gg.replace(/^[£$€]/, '').replace(/(pounds?|dollars?|euros?|percent|per cent|%)$/, '');
            const nn = squashNumber(na).replace(/^[£$€]/, '');
            return gg === nn || squashNumber(g) === squashNumber(na);
          }
          return false;
        });
      }
      return { correct, expected: accepted[0], accepted, given: given || '' };
    }
    const exp = String(item.a).toLowerCase();
    return { correct: !!g && g === exp, expected: item.a, given: given || '' };
  }

  function allItems(groups) { const r = []; groups.forEach(g => g.items.forEach(i => r.push({ g, i }))); return r; }

  function markTest(groups, answers) {
    const items = [];
    const byType = {};
    let raw = 0;
    allItems(groups).forEach(({ g, i }) => {
      const m = markItem(g, i, answers[i.n]);
      if (m.correct) raw++;
      items.push({ n: i.n, label: g.label, type: g.type, correct: m.correct, given: m.given, expected: m.expected, ex: i.ex });
      const b = byType[g.label] || (byType[g.label] = { c: 0, t: 0 });
      b.t++; if (m.correct) b.c++;
    });
    items.sort((a, b) => a.n - b.n);
    return { raw, max: items.length, items, byType };
  }

  /* ---------- rendering ---------- */
  function inputFor(n, ctx, extraClass) {
    const v = ctx.answers && ctx.answers[n] != null ? ctx.answers[n] : '';
    let cls = 'blank ' + (extraClass || '');
    let after = '';
    if (ctx.results && ctx.results[n]) {
      const r = ctx.results[n];
      cls += r.correct ? ' ok' : ' bad';
      if (!r.correct) after = `<span class="expected">✔ ${esc(r.expected)}</span>`;
    }
    return `<input type="text" id="q-${n}" class="${cls}" data-q="${n}" value="${esc(v)}" aria-label="Answer for question ${n}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${ctx.locked ? 'disabled' : ''}><span class="qn">${n}</span>${after}`;
  }

  function resultNote(n, ctx, item) {
    if (!ctx.results || !ctx.results[n] || !ctx.showExplain) return '';
    const r = ctx.results[n];
    return `<div class="explain ${r.correct ? 'good' : 'wrong'}"><b>${r.correct ? '✔ Correct' : '✘ Incorrect'}</b> — Q${n}: ${r.correct ? '' : `answer <b>${esc(String(r.expected))}</b>. `}${esc(item.ex || '')}</div>`;
  }

  function renderGroup(group, ctx) {
    ctx = ctx || {};
    const range = group.range ? `Questions ${group.range[0]}–${group.range[1]}` : '';
    let html = `<section class="qgroup" data-type="${esc(group.type)}"><h4>${range ? esc(range) + ' · ' : ''}${esc(group.label)}</h4><p class="instr">${esc(group.instruction || '')}</p>`;
    if (group.figure) html += `<div class="figure">${group.figure}</div>`;
    if (group.type === 'completion') {
      html += '<div class="completion">' + group.template.replace(/\[\[(\d+)\]\]/g, (m, n) => inputFor(Number(n), ctx)) + '</div>';
      if (ctx.showExplain && ctx.results) html += group.items.map(i => resultNote(i.n, ctx, i)).join('');
    } else if (group.type === 'mcq') {
      group.items.forEach(i => {
        const cur = (ctx.answers && ctx.answers[i.n]) || '';
        const res = ctx.results && ctx.results[i.n];
        html += `<fieldset class="mcq" id="q-${i.n}"><legend><span class="qn">${i.n}</span> ${esc(i.q)}</legend>` +
          i.opts.map((o, k) => {
            const L = 'ABCDEFG'[k];
            let cls = '';
            if (res) { if (L === String(i.a)) cls = 'right'; else if (L === String(cur).toUpperCase()) cls = 'wrong'; }
            return `<label class="opt ${cls}"><input type="radio" name="q${i.n}" data-q="${i.n}" value="${L}" ${String(cur).toUpperCase() === L ? 'checked' : ''} ${ctx.locked ? 'disabled' : ''}><span><b>${L}</b> ${esc(o)}</span></label>`;
          }).join('') + resultNote(i.n, ctx, i) + '</fieldset>';
      });
    } else {
      // matching / true-false style: a select per question, with the option list shown above for long labels
      const opts = group.options || [];
      const longOpts = opts.some(o => o[1] !== o[0]);
      if (longOpts) html += '<ul class="optlist">' + opts.map(o => `<li><b>${esc(o[0])}</b> ${esc(o[1])}</li>`).join('') + '</ul>';
      group.items.forEach(i => {
        const cur = (ctx.answers && ctx.answers[i.n]) || '';
        const res = ctx.results && ctx.results[i.n];
        html += `<div class="matchrow ${res ? (res.correct ? 'ok' : 'bad') : ''}" id="q-${i.n}"><span class="qn">${i.n}</span><span class="qtext">${esc(i.q)}</span>` +
          `<select data-q="${i.n}" aria-label="Answer for question ${i.n}" ${ctx.locked ? 'disabled' : ''}><option value="">Choose…</option>` +
          opts.map(o => `<option value="${esc(o[0])}" ${String(cur) === o[0] ? 'selected' : ''}>${esc(group.type === 'tfng' || group.type === 'ynng' ? o[1] : (longOpts ? o[0] : o[1]))}</option>`).join('') + '</select>' +
          (res && !res.correct ? `<span class="expected">✔ ${esc(String(res.expected))}</span>` : '') + '</div>' + resultNote(i.n, ctx, i);
      });
    }
    return html + '</section>';
  }

  /* Read the answers from a container element. */
  function collect(root) {
    const out = {};
    IM.util.$$('[data-q]', root).forEach(el => {
      const n = el.getAttribute('data-q');
      if (el.type === 'radio') { if (el.checked) out[n] = el.value; }
      else if (el.value !== '') out[n] = el.value;
    });
    return out;
  }

  function answeredCount(answers, total) { let c = 0; for (let n = 1; n <= total; n++) if (answers[n] != null && String(answers[n]).trim() !== '') c++; return c; }

  return { normAnswer, markItem, markTest, renderGroup, collect, answeredCount, allItems };
})();
