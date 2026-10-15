# IELTS Band 8 Mastery

A static, framework-free IELTS preparation and English-learning web application (HTML, CSS, vanilla JavaScript). No backend, build step, package manager or paid AI service. Progress is stored in the browser's LocalStorage.

## Modules
Dashboard · Exam Simulator (Listening, Reading, Writing, Speaking) · Vocabulary Mastery (6 internal levels) · Dictation Laboratory (audio-first, categories A–H, 6 levels) · English Proficiency Centre (19 lessons, Sentence Clinic) · Writing Coach · Speaking Coach · Personalised Study Plan · Progress Analytics · Settings and Data.

## Project structure
```
index.html  styles.css  app.js  netlify.toml  README.md
data/    scoring.js vocabulary.js grammar.js dictation.js spelling100.js listening.js reading.js writing.js speaking.js
js/      core.js audio.js diff.js srs.js qengine.js analytics.js tutor.js charts.js v-*.js (one per view)
assets/  icons/icon.svg  audio/README.txt (how to add recordings)
tests/   run-tests.js (developer checks; not needed for deployment)
```
Content (data/), scoring configuration (data/scoring.js) and logic (js/) are separate. Add vocabulary by appending lines to `data/vocabulary.js`, dictation items to `data/dictation.js`, and so on.

## Run locally
Open `index.html` directly, or serve the folder (needed for some browsers' speech/microphone permissions):
```
python -m http.server 8000      # then visit http://localhost:8000
node tests/run-tests.js         # optional logic tests
```

## Deploy to Netlify
**Method A: manual.** In Netlify choose *Add new site → Deploy manually* and drag the project folder (or its contents) onto the page. Netlify serves it over HTTPS.

**Method B: Git.** Push this folder to a Git repository, choose *Add new site → Import an existing project*, pick the repository, leave the **build command empty** and set the **publish directory to `.`** (the project root). `netlify.toml` already says this. No redirects are needed because routing uses URL hashes (`#/dashboard`).

Deployment has **not** been performed from this environment; verify your published URL yourself.

## Coverage (honest)
- 72 vocabulary entries (12 per level), 19 grammar lessons, 202 dictation items (including the 100 Commonly Misspelled Words study guide, category S, with a dedicated 100 Words tab), 1 full Listening test (4 sections, 40 questions), 1 Academic and 1 General Training Reading test (40 questions each), 13 Writing tasks with models, 8 Speaking Part 1 topics and 6 cue cards.
- Reading passages are shorter than real IELTS passages; the Listening audio is synthetic speech and shorter than a real recording. Some details in practice texts are illustrative. All content is original.
- Band conversion tables are approximate and editable in `data/scoring.js`.

## Scoring principles
- Listening/Reading: deterministic answer keys; raw score out of 40; approximate band conversion. Only the first attempt of a full test updates the estimate.
- Writing/Speaking: rule-based **estimated practice scores**, not official bands and not an AI. Writing is capped at 7.5 and never rewards length alone. Speaking measures only duration, speed, words, fillers and text patterns; fluency and pronunciation use your self-rating.
- Dictation: word-level edit-distance alignment; methods and formulas are shown in the app. Not an IELTS band.
- Spaced repetition: Leitner boxes (0, 1, 3, 7, 14, 30, 60 days). Mastery needs repeated retrieval on different days and in different exercise types.
- The overall band is shown only when all four skills have estimates (IELTS half-band rounding).

## Known limitations
- **Speech synthesis:** voices come from the browser/OS; accent, speed and pronunciation differ by device. Not authentic IELTS audio.
- **Speech recognition:** Chrome/Edge/Safari only (Firefox lacks it); needs HTTPS and microphone permission; may mis-hear. Typed answers are the fallback.
- **Recording:** needs MediaRecorder and permission; recordings stay in the open tab and are not saved.
- **Automated assessment:** pattern checks cannot judge argument quality, data accuracy, naturalness or pronunciation.
- **LocalStorage:** belongs to one browser profile, does not sync between devices and can be lost if site data is cleared. Use Settings → Export for backups.
- **Offline:** the site is plain static files, but there is no service worker, so it is not guaranteed to work offline; speech voices may need the network on some systems.
- Practice settings (timers, replay limits) approximate, but do not reproduce, official test rules. No outcome (including Band 8) is guaranteed.

## Testing performed
`node tests/run-tests.js` checks content integrity (40 questions per test), dictation comparison, spaced repetition, marking with the full answer keys, band conversion, overall rounding and the writing analyser. The pages were also smoke-tested in a browser (every route renders; dictation, vocabulary, Reading and Listening submission, Writing feedback, import validation).

## Future enhancements
More content packs and recorded audio; a service worker for offline use; printable reports; more rule patterns in `data/grammar.js`; additional full mock tests.
