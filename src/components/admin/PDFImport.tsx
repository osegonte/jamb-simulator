import { useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'

interface Props {
  subjectId: string
  subjectName: string
  onDone: () => void
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtractedStandalone {
  section: 'grammar' | 'vocab' | 'oral' | 'idiom' | 'literature'
  question_text: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  correct_option: 'a' | 'b' | 'c' | 'd' | null
  explanation?: string
  pattern_code?: string
  topic: string
  subtopic: string
}

interface ExtractedGroupQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  correct_option: 'a' | 'b' | 'c' | 'd' | null
  explanation?: string
  position?: number
  topic: string
  subtopic: string
}

interface ExtractedGroup {
  type: 'comprehension' | 'cloze'
  passage_text: string
  questions: ExtractedGroupQuestion[]
}

interface ExtractedData {
  year: number | null
  subject: string
  standalone: ExtractedStandalone[]
  groups: ExtractedGroup[]
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are extracting JAMB (Joint Admissions and Matriculation Board) past exam questions from a PDF for Use of English.

Return ONLY a raw JSON object — no markdown, no explanation, no code fences.

JSON structure:
{
  "year": <number or null>,
  "subject": "Use of English",
  "standalone": [
    {
      "section": "<grammar|vocab|oral|idiom|literature>",
      "question_text": "<full question text>",
      "option_a": "<text>", "option_b": "<text>",
      "option_c": "<text or null>", "option_d": "<text or null>",
      "correct_option": "<a|b|c|d or null if not in PDF>",
      "explanation": "<optional>",
      "pattern_code": "<optional>",
      "topic": "<from fixed list>",
      "subtopic": "<from fixed list>"
    }
  ],
  "groups": [
    {
      "type": "<comprehension|cloze>",
      "passage_text": "<full passage. Cloze: mark blanks as (1) ___ (2) ___ etc.>",
      "questions": [
        {
          "question_text": "<text>",
          "option_a": "<text>", "option_b": "<text>",
          "option_c": "<text or null>", "option_d": "<text or null>",
          "correct_option": "<a|b|c|d or null>",
          "explanation": "<optional>",
          "position": <blank number for cloze, null for comprehension>,
          "topic": "<from fixed list>",
          "subtopic": "<from fixed list>"
        }
      ]
    }
  ]
}

SECTION RULES:
- grammar: concord, tenses, pronouns, prepositions, conjunctions, clauses, sentence correction, articles, question tags
- vocab: synonyms, antonyms, word in context, phrasal verbs
- oral: vowel sounds, consonant sounds, stress patterns, emphatic stress, rhyme
- idiom: idioms, proverbs, figurative language, sentence interpretation
- literature: character, theme, plot, style & language
- comprehension passages → type "comprehension"
- cloze tests → type "cloze"

FIXED TOPIC + SUBTOPIC LIST — only use values from this list:

Main Idea → Identifying main idea | Title selection | Central argument
Inference → Implied meaning | Logical conclusion | Author intent
Vocabulary in Context → Word meaning from passage | Contextual definition
Tone & Attitude → Author tone | Speaker attitude | Mood identification
Specific Detail → Factual recall | Detail location
Concord → Subject-verb agreement | Agreement with collective nouns | Agreement with indefinite pronouns
Tenses → Simple tenses | Perfect tenses | Continuous tenses | Tense consistency
Pronouns → Pronoun case | Pronoun reference | Reflexive pronouns
Prepositions → Preposition of place | Preposition of time | Prepositional phrases
Conjunctions → Coordinating conjunctions | Subordinating conjunctions | Correlative conjunctions
Clauses & Phrases → Relative clauses | Noun clauses | Adverbial clauses | Phrase types
Sentence Correction → Error identification | Grammatical correction
Articles → Definite article | Indefinite article | Zero article
Question Tags → Positive tags | Negative tags | Tag with auxiliaries
Synonyms → Direct synonym | Closest in meaning
Antonyms → Direct antonym | Opposite in meaning
Word in Context → Contextual word choice | Register | Collocations
Phrasal Verbs → Meaning of phrasal verbs | Phrasal verb usage
Vowel Sounds → Vowel sound matching | Long vs short vowels | Diphthongs
Consonant Sounds → Consonant matching | Silent consonants
Stress Patterns → Word stress | Sentence stress
Emphatic Stress → Emphatic stress shift | Stress and meaning
Rhyme → Rhyming words | End rhyme
Idioms → Idiom meaning | Idiom usage
Proverbs → Proverb meaning | Proverb application
Figurative Language → Simile | Metaphor | Personification | Hyperbole
Sentence Interpretation → Meaning of sentence | Implied meaning in sentences
Verb/Tense Fill → Correct verb form | Tense consistency in cloze
Noun/Pronoun Fill → Correct noun | Correct pronoun in cloze
Preposition Fill → Correct preposition in cloze
Connector Fill → Conjunctions in cloze | Transition words
Character → Character identification | Character traits | Character relationships
Theme → Central theme | Sub-themes
Plot → Plot events | Conflict | Resolution
Style & Language → Literary devices | Diction | Narrative technique

Pick the closest match. If uncertain use the parent topic and its first subtopic as default.
Extract every single question — do not skip any.`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectionColor(s: string) {
  return ({ grammar: 'bg-green-100 text-green-700', vocab: 'bg-blue-100 text-blue-700', oral: 'bg-yellow-100 text-yellow-700', idiom: 'bg-pink-100 text-pink-700', literature: 'bg-orange-100 text-orange-700' } as Record<string, string>)[s] || 'bg-gray-100 text-gray-600'
}
function sectionLabel(s: string) {
  return ({ grammar: 'Grammar', vocab: 'Vocab', oral: 'Oral', idiom: 'Idiom', literature: 'Literature' } as Record<string, string>)[s] || s
}

async function getOrCreateTopic(subjectId: string, name: string): Promise<string | null> {
  const { data: ex } = await supabaseAdmin.from('topics').select('id').eq('subject_id', subjectId).ilike('name', name).maybeSingle()
  if (ex) return (ex as { id: string }).id
  const { data: cr } = await supabaseAdmin.from('topics').insert({ subject_id: subjectId, name }).select('id').single()
  return (cr as { id: string } | null)?.id || null
}

async function getOrCreateSubtopic(topicId: string, subjectId: string, name: string): Promise<string | null> {
  const { data: ex } = await supabaseAdmin.from('subtopics').select('id').eq('topic_id', topicId).ilike('name', name).maybeSingle()
  if (ex) return (ex as { id: string }).id
  const { data: cr } = await supabaseAdmin.from('subtopics').insert({ topic_id: topicId, subject_id: subjectId, name }).select('id').single()
  return (cr as { id: string } | null)?.id || null
}

async function nextQuestionId(subjectId: string, prefix: string): Promise<string> {
  const { data } = await supabaseAdmin.from('questions').select('question_id').eq('subject_id', subjectId).not('question_id', 'is', null)
  const nums = (data || [])
    .map((r: { question_id: string }) => r.question_id)
    .filter((id: string) => id?.startsWith(prefix + '_'))
    .map((id: string) => parseInt(id.split('_')[1] || '0', 10))
    .filter((n: number) => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefix}_${String(next).padStart(3, '0')}`
}

function makeGroupId(type: string, subjectName: string, year: number | null, existingIds: string[]): string {
  const subj = subjectName.slice(0, 3).toUpperCase()
  const prefix = type === 'comprehension' ? 'COMP' : 'CLOZE'
  const base = `${prefix}_${subj}${year ? `_${year}` : ''}`
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const candidate = `${base}_${letter}`
    if (!existingIds.includes(candidate)) return candidate
  }
  return `${base}_${Date.now()}`
}

