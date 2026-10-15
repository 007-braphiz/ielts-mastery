/* Audio engine: text-to-speech with the browser's SpeechSynthesis, bundled audio files, speech recognition and recording.
   Voices differ by browser and operating system; nothing here promises identical pronunciation across devices. */
IM.audio = (function () {
  const synth = window.speechSynthesis || null;
  const hasSpeech = !!(synth && window.SpeechSynthesisUtterance);
  let voices = [];
  let token = 0;            // incremented on every stop/start to cancel stale callbacks
  let playing = false;
  let keep = [];            // strong references to utterances (avoids a Chrome garbage-collection bug)
  let fileAudio = null;
  let stateListeners = [];
  let voicesReady = null;
  let paused = false;

  function loadVoices() {
    if (!hasSpeech) return [];
    voices = synth.getVoices() || [];
    return voices;
  }
  if (hasSpeech) {
    loadVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  function ready() {
    if (!hasSpeech) return Promise.resolve([]);
    if (voices.length) return Promise.resolve(voices);
    if (!voicesReady) {
      voicesReady = new Promise(res => {
        let tries = 0;
        const t = setInterval(() => { loadVoices(); tries++; if (voices.length || tries > 15) { clearInterval(t); res(voices); } }, 120);
      });
    }
    return voicesReady;
  }

  function englishVoices() { return voices.filter(v => /^en([-_]|$)/i.test(v.lang)); }

  function pickVoice(accent, uri) {
    if (!hasSpeech) return null;
    if (!voices.length) loadVoices();
    if (uri) { const v = voices.find(x => x.voiceURI === uri); if (v) return v; }
    const en = englishVoices();
    const want = (accent || 'en-GB').toLowerCase().replace('_', '-');
    const exact = en.filter(v => v.lang.toLowerCase().replace('_', '-') === want);
    const preferred = exact.find(v => /natural|online|google|daniel|serena|kate|libby|sonia|ryan|hazel|susan|george/i.test(v.name)) || exact[0];
    if (preferred) return preferred;
    const gb = en.filter(v => /en[-_]gb/i.test(v.lang));
    if (gb.length) return gb[0];
    return en[0] || voices.find(v => v.default) || null;
  }

  function setPlaying(p) { playing = p; stateListeners.forEach(fn => { try { fn(p); } catch (e) { /* ignore */ } }); }
  function onState(fn) { stateListeners.push(fn); return () => { stateListeners = stateListeners.filter(x => x !== fn); }; }

  function pause() { paused = true; if (hasSpeech) { try { synth.pause(); } catch (e) { /* ignore */ } } if (fileAudio) { try { fileAudio.pause(); } catch (e) { /* ignore */ } } }
  function resume() { paused = false; if (hasSpeech) { try { synth.resume(); } catch (e) { /* ignore */ } } if (fileAudio) { try { fileAudio.play(); } catch (e) { /* ignore */ } } }

  function stop() {
    paused = false;
    token++;
    keep = [];
    if (hasSpeech) { try { synth.cancel(); } catch (e) { /* ignore */ } }
    if (fileAudio) { try { fileAudio.pause(); fileAudio.removeAttribute('src'); fileAudio.load(); } catch (e) { /* ignore */ } fileAudio = null; }
    setPlaying(false);
  }

  /* Split a long passage into manageable speech segments (sentence-based, with a length cap). */
  function chunk(text, maxLen) {
    maxLen = maxLen || 180;
    const parts = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:])\s+/);
    const out = [];
    parts.forEach(p => {
      if (p.length <= maxLen) { out.push(p); return; }
      const bits = p.split(/(?<=,)\s+/);
      let cur = '';
      bits.forEach(b => {
        if ((cur + ' ' + b).trim().length > maxLen && cur) { out.push(cur.trim()); cur = b; } else cur = (cur + ' ' + b).trim();
      });
      if (cur) out.push(cur);
    });
    return out.filter(Boolean);
  }

  function speakOne(text, o, myToken) {
    return new Promise((resolve, reject) => {
      if (myToken !== token) { resolve('cancelled'); return; }
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(o.accent, o.voiceURI);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = o.accent || 'en-GB';
      u.rate = IM.util.clamp(o.rate || 1, 0.4, 1.6);
      u.pitch = IM.util.clamp(o.pitch || 1, 0.5, 1.6);
      u.volume = 1;
      let done = false;
      const finish = (r, err) => { if (done) return; done = true; clearInterval(watch); if (err) reject(err); else resolve(r); };
      u.onend = () => finish('ended');
      u.onerror = e => { if (e && (e.error === 'interrupted' || e.error === 'canceled')) finish('cancelled'); else finish(null, new Error((e && e.error) || 'speech-error')); };
      keep.push(u);
      // Safety net: if a browser never fires `end`, continue after an estimated time.
      const est = Math.max(2500, (text.length / 12) * 1000 / (u.rate || 1) + 2500);
      const started = Date.now();
      let wait = 0;
      const watch = setInterval(() => { if (myToken !== token) { finish('cancelled'); } else if (paused) { wait += 500; } else if (Date.now() - started - wait > est * 3) finish('ended'); }, 500);
      try { synth.speak(u); } catch (e) { finish(null, e); }
    });
  }

  /* items: array of strings or {text, pitch, rate, pause}. Resolves with 'ended' or 'cancelled'. */
  async function speakQueue(items, o) {
    o = o || {};
    if (!hasSpeech) throw new Error('unsupported');
    stop();
    const myToken = token;
    await new Promise(r => setTimeout(r, 70));   // let cancel() settle (avoids dropped utterances)
    if (myToken !== token) return 'cancelled';
    setPlaying(true);
    const norm = items.map(it => (typeof it === 'string' ? { text: it } : it));
    try {
      for (let i = 0; i < norm.length; i++) {
        if (myToken !== token) return 'cancelled';
        const it = norm[i];
        if (o.onItem) o.onItem(i, it);
        const pieces = chunk(it.text);
        for (let k = 0; k < pieces.length; k++) {
          if (myToken !== token) return 'cancelled';
          const r = await speakOne(pieces[k], { accent: o.accent, voiceURI: o.voiceURI, rate: it.rate || o.rate, pitch: it.pitch || o.pitch }, myToken);
          if (r === 'cancelled') return 'cancelled';
          const gap = k < pieces.length - 1 ? (o.pieceGap || 250) : (it.pause != null ? it.pause : (o.pause || 0));
          if (gap) await new Promise(r2 => setTimeout(r2, gap));
        }
      }
      if (myToken === token) { setPlaying(false); if (o.onEnd) o.onEnd(); }
      return 'ended';
    } catch (e) {
      if (myToken === token) setPlaying(false);
      throw e;
    }
  }

  function speak(text, o) { return speakQueue([text], o); }

  /* Plays a bundled audio file; falls back to text-to-speech if the file cannot be loaded. */
  function playFile(path, fallbackItems, o) {
    o = o || {};
    stop();
    const myToken = token;
    return new Promise(resolve => {
      const a = new Audio();
      fileAudio = a;
      a.preload = 'auto';
      a.playbackRate = IM.util.clamp(o.rate || 1, 0.5, 1.5);
      a.onended = () => { if (myToken === token) { setPlaying(false); if (o.onEnd) o.onEnd(); } resolve('ended'); };
      a.onerror = () => {
        fileAudio = null;
        if (myToken !== token) { resolve('cancelled'); return; }
        if (fallbackItems && hasSpeech) speakQueue(fallbackItems, o).then(resolve, () => resolve('error'));
        else { setPlaying(false); resolve('error'); }
      };
      a.src = path;
      setPlaying(true);
      a.play().catch(() => a.onerror());
    });
  }

  /* ---------------- speech recognition ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const recognition = {
    supported: !!SR,
    start(o) {
      if (!SR) throw new Error('unsupported');
      const r = new SR();
      r.lang = (o && o.lang) || 'en-GB';
      r.continuous = true;
      r.interimResults = true;
      let finalText = '';
      r.onresult = e => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
        }
        if (o && o.onText) o.onText(finalText.trim(), interim.trim());
      };
      r.onerror = e => { if (o && o.onError) o.onError(e.error || 'error'); };
      r.onend = () => { if (o && o.onEnd) o.onEnd(finalText.trim()); };
      r.start();
      return { stop() { try { r.stop(); } catch (e) { /* ignore */ } }, abort() { try { r.abort(); } catch (e) { /* ignore */ } }, get text() { return finalText.trim(); } };
    }
  };

  /* ---------------- recording ---------------- */
  const recorder = {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    async start() {
      if (!this.supported) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); }; });
      rec.start();
      return { stop() { try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { /* ignore */ } return done; } };
    }
  };

  return {
    hasSpeech, ready, voices: () => voices, englishVoices, pickVoice, speak, speakQueue, stop, pause, resume, chunk, playFile, onState,
    isPlaying: () => playing, recognition, recorder,
    unsupportedMessage: 'Speech playback is not available in this browser. Try a current version of Chrome, Edge or Safari over HTTPS. You can still read transcripts after each exercise, but the audio-first exercises need speech support.'
  };
})();
