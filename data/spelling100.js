/* "100 Commonly Misspelled Words": study guide content integrated into the Dictation Laboratory as category S.
   Source list: 100_commonly_misspelled_words_study_guide.docx (word, common error, memory cue). The practice sentences were
   written for this application. One line per entry: word | common error | memory cue | practice sentence | accepted alternative spellings (; separated).
   Entries 6, 50, 77, 93 and 99 are dictated as whole sentences because the word only makes sense in context. */
window.IM = window.IM || {};
IM.data = IM.data || {};

(function () {
  const RAW = `
acceptable|acceptible|Standard spelling: acceptable.|Late work is not acceptable in this course.|
accidentally|accidently|Keep the -al from accidental.|She accidentally deleted the file.|
accommodate|accomodate|Double both c and m.|The hotel can accommodate two hundred guests.|
acquire|aquire|Keep the c after a.|Children acquire language quickly.|
acquit|aquit|Keep the c after a.|The jury voted to acquit the defendant.|
a lot|alot|Two separate words.|We learned a lot at the workshop.|
amateur|amature|Ends in -eur.|He is an amateur photographer.|
apparent|apparant|Double p, not r.|The reason for the delay was not apparent.|
argument|arguement|Drop the silent e from argue before -ment.|Her argument was clear and well supported.|
atheist|athiest|Remember a-the-ist.|He describes himself as an atheist.|
believe|beleive|Usually i before e here.|I believe the results are accurate.|
bellwether|bellweather|Wether is not weather.|The city is a bellwether for national trends.|
calendar|calender|Ends in -ar.|Mark the date on the calendar.|
category|catagory|The middle vowel is e.|Place each item in the correct category.|
cemetery|cemetary|Ends in -ery.|The old cemetery is near the church.|
changeable|changable|Keep the e in change before -able.|The weather here is very changeable.|
collectible|collectable|Collectible is a standard spelling.|The stamp is a rare collectible.|
column|colum|Keep the silent n.|Read the second column of the table.|
committed|commited|Double the final t before -ed.|She is committed to improving her English.|
conscience|concience|Keep the sc blend.|He had a guilty conscience.|
conscientious|consciencious|Notice both sc and ti.|A conscientious student reviews notes daily.|
conscious|concious|Keep sc; final vowels are i-o-u.|She was conscious of the noise.|
consensus|concensus|Do not add a c after con.|The committee reached a consensus.|
daiquiri|daquiri|Remember all three i's.|He ordered a strawberry daiquiri.|
definitely|definately|Related to definite; no a.|I will definitely attend the lecture.|
discipline|disipline|Keep the sc.|Learning a language takes discipline.|
drunkenness|drunkeness|Double n and s.|Public drunkenness is an offence.|
dumbbell|dumbell|Keep both b's.|She lifted a heavy dumbbell.|
embarrass|embarass|Double r and s.|Please do not embarrass your friends.|
equipment|equiptment|No extra t in the middle.|The laboratory has modern equipment.|
exhilarate|exilerate|Keep the h and both a's.|Fast rides exhilarate some people.|
exceed|excede|Ends in -ceed.|Costs must not exceed the budget.|
existence|existance|Use -ence.|Scientists debated its existence.|
experience|experiance|Remember the e's.|She has ten years of experience.|
fiery|firey|The r and e switch before y.|The speaker gave a fiery speech.|
foreign|foriegn|An exception to i-before-e.|He speaks three foreign languages.|
gauge|guage|Place a before u.|Use a gauge to measure the pressure.|
grateful|greatful|From gratitude, not great.|I am grateful for your help.|
guarantee|garantee|Remember the -uarantee sequence.|The shop offers a two-year guarantee.|
harass|harrass|Double only the final s.|It is illegal to harass colleagues.|
height|heigth|The i comes before g-h-t.|Measure the height of the wall.|
hierarchy|heirarchy|Keep the i after h.|The company has a clear hierarchy.|
humorous|humourous|Correct in US and UK English: humorous. The form humourous is not standard.|It was a humorous story.|
ignorance|ignorence|Related to ignorant; use -ance.|Ignorance of the law is no excuse.|
immediate|immedate|Double m and keep both i's.|The medicine had an immediate effect.|
independent|independant|Ends in -ent.|She is an independent thinker.|
indispensable|indispensible|Ends in -able.|A dictionary is indispensable for learners.|
inoculate|innoculate|One n.|Doctors inoculate children against measles.|
intelligence|inteligence|Double l; ends in -ence.|Intelligence can be developed through practice.|
its / it's|its'|Its = possession; it's = it is/it has.|The company changed its name because it's expanding.|
jewelry|jewelery|US spelling: jewelry. British spelling: jewellery (also accepted here).|She wears silver jewelry.|jewellery
judgment|judgement|Both forms occur; judgment is common in US English. Judgement (also accepted here) is common in British English.|Use your best judgment.|judgement
kernel|kernal|All vowels are e's.|The kernel of the nut is edible.|
leisure|liesure|Remember the ei sequence.|Reading is my favourite leisure activity.|
liaison|liason|Keep the a between the i's.|He acts as liaison between the departments.|
library|libary|Keep the first r after b.|The library closes at eight.|
license|lisence|US English: license (noun and verb). British English: licence (noun), also accepted here.|You need a license to drive.|licence
maintenance|maintainance|Correct spelling is maintenance.|Regular maintenance prevents breakdowns.|
maneuver|manuever|US spelling: maneuver. British spelling: manoeuvre (also accepted here).|The driver had to maneuver carefully.|manoeuvre
medieval|medevil|Remember the vowels.|We visited a medieval castle.|
memento|momento|A memento helps you remember.|She kept the ticket as a memento.|
millennium|millenium|Double l and double n.|The city celebrated the new millennium.|
miniature|minature|Keep the a: min-i-a-ture.|He builds miniature ships.|
minuscule|miniscule|Use minus as a memory cue.|The difference was minuscule.|
mischievous|mischievious|Ends in -ous.|The mischievous puppy chewed my shoe.|
misspell|mispell|Keep both s's.|Many people misspell this word.|
neighbor|neighbour|US spelling: neighbor. British spelling: neighbour (also accepted here).|My neighbor waved from the garden.|neighbour
noticeable|noticable|Keep the e to make c soft.|The improvement was noticeable.|
occasionally|ocassionally|Double c and double l.|We occasionally eat out.|
occurrence|occurence|Double c and double r; ends in -ence.|Floods are a common occurrence here.|
pastime|passtime|One s in pastime.|Chess is a relaxing pastime.|
perseverance|perseverence|Ends in -ance.|Success requires perseverance.|
personnel|personel|Two n's; distinguish from personal.|All personnel must wear badges.|
playwright|playwrite|A wright makes/builds; a writer writes.|The playwright attended the premiere.|
possession|posession|Two pairs of double s's.|He was found in possession of stolen goods.|
precede|preceed|Ends in -cede.|A short film will precede the main feature.|
principal|principle|Principal = head/main; principle = rule.|The principal explained the principle clearly.|
privilege|privelege|No d; check the vowel order.|Education is a privilege.|
pronunciation|pronounciation|The noun is pronunciation, not pronounciation.|Her pronunciation has improved.|
publicly|publically|Standard spelling is publicly.|The minister spoke publicly about the plan.|
questionnaire|questionaire|Double n and keep final e.|Please complete the questionnaire.|
receipt|reciept|The p is silent; i before e after c.|Keep the receipt as proof of purchase.|
recommend|reccommend|One c and double m.|I recommend this course.|
referred|refered|Double r before -ed.|She referred to the notes.|
reference|referance|Ends in -ence.|Include a reference to the source.|
relevant|relevent|Use -ant, not -ent.|Choose examples that are relevant.|
rhyme|rime|Remember the h, as in rhythm.|Write a short rhyme about spring.|
rhythm|rythm|Keep the h after r.|The drummer kept a steady rhythm.|
schedule|shedule|Begins with sch, as in school.|Check the schedule for the exam.|
separate|seperate|Remember there is an a in the middle.|Keep the two files separate.|
sergeant|sargent|The a appears in the final syllable.|The sergeant gave the order.|
supersede|supercede|The standard spelling uses -sede.|The new rule will supersede the old one.|
their / they're / there|thier|Their = belonging to them; they're = they are; there = place.|They're leaving their keys over there.|
threshold|threshhold|Avoid doubling h.|He paused at the threshold.|
twelfth|twelth|Keep the f.|My birthday is on the twelfth of May.|
tyranny|tyrany|Double n before y.|The people fought against tyranny.|
until|untill|One l at the end.|Wait here until I return.|
vacuum|vaccum|The u is doubled; c is not.|She used a vacuum to clean the carpet.|
weather / whether|wether|Weather = conditions; whether = choice/possibility.|I wonder whether the weather will improve.|
weird|wierd|An exception to i-before-e.|It was a weird coincidence.|
`;
  const SENTENCE_ENTRIES = new Set([6, 50, 77, 93, 99]);
  const guide = [];
  const items = [];
  RAW.split('\n').map(l => l.trim()).filter(Boolean).forEach((line, idx) => {
    const f = line.split('|');
    if (f.length !== 5) { console.warn('spelling100: bad line', idx + 1); return; }
    const n = idx + 1;
    const entry = f[0], error = f[1], cue = f[2], sentence = f[3], alt = f[4];
    const id = 'S' + String(n).padStart(3, '0');
    const sentenceMode = SENTENCE_ENTRIES.has(n);
    const text = sentenceMode ? sentence : entry;
    const tags = /double|two pairs/i.test(cue) ? ['double-letter'] : /silent/i.test(cue) ? ['silent-letter'] : /i before e|ei|ie|vowel|sequence|a between|ends in/i.test(cue) ? ['vowel-combo'] : ['spelling-other'];
    guide.push({ n, id, entry, error, cue, sentence });
    items.push({
      id, cat: 'S', level: entry.length <= 6 ? 3 : entry.length <= 9 ? 4 : 5,
      say: sentenceMode ? sentence : entry + '. ' + sentence + ' ' + entry + '.',
      text, hint: '', note: 'Common error: “' + error + '”. Memory cue: ' + cue,
      tags, focus: sentenceMode ? [] : [entry.toLowerCase()], accept: alt ? alt.split(';').map(a => a.trim()) : [], mode: 'text', guideN: n
    });
  });

  IM.data.spelling100 = { guide, count: guide.length };
  IM.data.dictation.items.push.apply(IM.data.dictation.items, items);
  IM.data.dictation.categories.push({ id: 'S', name: '100 Commonly Misspelled Words (study guide)', blurb: 'Your study-guide list: hear each word in a sentence, type it, and see the common error and memory cue.' });
})();
