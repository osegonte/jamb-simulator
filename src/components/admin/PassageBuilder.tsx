import { useState, useEffect } from 'react'
import type { Topic, Passage, AdminQuestion } from '../../hooks/useAdminData'
import { generateQuestionId, generateGroupId, isQuestionIdTaken, PATTERN_CODES } from '../../hooks/useAdminData'
import { supabaseAdmin } from '../../lib/supabase'

interface Props {
  subjectId: string
  subjectName: string
  topics: Topic[]
  passages: Passage[]
  onGetOrCreateTopic: (name: string) => Promise<string | null>
  onCreatePassage: (data: Omit<Passage, 'id' | 'created_at'>) => Promise<Passage | null>
  onAddQuestion: (data: Record<string, unknown>) => Promise<boolean>
  onUpdateQuestion: (id: string, updates: Partial<AdminQuestion>) => Promise<boolean>
  onDeleteQuestion: (id: string) => Promise<boolean>
  onReloadPassages: () => void
}

type PassageMode = 'new' | 'existing'
type PassageType = 'comprehension' | 'cloze' | 'stimulus'

interface QuestionSlot {
  key: string
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
  difficulty_level: string
  pattern_code: string
  topic_input: string
  id_status: 'loading' | 'ok' | 'taken'
}

const inputClass = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
const labelClass = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'

function emptySlot(id: string): QuestionSlot {
  return {
    key: id,
    question_id: '',
    question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'a',
    explanation: '',
    difficulty_level: 'medium',
    pattern_code: '',
    topic_input: '',
    id_status: 'ok',
  }
}

const PASSAGE_TYPES: { key: PassageType; label: string; desc: string }[] = [
  { key: 'comprehension', label: 'Comprehension',    desc: 'Reading passage with questions' },
  { key: 'cloze',         label: 'Cloze Test',       desc: 'Fill-in passage with blanks' },
  { key: 'stimulus',      label: 'Diagram / Stimulus', desc: 'Image, chart, diagram, data table, or scenario' },
]

const TYPE_COLORS: Record<PassageType, string> = {
  comprehension: 'bg-purple-100 text-purple-700',
  cloze:         'bg-blue-100 text-blue-700',
  stimulus:      'bg-orange-100 text-orange-700',
}

