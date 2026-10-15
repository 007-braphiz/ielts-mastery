/* Spaced repetition (Leitner boxes). The schedule is transparent and configurable in data/scoring.js.
   Correct answer → move up one box; incorrect answer → fall back to the lapse box.
   Next review date = last practice date + the interval of the new box.
   Mastery needs repeated retrieval: box ≥ minBox, enough consecutive successes, on enough different days and in enough different exercise contexts. */
IM.srs = (function () {
  const cfg = () => IM.data.scoring.srs;

  function get(key) { return IM.store.state.srs[key] || null; }

  function status(it) {
    if (!it || !it.attempts) return 'new';
    const m = cfg().mastery;
    if (it.box >= m.minBox && it.streak >= m.minConsecutive && it.days.length >= m.minDistinctDays && it.contexts.length >= m.minContexts) return 'mastered';
    if (it.box >= 3) return 'reviewing';
    return 'learning';
  }

  function record(key, correct, opts) {
    opts = opts || {};
    const U = IM.util;
    const date = opts.date || U.today();
    const intervals = cfg().intervalsDays;
    const maxBox = intervals.length - 1;
    IM.store.update(s => {
      let it = s.srs[key];
      if (!it) {
        it = s.srs[key] = { key, kind: key.split(':')[0], title: opts.title || key, level: opts.level || null, attempts: 0, correct: 0, incorrect: 0, box: 0, streak: 0, lapses: 0, revisions: 0, lastDate: null, due: date, days: [], contexts: [], avgMs: null };
      }
      if (opts.title) it.title = opts.title;
      if (opts.level) it.level = opts.level;
      it.attempts++;
      if (it.attempts > 1) it.revisions++;
      if (correct) {
        it.correct++;
        it.box = Math.min(maxBox, it.box + 1);
        it.streak++;
        if (!it.days.includes(date)) it.days.push(date);
        if (opts.context && !it.contexts.includes(opts.context)) it.contexts.push(opts.context);
      } else {
        it.incorrect++;
        it.box = Math.min(it.box, cfg().lapseBox);
        it.streak = 0;
        it.lapses++;
      }
      if (opts.ms) it.avgMs = it.avgMs == null ? opts.ms : Math.round(it.avgMs * 0.7 + opts.ms * 0.3);
      it.lastDate = date;
      it.due = U.addDays(date, intervals[it.box]);
      if (it.days.length > 40) it.days = it.days.slice(-40);
    });
    return get(key);
  }

  function accuracy(it) { return it && it.attempts ? it.correct / it.attempts : null; }

  /* Items due today or earlier, most overdue and most frequently missed first. */
  function due(prefix, limit) {
    const U = IM.util;
    const t = U.today();
    const list = Object.values(IM.store.state.srs).filter(it => it.attempts && it.due <= t && (!prefix || it.key.startsWith(prefix)));
    list.sort((a, b) => {
      const oa = U.dayDiff(a.due, t), ob = U.dayDiff(b.due, t);
      return (ob + b.lapses * 2) - (oa + a.lapses * 2) || ((accuracy(a) || 0) - (accuracy(b) || 0));
    });
    return limit ? list.slice(0, limit) : list;
  }

  /* Items that keep being missed (at least two lapses, or accuracy below 60 per cent after three attempts). */
  function weak(prefix, limit) {
    const list = Object.values(IM.store.state.srs).filter(it => (!prefix || it.key.startsWith(prefix)) && it.attempts >= 2 && (it.lapses >= 2 || (it.attempts >= 3 && accuracy(it) < 0.6)));
    list.sort((a, b) => b.lapses - a.lapses || (accuracy(a) - accuracy(b)));
    return limit ? list.slice(0, limit) : list;
  }

  function counts(prefix) {
    const c = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    Object.values(IM.store.state.srs).forEach(it => { if (!prefix || it.key.startsWith(prefix)) c[status(it)]++; });
    return c;
  }

  return { get, record, status, due, weak, counts, accuracy };
})();
