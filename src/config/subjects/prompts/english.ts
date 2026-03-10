// src/config/subjects/prompts/english.ts
// Built from: jamb_chatgpt_prompt_template.md + jamb_passage_extraction_prompt.md
// Covers all 100 questions: comprehension (Q1-16), cloze (Q17-36), standalone (Q37-100)

import { ENGLISH_CONFIG } from '../english'

function buildTopicList(): string {
  return Object.entries(ENGLISH_CONFIG.topics).map(([topic, data]) => {
    const subs = Array.isArray(data) ? data : (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const ENGLISH_PROMPT = `You are extracting ALL questions from a JAMB Use of English past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 100 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION A — COMPREHENSION (Q1–Q16, ~16 questions)
  • 2–3 reading passages, each followed by 5–6 questions
  • Output as "groups" with type: "comprehension"
  • Copy the FULL passage text exactly — never summarise or shorten
  • Preserve all paragraphs

SECTION B — CLOZE / LEXIS & STRUCTURE (Q17–Q36, ~20 questions)
  • One passage with numbered blanks
  • Output as "groups" with type: "cloze"
  • Blanks must be written EXACTLY as: (1) ___ (2) ___ (3) ___ etc.
  • Each blank = one question, position = blank number
  • question_text = the full sentence containing that blank as context

SECTION C — STANDALONE (Q37–Q100, ~64 questions)
  • Q37–Q44: Vocabulary synonyms
  • Q45–Q67: Grammar / sentence completion (first block)
  • Q68–Q70: Vocabulary antonyms
  • Q71–Q100: Grammar / sentence completion (second block)
  • ALL go into "standalone" array — do not stop at Q67, there is a second grammar block after the antonyms
  • If a word is italicised in the original, write it in CAPS in question_text
    e.g. "The word SURMOUNT means..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 100 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
   - Vocabulary: explain the word meaning and why the option is correct
   - Grammar: name the specific rule being tested
   - Comprehension: cite the relevant part of the passage
   - Cloze: explain why this word fits the blank grammatically or contextually
4. section codes for standalone:
   - "vocab"   → synonyms, antonyms, vocabulary-in-context
   - "grammar" → sentence completion, concord, tense, structure
   - "oral"    → vowel sounds, consonants, rhyme, stress patterns
   - "idiom"   → idioms, phrasal verbs, sentence interpretation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
V1=synonym  V2=antonym  V3=idiom/phrasal_verb  V4=vocab_in_context
G1=grammar_fill  G2=subject_verb_agreement  G3=tense  G4=question_tags  G5=word_class  G6=degree_comparison
O1=vowel  O2=consonant  O3=rhyme  O4=word_stress  O5=emphatic_stress
C1=main_idea  C2=inference  C3=vocab_in_context  C4=tone  C5=specific_detail
CL1=verb_fill  CL2=noun_fill  CL3=prep_fill  CL4=connector_fill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPICS — use ONLY these, pick the most specific match
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildTopicList()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "year": <number|null>,
  "subject": "Use of English",
  "standalone": [
    {
      "original_number": <number>,
      "section": "<vocab|grammar|oral|idiom>",
      "question_text": "<full text — italicised words in CAPS>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — 1-2 sentences, never blank>",
      "pattern_code": "<code|null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": [
    {
      "type": "<comprehension|cloze>",
      "passage_text": "<FULL passage — cloze blanks as: (1) ___ (2) ___ etc.>",
      "questions": [
        {
          "original_number": <number>,
          "question_text": "<text>",
          "option_a": "<text>",
          "option_b": "<text>",
          "option_c": "<text|null>",
          "option_d": "<text|null>",
          "correct_option": "<a|b|c|d|null>",
          "explanation": "<REQUIRED — 1-2 sentences, never blank>",
          "position": <blank number for cloze | question index for comprehension>,
          "topic": "<from topic list>",
          "subtopic": "<from subtopic list>"
        }
      ]
    }
  ]
}
`