import { useState, useEffect } from 'react'
import type { AdminQuestion, Topic, Passage } from '../../hooks/useAdminData'

interface Props {
  questions: AdminQuestion[]
  passages: Passage[]
  topics: Topic[]
  onUpdate: (id: string, updates: Partial<AdminQuestion>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

// ─── Standalone reviewer ──────────────────────────────────────────────────────
function StandaloneReviewer({ questions, topics, onUpdate, onDelete }: Omit<Props, 'passages'>) {
  const [index, setIndex] = useState(0)
  const [topicInput, setTopicInput] = useState('')
  const [topicSuggestions, setTopicSuggestions] = useState<Topic[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editText, setEditText] = useState('')
  const [editExplanation, setEditExplanation] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')

  const q = questions[Math.min(index, questions.length - 1)]

  useEffect(() => {
    if (!q) return
    setEditText(q.question_text)
    setEditExplanation(q.explanation || '')
    setEditDifficulty(q.difficulty_level || 'medium')
    setTopicInput(q.topics?.name || '')
  }, [q?.id])

  useEffect(() => {
    if (questions.length > 0 && index >= questions.length) setIndex(questions.length - 1)
  }, [questions.length])

  const loadQuestion = (i: number) => setIndex(Math.max(0, Math.min(i, questions.length - 1)))

  const handleTopicInput = (val: string) => {
    setTopicInput(val)
    setTopicSuggestions(val.trim() ? topics.filter(t => t.name.toLowerCase().includes(val.toLowerCase())) : [])
    setShowSuggestions(!!val.trim())
  }

  const handleApprove = async () => {
    if (!q) return
    setSaving(true)
    await onUpdate(q.id, { status: 'approved', question_text: editText, explanation: editExplanation, difficulty_level: editDifficulty })
    setSaving(false)
  }

  const handleMarkReview = async () => {
    if (!q) return
    setSaving(true)
    await onUpdate(q.id, { status: 'in_review' })
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!q || !confirm('Delete this question permanently?')) return
    setSaving(true)
    await onDelete(q.id)
    setSaving(false)
  }

  if (questions.length === 0) return (
    <div className="bg-white border border-gray-200 px-6 py-16 text-center">
      <p className="text-2xl font-black text-green-600 mb-2">✓ Queue Clear</p>
      <p className="text-sm text-gray-400">No standalone questions to review.</p>
    </div>
  )

  const options = [
    { key: 'a', text: q?.option_a },
    { key: 'b', text: q?.option_b },
    { key: 'c', text: q?.option_c },
    { key: 'd', text: q?.option_d },
  ].filter(o => !!o.text?.trim())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          Reviewing {index + 1} of {questions.length}
        </p>
        <div className="flex gap-1 flex-wrap max-w-xs justify-end">
          {questions.map((_, i) => (
            <button key={i} onClick={() => loadQuestion(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-black' : 'bg-gray-200 hover:bg-gray-400'}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          {q?.question_id && <span className="text-xs font-mono text-gray-400">{q.question_id}</span>}
          <span className="text-xs font-bold px-2 py-0.5 bg-yellow-100 text-yellow-700">FLOATING</span>
          {q?.section && <span className="text-xs text-gray-400 capitalize">{q.section}</span>}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="relative">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Topic Tag</p>
            <input type="text"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              value={topicInput} onChange={e => handleTopicInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Assign a topic tag..."
            />
            {showSuggestions && topicSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 z-10 max-h-40 overflow-y-auto">
                {topicSuggestions.map(t => (
                  <button key={t.id} type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onMouseDown={() => { setTopicInput(t.name); setShowSuggestions(false) }}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Question</p>
            <textarea className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-gray-400"
              rows={3} value={editText} onChange={e => setEditText(e.target.value)} />
          </div>

          <div className="space-y-1">
            {options.map(({ key, text }) => (
              <div key={key} className={`flex items-start gap-3 px-3 py-2 text-sm ${
                q?.correct_option === key ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <span className={`font-black text-xs uppercase mt-0.5 w-4 flex-shrink-0 ${
                  q?.correct_option === key ? 'text-green-700' : 'text-gray-400'
                }`}>{key}</span>
                <span className={q?.correct_option === key ? 'text-green-800' : 'text-gray-700'}>{text}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Explanation</p>
            <textarea className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-gray-400"
              rows={2} value={editExplanation} onChange={e => setEditExplanation(e.target.value)}
              placeholder="Add explanation..." />
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Difficulty</p>
            <select className="border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none"
              value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <button onClick={handleDelete} disabled={saving}
            className="px-4 py-2.5 border border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50">
            Delete
          </button>
          <button onClick={handleMarkReview} disabled={saving}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors disabled:opacity-50">
            Mark Review
          </button>
          <button onClick={handleApprove} disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : '✓ Approve'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => loadQuestion(index - 1)} disabled={index === 0}
          className="px-4 py-2 border border-gray-200 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition-colors">
          ← Prev
        </button>
        <div className="flex-1" />
        <button onClick={() => loadQuestion(index + 1)} disabled={index >= questions.length - 1}
          className="px-4 py-2 border border-gray-200 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition-colors">
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Grouped reviewer ─────────────────────────────────────────────────────────
function GroupedReviewer({ questions, passages, onUpdate, onDelete }: Omit<Props, 'topics'>) {
  const [groupIndex, setGroupIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  // Build a lookup map from passage id → passage
  const passageMap = new Map(passages.map(p => [p.id, p]))

  const groups = (() => {
    const map = new Map<string, AdminQuestion[]>()
    for (const q of questions) {
      const key = q.passage_id || 'unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(q)
    }
    return [...map.entries()].map(([passageId, qs]) => ({
      passageId,
      passage: passageMap.get(passageId) || null,
      questions: qs,
    }))
  })()

  useEffect(() => {
    if (groups.length > 0 && groupIndex >= groups.length) setGroupIndex(groups.length - 1)
  }, [groups.length])

  if (groups.length === 0) return (
    <div className="bg-white border border-gray-200 px-6 py-16 text-center">
      <p className="text-2xl font-black text-green-600 mb-2">✓ Queue Clear</p>
      <p className="text-sm text-gray-400">No grouped questions to review.</p>
    </div>
  )

  const group = groups[groupIndex]
  const passage = group?.passage
  const passageType = passage?.passage_type || 'comprehension'

  const typeColor: Record<string, string> = {
    comprehension: 'bg-purple-100 text-purple-700',
    cloze: 'bg-blue-100 text-blue-700',
    stimulus: 'bg-orange-100 text-orange-700',
  }

  const handleApproveAll = async () => {
    setSaving(true)
    for (const q of group.questions) await onUpdate(q.id, { status: 'approved' })
    setSaving(false)
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${group.questions.length} questions in this group?`)) return
    setSaving(true)
    for (const q of group.questions) await onDelete(q.id)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          Group {groupIndex + 1} of {groups.length}
        </p>
        <div className="flex gap-1">
          {groups.map((_, i) => (
            <button key={i} onClick={() => setGroupIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === groupIndex ? 'bg-black' : 'bg-gray-200 hover:bg-gray-400'}`}
            />
          ))}
        </div>
      </div>

      {/* Passage */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 capitalize ${typeColor[passageType] || 'bg-gray-100 text-gray-600'}`}>
            {passageType}
          </span>
          <span className="text-xs font-mono text-gray-400">{passage?.group_id || group.passageId.slice(0, 8)}</span>
          <span className="text-xs text-gray-400 ml-auto">{group.questions.length} questions</span>
        </div>
        {passage?.passage_image_url && (
          <div className="px-6 pt-5">
            <img src={passage.passage_image_url} alt="Passage" className="w-full max-h-64 object-contain bg-gray-50 border border-gray-200 p-2" />
          </div>
        )}
        {passage?.passage_text && (
          <div className="px-6 py-5">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Passage</p>
            <div className="bg-gray-50 border border-gray-100 px-4 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
              {passage.passage_text}
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {group.questions.map((q, i) => {
          const options = [
            { key: 'a', text: q.option_a },
            { key: 'b', text: q.option_b },
            { key: 'c', text: q.option_c },
            { key: 'd', text: q.option_d },
          ].filter(o => !!o.text?.trim())

          return (
            <div key={q.id} className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                {q.question_id && <span className="text-xs font-mono text-gray-300">{q.question_id}</span>}
                {passageType === 'cloze' && q.position_in_passage && (
                  <span className="text-xs text-blue-500">Blank {q.position_in_passage}</span>
                )}
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 ${
                  q.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {q.status === 'approved' ? 'APPROVED' : 'FLOATING'}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-gray-800 leading-relaxed">{q.question_text}</p>
                <div className="space-y-1">
                  {options.map(({ key, text }) => (
                    <div key={key} className={`flex items-start gap-3 px-3 py-1.5 text-sm ${
                      q.correct_option === key ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <span className={`font-black text-xs uppercase mt-0.5 w-4 flex-shrink-0 ${
                        q.correct_option === key ? 'text-green-700' : 'text-gray-400'
                      }`}>{key}</span>
                      <span className={q.correct_option === key ? 'text-green-800' : 'text-gray-700'}>{text}</span>
                    </div>
                  ))}
                </div>
                {q.explanation && <p className="text-xs text-gray-400 italic">{q.explanation}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleDeleteAll} disabled={saving}
          className="px-4 py-2.5 border border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50">
          Delete Group
        </button>
        <button onClick={handleApproveAll} disabled={saving}
          className="flex-1 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
          {saving ? 'Approving...' : `✓ Approve All ${group.questions.length} Questions`}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setGroupIndex(i => Math.max(0, i - 1))} disabled={groupIndex === 0}
          className="px-4 py-2 border border-gray-200 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition-colors">
          ← Prev Group
        </button>
        <div className="flex-1" />
        <button onClick={() => setGroupIndex(i => Math.min(groups.length - 1, i + 1))} disabled={groupIndex >= groups.length - 1}
          className="px-4 py-2 border border-gray-200 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition-colors">
          Next Group →
        </button>
      </div>
    </div>
  )
}

// ─── Main FloatingQueue with toggle ───────────────────────────────────────────
export default function FloatingQueue({ questions, passages, topics, onUpdate, onDelete }: Props) {
  const [mode, setMode] = useState<'standalone' | 'grouped'>('standalone')

  const standaloneQs = questions.filter(q => !q.passage_id)
  const groupedQs = questions.filter(q => !!q.passage_id)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-gray-100 p-1 w-fit">
        <button onClick={() => setMode('standalone')}
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            mode === 'standalone' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}>
          Standalone <span className="font-mono">{standaloneQs.length}</span>
        </button>
        <button onClick={() => setMode('grouped')}
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            mode === 'grouped' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}>
          Grouped <span className="font-mono">{groupedQs.length}</span>
        </button>
      </div>

      {mode === 'standalone'
        ? <StandaloneReviewer questions={standaloneQs} topics={topics} onUpdate={onUpdate} onDelete={onDelete} />
        : <GroupedReviewer questions={groupedQs} passages={passages} topics={topics} onUpdate={onUpdate} onDelete={onDelete} />
      }
    </div>
  )
}