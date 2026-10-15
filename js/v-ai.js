/* AI Question Generator view: Reading sets and vocabulary entries generated on demand with your own Claude API key (optional). */
(function () {
  const U = IM.util, esc = U.esc;
  const S = () => IM.store.state;

  IM.views.ai = function (root, params) {
    let tab = params.tab || 'reading';
    let set = null, graded = null, busy = false;

    const notReady = () => `<div class="card"><h2>Set up the AI generator first</h2><p>This feature is optional and off by default. It needs your own Claude API key, which is stored only in this browser.</p>
      <ol><li>Open <a href="#/settings">Settings → AI question generator</a>.</li><li>Paste your API key, choose a model and switch the generator on.</li><li>Press “Test connection”, then come back here.</li></ol>
      <p class="small muted">Everything else in the app works without it.</p></div>`;

    function header() {
      const u = IM.ai.session;
      return `<h1>AI Question Generator</h1><p class="note">AI-generated material is checked by simple rules (for example, quoted evidence must appear in the passage), but it is <b>not verified by a person</b>. It can still contain mistakes, so treat the answer keys and pronunciation guides with care. It is practice material, not official IELTS content, and it never changes your estimated band.</p>
        <div class="tabs">${[['reading', 'Reading set'], ['vocab', 'Vocabulary'], ['saved', 'Saved']].map(t => `<button class="tab ${tab === t[0] ? 'active' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
        ${u.requests ? `<p class="small muted">This session: ${u.requests} request(s), ${u.inputTokens} input and ${u.outputTokens} output tokens used.</p>` : ''}`;
    }

    function readingForm() {
      return `<div class="card"><h2>Generate a reading practice set</h2>
        <div class="formrow"><label class="field" for="topic">Topic</label><input id="topic" type="text" maxlength="120" placeholder="For example: urban beekeeping, remote work, coral reefs"></div>
        <div class="grid c2"><div><label class="field" for="lvl">Difficulty</label><select id="lvl"><option value="easier">Easier than IELTS</option><option value="typical" selected>Typical IELTS</option><option value="harder">Harder than IELTS</option></select></div>
        <div><label class="field" for="style">Text style</label><select id="style"><option value="academic" ${S().settings.testType === 'academic' ? 'selected' : ''}>Academic article</option><option value="general" ${S().settings.testType === 'general' ? 'selected' : ''}>General Training (everyday / workplace)</option></select></div></div>
        <p class="small muted">One request is made per click (a passage and about 13 questions). Cost depends on the model you chose in Settings (${esc(IM.ai.cfg().model)}).</p>
        <button class="btn" data-act="genreading" ${busy ? 'disabled' : ''}>✨ Generate</button> <span id="status" class="small muted" aria-live="polite"></span></div>`;
    }

    function setHtml(s, withResults) {
      const ctx = withResults ? { answers: graded.answers, locked: true, results: graded.map, showExplain: true } : { answers: {} };
      return `<div class="card soft"><div class="row space"><b>${esc(s.title)}</b><span>${IM.ui.badge('AI-generated, unverified', 'warn')} ${IM.ui.badge(s.words + ' words')}</span></div>
        ${s.dropped ? `<p class="small muted">${s.dropped} question(s) were removed automatically because they failed the checks.</p>` : ''}</div>
        <div class="split"><div class="pane"><h2>${esc(s.title)}</h2><div class="passage">${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div></div>
        <div class="pane" id="qarea">${s.groups.map(g => IM.qengine.renderGroup(g, ctx)).join('')}</div></div>
        ${withResults ? '' : '<div class="row" style="margin-top:12px"><button class="btn" data-act="submit">Submit answers</button></div>'}`;
    }

    function resultsHtml() {
      const m = graded.m;
      const bt = Object.entries(m.byType).map(([k, v]) => ({ label: k, pct: U.pct(v.c, v.t), n: v.t }));
      return `<div class="card"><div class="grid c3">${IM.ui.stat('Score', m.raw + ' / ' + m.max, 'from this set’s answer key')}${IM.ui.stat('Accuracy', U.pct(m.raw, m.max) + '%')}${IM.ui.stat('Counts toward band?', 'No', 'AI sets are practice only')}</div>${IM.charts.hbars(bt)}
        <p class="small muted">If you disagree with an answer after reading the evidence, the key may be wrong: AI output is not verified.</p>
        <div class="row"><button class="btn" data-tab="reading">Generate another</button></div></div>`;
    }

    async function genReading() {
      const topic = U.$('#topic', root).value.trim();
      if (topic.length < 3) { U.toast('Enter a topic of at least a few letters.', 'warn'); return; }
      busy = true; U.$('[data-act=genreading]', root).disabled = true;
      U.$('#status', root).textContent = 'Writing your passage and questions… this can take up to a minute.';
      try {
        set = await IM.ai.generateReading({ topic, level: U.$('#lvl', root).value, style: U.$('#style', root).value });
        graded = null; busy = false; draw();
      } catch (e) {
        busy = false; U.$('#status', root).textContent = ''; U.$('[data-act=genreading]', root).disabled = false;
        root.querySelector('.card').insertAdjacentHTML('afterend', `<div class="note" role="alert"><b>Could not generate.</b> ${esc(e.message)}</div>`);
      }
    }

    function submit() {
      const answers = IM.qengine.collect(U.$('#qarea', root));
      const m = IM.qengine.markTest(set.groups, answers);
      const map = {}; m.items.forEach(x => { map[x.n] = { correct: x.correct, expected: x.expected, given: x.given }; });
      graded = { answers, m, map };
      IM.analytics.recordArea('Reading comprehension', m.raw, m.max);
      IM.store.logActivity('reading', 'ai-reading', `${m.raw}/${m.max} (AI set)`, m.raw, m.max, 15);
      draw();
    }

    /* ---------------- vocabulary ---------------- */
    function vocabForm(result) {
      const lvls = IM.data.scoring.vocabLevels, cats = IM.data.vocabulary.categories;
      return `<div class="card"><h2>Generate new vocabulary entries</h2>
        <div class="grid c3"><div><label class="field" for="vl">Level</label><select id="vl">${lvls.map(l => `<option value="${l.n}">Level ${l.n}: ${esc(l.name)}</option>`).join('')}</select></div>
        <div><label class="field" for="vc">Topic</label><select id="vc">${cats.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div><label class="field" for="vn">How many</label><select id="vn">${[3, 5, 8].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
        <p class="small muted">New words are added to your Vocabulary Mastery library (marked “AI”) and join spaced repetition. Check the pronunciation guide in a dictionary: AI can get IPA wrong.</p>
        <button class="btn" data-act="genvocab" ${busy ? 'disabled' : ''}>✨ Generate</button> <span id="status" class="small muted" aria-live="polite"></span></div>
        ${result ? `<div class="note good">${result.entries.length} word(s) added${result.dropped ? `; ${result.dropped} removed by the automatic checks` : ''}. <a href="#/vocab">Practise them in Vocabulary Mastery</a>.</div>${result.entries.map(e => `<div class="card"><h3>${esc(e.word)} <span class="muted small">${esc(e.pos)}</span> ${IM.ui.badge('AI', 'warn')}</h3><p><b>${esc(e.ipa)}</b> · <i>${esc(e.respelling)}</i></p><p>${esc(e.definition)}</p><p><i>${esc(e.example)}</i></p><p class="small muted">${e.collocations.map(esc).join(' · ')}</p></div>`).join('')}` : ''}`;
    }
    async function genVocab() {
      busy = true; U.$('[data-act=genvocab]', root).disabled = true;
      U.$('#status', root).textContent = 'Creating entries…';
      try {
        const res = await IM.ai.generateVocab({ level: Number(U.$('#vl', root).value), category: U.$('#vc', root).value, count: Number(U.$('#vn', root).value) });
        busy = false; tab = 'vocab'; root.innerHTML = header() + vocabForm(res);
      } catch (e) {
        busy = false; U.$('#status', root).textContent = ''; U.$('[data-act=genvocab]', root).disabled = false;
        root.querySelector('.card').insertAdjacentHTML('afterend', `<div class="note" role="alert"><b>Could not generate.</b> ${esc(e.message)}</div>`);
      }
    }

    function savedHtml() {
      const sets = S().ai.sets, words = S().ai.vocab;
      return `<div class="card"><h2>Saved reading sets (latest 8)</h2>${sets.length ? sets.slice().reverse().map(s => `<div class="rec"><div><p><b>${esc(s.title)}</b></p><p class="why">${U.fmtDate(s.date)} · ${s.words} words · ${s.groups.reduce((n, g) => n + g.items.length, 0)} questions · ${esc(s.model)}</p></div><button class="btn small secondary" data-open="${s.id}">Take again</button></div>`).join('') : IM.ui.empty('No saved sets yet.')}</div>
        <div class="card"><h2>AI vocabulary in your library (${words.length})</h2>${words.length ? words.slice().reverse().map(e => `<div class="rec"><div><p><b>${esc(e.word)}</b> <span class="muted small">level ${e.level} · ${esc(e.category)}</span></p><p class="why">${esc(e.definition)}</p></div><button class="btn small ghost" data-del="${esc(e.id)}">Remove</button></div>`).join('') : IM.ui.empty('No AI-generated words yet.')}</div>`;
    }

    function draw() {
      if (!IM.ai.isReady()) { root.innerHTML = `<h1>AI Question Generator</h1>${notReady()}`; return; }
      let body;
      if (tab === 'reading') body = set ? (graded ? resultsHtml() + setHtml(set, true) : setHtml(set, false)) : readingForm();
      else if (tab === 'vocab') body = vocabForm(null);
      else body = savedHtml();
      root.innerHTML = header() + body;
    }

    root.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; if (tab === 'reading') { set = null; graded = null; } draw(); return; }
      const op = e.target.closest('[data-open]'); if (op) { set = S().ai.sets.find(s => s.id === op.dataset.open); graded = null; tab = 'reading'; draw(); return; }
      const dl = e.target.closest('[data-del]'); if (dl) { if (window.confirm('Remove this word and its review history?')) { IM.ai.removeVocab(dl.dataset.del); draw(); } return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'genreading') genReading();
      if (a.dataset.act === 'genvocab') genVocab();
      if (a.dataset.act === 'submit') submit();
    });
    draw();
  };
})();
