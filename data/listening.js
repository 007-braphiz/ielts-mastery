/* Listening practice content (original practice material, not official IELTS material).
   The starter audio is synthetic text-to-speech unless a recording is supplied in `audio` for a section.
   Question groups: completion (template with [[n]] blanks), mcq, match (options + items), tfng, ynng.
   Answer values: completion → array of accepted answers; mcq/match → option letter. */
window.IM = window.IM || {};
IM.data = IM.data || {};

IM.data.listening = {
  testMeta: { questions: 40, sections: 4 },
  tests: [
    {
      id: 'L1',
      title: 'Practice Test 1',
      sections: [
        {
          n: 1,
          title: 'Section 1: Joining a sports centre',
          context: 'A conversation between a receptionist and a woman who wants to join a sports centre.',
          audio: null,
          transcript: [
            { sp: 'N', text: 'Section 1. You will hear a woman joining a sports centre.' },
            { sp: 'A', text: 'Good morning, Riverside Sports Centre. How can I help you?' },
            { sp: 'B', text: 'Hello. I would like to join the centre, please.' },
            { sp: 'A', text: 'Of course. I will just take a few details. Can I have your full name?' },
            { sp: 'B', text: 'Yes. It is Priya Venkataraman. That is V, E, N, K, A, T, A, R, A, M, A, N.' },
            { sp: 'A', text: 'Thank you. And what is your address?' },
            { sp: 'B', text: 'Flat 9, 27 Beckford Road.' },
            { sp: 'A', text: 'Is that Beckford with a B?' },
            { sp: 'B', text: 'That is right. B, E, C, K, F, O, R, D.' },
            { sp: 'A', text: 'And your postcode?' },
            { sp: 'B', text: 'It is M, one four, six Q T.' },
            { sp: 'A', text: 'Thank you. And a contact number?' },
            { sp: 'B', text: 'My mobile is oh seven eight one two, four four nine, six one five.' },
            { sp: 'A', text: 'Great. Now, which membership would you like? We have a standard membership at forty-five pounds a month, which includes the gym and all classes. The premium membership includes the swimming pool and costs fifty-eight pounds a month.' },
            { sp: 'B', text: 'Oh, I would like to swim as well. Then I will take the premium one, please.' },
            { sp: 'A', text: 'Lovely. When would you like to start? We have a place on Monday the ninth of March.' },
            { sp: 'B', text: 'That is a bit soon. Is the sixteenth possible?' },
            { sp: 'A', text: 'The sixteenth, yes, that is a Monday. That is fine. Every new member has a free induction session. It is usually at nine, but on Mondays it starts at ten thirty.' },
            { sp: 'B', text: 'Ten thirty, that is fine. I want to build up my fitness because I am running a half marathon in June. My friends keep telling me the centre is a good way to meet people, but really I just need to train.' },
            { sp: 'A', text: 'Good luck with the race! For the induction, please meet me at the fitness studio, not at reception.' },
            { sp: 'B', text: 'The fitness studio. Thank you very much.' }
          ],
          groups: [
            {
              type: 'completion', label: 'Form completion', range: [1, 6],
              instruction: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
              template: `<table class="qform"><caption>Riverside Sports Centre – Membership form</caption>
<tr><th>Name</th><td>Priya [[1]]</td></tr>
<tr><th>Address</th><td>Flat 9, 27 [[2]] Road</td></tr>
<tr><th>Postcode</th><td>M14 [[3]]</td></tr>
<tr><th>Mobile</th><td>07812 [[4]]</td></tr>
<tr><th>Membership type</th><td>[[5]]</td></tr>
<tr><th>Monthly cost</th><td>£ [[6]]</td></tr></table>`,
              items: [
                { n: 1, a: ['Venkataraman'], ex: 'The surname is spelled out: V-E-N-K-A-T-A-R-A-M-A-N.' },
                { n: 2, a: ['Beckford'], ex: 'The speaker spells it: B-E-C-K-F-O-R-D.' },
                { n: 3, a: ['6QT', '6 QT'], ex: '“Six Q T”: the inward part of the postcode is 6QT.' },
                { n: 4, a: ['449 615', '449615'], ex: 'The mobile number continues “four four nine, six one five”.' },
                { n: 5, a: ['premium'], ex: 'She hears both options but chooses the premium one because she wants to swim.' },
                { n: 6, a: ['58', 'fifty-eight', 'fifty eight'], ex: 'Premium costs £58 a month. £45 is the standard price (a distractor).' }
              ]
            },
            {
              type: 'completion', label: 'Short-answer questions', range: [7, 8],
              instruction: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
              template: `<ul class="qlist"><li>7&nbsp; She will start on the [[7]] of March.</li><li>8&nbsp; The induction session starts at [[8]] on Mondays.</li></ul>`,
              items: [
                { n: 7, a: ['16', '16th', 'sixteenth', 'sixteen'], ex: 'The ninth is offered first, but she asks for the sixteenth and it is confirmed.' },
                { n: 8, a: ['10.30', '10:30', '10.30 am', '10:30 am', '10.30am', '10:30am', 'ten thirty', 'half past ten'], ex: 'It is usually at nine, but on Mondays it starts at ten thirty.' }
              ]
            },
            {
              type: 'mcq', label: 'Multiple choice', range: [9, 10],
              instruction: 'Choose the correct letter, A, B or C.',
              items: [
                { n: 9, q: 'Why does the woman want to join the centre?', opts: ['to lose weight', 'to prepare for a sporting event', 'to make new friends'], a: 'B', ex: 'She is training for a half marathon. Meeting people is mentioned only as what her friends say.' },
                { n: 10, q: 'Where will the induction session begin?', opts: ['at reception', 'in the fitness studio', 'by the swimming pool'], a: 'B', ex: 'The receptionist says: “meet me at the fitness studio, not at reception”.' }
              ]
            }
          ]
        },
        {
          n: 2,
          title: 'Section 2: A community arts centre',
          context: 'A guide welcomes visitors to the Harbourside Arts Centre.',
          audio: null,
          transcript: [
            { sp: 'N', text: 'Section 2. You will hear a guide welcoming visitors to a community arts centre.' },
            { sp: 'A', text: 'Good afternoon, everyone, and welcome to Harbourside Arts Centre. I am going to tell you a little about the centre, and then show you around.' },
            { sp: 'A', text: 'Many people assume the building was once a school, but it was actually a grain warehouse, built in the nineteenth century. It stood empty for years before the community bought it.' },
            { sp: 'A', text: 'Today the centre is a charity. You might think it is funded by the government, but grants cover only a small part of our costs. Ticket sales help too, but our main source of income is sponsorship from local businesses.' },
            { sp: 'A', text: 'We rely heavily on volunteers. We already have plenty of people willing to guide visitors, and the café is fully staffed. What we most urgently need are people to help run the children’s workshops at weekends.' },
            { sp: 'A', text: 'Now, let us look at the plan of the ground floor. We are standing at the main entrance at the bottom of the plan. Straight ahead is reception. To the left of reception you will find the gallery, which displays work by local artists. Behind the gallery, in the top left-hand corner, is the pottery studio, where classes run every day. Directly opposite the gallery, on the right of reception, is the café. It has a lovely view of the harbour. At the back of the building, in the middle, is the theatre, which seats about one hundred and twenty people. The room in the top right corner is the staff office, which is not open to visitors, and the small room by the entrance on the right is our shop.' },
            { sp: 'A', text: 'Guided tours run every Thursday at two o’clock. They used to be on Tuesdays, but we changed the day last month.' },
            { sp: 'A', text: 'Tickets for the autumn exhibition are usually fifteen pounds for adults, but until the end of the month you can buy them for twelve pounds.' },
            { sp: 'A', text: 'One last thing. The café only accepts payment by card, so please do not worry about bringing cash. Right, if you would like to follow me, we will start in the gallery.' }
          ],
          groups: [
            {
              type: 'mcq', label: 'Multiple choice', range: [11, 13],
              instruction: 'Choose the correct letter, A, B or C.',
              items: [
                { n: 11, q: 'The building was originally', opts: ['a grain warehouse.', 'a school.', 'a railway station.'], a: 'A', ex: 'The guide corrects the common assumption: it was a grain warehouse, not a school.' },
                { n: 12, q: 'Most of the centre’s income comes from', opts: ['government grants.', 'ticket sales.', 'local business sponsorship.'], a: 'C', ex: 'Grants cover only a small part and tickets “help”, but sponsorship is the main source.' },
                { n: 13, q: 'The centre most urgently needs volunteers to', opts: ['guide visitors.', 'work in the café.', 'help with children’s workshops.'], a: 'C', ex: 'Guides and café staff are already sufficient; workshops are the urgent need.' }
              ]
            },
            {
              type: 'match', label: 'Map labelling', range: [14, 17],
              instruction: 'Label the map. Write the correct letter, A–F, next to each room.',
              figure: `<svg viewBox="0 0 400 320" class="fig-map" role="img" aria-label="Plan of the ground floor of the arts centre with rooms labelled A to F">
<rect x="10" y="10" width="380" height="290" fill="none" stroke="currentColor" stroke-width="3"/>
<rect x="20" y="20" width="120" height="100" fill="none" stroke="currentColor"/><text x="80" y="76" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">A</text>
<rect x="150" y="20" width="100" height="100" fill="none" stroke="currentColor"/><text x="200" y="76" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">B</text>
<rect x="260" y="20" width="120" height="100" fill="none" stroke="currentColor"/><text x="320" y="76" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">C</text>
<rect x="20" y="130" width="120" height="100" fill="none" stroke="currentColor"/><text x="80" y="186" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">D</text>
<rect x="150" y="130" width="100" height="100" fill="none" stroke="currentColor" stroke-dasharray="4 3"/><text x="200" y="186" text-anchor="middle" font-size="16" fill="currentColor">Reception</text>
<rect x="260" y="130" width="120" height="100" fill="none" stroke="currentColor"/><text x="320" y="186" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">E</text>
<rect x="260" y="240" width="120" height="50" fill="none" stroke="currentColor"/><text x="320" y="274" text-anchor="middle" font-size="24" font-weight="700" fill="currentColor">F</text>
<path d="M170 300 L170 240 M230 300 L230 240" stroke="currentColor" stroke-width="1" fill="none"/>
<text x="200" y="316" text-anchor="middle" font-size="14" fill="currentColor">▲ MAIN ENTRANCE</text></svg>`,
              options: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['E', 'E'], ['F', 'F']],
              items: [
                { n: 14, q: 'Gallery', a: 'D', ex: '“To the left of reception you will find the gallery.”' },
                { n: 15, q: 'Café', a: 'E', ex: '“Directly opposite the gallery, on the right of reception, is the café.”' },
                { n: 16, q: 'Pottery studio', a: 'A', ex: '“Behind the gallery, in the top left-hand corner.”' },
                { n: 17, q: 'Theatre', a: 'B', ex: '“At the back of the building, in the middle.” C is the staff office and F is the shop (not asked).' }
              ]
            },
            {
              type: 'completion', label: 'Sentence completion', range: [18, 20],
              instruction: 'Complete the sentences. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
              template: `<ul class="qlist"><li>18&nbsp; Guided tours take place every [[18]] at 2 pm.</li><li>19&nbsp; Tickets for the autumn exhibition cost £[[19]] for adults at the moment.</li><li>20&nbsp; The café accepts payment by [[20]] only.</li></ul>`,
              items: [
                { n: 18, a: ['Thursday', 'Thursdays'], ex: 'Tours used to be on Tuesdays but the day changed to Thursday.' },
                { n: 19, a: ['12', 'twelve'], ex: 'The usual price is £15, but until the end of the month it is £12.' },
                { n: 20, a: ['card', 'cards'], ex: '“The café only accepts payment by card.”' }
              ]
            }
          ]
        },
        {
          n: 3,
          title: 'Section 3: Planning a group project',
          context: 'Two students discuss a group project with their tutor.',
          audio: null,
          transcript: [
            { sp: 'N', text: 'Section 3. You will hear two students, Maya and Tom, discussing a group project with their tutor, Dr Hale.' },
            { sp: 'A', text: 'Good morning, both. So, you have chosen urban agriculture as the topic for your group project. Let us plan who is going to do what.' },
            { sp: 'B', text: 'I would like to write the introduction, if that is all right. I have already read most of the background articles.' },
            { sp: 'C', text: 'That is fine by me. I will contact the rooftop farm in the city centre, because I know the manager.' },
            { sp: 'A', text: 'Good. And what about the questionnaire?' },
            { sp: 'B', text: 'I think we should design it together. It needs to be short but still useful.' },
            { sp: 'C', text: 'Agreed. We can do it together.' },
            { sp: 'A', text: 'And who will analyse the results?' },
            { sp: 'C', text: 'I did a statistics module last year, so I will do the analysis.' },
            { sp: 'B', text: 'That is a relief. I am hopeless with spreadsheets.' },
            { sp: 'A', text: 'Finally, someone needs to edit the final report before you hand it in.' },
            { sp: 'C', text: 'I am not very good at proofreading.' },
            { sp: 'B', text: 'Then I will do the editing. I enjoy checking the references and grammar.' },
            { sp: 'A', text: 'Excellent. Now let me explain the research process I would like you to follow. First, read the background articles on the library’s online database. Please do not just use the books on the shelves, because the articles are more up to date. Next, design your questionnaire, and then test it on five of your classmates before using it with the public. After that, visit the farm, and finally hand out the questionnaires at the weekend market.' },
            { sp: 'C', text: 'That sounds clear. Is there anything we should be careful about?' },
            { sp: 'A', text: 'My main worry is that the topic is very broad, so you will need to narrow it down. The deadline of the fifth of December is quite generous, so time is not the problem.' },
            { sp: 'B', text: 'Should we make a poster to present our findings?' },
            { sp: 'C', text: 'A poster would be quicker, but I think departments prefer a presentation.' },
            { sp: 'A', text: 'That is right. A short presentation with slides is what the department expects.' },
            { sp: 'B', text: 'Then let us use slides.' }
          ],
          groups: [
            {
              type: 'match', label: 'Matching', range: [21, 25],
              instruction: 'Who will do each task? Choose A, B or C.',
              options: [['A', 'Maya'], ['B', 'Tom'], ['C', 'Both Maya and Tom']],
              items: [
                { n: 21, q: 'Writing the introduction', a: 'A', ex: 'Maya: “I would like to write the introduction.”' },
                { n: 22, q: 'Contacting the farm', a: 'B', ex: 'Tom: “I will contact the rooftop farm.”' },
                { n: 23, q: 'Designing the questionnaire', a: 'C', ex: 'Maya suggests doing it together and Tom agrees.' },
                { n: 24, q: 'Analysing the results', a: 'B', ex: 'Tom did a statistics module, so he will analyse the data.' },
                { n: 25, q: 'Editing the final report', a: 'A', ex: 'Tom is weak at proofreading, so Maya will edit.' }
              ]
            },
            {
              type: 'completion', label: 'Flow-chart completion', range: [26, 28],
              instruction: 'Complete the flow-chart. Write ONE WORD ONLY for each answer.',
              template: `<div class="flow"><div class="flow-box">Read background articles on the library’s [[26]]</div><div class="flow-arrow">↓</div><div class="flow-box">Design the questionnaire</div><div class="flow-arrow">↓</div><div class="flow-box">Test it on five [[27]]</div><div class="flow-arrow">↓</div><div class="flow-box">Visit the rooftop farm</div><div class="flow-arrow">↓</div><div class="flow-box">Hand out questionnaires at the weekend [[28]]</div></div>`,
              items: [
                { n: 26, a: ['database'], ex: '“Read the background articles on the library’s online database.” Books on shelves are rejected.' },
                { n: 27, a: ['classmates'], ex: '“Test it on five of your classmates before using it with the public.”' },
                { n: 28, a: ['market'], ex: '“Finally hand out the questionnaires at the weekend market.”' }
              ]
            },
            {
              type: 'mcq', label: 'Multiple choice', range: [29, 30],
              instruction: 'Choose the correct letter, A, B or C.',
              items: [
                { n: 29, q: 'What is the tutor’s main concern about the project?', opts: ['The sample size may be too small.', 'The deadline is too close.', 'The topic is too broad.'], a: 'C', ex: 'The tutor says the topic is very broad. She explicitly says time is not the problem.' },
                { n: 30, q: 'How will the students present their findings?', opts: ['on a poster', 'in a short film', 'in a slide presentation'], a: 'C', ex: 'A poster is suggested but the department expects a presentation with slides, and they agree on slides.' }
              ]
            }
          ]
        },
        {
          n: 4,
          title: 'Section 4: Urban heat islands',
          context: 'A university lecture about why city centres are warmer than the countryside.',
          audio: null,
          transcript: [
            { sp: 'N', text: 'Section 4. You will hear a lecture about urban heat islands.' },
            { sp: 'A', text: 'Today I would like to talk about urban heat islands. This term describes the way in which city centres are often noticeably warmer than the countryside around them, sometimes by as much as five degrees.' },
            { sp: 'A', text: 'There are three main causes. First, building materials. Concrete and asphalt absorb heat during the day and release it slowly at night, which keeps cities warm after sunset. Second, a lack of vegetation. Trees cool the air through evaporation, but in dense city centres there are very few of them. And third, waste heat. Vehicles produce heat, but the biggest contributor is air conditioning, which pushes hot air out of buildings into the street.' },
            { sp: 'A', text: 'What are the effects? Well, firstly, people use more electricity in summer to keep cool. Secondly, there are health risks, particularly for elderly people, who find it harder to cope with high temperatures. And thirdly, hot weather speeds up chemical reactions in the air, increasing the level of ozone at ground level, which is harmful to breathe.' },
            { sp: 'A', text: 'So what can be done? Let me go through three strategies. The first is the green roof: planting vegetation on roofs, which also helps with rainwater. The second is what we call a cool roof. This simply means painting the roof white, so that it reflects sunlight. In small trials, this lowered indoor temperatures by around three degrees. The third is street trees, which provide shade. Some trials suggest they can lower pavement temperatures by up to ten degrees. Of all of these, the cheapest per unit of cooling is planting trees. These figures come from small trials, so please treat them as indicative rather than definitive.' },
            { sp: 'A', text: 'For next week’s seminar, I would like you to read about urban water features, such as fountains and ponds, and decide whether they are as effective as trees.' }
          ],
          groups: [
            {
              type: 'completion', label: 'Note completion', range: [31, 36],
              instruction: 'Complete the notes. Write ONE WORD OR TWO WORDS for each answer.',
              template: `<div class="notes"><h4>Urban heat islands</h4><p>City centres can be up to 5 degrees warmer than the countryside.</p><h5>Causes</h5><ul><li>buildings made of concrete and [[31]] absorb heat</li><li>few plants: trees cool the air through [[32]]</li><li>waste heat from vehicles and [[33]]</li></ul><h5>Effects</h5><ul><li>higher use of [[34]] in summer</li><li>greater health risk for [[35]] people</li><li>increased levels of [[36]] at ground level</li></ul></div>`,
              items: [
                { n: 31, a: ['asphalt'], ex: '“Concrete and asphalt absorb heat during the day.”' },
                { n: 32, a: ['evaporation'], ex: '“Trees cool the air through evaporation.”' },
                { n: 33, a: ['air conditioning', 'air-conditioning'], ex: '“The biggest contributor is air conditioning.”' },
                { n: 34, a: ['electricity'], ex: '“People use more electricity in summer to keep cool.”' },
                { n: 35, a: ['elderly'], ex: '“Health risks, particularly for elderly people.”' },
                { n: 36, a: ['ozone'], ex: '“Increasing the level of ozone at ground level.”' }
              ]
            },
            {
              type: 'completion', label: 'Table completion', range: [37, 38],
              instruction: 'Complete the table. Write ONE WORD AND/OR A NUMBER for each answer.',
              template: `<table class="qform"><tr><th>Strategy</th><th>What it involves</th><th>Reported effect</th></tr>
<tr><td>Green roof</td><td>planting vegetation on roofs</td><td>helps manage rainwater</td></tr>
<tr><td>Cool roof</td><td>painting roofs [[37]]</td><td>lowers indoor temperatures by about [[38]] degrees</td></tr>
<tr><td>Street trees</td><td>providing shade</td><td>pavements up to 10 degrees cooler</td></tr></table>`,
              items: [
                { n: 37, a: ['white'], ex: '“Painting the roof white, so that it reflects sunlight.”' },
                { n: 38, a: ['3', 'three'], ex: '“Lowered indoor temperatures by around three degrees.” The ten-degree figure belongs to street trees.' }
              ]
            },
            {
              type: 'completion', label: 'Sentence completion', range: [39, 40],
              instruction: 'Complete the sentences. Write NO MORE THAN TWO WORDS for each answer.',
              template: `<ul class="qlist"><li>39&nbsp; The cheapest way to cool a city is planting [[39]].</li><li>40&nbsp; For the seminar, students should read about urban [[40]].</li></ul>`,
              items: [
                { n: 39, a: ['trees'], ex: '“The cheapest per unit of cooling is planting trees.”' },
                { n: 40, a: ['water features'], ex: '“Read about urban water features, such as fountains and ponds.”' }
              ]
            }
          ]
        }
      ]
    }
  ],

  /* Short clip used by the diagnostic assessment. */
  diagnostic: {
    title: 'Diagnostic listening clip',
    transcript: [
      { sp: 'N', text: 'You will hear a station announcement.' },
      { sp: 'A', text: 'Attention, passengers. The fourteen twenty train to Manchester has been delayed by twenty-five minutes and will now depart from platform six instead of platform two. Passengers for Stockport should change at Piccadilly. We apologise for the inconvenience.' }
    ],
    groups: [
      {
        type: 'completion', label: 'Note completion',
        instruction: 'Complete the notes. Write ONE WORD OR A NUMBER for each answer.',
        template: `<ul class="qlist"><li>1&nbsp; The delay is [[1]] minutes.</li><li>2&nbsp; The train now leaves from platform [[2]].</li><li>3&nbsp; Passengers for Stockport should change at [[3]].</li></ul>`,
        items: [
          { n: 1, a: ['25', 'twenty-five', 'twenty five'], ex: '“Delayed by twenty-five minutes.”' },
          { n: 2, a: ['6', 'six'], ex: 'The new platform is six; platform two was the old one.' },
          { n: 3, a: ['Piccadilly'], ex: '“Passengers for Stockport should change at Piccadilly.”' }
        ]
      }
    ]
  }
};
