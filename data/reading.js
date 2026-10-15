/* Reading practice content (original practice texts written for this application).
   Some details in the passages are illustrative and are not intended as authoritative factual sources.
   Passage lengths are shorter than real IELTS passages; see the README for honest coverage notes. */
window.IM = window.IM || {};
IM.data = IM.data || {};

(function () {
  const TFNG = [['TRUE', 'TRUE'], ['FALSE', 'FALSE'], ['NOT GIVEN', 'NOT GIVEN']];
  const YNNG = [['YES', 'YES'], ['NO', 'NO'], ['NOT GIVEN', 'NOT GIVEN']];

  const academic = {
    id: 'RA1',
    title: 'Academic Reading Practice Test 1',
    minutes: 60,
    passages: [
      {
        n: 1,
        title: 'The Rise of the Green Roof',
        paragraphs: [
          { k: '', t: 'Walk across the rooftops of a modern European city and you may be surprised by how many of them are covered with plants. Green roofs, as they are known, were once associated mainly with Scandinavian farmhouses, whose turf roofs provided insulation against harsh winters. Today, however, they are being installed on offices, schools and apartment blocks for a very different set of reasons.' },
          { k: '', t: 'The most obvious benefit is the management of rainwater. In a conventional city, rain runs quickly off hard surfaces into drains, and during heavy storms the drainage system can be overwhelmed, causing floods. A green roof absorbs a large share of the rainfall, releasing it slowly or returning it to the atmosphere through evaporation. Some studies in Germany, where the technology has been used widely since the 1980s, suggest that a typical roof of this kind retains more than half of the annual rainfall.' },
          { k: '', t: 'Green roofs also affect the temperature of buildings. Vegetation shades the roof surface and cools the surrounding air, so a building with a green roof usually needs less air conditioning in summer and less heating in winter. Researchers in several cities have reported that the saving in energy costs can be substantial, although the exact figures vary according to climate and the thickness of the planted layer.' },
          { k: '', t: 'Installing a green roof is not simple, however. The process begins with a structural survey, because a saturated roof can weigh far more than a conventional one, and some older buildings cannot support the load. If the building passes this check, a waterproof membrane is laid over the roof deck, followed by a root barrier to prevent plants from damaging the membrane. A drainage layer is then added so that surplus water can escape, and above it goes a filter fabric, which stops soil particles from blocking the drains. Only then is the growing medium spread and the plants introduced, usually in the form of mats of low-growing sedum.' },
          { k: '', t: 'Cost remains the main obstacle. A green roof can be several times more expensive than a standard roof to install, and it requires regular maintenance, mostly weeding and occasional watering during dry spells. Advocates argue that the higher initial cost is partly offset by a longer roof life, since the plants protect the membrane from sunlight and temperature extremes. Critics, however, point out that few long-term studies have confirmed this claim.' },
          { k: '', t: 'Some cities have decided not to wait for the evidence. In Copenhagen, for instance, new buildings with flat roofs must by law include vegetation, and other cities are considering similar rules. Whether such requirements are wise is still debated, but the number of green roofs worldwide continues to grow.' }
        ],
        groups: [
          {
            type: 'tfng', label: 'True / False / Not Given', range: [1, 4], options: TFNG,
            instruction: 'Do the following statements agree with the information in the passage? Choose TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if there is no information.',
            items: [
              { n: 1, q: 'Early green roofs in Scandinavia were mainly decorative.', a: 'FALSE', ex: 'Evidence: “turf roofs provided insulation against harsh winters”. The purpose was insulation, so the statement contradicts the text.' },
              { n: 2, q: 'Green roofs can help to prevent flooding in cities.', a: 'TRUE', ex: 'Evidence: drains can be overwhelmed “causing floods”; a green roof “absorbs a large share of the rainfall”.' },
              { n: 3, q: 'Green roofs have been shown to reduce energy bills by a fixed percentage.', a: 'FALSE', ex: 'Evidence: “the exact figures vary according to climate and the thickness of the planted layer”. A fixed percentage contradicts “vary”.' },
              { n: 4, q: 'Most green roofs in Germany are installed on schools.', a: 'NOT GIVEN', ex: 'Germany is mentioned only for rainwater studies. The text does not say what types of building have green roofs there.' }
            ]
          },
          {
            type: 'completion', label: 'Sentence completion', range: [5, 6],
            instruction: 'Complete the sentences. Write NO MORE THAN TWO WORDS from the passage for each answer.',
            template: '<ul class="qlist"><li>5&nbsp; Before installation, a building must have a [[5]] to check that it can support the weight.</li><li>6&nbsp; A [[6]] prevents soil particles from blocking the drains.</li></ul>',
            items: [
              { n: 5, a: ['structural survey'], ex: 'Evidence: “The process begins with a structural survey, because a saturated roof can weigh far more”.' },
              { n: 6, a: ['filter fabric'], ex: 'Evidence: “a filter fabric, which stops soil particles from blocking the drains”.' }
            ]
          },
          {
            type: 'completion', label: 'Short-answer questions', range: [7, 8],
            instruction: 'Answer the questions. Write ONE WORD ONLY from the passage for each answer.',
            template: '<ul class="qlist"><li>7&nbsp; Which type of plant is usually grown on green roofs? [[7]]</li><li>8&nbsp; What is the main obstacle to wider use of green roofs? [[8]]</li></ul>',
            items: [
              { n: 7, a: ['sedum'], ex: 'Evidence: “usually in the form of mats of low-growing sedum”.' },
              { n: 8, a: ['cost'], ex: 'Evidence: “Cost remains the main obstacle.”' }
            ]
          },
          {
            type: 'completion', label: 'Note completion', range: [9, 10],
            instruction: 'Complete the notes. Write NO MORE THAN TWO WORDS from the passage for each answer.',
            template: '<div class="notes"><h5>Advantages of green roofs</h5><ul><li>absorb rain and release it slowly or return it to the air through [[9]]</li><li>reduce the need for [[10]] in summer</li></ul></div>',
            items: [
              { n: 9, a: ['evaporation'], ex: 'Evidence: “returning it to the atmosphere through evaporation”.' },
              { n: 10, a: ['air conditioning', 'air-conditioning'], ex: 'Evidence: “needs less air conditioning in summer”.' }
            ]
          },
          {
            type: 'completion', label: 'Flow-chart completion', range: [11, 13],
            instruction: 'Complete the flow-chart. Write NO MORE THAN TWO WORDS from the passage for each answer.',
            template: '<div class="flow"><div class="flow-box">Structural survey</div><div class="flow-arrow">↓</div><div class="flow-box">A [[11]] is laid over the roof deck</div><div class="flow-arrow">↓</div><div class="flow-box">Root barrier added</div><div class="flow-arrow">↓</div><div class="flow-box">A [[12]] layer is added</div><div class="flow-arrow">↓</div><div class="flow-box">Filter fabric added</div><div class="flow-arrow">↓</div><div class="flow-box">The [[13]] is spread and plants are introduced</div></div>',
            items: [
              { n: 11, a: ['waterproof membrane'], ex: 'Evidence: “a waterproof membrane is laid over the roof deck”.' },
              { n: 12, a: ['drainage'], ex: 'Evidence: “A drainage layer is then added so that surplus water can escape”.' },
              { n: 13, a: ['growing medium'], ex: 'Evidence: “Only then is the growing medium spread”.' }
            ]
          }
        ]
      },
      {
        n: 2,
        title: 'Rethinking the Working Week',
        paragraphs: [
          { k: 'A', t: 'For most of human history, the length of the working day was set by daylight and the seasons. The Industrial Revolution changed this, and by the middle of the nineteenth century factory employees in many countries were working twelve hours a day, six days a week. Trade unions and reformers campaigned for shorter hours, and in 1926 the car manufacturer Henry Ford announced that his factories would operate a five-day, forty-hour week, a decision that many other employers gradually copied.' },
          { k: 'B', t: 'Almost a century later, the five-day week is being questioned again. In recent years, trials of a four-day week have taken place in several countries, including Iceland and the United Kingdom. In a typical trial, employees were paid the same salary for working roughly eighty per cent of their usual hours. Organisers reported that productivity was maintained or even improved, and that workers described lower stress and a better balance between work and family life.' },
          { k: 'C', t: 'Not everyone is convinced. Some employers point out that a shorter week is far easier to arrange in an office than in a hospital, a supermarket or a factory, where services must be provided every day. Others fear that, in jobs that cannot be shortened, staff might simply be asked to fit the same tasks into four longer days, which could leave them more exhausted rather than less.' },
          { k: 'D', t: 'There may also be benefits for the environment. If employees commute one day fewer each week, there are fewer journeys by car and train, and offices use less energy for heating and lighting. One estimate suggested that a nationwide four-day week could reduce carbon emissions by several million tonnes a year, although the calculation depends on assumptions about how people would spend their extra free day.' },
          { k: 'E', t: 'Technology complicates the picture. Email and messaging applications allow staff to be reached at almost any hour, and many workers feel unable to switch off even when they are officially on holiday. In response, some governments have introduced a “right to disconnect”, which allows employees to ignore work messages outside their contracted hours. France, for example, passed legislation of this kind in 2017.' },
          { k: 'F', t: 'Whether the four-day week becomes the new standard will depend on evidence from a much wider range of workplaces. Trials so far have mostly involved volunteer companies, which may be more enthusiastic than the average employer. Until larger and longer studies are completed, it would be unwise to assume that the model will suit every industry, but it would equally be a mistake to dismiss it.' }
        ],
        groups: [
          {
            type: 'match', label: 'Matching headings', range: [14, 18],
            instruction: 'The passage has six paragraphs, A–F. Choose the correct heading for paragraphs A–E from the list of headings.',
            options: [['i', 'A challenge for service industries'], ['ii', 'The origins of the standard week'], ['iii', 'Possible benefits for the environment'], ['iv', 'Pilot schemes and their results'], ['v', 'The impact of digital communication on rest'], ['vi', 'Why workers resist change'], ['vii', 'A cautious view of the future'], ['viii', 'Falling wages in the modern economy']],
            items: [
              { n: 14, q: 'Paragraph A', a: 'ii', ex: 'The paragraph traces how long working days developed and how the five-day week began (Ford, 1926).' },
              { n: 15, q: 'Paragraph B', a: 'iv', ex: 'It describes four-day-week trials and what organisers reported.' },
              { n: 16, q: 'Paragraph C', a: 'i', ex: 'It explains why hospitals, supermarkets and factories find a shorter week difficult.' },
              { n: 17, q: 'Paragraph D', a: 'iii', ex: 'It is about fewer commuting journeys and lower emissions.' },
              { n: 18, q: 'Paragraph E', a: 'v', ex: 'It discusses email, messaging and the “right to disconnect”.' }
            ]
          },
          {
            type: 'match', label: 'Matching information', range: [19, 22],
            instruction: 'Which paragraph contains the following information? Choose the correct letter, A–F. You may use any letter more than once.',
            options: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['E', 'E'], ['F', 'F']],
            items: [
              { n: 19, q: 'a law that protects employees’ time away from work', a: 'E', ex: 'Evidence: “a ‘right to disconnect’ … France … passed legislation of this kind in 2017”.' },
              { n: 20, q: 'a decision by a manufacturer to reduce working hours in the 1920s', a: 'A', ex: 'Evidence: “in 1926 the car manufacturer Henry Ford announced … a five-day, forty-hour week”.' },
              { n: 21, q: 'an explanation of why some jobs cannot easily be reorganised', a: 'C', ex: 'Evidence: services in hospitals and supermarkets “must be provided every day”.' },
              { n: 22, q: 'a report on how productivity was affected by shorter hours', a: 'B', ex: 'Evidence: “productivity was maintained or even improved”.' }
            ]
          },
          {
            type: 'mcq', label: 'Multiple choice', range: [23, 26],
            instruction: 'Choose the correct letter, A, B, C or D.',
            items: [
              { n: 23, q: 'In paragraph B, the workers who took part in the trials', opts: ['received lower pay.', 'reported feeling less stressed.', 'worked longer hours each day.', 'had fewer days of holiday.'], a: 'B', ex: 'Evidence: workers “described lower stress”. Pay stayed the same.' },
              { n: 24, q: 'In paragraph C, some employers are worried that a four-day week might', opts: ['be too expensive to arrange.', 'make staff more tired.', 'force hospitals to close.', 'reduce supermarket sales.'], a: 'B', ex: 'Evidence: staff “could be left more exhausted rather than less”.' },
              { n: 25, q: 'What does the writer say about the estimate of carbon emissions in paragraph D?', opts: ['It is certain.', 'It depends on assumptions.', 'It applies only to offices.', 'It was calculated for one company.'], a: 'B', ex: 'Evidence: “the calculation depends on assumptions about how people would spend their extra free day”.' },
              { n: 26, q: 'The writer’s attitude to the four-day week in paragraph F is', opts: ['strongly supportive.', 'openly hostile.', 'cautiously open-minded.', 'uninterested.'], a: 'C', ex: 'Evidence: “unwise to assume … but … equally a mistake to dismiss it”: balanced and cautious.' }
            ]
          }
        ]
      },
      {
        n: 3,
        title: 'The Science of Remembering: Why Spacing Works',
        paragraphs: [
          { k: '', t: 'In 1885, the German psychologist Hermann Ebbinghaus published the results of a remarkable experiment on himself. He memorised lists of meaningless syllables, such as “DAX” and “BUP”, and tested how many he could recall after different intervals. Plotting his results, he discovered what is now called the forgetting curve: memory falls steeply in the first hours after learning and then declines more slowly. Later researchers questioned whether meaningless syllables resemble real learning, but the basic pattern has been confirmed many times with words, facts and skills.' },
          { k: '', t: 'The forgetting curve suggests a practical question: when is the best moment to review something? Dr Karin Lund tested this with foreign vocabulary. She asked university students to learn forty words in three study sessions. One group studied all three sessions in a single afternoon, a method often called cramming, while the other group spread the sessions over several days. When tested a month later, the students who had spaced their sessions remembered considerably more words. Interestingly, the crammers had felt more confident immediately after studying, but that confidence proved misleading. Spaced study feels harder, and learners rarely choose it unprompted.' },
          { k: '', t: 'How long should the gaps be? Lund found that the ideal interval was not fixed but depended on how long the learner needed to retain the material. A student preparing for an exam next week benefits from short gaps; someone who wants to remember a language for years should leave much longer gaps between reviews. A useful rule is to increase the interval after each successful recall, so that a word reviewed after one day might next be reviewed after three days, then a week, and so on.' },
          { k: '', t: 'A second line of research, led by Professor David Osei, focused on what learners do during review. In his experiment, 120 students studied the same list of words. Sixty students reread the list four times, while the other sixty tested themselves four times, trying to recall the words from memory before checking them. A week later, the rereaders recalled 35 per cent of the words and the self-testers 58 per cent. Osei argues that each successful attempt to retrieve a memory makes the memory stronger, which is why retrieval practice is more effective than passively looking at the material again.' },
          { k: '', t: 'These findings have shaped modern language-learning software, which schedules each item for review just before the learner is likely to forget it, using increasing intervals after correct answers. Critics note that most studies have used short lists in laboratory conditions, and that motivation, sleep and prior knowledge also affect results. Nevertheless, the central message is consistent: learners who space their study and test themselves remember more for longer than those who cram or simply reread.' }
        ],
        groups: [
          {
            type: 'ynng', label: 'Yes / No / Not Given', range: [27, 30], options: YNNG,
            instruction: 'Do the following statements agree with the views of the writer? Choose YES if the statement agrees, NO if it contradicts, NOT GIVEN if it is impossible to say.',
            items: [
              { n: 27, q: 'Most forgetting happens soon after learning.', a: 'YES', ex: 'Evidence: “memory falls steeply in the first hours after learning”.' },
              { n: 28, q: 'The writer believes later research has proved Ebbinghaus’s findings wrong.', a: 'NO', ex: 'Evidence: “the basic pattern has been confirmed many times”. Questions about the syllables did not disprove the pattern.' },
              { n: 29, q: 'Learners usually prefer spaced study to cramming.', a: 'NO', ex: 'Evidence: “Spaced study feels harder, and learners rarely choose it unprompted.”' },
              { n: 30, q: 'Teachers should stop asking students to reread texts.', a: 'NOT GIVEN', ex: 'The writer says retrieval practice is more effective, but never gives advice about teachers or stopping rereading.' }
            ]
          },
          {
            type: 'match', label: 'Matching features', range: [31, 33],
            instruction: 'Match each finding with the correct researcher, A, B or C. You may use any letter more than once.',
            options: [['A', 'Ebbinghaus'], ['B', 'Lund'], ['C', 'Osei']],
            items: [
              { n: 31, q: 'found that forgetting is fastest soon after learning', a: 'A', ex: 'Ebbinghaus discovered the forgetting curve.' },
              { n: 32, q: 'showed that spreading study over several days improved vocabulary recall after a month', a: 'B', ex: 'Lund’s experiment with forty foreign words.' },
              { n: 33, q: 'demonstrated that trying to recall material is more effective than studying it again', a: 'C', ex: 'Osei’s self-testing versus rereading experiment.' }
            ]
          },
          {
            type: 'match', label: 'Matching sentence endings', range: [34, 35],
            instruction: 'Complete each sentence with the correct ending, A–F.',
            options: [['A', 'felt confident but remembered less in the long term.'], ['B', 'depends on how long the learner needs to remember the material.'], ['C', 'is the same for every learner.'], ['D', 'requires special software.'], ['E', 'cannot be tested in a laboratory.'], ['F', 'makes revision unnecessary.']],
            items: [
              { n: 34, q: 'Students who crammed', a: 'A', ex: 'Evidence: “the crammers had felt more confident … but that confidence proved misleading”.' },
              { n: 35, q: 'The best length of gap between reviews', a: 'B', ex: 'Evidence: “not fixed but depended on how long the learner needed to retain the material”.' }
            ]
          },
          {
            type: 'completion', label: 'Summary completion', range: [36, 38],
            instruction: 'Complete the summary. Write ONE WORD ONLY from the passage for each answer.',
            template: '<div class="notes"><p>Osei argues that each successful attempt to retrieve a memory makes it [[36]]. Language-learning software applies this idea by increasing the [[37]] between reviews after each correct answer, so that items are reviewed just before the learner is likely to [[38]] them.</p></div>',
            items: [
              { n: 36, a: ['stronger'], ex: 'Evidence: “makes the memory stronger”.' },
              { n: 37, a: ['intervals', 'interval'], ex: 'Evidence: “using increasing intervals after correct answers”.' },
              { n: 38, a: ['forget'], ex: 'Evidence: “just before the learner is likely to forget it”.' }
            ]
          },
          {
            type: 'completion', label: 'Table completion', range: [39, 40],
            instruction: 'Complete the table. Write ONE NUMBER ONLY for each answer.',
            template: '<table class="qform"><tr><th>Group</th><th>Method</th><th>Number of students</th><th>Words recalled after one week (%)</th></tr><tr><td>Rereaders</td><td>reread the list four times</td><td>60</td><td>35</td></tr><tr><td>Self-testers</td><td>tested themselves four times</td><td>[[39]]</td><td>[[40]]</td></tr></table>',
            items: [
              { n: 39, a: ['60', 'sixty'], ex: 'Evidence: “Sixty students reread … the other sixty tested themselves”.' },
              { n: 40, a: ['58', 'fifty-eight', 'fifty eight'], ex: 'Evidence: “the self-testers 58 per cent”.' }
            ]
          }
        ]
      }
    ]
  };

  const general = {
    id: 'RG1',
    title: 'General Training Reading Practice Test 1',
    minutes: 60,
    sections: [
      {
        n: 1,
        title: 'Section 1: Everyday notices',
        intro: 'Read the three texts and answer Questions 1–14.',
        texts: [
          { title: 'Riverside Public Library: Information for members', paragraphs: [
            'Opening hours: Monday to Friday 9 am – 7 pm; Saturday 9 am – 5 pm; closed on Sundays and public holidays.',
            'Borrowing: Members may borrow up to eight items at any one time. Books can be borrowed for three weeks and DVDs for one week.',
            'Renewals: Items can be renewed by telephone or online, provided no other member has reserved them.',
            'Late charges: Books 20p per day. DVDs £1 per day. Charges stop at £10 per item.',
            'Children: Children under 12 must be accompanied by an adult in the study area.'
          ] },
          { title: 'Willow Leisure Club: Membership', paragraphs: [
            'Monthly fees: Adult £35. Student £22 (valid student card required). Family (two adults and up to three children) £80.',
            'Joining fee: £20, waived for anyone who joins in January.',
            'Facilities: swimming pool, gym, sauna and a full programme of exercise classes are included in all memberships.',
            'Guests: Members may bring a guest for £6 per visit.',
            'Cancellation: Membership can be cancelled at any time by giving 30 days’ notice in writing.'
          ] },
          { title: 'Harbour View Hotel: Guest information', paragraphs: [
            'Breakfast is served from 7 am to 10 am on weekdays and from 8 am to 11 am at weekends.',
            'Check-out is at 11 am. Late check-out until 2 pm is available for £15, subject to availability.',
            'Free Wi-Fi is available throughout the hotel. Car parking costs £8 per night.',
            'Pets are not allowed in the hotel, with the exception of assistance dogs.'
          ] }
        ],
        groups: [
          {
            type: 'completion', label: 'Short-answer questions', range: [1, 5],
            instruction: 'Questions 1–5 refer to the library text. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
            template: '<ul class="qlist"><li>1&nbsp; How many items can a member borrow at the same time? [[1]]</li><li>2&nbsp; What is the late charge per day for a book? [[2]]</li><li>3&nbsp; On which day of the week is the library always closed? [[3]]</li><li>4&nbsp; For how long can a DVD be borrowed? [[4]]</li><li>5&nbsp; Items can be renewed by telephone or [[5]].</li></ul>',
            items: [
              { n: 1, a: ['8', 'eight'], ex: 'Evidence: “up to eight items at any one time”.' },
              { n: 2, a: ['20p', '20 pence', '£0.20', '20 p'], ex: 'Evidence: “Books 20p per day.”' },
              { n: 3, a: ['Sunday', 'Sundays'], ex: 'Evidence: “closed on Sundays and public holidays”.' },
              { n: 4, a: ['one week', '1 week', 'a week', '7 days', 'seven days'], ex: 'Evidence: “DVDs for one week”.' },
              { n: 5, a: ['online'], ex: 'Evidence: “renewed by telephone or online”.' }
            ]
          },
          {
            type: 'tfng', label: 'True / False / Not Given', range: [6, 10], options: TFNG,
            instruction: 'Questions 6–10 refer to the leisure club text. Choose TRUE, FALSE or NOT GIVEN.',
            items: [
              { n: 6, q: 'Student membership is cheaper than adult membership.', a: 'TRUE', ex: 'Evidence: Adult £35, Student £22.' },
              { n: 7, q: 'The joining fee is never charged.', a: 'FALSE', ex: 'Evidence: £20, “waived for anyone who joins in January”. It is charged in other months.' },
              { n: 8, q: 'Members can bring a guest free of charge.', a: 'FALSE', ex: 'Evidence: “a guest for £6 per visit”.' },
              { n: 9, q: 'The club has an outdoor tennis court.', a: 'NOT GIVEN', ex: 'Tennis courts are not mentioned in the list of facilities.' },
              { n: 10, q: 'Members must give written notice to cancel their membership.', a: 'TRUE', ex: 'Evidence: “30 days’ notice in writing”.' }
            ]
          },
          {
            type: 'mcq', label: 'Multiple choice', range: [11, 14],
            instruction: 'Questions 11–14 refer to the hotel text.',
            items: [
              { n: 11, q: 'On Sunday, breakfast starts at', opts: ['7 am.', '8 am.', '9 am.'], a: 'B', ex: 'Evidence: “from 8 am to 11 am at weekends”.' },
              { n: 12, q: 'A guest who wants to check out at 1 pm must pay', opts: ['£8.', '£15.', 'nothing.'], a: 'B', ex: 'Evidence: “Late check-out until 2 pm is available for £15”.' },
              { n: 13, q: 'How much does parking cost per night?', opts: ['£5', '£8', '£15'], a: 'B', ex: 'Evidence: “Car parking costs £8 per night”. £15 is the late check-out fee.' },
              { n: 14, q: 'Which animals may stay in the hotel?', opts: ['all small pets', 'assistance dogs only', 'pets for an extra fee'], a: 'B', ex: 'Evidence: “Pets are not allowed … with the exception of assistance dogs”.' }
            ]
          }
        ]
      },
      {
        n: 2,
        title: 'Section 2: Work and employment',
        intro: 'Read the two texts and answer Questions 15–27.',
        texts: [
          { title: 'Customer Service Assistant: BrightHome Stores', paragraphs: [
            'BrightHome Stores is looking for a friendly and organised Customer Service Assistant to join our busy city-centre store.',
            'Duties: helping customers to find products, handling returns and refunds, and keeping the shop floor tidy.',
            'Requirements: good communication skills and a positive attitude. Previous retail experience is useful but not essential, as full training will be provided.',
            'Hours and pay: 30 hours a week, including some weekends. The rate of pay is £11.50 per hour.',
            'Benefits: a 20% discount on all products, paid holiday, and the chance to apply for supervisor roles after one year.',
            'How to apply: send your CV and a short covering letter to jobs@brighthome.example by 28 November.'
          ] },
          { title: 'Staff Handbook: Absence and Leave', paragraphs: [
            'Sickness. If you are unable to work because of illness, you must telephone your line manager before 8.30 am on the first day of absence. A doctor’s certificate is required if you are absent for more than three days.',
            'Annual leave. Full-time staff are entitled to 25 days’ paid leave each year, in addition to public holidays. Requests must be submitted at least four weeks in advance, and no more than two weeks may be taken consecutively during the summer months.',
            'Emergency leave. In an emergency, such as a serious family illness, you may be granted up to three days’ paid leave. This must be approved by your line manager.',
            'Training. The company will pay for work-related courses that have been approved in advance by the department head.'
          ] }
        ],
        groups: [
          {
            type: 'completion', label: 'Sentence completion', range: [15, 18],
            instruction: 'Questions 15–18 refer to the job advertisement. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
            template: '<ul class="qlist"><li>15&nbsp; The hourly rate of pay is £[[15]].</li><li>16&nbsp; Employees receive a [[16]] per cent discount on products.</li><li>17&nbsp; Applicants should send a covering letter and their [[17]].</li><li>18&nbsp; The closing date for applications is [[18]].</li></ul>',
            items: [
              { n: 15, a: ['11.50', '11.5'], ex: 'Evidence: “£11.50 per hour”.' },
              { n: 16, a: ['20', 'twenty'], ex: 'Evidence: “a 20% discount on all products”.' },
              { n: 17, a: ['CV', 'curriculum vitae'], ex: 'Evidence: “send your CV and a short covering letter”.' },
              { n: 18, a: ['28 November', '28th November', 'November 28', 'November 28th'], ex: 'Evidence: “by 28 November”.' }
            ]
          },
          {
            type: 'tfng', label: 'True / False / Not Given', range: [19, 20], options: TFNG,
            instruction: 'Questions 19–20 refer to the job advertisement.',
            items: [
              { n: 19, q: 'Previous retail experience is essential for the job.', a: 'FALSE', ex: 'Evidence: “useful but not essential”.' },
              { n: 20, q: 'Weekend work is sometimes required.', a: 'TRUE', ex: 'Evidence: “30 hours a week, including some weekends”.' }
            ]
          },
          {
            type: 'completion', label: 'Short-answer questions', range: [21, 24],
            instruction: 'Questions 21–24 refer to the staff handbook. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.',
            template: '<ul class="qlist"><li>21&nbsp; Staff who are ill must telephone their manager before [[21]] on the first day.</li><li>22&nbsp; A doctor’s certificate is needed if absence lasts more than [[22]] days.</li><li>23&nbsp; Full-time staff receive [[23]] days of annual leave, plus public holidays.</li><li>24&nbsp; Leave requests must be made at least [[24]] weeks in advance.</li></ul>',
            items: [
              { n: 21, a: ['8.30', '8.30 am', '8:30', '8:30 am', '8.30am', '8:30am', '08:30'], ex: 'Evidence: “before 8.30 am”.' },
              { n: 22, a: ['3', 'three'], ex: 'Evidence: “absent for more than three days”.' },
              { n: 23, a: ['25', 'twenty-five', 'twenty five'], ex: 'Evidence: “25 days’ paid leave”.' },
              { n: 24, a: ['4', 'four'], ex: 'Evidence: “at least four weeks in advance”.' }
            ]
          },
          {
            type: 'tfng', label: 'True / False / Not Given', range: [25, 27], options: TFNG,
            instruction: 'Questions 25–27 refer to the staff handbook.',
            items: [
              { n: 25, q: 'Staff may take three weeks of continuous leave during the summer.', a: 'FALSE', ex: 'Evidence: “no more than two weeks may be taken consecutively during the summer months”.' },
              { n: 26, q: 'Emergency leave must be approved by the line manager.', a: 'TRUE', ex: 'Evidence: “This must be approved by your line manager.”' },
              { n: 27, q: 'The company offers unpaid leave for study.', a: 'NOT GIVEN', ex: 'The text says the company pays for approved courses, but it does not mention unpaid study leave.' }
            ]
          }
        ]
      },
      {
        n: 3,
        title: 'Section 3: The Return of the Cargo Bike',
        intro: 'Read the article and answer Questions 28–40.',
        texts: [
          { title: 'The Return of the Cargo Bike', paragraphs: [
            { k: 'A', t: 'Walk through the centre of almost any large European city and you will notice how much of the street is given over to delivery vans. Parked on pavements, blocking cycle lanes and idling at traffic lights, they have become an everyday annoyance, and the growth of online shopping has only made matters worse. In response, a surprising solution has appeared on the roads: the cargo bike.' },
            { k: 'B', t: 'Cargo bikes are not a new invention. In the early twentieth century, butchers, bakers and postal workers across Europe delivered goods on sturdy bicycles with large frames or front-mounted baskets. After the Second World War, cheap motor vehicles gradually replaced them, and by the 1970s the delivery bicycle had almost disappeared from city streets.' },
            { k: 'C', t: 'The modern cargo bike is very different from its ancestor. Many models have an electric motor that assists the rider, so that loads of up to 250 kilograms can be carried without exhaustion. Some have lockable boxes and refrigerated compartments, and a few are even designed to carry several children. A trial of such bikes in a busy district of one capital found that they completed short deliveries faster than vans, mainly because riders did not have to search for parking.' },
            { k: 'D', t: 'The benefits extend beyond speed. A cargo bike produces no exhaust fumes, makes little noise and takes up far less road space than a van. For small businesses, the running costs are also lower: there is no fuel to buy, and parking fines are rarely a problem. Several courier companies report that customers actually prefer receiving parcels from a cyclist, whom they find friendlier than a van driver.' },
            { k: 'E', t: 'Obstacles remain, however. Many cities still lack safe, continuous cycle lanes, and riders must share narrow roads with heavy traffic. The bikes themselves are expensive, and theft is a constant worry. Bad weather and hilly terrain can limit the range of even the most powerful electric models, and in some countries the regulations covering cargo bikes are unclear or restrictive.' },
            { k: 'F', t: 'Logistics experts believe the solution is not to replace vans altogether but to combine the two. Under one scheme, large vehicles deliver parcels to small depots on the edge of the city centre, and cargo bikes then take over for the final stage of the journey. Planners in several cities are already setting aside land for such depots, and if the idea proves successful, the familiar sight of the delivery van in the old town centre may become much less common.' }
          ] }
        ],
        groups: [
          {
            type: 'match', label: 'Matching headings', range: [28, 32],
            instruction: 'The article has paragraphs A–F. Choose the correct heading for paragraphs A–E.',
            options: [['i', 'The decline of a traditional vehicle'], ['ii', 'Combining old and new methods of delivery'], ['iii', 'A problem that needs a new answer'], ['iv', 'Features and performance of modern models'], ['v', 'Advantages for businesses and the community'], ['vi', 'Difficulties facing cargo bike users'], ['vii', 'Why online shopping has grown']],
            items: [
              { n: 28, q: 'Paragraph A', a: 'iii', ex: 'Vans cause problems in city streets and “a surprising solution has appeared”.' },
              { n: 29, q: 'Paragraph B', a: 'i', ex: 'Cargo bikes were replaced by motor vehicles and almost disappeared.' },
              { n: 30, q: 'Paragraph C', a: 'iv', ex: 'It describes electric motors, load capacity, lockable boxes and a speed trial.' },
              { n: 31, q: 'Paragraph D', a: 'v', ex: 'It lists benefits: no fumes, low noise, lower costs, customer preference.' },
              { n: 32, q: 'Paragraph E', a: 'vi', ex: 'It lists obstacles such as missing cycle lanes, theft and weather.' }
            ]
          },
          {
            type: 'mcq', label: 'Multiple choice', range: [33, 35],
            instruction: 'Choose the correct letter, A, B or C.',
            items: [
              { n: 33, q: 'According to paragraph B, delivery bicycles disappeared because', opts: ['they were considered unsafe.', 'cheap motor vehicles replaced them.', 'postal workers stopped using them.'], a: 'B', ex: 'Evidence: “cheap motor vehicles gradually replaced them”.' },
              { n: 34, q: 'In the trial described in paragraph C, cargo bikes were quicker than vans because', opts: ['they have powerful engines.', 'riders did not need to look for parking.', 'roads were closed to vans.'], a: 'B', ex: 'Evidence: “mainly because riders did not have to search for parking”.' },
              { n: 35, q: 'What do some courier companies report about customers?', opts: ['They complain about noise.', 'They prefer parcels delivered by cyclists.', 'They pay more for bike delivery.'], a: 'B', ex: 'Evidence: “customers actually prefer receiving parcels from a cyclist”.' }
            ]
          },
          {
            type: 'completion', label: 'Sentence completion', range: [36, 38],
            instruction: 'Complete the sentences. Write NO MORE THAN TWO WORDS AND/OR A NUMBER from the article.',
            template: '<ul class="qlist"><li>36&nbsp; Electric motors allow cargo bikes to carry loads of up to [[36]] kilograms.</li><li>37&nbsp; Cargo bikes are cheaper to run than vans because there is no [[37]] to buy.</li><li>38&nbsp; In some countries, the [[38]] covering cargo bikes are unclear or restrictive.</li></ul>',
            items: [
              { n: 36, a: ['250'], ex: 'Evidence: “loads of up to 250 kilograms”.' },
              { n: 37, a: ['fuel'], ex: 'Evidence: “there is no fuel to buy”.' },
              { n: 38, a: ['regulations'], ex: 'Evidence: “the regulations covering cargo bikes are unclear or restrictive”.' }
            ]
          },
          {
            type: 'completion', label: 'Short-answer questions', range: [39, 40],
            instruction: 'Answer the questions. Write NO MORE THAN TWO WORDS from the article.',
            template: '<ul class="qlist"><li>39&nbsp; Where do large vehicles leave parcels under the scheme described? at small [[39]]</li><li>40&nbsp; What are planners in several cities setting aside for these depots? [[40]]</li></ul>',
            items: [
              { n: 39, a: ['depots', 'small depots'], ex: 'Evidence: “deliver parcels to small depots on the edge of the city centre”.' },
              { n: 40, a: ['land'], ex: 'Evidence: “Planners … are already setting aside land for such depots”.' }
            ]
          }
        ]
      }
    ]
  };

  const diagnostic = {
    title: 'Diagnostic reading passage',
    paragraphs: [{ k: '', t: 'Many adults believe they are too old to learn a new language, but research suggests otherwise. Adults can often learn grammar rules faster than children because they understand abstract ideas. However, children usually develop a more natural accent. The most important factor is regular practice. Studies show that people who study for twenty minutes every day make more progress than those who study for three hours once a week. Motivation also matters: learners with a clear goal, such as a job or a trip, tend to continue longer. Technology, including mobile applications, has made daily practice easier, although it cannot replace real conversation.' }],
    groups: [
      {
        type: 'tfng', label: 'True / False / Not Given', options: TFNG,
        instruction: 'Choose TRUE, FALSE or NOT GIVEN.',
        items: [
          { n: 1, q: 'Adults learn every aspect of a language faster than children.', a: 'FALSE', ex: 'The text says adults can often learn grammar faster, but children usually have a more natural accent.' },
          { n: 2, q: 'Children usually develop a more natural accent.', a: 'TRUE', ex: 'Evidence: “children usually develop a more natural accent”.' },
          { n: 3, q: 'Mobile applications are the best way to learn a language.', a: 'NOT GIVEN', ex: 'The text says applications make practice easier but never calls them the best method.' }
        ]
      },
      {
        type: 'completion', label: 'Sentence completion',
        instruction: 'Write ONE WORD OR A NUMBER for each answer.',
        template: '<ul class="qlist"><li>4&nbsp; People who study for [[4]] minutes every day make more progress.</li><li>5&nbsp; Learners with a clear [[5]] tend to continue longer.</li></ul>',
        items: [
          { n: 4, a: ['20', 'twenty'], ex: 'Evidence: “twenty minutes every day”.' },
          { n: 5, a: ['goal'], ex: 'Evidence: “learners with a clear goal”.' }
        ]
      }
    ]
  };

  /* Skill notes shown in Learning Mode */
  const skills = [
    { title: 'Identify keywords', body: 'Underline the words in the question that carry meaning (names, numbers, verbs and nouns). Ignore small grammar words. Then scan the passage for the same words or for their synonyms.' },
    { title: 'Recognise paraphrase', body: 'IELTS rarely repeats the exact words. “Rarely choose it unprompted” may paraphrase “do not usually prefer”. Build a list of synonyms for the keywords before you scan.' },
    { title: 'Locate the evidence', body: 'Answers appear in order within one passage for most question types. Find the sentence that answers the question, then check it fully. After each answer, note where it was so you can find later answers faster.' },
    { title: 'False versus Not Given', body: 'FALSE means the passage says the opposite or gives a different fact. NOT GIVEN means the passage does not say enough to decide. If you cannot find evidence for or against, the answer is probably NOT GIVEN.' },
    { title: 'Read the instructions', body: '“NO MORE THAN TWO WORDS” means you must copy words from the passage and respect the limit. Check spelling and singular/plural forms because a misspelled answer is marked wrong.' },
    { title: 'Manage your time', body: 'Aim for about 20 minutes per passage. If a question takes more than a minute, mark a guess and move on. Use any spare time at the end to return to the unanswered questions.' }
  ];

  IM.data.reading = { academic, general, diagnostic, skills };
})();
