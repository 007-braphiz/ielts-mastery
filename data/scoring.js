/* Scoring configuration. Configuration only: all calculation logic lives in js/analytics.js.
   Band conversions are APPROXIMATE practice conversions and can be edited here. */
window.IM = window.IM || {};
IM.data = IM.data || {};

IM.data.scoring = {
  conversionNote:
    'Approximate practice conversions only. Official IELTS tests use their own conversion tables, which differ between test versions. Edit these tables in data/scoring.js if you prefer different thresholds.',

  /* Each row: [minimum raw score, band]. Highest first. */
  bandConversions: {
    listening: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]],
    readingAcademic: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]],
    readingGeneral: [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [0, 2]]
  },

  /* Practice timing (minutes). These are practice settings, not a claim of exact official rules. */
  exam: {
    listening: { strictMinutes: 40, note: '30 minutes of audio plus 10 minutes to transfer answers (paper-based style). The bundled starter audio is shorter than a real test.' },
    reading: { strictMinutes: 60 },
    writing: { strictMinutes: 60, task1Suggested: 20, task2Suggested: 40, task1Min: 150, task2Min: 250 },
    speaking: { part2PrepSeconds: 60, part2SpeakSeconds: 120 }
  },

  /* Spaced repetition: Leitner-style boxes. Interval (days) for each box. */
  srs: {
    intervalsDays: [0, 1, 3, 7, 14, 30, 60],
    lapseBox: 1,
    mastery: { minBox: 5, minConsecutive: 3, minDistinctDays: 3, minContexts: 2 }
  },

  /* Dictation practice settings (not official IELTS rules). */
  dictation: {
    exam: { maxReplaysPerSegment: 1, secondsPerWord: 6, minSeconds: 60 },
    learning: { rates: [0.6, 0.75, 0.9, 1.0, 1.15] },
    adaptive: { window: 8, up: 0.85, down: 0.55 }
  },

  /* Adaptive vocabulary thresholds. */
  vocabAdaptive: { window: 12, up: 0.8, down: 0.5 },

  /* Readiness rules for the exam readiness assessment. */
  readiness: { minMocksPerSkill: 2, consistencyBandSpread: 1.0 },

  vocabLevels: [
    { n: 1, name: 'Essential Everyday English', blurb: 'Common words, basic meanings and practical expressions.' },
    { n: 2, name: 'Elementary Vocabulary', blurb: 'Frequent vocabulary, simple collocations and basic contextual usage.' },
    { n: 3, name: 'Intermediate Vocabulary', blurb: 'Broader word choice, common collocations and more precise expression.' },
    { n: 4, name: 'Upper-Intermediate and IELTS Vocabulary', blurb: 'Academic expressions, paraphrasing, topic vocabulary and contextual distinctions.' },
    { n: 5, name: 'Advanced Academic English', blurb: 'Advanced vocabulary, word families, sophisticated collocations and nuanced meanings.' },
    { n: 6, name: 'High-Level Lexical Precision', blurb: 'Subtle distinctions, register, idiomatic accuracy and sophisticated academic expression.' }
  ],

  dictationLevels: [
    { n: 1, name: 'Level 1', blurb: 'Familiar words spoken slowly and clearly.' },
    { n: 2, name: 'Level 2', blurb: 'Common words and short phrases.' },
    { n: 3, name: 'Level 3', blurb: 'Complete sentences and frequent spelling traps.' },
    { n: 4, name: 'Level 4', blurb: 'Homophones, grammatical endings and complex sentences.' },
    { n: 5, name: 'Level 5', blurb: 'Academic vocabulary and paragraph dictation.' },
    { n: 6, name: 'Level 6', blurb: 'Extended passages, connected speech and advanced IELTS-related content.' }
  ],

  /* Study areas tracked by the English Proficiency Centre. */
  areas: ['Grammar', 'Vocabulary', 'Spelling', 'Punctuation', 'Sentence construction', 'Reading comprehension', 'Listening comprehension', 'Paraphrasing', 'Academic writing', 'Pronunciation', 'Fluency', 'Cohesion and logical expression'],

  /* Rubric summaries (own wording) used for Writing and Speaking self-review. */
  writingCriteria: [
    { id: 'ta', name: 'Task Achievement / Task Response', short: 'TA/TR' },
    { id: 'cc', name: 'Coherence and Cohesion', short: 'CC' },
    { id: 'lr', name: 'Lexical Resource', short: 'LR' },
    { id: 'gra', name: 'Grammatical Range and Accuracy', short: 'GRA' }
  ],
  speakingCriteria: [
    { id: 'fc', name: 'Fluency and Coherence', short: 'FC' },
    { id: 'lr', name: 'Lexical Resource', short: 'LR' },
    { id: 'gra', name: 'Grammatical Range and Accuracy', short: 'GRA' },
    { id: 'pr', name: 'Pronunciation', short: 'PR' }
  ],

  disclaimers: {
    writing: 'Estimated practice score. This is rule-based feedback, not an official IELTS band or an examiner’s judgement.',
    speaking: 'Estimated practice score. Only duration, speed, word counts and text patterns are measured objectively; fluency and pronunciation ratings are your own judgement.',
    objective: 'Raw scores are exact. Band conversions are approximate practice conversions, not official results.',
    dictation: 'Dictation score is a custom measure for practice and is not an IELTS band.'
  }
};