export default function GroupedQuestionBuilder({
  subjectId, subjectName, topics, passages,
  onGetOrCreateTopic, onCreatePassage, onAddQuestion, onReloadPassages,
}: Props) {
  const [passageMode, setPassageMode] = useState<PassageMode>('new')
  const [passageType, setPassageType] = useState<PassageType>('comprehension')
  const [passageText, setPassageText] = useState('')
  const [stimulusImageFile, setStimulusImageFile] = useState<File | null>(null)
  const [stimulusImagePreview, setStimulusImagePreview] = useState<string | null>(null)
  const [selectedPassageId, setSelectedPassageId] = useState('')
  const [createdPassage, setCreatedPassage] = useState<Passage | null>(null)
  const [slots, setSlots] = useState<QuestionSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [step, setStep] = useState<'passage' | 'questions'>('passage')
  const [idCounter, setIdCounter] = useState(0)
  const [creatingPassage, setCreatingPassage] = useState(false)

  useEffect(() => {
    generateQuestionId(subjectId, subjectName).then(id => {
      setSlots([{ ...emptySlot('slot_0'), question_id: id }])
      setIdCounter(1)
    })
  }, [subjectId, subjectName])

  const activePassage = passageMode === 'existing'
    ? passages.find(p => p.id === selectedPassageId)
    : createdPassage

  const patternOptions = PATTERN_CODES[passageType === 'comprehension' ? 'comprehension' : passageType === 'cloze' ? 'cloze' : ''] || []

  const handleStimulusImage = (file: File) => {
    setStimulusImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setStimulusImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `passages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabaseAdmin.storage.from('question-images').upload(path, file)
    if (error) return null
    const { data } = supabaseAdmin.storage.from('question-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleCreatePassage = async () => {
    if (passageType !== 'stimulus' && !passageText.trim()) return
    if (passageType === 'stimulus' && !stimulusImageFile && !passageText.trim()) return

    setCreatingPassage(true)
    const existingIds = passages.map(p => p.group_id)
    const groupId = generateGroupId(passageType, subjectName, null, existingIds)

    let imageUrl: string | null = null
    if (stimulusImageFile) imageUrl = await uploadImage(stimulusImageFile)

    const created = await onCreatePassage({
      group_id: groupId,
      subject_id: subjectId,
      passage_type: passageType,
      passage_text: passageText.trim() || '',
      passage_image_url: imageUrl,
      year: null,
    })

    setCreatingPassage(false)
    if (created) {
      setCreatedPassage(created)
      setStep('questions')
    }
  }

  const handleSelectExistingPassage = () => {
    const p = passages.find(p => p.id === selectedPassageId)
    if (p) {
      setPassageType(p.passage_type as PassageType)
      setStep('questions')
    }
  }

  const addSlot = async () => {
    const nextId = await generateQuestionId(subjectId, subjectName)
    setSlots(prev => [...prev, { ...emptySlot(`slot_${idCounter}`), question_id: nextId }])
    setIdCounter(c => c + 1)
  }

  const removeSlot = (key: string) => {
    setSlots(prev => prev.filter(s => s.key !== key))
  }

  const updateSlot = (key: string, field: keyof QuestionSlot, value: string) => {
    setSlots(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s))
  }

  const checkId = async (key: string, value: string) => {
    updateSlot(key, 'question_id', value)
    if (!value.trim()) return
    updateSlot(key, 'id_status', 'loading')
    const taken = await isQuestionIdTaken(value.trim())
    setSlots(prev => prev.map(s => s.key === key ? { ...s, id_status: taken ? 'taken' : 'ok' } : s))
  }

  const handleSaveAll = async () => {
    const passage = activePassage
    if (!passage) return

    const invalid = slots.filter(s => !s.question_text.trim() || s.id_status === 'taken')
    if (invalid.length > 0) return

    setSaving(true)
    let saved = 0

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      const topicId = slot.topic_input.trim() ? await onGetOrCreateTopic(slot.topic_input.trim()) : null

      const ok = await onAddQuestion({
        subject_id: subjectId,
        topic_id: topicId,
        question_id: slot.question_id || null,
        question_text: slot.question_text,
        option_a: slot.option_a,
        option_b: slot.option_b,
        option_c: slot.option_c || null,
        option_d: slot.option_d || null,
        correct_option: slot.correct_option,
        explanation: slot.explanation || null,
        difficulty_level: slot.difficulty_level,
        pattern_code: slot.pattern_code || null,
        passage_id: passage.id,
        position_in_passage: passageType === 'cloze' ? i + 1 : null,
        question_type: passageType === 'cloze' ? 'cloze' : passageType === 'stimulus' ? 'mcq' : 'passage',
        section: passageType,
        year: null,
        render_type: 'text',
        status: 'floating', // ← lands in Floating Queue for review before going live
      })

      if (ok) saved++
    }

    setSaving(false)
    setSavedCount(saved)

    const nextId = await generateQuestionId(subjectId, subjectName)
    setSlots([{ ...emptySlot('slot_reset'), question_id: nextId }])
    setIdCounter(1)
    onReloadPassages()
    setTimeout(() => setSavedCount(0), 4000)
  }

  // ─── Step 1: Passage Setup ────────────────────────────────────────────────
  if (step === 'passage') {
    return (
      <div className="space-y-4">

        {/* Mode toggle */}
        <div className="bg-white border border-gray-200 p-5">
          <p className={labelClass}>Mode</p>
          <div className="flex gap-2">
            {[
              { key: 'new' as const, label: 'Create New Group' },
              { key: 'existing' as const, label: 'Add to Existing Group' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setPassageMode(opt.key)}
                className={`px-4 py-2 text-xs font-bold border transition-colors ${
                  passageMode === opt.key ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* New passage */}
        {passageMode === 'new' && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-black tracking-widest text-gray-500 uppercase">New Question Group</p>
            </div>
            <div className="px-6 py-6 space-y-5">

              {/* Type selector */}
              <div>
                <label className={labelClass}>Group Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {PASSAGE_TYPES.map(opt => (
                    <button key={opt.key} onClick={() => setPassageType(opt.key)}
                      className={`px-3 py-3 text-left border transition-colors ${
                        passageType === opt.key ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      <p className={`text-xs font-bold mb-0.5 ${passageType === opt.key ? 'text-white' : 'text-gray-800'}`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs ${passageType === opt.key ? 'text-gray-300' : 'text-gray-400'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stimulus: image upload */}
              {passageType === 'stimulus' && (
                <div>
                  <label className={labelClass}>Diagram / Image <span className="text-gray-300 font-normal normal-case">(chart, table, reaction, figure)</span></label>
                  <div
                    className="border-2 border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => document.getElementById('stimulus-upload')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleStimulusImage(f) }}
                  >
                    {stimulusImagePreview ? (
                      <img src={stimulusImagePreview} alt="Preview" className="max-h-48 mx-auto object-contain" />
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-600 mb-1">Drop image here or click to upload</p>
                        <p className="text-xs text-gray-400">PNG, JPG, SVG · diagrams, charts, data tables</p>
                      </>
                    )}
                    <input id="stimulus-upload" type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleStimulusImage(f) }}
                    />
                  </div>
                  {stimulusImageFile && (
                    <p className="text-xs text-green-600 mt-1">✓ {stimulusImageFile.name}</p>
                  )}
                </div>
              )}

              {/* Passage text */}
              <div>
                <label className={labelClass}>
                  {passageType === 'stimulus' ? 'Caption / Context Text' : 'Passage Text'}
                  {passageType === 'stimulus' && <span className="text-gray-300 font-normal normal-case ml-2">(optional — describes the diagram)</span>}
                  {passageType === 'cloze' && (
                    <span className="text-blue-400 font-normal normal-case ml-2">— mark blanks as (6) ___ (7) ___ etc.</span>
                  )}
                </label>
                <textarea
                  className={`${inputClass} resize-none font-mono text-xs leading-relaxed`}
                  rows={passageType === 'stimulus' ? 3 : 10}
                  value={passageText}
                  onChange={e => setPassageText(e.target.value)}
                  placeholder={
                    passageType === 'cloze'
                      ? 'The country is divided into (6) ___ that represent...\nThis ensures (7) ___ harmony among citizens...'
                      : passageType === 'stimulus'
                      ? 'Optional: describe what the diagram shows, or leave blank.'
                      : 'Paste the passage text here...'
                  }
                />
                {passageType === 'cloze' && passageText && (
                  <p className="text-xs text-gray-400 mt-1">
                    Blanks detected: {(passageText.match(/\(\d+\)\s*___/g) || []).length}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleCreatePassage}
                disabled={creatingPassage || (passageType !== 'stimulus' && !passageText.trim()) || (passageType === 'stimulus' && !stimulusImageFile && !passageText.trim())}
                className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {creatingPassage ? 'Creating...' : 'Create Group → Add Questions'}
              </button>
            </div>
          </div>
        )}

        {/* Existing passage list */}
        {passageMode === 'existing' && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
                Select Group — {passages.length} available
              </p>
            </div>
            {passages.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No groups yet. Create one first.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {passages.map(p => (
                  <button key={p.id} onClick={() => setSelectedPassageId(p.id)}
                    className={`w-full text-left px-6 py-4 transition-colors ${
                      selectedPassageId === p.id ? 'bg-gray-50 border-l-2 border-black' : 'hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-black font-mono">{p.group_id}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 ${TYPE_COLORS[p.passage_type as PassageType] || 'bg-gray-100 text-gray-600'}`}>
                          {p.passage_type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {p.passage_image_url && (
                      <img src={p.passage_image_url} alt="Stimulus" className="w-16 h-10 object-cover border border-gray-200 mb-1" />
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {p.passage_text || <span className="italic text-gray-300">Image only</span>}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {selectedPassageId && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button onClick={handleSelectExistingPassage}
                  className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  Add Questions to This Group →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Step 2: Questions ────────────────────────────────────────────────────
  const passage = activePassage

  return (
    <div className="space-y-4">

      {/* Group header */}
      <div className="bg-white border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setStep('passage'); setCreatedPassage(null) }}
              className="text-xs text-gray-400 hover:text-black underline">
              ← Change group
            </button>
            <span className="text-gray-200">|</span>
            <span className="text-xs font-mono font-bold text-gray-700">{passage?.group_id}</span>
            <span className={`text-xs font-bold px-2 py-0.5 ${TYPE_COLORS[passageType]}`}>
              {passageType.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-400">{slots.length} question{slots.length !== 1 ? 's' : ''} ready</span>
        </div>

        {/* Passage preview */}
        <div className="px-5 py-4">
          {passage?.passage_image_url && (
            <div className="mb-3">
              <p className={labelClass}>Diagram</p>
              <img src={passage.passage_image_url} alt="Stimulus" className="max-h-48 object-contain border border-gray-100 bg-gray-50 p-2" />
            </div>
          )}
          {passage?.passage_text && (
            <div>
              <p className={labelClass}>{passageType === 'stimulus' ? 'Caption' : 'Passage'}</p>
              <div className="bg-gray-50 border border-gray-100 px-4 py-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {passage.passage_text}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question slots */}
      {slots.map((slot, i) => (
        <div key={slot.key} className="bg-white border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Question {i + 1}
              {passageType === 'cloze' && <span className="text-blue-500 ml-2">Blank {i + 1}</span>}
            </span>
            {slots.length > 1 && (
              <button onClick={() => removeSlot(slot.key)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Remove
              </button>
            )}
          </div>

          <div className="px-5 py-5 space-y-4">

            {/* Cloze highlight */}
            {passageType === 'cloze' && passage?.passage_text && (
              <div className="bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Active blank: ({i + 1})</p>
                <p className="text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {passage.passage_text.replace(/\((\d+)\)\s*___/g, (match, num) =>
                    parseInt(num) === i + 1 ? `【${num}】___` : match
                  )}
                </p>
              </div>
            )}

            {/* ID + Pattern */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass} style={{ marginBottom: 0 }}>Question ID</label>
                  <span className={`text-xs font-medium ${
                    slot.id_status === 'ok' ? 'text-green-600' :
                    slot.id_status === 'taken' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {slot.id_status === 'ok' ? '✓' : slot.id_status === 'taken' ? '✗ Taken' : '...'}
                  </span>
                </div>
                <input type="text"
                  className={`${inputClass} font-mono text-xs ${slot.id_status === 'taken' ? 'border-red-300' : ''}`}
                  value={slot.question_id}
                  onChange={e => checkId(slot.key, e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Pattern</label>
                <select className={inputClass} value={slot.pattern_code}
                  onChange={e => updateSlot(slot.key, 'pattern_code', e.target.value)}>
                  <option value="">— optional —</option>
                  {patternOptions.map(p => (
                    <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question text */}
            <div>
              <label className={labelClass}>
                {passageType === 'cloze' ? `Blank (${i + 1}) question` : 'Question Text'}
              </label>
              <textarea className={`${inputClass} resize-none`}
                rows={passageType === 'cloze' ? 2 : 3}
                value={slot.question_text}
                onChange={e => updateSlot(slot.key, 'question_text', e.target.value)}
                placeholder={passageType === 'cloze'
                  ? `Blank (${i + 1}) should be filled with...`
                  : 'Enter question text...'}
              />
            </div>

            {/* Options A + B */}
            {(['a', 'b'] as const).map(opt => (
              <div key={opt} className="flex gap-2 items-center">
                <button type="button" onClick={() => updateSlot(slot.key, 'correct_option', opt)}
                  title="Mark as correct"
                  className={`w-7 h-8 text-xs font-black border flex-shrink-0 transition-colors ${
                    slot.correct_option === opt ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-gray-400'
                  }`}>
                  {opt.toUpperCase()}
                </button>
                <input type="text" className={inputClass}
                  placeholder={`Option ${opt.toUpperCase()}`}
                  value={slot[`option_${opt}` as keyof QuestionSlot] as string}
                  onChange={e => updateSlot(slot.key, `option_${opt}` as keyof QuestionSlot, e.target.value)}
                />
              </div>
            ))}

            {/* Options C + D (optional) */}
            {(['c', 'd'] as const).map(opt => (
              <div key={opt} className="flex gap-2 items-center">
                <button type="button" onClick={() => updateSlot(slot.key, 'correct_option', opt)}
                  title="Mark as correct"
                  className={`w-7 h-8 text-xs font-black border flex-shrink-0 transition-colors ${
                    slot.correct_option === opt ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-300 hover:border-gray-400'
                  }`}>
                  {opt.toUpperCase()}
                </button>
                <input type="text" className={`${inputClass} text-gray-500`}
                  placeholder={`Option ${opt.toUpperCase()} — leave blank if not needed`}
                  value={slot[`option_${opt}` as keyof QuestionSlot] as string}
                  onChange={e => updateSlot(slot.key, `option_${opt}` as keyof QuestionSlot, e.target.value)}
                />
              </div>
            ))}

            {/* Explanation + difficulty */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Explanation <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                <input type="text" className={inputClass}
                  placeholder="Why is the answer correct?"
                  value={slot.explanation}
                  onChange={e => updateSlot(slot.key, 'explanation', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Difficulty</label>
                <select className={inputClass} value={slot.difficulty_level}
                  onChange={e => updateSlot(slot.key, 'difficulty_level', e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add slot */}
      <button onClick={addSlot}
        className="w-full py-3 border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-widest hover:border-gray-400 hover:text-gray-600 transition-colors">
        + Add Another Question to This Group
      </button>

      {savedCount > 0 && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          ✓ {savedCount} question{savedCount !== 1 ? 's' : ''} saved to Floating Queue. Go to Floating Queue tab to review and approve.
        </div>
      )}

      <div className="bg-white border border-gray-200 px-6 py-4">
        <button onClick={handleSaveAll}
          disabled={saving || slots.some(s => !s.question_text.trim() || s.id_status === 'taken')}
          className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {saving ? 'Saving...' : `Save ${slots.length} Question${slots.length !== 1 ? 's' : ''} → Floating Queue`}
        </button>
      </div>
    </div>
  )
}