function subjectPrefix(name: string): string {
  const map: Record<string, string> = {
    'Use of English': 'ENG', 'English': 'ENG',
    'Mathematics': 'MTH', 'Maths': 'MTH',
    'Physics': 'PHY', 'Chemistry': 'CHM', 'Biology': 'BIO',
  }
  return map[name] || name.slice(0, 3).toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PDFImport({ subjectId, subjectName, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [year, setYear] = useState('')
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inserting, setInserting] = useState(false)
  const [progress, setProgress] = useState('')
  const [insertResult, setInsertResult] = useState<{ standalone: number; groups: number; questions: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const prefix = subjectPrefix(subjectName)

  const handleFile = (f: File) => {
    setFile(f); setExtracted(null); setError(null); setInsertResult(null)
    const m = f.name.match(/20\d{2}/); if (m) setYear(m[0])
  }

  const processWithAI = async () => {
    if (!file) return
    setProcessing(true); setError(null); setExtracted(null)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('Failed to read file'))
        r.readAsDataURL(file)
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: year ? `JAMB ${subjectName} past questions ${year}. Extract all questions.` : `JAMB ${subjectName} past questions. Extract all questions.` },
          ]}],
        }),
      })

      if (!response.ok) {
        const e = await response.json().catch(() => ({}))
        throw new Error((e as { error?: { message?: string } })?.error?.message || `API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.content?.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '').join('') || ''
      const parsed: ExtractedData = JSON.parse(text.replace(/```json|```/g, '').trim())
      if (year) parsed.year = parseInt(year)
      setExtracted(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally { setProcessing(false) }
  }

  const insertAll = async () => {
    if (!extracted) return
    setInserting(true)
    let standaloneCount = 0, groupCount = 0, questionCount = 0

    for (let i = 0; i < extracted.standalone.length; i++) {
      const q = extracted.standalone[i]
      setProgress(`Standalone ${i + 1} / ${extracted.standalone.length}`)
      const topicId = q.topic ? await getOrCreateTopic(subjectId, q.topic) : null
      const subtopicId = topicId && q.subtopic ? await getOrCreateSubtopic(topicId, subjectId, q.subtopic) : null
      const qId = await nextQuestionId(subjectId, prefix)
      const { error } = await supabaseAdmin.from('questions').insert({
        subject_id: subjectId, topic_id: topicId, subtopic_id: subtopicId,
        question_id: qId, question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c || null, option_d: q.option_d || null,
        correct_option: q.correct_option || 'a',
        explanation: q.explanation || null, difficulty_level: 'medium',
        render_type: 'text', section: q.section,
        question_type: q.section === 'oral' ? 'oral' : q.section === 'literature' ? 'literature' : 'mcq',
        pattern_code: q.pattern_code || null, year: extracted.year,
        status: 'floating', passage_id: null,
      })
      if (!error) { standaloneCount++; questionCount++ }
    }

    const { data: existingP } = await supabaseAdmin.from('passages').select('group_id').eq('subject_id', subjectId)
    const existingIds = (existingP || []).map((p: { group_id: string }) => p.group_id)

    for (let gi = 0; gi < extracted.groups.length; gi++) {
      const group = extracted.groups[gi]
      setProgress(`Group ${gi + 1} / ${extracted.groups.length}`)
      const groupId = makeGroupId(group.type, subjectName, extracted.year, existingIds)
      existingIds.push(groupId)
      const { data: passageData, error: pErr } = await supabaseAdmin.from('passages').insert({
        group_id: groupId, subject_id: subjectId, passage_type: group.type,
        passage_text: group.passage_text, passage_image_url: null, year: extracted.year,
      }).select('id').single()
      if (pErr || !passageData) continue
      groupCount++
      for (let qi = 0; qi < group.questions.length; qi++) {
        const q = group.questions[qi]
        const topicId = q.topic ? await getOrCreateTopic(subjectId, q.topic) : null
        const subtopicId = topicId && q.subtopic ? await getOrCreateSubtopic(topicId, subjectId, q.subtopic) : null
        const qId = await nextQuestionId(subjectId, prefix)
        const { error } = await supabaseAdmin.from('questions').insert({
          subject_id: subjectId, topic_id: topicId, subtopic_id: subtopicId,
          question_id: qId, question_text: q.question_text,
          option_a: q.option_a, option_b: q.option_b,
          option_c: q.option_c || null, option_d: q.option_d || null,
          correct_option: q.correct_option || 'a',
          explanation: q.explanation || null, difficulty_level: 'medium',
          render_type: 'text', section: group.type,
          question_type: group.type === 'cloze' ? 'cloze' : 'passage',
          passage_id: (passageData as { id: string }).id,
          position_in_passage: group.type === 'cloze' ? (q.position ?? qi + 1) : null,
          year: extracted.year, status: 'floating', pattern_code: null,
        })
        if (!error) questionCount++
      }
    }

    setProgress('')
    setInserting(false)
    setInsertResult({ standalone: standaloneCount, groups: groupCount, questions: questionCount })
    setExtracted(null); setFile(null); setYear('')
    onDone()
  }

  const total = extracted
    ? extracted.standalone.length + extracted.groups.reduce((s, g) => s + g.questions.length, 0)
    : 0

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 p-5">
        <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-2">AI PDF Import</p>
        <p className="text-sm text-gray-600 leading-relaxed">Upload one year's JAMB past questions PDF. Claude extracts every question, tags topic + subtopic from the fixed English taxonomy, and loads everything as floating for review.</p>
        <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-400">
          <span>✓ Comprehension + cloze passages</span>
          <span>✓ Grammar / Vocab / Oral / Idiom</span>
          <span>✓ Topic + subtopic auto-tagged</span>
          <span>✓ Teacher corrects in Floating Queue</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">
            Year <span className="text-gray-300 font-normal normal-case">(auto-detected from filename)</span>
          </label>
          <input type="text"
            className="w-40 bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            placeholder="e.g. 2019" value={year} onChange={e => setYear(e.target.value)} />
        </div>

        <div
          className="border-2 border-dashed border-gray-200 px-6 py-10 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
          {file ? (
            <div><p className="text-sm font-black text-black mb-1">✓ {file.name}</p><p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · click to change</p></div>
          ) : (
            <><p className="text-sm font-black text-gray-800 mb-1">Drop PDF here or click to upload</p><p className="text-xs text-gray-400">One year per upload</p></>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        <button onClick={processWithAI} disabled={!file || processing}
          className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {processing
            ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Claude is reading the PDF...</span>
            : 'Extract Questions with AI →'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">Extraction Failed</p>
          <p className="text-xs text-red-600 font-mono">{error}</p>
        </div>
      )}

      {insertResult && (
        <div className="bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-6 flex-wrap">
          <span className="text-sm"><span className="font-black text-green-700">{insertResult.questions}</span> <span className="text-gray-500">questions inserted as floating</span></span>
          <span className="text-sm"><span className="font-black">{insertResult.standalone}</span> <span className="text-gray-500">standalone</span></span>
          <span className="text-sm"><span className="font-black text-purple-700">{insertResult.groups}</span> <span className="text-gray-500">groups</span></span>
          <span className="text-xs text-gray-400 ml-auto">Go to Floating Queue to review</span>
        </div>
      )}

      {extracted && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 px-5 py-4 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Extracted</p>
              <p className="text-2xl font-black text-black">{total} questions</p>
            </div>
            <div className="h-12 w-px bg-gray-100" />
            <div className="space-y-1 text-sm">
              <p><span className="font-black">{extracted.standalone.length}</span><span className="text-gray-500 ml-1">standalone</span></p>
              <p><span className="font-black text-purple-700">{extracted.groups.length}</span><span className="text-gray-500 ml-1">groups ({extracted.groups.reduce((s, g) => s + g.questions.length, 0)} Qs)</span></p>
            </div>
            {extracted.year && <><div className="h-12 w-px bg-gray-100" /><div><p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Year</p><p className="text-xl font-black">{extracted.year}</p></div></>}
          </div>

          {extracted.standalone.length > 0 && (
            <div className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Standalone — {extracted.standalone.length}</p>
                <div className="flex gap-2 flex-wrap">
                  {(['grammar', 'vocab', 'oral', 'idiom', 'literature'] as const).map(sec => {
                    const c = extracted.standalone.filter(q => q.section === sec).length
                    return c ? <span key={sec} className={`text-xs font-bold px-2 py-0.5 ${sectionColor(sec)}`}>{sectionLabel(sec)} {c}</span> : null
                  })}
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {extracted.standalone.map((q, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 mt-0.5 ${sectionColor(q.section)}`}>{sectionLabel(q.section)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{q.question_text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{q.topic} <span className="text-gray-300">→</span> {q.subtopic}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold text-gray-400 uppercase">→ {q.correct_option || '?'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extracted.groups.length > 0 && (
            <div className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Groups — {extracted.groups.length}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {extracted.groups.map((g, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 ${g.type === 'comprehension' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{g.type.toUpperCase()}</span>
                      <span className="text-xs text-gray-400">{g.questions.length} questions</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 font-mono bg-gray-50 px-3 py-2 leading-relaxed">{g.passage_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-400 mb-3">
              All {total} questions insert as <span className="font-bold text-yellow-600">floating</span> with topic + subtopic. Correct any tags in Floating Queue before approving.
            </p>
            {inserting && progress && <p className="text-xs font-mono text-gray-400 mb-3 animate-pulse">{progress}</p>}
            <button onClick={insertAll} disabled={inserting}
              className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {inserting
                ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Inserting...</span>
                : `Insert All ${total} Questions → Floating Queue`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}