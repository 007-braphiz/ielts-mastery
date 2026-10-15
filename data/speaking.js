/* Speaking content: Part 1 topics, Part 2 cue cards with Part 3 questions, pronunciation and fluency material.
   All material is original practice content. Model answers are examples, not the only correct answers. */
window.IM = window.IM || {};
IM.data = IM.data || {};

IM.data.speaking = {
  part1: [
    { id: 'work', title: 'Work', qs: ['Do you work or are you a student?', 'What do you enjoy most about your work or studies?', 'Why did you choose that job or subject?', 'Would you like to change your job in the future?'],
      model: 'I work as a software developer for a small company. What I enjoy most is solving problems, because every day there is something new to figure out. I chose this career since I have always liked computers, and a friend of mine suggested that I try programming when I was at school.' },
    { id: 'studies', title: 'Studies', qs: ['What subject are you studying?', 'Is there anything you find difficult about it?', 'Do you prefer studying alone or with other people?', 'What would you like to study in the future?'],
      model: 'I am studying business management at the moment. The most difficult part is probably the statistics, because I have never been very confident with numbers. I prefer studying with other people since we can explain things to each other, although I do my final revision alone.' },
    { id: 'family', title: 'Family', qs: ['Tell me about your family.', 'Do you spend much time with your family?', 'Who are you closest to in your family?', 'Do you think family is important?'],
      model: 'There are five of us: my parents, my two brothers and me. We try to have dinner together on Sundays, and that is when we catch up. I am closest to my older brother because we share the same sense of humour and he always gives me honest advice.' },
    { id: 'accommodation', title: 'Accommodation', qs: ['Do you live in a house or a flat?', 'What is your favourite room?', 'Is there anything you would like to change about your home?', 'Would you prefer to live in the countryside or in a city?'],
      model: 'I live in a two-bedroom flat on the third floor. My favourite room is the kitchen, because it is bright and I love cooking. If I could change one thing, I would add a balcony, so that I could grow some herbs and enjoy the evening air.' },
    { id: 'hobbies', title: 'Hobbies', qs: ['What do you like to do in your free time?', 'How long have you had this hobby?', 'Do you prefer indoor or outdoor activities?', 'Would you like to try a new hobby?'],
      model: 'In my free time I usually go running or read novels. I started running about three years ago, and now it is a real part of my routine. I prefer outdoor activities because being outside clears my head, but when the weather is bad I enjoy reading at home.' },
    { id: 'routine', title: 'Daily routine', qs: ['What is your daily routine like?', 'Which part of the day do you like best?', 'Has your routine changed in recent years?', 'Do you prefer mornings or evenings?'],
      model: 'I usually get up at around seven, have breakfast and then commute to work. My favourite part of the day is the early evening, when I can relax and cook dinner. My routine has changed quite a lot since I started working from home two days a week.' },
    { id: 'hometown', title: 'Hometown', qs: ['Where is your hometown?', 'What do you like about your hometown?', 'Has your hometown changed much?', 'Would you recommend your hometown to tourists?'],
      model: 'I come from a medium-sized coastal city. What I like most is the sea front, where people walk and cycle all year round. It has changed a lot in the past decade, with new shopping centres and a metro line, so I would definitely recommend it to tourists.' },
    { id: 'food', title: 'Food', qs: ['What kind of food do you like?', 'Do you prefer eating at home or in restaurants?', 'Can you cook?', 'Has your diet changed in recent years?'],
      model: 'I enjoy spicy food, especially noodle dishes. I usually eat at home since it is cheaper and healthier, although I like trying new restaurants at weekends. I can cook a few simple dishes, and recently I have been eating more vegetables and less meat.' }
  ],

  part2: [
    { id: 'person', title: 'A person who has helped you',
      card: 'Describe a person who has helped you.\nYou should say:\n• who this person is\n• how you know them\n• how they helped you\n• and explain why their help was important to you.',
      part3: ['Why do some people find it hard to ask for help?', 'How has technology changed the way people help each other?', 'Do you think people were more helpful in the past?', 'Should schools teach children to help others?'],
      model: 'I would like to talk about my old English teacher, Mrs Carter. I met her when I was fifteen, and she taught me for three years. She helped me in a number of ways, but the most important was that she persuaded me to speak in class even though I was very shy. She gave me small tasks at first, such as reading a short paragraph aloud, and then gradually longer presentations. Eventually I stopped being so nervous. Her help was important because it changed how I see myself. Without her encouragement, I probably would not have the confidence to study abroad today.' },
    { id: 'place', title: 'A place you would like to visit',
      card: 'Describe a place you would like to visit.\nYou should say:\n• where it is\n• how you would travel there\n• what you would do there\n• and explain why you would like to go.',
      part3: ['Why do people like to travel to other countries?', 'What are the advantages of travelling alone?', 'How can tourism harm a place?', 'Will people travel more or less in the future?'],
      model: 'One place I would love to visit is Iceland. It is in the north Atlantic, so I would fly there, probably in winter. The main thing I would do is look for the northern lights, and I would also visit hot springs and waterfalls. I would like to go because I enjoy nature, and the landscapes look completely different from anything in my country. I think it would also be a good chance to disconnect from my busy routine.' },
    { id: 'book', title: 'A book you enjoyed',
      card: 'Describe a book you have enjoyed reading.\nYou should say:\n• what the book was\n• what it was about\n• when you read it\n• and explain why you enjoyed it.',
      part3: ['Do you think people read less these days?', 'What are the advantages of reading on a screen?', 'Why do some books become very popular?', 'Should children be encouraged to read more?'],
      model: 'A book I really enjoyed was a novel about a family running a small hotel. I read it two summers ago on a long train journey. It was about how three generations disagree about the future of the business, but it was funny and warm rather than serious. I enjoyed it mainly because the characters felt real, and I could recognise some of my own relatives in them. I finished it in just two days.' },
    { id: 'skill', title: 'A skill you learned',
      card: 'Describe a skill you learned and enjoyed.\nYou should say:\n• what the skill was\n• how you learned it\n• what difficulties you had\n• and explain why you enjoyed learning it.',
      part3: ['What skills are most important for young people today?', 'Is it better to learn a skill from a teacher or from the internet?', 'Why do some people give up when learning something new?', 'Should employers train workers or hire people who already have skills?'],
      model: 'I would like to talk about learning to swim as an adult. I took lessons at a local pool for about six months, with an instructor who was very patient. The hardest part was controlling my breathing, and at first I panicked whenever my face was under the water. I enjoyed it because I could see myself improving each week, and now it is a great way to relax and stay fit.' },
    { id: 'tech', title: 'A piece of technology you use often',
      card: 'Describe a piece of technology you use often.\nYou should say:\n• what it is\n• how often you use it\n• what you use it for\n• and explain why it is important to you.',
      part3: ['How has technology changed the way people work?', 'Are there any disadvantages of depending on technology?', 'Do you think older people find it harder to use new technology?', 'What technology will change daily life most in the next twenty years?'],
      model: 'The piece of technology I use most is my smartphone. I use it every day, probably for several hours in total, mostly for messages, maps and listening to music. It is important to me because it keeps me connected to my family, who live in another city. I also use it to learn English with applications, so in a way it is helping me prepare for this exam.' },
    { id: 'journey', title: 'A memorable journey',
      card: 'Describe a memorable journey you have made.\nYou should say:\n• where you went\n• who you went with\n• what happened during the journey\n• and explain why it was memorable.',
      part3: ['Why do many people enjoy long journeys?', 'How has transport changed in your country?', 'What are the benefits of public transport?', 'Do you think people will travel by plane less in future?'],
      model: 'A journey I will never forget was a road trip along the coast with two close friends. We travelled for five days in an old car that broke down on the second day, so we spent an afternoon in a tiny village waiting for a mechanic. It was memorable because that unexpected stop turned into the best part of the trip: the villagers invited us for dinner, and we ended up staying the night.' }
  ],

  /* Self-rating scale (1–5) and its approximate band mapping, used with objective indicators. */
  ratingToBand: { 1: 5.0, 2: 5.5, 3: 6.5, 4: 7.0, 5: 8.0 },
  descriptors: {
    fc: ['I stop often and search for words; ideas are hard to follow.', 'I speak with noticeable hesitation and short answers.', 'I can keep going with some hesitation; I use basic linking words.', 'I speak at length with few hesitations and link ideas clearly.', 'I speak fluently and naturally, and develop ideas logically.'],
    lr: ['I use very basic words and repeat them often.', 'I use simple vocabulary and need to paraphrase often.', 'I have enough words for most topics, with some repetition.', 'I use varied vocabulary and some precise or idiomatic expressions.', 'I use a wide range of vocabulary precisely and naturally.'],
    gra: ['I use mainly isolated words or memorised phrases.', 'I use simple sentences with many errors.', 'I use some complex sentences with errors that sometimes cause confusion.', 'I use a mix of structures and most sentences are accurate.', 'I use a wide range of structures accurately and flexibly.'],
    pr: ['People often cannot understand me.', 'My accent often makes me hard to understand.', 'I am generally understood, with some unclear sounds.', 'I am easy to understand; stress and intonation are mostly natural.', 'I am very easy to understand, with natural stress and intonation.']
  },

  fillers: ['um', 'uh', 'er', 'erm', 'you know', 'like', 'i mean', 'sort of', 'kind of', 'basically', 'actually'],
  connectors: ['because', 'so', 'although', 'however', 'for example', 'for instance', 'in addition', 'on the other hand', 'as a result', 'therefore', 'while', 'whereas', 'in my opinion', 'firstly', 'secondly', 'finally', 'besides', 'also', 'but', 'and then', 'what is more', 'to be honest', 'as far as i am concerned'],

  pronunciation: {
    minimalPairs: [
      ['ship', 'sheep'], ['live', 'leave'], ['bit', 'beat'], ['full', 'fool'], ['cat', 'cut'], ['bed', 'bad'], ['sit', 'seat'], ['pull', 'pool'], ['hat', 'hut'], ['think', 'sink'], ['thin', 'tin'], ['berry', 'very'], ['light', 'right'], ['wine', 'vine'], ['chair', 'share']
    ],
    wordStress: [
      { w: 'photograph', s: 'PHO-to-graph' }, { w: 'photography', s: 'pho-TOG-ra-phy' }, { w: 'comfortable', s: 'COM-fta-ble' }, { w: 'environment', s: 'en-VI-ron-ment' },
      { w: 'economic', s: 'ee-ko-NOM-ic' }, { w: 'economy', s: 'e-CON-o-my' }, { w: 'vegetable', s: 'VEJ-ta-ble' }, { w: 'development', s: 'de-VE-lop-ment' },
      { w: 'advertisement', s: 'ad-VER-tise-ment' }, { w: 'particular', s: 'par-TIC-u-lar' }, { w: 'necessary', s: 'NE-ces-sa-ry' }, { w: 'communicate', s: 'co-MU-ni-cate' }
    ],
    shadowing: [
      'I usually get up early so that I can go for a run before work.',
      'There are several reasons why people prefer to live in the city.',
      'In my opinion, technology has made our lives easier, but it has also created new problems.',
      'What I enjoy most about my hometown is the friendly atmosphere.',
      'If I had more free time, I would definitely learn another language.',
      'The government should invest more in public transport to reduce pollution.',
      'It depends on the situation, but generally I prefer studying with other people.',
      'Although it was difficult at first, I gradually became more confident.'
    ]
  },

  fluency: [
    { id: 'f1', title: 'One-minute talk', prompt: 'Talk for one full minute about your favourite season. Do not stop. If you forget a word, describe it with other words.' },
    { id: 'f2', title: 'Give reasons', prompt: 'Talk for one minute: “Why do people enjoy shopping online?” Use because, so, as a result and for example.' },
    { id: 'f3', title: 'Compare', prompt: 'Talk for one minute: compare living in a city with living in the countryside. Use whereas, on the other hand and however.' },
    { id: 'f4', title: 'Opinion with support', prompt: 'Talk for one minute: “Is it better to rent or to buy a home?” Give an opinion, two reasons and one example.' }
  ]
};
