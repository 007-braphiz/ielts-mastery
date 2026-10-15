/* Rule-based tutor. Everything here is deterministic pattern matching and counting.
   It is NOT a generative AI model and cannot judge meaning, argument quality or pronunciation. */
IM.tutor = (function () {
  const U = IM.util;
  const G = () => IM.data.grammar;
  const W = () => IM.data.writing;

  /* ------------------------------------------------------------------ text analysis */
  function mask(text) {
    return text.replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|approx|No|St)\./gi, m => m.slice(0, -1) + '\u0001');
  }
  function sentenceAround(text, start, end) {
    let a = start, b = end;
    while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
    while (b < text.length && !/[.!?\n]/.test(text[b])) b++;
    if (b < text.length) b++;
    return { text: text.slice(a, b).trim(), start: a, end: b };
  }

  function analyse(text, opts) {
    opts = opts || {};
    const src = mask(String(text || ''));
    const issues = [];
    const taken = [];
    const overlaps = (s, e) => taken.some(t => s < t[1] && e > t[0]);

    G().errorRules.forEach(rule => {
      if (opts.speech && !rule.speech) return;
      const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
      let m;
      while ((m = re.exec(src))) {
        if (m[0] === '') { re.lastIndex++; continue; }
        const s = m.index, e = m.index + m[0].length;
        if (overlaps(s, e)) continue;
        taken.push([s, e]);
        let fixed = '';
        try { fixed = rule.fix ? rule.fix(m) : ''; } catch (err) { fixed = ''; }
        const sent = sentenceAround(src, s, e);
        const corrected = fixed ? (src.slice(sent.start, s) + fixed + src.slice(e, sent.end)).trim().replace(/\u0001/g, '.') : '';
        issues.push({ ruleId: rule.id, cat: rule.cat, lesson: rule.lesson, confidence: rule.confidence, match: text.slice(s, e), start: s, end: e, msg: rule.msg, principle: rule.principle, fix: fixed, sentence: text.slice(sent.start, sent.end).trim(), corrected });
      }
    });

    if (!opts.speech) {
      // spelling check against the common-misspelling table
      const wre = /[A-Za-z']+/g;
      let m;
      while ((m = wre.exec(src))) {
        const w = m[0].toLowerCase();
        const good = G().misspellings[w];
        if (good && !overlaps(m.index, m.index + w.length)) {
          const sent = sentenceAround(src, m.index, m.index + w.length);
          issues.push({ ruleId: 'spell:' + w, cat: 'Spelling', lesson: 'common-errors', confidence: 'sure', match: m[0], start: m.index, end: m.index + w.length, msg: `“${m[0]}” is misspelled. The correct spelling is “${good}”.`, principle: G().principles['Spelling'], fix: good, sentence: text.slice(sent.start, sent.end).trim(), corrected: (src.slice(sent.start, m.index) + good + src.slice(m.index + w.length, sent.end)).trim() });
        }
      }
    }

    const register = [];
    if (!opts.speech) {
      G().registerRules.forEach(rule => {
        const re = new RegExp(rule.re.source, 'gi');
        let m;
        while ((m = re.exec(src))) register.push({ ruleId: rule.id, match: m[0], start: m.index, msg: rule.msg });
      });
    }

    // very long sentences (possible run-ons)
    U.sentences(text).forEach(s => {
      if (U.countWords(s) > 45) {
        const idx = text.indexOf(s.slice(0, 30));
        issues.push({ ruleId: 'long-sentence', cat: 'Run-on / comma splice', lesson: 'run-ons-fragments', confidence: 'possible', match: s.slice(0, 40) + '…', start: idx, end: idx + s.length, msg: 'This sentence is very long (' + U.countWords(s) + ' words). Check that it is not a run-on, or split it into two sentences.', principle: G().principles['Run-on / comma splice'], fix: '', sentence: s, corrected: '' });
      }
    });

    issues.sort((a, b) => a.start - b.start);
    return { issues, register, sure: issues.filter(i => i.confidence === 'sure').length, possible: issues.filter(i => i.confidence !== 'sure').length };
  }

  /* ------------------------------------------------------------------ statistics */
  const SUBORD = /\b(although|because|while|whereas|which|who|whom|whose|that|if|when|since|unless|despite|even though|so that|as long as|where)\b/i;
  const STOP = () => new Set(W().lex.stop);

  function words(text) { return (String(text || '').toLowerCase().replace(/[’]/g, "'").match(/[a-z][a-z'\-]*/g)) || []; }

  function stats(text) {
    const lex = W().lex;
    const ws = words(text);
    const sents = U.sentences(text);
    const paras = String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const stop = STOP();
    const content = ws.filter(w => !stop.has(w) && w.length > 2);
    const uniq = new Set(content);
    const freq = {};
    content.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const repeated = Object.keys(freq).filter(w => freq[w] >= 4).sort((a, b) => freq[b] - freq[a]).map(w => ({ w, n: freq[w] }));
    const low = String(text || '').toLowerCase();
    const countPhrase = p => (low.match(new RegExp('(^|[^a-z])' + p.replace(/\./g, '\\.') + '(?![a-z])', 'g')) || []).length;
    const linkerCounts = {};
    lex.linkers.forEach(l => { const c = countPhrase(l); if (c) linkerCounts[l] = c; });
    const startsWithLinker = sents.filter(s => lex.linkers.some(l => s.toLowerCase().startsWith(l + ' ') || s.toLowerCase().startsWith(l + ','))).length;
    const starts = {};
    sents.forEach(s => { const f = (s.toLowerCase().match(/[a-z']+/) || [''])[0]; starts[f] = (starts[f] || 0) + 1; });
    const maxStart = Math.max(0, ...Object.values(starts));
    const academicHits = Array.from(new Set(content.filter(w => lex.academic.some(a => w === a || w.startsWith(a)))));
    const complex = sents.filter(s => SUBORD.test(s)).length;
    return {
      words: U.countWords(text), sentences: sents.length, paragraphs: paras.length,
      avgSentence: sents.length ? Math.round(ws.length / sents.length) : 0,
      ttr: content.length ? uniq.size / content.length : 0, contentWords: content.length, uniqueContent: uniq.size,
      repeated, linkerCounts, distinctLinkers: Object.keys(linkerCounts).length,
      overusedLinkers: Object.keys(linkerCounts).filter(l => lex.overusedLinkers.includes(l) && linkerCounts[l] >= 3),
      startsWithLinker, sentenceStartRepeat: sents.length ? maxStart / sents.length : 0, mostCommonStart: Object.keys(starts).sort((a, b) => starts[b] - starts[a])[0] || '',
      academicHits, complexRatio: sents.length ? complex / sents.length : 0, countPhrase,
      hasAny: list => list.some(p => countPhrase(p) > 0)
    };
  }

  /* ------------------------------------------------------------------ Writing estimate */
  function roundHalf(x) { return Math.round(x * 2) / 2; }
  const clampBand = (x, lo, hi) => roundHalf(U.clamp(x, lo, hi));

  function estimateWriting(text, task, extras) {
    extras = extras || {};
    const lex = W().lex;
    const st = stats(text);
    const an = analyse(text);
    const min = task.task === 1 ? 150 : 250;
    const wc = st.words;
    const ev = { ta: [], cc: [], lr: [], gra: [] };
    const strengths = [], weaknesses = [];

    /* ----- Task achievement / response ----- */
    let ta = 5.5, taCap = 7.5;
    if (wc < min * 0.5) { taCap = 3.5; ev.ta.push(`Only ${wc} words (minimum ${min}): the response is far too short to cover the task.`); }
    else if (wc < min * 0.75) { taCap = 4.5; ev.ta.push(`${wc} words is well under the ${min}-word minimum.`); }
    else if (wc < min) { taCap = 5.5; ev.ta.push(`${wc} words is below the ${min}-word minimum.`); }
    else ev.ta.push(`Length ${wc} words meets the ${min}-word minimum.`);
    const parasN = st.paragraphs;
    if (task.task === 2) {
      const pos = st.hasAny(lex.position), ex = st.hasAny(lex.examples), concl = st.hasAny(lex.conclusion);
      if (pos) { ta += 0.5; strengths.push('A clear position or plan is signalled.'); } else { ta -= 0.5; weaknesses.push('No clear position signalled (try “I believe…”, “This essay will…”).'); }
      if (ex) { ta += 0.5; strengths.push('Examples are used to support ideas.'); } else { ta -= 0.25; weaknesses.push('No examples found (e.g. “for example”, “for instance”).'); }
      if (concl) ta += 0.25; else { ta -= 0.25; weaknesses.push('No conclusion marker found.'); }
      const kw = task.keywords || [];
      const low = text.toLowerCase();
      const hits = kw.filter(k => low.includes(k)).length;
      const cov = kw.length ? hits / kw.length : 1;
      ev.ta.push(`Topic words from the prompt used: ${hits} of ${kw.length}.`);
      if (cov < 0.4) { ta -= 1; weaknesses.push('Few words from the question appear: the response may be off topic.'); } else if (cov >= 0.7) ta += 0.25;
      (task.parts || []).forEach(p => {
        const ok = p.kw.some(k => low.includes(k));
        ev.ta.push(`Part “${p.text}”: ${ok ? 'addressed' : 'not clearly addressed'}.`);
        if (!ok) { ta -= 0.75; weaknesses.push(`The part of the question about “${p.text}” is not clearly answered.`); }
      });
    } else if (task.test === 'academic') {
      const ov = st.hasAny(lex.overview);
      if (ov) { ta += 0.75; strengths.push('An overview is signalled.'); } else { ta -= 1; weaknesses.push('No overview found: add a sentence beginning “Overall,…”.'); }
      const kf = task.keyFigures || [];
      const low = text.toLowerCase();
      const hits = kf.filter(k => low.includes(String(k).toLowerCase())).length;
      const cov = kf.length ? hits / kf.length : 1;
      ev.ta.push(`Key data points or features mentioned: ${hits} of ${kf.length}.`);
      if (cov >= 0.5) { ta += 0.5; strengths.push('Key data points are selected and reported.'); } else if (cov < 0.25) { ta -= 1; weaknesses.push('Few key figures or features are reported.'); }
      if (st.paragraphs < 3) { ta -= 0.25; weaknesses.push('Use separate paragraphs for the introduction, overview and details.'); }
    } else {
      const low = text.toLowerCase();
      let covered = 0;
      (task.bullets || []).forEach(b => { const ok = b.kw.some(k => low.includes(k)); if (ok) covered++; ev.ta.push(`Bullet “${b.text}”: ${ok ? 'covered' : 'not clearly covered'}.`); if (!ok) weaknesses.push(`The bullet point “${b.text}” is not clearly covered.`); });
      const total = (task.bullets || []).length || 1;
      if (covered === total) { ta += 0.75; strengths.push('All three bullet points are covered.'); } else ta -= (total - covered) * 0.75;
      const opening = low.includes(task.opening), closing = low.includes(task.closing);
      ev.ta.push(`Salutation ${opening ? 'matches' : 'does not match'} the expected register; sign-off ${closing ? 'matches' : 'does not match'}.`);
      if (opening && closing) ta += 0.25; else { ta -= 0.5; weaknesses.push(`Check the greeting and sign-off for a ${task.register} letter (expected “${task.opening}” … “${task.closing}”).`); }
      const contractions = an.register.filter(r => r.ruleId === 'contraction').length;
      if (task.register === 'formal' && (contractions || an.register.some(r => ['kids', 'alot-of', 'gonna', 'stuff', 'guys'].includes(r.ruleId)))) { ta -= 0.5; weaknesses.push('Informal language in a formal letter (contractions or slang).'); }
      if (task.register === 'informal' && /dear sir|yours faithfully|i am writing to/.test(low)) { ta -= 0.5; weaknesses.push('The tone is too formal for a letter to a friend.'); }
    }
    if (extras.checklist) {
      const miss = Object.values(extras.checklist).filter(v => v === false).length;
      if (miss) { ta -= 0.5 * miss; weaknesses.push('Your own checklist shows ' + miss + ' content weakness(es).'); ev.ta.push('Self-check: ' + miss + ' item(s) you marked as not satisfied.'); }
    }
    ta = clampBand(Math.min(ta, taCap), 3.5, 7.5);

    /* ----- Coherence and cohesion ----- */
    let cc = 5.5, ccCap = 7.5;
    ev.cc.push(`${parasN} paragraph(s), ${st.sentences} sentence(s), ${st.distinctLinkers} different linking expression(s).`);
    if (parasN <= 1) { ccCap = 5; weaknesses.push('The response is one block of text: use clear paragraphs.'); }
    else if (parasN >= (task.task === 2 ? 4 : 3)) { cc += 0.5; strengths.push('Paragraphing is clear.'); }
    if (st.distinctLinkers >= 8) { cc += 1; strengths.push('A good range of linking expressions is used.'); } else if (st.distinctLinkers >= 5) cc += 0.5; else if (st.distinctLinkers <= 2) { cc -= 0.5; weaknesses.push('Very few linking expressions.'); }
    if (st.overusedLinkers.length) { cc -= 0.5; weaknesses.push('Some linkers are overused: ' + st.overusedLinkers.join(', ') + '.'); ev.cc.push('Overused linkers: ' + st.overusedLinkers.join(', ') + '.'); }
    if (st.sentences >= 4 && st.startsWithLinker / st.sentences > 0.4) { cc -= 0.5; weaknesses.push('Too many sentences begin with a linking word; this sounds mechanical.'); }
    if (st.sentences >= 5 && st.sentenceStartRepeat > 0.4) { cc -= 0.5; weaknesses.push(`Many sentences begin with “${st.mostCommonStart}”: vary your sentence openings.`); ev.cc.push('Repeated sentence openings.'); }
    if (st.countPhrase('this') + st.countPhrase('these') + st.countPhrase('such') >= 2) cc += 0.25;
    if (an.issues.some(i => i.ruleId === 'comma-splice-linker')) { cc -= 0.25; ev.cc.push('Possible comma splice before a linking adverb.'); }
    cc = clampBand(Math.min(cc, ccCap), 3.5, 7.5);

    /* ----- Lexical resource ----- */
    let lr = 5.5;
    const spelling = an.issues.filter(i => i.cat === 'Spelling').length;
    const colloc = an.issues.filter(i => ['Collocations', 'Confused words', 'Prepositions', 'Uncountable nouns'].includes(i.cat)).length;
    const informal = an.register.filter(r => r.ruleId !== 'contraction').length;
    const accurate = spelling + colloc <= 2;
    ev.lr.push(`Type–token ratio of content words ${st.ttr.toFixed(2)} (${st.uniqueContent} different of ${st.contentWords}).`);
    if (st.contentWords >= 40) { if (st.ttr >= 0.62) { lr += 0.5; strengths.push('Good lexical variety.'); } else if (st.ttr < 0.45) { lr -= 0.5; weaknesses.push('Vocabulary is repetitive.'); } }
    ev.lr.push(`Academic or topic vocabulary found: ${st.academicHits.length}${st.academicHits.length ? ' (' + st.academicHits.slice(0, 6).join(', ') + ')' : ''}.`);
    const acadReward = st.academicHits.length >= 8 ? 1 : st.academicHits.length >= 4 ? 0.5 : 0;
    if (acadReward) {
      if (accurate) { lr += acadReward; strengths.push('Academic vocabulary is used accurately.'); }
      else { lr += acadReward / 2; ev.lr.push('Academic vocabulary receives only half credit because spelling or word-choice errors are frequent.'); }
    }
    const penalty = Math.min(1.5, spelling * 0.25 + colloc * 0.25 + informal * 0.1);
    if (penalty) { lr -= penalty; ev.lr.push(`Penalty ${penalty.toFixed(2)} for ${spelling} spelling, ${colloc} word-choice and ${informal} informal-register issue(s).`); }
    if (spelling) weaknesses.push(spelling + ' spelling error(s) detected.');
    if (colloc) weaknesses.push(colloc + ' collocation / word-choice error(s) detected.');
    const topicWords = new Set((task.keywords || []).concat(words(task.prompt || '')));
    const rep = st.repeated.filter(r => !topicWords.has(r.w)).slice(0, 3);
    if (rep.length) { lr -= Math.min(0.75, rep.length * 0.25); weaknesses.push('Repeated words: ' + rep.map(r => `${r.w} (${r.n}×)`).join(', ') + '. Use synonyms or pronouns.'); ev.lr.push('Repetition: ' + rep.map(r => `${r.w} ${r.n}×`).join(', ') + '.'); }
    if (st.words < min * 0.5) lr = Math.min(lr, 4.5);
    lr = clampBand(lr, 3.5, 7.5);

    /* ----- Grammatical range and accuracy ----- */
    const gramIssues = an.issues.filter(i => i.cat !== 'Spelling');
    const weighted = gramIssues.reduce((s, i) => s + (i.confidence === 'sure' ? 1 : 0.5), 0);
    const density = st.words ? (weighted / st.words) * 100 : 0;
    ev.gra.push(`${gramIssues.length} possible grammar or punctuation issue(s) detected: about ${density.toFixed(1)} per 100 words.`);
    ev.gra.push(`Complex-sentence ratio ${(st.complexRatio * 100).toFixed(0)}%; average sentence length ${st.avgSentence} words.`);
    let gra = density >= 6 ? 4.5 : density >= 4 ? 5 : density >= 3 ? 5.5 : density >= 2 ? 6 : density >= 1 ? 6.5 : 7;
    if (density < 3) { if (st.complexRatio >= 0.4) { gra += 0.5; strengths.push('Good use of complex sentences.'); } else if (st.complexRatio >= 0.25) gra += 0.25; else { gra -= 0.5; weaknesses.push('Few complex sentences: combine ideas with because, although, which, while.'); } }
    if (st.words < min * 0.75) gra = Math.min(gra, 5.5);
    if (st.words < min * 0.5) gra = Math.min(gra, 4.5);
    if (gramIssues.length) weaknesses.push(`${gramIssues.length} grammar/punctuation issue(s): ${Array.from(new Set(gramIssues.map(i => i.cat))).slice(0, 4).join(', ')}.`);
    gra = clampBand(gra, 3.5, 7.5);

    const scores = { ta, cc, lr, gra };
    const overallEst = IM.analytics.roundBand((ta + cc + lr + gra) / 4);

    // Recommendations and follow-up from the most frequent categories
    const catCount = {};
    an.issues.forEach(i => { catCount[i.cat] = (catCount[i.cat] || 0) + 1; });
    const topCats = Object.keys(catCount).sort((a, b) => catCount[b] - catCount[a]).slice(0, 2);
    const recs = [];
    topCats.forEach(c => recs.push(`Review “${c}”: ${G().principles[c] || 'revise the related lesson.'}`));
    const weakest = Object.keys(scores).sort((a, b) => scores[a] - scores[b])[0];
    const names = { ta: 'Task Achievement / Response', cc: 'Coherence and Cohesion', lr: 'Lexical Resource', gra: 'Grammatical Range and Accuracy' };
    recs.push(`Your lowest estimated criterion is ${names[weakest]}. Rewrite the weakest paragraph focusing on that criterion.`);
    let followUp = 'Rewrite your introduction in two sentences, then compare it with the model answer.';
    if (topCats[0]) followUp = `Write five new sentences that avoid “${topCats[0]}” errors, then check them in the Sentence Clinic.`;
    else if (weakest === 'lr') followUp = 'Rewrite three sentences replacing repeated words with precise alternatives and natural collocations.';
    else if (weakest === 'cc') followUp = 'Rewrite your second paragraph with a clear topic sentence, an explanation and a specific example.';

    // Example sentences for feedback
    const examples = an.issues.filter(i => i.corrected).slice(0, 5).map(i => ({ original: i.sentence, corrected: i.corrected, cat: i.cat, msg: i.msg }));

    return {
      words: wc, scores, overall: overallEst, evidence: ev, strengths: Array.from(new Set(strengths)), weaknesses: Array.from(new Set(weaknesses)),
      issues: an.issues, register: an.register, stats: st, examples, recommendations: recs, followUp, capped: true,
      note: IM.data.scoring.disclaimers.writing
    };
  }

  /* ------------------------------------------------------------------ Speaking estimate */
  function estimateSpeaking(opts) {
    const sp = IM.data.speaking;
    const transcript = (opts.transcript || '').trim();
    const dur = opts.durationSec || 0;
    const self = opts.self || {};
    const target = opts.part === 2 ? 100 : opts.part === 3 ? 25 : 15;     // practice targets for useful duration (seconds)
    const out = { objective: {}, scores: {}, basis: {}, notes: [] };
    const toBand = r => (r ? sp.ratingToBand[r] : null);
    const wc = U.countWords(transcript);
    const o = out.objective;
    o.durationSec = Math.round(dur);
    o.targetSec = target;
    o.words = transcript ? wc : null;
    o.wpm = transcript && dur > 5 ? Math.round(wc / (dur / 60)) : null;
    const lowT = transcript.toLowerCase();
    const fillerCount = transcript ? sp.fillers.reduce((n, f) => n + (lowT.match(new RegExp('(^|[^a-z])' + f + '(?![a-z])', 'g')) || []).length, 0) : null;
    o.fillers = fillerCount;
    o.fillersPer100 = fillerCount != null && wc ? Math.round((fillerCount / wc) * 1000) / 10 : null;
    o.connectors = transcript ? sp.connectors.filter(c => new RegExp('(^|[^a-z])' + c + '(?![a-z])').test(lowT)) : null;
    const wlist = words(transcript).filter(w => !STOP().has(w) && w.length > 2);
    o.uniqueRatio = wlist.length > 10 ? Math.round((new Set(wlist).size / wlist.length) * 100) / 100 : null;
    const an = transcript ? analyse(transcript, { speech: true }) : null;
    o.grammarIssues = an ? an.issues.length : null;
    o.issues = an ? an.issues : [];
    o.complexRatio = transcript ? Math.round(stats(transcript).complexRatio * 100) / 100 : null;

    // Fluency and coherence: duration against target, speed, fillers and connectors
    let fcObj = null;
    if (dur > 0) {
      fcObj = 5.5;
      const ratio = dur / target;
      if (ratio >= 1) fcObj += 1; else if (ratio >= 0.7) fcObj += 0.5; else if (ratio < 0.4) fcObj -= 1;
      if (o.wpm != null) { if (o.wpm >= 100 && o.wpm <= 190) fcObj += 0.5; else if (o.wpm < 70) fcObj -= 0.5; }
      if (o.fillersPer100 != null) { if (o.fillersPer100 > 8) fcObj -= 0.5; else if (o.fillersPer100 < 3) fcObj += 0.25; }
      if (o.connectors && o.connectors.length >= 4) fcObj += 0.5; else if (o.connectors && o.connectors.length <= 1) fcObj -= 0.25;
      fcObj = clampBand(fcObj, 3.5, 7.5);
    }
    let lrObj = null;
    if (o.uniqueRatio != null) {
      lrObj = 5.5;
      if (o.uniqueRatio >= 0.78) lrObj += 0.5; else if (o.uniqueRatio < 0.6) lrObj -= 0.5;
      const acad = stats(transcript).academicHits.length;
      if (acad >= 3) lrObj += 0.5;
      lrObj = clampBand(lrObj, 3.5, 7);
    }
    let graObj = null;
    if (o.grammarIssues != null && wc >= 20) {
      const per100 = (o.grammarIssues / wc) * 100;
      graObj = per100 >= 6 ? 4.5 : per100 >= 4 ? 5 : per100 >= 2.5 ? 5.5 : per100 >= 1 ? 6 : 6.5;
      if (o.complexRatio >= 0.35 && per100 < 2.5) graObj += 0.5;
      graObj = clampBand(graObj, 3.5, 7);
    }
    const combine = (obj, selfRating, key) => {
      const sb = toBand(selfRating);
      if (obj != null && sb != null) { out.basis[key] = 'objective indicators + your self-rating'; return clampBand((obj + sb) / 2, 3.5, 8); }
      if (obj != null) { out.basis[key] = 'objective indicators only'; return obj; }
      if (sb != null) { out.basis[key] = 'your self-rating only'; return sb; }
      out.basis[key] = 'not enough data';
      return null;
    };
    out.scores.fc = combine(fcObj, self.fc, 'fc');
    out.scores.lr = combine(lrObj, self.lr, 'lr');
    out.scores.gra = combine(graObj, self.gra, 'gra');
    out.scores.pr = toBand(self.pr);
    out.basis.pr = out.scores.pr != null ? 'your self-rating only (pronunciation is not measured automatically)' : 'not rated';
    const have = ['fc', 'lr', 'gra', 'pr'].map(k => out.scores[k]).filter(v => v != null);
    out.overall = have.length === 4 ? IM.analytics.roundBand(U.avg(have)) : null;
    out.partial = have.length ? roundHalf(U.avg(have)) : null;
    if (have.length < 4) out.notes.push('An overall speaking estimate needs all four criteria: rate your pronunciation and add a transcript or typed answer for the other criteria.');
    if (!transcript) out.notes.push('No transcript was available, so lexical and grammar indicators were not measured. Add a typed version of your answer for more feedback.');
    out.disclaimer = IM.data.scoring.disclaimers.speaking;
    return out;
  }

  /* ------------------------------------------------------------------ vocabulary question generator */
  function sameLevel(entry, n) {
    const all = IM.data.vocabulary.entries.filter(e => e.id !== entry.id && e.level === entry.level);
    const others = IM.data.vocabulary.entries.filter(e => e.id !== entry.id && Math.abs(e.level - entry.level) <= 1 && e.level !== entry.level);
    return U.shuffle(all).concat(U.shuffle(others)).slice(0, n);
  }
  function shufOpts(correct, wrongs) {
    const opts = U.shuffle([correct].concat(wrongs));
    return { options: opts, answerIndex: opts.indexOf(correct) };
  }
  function blank(entry) {
    const re = new RegExp('\\b' + entry.word + '(s|es|d|ed|ing)?\\b', 'i');
    const m = entry.example.match(re);
    if (!m) return null;
    return { text: entry.example.replace(re, '________'), answer: m[0] };
  }
  const TYPES = {
    meaning: 'Meaning recognition', worddef: 'Word-to-definition matching', gap: 'Fill-in-the-gap', gaptyped: 'Contextual sentence completion',
    synonym: 'Synonym selection', antonym: 'Antonym selection', collocation: 'Collocation completion', family: 'Word-family transformation',
    paraphrase: 'Paraphrasing', construct: 'Sentence construction', academic: 'Academic word selection', recall: 'Active recall'
  };

  function vocabQuestion(entry, type) {
    const wrongs = n => sameLevel(entry, n);
    switch (type) {
      case 'meaning': {
        const w = wrongs(3); const o = shufOpts(entry.definition, w.map(x => x.definition));
        return { type, entry, prompt: `What does <b>${U.esc(entry.word)}</b> mean?`, options: o.options, answerIndex: o.answerIndex, explain: `${entry.word} (${entry.pos}): ${entry.definition}` };
      }
      case 'worddef': {
        const w = wrongs(3); const o = shufOpts(entry.word, w.map(x => x.word));
        return { type, entry, prompt: `Which word matches this definition?<br><i>${U.esc(entry.definition)}</i>`, options: o.options, answerIndex: o.answerIndex, explain: `${entry.word}: ${entry.definition}` };
      }
      case 'gap': {
        const b = blank(entry); if (!b) return vocabQuestion(entry, 'meaning');
        const w = wrongs(3); const o = shufOpts(b.answer, w.map(x => x.word));
        return { type, entry, prompt: `Choose the word that best completes the sentence.<br><i>${U.esc(b.text)}</i>`, options: o.options, answerIndex: o.answerIndex, explain: `“${entry.example}”` };
      }
      case 'gaptyped': {
        const b = blank(entry); if (!b) return vocabQuestion(entry, 'recall');
        return { type, entry, typed: true, prompt: `Type the missing word. No options are given.<br><i>${U.esc(b.text)}</i>`, accept: [b.answer.toLowerCase(), entry.word.toLowerCase()], answerText: b.answer, explain: `“${entry.example}”` };
      }
      case 'synonym': {
        if (!entry.synonyms.length) return vocabQuestion(entry, 'meaning');
        const syn = U.pick(entry.synonyms); const pool = IM.data.vocabulary.entries.filter(e => e.id !== entry.id && !entry.synonyms.includes(e.word)).map(e => e.word);
        const o = shufOpts(syn, U.shuffle(pool).slice(0, 3));
        return { type, entry, prompt: `Choose a synonym (similar meaning) for <b>${U.esc(entry.word)}</b>.`, options: o.options, answerIndex: o.answerIndex, explain: `Synonyms of ${entry.word}: ${entry.synonyms.join(', ')}.` };
      }
      case 'antonym': {
        if (!entry.antonyms.length) return vocabQuestion(entry, 'synonym');
        const ant = U.pick(entry.antonyms); const pool = IM.data.vocabulary.entries.filter(e => e.id !== entry.id && !entry.antonyms.includes(e.word) && !entry.synonyms.includes(e.word)).map(e => e.word);
        const o = shufOpts(ant, U.shuffle(pool).slice(0, 3));
        return { type, entry, prompt: `Choose an antonym (opposite) of <b>${U.esc(entry.word)}</b>.`, options: o.options, answerIndex: o.answerIndex, explain: `Antonyms of ${entry.word}: ${entry.antonyms.join(', ')}.` };
      }
      case 'collocation': {
        const colls = entry.collocations.filter(c => new RegExp('\\b' + entry.word, 'i').test(c));
        if (!colls.length) return vocabQuestion(entry, 'gap');
        const c = U.pick(colls); const text = c.replace(new RegExp('\\b' + entry.word + '\\w*', 'i'), '________');
        const w = wrongs(3); const o = shufOpts(c.match(new RegExp('\\b' + entry.word + '\\w*', 'i'))[0], w.map(x => x.word));
        return { type, entry, prompt: `Complete the common collocation.<br><i>${U.esc(text)}</i>`, options: o.options, answerIndex: o.answerIndex, explain: `Common collocations: ${entry.collocations.join('; ')}.` };
      }
      case 'family': {
        const f = entry.family.filter(x => x.word.toLowerCase() !== entry.word.toLowerCase() && !/\(/.test(x.word) && ['n', 'v', 'adj', 'adv'].includes(x.pos));
        if (!f.length) return vocabQuestion(entry, 'recall');
        const t = U.pick(f); const names = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' };
        const accept = f.filter(x => x.pos === t.pos).map(x => x.word.toLowerCase());
        return { type, entry, typed: true, prompt: `Word family: write the <b>${names[t.pos]}</b> form related to <b>${U.esc(entry.word)}</b>.`, accept, answerText: t.word, explain: `Word family of ${entry.word}: ${entry.family.map(x => x.pos + ': ' + x.word).join('; ')}.` };
      }
      case 'paraphrase': {
        if (!entry.synonyms.length) return vocabQuestion(entry, 'gaptyped');
        const b = blank(entry); if (!b) return vocabQuestion(entry, 'gaptyped');
        return { type, entry, typed: true, prompt: `Paraphrase: rewrite the word <b>${U.esc(b.answer)}</b> in this sentence using a synonym. Type only the synonym.<br><i>${U.esc(entry.example)}</i>`, accept: entry.synonyms.map(s => s.toLowerCase()), answerText: entry.synonyms[0], explain: `Acceptable synonyms include: ${entry.synonyms.join(', ')}. Check the register: ${entry.register}.` };
      }
      case 'construct': {
        return { type, entry, sentence: true, prompt: `Write your own sentence using <b>${U.esc(entry.word)}</b> (or a form of it) correctly. Use at least 7 words.`, explain: `Model sentence: “${entry.example}”. Typical pattern: ${entry.pattern}.` };
      }
      case 'academic': {
        if (!entry.synonyms.length || entry.level < 3) return vocabQuestion(entry, 'worddef');
        const w = wrongs(3); const o = shufOpts(entry.word, w.map(x => x.word));
        return { type, entry, prompt: `Which more academic word could replace <b>${U.esc(entry.synonyms[entry.synonyms.length - 1])}</b> in formal writing about this idea: “${U.esc(entry.definition)}”?`, options: o.options, answerIndex: o.answerIndex, explain: `${entry.word} (${entry.register}) is the academic choice. ${entry.ielts}` };
      }
      case 'recall':
      default:
        return { type: 'recall', entry, typed: true, prompt: `Active recall: which word means this? Type it from memory.<br><i>${U.esc(entry.definition)}</i><br><span class="muted">Part of speech: ${entry.pos}</span>`, accept: [entry.word.toLowerCase()], answerText: entry.word, explain: `${entry.word} /${entry.ipa.replace(/\//g, '')}/ — ${entry.definition}` };
    }
  }

  /* Pick question types appropriate to how well the learner knows the item (recognition first, production later). */
  function typesFor(entry, it) {
    const box = it ? it.box : 0;
    const used = it ? it.contexts : [];
    const recog = ['meaning', 'worddef', 'gap', 'synonym', 'collocation', 'antonym'];
    const prod = ['gaptyped', 'family', 'paraphrase', 'recall', 'academic', 'construct'];
    const pool = box < 2 ? recog : box < 4 ? recog.slice(2).concat(prod.slice(0, 3)) : prod;
    const fresh = pool.filter(t => !used.includes(t));
    return fresh.length ? fresh : pool;
  }

  /* ------------------------------------------------------------------ recommendations */
  function recommend() {
    const s = IM.store.state;
    const A = IM.analytics;
    const out = [];
    const push = (title, why, route, priority) => out.push({ title, why, route, priority });

    const due = IM.srs.due();
    if (due.length) push(`Review ${due.length} item${due.length === 1 ? '' : 's'} due today`, 'Spaced repetition: reviewing just before you forget strengthens memory.', '#/revision', 1);
    if (!s.diagnostic.done && !s.diagnostic.skipped) push('Take the diagnostic assessment', 'It sets a baseline so progress estimates can be shown.', '#/diagnostic', 2);
    else if (s.diagnostic.skipped && !s.diagnostic.done) push('Take the diagnostic when you are ready', 'Progress estimates are unavailable until enough assessment data exists.', '#/diagnostic', 5);

    const dict = A.dictationErrorStats().filter(e => e.count >= 3).slice(0, 2);
    dict.forEach(e => {
      const route = e.tag === 'plural-ending' || e.tag === 'verb-ending' ? '#/dictation?cat=G' : e.tag === 'homophone' ? '#/dictation?cat=C' : e.tag === 'double-letter' || e.tag === 'silent-letter' || e.tag === 'vowel-combo' ? '#/dictation?cat=D' : '#/dictation?cat=E';
      push(`Targeted dictation: ${e.label}`, `You have made this kind of dictation error ${e.count} times.`, route, 2);
    });

    const areas = A.areaStats();
    Object.keys(areas).forEach(a => {
      const x = areas[a];
      if (x.attempts >= 5 && x.pct < 60) push(`Strengthen ${a.toLowerCase()}`, `Accuracy is ${x.pct}% over ${x.attempts} answers.`, '#/english', 2);
    });

    A.writingErrorStats().slice(0, 1).forEach(e => { if (e.count >= 3) push(`Fix a recurring writing error: ${e.label}`, `It appears ${e.count} times in your error notebook.`, '#/writing?tab=notebook', 2); });
    IM.srs.weak('vocab:', 1).forEach(w => push(`Re-learn “${w.title}”`, 'You keep missing this vocabulary item.', '#/vocab?mode=weak', 3));

    ['listening', 'reading'].forEach(k => { if (!s.mocks.some(m => m.skill === k)) push(`Try a full ${k} practice test`, `No ${k} mock test has been recorded yet.`, '#/exam/' + k, 4); });
    if (!s.writing.submissions.length) push('Write a first practice response', 'No Writing estimate exists yet.', '#/writing', 4);
    if (!s.speaking.sessions.length) push('Do a first speaking practice', 'No Speaking estimate exists yet.', '#/speaking', 4);
    const wk = A.weakestSkill();
    if (wk && wk.gap > 0) push(`Prioritise ${wk.skill}`, `Estimated ${wk.band.toFixed(1)}, target ${(s.settings.targets[wk.skill] || 8).toFixed(1)}.`, wk.skill === 'writing' ? '#/writing' : wk.skill === 'speaking' ? '#/speaking' : '#/exam/' + wk.skill, 3);
    if (!IM.srs.counts('vocab:').learning && !Object.keys(s.srs).some(k => k.startsWith('vocab:'))) push('Start daily vocabulary practice', 'Learning new words regularly builds your Lexical Resource.', '#/vocab', 4);

    out.sort((a, b) => a.priority - b.priority);
    const seen = new Set();
    return out.filter(r => { const k = r.title; if (seen.has(k)) return false; seen.add(k); return true; });
  }

  return { analyse, stats, estimateWriting, estimateSpeaking, vocabQuestion, typesFor, TYPES, recommend, words, sentenceAround };
})();
