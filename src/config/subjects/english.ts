export const ENGLISH_CONFIG = {
  name: 'Use of English',
  prefix: 'ENG',
  totalQuestions: 60,
  topics: {
    'Comprehension and Summary': {
      subtopics: [
        'description',
        'narration',
        'exposition',
        'argumentation/persuasion',
        'comprehension of the whole or part of each passage',
        'comprehension of words, phrases, clauses, sentences, figures of speech and idioms as used in the passages',
        'coherence and logical reasoning (deductions, inferences, etc.)',
        'Approved Reading Text',
        'synthesis of ideas from the passages',
      ],
      objectives: [
        'identify main points/topic sentences in passages;',
        'determine implied meanings;',
        'identify the grammatical functions of words, phrases, clauses and figurative /idiomatic expressions; and',
        'deduce or infer the writers’ intentions including mood, attitude to the subject matter and opinion.',
      ],
    },
    'Lexis and Structure': {
      subtopics: [
        'synonyms',
        'antonyms',
        'clause and sentence patterns',
        'word classes and their functions',
        'mood, tense, aspect, number, agreement/concord, degree (positive, comparative and superlative) and question tags',
        'mechanics',
        'ordinary usage, figurative usage and idiomatic usage',
      ],
      objectives: [
        'identify words and expressions in their ordinary, figurative and idiomatic contexts;',
        'determine similar and opposite meanings of words;',
        'differentiate between correct and incorrect spellings;',
        'identify various grammatical patterns in use; and',
        'interpret information conveyed in sentences.',
      ],
    },
    'Oral Forms': {
      subtopics: [
        'Vowels (monothongs, diphthongs and triphthongs)',
        'Consonants (including clusters)',
        'Rhymes (including homophones)',
        'Word stress (monosyllabic and polysyllabic)',
        'Emphatic stress (in connected speech)',
      ],
      objectives: [
        'make distinctions among vowel types;',
        'differentiate among consonant types; and',
        'identify correct pronunciation of individual words and articulation of connected speech.',
      ],
    },
  },
} as const

export const ENGLISH_CATEGORY_PRIORITY = {
  science: 1,
  arts: 1,
  commercial: 1,
} as const

export type EnglishTopic = keyof typeof ENGLISH_CONFIG.topics