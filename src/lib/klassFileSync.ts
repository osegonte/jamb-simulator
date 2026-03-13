// src/lib/klassFileSync.ts
// File-based sync between Jamsulator and KLASS Studio.
// No shared DB — user downloads a file from one app and uploads to the other.

import { supabaseAdmin } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KlassSubtopic {
  external_id: string
  name: string
  order: number
}

interface KlassTopic {
  external_id: string
  name: string
  order: number
  objectives: string[]
  subtopics: KlassSubtopic[]
}

interface KlassSubject {
  external_id: string
  name: string
  order: number
  topics: KlassTopic[]
}

export interface CurriculumExport {
  source: 'jamsulator'
  exported_at: string
  subjects: KlassSubject[]
}

interface KlassOption { id: string; text: string }

interface KlassQuestion {
  external_question_id: string
  subject_external_id: string
  subtopic_external_id: string
  subject_name: string
  topic_name: string
  subtopic_name: string
  type: 'mcq' | 'truefalse' | 'fillingap'
  question_text: string
  options: KlassOption[]
  correct_answer: string
  explanation?: string
}

export interface QuestionsImport {
  source: 'klass-studio'
  exported_at: string
  questions: KlassQuestion[]
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportCurriculum(): Promise<void> {
  // 1 — Subjects
  const { data: subjects, error: sErr } = await supabaseAdmin
    .from('subjects')
    .select('id, name')
    .order('name')

  if (sErr || !subjects) throw new Error('Failed to load subjects: ' + sErr?.message)

  // 2 — Topics (all at once — 440 rows is well under the 1000 limit)
  const { data: topics, error: tErr } = await supabaseAdmin
    .from('topics')
    .select('id, name, subject_id, objectives')
    .order('name')

  if (tErr || !topics) throw new Error('Failed to load topics: ' + tErr?.message)

  // 3 — Subtopics (paginated — 3388 rows)
  const PAGE_SIZE = 1000
  let page = 0
  const allSubtopics: { id: string; name: string; topic_id: string }[] = []
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('subtopics')
      .select('id, name, topic_id')
      .order('name')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw new Error('Failed to load subtopics: ' + error.message)
    if (!data || data.length === 0) break
    allSubtopics.push(...data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  // 4 — Build lookup maps
  const topicsBySubject = new Map<string, typeof topics>()
  for (const t of topics) {
    if (!topicsBySubject.has(t.subject_id)) topicsBySubject.set(t.subject_id, [])
    topicsBySubject.get(t.subject_id)!.push(t)
  }

  const subtopicsByTopic = new Map<string, typeof allSubtopics>()
  for (const st of allSubtopics) {
    if (!subtopicsByTopic.has(st.topic_id)) subtopicsByTopic.set(st.topic_id, [])
    subtopicsByTopic.get(st.topic_id)!.push(st)
  }

  // 5 — Assemble
  const payload: CurriculumExport = {
    source: 'jamsulator',
    exported_at: new Date().toISOString(),
    subjects: subjects.map((s, si) => ({
      external_id: s.id,
      name: s.name,
      order: si,
      topics: (topicsBySubject.get(s.id) ?? []).map((t, ti) => ({
        external_id: t.id,
        name: t.name,
        order: ti,
        objectives: t.objectives ?? [],
        subtopics: (subtopicsByTopic.get(t.id) ?? []).map((st, sti) => ({
          external_id: st.id,
          name: st.name,
          order: sti,
        })),
      })),
    })),
  }

  // 6 — Trigger browser download
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `jamsulator-curriculum-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importKlassQuestions(file: File): Promise<ImportResult> {
  const raw = await file.text()
  let parsed: QuestionsImport

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { imported: 0, skipped: 0, errors: ['File is not valid JSON'] }
  }

  if (parsed.source !== 'klass-studio' || !Array.isArray(parsed.questions)) {
    return { imported: 0, skipped: 0, errors: ['File does not look like a KLASS Studio export'] }
  }

  const questions = parsed.questions
  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (const q of questions) {
    // Look up the subtopic in Jamsulator's DB using the external_id KLASS sent back
    const { data: subtopic } = await supabaseAdmin
      .from('subtopics')
      .select('id, topic_id, subject_id')
      .eq('id', q.subtopic_external_id)
      .maybeSingle()

    if (!subtopic) {
      errors.push(`Subtopic not found for question: "${q.question_text.slice(0, 60)}..."`)
      skipped++
      continue
    }

    // Map options array → option_a/b/c/d columns
    const optMap = Object.fromEntries(q.options.map(o => [o.id, o.text]))
    const optionA = optMap['a'] ?? optMap['true']  ?? q.options[0]?.text ?? ''
    const optionB = optMap['b'] ?? optMap['false'] ?? q.options[1]?.text ?? ''
    const optionC = optMap['c'] ?? q.options[2]?.text ?? ''
    const optionD = optMap['d'] ?? q.options[3]?.text ?? ''

    // Check for duplicate via external_question_id stored in explanation prefix (lightweight dedup)
    const { data: existing } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('external_question_id', q.external_question_id)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { error: insertError } = await supabaseAdmin
      .from('questions')
      .insert({
        external_question_id: q.external_question_id,
        subject_id:           subtopic.subject_id,
        topic_id:             subtopic.topic_id,
        subtopic_id:          subtopic.id,
        question_text:        q.question_text,
        option_a:             optionA,
        option_b:             optionB,
        option_c:             optionC,
        option_d:             optionD,
        correct_option:       q.correct_answer,
        explanation:          q.explanation ?? null,
        difficulty_level:     'medium',
        render_type:          'text',
        question_type:        q.type === 'truefalse' ? 'truefalse' : 'mcq',
        status:               'floating',
        year:                 null,
      })

    if (insertError) {
      // If column doesn't exist yet, fall back without external_question_id
      if (insertError.code === '42703') {
        const { error: fallbackError } = await supabaseAdmin
          .from('questions')
          .insert({
            subject_id:       subtopic.subject_id,
            topic_id:         subtopic.topic_id,
            subtopic_id:      subtopic.id,
            question_text:    q.question_text,
            option_a:         optionA,
            option_b:         optionB,
            option_c:         optionC,
            option_d:         optionD,
            correct_option:   q.correct_answer,
            explanation:      q.explanation ?? null,
            difficulty_level: 'medium',
            render_type:      'text',
            question_type:    q.type === 'truefalse' ? 'truefalse' : 'mcq',
            status:           'floating',
            year:             null,
          })
        if (fallbackError) {
          errors.push(`Insert failed: ${fallbackError.message}`)
          skipped++
          continue
        }
      } else {
        errors.push(`Insert failed: ${insertError.message}`)
        skipped++
        continue
      }
    }

    imported++
  }

  return { imported, skipped, errors }
}