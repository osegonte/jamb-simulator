// src/components/admin/PDFImport.tsx
// One PDF, one year, one subject at a time.
// Uses the subject's own prompt file (via prompts/index.ts) — no generic fallback.
// Diagrams are flagged + described only → DiagramQueue. Never generated here.
// DB inserts are batched 50 at a time to keep things stable.

import { useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { getConfig, getPrefix }                     from '../../config/manifest'
import { getPromptForSubject, hasPromptForSubject } from '../../config/subjects/prompts/index'

interface Props {
  subjectId:   string
  subjectName: string
  onDone:      () => void
}

// ── Extracted shapes — must match the JSON schema in each prompt file ─────────
interface ExtractedQuestion {
  original_number?:     number | null
  section?:             string | null
  question_text:        string
  option_a:             string
  option_b:             string
  option_c?:            string | null
  option_d?:            string | null
  correct_option:       'a' | 'b' | 'c' | 'd' | null
  explanation?:         string | null
  pattern_code?:        string | null
  render_type?:         'text' | 'latex' | 'image'
  needs_diagram?:       boolean
  diagram_type?:        string | null
  diagram_description?: string | null
  topic:                string
  subtopic:             string
  position?:            number | null
}

interface ExtractedGroup {
  type:                 'comprehension' | 'cloze' | 'stimulus' | 'data_response' | 'summary' | 'reading_text'
  passage_text:         string
  needs_diagram?:       boolean
  diagram_type?:        string | null
  diagram_description?: string | null
  questions:            ExtractedQuestion[]
}

interface Extracted {
  year:       number | null
  standalone: ExtractedQuestion[]
  groups:     ExtractedGroup[]
}

interface FailedInsert {
  number:        number | null
  question_text: string
  reason:        string
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function upsertTopic(subjectId: string, name: string): Promise<string | null> {
  if (!name?.trim()) return null
  const { data: ex } = await supabaseAdmin
    .from('topics').select('id')
    .eq('subject_id', subjectId).ilike('name', name.trim()).maybeSingle()
  if (ex) return (ex as { id: string }).id
  const { data } = await supabaseAdmin
    .from('topics').insert({ subject_id: subjectId, name: name.trim() }).select('id').single()
  return (data as { id: string } | null)?.id ?? null
}

async function upsertSubtopic(topicId: string, subjectId: string, name: string): Promise<string | null> {
  if (!name?.trim() || !topicId) return null
  const { data: ex } = await supabaseAdmin
    .from('subtopics').select('id')
    .eq('topic_id', topicId).ilike('name', name.trim()).maybeSingle()
  if (ex) return (ex as { id: string }).id
  const { data } = await supabaseAdmin
    .from('subtopics').insert({ topic_id: topicId, subject_id: subjectId, name: name.trim() }).select('id').single()
  return (data as { id: string } | null)?.id ?? null
}

// Counter is initialised once before the insert loop, then incremented locally.
// Never reads DB inside the loop — prevents all questions getting the same ID.
async function getStartingCounter(prefix: string, subjectId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('questions').select('question_id')
    .eq('subject_id', subjectId).not('question_id', 'is', null)
  const nums = (data ?? [])
    .map((r: { question_id: string }) => r.question_id)
    .filter((id: string) => id?.startsWith(prefix + '_'))
    .map((id: string) => parseInt(id.split('_').pop() ?? '0', 10))
    .filter((n: number) => !isNaN(n))
  return nums.length ? Math.max(...nums) + 1 : 1
}

function makeQId(prefix: string, year: number | null, originalNumber: number | null, counter: number): string {
  if (originalNumber) {
    return `${prefix}_${year ?? 'XX'}_${String(originalNumber).padStart(3, '0')}`
  }
  return `${prefix}_${String(counter).padStart(3, '0')}`
}

function makeGroupId(type: string, prefix: string, year: number | null, existing: string[]): string {
  const code = ({ comprehension: 'COMP', summary: 'SUM', cloze: 'CLOZE', reading_text: 'READ', stimulus: 'STIM', data_response: 'DATA' } as Record<string, string>)[type] ?? 'GRP'
  const base = `${code}_${prefix}${year ? `_${year}` : ''}`
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const id = `${base}_${l}`
    if (!existing.includes(id)) return id
  }
  return `${base}_${Date.now()}`
}

// ── JSON recovery for truncated responses ─────────────────────────────────────
function recover(raw: string): Extracted | null {
  const extractObjects = (str: string) => {
    const out: string[] = []
    let depth = 0, start = -1
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') { if (!depth) start = i; depth++ }
      else if (str[i] === '}') { depth--; if (!depth && start !== -1) { out.push(str.slice(start, i + 1)); start = -1 } }
    }
    return out
  }

  const result: Extracted = { year: null, standalone: [], groups: [] }
  const ym = raw.match(/"year"\s*:\s*(\d{4})/)
  if (ym) result.year = parseInt(ym[1])

  const saMatch = raw.match(/"standalone"\s*:\s*\[([\s\S]*?)(?=\]\s*,\s*"groups"|\]\s*}|$)/)
  if (saMatch) {
    for (const o of extractObjects(saMatch[1])) {
      try { const q = JSON.parse(o); if (q.question_text) result.standalone.push(q) } catch { /* skip */ }
    }
  }

  const grMatch = raw.match(/"groups"\s*:\s*\[([\s\S]*?)(?=\]\s*}|$)/)
  if (grMatch) {
    for (const o of extractObjects(grMatch[1])) {
      try { const g = JSON.parse(o); if (g.passage_text && Array.isArray(g.questions)) result.groups.push(g) } catch { /* skip */ }
    }
  }

  return (result.standalone.length || result.groups.length) ? result : null
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PDFImport({ subjectId, subjectName, onDone }: Props) {
  const config      = getConfig(subjectName)
  const prefix      = getPrefix(subjectName)
  const totalQ      = config?.totalQuestions ?? 60
  const promptReady = hasPromptForSubject(subjectName)

  const [file,          setFile]          = useState<File | null>(null)
  const [year,          setYear]          = useState('')
  const [processing,    setProcessing]    = useState(false)
  const [extracted,     setExtracted]     = useState<Extracted | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [inserting,     setInserting]     = useState(false)
  const [progress,      setProgress]      = useState('')
  const [result,        setResult]        = useState<{ inserted: number; failed: number; groups: number; diagrams: number } | null>(null)
  const [failedInserts, setFailedInserts] = useState<FailedInsert[]>([])
  const [showFailed,    setShowFailed]    = useState(false)
  const [alreadyExists, setAlreadyExists] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const yr = parseInt(year) || null

  const handleFile = (f: File) => {
    setFile(f); setExtracted(null); setError(null); setResult(null)
    setFailedInserts([]); setAlreadyExists(false)
    // Auto-detect year from filename
    const m = f.name.match(/20\d{2}/)
    if (m) setYear(m[0])
  }

  const checkYearExists = async (y: number) => {
    const { data } = await supabaseAdmin
      .from('questions').select('id', { count: 'exact', head: true })
      .eq('subject_id', subjectId).eq('year', y)
    return (data as unknown as { count: number } | null)?.count ?? 0
  }

  // ── Extract ─────────────────────────────────────────────────────────────────
  const extract = async () => {
    if (!file || !promptReady) return
    setProcessing(true); setError(null); setExtracted(null); setAlreadyExists(false)

    // Check if this year is already imported
    if (yr) {
      const count = await checkYearExists(yr)
      if (count > 0) {
        setAlreadyExists(true)
        // Don't block — just warn. User may want to re-import a partial year.
      }
    }

    const systemPrompt = getPromptForSubject(subjectName)

    const userMessage = [
      `This is a JAMB ${subjectName} past paper${yr ? ` for ${yr}` : ''}.`,
      `Extract ALL ${totalQ} questions exactly as they appear.`,
      ``,
      `DIAGRAMS — extract every question even when its diagram is missing from the scan:`,
      `• If the question references a figure, diagram, graph, circuit, map, or table → needs_diagram: true`,
      `• Set diagram_type to the best match`,
      `• Write diagram_description using all labelled points, values, and components in the question text`,
      `• Passage/group stimuli can also have needs_diagram at the group level`,
      ``,
      `Return ONLY raw JSON — no markdown, no code fences.`,
    ].join('\n')

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('Could not read file'))
        r.readAsDataURL(file)
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':                              'application/json',
          'x-api-key':                                 import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
          'anthropic-version':                         '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 64000,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text',     text: userMessage },
          ]}],
        }),
      })

      if (!response.ok) {
        const e = await response.json().catch(() => ({}))
        throw new Error((e as { error?: { message?: string } })?.error?.message ?? `API error ${response.status}`)
      }

      const data = await response.json()
      const rawText = (data.content ?? [])
        .map((c: { type: string; text?: string }) => c.type === 'text' ? c.text ?? '' : '')
        .join('')
      const cleaned = rawText.replace(/```json|```/g, '').trim()

      let parsed: Extracted
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        const recovered = recover(cleaned)
        if (!recovered) {
          throw new Error(
            data.stop_reason === 'max_tokens'
              ? 'Response was cut off. The PDF may be too dense. Try a cleaner scan.'
              : 'Could not parse the response. Check PDF quality and try again.'
          )
        }
        parsed = recovered
        const total = parsed.standalone.length + parsed.groups.reduce((s, g) => s + g.questions.length, 0)
        setError(`⚠ Partial extraction — recovered ${total} questions before cutoff. Review before inserting.`)
      }

      if (yr && !parsed.year) parsed.year = yr
      setExtracted(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setProcessing(false)
    }
  }

  // ── Insert ──────────────────────────────────────────────────────────────────
  const insert = async () => {
    if (!extracted) return
    setInserting(true)

    // Warn before navigating away
    const guardUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', guardUnload)

    let inserted = 0, gCount = 0, dCount = 0
    const failed: FailedInsert[] = []
    const year = extracted.year

    // Get starting counter ONCE for the whole import — shared across standalone + grouped
    let counter = await getStartingCounter(prefix, subjectId)

    // ── STANDALONE — prepare all rows then batch insert 50 at a time ─────────
    if (extracted.standalone.length > 0) {
      setProgress(`Preparing ${extracted.standalone.length} questions…`)
      const rows: Record<string, unknown>[] = []

      for (let i = 0; i < extracted.standalone.length; i++) {
        const q = extracted.standalone[i]

        if (!q.question_text?.trim()) {
          failed.push({ number: q.original_number ?? i + 1, question_text: '(empty)', reason: 'Empty question text' })
          continue
        }
        if (!q.option_a?.trim() || !q.option_b?.trim()) {
          failed.push({ number: q.original_number ?? i + 1, question_text: q.question_text.slice(0, 60), reason: 'Missing option A or B' })
          continue
        }

        const topicId    = await upsertTopic(subjectId, q.topic)
        const subtopicId = topicId && q.subtopic ? await upsertSubtopic(topicId, subjectId, q.subtopic) : null
        const qId        = makeQId(prefix, year, q.original_number ?? null, counter)
        if (!q.original_number) counter++

        if (q.needs_diagram) dCount++

        rows.push({
          subject_id:          subjectId,
          topic_id:            topicId,
          subtopic_id:         subtopicId,
          question_id:         qId,
          question_text:       q.question_text,
          option_a:            q.option_a ?? '',
          option_b:            q.option_b ?? '',
          option_c:            q.option_c ?? null,
          option_d:            q.option_d ?? null,
          correct_option:      q.correct_option ?? null,
          explanation:         q.explanation ?? null,
          difficulty_level:    'medium',
          render_type:         q.render_type ?? 'text',
          section:             q.section ?? null,
          question_type:       'mcq',
          pattern_code:        q.pattern_code ?? null,
          year,
          status:              'floating',
          passage_id:          null,
          needs_diagram:       q.needs_diagram ?? false,
          diagram_status:      q.needs_diagram ? 'pending' : 'none',
          diagram_type:        q.diagram_type ?? null,
          diagram_description: q.diagram_description ?? null,
          diagram_url:         null,
        })
      }

      const BATCH = 50
      for (let b = 0; b < rows.length; b += BATCH) {
        const chunk = rows.slice(b, b + BATCH)
        setProgress(`Inserting Q${b + 1}–${Math.min(b + BATCH, rows.length)} of ${rows.length}…`)
        const { error: bErr } = await supabaseAdmin.from('questions').insert(chunk)
        if (bErr) {
          chunk.forEach((r, i) => failed.push({
            number: b + i + 1,
            question_text: String(r.question_text).slice(0, 60),
            reason: bErr.message,
          }))
        } else {
          inserted += chunk.length
        }
      }
    }

    // ── GROUPED questions (comprehension, cloze, stimulus, data_response) ─────
    if (extracted.groups.length > 0) {
      const { data: ep } = await supabaseAdmin
        .from('passages').select('group_id').eq('subject_id', subjectId)
      const existingIds = (ep ?? []).map((p: { group_id: string }) => p.group_id)

      for (let gi = 0; gi < extracted.groups.length; gi++) {
        const g   = extracted.groups[gi]
        const gId = makeGroupId(g.type, prefix, year, existingIds)
        existingIds.push(gId)

        setProgress(`Passage ${gi + 1} of ${extracted.groups.length} (${g.questions.length} questions)…`)

        if (g.needs_diagram) dCount++

        const { data: pd, error: pe } = await supabaseAdmin
          .from('passages').insert({
            group_id:            gId,
            subject_id:          subjectId,
            passage_type:        g.type,
            passage_text:        g.passage_text,
            passage_image_url:   null,
            year,
            needs_diagram:       g.needs_diagram ?? false,
            diagram_status:      g.needs_diagram ? 'pending' : 'none',
            diagram_type:        g.diagram_type ?? null,
            diagram_description: g.diagram_description ?? null,
            diagram_url:         null,
          })
          .select('id').single()

        if (pe || !pd) {
          failed.push({ number: null, question_text: `Passage ${gi + 1} (${g.type})`, reason: pe?.message ?? 'Insert failed' })
          continue
        }

        gCount++

        for (let qi = 0; qi < g.questions.length; qi++) {
          const q          = g.questions[qi]
          const topicId    = await upsertTopic(subjectId, q.topic)
          const subtopicId = topicId && q.subtopic ? await upsertSubtopic(topicId, subjectId, q.subtopic) : null
          const qId        = makeQId(prefix, year, q.original_number ?? null, counter)
          if (!q.original_number) counter++

          if (q.needs_diagram) dCount++

          const { error: qErr } = await supabaseAdmin.from('questions').insert({
            subject_id:          subjectId,
            topic_id:            topicId,
            subtopic_id:         subtopicId,
            question_id:         qId,
            question_text:       q.question_text,
            option_a:            q.option_a ?? '',
            option_b:            q.option_b ?? '',
            option_c:            q.option_c ?? null,
            option_d:            q.option_d ?? null,
            correct_option:      q.correct_option ?? null,
            explanation:         q.explanation ?? null,
            difficulty_level:    'medium',
            render_type:         q.render_type ?? 'text',
            section:             g.type,
            question_type:       g.type === 'cloze' ? 'cloze' : 'passage',
            pattern_code:        q.pattern_code ?? null,
            year,
            status:              'floating',
            passage_id:          (pd as { id: string }).id,
            position_in_passage: q.position ?? qi + 1,
            needs_diagram:       q.needs_diagram ?? false,
            diagram_status:      q.needs_diagram ? 'pending' : 'none',
            diagram_type:        q.diagram_type ?? null,
            diagram_description: q.diagram_description ?? null,
            diagram_url:         null,
          })

          if (qErr) {
            failed.push({ number: q.original_number ?? qi + 1, question_text: q.question_text.slice(0, 60), reason: qErr.message })
          } else {
            inserted++
          }
        }
      }
    }

    window.removeEventListener('beforeunload', guardUnload)
    setProgress('')
    setInserting(false)
    setResult({ inserted, failed: failed.length, groups: gCount, diagrams: dCount })
    setFailedInserts(failed)
    if (failed.length) setShowFailed(true)
    setExtracted(null); setFile(null); setYear('')
    onDone()
  }

  // ── Derived preview stats ─────────────────────────────────────────────────
  const totalExtracted  = extracted
    ? extracted.standalone.length + extracted.groups.reduce((s, g) => s + g.questions.length, 0)
    : 0
  const totalDiagrams   = extracted
    ? extracted.standalone.filter(q => q.needs_diagram).length
      + extracted.groups.filter(g => g.needs_diagram).length
      + extracted.groups.reduce((s, g) => s + g.questions.filter(q => q.needs_diagram).length, 0)
    : 0
  const missingAnswers  = extracted?.standalone.filter(q => !q.correct_option).length ?? 0
  const expectedQ       = totalQ

  const GROUP_COLOURS: Record<string, string> = {
    comprehension: 'bg-purple-100 text-purple-700',
    summary:       'bg-teal-100 text-teal-700',
    cloze:         'bg-blue-100 text-blue-700',
    reading_text:  'bg-amber-100 text-amber-700',
    stimulus:      'bg-orange-100 text-orange-700',
    data_response: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-1">
              PDF Import — {subjectName}
            </p>
            <p className="text-xs text-gray-400">
              One PDF per year · {expectedQ} questions expected · diagrams flagged → Diagram Queue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-300">{prefix}</span>
            <span className={`text-xs font-bold px-2 py-0.5 ${promptReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {promptReady ? 'Prompt ✓' : 'No prompt'}
            </span>
          </div>
        </div>

        {!promptReady && (
          <div className="mt-3 bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs font-bold text-red-600">
              Build <span className="font-mono">src/config/subjects/prompts/{subjectName.toLowerCase().replace(/\s+/g, '-')}.ts</span> and register it in <span className="font-mono">prompts/index.ts</span> before importing.
            </p>
          </div>
        )}
      </div>

      {/* Year + file */}
      <div className="bg-white border border-gray-200 p-5 space-y-4">

        <div>
          <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Year</label>
          <input
            type="text" maxLength={4} placeholder="e.g. 2020"
            value={year} onChange={e => setYear(e.target.value)}
            className="w-28 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 text-center"
          />
        </div>

        {alreadyExists && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs font-bold text-amber-700">
              ⚠ {subjectName} {year} has already been imported. You can still proceed — questions will be added alongside existing ones.
            </p>
          </div>
        )}

        <div
          className="border-2 border-dashed border-gray-200 px-6 py-10 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          {file
            ? <div>
                <p className="text-sm font-black">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · click to change</p>
              </div>
            : <>
                <p className="text-sm font-black text-gray-700">Drop PDF or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">One year per upload</p>
              </>
          }
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        <button
          onClick={extract}
          disabled={!file || processing || !promptReady}
          className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {processing
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reading PDF…
              </span>
            : `Extract${year ? ` (${year})` : ''} →`
          }
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={`border px-5 py-3 ${error.startsWith('⚠') ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-mono ${error.startsWith('⚠') ? 'text-orange-600' : 'text-red-600'}`}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 px-5 py-3 flex items-center gap-4 flex-wrap text-sm">
            <span><span className="font-black text-green-700">{result.inserted}</span> <span className="text-gray-500">inserted</span></span>
            {result.groups > 0 && <span><span className="font-black text-purple-700">{result.groups}</span> <span className="text-gray-500">passages</span></span>}
            {result.diagrams > 0 && <span><span className="font-black text-amber-600">{result.diagrams} 📐</span> <span className="text-gray-500">→ Diagram Queue</span></span>}
            {result.failed > 0 && <span><span className="font-black text-red-600">{result.failed}</span> <span className="text-gray-500">failed</span></span>}
            <span className="text-xs text-gray-400 ml-auto">→ Floating Queue</span>
          </div>
          {failedInserts.length > 0 && (
            <div className="bg-red-50 border border-red-200">
              <button onClick={() => setShowFailed(p => !p)} className="w-full px-5 py-3 flex items-center justify-between">
                <p className="text-xs font-black tracking-widest text-red-600 uppercase">{failedInserts.length} failed — click to expand</p>
                <span className="text-red-400 text-xs">{showFailed ? '▲' : '▼'}</span>
              </button>
              {showFailed && (
                <div className="border-t border-red-200 divide-y divide-red-100 max-h-64 overflow-y-auto">
                  {failedInserts.map((f, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        {f.number && <span className="text-xs font-mono text-red-400">Q{f.number}</span>}
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5">{f.reason}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{f.question_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {extracted && (
        <div className="space-y-3">

          {/* Summary bar */}
          <div className="bg-white border border-gray-200 px-5 py-4 flex gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Extracted</p>
              <p className={`text-2xl font-black ${totalExtracted < expectedQ * 0.9 ? 'text-orange-500' : 'text-black'}`}>
                {totalExtracted}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {expectedQ}</span>
              </p>
            </div>
            {extracted.year && <>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Year</p>
                <p className="text-xl font-black">{extracted.year}</p>
              </div>
            </>}
            {totalDiagrams > 0 && <>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Diagrams</p>
                <p className="text-xl font-black text-amber-600">📐 {totalDiagrams}</p>
              </div>
            </>}
            {missingAnswers > 0 && <>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">No Answer</p>
                <p className="text-xl font-black text-orange-500">{missingAnswers}</p>
              </div>
            </>}
          </div>

          {/* Count warning — block insert if significantly under expected */}
          {totalExtracted < expectedQ && (
            <div className={`border px-5 py-3 ${totalExtracted < expectedQ * 0.95 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`text-xs font-bold ${totalExtracted < expectedQ * 0.95 ? 'text-red-700' : 'text-orange-700'}`}>
                {totalExtracted < expectedQ * 0.95
                  ? `⛔ Only ${totalExtracted} of ${expectedQ} questions extracted — ${expectedQ - totalExtracted} missing. The PDF response was cut off. Re-extract before inserting.`
                  : `⚠ ${totalExtracted} of ${expectedQ} questions extracted — ${expectedQ - totalExtracted} missing. Check the PDF and consider re-extracting.`
                }
              </p>
            </div>
          )}
          {totalDiagrams > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-5 py-3">
              <p className="text-xs text-amber-700">
                <span className="font-bold">📐 {totalDiagrams} diagram questions</span> will be inserted as floating and added to Diagram Queue for resolution. No diagrams are generated here.
              </p>
            </div>
          )}
          {missingAnswers > 0 && (
            <div className="bg-orange-50 border border-orange-200 px-5 py-3">
              <p className="text-xs text-orange-700">
                <span className="font-bold">{missingAnswers} questions</span> have no answer key — will insert with <code className="bg-orange-100 px-1">correct_option: null</code>. Fix in Floating Queue.
              </p>
            </div>
          )}

          {/* Standalone list */}
          {extracted.standalone.length > 0 && (
            <div className="bg-white border border-gray-200">
              <p className="px-5 py-3 text-xs font-black tracking-widest text-gray-500 uppercase border-b border-gray-100">
                Questions — {extracted.standalone.length}
              </p>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {extracted.standalone.map((q, i) => (
                  <div key={i} className="px-5 py-2 flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-300 w-7 text-right flex-shrink-0">
                      {q.original_number ?? i + 1}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {q.needs_diagram && <span className="text-xs flex-shrink-0" title="Needs diagram">📐</span>}
                      {q.render_type === 'latex' && <span className="text-xs flex-shrink-0 text-blue-400">∑</span>}
                      <span className="text-xs text-gray-600 truncate">{q.question_text}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-300 hidden sm:block truncate max-w-20">{q.topic?.slice(0, 14)}</span>
                      {q.explanation?.trim()
                        ? <span className="text-xs text-green-400" title="Has explanation">✓</span>
                        : <span className="text-xs text-yellow-400" title="No explanation">!</span>
                      }
                      <span className={`text-xs font-bold ${q.correct_option ? 'text-gray-400' : 'text-red-400'}`}>
                        {q.correct_option ? `→${q.correct_option.toUpperCase()}` : '?'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {extracted.groups.length > 0 && (
            <div className="bg-white border border-gray-200">
              <p className="px-5 py-3 text-xs font-black tracking-widest text-gray-500 uppercase border-b border-gray-100">
                Passages — {extracted.groups.length}
              </p>
              <div className="divide-y divide-gray-50">
                {extracted.groups.map((g, gi) => (
                  <div key={gi} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 ${GROUP_COLOURS[g.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {g.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{g.questions.length} questions</span>
                      {g.needs_diagram && <span className="text-xs font-bold text-amber-600">📐 passage diagram</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{g.passage_text.slice(0, 120)}…</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insert */}
          <div className="bg-white border border-gray-200 px-5 py-4">
            {inserting && (
              <p className="text-xs font-mono text-gray-400 mb-3 animate-pulse">{progress}</p>
            )}
            <button
              onClick={insert}
              disabled={inserting || totalExtracted < expectedQ * 0.95}
              className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {inserting
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Inserting…
                  </span>
                : totalExtracted < expectedQ * 0.95
                  ? `⛔ Re-extract first (${totalExtracted}/${expectedQ})`
                  : `Insert All ${totalExtracted} → Floating Queue`
              }
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
