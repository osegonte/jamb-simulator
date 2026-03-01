import { useState, useEffect, useRef } from 'react'
import type { Topic } from '../../hooks/useAdminData'
import {
  generateQuestionId, isQuestionIdTaken,
  getSectionsForSubject, getStandaloneSections,
  PATTERN_CODES
} from '../../hooks/useAdminData'
import { supabaseAdmin } from '../../lib/supabase'

interface Props {
  subjectId: string
  subjectName: string
  topics: Topic[]
  onAdd: (data: Record<string, unknown>) => Promise<boolean>
  onGetOrCreateTopic: (name: string) => Promise<string | null>
}

const inputClass = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
const labelClass = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'

const blankForm = {
  question_text: '',
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'a',
  explanation: '',
  difficulty_level: 'medium',
  render_type: 'text',
  status: 'floating',
  pattern_code: '',
}

export default function AddQuestion({ subjectId, subjectName, topics, onAdd, onGetOrCreateTopic }: Props) {
  const standaloneSections = getStandaloneSections(subjectName)
  const hasSections = standaloneSections.length > 0
  const allSections = getSectionsForSubject(subjectName)

  const [section, setSection] = useState(hasSections ? '' : 'general')
  const [form, setForm] = useState({ ...blankForm })
  const [questionId, setQuestionId] = useState('')
  const [idStatus, setIdStatus] = useState<'loading' | 'ok' | 'taken' | 'empty'>('loading')
  const [topicInput, setTopicInput] = useState('')
  const [topicSuggestions, setTopicSuggestions] = useState<Topic[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const idCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sectionDef = allSections.find(s => s.key === section)
  const patternOptions = section ? (PATTERN_CODES[section] || []) : []

  // If no sections defined for this subject, form is always visible
  const formReady = !hasSections || !!section

  useEffect(() => {
    generateQuestionId(subjectId, subjectName).then(id => {
      setQuestionId(id)
      setIdStatus('ok')
    })
  }, [subjectId, subjectName])

  const handleIdChange = (val: string) => {
    setQuestionId(val)
    if (!val.trim()) { setIdStatus('empty'); return }
    setIdStatus('loading')
    if (idCheckRef.current) clearTimeout(idCheckRef.current)
    idCheckRef.current = setTimeout(async () => {
      const taken = await isQuestionIdTaken(val.trim())
      setIdStatus(taken ? 'taken' : 'ok')
    }, 400)
  }

  const handleTopicInput = (val: string) => {
    setTopicInput(val)
    if (val.trim()) {
      setTopicSuggestions(topics.filter(t => t.name.toLowerCase().includes(val.toLowerCase())))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
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

  const handleAdd = async () => {
    if (!form.question_text.trim() || idStatus !== 'ok' || !questionId.trim()) return
    setSaving(true)

    const topicId = topicInput.trim() ? await onGetOrCreateTopic(topicInput.trim()) : null
    let questionImageUrl: string | null = null
    if (questionImageFile) questionImageUrl = await uploadImage(questionImageFile)

    const ok = await onAdd({
      subject_id: subjectId,
      topic_id: topicId,
      question_id: questionId.trim(),
      question_text: form.question_text,
      question_image_url: questionImageUrl,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      correct_option: form.correct_option,
      explanation: form.explanation || null,
      difficulty_level: form.difficulty_level,
      render_type: form.render_type,
      status: form.status,
      // Section fields — null for subjects without taxonomy
      section: section !== 'general' ? section : null,
      question_type: sectionDef?.type || 'mcq',
      year: null,
      pattern_code: form.pattern_code || null,
      passage_id: null,
      position_in_passage: null,
    })

    setSaving(false)
    if (ok) {
      setForm({ ...blankForm })
      setTopicInput('')
      setQuestionImageFile(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      const nextId = await generateQuestionId(subjectId, subjectName)
      setQuestionId(nextId)
      setIdStatus('ok')
    }
  }

  const idIndicator = {
    loading: <span className="text-xs text-gray-400">Checking...</span>,
    ok:      <span className="text-xs text-green-600 font-medium">✓ Available</span>,
    taken:   <span className="text-xs text-red-500 font-medium">✗ Taken</span>,
    empty:   <span className="text-xs text-red-400">Required</span>,
  }[idStatus]

  return (
    <div className="space-y-4">

      {/* Section selector — English only (or any subject with sections defined) */}
      {hasSections && (
        <div className="bg-white border border-gray-200 p-5">
          <label className={labelClass}>Section — what type of question is this?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {standaloneSections.map(s => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`px-3 py-2.5 text-xs font-bold border text-left transition-colors ${
                  section === s.key
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
          {section && (
            <p className="text-xs text-gray-400 mt-3">
              Type: <span className="font-bold text-gray-600">{sectionDef?.type}</span>
              {' · '}For comprehension and cloze, use the <span className="font-bold text-gray-600">Passages</span> tab.
            </p>
          )}
        </div>
      )}

      {/* Question form */}
      {formReady && (
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              {hasSections && sectionDef
                ? `New ${sectionDef.label} Question`
                : `New Question — ${subjectName}`
              }
            </p>
            {hasSections && section && (
              <button onClick={() => setSection('')}
                className="text-xs text-gray-400 hover:text-black underline">
                Change section
              </button>
            )}
          </div>

          <div className="px-6 py-6 space-y-4">

            {/* ID + Topic */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass} style={{ marginBottom: 0 }}>Question ID</label>
                  {idIndicator}
                </div>
                <input type="text"
                  className={`${inputClass} font-mono text-xs ${
                    idStatus === 'taken' ? 'border-red-300' : idStatus === 'ok' ? 'border-green-300' : ''
                  }`}
                  value={questionId}
                  onChange={e => handleIdChange(e.target.value)}
                />
              </div>
              <div className="relative">
                <label className={labelClass}>Topic Tag</label>
                <input type="text" className={inputClass}
                  value={topicInput}
                  onChange={e => handleTopicInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Type or create..."
                />
                {showSuggestions && topicSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 z-10 max-h-36 overflow-y-auto">
                    {topicSuggestions.map(t => (
                      <button key={t.id} type="button"
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onMouseDown={() => { setTopicInput(t.name); setShowSuggestions(false) }}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
                {topicInput && !topics.find(t => t.name.toLowerCase() === topicInput.toLowerCase()) && (
                  <p className="text-xs text-blue-500 mt-1">New tag — created on save</p>
                )}
              </div>
            </div>

            {/* Pattern code — only shown for subjects with sections */}
            {hasSections && patternOptions.length > 0 && (
              <div>
                <label className={labelClass}>Pattern Code</label>
                <select className={inputClass} value={form.pattern_code}
                  onChange={e => setForm({ ...form, pattern_code: e.target.value })}>
                  <option value="">— select —</option>
                  {patternOptions.map(p => (
                    <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Oral note */}
            {section === 'oral' && (
              <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Oral / Phonetics</p>
                <p className="text-xs text-amber-600">
                  Write the word or sound pattern in the question field. Options should be the candidate words/sounds to choose from.
                </p>
              </div>
            )}

            {/* Question text */}
            <div>
              <label className={labelClass}>Question Text</label>
              <textarea className={`${inputClass} resize-none`} rows={3}
                value={form.question_text}
                onChange={e => setForm({ ...form, question_text: e.target.value })}
                placeholder={
                  section === 'vocab'    ? 'The word ___ in the passage means...' :
                  section === 'oral'     ? 'Which option has the same vowel sound as the word in capitals?' :
                  section === 'idiom'    ? '"The painting was beautifully faked" — what does this mean?' :
                  section === 'grammar'  ? 'Choose the option that best completes the sentence...' :
                  'Enter question text...'
                }
              />
            </div>

            {/* Diagram (optional) */}
            <div>
              <label className={labelClass}>Diagram <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <input type="file" accept="image/*"
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-200 file:text-xs file:font-bold file:bg-white file:text-gray-700 hover:file:border-gray-400 cursor-pointer"
                onChange={e => setQuestionImageFile(e.target.files?.[0] || null)}
              />
              {questionImageFile && <p className="text-xs text-green-600 mt-1">✓ {questionImageFile.name}</p>}
            </div>

            {/* Options — A and B required, C and D optional */}
            {(['a', 'b', 'c', 'd'] as const).map(opt => (
              <div key={opt}>
                <label className={labelClass}>
                  Option {opt.toUpperCase()}
                  {(opt === 'c' || opt === 'd') && (
                    <span className="text-gray-300 font-normal normal-case ml-1">— optional</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, correct_option: opt })}
                    title="Mark as correct"
                    className={`w-8 h-9 text-xs font-black border flex-shrink-0 transition-colors ${
                      form.correct_option === opt
                        ? 'bg-black text-white border-black'
                        : (opt === 'c' || opt === 'd')
                        ? 'border-gray-100 text-gray-300 hover:border-gray-300'
                        : 'border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}>
                    {opt.toUpperCase()}
                  </button>
                  <input type="text" className={`${inputClass} ${(opt === 'c' || opt === 'd') ? 'text-gray-500 placeholder:text-gray-300' : ''}`}
                    placeholder={(opt === 'c' || opt === 'd') ? `Option ${opt.toUpperCase()} — leave blank if not needed` : `Option ${opt.toUpperCase()}`}
                    value={form[`option_${opt}` as keyof typeof form] as string}
                    onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                  />
                </div>
              </div>
            ))}

            {/* Explanation */}
            <div>
              <label className={labelClass}>Explanation <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <textarea className={`${inputClass} resize-none`} rows={2}
                placeholder="Why is this the correct answer?"
                value={form.explanation}
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
                <select className={inputClass} value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="floating">Floating</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {success && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                ✓ Question saved. Next ID ready.
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <button onClick={handleAdd}
              disabled={saving || !form.question_text.trim() || idStatus !== 'ok'}
              className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {saving ? 'Saving...' : `Add ${questionId || 'Question'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}