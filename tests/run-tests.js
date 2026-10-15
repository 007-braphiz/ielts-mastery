/* Developer test-suite. Not needed for deployment.
   Run with:  node tests/run-tests.js
   Loads the application's non-DOM modules into a sandbox and checks scoring, comparison and storage logic. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const store = {};
const sandbox = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  navigator: {},
  document: { getElementById: () => null }
};
sandbox.window = sandbox;
vm.createContext(sandbox);

function load(rel) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

const files = [
  'data/scoring.js', 'data/vocabulary.js', 'data/grammar.js', 'data/dictation.js', 'data/spelling100.js', 'data/listening.js', 'data/reading.js', 'data/writing.js', 'data/speaking.js',
  'js/core.js', 'js/diff.js', 'js/srs.js', 'js/qengine.js', 'js/analytics.js', 'js/tutor.js'
];
files.forEach(f => { if (fs.existsSync(path.join(root, f))) load(f); });

const IM = sandbox.IM;
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'not equal') + ': expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function ok(c, msg) { if (!c) throw new Error(msg || 'assertion failed'); }

/* ------------------------------------------------------------------ */
console.log('Content integrity');
test('vocabulary has 6 levels with entries', () => {
  const lv = new Set(IM.data.vocabulary.entries.map(e => e.level));
  eq([...lv].sort(), [1, 2, 3, 4, 5, 6]);
  IM.data.vocabulary.entries.forEach(e => ok(e.definition && e.example && e.ipa && e.respelling && e.collocations.length, 'incomplete entry ' + e.word));
});
test('every vocabulary example contains its headword', () => {
  IM.data.vocabulary.entries.forEach(e => ok(new RegExp('(^|[^a-z])' + e.word, 'i').test(e.example), e.word));
});
test('dictation covers categories A-H and levels 1-6', () => {
  const items = IM.data.dictation.items;
  eq([...new Set(items.map(i => i.cat))].sort(), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'S']);
  eq([...new Set(items.map(i => i.level))].sort(), [1, 2, 3, 4, 5, 6]);
});
test('100-word study guide is fully integrated', () => {
  const g = IM.data.spelling100.guide;
  eq(g.length, 100);
  g.forEach(x => { const it = IM.data.dictation.items.find(i => i.id === x.id); ok(it && it.cat === 'S', x.entry); });
  g.filter(x => !/ /.test(x.entry) && x.entry !== 'principal').forEach(x => {
    const it = IM.data.dictation.items.find(i => i.id === x.id);
    ok(new RegExp('(^|[^a-z])' + x.entry, 'i').test(x.sentence), 'sentence lacks ' + x.entry);
    eq(IM.diff.compare(it.text, x.entry, { item: it }).perfect, true, x.entry);
    if (!it.accept.includes(x.error)) ok(!IM.diff.compare(it.text, x.error, { item: it }).perfect, 'common error accepted: ' + x.entry);
  });
  const jw = IM.data.dictation.items.find(i => i.text === 'jewelry');
  ok(IM.diff.compare(jw.text, 'jewellery', { item: jw }).perfect, 'UK variant accepted');
  const hu = IM.data.dictation.items.find(i => i.text === 'humorous');
  ok(!IM.diff.compare(hu.text, 'humourous', { item: hu }).perfect, 'humourous must be rejected');
});
test('listening test has 4 sections and 40 uniquely numbered questions', () => {
  const t = IM.data.listening.tests[0];
  eq(t.sections.length, 4);
  const ns = [];
  t.sections.forEach(s => s.groups.forEach(g => g.items.forEach(i => ns.push(i.n))));
  eq(ns.length, 40);
  eq(ns.slice().sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
});
test('academic reading has 3 passages and 40 questions', () => {
  const ns = [];
  IM.data.reading.academic.passages.forEach(p => p.groups.forEach(g => g.items.forEach(i => ns.push(i.n))));
  eq(ns.slice().sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
});
test('general training reading has 3 sections and 40 questions', () => {
  const ns = [];
  IM.data.reading.general.sections.forEach(p => p.groups.forEach(g => g.items.forEach(i => ns.push(i.n))));
  eq(ns.slice().sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
});
test('every completion template has a blank for each item', () => {
  const groups = [];
  IM.data.listening.tests[0].sections.forEach(s => s.groups.forEach(g => groups.push(g)));
  IM.data.reading.academic.passages.forEach(p => p.groups.forEach(g => groups.push(g)));
  IM.data.reading.general.sections.forEach(p => p.groups.forEach(g => groups.push(g)));
  groups.filter(g => g.type === 'completion').forEach(g => g.items.forEach(i => ok(g.template.includes('[[' + i.n + ']]'), 'missing blank ' + i.n)));
});
test('every choice answer exists among the options', () => {
  const groups = [];
  IM.data.listening.tests[0].sections.forEach(s => s.groups.forEach(g => groups.push(g)));
  IM.data.reading.academic.passages.forEach(p => p.groups.forEach(g => groups.push(g)));
  IM.data.reading.general.sections.forEach(p => p.groups.forEach(g => groups.push(g)));
  groups.forEach(g => {
    if (g.type === 'mcq') g.items.forEach(i => ok('ABCD'.indexOf(i.a) >= 0 && 'ABCD'.indexOf(i.a) < i.opts.length, 'bad mcq ' + i.n));
    if (g.type === 'match') g.items.forEach(i => ok(g.options.some(o => o[0] === i.a), 'bad match ' + i.n));
    if (g.type === 'tfng' || g.type === 'ynng') g.items.forEach(i => ok(g.options.some(o => o[0] === i.a), 'bad tfng ' + i.n));
  });
});
test('grammar lessons have valid answer indexes', () => {
  IM.data.grammar.lessons.forEach(l => { eq(l.questions.length, 5, l.id); l.questions.forEach(q => ok(q.a >= 0 && q.a < q.opts.length, l.id + ' ' + q.q)); });
});
test('writing tasks all have model answers', () => {
  const W = IM.data.writing;
  W.academicTask1.concat(W.generalTask1, W.task2).forEach(t => ok(t.model && t.prompt, t.id));
});

/* ------------------------------------------------------------------ */
console.log('Dictation comparison');
const D = IM.diff;
test('perfect transcription scores 100', () => {
  const r = D.compare('The students are required to submit their assignments by Friday.', 'The students are required to submit their assignments by Friday.');
  eq(r.wordAccuracy, 100); eq(r.strictScore, 100); ok(r.perfect);
});
test('detects a misspelled word (receive/recieve)', () => {
  const r = D.compare('You will receive an email shortly.', 'You will recieve an email shortly.');
  eq(r.counts.spelling, 1); eq(r.errors[0].tag, 'vowel-combo');
});
test('detects missing double letter', () => {
  const r = D.compare('accommodation', 'accomodation');
  eq(r.counts.spelling, 1); eq(r.errors[0].tag, 'double-letter');
});
test('detects missing word and added word', () => {
  const a = D.compare('She has lived in London since 2015', 'She has lived London since 2015');
  eq(a.counts.missing, 1);
  const b = D.compare('She lived in London', 'She lived in big London');
  eq(b.counts.added, 1);
});
test('detects substitution', () => {
  const r = D.compare('We walked to the station', 'We walked to the museum');
  eq(r.counts.substituted, 1);
});
test('detects homophone confusion in context', () => {
  const r = D.compare('Their house is over there', 'There house is over there');
  eq(r.counts.homophone, 1); eq(r.errors[0].tag, 'homophone');
});
test('detects word order change', () => {
  const r = D.compare('She always arrives early', 'She arrives always early');
  ok(r.counts.order >= 1, 'order not detected');
});
test('separates capitalisation and punctuation from spelling', () => {
  const r = D.compare('However, the plan failed in London.', 'however the plan failed in london');
  eq(r.counts.spelling, 0);
  ok(r.counts.capitalisation >= 2, 'caps ' + r.counts.capitalisation);
  ok(r.counts.punctuation >= 2, 'punct ' + r.counts.punctuation);
  eq(r.wordAccuracy, 100);
});
test('accepts a valid alternative (American) spelling without penalty', () => {
  const r = D.compare('I like the colour.', 'I like the color.');
  eq(r.counts.spelling, 0); eq(r.counts.variant, 1); eq(r.wordAccuracy, 100);
});
test('plural ending omission is tagged', () => {
  const r = D.compare('There are two bathrooms', 'There are two bathroom');
  eq(r.errors[0].tag, 'plural-ending');
});
test('IELTS answer mode ignores spaces, case and punctuation', () => {
  const item = IM.data.dictation.items.find(i => i.id === 'G03');
  const r = D.compare(item.text, 'b152tn', { item });
  ok(r.perfect, 'postcode should be accepted');
  const r2 = D.compare(IM.data.dictation.items.find(i => i.id === 'G06').text, '9:15', { item: IM.data.dictation.items.find(i => i.id === 'G06') });
  ok(r2.perfect, 'time alternative accepted');
});
test('empty response gives zero', () => {
  const r = D.compare('hello world', '');
  eq(r.wordAccuracy, 0); eq(r.counts.missing, 2);
});
test('character accuracy is between 0 and 100', () => {
  const r = D.compare('environment', 'enviroment');
  ok(r.charAccuracy > 85 && r.charAccuracy < 100, 'char ' + r.charAccuracy);
});

/* ------------------------------------------------------------------ */
if (IM.srs) {
  console.log('Spaced repetition');
  test('correct answers advance the box, incorrect answers lapse', () => {
    IM.store.load();
    IM.store.reset();
    IM.srs.record('vocab:test', true, { context: 'mcq', title: 'test' });
    let it = IM.store.state.srs['vocab:test'];
    eq(it.box, 1); eq(it.attempts, 1); eq(it.streak, 1);
    IM.srs.record('vocab:test', true, { context: 'recall' });
    eq(IM.store.state.srs['vocab:test'].box, 2);
    IM.srs.record('vocab:test', false, {});
    it = IM.store.state.srs['vocab:test'];
    eq(it.box, 1); eq(it.streak, 0); eq(it.lapses, 1);
  });
  test('one correct answer never gives mastery', () => {
    IM.store.reset();
    IM.srs.record('vocab:a', true, { context: 'mcq' });
    ok(IM.srs.status(IM.store.state.srs['vocab:a']) !== 'mastered');
  });
  test('mastery needs multiple days and contexts', () => {
    IM.store.reset();
    const k = 'vocab:b';
    for (let i = 0; i < 6; i++) IM.srs.record(k, true, { context: i % 2 ? 'gap' : 'recall', date: IM.util.addDays(IM.util.today(), -10 + i * 2) });
    eq(IM.srs.status(IM.store.state.srs[k]), 'mastered');
    const k2 = 'vocab:c';
    for (let i = 0; i < 6; i++) IM.srs.record(k2, true, { context: 'mcq' });
    ok(IM.srs.status(IM.store.state.srs[k2]) !== 'mastered', 'single day/context should not master');
  });
  test('due items are reported by date', () => {
    IM.store.reset();
    IM.srs.record('vocab:d', true, { date: IM.util.addDays(IM.util.today(), -5) });
    ok(IM.srs.due().some(x => x.key === 'vocab:d'));
  });
}

/* ------------------------------------------------------------------ */
if (IM.qengine) {
  console.log('Objective marking and bands');
  const Q = IM.qengine;
  test('completion answers are case-insensitive but spelling-sensitive', () => {
    const item = { n: 1, a: ['Venkataraman'] };
    ok(Q.markItem({ type: 'completion' }, item, 'venkataraman').correct);
    ok(!Q.markItem({ type: 'completion' }, item, 'Venkataramen').correct);
    ok(!Q.markItem({ type: 'completion' }, item, '').correct);
  });
  test('numbers ignore internal spaces and ordinal suffixes', () => {
    ok(Q.markItem({ type: 'completion' }, { n: 4, a: ['449 615'] }, '449615').correct);
    ok(Q.markItem({ type: 'completion' }, { n: 7, a: ['16', '16th'] }, '16th').correct);
  });
  test('choice questions use the answer key', () => {
    ok(Q.markItem({ type: 'mcq' }, { a: 'B' }, 'b').correct);
    ok(!Q.markItem({ type: 'mcq' }, { a: 'B' }, 'C').correct);
    ok(Q.markItem({ type: 'tfng' }, { a: 'NOT GIVEN' }, 'NOT GIVEN').correct);
  });
  test('full listening key scores 40/40 and an empty sheet scores 0', () => {
    const t = IM.data.listening.tests[0];
    const answers = {};
    t.sections.forEach(s => s.groups.forEach(g => g.items.forEach(i => { answers[i.n] = Array.isArray(i.a) ? i.a[0] : i.a; })));
    let correct = 0, total = 0;
    t.sections.forEach(s => s.groups.forEach(g => g.items.forEach(i => { total++; if (Q.markItem(g, i, answers[i.n]).correct) correct++; })));
    eq([correct, total], [40, 40]);
    const r = Q.markTest(t.sections.flatMap(s => s.groups), {});
    eq(r.raw, 0); eq(r.max, 40);
  });
  test('full reading keys score 40/40', () => {
    const all = [IM.data.reading.academic.passages.flatMap(p => p.groups), IM.data.reading.general.sections.flatMap(s => s.groups)];
    all.forEach(groups => {
      const answers = {};
      groups.forEach(g => g.items.forEach(i => { answers[i.n] = Array.isArray(i.a) ? i.a[0] : i.a; }));
      const r = Q.markTest(groups, answers);
      eq([r.raw, r.max], [40, 40]);
    });
  });
}

if (IM.analytics) {
  const A = IM.analytics;
  test('band conversion uses configurable tables', () => {
    eq(A.rawToBand('listening', 40), 9);
    eq(A.rawToBand('listening', 32), 7.5);
    eq(A.rawToBand('readingAcademic', 30), 7);
    eq(A.rawToBand('readingGeneral', 34), 7);
    eq(A.rawToBand('listening', 0), 2);
  });
  test('overall band follows IELTS rounding conventions', () => {
    eq(A.overall({ listening: 7, reading: 7, writing: 6.5, speaking: 7 }), 7);       // 6.875 → 7.0
    eq(A.overall({ listening: 6.5, reading: 6.5, writing: 6, speaking: 6 }), 6.5);   // 6.25 → 6.5
    eq(A.overall({ listening: 6, reading: 6, writing: 6, speaking: 6.5 }), 6);       // 6.125 → 6.0
    eq(A.overall({ listening: 6.5, reading: 7, writing: 6.5, speaking: 7 }), 7);     // 6.75 → 7.0
    eq(A.overall({ listening: 7, reading: 7, writing: 7, speaking: 6.5 }), 7);       // 6.875 → 7.0
  });
  test('overall is unavailable when a skill is missing', () => {
    eq(A.overall({ listening: 7, reading: 7, writing: null, speaking: 7 }), null);
  });
}

if (IM.tutor) {
  console.log('Writing and speech analysis');
  const T = IM.tutor;
  test('detects subject-verb, article and collocation errors', () => {
    const r = T.analyse('People is happy. I have a idea. They do a mistake. He have a car.');
    const ids = r.issues.map(i => i.ruleId);
    ['people-is', 'a-an', 'collocation-do-mistake', 'he-have'].forEach(id => ok(ids.includes(id), 'missing ' + id));
  });
  test('model answers trigger few grammar issues', () => {
    IM.data.writing.task2.forEach(t => { const r = T.analyse(t.model); ok(r.issues.filter(i => i.confidence === 'sure').length <= 1, t.id + ' → ' + r.issues.map(i => i.ruleId + ':' + i.match).join(', ')); });
  });
  test('word count does not by itself raise the estimate', () => {
    const filler = Array(60).fill('The thing is important and people think it is good for them.').join(' ');
    const long = T.estimateWriting(filler, IM.data.writing.task2[0], {});
    const good = T.estimateWriting(IM.data.writing.task2[0].model, IM.data.writing.task2[0], {});
    ok(long.overall < good.overall, 'long filler ' + long.overall + ' vs good ' + good.overall);
  });
  test('short responses are penalised on task achievement', () => {
    const r = T.estimateWriting('I think it is good.', IM.data.writing.task2[0], {});
    ok(r.scores.ta <= 4.5, 'ta ' + r.scores.ta);
  });
  test('estimates never exceed the capped maximum', () => {
    const r = T.estimateWriting(IM.data.writing.task2[1].model, IM.data.writing.task2[1], {});
    ok(r.overall <= 8, 'overall ' + r.overall);
  });
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
