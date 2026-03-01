import { useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { getSectionsForSubject } from '../../hooks/useAdminData'

interface Props {
  subjectId: string
  onGetOrCreateTopic: (name: string) => Promise<string | null>
  onDone: () => void
}

interface ParsedRow {
  question_id: string | null
  question_text: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_option: string | null
  explanation: string | null
  difficulty_level: string | null
  topic_name: string | null
  section: string | null
  question_type: string | null
  pattern_code: string | null
  issues: string[]
  skip: boolean
}

// CSV column order for standalone questions
// question_id, question_text, option_a, option_b, option_c, option_d,
// correct_option, explanation, difficulty, topic, section, question_type, year, pattern_code
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { cell += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      row.push(cell.trim()); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); rows.push(row); row = []; cell = ''
    } else {
      cell += ch
    }
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row) }
  return rows
}

// All sections across all known subjects — for validation
const VALID_SECTIONS = getSectionsForSubject('Use of English').map(s => s.key)

function parseRows(rows: string[][]): ParsedRow[] {
  const isHeader = rows[0]?.[0]?.toLowerCase().includes('question')
  const dataRows = isHeader ? rows.slice(1) : rows
  return dataRows
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const issues: string[] = []
      const question_text = r[1] || null
      const correct_option = (r[6] || '').toLowerCase().trim()
      const section = r[10]?.toLowerCase().trim() || null

      if (!question_text) issues.push('Missing question text')
      if (!correct_option || !['a','b','c','d'].includes(correct_option)) issues.push('Invalid correct option')
      if (section && !VALID_SECTIONS.includes(section)) issues.push(`Unknown section: "${section}"`)

      return {
        question_id: r[0] || null,
        question_text,
        option_a: r[2] || null,
        option_b: r[3] || null,
        option_c: r[4] || null,
        option_d: r[5] || null,
        correct_option: correct_option || null,
        explanation: r[7] || null,
        difficulty_level: r[8] || 'medium',
        topic_name: r[9] || null,
        section,
        question_type: r[11] || 'mcq',
        pattern_code: r[12] || null,
        issues,
        skip: false,
      }
    })
}

const SECTION_LABELS: Record<string, string> = {
  grammar: 'Grammar', vocab: 'Vocab', oral: 'Oral',
  idiom: 'Idiom', literature: 'Literature',
}

