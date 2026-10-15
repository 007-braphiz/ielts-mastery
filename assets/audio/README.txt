Bundled recordings (optional)
-----------------------------
The application speaks with the browser's text-to-speech voices unless a recording exists.
To use a recording, add an audio file here (for example dictation-A02.mp3) and set the
"audio" field of the matching item or listening section:

  data/dictation.js  -> item.audio = 'assets/audio/dictation-A02.mp3'
  data/listening.js  -> section.audio = 'assets/audio/listening-l1-s1.mp3'

If the file cannot be loaded, playback falls back to synthetic speech and is labelled as such.
Use only recordings you have the right to use.
