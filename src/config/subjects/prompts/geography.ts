// src/config/subjects/prompts/geography.ts
// PLACEHOLDER — replace the prompt body with a dedicated analysis when ready.
// Use SUBJECT_PROMPT_TEMPLATE.md + 3 sample past questions to generate the real version.

import { GEOGRAPHY_CONFIG } from '../geography'

function buildTopicList(): string {
  return Object.entries(GEOGRAPHY_CONFIG.topics).map(([topic, data]) => {
    const subs = Array.isArray(data) ? data : (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const GEOGRAPHY_PROMPT = `You are extracting ALL questions from a JAMB Geography past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — ${(GEOGRAPHY_CONFIG as any).totalQuestions || 60} QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Geography papers frequently include map reading, bearing, and graph questions. These are standalone unless multiple questions share the same map or figure.

Put all standalone questions in "standalone".
Put passage/stimulus groups in "groups" — copy the FULL passage text exactly, never summarise.
If no grouped questions exist, "groups" must be [].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If absent set null — never guess
3. explanation: REQUIRED for every question — never null, never empty string
   State the key concept, fact, or rule being tested and why the correct option is right
4. render_type:
   - "latex"  → question has equations, symbols, fractions, or chemical/mathematical notation
   - "image"  → question references a diagram/figure/graph that must be seen to answer
   - "text"   → plain words only
5. needs_diagram: true when question says "in the diagram", "the figure shows",
   "from the graph", "the table shows", "refer to the diagram", or similar
6. diagram_type when needs_diagram is true — pick best match:
   bearing | coordinate | statistical | shaded | other
7. diagram_description: write a precise description of what the diagram shows,
   including all labelled points, values, axes, and components mentioned in the question

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPICS — assign ONLY from this list, pick the most specific match
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildTopicList()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "year": <number|null>,
  "subject": "Geography",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full question text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — 1-2 sentences, never blank>",
      "pattern_code": null,
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<type|null>",
      "diagram_description": "<description if needs_diagram, else null>",
      "topic": "<from topic list above>",
      "subtopic": "<from subtopic list above>"
    }
  ],
  "groups": [
    {
      "type": "<comprehension|cloze|stimulus|data_response>",
      "passage_text": "<FULL passage or stimulus text — never summarise>",
      "needs_diagram": <true|false>,
      "diagram_type": "<type|null>",
      "diagram_description": "<description if needs_diagram, else null>",
      "questions": [
        {
          "original_number": <number>,
          "question_text": "<text>",
          "option_a": "<text>",
          "option_b": "<text>",
          "option_c": "<text|null>",
          "option_d": "<text|null>",
          "correct_option": "<a|b|c|d|null>",
          "explanation": "<REQUIRED — never blank>",
          "pattern_code": null,
          "render_type": "<text|latex|image>",
          "needs_diagram": <true|false>,
          "diagram_type": "<type|null>",
          "diagram_description": "<description if needs_diagram, else null>",
          "position": <number — index within this group>,
          "topic": "<from topic list>",
          "subtopic": "<from subtopic list>"
        }
      ]
    }
  ]
}
`
