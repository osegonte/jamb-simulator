// src/config/subjects/prompts.ts
import { ENGLISH_CONFIG } from './english'
import { MATHEMATICS_CONFIG } from './mathematics'

function topicList(topics: Record<string, readonly string[] | { subtopics: readonly string[]; objectives: readonly string[] }>): string {
  return Object.entries(topics).map(([t, v]) => {
    const subs = Array.isArray(v) ? v : (v as { subtopics: readonly string[] }).subtopics
    return `${t} → ${subs.join(' | ')}`
  }).join('\n')
}

export const ENGLISH_PROMPT = `You are extracting JAMB Use of English past exam questions from a PDF.
Return ONLY raw JSON — no markdown, no code fences.

PAPER STRUCTURE (60 questions):
Section A (25): comprehension×5, summary×5, cloze×10, reading_text×5
Section B (30): sentence_interpretation×5, antonym×5, synonym×5, grammar×10
Section C (10): vowel×2, consonant×2, rhyme×2, word_stress×2, emphatic_stress×2

RULES:
- Extract ALL ~60 questions. Never stop early.
- Copy FULL passage text — never summarise.
- Cloze: full passage with blanks as (1)___ etc. question_text = full sentence containing that blank.
- Highlighted/italicised words: write in CAPS e.g. "The word SURMOUNT means"
- correct_option: from answer key only. If absent, set null — never guess.
- explanation: REQUIRED for every question. Write a clear 1-2 sentence explanation of why the correct answer is right. If correct_option is null, still write an explanation of what the question is testing. Never leave explanation null or empty.

JSON SCHEMA:
{"year":<n|null>,"subject":"Use of English",
 "standalone":[{"original_number":<n>,"section":"<code>","question_text":"<text>","option_a":"<text>","option_b":"<text>","option_c":"<text|null>","option_d":"<text|null>","correct_option":"<a|b|c|d|null>","explanation":"<REQUIRED — why is this the correct answer?>","pattern_code":"<code|null>","topic":"<from list>","subtopic":"<from list>"}],
 "groups":[{"type":"<comprehension|summary|cloze|reading_text>","passage_text":"<full text>","questions":[{"original_number":<n>,"question_text":"<text>","option_a":"<text>","option_b":"<text>","option_c":"<text|null>","option_d":"<text|null>","correct_option":"<a|b|c|d|null>","explanation":"<REQUIRED — why is this the correct answer?>","position":<n>,"topic":"<from list>","subtopic":"<from list>"}]}]}

PATTERN CODES: V1=synonym V2=antonym V3=sentence_interp G1=grammar_fill G2=concord G3=tenses G4=question_tags G5=word_classes G6=degree O1=vowel O2=consonant O3=rhyme O4=word_stress O5=emphatic_stress C1=main_idea C2=inference C3=vocab_in_context C4=tone C5=specific_detail CL1=verb_fill CL2=noun_fill CL3=prep_fill CL4=connector_fill

TOPICS (use only these):
${topicList(ENGLISH_CONFIG.topics)}`

export const MATHS_PROMPT = `You are extracting JAMB Mathematics past exam questions from a PDF.
Return ONLY raw JSON — no markdown, no code fences.

PAPER STRUCTURE: ~50 standalone MCQ, no passages.

RULES:
- Extract ALL questions. Never stop early.
- correct_option: from answer key only. If absent, set null — never guess.
- explanation: REQUIRED for every question. Write a clear step-by-step solution showing how to arrive at the correct answer. Show the working. Never leave explanation null or empty.
- EQUATIONS: use LaTeX — $x^2+3x-4$, $\\frac{3}{4}$, $\\sqrt{16}$, $\\sin\\theta$, $\\log_2 8$
- DIAGRAMS: if question references "figure/diagram/graph" → needs_diagram:true, write diagram_description
- render_type: "latex" if equations, "image" if diagram-only, "text" if plain

JSON SCHEMA:
{"year":<n|null>,"subject":"Mathematics",
 "standalone":[{"original_number":<n>,"question_text":"<text>","option_a":"<text>","option_b":"<text>","option_c":"<text|null>","option_d":"<text|null>","correct_option":"<a|b|c|d|null>","explanation":"<REQUIRED — step by step working>","render_type":"<text|latex|image>","needs_diagram":<bool>,"diagram_description":"<text|null>","topic":"<from list>","subtopic":"<from list>"}],
 "groups":[]}

DIAGRAM FORMAT: "Triangle ABC, right angle at B, AB=3cm, BC=4cm" / "Parabola y=x²-4, x-intercepts at ±2"

TOPICS (use only these):
${topicList(MATHEMATICS_CONFIG.topics)}`

export function genericPrompt(subjectName: string): string {
  return `You are extracting JAMB ${subjectName} past exam questions from a PDF.
Return ONLY raw JSON — no markdown, no code fences.

RULES:
- Extract ALL questions. Never stop early.
- correct_option: from answer key only. If absent, set null — never guess.
- explanation: REQUIRED for every single question. Write a clear 1-2 sentence explanation of why the correct answer is right. Never leave explanation null or empty.
- topic and subtopic: assign from the subject syllabus based on what the question is testing.

JSON SCHEMA:
{"year":<n|null>,"subject":"${subjectName}","standalone":[{"original_number":<n>,"question_text":"<text>","option_a":"<text>","option_b":"<text>","option_c":"<text|null>","option_d":"<text|null>","correct_option":"<a|b|c|d|null>","explanation":"<REQUIRED — why is this correct?>","topic":"<topic>","subtopic":"<subtopic>"}],"groups":[]}`
}