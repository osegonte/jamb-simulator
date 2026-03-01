import { useState } from 'react'
import type { AdminQuestion, Topic } from '../../hooks/useAdminData'
import { isQuestionIdTaken, getSectionsForSubject, PATTERN_CODES } from '../../hooks/useAdminData'
import { supabaseAdmin } from '../../lib/supabase'

interface Props {
  question: AdminQuestion
  topics: Topic[]
  onSave: (updates: Partial<AdminQuestion>) => Promise<boolean>
  onClose: () => void
}

const inputClass = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
const labelClass = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'

export default function EditQuestionModal({ question, topics, onSave, onClose }: Props) {
  const [form, setForm] = useState({ ...question })
  const [topicInput, setTopicInput] = useState(question.topics?.name || '')
  const [topicSuggestions, setTopicSuggestions] = useState<Topic[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [newQuestionImage, setNewQuestionImage] = useState<File | null>(null)
  const [idStatus, setIdStatus] = useState<'ok' | 'taken' | 'checking'>('ok')
  const [saving, setSaving] = useState(false)

  const patternOptions = form.section ? (PATTERN_CODES[form.section] || []) : []
  // Show all known English sections in dropdown; other subjects have no section taxonomy yet
  const allSections = getSectionsForSubject('Use of English')

  const handleTopicInput = (val: string) => {
    setTopicInput(val)
    if (val.trim()) {
      setTopicSuggestions(topics.filter(t => t.name.toLowerCase().includes(val.toLowerCase())))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleIdChange = async (val: string) => {
    setForm({ ...form, question_id: val })
    if (val.trim() && val !== question.question_id) {
      setIdStatus('checking')
      const taken = await isQuestionIdTaken(val.trim(), question.id)
      setIdStatus(taken ? 'taken' : 'ok')
    } else {
      setIdStatus('ok')
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabaseAdmin.storage.from('question-images').upload(path, file)
    if (error) return null
    const { data } = supabaseAdmin.storage.from('question-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (idStatus === 'taken') return
    setSaving(true)
    let questionImageUrl = form.question_image_url
    if (newQuestionImage) questionImageUrl = await uploadImage(newQuestionImage)

    const ok = await onSave({
      question_id: form.question_id,
      question_text: form.question_text,
      passage_text: form.passage_text,
      question_image_url: questionImageUrl,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      correct_option: form.correct_option,
      explanation: form.explanation,
      difficulty_level: form.difficulty_level,
      status: form.status,
      topic_id: form.topic_id,
      section: form.section,
      question_type: form.question_type,
      pattern_code: form.pattern_code,
    })

    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl my-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-black">Edit Question</h2>
            {question.question_id && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">{question.question_id}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-6 space-y-4">

          {/* Question ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass} style={{ marginBottom: 0 }}>Question ID</label>
              {idStatus === 'checking' && <span className="text-xs text-gray-400">Checking...</span>}
              {idStatus === 'taken' && <span className="text-xs text-red-500 font-medium">✗ Taken</span>}
              {idStatus === 'ok' && <span className="text-xs text-green-600 font-medium">✓ OK</span>}
            </div>
            <input type="text"
              className={`${inputClass} font-mono text-xs ${idStatus === 'taken' ? 'border-red-300' : ''}`}
              value={form.question_id || ''}
              onChange={e => handleIdChange(e.target.value)}
            />
          </div>

          {/* Section */}
          <div>
            <label className={labelClass}>Section</label>
            <select className={inputClass} value={form.section || ''}
              onChange={e => setForm({ ...form, section: e.target.value, pattern_code: null })}>
              <option value="">— select —</option>
              {allSections.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Pattern code */}
          {patternOptions.length > 0 && (
            <div>
              <label className={labelClass}>Pattern Code</label>
              <select className={inputClass} value={form.pattern_code || ''}
                onChange={e => setForm({ ...form, pattern_code: e.target.value })}>
                <option value="">— select —</option>
                {patternOptions.map(p => (
                  <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Topic */}
          <div className="relative">
            <label className={labelClass}>Topic Tag</label>
            <input type="text" className={inputClass}
              value={topicInput}
              onChange={e => handleTopicInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type topic name..."
            />
            {showSuggestions && topicSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 z-10 max-h-40 overflow-y-auto">
                {topicSuggestions.map(t => (
                  <button key={t.id} type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setTopicInput(t.name)
                      setForm({ ...form, topic_id: t.id })
                      setShowSuggestions(false)
                    }}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question text */}
          <div>
            <label className={labelClass}>Question Text</label>
            <textarea className={`${inputClass} resize-none`} rows={4}
              value={form.question_text}
              onChange={e => setForm({ ...form, question_text: e.target.value })}
            />
          </div>

          {/* Question image */}
          <div>
            <label className={labelClass}>Diagram <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
            {form.question_image_url && (
              <img src={form.question_image_url} alt="Current" className="w-full max-h-40 object-contain bg-gray-50 border border-gray-200 mb-2 p-2" />
            )}
            <input type="file" accept="image/*"
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-200 file:text-xs file:font-bold file:bg-white file:text-gray-700 hover:file:border-gray-400 cursor-pointer"
              onChange={e => setNewQuestionImage(e.target.files?.[0] || null)}
            />
            {newQuestionImage && <p className="text-xs text-green-600 mt-1">✓ {newQuestionImage.name}</p>}
          </div>

          {/* Options */}
          {(['a', 'b', 'c', 'd'] as const).map(opt => (
            <div key={opt}>
              <label className={labelClass}>Option {opt.toUpperCase()}</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, correct_option: opt })}
                  className={`w-8 h-9 text-xs font-black border flex-shrink-0 transition-colors ${
                    form.correct_option === opt ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}>
                  {opt.toUpperCase()}
                </button>
                <input type="text" className={inputClass}
                  value={form[`option_${opt}` as keyof AdminQuestion] as string || ''}
                  onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                />
              </div>
            </div>
          ))}

          {/* Explanation */}
          <div>
            <label className={labelClass}>Explanation</label>
            <textarea className={`${inputClass} resize-none`} rows={2}
              value={form.explanation || ''}
              onChange={e => setForm({ ...form, explanation: e.target.value })}
            />
          </div>

          {/* Difficulty + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Difficulty</label>
              <select className={inputClass} value={form.difficulty_level}
                onChange={e => setForm({ ...form, difficulty_level: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status || 'floating'}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="floating">Floating</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Passage info (read-only if linked) */}
          {form.passage_id && (
            <div className="bg-purple-50 border border-purple-100 px-4 py-3">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Linked to Passage</p>
              <p className="text-xs text-purple-500 font-mono">{form.passages?.group_id}</p>
              {form.position_in_passage && (
                <p className="text-xs text-purple-400 mt-0.5">Blank position: {form.position_in_passage}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:border-gray-400">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || idStatus === 'taken'}
            className="flex-1 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}