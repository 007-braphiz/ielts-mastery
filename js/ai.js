/* Optional AI question generator (bring your own Claude API key).
   The browser calls the Anthropic Messages API directly with fetch. Nothing is sent unless you press Generate, and only the topic or
   level you choose is included: never your progress data. The API key is kept in its own LocalStorage entry, so it is NOT part of
   the exported backup file. Every generated item is validated in code and labelled as AI-generated and unverified. */
IM.ai = (function () {
  const U = IM.util;
  const KEY_NAME = 'ielts-mastery-ai-key';
  const ENDPOINT = 'https://api.anthropic.com/v1/messages';
  const MODELS = [
    ['claude-opus-5-5', 'Claude Opus 5.5: most capable (about $4 / $20 per million tokens)'],
    ['claude-sonnet-5-5', 'Claude Sonnet 5.5: cheaper (about $2 / $10 per million tokens)'],
    ['claude-haiku-5-5', 'Claude Haiku 5.5: cheapest (about $0.10 / $0.50 per million tokens)']
  ];
  const session = { requests: 0, inputTokens: 0, outputTokens: 0 };

  /* ---------------- key and settings ---------------- */
  function getKey() { try { return window.localStorage.getItem(KEY_NAME) || ''; } catch (e) { return ''; } }
  function setKey(k) { try { if (k) window.localStorage.setItem(KEY_NAME, k); else window.localStorage.removeItem(KEY_NAME); return true; } catch (e) { return false; } }
  const cfg = () => IM.store.state.settings.ai || { enabled: false, model: MODELS[0][0] };
  const isReady = () => !!(cfg().enabled && getKey());

  /* ---------------- API call ---------------- */
  function parseJsonText(text) {
    let t = String(text || '').trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a > 0 || (b >= 0 && b < t.length - 1)) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  function friendly(status, msg) {
    if (status === 401) return 'The API key was rejected. Check that you pasted the whole key and that it is active.';
    if (status === 403) return 'This key is not allowed to use that model or feature.';
    if (status === 404) return 'The selected model was not found for your account. Choose another model in Settings.';
    if (status === 429) return 'Rate limit or spending limit reached. Wait a moment and try again.';
    if (status === 529 || status >= 500) return 'The AI service is busy or unavailable. Try again shortly.';
    return 'The request was not accepted' + (msg ? ': ' + msg : '.');
  }

  async function send(body, key) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 180000);
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify(body)
      });
    } catch (e) {
      clearTimeout(timer);
      const err = new Error(e.name === 'AbortError' ? 'The request took too long and was cancelled.' : 'The AI service could not be reached. Check your internet connection, and that no browser extension or network rule blocks api.anthropic.com.');
      err.kind = 'network';
      throw err;
    }
    clearTimeout(timer);
    let json = null;
    try { json = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) {
      const m = json && json.error && json.error.message;
      const err = new Error(friendly(res.status, m));
      err.status = res.status; err.detail = m || '';
      throw err;
    }
    return json;
  }

  /* opts: {system, prompt, schema, maxTokens}. Returns {data, usage}. */
  async function call(opts) {
    const key = getKey();
    if (!key) throw new Error('No API key is saved. Add one in Settings.');
    const body = { model: cfg().model, max_tokens: opts.maxTokens || 16000, messages: [{ role: 'user', content: opts.prompt }] };
    if (opts.system) body.system = opts.system;
    if (opts.schema) body.output_config = { effort: 'medium', format: { type: 'json_schema', schema: opts.schema } };
    let json;
    try { json = await send(body, key); } catch (e) {
      // If the structured-output option is rejected, retry once with a plain JSON instruction.
      if (opts.schema && e.status === 400 && /output_config|format|schema|effort/i.test(e.detail || '')) {
        const b2 = { model: body.model, max_tokens: body.max_tokens, system: body.system, messages: [{ role: 'user', content: opts.prompt + '\n\nReturn ONLY one JSON object with no commentary, matching this JSON Schema:\n' + JSON.stringify(opts.schema) }] };
        json = await send(b2, key);
      } else throw e;
    }
    session.requests++;
    if (json.usage) { session.inputTokens += json.usage.input_tokens || 0; session.outputTokens += json.usage.output_tokens || 0; }
    if (json.stop_reason === 'refusal') throw new Error('The AI declined this request. Try a different topic.');
    if (json.stop_reason === 'max_tokens') throw new Error('The answer was cut off before it finished. Try again with a shorter request.');
    const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (!opts.schema) return { text, usage: json.usage || {} };
    let data;
    try { data = parseJsonText(text); } catch (e) { throw new Error('The AI reply could not be read as structured data. Please try again.'); }
    return { data, usage: json.usage || {} };
  }

  async function testConnection() {
    const r = await call({ prompt: 'Reply with the single word OK.', maxTokens: 50 });
    return r.text.trim();
  }

  /* ---------------- helpers ---------------- */
  const norm = s => String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const wordsOf = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const inText = (needle, hay) => { const n = norm(needle).replace(/[.,;:!?]+$/, ''); return n.length > 0 && norm(hay).includes(n); };
  const str = (x, max) => (typeof x === 'string' ? x.trim().slice(0, max || 600) : '');
  const arr = x => (Array.isArray(x) ? x : []);
  const strs = (x, n) => arr(x).map(v => str(v, 120)).filter(Boolean).slice(0, n || 8);

  /* ---------------- reading generator ---------------- */
  const READING_SCHEMA = {
    type: 'object', additionalProperties: false,
    required: ['title', 'paragraphs', 'tfng', 'mcq', 'completion'],
    properties: {
      title: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' } },
      tfng: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['statement', 'answer', 'evidence', 'explanation'], properties: { statement: { type: 'string' }, answer: { type: 'string', enum: ['TRUE', 'FALSE', 'NOT GIVEN'] }, evidence: { type: 'string' }, explanation: { type: 'string' } } } },
      mcq: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'options', 'answer', 'evidence', 'explanation'], properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] }, evidence: { type: 'string' }, explanation: { type: 'string' } } } },
      completion: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['before', 'after', 'answer', 'evidence', 'explanation'], properties: { before: { type: 'string' }, after: { type: 'string' }, answer: { type: 'string' }, evidence: { type: 'string' }, explanation: { type: 'string' } } } }
    }
  };

  const LEVELS = { easier: 'a little easier than a typical IELTS passage (clear sentences, common vocabulary)', typical: 'similar to a typical IELTS Reading passage', harder: 'at the harder end of IELTS Reading (dense ideas, academic vocabulary, longer sentences)' };

  function buildReadingPrompt(o) {
    const style = o.style === 'general' ? 'a General Training style text (everyday or workplace topic, practical tone)' : 'an Academic style text (a magazine or journal-style article)';
    return `Write an ORIGINAL IELTS-style reading practice set on the topic: "${o.topic}".
Text style: ${style}. Difficulty: ${LEVELS[o.level] || LEVELS.typical}.
Rules:
- British English spelling. 4 to 6 paragraphs, 350 to 450 words in total. Do not copy or imitate any published exam text.
- Do not present invented statistics or studies as established fact: use general knowledge, hedged statements, or clearly fictional named researchers.
- Write exactly 5 True/False/Not Given statements (at least one of each answer). For TRUE and FALSE, "evidence" must be an exact quotation copied from the passage (under 30 words); for NOT GIVEN leave "evidence" empty. The statement must be a paraphrase, not a copy, and NOT GIVEN statements must be on-topic but genuinely absent from the text.
- Write exactly 4 multiple-choice questions with 4 options each, one correct answer, and an exact quotation as evidence.
- Write exactly 4 sentence-completion items. "answer" is one or two words copied exactly from the passage; "before" and "after" are the sentence text around the blank (a paraphrase of the passage sentence). The answer must not appear in "before" or "after". "evidence" is the exact quotation.
- Each "explanation" is one sentence saying why the answer is right and, for wrong options or FALSE statements, what makes the alternative wrong.`;
  }

  function validateReading(d, o) {
    const paragraphs = arr(d.paragraphs).map(p => str(p, 3000)).filter(Boolean);
    if (paragraphs.length < 3) throw new Error('The AI passage was too short. Please try again.');
    const text = paragraphs.join(' ');
    const words = wordsOf(text);
    if (words < 200) throw new Error('The AI passage was too short (' + words + ' words). Please try again.');
    let dropped = 0;
    const tfng = [], mcq = [], comp = [];
    arr(d.tfng).forEach(x => {
      const ans = str(x.answer, 12).toUpperCase();
      if (!['TRUE', 'FALSE', 'NOT GIVEN'].includes(ans) || !str(x.statement)) { dropped++; return; }
      if (ans !== 'NOT GIVEN' && !inText(x.evidence, text)) { dropped++; return; }
      tfng.push({ q: str(x.statement), a: ans, ev: ans === 'NOT GIVEN' ? '' : str(x.evidence), why: str(x.explanation) });
    });
    arr(d.mcq).forEach(x => {
      const opts = strs(x.options, 4);
      const ans = str(x.answer, 2).toUpperCase();
      if (opts.length !== 4 || new Set(opts.map(norm)).size !== 4 || !'ABCD'.includes(ans) || ans === '' || !str(x.question) || !inText(x.evidence, text)) { dropped++; return; }
      mcq.push({ q: str(x.question), opts, a: ans, ev: str(x.evidence), why: str(x.explanation) });
    });
    arr(d.completion).forEach(x => {
      const ans = str(x.answer, 40), before = str(x.before, 200), after = str(x.after, 200);
      const re = new RegExp('(^|[^a-z0-9])' + ans.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
      if (!ans || wordsOf(ans) > 2 || !re.test(norm(text)) || re.test(norm(before + ' ' + after)) || !before) { dropped++; return; }
      comp.push({ before, after, a: ans, ev: str(x.evidence), why: str(x.explanation) });
    });
    const usable = tfng.length + mcq.length + comp.length;
    if (usable < 8) throw new Error('Too few questions passed the automatic checks (' + usable + '). Please generate again.');
    let n = 0;
    const groups = [];
    const ex = it => (it.why ? it.why + ' ' : '') + (it.ev ? 'Evidence: “' + it.ev + '”.' : 'The passage does not give this information.');
    if (tfng.length) {
      const first = n + 1;
      groups.push({ type: 'tfng', label: 'True / False / Not Given', range: [first, first + tfng.length - 1], options: [['TRUE', 'TRUE'], ['FALSE', 'FALSE'], ['NOT GIVEN', 'NOT GIVEN']], instruction: 'Do the following statements agree with the information in the passage?', items: tfng.map(t => ({ n: ++n, q: t.q, a: t.a, ex: ex(t) })) });
    }
    if (mcq.length) {
      const first = n + 1;
      groups.push({ type: 'mcq', label: 'Multiple choice', range: [first, first + mcq.length - 1], instruction: 'Choose the correct letter, A, B, C or D.', items: mcq.map(t => ({ n: ++n, q: t.q, opts: t.opts, a: t.a, ex: ex(t) })) });
    }
    if (comp.length) {
      const first = n + 1;
      const items = comp.map(t => ({ n: ++n, a: [t.a], ex: ex(t), before: t.before, after: t.after }));
      groups.push({ type: 'completion', label: 'Sentence completion', range: [first, first + comp.length - 1], instruction: 'Complete the sentences. Write NO MORE THAN TWO WORDS from the passage for each answer.', template: '<ul class="qlist">' + items.map(i => `<li>${i.n}&nbsp; ${U.esc(i.before)} [[${i.n}]] ${U.esc(i.after)}</li>`).join('') + '</ul>', items: items.map(i => ({ n: i.n, a: i.a, ex: i.ex })) });
    }
    return { id: 'ai-' + U.uid(), ts: Date.now(), date: U.today(), kind: 'reading', title: str(d.title, 120) || o.topic, topic: o.topic, level: o.level, style: o.style, paragraphs, words, groups, dropped, model: cfg().model };
  }

  async function generateReading(o) {
    const r = await call({ system: 'You are an experienced IELTS item writer. You write original, accurate practice material and follow the output schema exactly.', prompt: buildReadingPrompt(o), schema: READING_SCHEMA, maxTokens: 16000 });
    const set = validateReading(r.data, o);
    set.usage = r.usage;
    IM.store.update(s => { s.ai.sets.push(set); if (s.ai.sets.length > 8) s.ai.sets.shift(); });
    return set;
  }

  /* ---------------- vocabulary generator ---------------- */
  const VOCAB_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['words'],
    properties: { words: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['word', 'pos', 'ipa', 'respelling', 'definition', 'example', 'collocations', 'synonyms', 'antonyms', 'family', 'pattern', 'mistake', 'register', 'ielts'],
      properties: {
        word: { type: 'string' }, pos: { type: 'string' }, ipa: { type: 'string' }, respelling: { type: 'string' }, definition: { type: 'string' }, example: { type: 'string' },
        collocations: { type: 'array', items: { type: 'string' } }, synonyms: { type: 'array', items: { type: 'string' } }, antonyms: { type: 'array', items: { type: 'string' } },
        family: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['pos', 'word'], properties: { pos: { type: 'string', enum: ['n', 'v', 'adj', 'adv'] }, word: { type: 'string' } } } },
        pattern: { type: 'string' }, mistake: { type: 'string' }, register: { type: 'string' }, ielts: { type: 'string' }
      } } } }
  };

  function buildVocabPrompt(o, existing) {
    const lv = IM.data.scoring.vocabLevels.find(l => l.n === o.level);
    return `Create ${o.count} vocabulary entries for an IELTS learner.
Internal level ${o.level} (${lv.name}: ${lv.blurb}). Topic: ${o.category}.
Rules:
- British English spelling and a British English IPA transcription (between slashes) plus a simple respelling such as "im-POR-tunt".
- Choose useful, natural words for this level and topic. Do NOT use any of these words: ${existing.slice(0, 150).join(', ')}.
- "word" is a single word in its base form. "example" is one natural sentence that contains the headword EXACTLY as written in "word" (no inflections).
- "definition": a short, clear learner definition. "collocations": 3 to 5 natural collocations. "synonyms" and "antonyms" may be empty arrays. "family": related forms with pos n, v, adj or adv.
- "pattern": a typical grammatical pattern. "mistake": a typical learner mistake. "register": formality. "ielts": how it helps in IELTS Writing or Speaking.`;
  }

  function validateVocab(d, o, existingSet) {
    const out = [];
    let dropped = 0;
    const cats = IM.data.vocabulary.categories;
    arr(d.words).forEach(x => {
      const word = str(x.word, 40).toLowerCase();
      if (!/^[a-z][a-z-]{1,30}$/.test(word) || existingSet.has(word)) { dropped++; return; }
      const example = str(x.example, 300), definition = str(x.definition, 300);
      if (!new RegExp('(^|[^a-z])' + word, 'i').test(example) || wordsOf(definition) < 3 || wordsOf(example) < 5) { dropped++; return; }
      const collocations = strs(x.collocations, 6);
      if (collocations.length < 2) { dropped++; return; }
      existingSet.add(word);
      out.push({
        id: 'ai-' + word, level: o.level, word, pos: str(x.pos, 20) || 'n', ipa: str(x.ipa, 60), respelling: str(x.respelling, 60), definition, example, collocations,
        synonyms: strs(x.synonyms, 6), antonyms: strs(x.antonyms, 6),
        family: arr(x.family).map(f => ({ pos: str(f.pos, 5), word: str(f.word, 40) })).filter(f => f.word && ['n', 'v', 'adj', 'adv'].includes(f.pos)).slice(0, 6),
        pattern: str(x.pattern, 160) || '—', mistake: str(x.mistake, 200) || '—', register: str(x.register, 40) || 'neutral', ielts: str(x.ielts, 200) || '—',
        category: cats.includes(o.category) ? o.category : 'Everyday', ai: true
      });
    });
    if (!out.length) throw new Error('None of the generated words passed the automatic checks. Please try again.');
    return { entries: out, dropped };
  }

  async function generateVocab(o) {
    const existing = IM.data.vocabulary.entries.map(e => e.word.toLowerCase());
    const r = await call({ system: 'You are an expert English-language teacher and lexicographer writing accurate vocabulary entries for IELTS learners.', prompt: buildVocabPrompt(o, existing), schema: VOCAB_SCHEMA, maxTokens: 8000 });
    const v = validateVocab(r.data, o, new Set(existing));
    IM.store.update(s => { v.entries.forEach(e => s.ai.vocab.push(e)); if (s.ai.vocab.length > 300) s.ai.vocab.splice(0, s.ai.vocab.length - 300); });
    mergeVocab();
    return v;
  }

  function mergeVocab() {
    const list = IM.store.state.ai.vocab || [];
    const all = IM.data.vocabulary.entries;
    list.forEach(e => { if (!all.some(x => x.id === e.id)) all.push(e); });
  }
  function removeVocab(id) {
    IM.store.update(s => { s.ai.vocab = s.ai.vocab.filter(e => e.id !== id); delete s.srs['vocab:' + id]; });
    const all = IM.data.vocabulary.entries, i = all.findIndex(x => x.id === id);
    if (i >= 0) all.splice(i, 1);
  }

  return { MODELS, session, getKey, setKey, cfg, isReady, call, testConnection, generateReading, generateVocab, mergeVocab, removeVocab, validateReading, validateVocab, parseJsonText, buildReadingPrompt, buildVocabPrompt };
})();
