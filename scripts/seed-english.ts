/**
 * scripts/seed-english-batch-04-gap-fill.ts
 * Fills low-count Use of English areas in Jamsulator:
 * - Oral Forms: Vowels, Consonants
 * - Comprehension and Summary: selected zero/low-count subtopics
 *
 * Run:
 * VITE_SUPABASE_URL=... VITE_SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-english-batch-04-gap-fill.ts
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.VITE_SUPABASE_SERVICE_KEY!

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

// ─── Standalone questions (low-count Oral Forms) ──────────────────────────────
const STANDALONE: Array<{
  topic: string
  subtopic: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  pattern_code: string
}> = [
  // Vowels
  {
    topic: 'Oral Forms',
    subtopic: 'Vowels (monothongs, diphthongs and triphthongs)',
    question_text: 'Which of the following words contains the vowel sound /æ/?',
    option_a: 'man',
    option_b: 'men',
    option_c: 'mean',
    option_d: 'moon',
    correct_option: 'a',
    explanation: '"Man" contains the vowel sound /æ/. The other words contain different vowel sounds.',
    difficulty_level: 'easy',
    pattern_code: 'O1',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Vowels (monothongs, diphthongs and triphthongs)',
    question_text: 'Which of the following words contains the vowel sound /ɜː/?',
    option_a: 'bird',
    option_b: 'bed',
    option_c: 'bad',
    option_d: 'board',
    correct_option: 'a',
    explanation: '"Bird" contains the long vowel sound /ɜː/ in standard exam pronunciation.',
    difficulty_level: 'medium',
    pattern_code: 'O1',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Vowels (monothongs, diphthongs and triphthongs)',
    question_text: 'Which of the following words contains the diphthong /əʊ/?',
    option_a: 'cot',
    option_b: 'code',
    option_c: 'cool',
    option_d: 'card',
    correct_option: 'b',
    explanation: '"Code" contains the diphthong /əʊ/. The others contain different vowel sounds.',
    difficulty_level: 'medium',
    pattern_code: 'O1',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Vowels (monothongs, diphthongs and triphthongs)',
    question_text: 'Which of the following words contains the triphthong /aɪə/?',
    option_a: 'fire',
    option_b: 'far',
    option_c: 'fair',
    option_d: 'fine',
    correct_option: 'a',
    explanation: '"Fire" contains the triphthong /aɪə/ in careful pronunciation.',
    difficulty_level: 'hard',
    pattern_code: 'O1',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Vowels (monothongs, diphthongs and triphthongs)',
    question_text: 'Which of the following words contains the vowel sound /ʊ/?',
    option_a: 'pool',
    option_b: 'pull',
    option_c: 'pole',
    option_d: 'peel',
    correct_option: 'b',
    explanation: '"Pull" contains the short vowel sound /ʊ/. "Pool" has /uː/.',
    difficulty_level: 'medium',
    pattern_code: 'O1',
  },

  // Consonants
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words begins with the consonant sound /θ/?',
    option_a: 'then',
    option_b: 'thin',
    option_c: 'this',
    option_d: 'those',
    correct_option: 'b',
    explanation: '"Thin" begins with the voiceless consonant sound /θ/. The others begin with /ð/.',
    difficulty_level: 'medium',
    pattern_code: 'O2',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words begins with the consonant sound /ð/?',
    option_a: 'thing',
    option_b: 'thank',
    option_c: 'this',
    option_d: 'thick',
    correct_option: 'c',
    explanation: '"This" begins with the voiced consonant sound /ð/. The others begin with /θ/.',
    difficulty_level: 'medium',
    pattern_code: 'O2',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words ends with the consonant sound /tʃ/?',
    option_a: 'badge',
    option_b: 'match',
    option_c: 'maze',
    option_d: 'mass',
    correct_option: 'b',
    explanation: '"Match" ends with the consonant sound /tʃ/. "Badge" ends with /dʒ/.',
    difficulty_level: 'easy',
    pattern_code: 'O2',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words contains the consonant cluster /spl/?',
    option_a: 'split',
    option_b: 'spit',
    option_c: 'spoil',
    option_d: 'speak',
    correct_option: 'a',
    explanation: '"Split" begins with the consonant cluster /spl/.',
    difficulty_level: 'medium',
    pattern_code: 'O2',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words ends with the consonant sound /ʃ/?',
    option_a: 'rush',
    option_b: 'rose',
    option_c: 'judge',
    option_d: 'razor',
    correct_option: 'a',
    explanation: '"Rush" ends with the consonant sound /ʃ/.',
    difficulty_level: 'easy',
    pattern_code: 'O2',
  },
  {
    topic: 'Oral Forms',
    subtopic: 'Consonants (including clusters)',
    question_text: 'Which of the following words begins with the consonant sound /dʒ/?',
    option_a: 'chair',
    option_b: 'judge',
    option_c: 'shoe',
    option_d: 'yacht',
    correct_option: 'b',
    explanation: '"Judge" begins with the consonant sound /dʒ/.',
    difficulty_level: 'easy',
    pattern_code: 'O2',
  },
]

// ─── Comprehension groups (gap-fill only) ─────────────────────────────────────
const COMPREHENSION_GROUPS: Array<{
  group_id: string
  passage_text: string
  year: null
  questions: Array<{
    topic: string
    subtopic: string
    question_text: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_option: 'a' | 'b' | 'c' | 'd'
    explanation: string
    difficulty_level: 'easy' | 'medium' | 'hard'
    pattern_code: string
  }>
}> = [
  {
    group_id: 'COMP-ENG-013',
    passage_text: `Every Saturday morning, Amina helped her mother at the small provision shop near the junction. She arranged biscuits, soap and sachet water before customers started arriving. Although the work was tiring, she enjoyed watching how her mother greeted everyone with patience and respect. Over time, Amina noticed that even customers who complained often returned because they trusted her mother. From this, she learnt that good business depends not only on profit but also on character.`,
    year: null,
    questions: [
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of the whole or part of each passage',
        question_text: 'What is the main idea of the passage?',
        option_a: 'Amina dislikes helping her mother',
        option_b: 'Running a shop requires physical strength alone',
        option_c: 'Good character helps to build customer trust in business',
        option_d: 'Customers prefer cheap goods to respectful treatment',
        correct_option: 'c',
        explanation: 'The passage shows that customers kept returning because they trusted Amina’s mother, proving that character is important in business.',
        difficulty_level: 'easy',
        pattern_code: 'C1',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of the whole or part of each passage',
        question_text: 'Why did many customers keep returning to the shop?',
        option_a: 'The shop was the biggest in town',
        option_b: 'They trusted Amina’s mother',
        option_c: 'Amina sold goods at half price',
        option_d: 'The shop opened only on Saturdays',
        correct_option: 'b',
        explanation: 'The passage clearly states that customers returned because they trusted Amina’s mother.',
        difficulty_level: 'easy',
        pattern_code: 'C5',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'synthesis of ideas from the passages',
        question_text: 'Which of the following lessons did Amina most likely learn from her experience?',
        option_a: 'Respect and patience can strengthen business relationships',
        option_b: 'Children should not work in shops',
        option_c: 'All customers are difficult to satisfy',
        option_d: 'Profit is more important than honesty',
        correct_option: 'a',
        explanation: 'Amina observed that patience and respect made customers trust her mother, so that is the lesson she learnt.',
        difficulty_level: 'medium',
        pattern_code: 'C2',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'coherence and logical reasoning (deductions, inferences, etc.)',
        question_text: 'From the passage, it can be inferred that Amina’s mother was',
        option_a: 'careless',
        option_b: 'wealthy',
        option_c: 'courteous',
        option_d: 'strict',
        correct_option: 'c',
        explanation: 'She greeted customers with patience and respect, which shows she was courteous.',
        difficulty_level: 'medium',
        pattern_code: 'C2',
      },
    ],
  },
  {
    group_id: 'COMP-ENG-014',
    passage_text: `When the inter-house sports competition was announced, many students focused only on winning medals. However, Mr. Bello reminded them that the event was also meant to teach discipline, teamwork and resilience. During practice, Chinedu, who had always depended on natural talent, began to understand this lesson. He lost several races at first because he did not train seriously. After weeks of steady effort, he improved greatly and eventually came second. Though he did not win gold, he felt prouder of the discipline he had developed than of the medal itself.`,
    year: null,
    questions: [
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of the whole or part of each passage',
        question_text: 'What is the central message of the passage?',
        option_a: 'Medals are the only reward in sports',
        option_b: 'Discipline and effort are valuable outcomes of competition',
        option_c: 'Natural talent is enough for success',
        option_d: 'Students should avoid sports competitions',
        correct_option: 'b',
        explanation: 'The passage emphasizes that sports teach discipline and effort, and Chinedu valued those more than the medal.',
        difficulty_level: 'easy',
        pattern_code: 'C1',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'coherence and logical reasoning (deductions, inferences, etc.)',
        question_text: 'Why did Chinedu lose several races at first?',
        option_a: 'He was injured',
        option_b: 'He depended too much on natural ability',
        option_c: 'He disliked running',
        option_d: 'Mr. Bello did not coach him',
        correct_option: 'b',
        explanation: 'The passage states that Chinedu had always depended on natural talent and did not train seriously at first.',
        difficulty_level: 'easy',
        pattern_code: 'C5',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'synthesis of ideas from the passages',
        question_text: 'Which statement best summarizes Chinedu’s growth?',
        option_a: 'He discovered that luck matters more than training',
        option_b: 'He learnt that effort can develop ability and character',
        option_c: 'He regretted taking part in the competition',
        option_d: 'He became famous for winning gold',
        correct_option: 'b',
        explanation: 'Chinedu improved through steady effort and valued the discipline he gained, showing real growth.',
        difficulty_level: 'medium',
        pattern_code: 'C2',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of words, phrases, clauses, sentences, figures of speech and idioms as used in the passages',
        question_text: 'The word "resilience" as used in the passage means',
        option_a: 'the ability to recover from difficulty',
        option_b: 'fear of losing',
        option_c: 'love of public praise',
        option_d: 'physical strength alone',
        correct_option: 'a',
        explanation: 'In context, resilience means the ability to recover, continue and improve despite setbacks.',
        difficulty_level: 'medium',
        pattern_code: 'C3',
      },
    ],
  },
  {
    group_id: 'COMP-ENG-015',
    passage_text: `The old library building in our town once seemed forgotten. Its walls were dusty, the shelves were uneven and very few students visited after school. Last year, however, the local council repaired the roof, painted the rooms and provided new tables. Volunteers also organized reading clubs every Wednesday. Since then, the library has become lively again. Students now gather there not only to prepare for examinations but also to discuss books and share ideas. What was once neglected has become one of the most useful places in the community.`,
    year: null,
    questions: [
      {
        topic: 'Comprehension and Summary',
        subtopic: 'description',
        question_text: 'Which of the following best describes the condition of the library before it was repaired?',
        option_a: 'Modern and well-equipped',
        option_b: 'Neglected and unattractive',
        option_c: 'Busy and noisy',
        option_d: 'Small but comfortable',
        correct_option: 'b',
        explanation: 'The passage describes dusty walls, uneven shelves and few visitors, showing that the library was neglected.',
        difficulty_level: 'easy',
        pattern_code: 'C5',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'description',
        question_text: 'Which change contributed to the revival of the library?',
        option_a: 'The library was moved to another town',
        option_b: 'Students were forced to visit daily',
        option_c: 'The building was repaired and reading clubs were introduced',
        option_d: 'All books were removed from the shelves',
        correct_option: 'c',
        explanation: 'The passage states that repairs and reading clubs helped transform the library.',
        difficulty_level: 'easy',
        pattern_code: 'C5',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of the whole or part of each passage',
        question_text: 'What is the main point of the passage?',
        option_a: 'Libraries are no longer useful',
        option_b: 'Community support can restore neglected public spaces',
        option_c: 'Students prefer clubs to reading',
        option_d: 'Only new buildings can attract readers',
        correct_option: 'b',
        explanation: 'The passage shows how repairs and volunteer effort turned a neglected library into a useful community centre.',
        difficulty_level: 'medium',
        pattern_code: 'C1',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'synthesis of ideas from the passages',
        question_text: 'Which statement best captures the transformation described in the passage?',
        option_a: 'The library changed from useless to valuable',
        option_b: 'The library changed from large to small',
        option_c: 'The library changed from public to private',
        option_d: 'The library changed from educational to social only',
        correct_option: 'a',
        explanation: 'The passage contrasts the earlier neglected state with its later value to the community.',
        difficulty_level: 'medium',
        pattern_code: 'C2',
      },
    ],
  },
  {
    group_id: 'COMP-ENG-016',
    passage_text: `When the bus broke down on the way to Minna, the passengers reacted in different ways. Some complained loudly, others sat quietly and a few stepped out to look for help. An elderly woman then suggested that everyone move their luggage away from the middle of the road so that other vehicles could pass. Her calm voice changed the mood immediately. Within minutes, the younger passengers organized themselves, cleared the road and even found water for the children. What had begun as confusion slowly turned into cooperation.`,
    year: null,
    questions: [
      {
        topic: 'Comprehension and Summary',
        subtopic: 'narration',
        question_text: 'What caused the initial problem in the passage?',
        option_a: 'A heavy storm',
        option_b: 'The bus broke down',
        option_c: 'The passengers missed their stop',
        option_d: 'The driver got lost',
        correct_option: 'b',
        explanation: 'The passage begins by stating that the bus broke down on the way to Minna.',
        difficulty_level: 'easy',
        pattern_code: 'C5',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'coherence and logical reasoning (deductions, inferences, etc.)',
        question_text: 'What effect did the elderly woman’s suggestion have?',
        option_a: 'It increased the confusion',
        option_b: 'It made the passengers leave the bus',
        option_c: 'It helped the passengers become organized',
        option_d: 'It delayed help from arriving',
        correct_option: 'c',
        explanation: 'Her calm suggestion changed the mood and led the younger passengers to organize themselves.',
        difficulty_level: 'easy',
        pattern_code: 'C2',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of the whole or part of each passage',
        question_text: 'Which of the following best summarizes the passage?',
        option_a: 'Passengers usually make travel problems worse',
        option_b: 'Calm leadership can turn disorder into cooperation',
        option_c: 'Road travel is always unsafe',
        option_d: 'Young people ignore useful advice',
        correct_option: 'b',
        explanation: 'The main idea is that the woman’s calm leadership transformed confusion into cooperation.',
        difficulty_level: 'medium',
        pattern_code: 'C1',
      },
      {
        topic: 'Comprehension and Summary',
        subtopic: 'comprehension of words, phrases, clauses, sentences, figures of speech and idioms as used in the passages',
        question_text: 'The word "cooperation" as used in the passage means',
        option_a: 'joint effort',
        option_b: 'loud protest',
        option_c: 'private discussion',
        option_d: 'forced obedience',
        correct_option: 'a',
        explanation: 'In context, cooperation means working together for a common purpose.',
        difficulty_level: 'easy',
        pattern_code: 'C3',
      },
    ],
  },
]

async function main() {
  console.log('📚 Use of English gap-fill seed starting...')

  const { data: subject } = await sb
    .from('subjects')
    .select('id')
    .eq('name', 'Use of English')
    .single()

  if (!subject) {
    console.error('Subject not found')
    process.exit(1)
  }

  const { data: topics } = await sb
    .from('topics')
    .select('id, name')
    .eq('subject_id', subject.id)

  if (!topics) {
    console.error('No topics found')
    process.exit(1)
  }

  const topicMap = new Map(topics.map(t => [t.name, t.id]))

  const { data: subtopics } = await sb
    .from('subtopics')
    .select('id, name, topic_id')
    .eq('subject_id', subject.id)

  if (!subtopics) {
    console.error('No subtopics found')
    process.exit(1)
  }

  const subtopicMap = new Map(subtopics.map(s => [`${s.topic_id}::${s.name}`, s.id]))

  function resolveIds(topic: string, subtopic: string) {
    const topicId = topicMap.get(topic)
    if (!topicId) {
      console.warn(`⚠ Topic not found: "${topic}"`)
      return null
    }

    const subtopicId = subtopicMap.get(`${topicId}::${subtopic}`)
    if (!subtopicId) {
      console.warn(`⚠ Subtopic not found: "${subtopic}"`)
      return null
    }

    return { topicId, subtopicId }
  }

  let ok = 0
  let skip = 0

  // 1 — Standalone
  console.log(`Seeding ${STANDALONE.length} standalone questions...`)
  for (const q of STANDALONE) {
    const ids = resolveIds(q.topic, q.subtopic)
    if (!ids) {
      skip++
      continue
    }

    const { error } = await sb.from('questions').insert({
      subject_id: subject.id,
      topic_id: ids.topicId,
      subtopic_id: ids.subtopicId,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty_level: q.difficulty_level,
      render_type: 'text',
      question_type: 'mcq',
      passage_id: null,
      position_in_passage: null,
      status: 'approved',
      year: null,
      pattern_code: q.pattern_code,
    })

    if (error) {
      console.error(`✗ ${error.message}`)
      skip++
    } else {
      ok++
    }
  }

  // 2 — Comprehension
  console.log(`Seeding ${COMPREHENSION_GROUPS.length} comprehension groups...`)
  for (const group of COMPREHENSION_GROUPS) {
    const { data: passage, error: pErr } = await sb
      .from('passages')
      .insert({
        group_id: group.group_id,
        subject_id: subject.id,
        passage_type: 'comprehension',
        passage_text: group.passage_text,
        passage_image_url: null,
        year: group.year,
      })
      .select('id')
      .single()

    if (pErr || !passage) {
      console.error(`✗ Passage insert failed (${group.group_id}): ${pErr?.message}`)
      skip += group.questions.length
      continue
    }

    console.log(`  ✓ Passage ${group.group_id} created`)

    for (const q of group.questions) {
      const ids = resolveIds(q.topic, q.subtopic)
      if (!ids) {
        skip++
        continue
      }

      const { error } = await sb.from('questions').insert({
        subject_id: subject.id,
        topic_id: ids.topicId,
        subtopic_id: ids.subtopicId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        pattern_code: q.pattern_code,
        render_type: 'text',
        question_type: 'passage',
        passage_id: passage.id,
        position_in_passage: null,
        status: 'approved',
        year: null,
      })

      if (error) {
        console.error(`✗ ${error.message}`)
        skip++
      } else {
        ok++
      }
    }
  }

  console.log(`✅ Done — ${ok} inserted, ${skip} skipped`)
}

main()