/* Diagnostic assessment: a short baseline across grammar, vocabulary, spelling (by listening), reading and listening.
   Results are percentages from very few questions: they set starting levels and a baseline, not an IELTS band. */
(function () {
  const U = IM.util, esc = U.esc;

  IM.views.diagnostic = function (root) {
    const S = () => IM.store.state;
    const G = IM.data.grammar.lessons;
    const gramIds = ['parts-of-speech', 'tenses', 'sva', 'articles', 'prepositions', 'conditionals', 'relative-clauses', 'punctuation'];
    const gramQs = gramIds.map(id => G.find(l => l.id === id)).map(l => Object.assign({ area: l.area }, l.questions[3]));
    const vocabPick = [1, 2, 3, 3, 4, 4, 5, 6].map((lv, i, arr) => {
      const list = IM.data.vocabulary.entries.filter(e => e.level === lv);
      const used = arr.slice(0, i).filter(x => x === lv).length;
      return IM.tutor.vocabQuestion(list[(used * 5 + 2) % list.length], 'meaning');
    });
    const spellItems = ['A02', 'A09', 'A11', 'A18', 'A21'].map(id => IM.data.dictation.items.find(i => i.id === id));
    const rd = IM.data.reading.diagnostic, ld = IM.data.listening.diagnostic;
    const stages = ['intro', 'grammar', 'vocab', 'spelling', 'reading', 'listening', 'results'];
    let st = 0, qi = 0, spellPlays = 0, lisPlays = 0, saved = false;
    const R = { grammar: [], vocab: [], spelling: [], reading: null, listening: null };

    function bar() { return `<div class="progress-steps">${stages.map((s, i) => `<span class="${i <= st ? 'on' : ''}"></span>`).join('')}</div>`; }
    function hdr(t) { return `<h1>Diagnostic assessment</h1>${bar()}<p class="muted small">${t}</p>`; }

    function mcq(q, name) {
      const opts = q.opts || q.options;
      return `<div class="card"><p style="font-size:1.08rem">${q.q ? esc(q.q) : q.prompt}</p>${opts.map((o, k) => `<button class="optbtn" data-pick="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}</div>`;
    }

    function draw() {
      const stage = stages[st];
      if (stage === 'intro') {
        root.innerHTML = hdr('About 10–15 minutes') + `<div class="card"><h2>Let’s find your starting point</h2><p>Five short parts: grammar, vocabulary, spelling by listening, a short reading passage and a short listening clip. You do not need to know your level. If you do not know an answer, make your best guess or move on.</p>
          <ul><li>Speakers are needed for parts 3 and 5 (headphones recommended).</li><li>Results set your starting levels and a baseline. They are not an IELTS band.</li></ul>
          <div class="row"><button class="btn" data-act="begin">Begin</button><button class="btn ghost" data-act="skip">Skip the diagnostic</button></div></div>`;
      } else if (stage === 'grammar') {
        const q = gramQs[qi];
        root.innerHTML = hdr(`Part 1 of 5: Grammar, question ${qi + 1} of ${gramQs.length}`) + mcq(q);
      } else if (stage === 'vocab') {
        const q = vocabPick[qi];
        root.innerHTML = hdr(`Part 2 of 5: Vocabulary, question ${qi + 1} of ${vocabPick.length}`) + mcq(q);
      } else if (stage === 'spelling') {
        const it = spellItems[qi];
        root.innerHTML = hdr(`Part 3 of 5: Spelling by listening, word ${qi + 1} of ${spellItems.length}`) + `<div class="card"><p>Listen to the word and the sentence, then type the word. You can play it up to 3 times.</p>
          <div class="audio-ctl"><button class="btn" data-act="spell-play">▶ Play</button><span class="small muted" id="plays">Plays: ${spellPlays}/3</span></div>
          <div class="formrow" style="margin-top:12px"><label class="field" for="ans">Type the word</label><input id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
          <div class="row"><button class="btn" data-act="spell-next">${qi + 1 < spellItems.length ? 'Next word' : 'Next part'}</button></div>${IM.audio.hasSpeech ? '' : '<p class="note">Speech playback is unavailable in this browser, so this part cannot be played. You can skip it by pressing the button.</p>'}</div>`;
        if (spellPlays === 0 && IM.audio.hasSpeech) setTimeout(() => playSpell(), 250);
      } else if (stage === 'reading') {
        root.innerHTML = hdr('Part 4 of 5: Reading') + `<div class="card passage">${rd.paragraphs.map(p => `<p>${esc(p.t)}</p>`).join('')}</div><div class="card" id="qs">${rd.groups.map(g => IM.qengine.renderGroup(g, {})).join('')}</div><button class="btn" data-act="reading-done">Next part</button>`;
      } else if (stage === 'listening') {
        root.innerHTML = hdr('Part 5 of 5: Listening') + `<div class="card"><p>You will hear a short announcement. You can play it up to 2 times, then answer. The audio is synthetic text-to-speech practice audio.</p>
          <div class="audio-ctl"><button class="btn" data-act="lis-play">▶ Play</button><span class="small muted" id="plays">Plays: ${lisPlays}/2</span></div></div>
          <div class="card" id="qs">${ld.groups.map(g => IM.qengine.renderGroup(g, {})).join('')}</div><button class="btn" data-act="listening-done">See my results</button>`;
      } else {
        results();
      }
    }

    function playSpell() {
      const it = spellItems[qi];
      if (spellPlays >= 3) { U.toast('You have used all 3 plays for this word.', 'warn'); return; }
      spellPlays++;
      const p = U.$('#plays', root); if (p) p.textContent = `Plays: ${spellPlays}/3`;
      const s = S().settings;
      IM.audio.speak(it.say, { accent: s.accent, voiceURI: s.voiceURI, rate: 0.85, pause: 0 }).catch(() => U.toast('The voice could not be played.', 'warn'));
    }
    function playListening() {
      if (lisPlays >= 2) { U.toast('You have used both plays.', 'warn'); return; }
      lisPlays++;
      const p = U.$('#plays', root); if (p) p.textContent = `Plays: ${lisPlays}/2`;
      const s = S().settings;
      IM.audio.speakQueue(ld.transcript.map(t => ({ text: t.text, pitch: t.sp === 'N' ? 0.9 : 1.05, pause: 400 })), { accent: s.accent, voiceURI: s.voiceURI, rate: 0.95 }).catch(() => U.toast('The voice could not be played.', 'warn'));
    }

    function results() {
      const all = {
        Grammar: R.grammar.filter(Boolean).length / gramQs.length, Vocabulary: R.vocab.filter(Boolean).length / vocabPick.length, Spelling: R.spelling.filter(Boolean).length / spellItems.length,
        'Reading comprehension': R.reading.raw / R.reading.max, 'Listening comprehension': R.listening.raw / R.listening.max
      };
      let maxLevel = 1;
      R.vocab.forEach((ok, i) => { if (ok) maxLevel = Math.max(maxLevel, [1, 2, 3, 3, 4, 4, 5, 6][i]); });
      const spellScore = R.spelling.filter(Boolean).length;
      if (!saved) {
        saved = true;
        IM.analytics.recordArea('Grammar', R.grammar.filter(Boolean).length, gramQs.length);
        IM.analytics.recordArea('Vocabulary', R.vocab.filter(Boolean).length, vocabPick.length);
        IM.analytics.recordArea('Spelling', spellScore, spellItems.length);
        IM.analytics.recordArea('Reading comprehension', R.reading.raw, R.reading.max);
        IM.analytics.recordArea('Listening comprehension', R.listening.raw, R.listening.max);
        IM.store.update(s => {
          s.diagnostic.done = true; s.diagnostic.skipped = false; s.diagnostic.takenAt = U.today();
          s.diagnostic.results = { grammar: { c: R.grammar.filter(Boolean).length, t: gramQs.length }, vocabulary: { c: R.vocab.filter(Boolean).length, t: vocabPick.length, maxLevel }, spelling: { c: spellScore, t: spellItems.length }, reading: { c: R.reading.raw, t: R.reading.max }, listening: { c: R.listening.raw, t: R.listening.max } };
          s.diagnostic.baseline.areas = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, Math.round(v * 100)]));
          s.vocab.preferredLevel = maxLevel;
          s.dictation.level = U.clamp(spellScore, 1, 5);
        });
        IM.store.logActivity('diagnostic', 'diagnostic', 'Diagnostic completed', null, null, 12);
      }
      const rows = Object.entries(all).map(([k, v]) => `<tr><td>${k}</td><td>${IM.ui.bar(Math.round(v * 100), k, v >= 0.8 ? 'good' : v >= 0.5 ? '' : 'warn')}</td><td>${Math.round(v * 100)}%</td></tr>`).join('');
      const weakest = Object.entries(all).sort((a, b) => a[1] - b[1])[0][0];
      root.innerHTML = `<h1>Your baseline</h1>${bar()}<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Area</th><th>Result</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="note">These percentages come from very few questions (5–8 per area), so treat them as a rough starting point. They are <b>not</b> IELTS bands. Skill band estimates will appear after you complete mock tests, Writing and Speaking practice.</p>
        <h3>What this sets up</h3><ul><li>Vocabulary practice starts at <b>Level ${maxLevel}</b>.</li><li>Dictation starts at <b>Level ${U.clamp(spellScore, 1, 5)}</b>.</li><li>Your study plan will emphasise <b>${esc(weakest.toLowerCase())}</b> first.</li></ul>
        <div class="row"><a class="btn" href="#/dashboard">Go to the dashboard</a><a class="btn secondary" href="#/plan">See my study plan</a></div></div>`;
    }

    root.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      const pk = e.target.closest('[data-pick]');
      if (pk) {
        const k = Number(pk.dataset.pick);
        if (stages[st] === 'grammar') { R.grammar.push(k === gramQs[qi].a); qi++; if (qi >= gramQs.length) { st++; qi = 0; } draw(); }
        else if (stages[st] === 'vocab') { R.vocab.push(k === vocabPick[qi].answerIndex); qi++; if (qi >= vocabPick.length) { st++; qi = 0; } draw(); }
        return;
      }
      if (!a) return;
      switch (a.dataset.act) {
        case 'begin': st = 1; draw(); break;
        case 'skip': IM.store.update(s => { s.diagnostic.skipped = true; }); U.toast('Diagnostic skipped. You can take it later.'); location.hash = '#/dashboard'; break;
        case 'spell-play': playSpell(); break;
        case 'spell-next': {
          const v = (U.$('#ans', root).value || '').trim();
          const res = IM.diff.compare(spellItems[qi].text, v);
          R.spelling.push(res.perfect);
          IM.audio.stop(); spellPlays = 0; qi++;
          if (qi >= spellItems.length) { st++; qi = 0; }
          draw(); break;
        }
        case 'reading-done': {
          const answers = IM.qengine.collect(U.$('#qs', root));
          const m = IM.qengine.markTest(rd.groups, answers);
          R.reading = { raw: m.raw, max: m.max }; st++; draw(); break;
        }
        case 'lis-play': playListening(); break;
        case 'listening-done': {
          const answers = IM.qengine.collect(U.$('#qs', root));
          const m = IM.qengine.markTest(ld.groups, answers);
          R.listening = { raw: m.raw, max: m.max }; IM.audio.stop(); st++; draw(); break;
        }
      }
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ans') { e.preventDefault(); const b = U.$('[data-act=spell-next]', root); if (b) b.click(); } });
    draw();
    return () => IM.audio.stop();
  };
})();