export default function BulkImport({ subjectId, onGetOrCreateTopic, onDone }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRows(parseRows(parseCSV(text)))
      setResult(null)
    }
    reader.readAsText(file)
  }

  const toggleSkip = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, skip: !r.skip } : r))
  }

  const handleImport = async () => {
    setImporting(true)
    let inserted = 0, skipped = 0, errors = 0

    for (const row of rows) {
      if (row.skip || !row.question_text) { skipped++; continue }
      try {
        const topicId = row.topic_name ? await onGetOrCreateTopic(row.topic_name) : null
        const { error } = await supabaseAdmin.from('questions').insert({
          subject_id: subjectId,
          topic_id: topicId,
          question_id: row.question_id || null,
          question_text: row.question_text,
          option_a: row.option_a || '',
          option_b: row.option_b || '',
          option_c: row.option_c || '',
          option_d: row.option_d || '',
          correct_option: row.correct_option || 'a',
          explanation: row.explanation || null,
          difficulty_level: row.difficulty_level || 'medium',
          render_type: 'text',
          section: row.section || null,
          question_type: row.question_type || 'mcq',
          year: null,
          pattern_code: row.pattern_code || null,
          passage_id: null,
          status: 'floating',
        })
        if (error) errors++
        else inserted++
      } catch { errors++ }
    }

    setImporting(false)
    setResult({ inserted, skipped, errors })
    setRows([])
    onDone()
  }

  const validCount = rows.filter(r => !r.skip && r.question_text).length

  return (
    <div className="space-y-4">
      {/* CSV spec */}
      <div className="bg-white border border-gray-200 p-5">
        <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-3">CSV Column Order</p>
        <div className="grid grid-cols-7 gap-1">
          {[
            ['Col 1', 'question_id'],
            ['Col 2', 'question_text'],
            ['Col 3', 'option_a'],
            ['Col 4', 'option_b'],
            ['Col 5', 'option_c'],
            ['Col 6', 'option_d'],
            ['Col 7', 'correct_option'],
            ['Col 8', 'explanation'],
            ['Col 9', 'difficulty'],
            ['Col 10', 'topic'],
            ['Col 11', 'section'],
            ['Col 12', 'question_type'],
            ['Col 13', 'pattern_code'],
          ].map(([col, field]) => (
            <div key={col} className="bg-gray-50 border border-gray-100 px-2 py-1.5 text-center">
              <p className="text-xs text-gray-400">{col}</p>
              <p className="text-xs font-mono font-bold text-gray-700">{field}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-500">
            <span className="font-bold">section</span> must be one of:{' '}
            {Object.entries(SECTION_LABELS).map(([k, v]) => (
              <span key={k} className="inline-block font-mono text-gray-700 mr-1">{k}</span>
            ))}
          </p>
          <p className="text-xs text-blue-500">
            ⚠ This import is for standalone questions only (grammar, vocab, oral, idiom, literature).
            Use <strong>Passage Builder</strong> for comprehension and cloze.
          </p>
          <p className="text-xs text-gray-400">
            Incomplete rows are accepted — they land as floating for review.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="bg-white border-2 border-dashed border-gray-200 px-6 py-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <p className="text-sm font-black text-gray-800 mb-1">Drop CSV here or click to upload</p>
        <p className="text-xs text-gray-400">14 columns per row · UTF-8 encoding</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white border border-gray-200 px-5 py-4 flex items-center gap-6">
          <span className="text-sm"><span className="font-black text-green-700">{result.inserted}</span> <span className="text-gray-500">inserted</span></span>
          <span className="text-sm"><span className="font-black text-gray-400">{result.skipped}</span> <span className="text-gray-500">skipped</span></span>
          {result.errors > 0 && <span className="text-sm"><span className="font-black text-red-600">{result.errors}</span> <span className="text-gray-500">errors</span></span>}
          <span className="text-xs text-gray-400 ml-auto">All inserted as floating → review in Floating Queue</span>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              Preview — {rows.length} rows
            </p>
            <p className="text-xs text-gray-400">{validCount} will import</p>
          </div>

          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {rows.map((row, i) => (
              <div key={i} className={`px-5 py-3 flex items-start gap-4 ${row.skip ? 'opacity-40' : ''}`}>
                <button onClick={() => toggleSkip(i)}
                  className={`flex-shrink-0 w-5 h-5 border mt-0.5 transition-colors ${
                    row.skip ? 'bg-gray-200 border-gray-300' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  title={row.skip ? 'Include' : 'Skip'}>
                  {!row.skip && <span className="text-xs leading-none text-gray-600 flex items-center justify-center h-full">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {row.question_id && <span className="text-xs font-mono text-gray-400">{row.question_id}</span>}
                    {row.section && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 font-medium">{row.section}</span>
                    )}
                    {row.pattern_code && <span className="text-xs font-mono text-gray-400">{row.pattern_code}</span>}
                    {row.issues.map((issue, j) => (
                      <span key={j} className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200">{issue}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {row.question_text || <span className="text-red-400 italic">No question text</span>}
                  </p>
                </div>

                <span className={`flex-shrink-0 text-xs font-medium uppercase ${row.correct_option ? 'text-gray-500' : 'text-red-400'}`}>
                  {row.correct_option ? `→ ${row.correct_option.toUpperCase()}` : '?'}
                </span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-100">
            <button onClick={handleImport} disabled={importing || validCount === 0}
              className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {importing ? 'Importing...' : `Import ${validCount} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}