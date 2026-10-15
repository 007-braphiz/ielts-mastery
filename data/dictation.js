/* Dictation Laboratory content.
   Item fields: id, cat (A-H), level (1-6), say (spoken text), text (reference transcript), hint (meaning, shown only after submission),
   note (spelling or listening explanation), focus (words that carry the test point), tags (error-pattern tags),
   accept (alternative full answers), mode ('text' | 'answer' for IELTS-style short answers compared without spaces, case or punctuation),
   audio (optional path to a bundled recording; the browser voice is used if it is missing).
   The reference transcript is never shown before submission. */
window.IM = window.IM || {};
IM.data = IM.data || {};

(function () {
  const items = [];
  // Single words (A) and commonly misspelled words (D): the voice says the word, a short sentence, then the word again.
  const W = (id, cat, level, word, context, hint, note, tags) =>
    items.push({ id, cat, level, say: word + '. ' + context + ' ' + word + '.', text: word, hint, note, tags: tags || [], focus: [word.toLowerCase()], mode: 'text', context });
  // Sentence-level and passage items.
  const S = (id, cat, level, text, note, tags, focus, extra) =>
    items.push(Object.assign({ id, cat, level, say: text, text, hint: '', note: note || '', tags: tags || [], focus: (focus || []).map(f => f.toLowerCase()), mode: 'text' }, extra || {}));
  // IELTS Listening answer items: the voice says a longer utterance; the learner types the answer that a form would need.
  const G = (id, level, say, text, accept, note, tags) =>
    items.push({ id, cat: 'G', level, say, text, hint: '', note, tags: tags || [], focus: [], accept: accept || [], mode: 'answer' });

  /* A. Single-word dictation */
  W('A01', 'A', 1, 'friend', 'My best friend lives next door.', 'a person you know well and like', 'The vowels are “ie”: fr-ie-nd. A friend to the end.', ['vowel-combo']);
  W('A02', 'A', 1, 'because', 'We stayed at home because it was raining.', 'a word that gives a reason', 'Big Elephants Can Always Understand Small Elephants: b-e-c-a-u-s-e.', ['vowel-combo']);
  W('A03', 'A', 1, 'island', 'They live on a small island.', 'land surrounded by water', 'Silent “s”: i-s-land.', ['silent-letter']);
  W('A04', 'A', 1, 'answer', 'Please write your answer on the form.', 'a reply to a question', 'Silent “w”: ans-w-er.', ['silent-letter']);
  W('A05', 'A', 1, 'listen', 'Please listen carefully to the instructions.', 'to pay attention to a sound', 'Silent “t”: lis-t-en.', ['silent-letter']);
  W('A06', 'A', 2, 'knowledge', 'Reading increases your knowledge.', 'information and understanding that you have', 'Silent “k”, and “dge” at the end: k-n-o-w-l-e-d-g-e.', ['silent-letter']);
  W('A07', 'A', 2, 'foreign', 'She speaks three foreign languages.', 'from another country', 'Silent “g”, and “ei” not “ie”: f-o-r-e-i-g-n.', ['silent-letter', 'vowel-combo']);
  W('A08', 'A', 2, 'Wednesday', 'The seminar is on Wednesday.', 'the day after Tuesday', 'Silent “d”: Wed-nes-day.', ['silent-letter']);
  W('A09', 'A', 2, 'library', 'I borrowed three books from the library.', 'a place where books can be borrowed', 'Say and spell “brar”: li-brar-y, not “liberry”.', ['vowel-combo']);
  W('A10', 'A', 2, 'business', 'He started a small business last year.', 'the work of buying and selling', 'The second syllable is silent in speech but written: bus-i-ness.', ['vowel-combo']);
  W('A11', 'A', 3, 'committee', 'The committee meets every Monday.', 'a group chosen to make decisions', 'Double m, double t, double e: com-mit-tee.', ['double-letter']);
  W('A12', 'A', 3, 'embarrass', 'Please do not embarrass me in front of my friends.', 'to make someone feel awkward', 'Double r and double s: em-bar-rass.', ['double-letter']);
  W('A13', 'A', 3, 'tomorrow', 'I will see you tomorrow.', 'the day after today', 'One m and double r: to-mor-row.', ['double-letter']);
  W('A14', 'A', 3, 'address', 'What is your home address?', 'the details of where someone lives', 'Double d and double s: ad-dress.', ['double-letter']);
  W('A15', 'A', 3, 'parallel', 'The two roads run parallel to each other.', 'lines going in the same direction, always the same distance apart', 'The “ll” is in the middle, then a single “l”: pa-ral-lel.', ['double-letter']);
  W('A16', 'A', 4, 'rhythm', 'The drummer kept a steady rhythm.', 'a regular pattern of sounds or movements', 'Rhythm Helps Your Two Hips Move: r-h-y-t-h-m.', ['silent-letter']);
  W('A17', 'A', 4, 'psychology', 'She is studying psychology at university.', 'the study of the mind and behaviour', 'Silent “p”: p-s-y-c-h-o-l-o-g-y.', ['silent-letter']);
  W('A18', 'A', 4, 'colleague', 'My colleague will join the meeting.', 'a person you work with', 'Double l, and “ague” at the end: col-league.', ['double-letter', 'vowel-combo']);
  W('A19', 'A', 4, 'queue', 'We had to queue for an hour.', 'a line of people waiting', 'Five letters, only two sounds: q-u-e-u-e.', ['vowel-combo']);
  W('A20', 'A', 4, 'conscience', 'He has a clear conscience.', 'your sense of right and wrong', 'Spelled con-sci-ence; the “sci” makes the /ʃ/ sound.', ['silent-letter']);
  W('A21', 'A', 5, 'acquaintance', 'She is an acquaintance, not a close friend.', 'someone you know slightly', 'ac-quaint-ance: the “c” before “qu”.', ['double-letter']);
  W('A22', 'A', 5, 'bureaucracy', 'The bureaucracy delayed the project.', 'a complex system of rules and officials', 'Starts with the French-style “bureau”: b-u-r-e-a-u-c-r-a-c-y.', ['vowel-combo']);
  W('A23', 'A', 6, 'miscellaneous', 'The box contained miscellaneous items.', 'of various kinds', 'mis-cel-la-ne-ous: double l is in the middle.', ['double-letter', 'vowel-combo']);
  W('A24', 'A', 6, 'conscientious', 'She is a conscientious student.', 'careful and hard-working', 'con-sci-en-tious: “sci” then “en” then “tious”.', ['vowel-combo']);

  /* B. Similar-sounding words (in context) */
  S('B01', 'B', 3, 'Pollution can affect children’s health.', '“Affect” is the verb meaning “influence”.', ['homophone'], ['affect']);
  S('B02', 'B', 3, 'The effect of the new law was immediate.', '“Effect” is the noun meaning “result”.', ['homophone'], ['effect']);
  S('B03', 'B', 3, 'I need some advice about my course.', '“Advice” (noun) ends in -ice and sounds like /s/.', ['homophone'], ['advice']);
  S('B04', 'B', 3, 'My tutor will advise me on which module to choose.', '“Advise” (verb) ends in -ise and sounds like /z/.', ['homophone'], ['advise']);
  S('B05', 'B', 3, 'I accept your offer of a place on the course.', '“Accept” means to receive or agree.', ['homophone'], ['accept']);
  S('B06', 'B', 3, 'Everyone except Maria passed the test.', '“Except” means “not including”.', ['homophone'], ['except']);
  S('B07', 'B', 3, 'Please do not lose your ticket.', '“Lose” (one o) is the verb meaning to fail to keep something.', ['homophone'], ['lose']);
  S('B08', 'B', 3, 'The screw was loose, so the shelf fell down.', '“Loose” (double o) means not tight.', ['homophone'], ['loose']);
  S('B09', 'B', 3, 'The library was very quiet this morning.', '“Quiet” has two syllables and means silent.', ['homophone'], ['quiet']);
  S('B10', 'B', 3, 'The exam was quite difficult.', '“Quite” has one syllable and means fairly.', ['homophone'], ['quite']);
  S('B11', 'B', 4, 'The principal welcomed the new students.', '“Principal” can mean the head of a school.', ['homophone'], ['principal']);
  S('B12', 'B', 4, 'Honesty is a matter of principle.', '“Principle” means a basic rule or belief.', ['homophone'], ['principle']);
  S('B13', 'B', 4, 'Regular practice improves fluency.', 'In British English “practice” is the noun.', ['homophone'], ['practice']);
  S('B14', 'B', 4, 'You should practise speaking every day.', 'In British English “practise” is the verb.', ['homophone'], ['practise']);
  S('B15', 'B', 4, 'The traffic was stationary for an hour.', '“Stationary” means not moving (a for “at rest”).', ['homophone'], ['stationary']);
  S('B16', 'B', 4, 'She bought some stationery for the new term.', '“Stationery” means paper, pens and similar items (e for “envelope”).', ['homophone'], ['stationery']);

  /* C. Homophones in context */
  S('C01', 'C', 4, 'Their house is over there, and they’re waiting outside.', 'Their = belonging to them; there = place; they’re = they are.', ['homophone'], ['their', 'there', 'they\'re']);
  S('C02', 'C', 4, 'Your essay is good, and you’re ready for the exam.', 'Your = belonging to you; you’re = you are.', ['homophone'], ['your', 'you\'re']);
  S('C03', 'C', 4, 'The company changed its name because it’s expanding abroad.', 'Its = belonging to it; it’s = it is.', ['homophone'], ['its', 'it\'s']);
  S('C04', 'C', 4, 'I do not know whether the weather will improve.', 'Whether = if; weather = rain, sun, wind.', ['homophone'], ['whether', 'weather']);
  S('C05', 'C', 4, 'He finished earlier than expected and then went home.', 'Than = comparison; then = next.', ['homophone'], ['than', 'then']);
  S('C06', 'C', 5, 'The sauce is a perfect complement to the pasta, and the chef received a compliment.', 'Complement completes something; compliment is a kind remark.', ['homophone'], ['complement', 'compliment']);
  S('C07', 'C', 4, 'We are going to hear the news here.', 'Hear = listen; here = in this place.', ['homophone'], ['hear', 'here']);
  S('C08', 'C', 4, 'I would like to know who’s coming and whose book this is.', 'Who’s = who is; whose = belonging to whom.', ['homophone'], ['who\'s', 'whose']);
  S('C09', 'C', 4, 'The two students went to the library too, and they bought two books.', 'To = direction; too = also; two = 2.', ['homophone'], ['to', 'too', 'two']);
  S('C10', 'C', 5, 'The weather was too cold, so we decided to stay there instead of going to the beach.', 'Practise telling their/there/to/too from the context.', ['homophone'], ['weather', 'too', 'there', 'to']);

  /* D. Commonly misspelled words */
  W('D01', 'D', 3, 'accommodation', 'The university provides accommodation for first-year students.', 'a place to live or stay', 'Double c and double m: ac-com-mo-da-tion.', ['double-letter']);
  W('D02', 'D', 3, 'necessary', 'It is necessary to book in advance.', 'needed', 'One collar (c), two sleeves (ss): ne-ces-sa-ry.', ['double-letter']);
  W('D03', 'D', 3, 'separate', 'Please keep the two files separate.', 'apart or not joined', 'There is “a rat” in sepARATe.', ['vowel-combo']);
  W('D04', 'D', 3, 'environment', 'We must protect the environment.', 'the natural world', 'Environ-ment: the “n” before the “m” is easily missed.', ['silent-letter']);
  W('D05', 'D', 3, 'government', 'The government has announced new rules.', 'the group that controls a country', 'Govern + ment: keep the “n”.', ['silent-letter']);
  W('D06', 'D', 4, 'occurrence', 'The occurrence of floods has increased.', 'something that happens', 'Double c, double r, and -ence: oc-cur-rence.', ['double-letter']);
  W('D07', 'D', 4, 'privilege', 'It was a privilege to meet her.', 'a special advantage or honour', 'Priv-i-lege: no “d”, and the middle is “i”.', ['vowel-combo']);
  W('D08', 'D', 3, 'definitely', 'I will definitely attend the meeting.', 'without doubt', 'Definite + ly: use -ite, not -ate.', ['vowel-combo']);
  W('D09', 'D', 3, 'receive', 'You will receive an email shortly.', 'to get something', 'i before e except after c: rec-ei-ve.', ['vowel-combo']);
  W('D10', 'D', 3, 'recommend', 'I recommend this book to all students.', 'to suggest something is good', 'One c, double m: re-com-mend.', ['double-letter']);
  W('D11', 'D', 3, 'successful', 'She had a successful career.', 'achieving what you wanted', 'Double c, double s, and “ful” with one l: suc-cess-ful.', ['double-letter']);
  W('D12', 'D', 3, 'beginning', 'The beginning of the film was slow.', 'the start', 'Double n before -ing: begin → beginning.', ['double-letter']);
  W('D13', 'D', 4, 'maintenance', 'Regular maintenance prevents breakdowns.', 'keeping something in good condition', 'Maintain → maintenance (the “ai” becomes “ena”).', ['vowel-combo']);
  W('D14', 'D', 4, 'questionnaire', 'Please complete the questionnaire.', 'a set of written questions', 'Double n: question + naire.', ['double-letter']);
  W('D15', 'D', 5, 'entrepreneur', 'She is a successful entrepreneur.', 'a person who starts a business', 'French origin: entre-pre-neur, with “eu” at the end.', ['vowel-combo']);

  /* E. Sentence dictation */
  S('E01', 'E', 3, 'The students are required to submit their assignments by Friday.', 'Plural endings: students, assignments.', ['plural']);
  S('E02', 'E', 3, 'Although it was raining, we decided to walk to the station.', 'Comma after the introductory clause; “although” is one word.', ['punctuation']);
  S('E03', 'E', 3, 'She has lived in London since 2015, but she was born in Leeds.', 'Present perfect (has lived) and past simple (was born).', ['verb-ending']);
  S('E04', 'E', 3, 'Many companies have introduced flexible working hours for their employees.', 'Plural nouns and the present perfect.', ['plural', 'verb-ending']);
  S('E05', 'E', 4, 'He did not realise that the museum closes at five o’clock on Sundays.', 'British spelling “realise”; apostrophe in o’clock.', ['verb-ending']);
  S('E06', 'E', 4, 'The number of international students has risen steadily over the last decade.', '“The number of … has” takes a singular verb.', ['verb-ending']);
  S('E07', 'E', 4, 'If I had more time, I would study abroad.', 'Second conditional: had … would.', ['verb-ending']);
  S('E08', 'E', 3, 'Public libraries offer free internet access, books and quiet study areas.', 'List commas and plural endings.', ['plural', 'punctuation']);
  S('E09', 'E', 3, 'The lecturer asked us to read chapters four and five before the seminar.', 'Past tense “asked”; plural “chapters”.', ['verb-ending', 'plural']);
  S('E10', 'E', 4, 'Recycling reduces waste, saves energy and protects natural resources.', 'Third-person -s on three verbs.', ['verb-ending']);

  S('E11', 'E', 1, 'I like my new school.', 'Short and familiar words.', []);
  S('E12', 'E', 1, 'She drinks water every day.', 'Third-person -s on “drinks”.', ['verb-ending']);
  S('E13', 'E', 2, 'We are going to the market on Saturday.', 'Capital letter for the day of the week.', []);
  S('E14', 'E', 2, 'The bus arrives at nine o’clock.', 'Apostrophe in o’clock; third-person -s.', ['verb-ending']);
  S('E15', 'E', 2, 'My brother works in a hospital near the station.', 'Third-person -s on “works”.', ['verb-ending']);

  /* F. Paragraph dictation */
  S('F01', 'F', 4, 'The university library opens at eight o’clock every morning. Students may borrow up to ten books for three weeks, and they can renew them online. Silence is required on the second floor.', 'Everyday academic context; plurals and modal verbs.', ['plural']);
  S('F02', 'F', 4, 'Last weekend, my friends and I visited a small museum near the river. It was quiet, so we could hear our footsteps on the wooden floor. We spent nearly two hours looking at old maps, photographs and tools. Afterwards, we had lunch in a café and talked about our plans for the summer.', 'Past simple endings and a list.', ['verb-ending', 'plural']);
  S('F03', 'F', 5, 'Urban green spaces provide several benefits for city residents. They reduce air pollution, lower temperatures during hot weather and offer places for exercise and relaxation. Research suggests that people who live near parks tend to report better mental health. However, local authorities must balance these advantages against the high cost of land.', 'Academic vocabulary and linking words.', ['plural']);
  S('F04', 'F', 5, 'Over the past thirty years, the proportion of people using public transport has fluctuated considerably. While the introduction of electric buses contributed to a modest recovery, the overall trend remains uncertain. Experts argue that sustained investment in infrastructure is essential if cities hope to reduce congestion and emissions.', 'IELTS Task 1 and Task 2 vocabulary.', ['verb-ending']);

  /* G. IELTS Listening answer dictation (type the answer a form would need) */
  G('G01', 3, 'Could I take your name, please? Yes, it is Marjorie Thistlewood. That is T, H, I, S, T, L, E, W, O, O, D.', 'Marjorie Thistlewood', ['Marjorie Thistlewood'], 'Names are usually spelled out. Listen for double letters (oo) and write the capital letters.', ['name']);
  G('G02', 3, 'My mobile number is oh seven nine four one, six five three, double eight two.', '07941 653 882', ['07941653882', '07941 653 882'], '“Double eight” means 8 8. Spoken “oh” means 0.', ['number']);
  G('G03', 3, 'The postcode is B, one five, two T N.', 'B15 2TN', ['B15 2TN', 'B152TN'], 'UK postcodes have an outward and an inward part. Spaces and capitals are not marked wrong in this practice.', ['number']);
  G('G04', 4, 'The address is flat twelve, forty-three Marlow Road.', 'Flat 12, 43 Marlow Road', ['Flat 12, 43 Marlow Road', 'Flat twelve, 43 Marlow Road', 'flat 12 43 marlow road'], 'Numbers can be written as digits in answers. Capitalise place names.', ['number', 'name']);
  G('G05', 3, 'The course begins on the twenty-second of September.', '22 September', ['22 September', '22nd September', 'September 22', 'September 22nd', 'twenty-second September'], 'Dates: ordinal numbers (twenty-second) may be written 22nd or 22. Spell the month correctly.', ['number']);
  G('G06', 3, 'The tour leaves at a quarter past nine.', '9.15', ['9.15', '9:15', '09:15', '09.15', '9.15 am', '9:15 am', '9.15am', '9:15am'], '“A quarter past” means 15 minutes after the hour.', ['number']);
  G('G07', 3, 'The deposit is one hundred and fifty pounds.', '£150', ['£150', '150 pounds', '150', '£150.00'], 'In IELTS answers you can write the symbol (£) or the word, as long as the amount is right.', ['number']);
  G('G08', 4, 'There are two bathrooms and three bedrooms.', 'There are two bathrooms and three bedrooms.', ['There are 2 bathrooms and 3 bedrooms.'], 'Listen for the plural endings -s: bathrooms, bedrooms.', ['plural']);
  G('G09', 4, 'The lecture focused on photosynthesis and chlorophyll.', 'The lecture focused on photosynthesis and chlorophyll.', [], 'Academic terms: photo-syn-thesis (th, s) and chloro-phyll (ph).', ['academic']);
  G('G10', 4, 'The coach stops at Edinburgh, Gloucester and Leicester.', 'The coach stops at Edinburgh, Gloucester and Leicester.', [], 'British place names are often pronounced differently from their spelling: Gloucester /ˈɡlɒstə/ and Leicester /ˈlestə/.', ['name']);
  G('G11', 4, 'The guide recommended visiting the castle, the gardens and the harbour.', 'The guide recommended visiting the castle, the gardens and the harbour.', [], 'Listen for the word endings: recommended, visiting, gardens.', ['verb-ending', 'plural']);
  G('G12', 3, 'Your reference number is R, J, seven, four, nine, nine.', 'RJ7499', ['RJ7499', 'RJ 7499', 'R J 7 4 9 9'], 'Reference codes mix letters and digits. Capital letters are expected.', ['number']);
  G('G13', 4, 'Remember to bring a waterproof jacket and sturdy boots.', 'Remember to bring a waterproof jacket and sturdy boots.', [], 'Listen for compound words (waterproof) and the plural “boots”.', ['plural']);
  G('G14', 4, 'Participants must register before the twelfth of March.', 'Participants must register before the twelfth of March.', ['Participants must register before the 12th of March.', 'Participants must register before 12 March.'], 'Spell “participants” and “register” carefully; the date may be written as 12th March.', ['number']);

  /* H. Advanced academic dictation */
  S('H01', 'H', 6, 'The researchers hypothesised that prolonged exposure to noise would impair concentration. Participants who worked in open-plan offices reported higher levels of fatigue than those in private rooms, although the difference was less pronounced among employees accustomed to background sound.', 'British “hypothesised”; academic verbs; subordinate clauses.', ['verb-ending']);
  S('H02', 'H', 6, 'Critics of globalisation contend that multinational corporations undermine local industries, whereas supporters emphasise the benefits of lower prices and wider consumer choice. The evidence, however, is far from conclusive, and much depends on how governments regulate trade.', 'British -ise spelling; contrast with “whereas” and “however”.', ['verb-ending']);
  S('H03', 'H', 6, 'In coastal regions, rising sea levels have accelerated the erosion of beaches, threatening both biodiversity and tourism. Consequently, planners are exploring sustainable solutions, such as restoring mangrove forests, which absorb wave energy and provide habitat for numerous species.', 'Long noun phrases and participle clauses.', ['plural']);
  S('H04', 'H', 5, 'Advances in artificial intelligence have transformed the way organisations process information. Tasks that once required teams of analysts can now be completed within minutes, which has led some commentators to predict widespread unemployment.', 'Present perfect and plural nouns in an academic register.', ['plural', 'verb-ending']);

  IM.data.dictation = {
    categories: [
      { id: 'A', name: 'Single-word dictation', blurb: 'Silent letters, double consonants, vowel combinations and frequent spelling traps.' },
      { id: 'B', name: 'Similar-sounding words', blurb: 'Affect/effect, advice/advise and other pairs, heard in sentences.' },
      { id: 'C', name: 'Homophones in context', blurb: 'Their/there/they’re, its/it’s and other words that sound identical.' },
      { id: 'D', name: 'Commonly misspelled words', blurb: 'Words learners often get wrong, with spelling explanations.' },
      { id: 'E', name: 'Sentence dictation', blurb: 'Complete sentences: spelling, word order and punctuation.' },
      { id: 'F', name: 'Paragraph dictation', blurb: 'Short paragraphs on everyday and academic topics.' },
      { id: 'G', name: 'IELTS Listening answers', blurb: 'Names, addresses, phone numbers, postcodes, dates, times and prices.' },
      { id: 'H', name: 'Advanced academic dictation', blurb: 'Longer passages with complex sentences and academic vocabulary.' }
    ],
    items: items
  };
})();
