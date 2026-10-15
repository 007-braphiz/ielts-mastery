/* Onboarding, settings and data management views. */
(function () {
  const U = IM.util, esc = U.esc;
  const DIFFS = ['Listening: spelling and numbers', 'Listening: keeping up with fast speakers', 'Reading: speed and time management', 'Reading: True / False / Not Given', 'Writing: grammar accuracy', 'Writing: developing ideas', 'Speaking: fluency', 'Speaking: pronunciation', 'Vocabulary range', 'Spelling'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function bandOptions(selected, allowBlank) {
    let h = allowBlank ? '<option value="">—</option>' : '';
    for (let b = 5; b <= 9; b += 0.5) h += `<option value="${b}" ${Number(selected) === b ? 'selected' : ''}>${b.toFixed(1)}</option>`;
    return h;
  }

  function accentOptions(sel) {
    const list = [['en-GB', 'British English (preferred)'], ['en-AU', 'Australian English'], ['en-IE', 'Irish English'], ['en-US', 'American English'], ['en-CA', 'Canadian English'], ['en-IN', 'Indian English'], ['en-ZA', 'South African English'], ['en-NZ', 'New Zealand English']];
    return list.map(a => `<option value="${a[0]}" ${sel === a[0] ? 'selected' : ''}>${a[1]}</option>`).join('');
  }

  function settingsForm(s, onboarding) {
    return `
      <div class="formrow"><label class="field">IELTS test type</label>
        <div class="checks"><label><input type="radio" name="testType" value="academic" ${s.testType === 'academic' ? 'checked' : ''}> Academic</label>
        <label><input type="radio" name="testType" value="general" ${s.testType === 'general' ? 'checked' : ''}> General Training</label></div>
        <p class="small muted">Reading and Writing Task 1 differ between the two versions. Listening and Speaking are the same.</p></div>
      <div class="formrow"><label class="field">Target bands</label>
        <div class="grid c3">
          ${['overall', 'listening', 'reading', 'writing', 'speaking'].map(k => `<div><label class="small" for="t-${k}">${k[0].toUpperCase() + k.slice(1)}</label><select id="t-${k}">${bandOptions(s.targets[k])}</select></div>`).join('')}
        </div>
        <p class="small muted">The default target is overall Band 8.0. Targets are goals, not predictions.</p></div>
      <div class="grid c2">
        <div class="formrow"><label class="field" for="daily">Daily study time (minutes)</label><input id="daily" type="number" min="10" max="480" step="5" value="${s.dailyMinutes}"></div>
        <div class="formrow"><label class="field" for="exam">Examination date <span class="muted">(optional)</span></label><input id="exam" type="date" value="${esc(s.examDate || '')}"></div>
      </div>
      <div class="formrow"><label class="field">Study days</label><div class="checks">${DAYS.map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${s.studyDays.includes(i) ? 'checked' : ''}> ${d}</label>`).join('')}</div></div>
      <div class="formrow"><label class="field" for="accent">Preferred English accent for audio</label><select id="accent">${accentOptions(s.accent)}</select>
        <p class="small muted">Voices come from your browser and operating system. If your preferred accent is not installed, the closest English voice is used.</p></div>
      <div class="formrow"><label class="field">Current areas of difficulty <span class="muted">(optional)</span></label><div class="checks">${DIFFS.map((d, i) => `<label><input type="checkbox" name="diff" value="${esc(d)}" ${s.difficulties.includes(d) ? 'checked' : ''}> ${esc(d)}</label>`).join('')}</div></div>`;
  }

  function readForm(root) {
    const g = id => U.$('#' + id, root);
    const tgt = {};
    ['overall', 'listening', 'reading', 'writing', 'speaking'].forEach(k => { tgt[k] = Number(g('t-' + k).value) || 8; });
    const days = U.$$('input[name=days]:checked', root).map(x => Number(x.value));
    return {
      testType: (U.$('input[name=testType]:checked', root) || {}).value || 'academic',
      targets: tgt,
      dailyMinutes: U.clamp(Number(g('daily').value) || 45, 10, 480),
      examDate: g('exam').value || '',
      studyDays: days.length ? days : [1, 2, 3, 4, 5],
      accent: g('accent').value || 'en-GB',
      difficulties: U.$$('input[name=diff]:checked', root).map(x => x.value)
    };
  }

  IM.views.onboarding = function (root) {
    const s = IM.store.state.settings;
    root.innerHTML = `
      <div class="hero"><h1>Welcome to IELTS Band 8 Mastery</h1>
      <p>A private practice space: exam simulations, audio-first dictation, vocabulary mastery, and Writing and Speaking coaches. Set your goals below. Every question is optional and you can change everything later in Settings.</p></div>
      <div class="card"><h2>Your goals</h2>${settingsForm(s, true)}
        <div class="row"><button class="btn" data-act="save">Save and continue</button><button class="btn ghost" data-act="skip">Skip setup for now</button></div></div>
      <div class="note info">Your learning data stays in this browser only. Nothing is sent to a server. Estimated scores are practice estimates, not official IELTS results.</div>`;
    root.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'save') {
        const v = readForm(root);
        IM.store.update(st => { Object.assign(st.settings, v); st.settings.onboarded = true; });
        showDiagnosticChoice(root);
      } else if (a.dataset.act === 'skip') {
        IM.store.update(st => { st.settings.onboarded = true; });
        location.hash = '#/dashboard';
      } else if (a.dataset.act === 'diag') location.hash = '#/diagnostic';
      else if (a.dataset.act === 'later') {
        IM.store.update(st => { st.diagnostic.skipped = true; });
        location.hash = '#/dashboard';
      }
    });
  };

  function showDiagnosticChoice(root) {
    root.innerHTML = `
      <div class="card"><h1>Settings saved</h1>
      <p>Would you like to take a short diagnostic assessment now? It takes about 10–15 minutes and sets a baseline in grammar, vocabulary, spelling (by listening), reading and listening. You do not need to know your current level.</p>
      <p class="small muted">If you skip it, every learning module still works. Progress estimates simply stay marked as unavailable until enough assessment data exists.</p>
      <div class="row"><button class="btn" data-act="diag">Start the diagnostic</button><button class="btn ghost" data-act="later">Skip for now</button></div></div>`;
  }

  /* ---------------------------------------------------------------- settings page */
  IM.views.settings = function (root) {
    const st = IM.store.state;
    const s = st.settings;
    const feat = (ok, name, extra) => `<tr><td>${name}</td><td>${ok ? '<span class="badge good">Available</span>' : '<span class="badge warn">Not available</span>'}</td><td class="small muted">${extra}</td></tr>`;
    const voices = IM.audio.englishVoices();
    root.innerHTML = `
      <h1>Settings and data management</h1>
      <div class="card"><h2>Your goals and preferences</h2>${settingsForm(s)}
        <div class="row"><button class="btn" data-act="save">Save settings</button></div></div>

      <div class="card"><h2>Voice and appearance</h2>
        <div class="grid c2">
          <div class="formrow"><label class="field" for="voice">Voice</label><select id="voice"><option value="">Automatic (best match for your accent)</option>${voices.map(v => `<option value="${esc(v.voiceURI)}" ${s.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select>
            <p class="small muted" id="voicecount">${voices.length ? voices.length + ' English voice(s) found.' : IM.audio.hasSpeech ? 'No English voices reported yet. They may still be loading.' : 'Speech playback is not supported in this browser.'}</p></div>
          <div class="formrow"><label class="field" for="theme">Theme</label><select id="theme"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Match my device</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
        </div>
        <div class="row"><button class="btn secondary" data-act="testvoice">▶ Test the voice</button><span class="small muted">Synthetic voices differ by browser and device; they are practice audio, not official IELTS recordings.</span></div>
      </div>

      <div class="card"><h2>AI question generator (optional)</h2>
        <p>Lets the app create new Reading sets and vocabulary entries with Claude. It is <b>off</b> unless you enable it and add your own API key.</p>
        <div class="grid c2"><div class="formrow"><label class="field" for="aikey">Claude API key</label><input id="aikey" type="password" autocomplete="off" placeholder="${IM.ai.getKey() ? 'A key is saved (paste a new one to replace it)' : 'sk-ant-…'}"></div>
        <div class="formrow"><label class="field" for="aimodel">Model</label><select id="aimodel">${IM.ai.MODELS.map(m => `<option value="${m[0]}" ${(s.ai || {}).model === m[0] ? 'selected' : ''}>${esc(m[1])}</option>`).join('')}</select></div></div>
        <div class="checks"><label><input type="checkbox" id="aion" ${(s.ai || {}).enabled ? 'checked' : ''}> Enable the AI question generator</label></div>
        <div class="row"><button class="btn" data-act="aisave">Save AI settings</button><button class="btn secondary" data-act="aitest">Test connection</button><button class="btn ghost" data-act="aiclear">Remove saved key</button></div><div id="aimsg" class="small" aria-live="polite" style="margin-top:8px"></div>
        <details><summary>Privacy, cost and safety</summary><ul class="small"><li>Your browser sends requests <b>directly</b> to api.anthropic.com. Only the topic or level you type is included, never your progress data.</li><li>The key is stored in this browser’s LocalStorage under its own entry, so it is <b>not</b> included in the exported backup. Anyone who can use this browser profile can read it, so do not enable this on a shared computer.</li><li>Each Generate click is one billed request. In your Anthropic console, set a low monthly spend limit for this key.</li><li>Generated items are checked by simple rules but are not verified by a person. They never change your estimated bands.</li></ul></details></div>

      <div class="card"><h2>Browser features</h2>
        <div class="table-wrap"><table class="t"><thead><tr><th>Feature</th><th>Status</th><th>Used for</th></tr></thead><tbody>
          ${feat(IM.audio.hasSpeech, 'Speech synthesis', 'Dictation, Listening practice audio, examiner voice, pronunciation models')}
          ${feat(IM.audio.recognition.supported, 'Speech recognition', 'Optional speech-to-text in Speaking and shadowing (typed answers are the fallback)')}
          ${feat(IM.audio.recorder.supported, 'Audio recording', 'Optional recording and playback in Speaking (needs microphone permission)')}
          ${feat(IM.store.storageOk, 'LocalStorage', 'Saving all progress in this browser')}
        </tbody></table></div>
        <p class="small muted">Speech and recording features work best over HTTPS (for example on Netlify) in current Chrome, Edge or Safari. Firefox supports speech synthesis but not speech recognition.</p>
      </div>

      <div class="card"><h2>Your data</h2>
        <p>Progress is saved in this browser’s LocalStorage. It belongs to this browser profile and does <b>not</b> synchronise to other devices. Clearing site data or using private browsing can delete it, so export a backup regularly.</p>
        <div class="row"><button class="btn secondary" data-act="export">⬇ Export data (JSON)</button>
          <label class="btn secondary" for="importfile" style="cursor:pointer">⬆ Import data…</label><input id="importfile" type="file" accept="application/json,.json" style="position:absolute;left:-9999px">
        </div>
        <div id="importmsg" aria-live="polite"></div>
        <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
        <h3>Reset everything</h3>
        <p class="small">This permanently deletes all progress, history and settings from this browser. Type <b>RESET</b> to confirm.</p>
        <div class="row"><input id="resetword" type="text" placeholder="Type RESET" style="max-width:200px" aria-label="Type RESET to confirm"><button class="btn danger" data-act="reset">Delete all data</button></div>
      </div>`;

    const refreshVoices = () => { /* voices may arrive late */ };
    root.addEventListener('click', e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'save') {
        const v = readForm(root);
        const voice = U.$('#voice', root), theme = U.$('#theme', root);
        IM.store.update(x => { Object.assign(x.settings, v); x.settings.voiceURI = voice.value; x.settings.theme = theme.value; });
        IM.applyTheme();
        U.toast('Settings saved.', 'good');
      } else if (act === 'aisave') {
        const k = U.$('#aikey', root).value.trim();
        if (k && !/^sk-ant-[A-Za-z0-9_\-]{20,}$/.test(k)) { U.$('#aimsg', root).innerHTML = '<span style="color:var(--bad)">That does not look like a Claude API key (it should start with sk-ant-).</span>'; return; }
        if (k) IM.ai.setKey(k);
        IM.store.update(x => { x.settings.ai = { enabled: U.$('#aion', root).checked, model: U.$('#aimodel', root).value }; });
        U.$('#aikey', root).value = '';
        U.$('#aimsg', root).innerHTML = '<span style="color:var(--good)">Saved.' + (IM.ai.getKey() ? '' : ' Add a key to use the generator.') + '</span>';
      } else if (act === 'aitest') {
        const msg = U.$('#aimsg', root);
        if (!IM.ai.getKey()) { msg.innerHTML = '<span style="color:var(--bad)">Save a key first.</span>'; return; }
        IM.store.update(x => { x.settings.ai = { enabled: U.$('#aion', root).checked, model: U.$('#aimodel', root).value }; });
        msg.textContent = 'Testing…';
        IM.ai.testConnection().then(t => { msg.innerHTML = '<span style="color:var(--good)">Connected. The model replied: ' + esc(t.slice(0, 40)) + '</span>'; }).catch(er => { msg.innerHTML = '<span style="color:var(--bad)">' + esc(er.message) + '</span>'; });
      } else if (act === 'aiclear') {
        IM.ai.setKey('');
        IM.store.update(x => { x.settings.ai.enabled = false; });
        U.$('#aion', root).checked = false;
        U.$('#aimsg', root).innerHTML = '<span style="color:var(--good)">The saved key was removed and the generator was switched off.</span>';
      } else if (act === 'testvoice') {
        const sel = U.$('#voice', root).value, acc = U.$('#accent', root).value;
        if (!IM.audio.hasSpeech) { U.toast('Speech playback is not available in this browser.', 'warn'); return; }
        IM.audio.speak('This is a test of the practice voice. The weather will be fine on Wednesday.', { accent: acc, voiceURI: sel, rate: 1 }).catch(() => U.toast('The voice could not be played.', 'warn'));
      } else if (act === 'export') {
        const blob = new Blob([IM.store.exportJSON()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'ielts-mastery-backup-' + U.today() + '.json';
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        U.toast('Backup downloaded.', 'good');
      } else if (act === 'reset') {
        const w = U.$('#resetword', root).value.trim();
        if (w !== 'RESET') { U.toast('Type RESET exactly to confirm.', 'warn'); return; }
        IM.store.reset();
        IM.ai.setKey('');
        U.toast('All data deleted.', 'good');
        location.hash = '#/onboarding';
        IM.route();
      }
    });
    U.$('#importfile', root).addEventListener('change', ev => {
      const f = ev.target.files[0];
      const msg = U.$('#importmsg', root);
      if (!f) return;
      if (f.size > 8 * 1024 * 1024) { msg.innerHTML = '<p class="note">That file is too large to be a valid backup.</p>'; return; }
      const rd = new FileReader();
      rd.onload = () => {
        const chk = IM.store.checkImport(String(rd.result));
        if (!chk.ok) { msg.innerHTML = `<div class="note"><b>Import rejected.</b> Nothing was changed.<ul>${chk.errors.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`; return; }
        const sm = chk.summary;
        if (window.confirm(`Replace your current data with this backup?\n\nIt contains ${sm.activities} activities, ${sm.mocks} mock results, ${sm.srsItems} revision items, ${sm.dictationAttempts} dictation attempts, ${sm.writing} writing responses and ${sm.speaking} speaking sessions.\n\nYour current data will be overwritten.`)) {
          const r = IM.store.importJSON(String(rd.result));
          if (r.ok) { IM.applyTheme(); U.toast('Backup imported.', 'good'); IM.route(); } else msg.innerHTML = `<div class="note">${r.errors.map(esc).join('<br>')}</div>`;
        } else msg.innerHTML = '<p class="note info">Import cancelled. Nothing was changed.</p>';
      };
      rd.onerror = () => { msg.innerHTML = '<p class="note">The file could not be read.</p>'; };
      rd.readAsText(f);
      ev.target.value = '';
    });
    IM.onVoices = () => { const sel = U.$('#voice', root); if (sel && sel.options.length <= 1) IM.route(); };
    return () => { IM.onVoices = null; };
  };
})();
