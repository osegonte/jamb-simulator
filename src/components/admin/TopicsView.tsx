// src/components/admin/TopicsView.tsx
// Three-level navigation: Topics → Subtopics → Questions
// All data comes from DB — no config files.

import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { generateQuestionId, isQuestionIdTaken } from '../../hooks/useAdminData'

interface Props { subjectId: string; subjectName: string }
type ViewMode = 'topics' | 'subtopics' | 'questions'

interface TopicRow    { id: string; name: string; objectives: string[] | null }
interface SubtopicRow { id: string; name: string; topic_id: string }
interface QuestionRow {
  id: string; question_id: string | null; question_text: string
  option_a: string; option_b: string; option_c: string | null; option_d: string | null
  correct_option: string; status: string; difficulty_level: string
}
interface CountMap { [id: string]: number }

const inputCls = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
const labelCls = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'
const blankForm = {
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'a', explanation: '', difficulty_level: 'medium', status: 'floating',
}
const STATUS_COLOR: Record<string, string> = {
  approved:  'bg-green-100 text-green-700',
  floating:  'bg-yellow-100 text-yellow-700',
  in_review: 'bg-blue-100 text-blue-700',
}

export default function TopicsView({ subjectId, subjectName }: Props) {
  const [viewMode, setViewMode]               = useState<ViewMode>('topics')
  const [selectedTopic, setSelectedTopic]     = useState<TopicRow | null>(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubtopicRow | null>(null)

  // DB data
  const [dbTopics, setDbTopics]             = useState<TopicRow[]>([])
  const [dbSubtopics, setDbSubtopics]       = useState<SubtopicRow[]>([])
  const [topicCounts, setTopicCounts]       = useState<CountMap>({})
  const [subtopicCounts, setSubtopicCounts] = useState<CountMap>({})
  const [dataLoading, setDataLoading]       = useState(true)

  // Question view
  const [questions, setQuestions]   = useState<QuestionRow[]>([])
  const [qLoading, setQLoading]     = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm]             = useState({ ...blankForm })
  const [questionId, setQuestionId] = useState('')
  const [idStatus, setIdStatus]     = useState<'ok' | 'taken' | 'loading'>('ok')
  const [saving, setSaving]         = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Load all DB data ──────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!subjectId) return
    setDataLoading(true)
    const [topicsRes, subtopicsRes, questionsRes] = await Promise.all([
      supabaseAdmin.from('topics').select('id, name, objectives').eq('subject_id', subjectId).order('name'),
      supabaseAdmin.from('subtopics').select('id, name, topic_id').eq('subject_id', subjectId).order('name'),
      supabaseAdmin.from('questions').select('topic_id, subtopic_id').eq('subject_id', subjectId),
    ])
    const tCounts: CountMap = {}
    const sCounts: CountMap = {}
    for (const q of questionsRes.data || []) {
      if (q.topic_id)    tCounts[q.topic_id]    = (tCounts[q.topic_id]    || 0) + 1
      if (q.subtopic_id) sCounts[q.subtopic_id] = (sCounts[q.subtopic_id] || 0) + 1
    }
    setDbTopics(topicsRes.data    || [])
    setDbSubtopics(subtopicsRes.data || [])
    setTopicCounts(tCounts)
    setSubtopicCounts(sCounts)
    setDataLoading(false)
  }, [subjectId])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Load questions for selected subtopic ──────────────────────────────────
  const loadQuestions = useCallback(async (subtopicId: string) => {
    setQLoading(true)
    const { data } = await supabaseAdmin
      .from('questions')
      .select('id, question_id, question_text, option_a, option_b, option_c, option_d, correct_option, status, difficulty_level')
      .eq('subject_id', subjectId)
      .eq('subtopic_id', subtopicId)
      .order('created_at', { ascending: false })
    setQuestions((data || []) as QuestionRow[])
    setQLoading(false)
  }, [subjectId])

  // ── Navigation ────────────────────────────────────────────────────────────
  const openTopic = (topic: TopicRow) => {
    setSelectedTopic(topic)
    setSelectedSubtopic(null)
    setViewMode('subtopics')
  }

  const openSubtopic = async (subtopic: SubtopicRow) => {
    setSelectedSubtopic(subtopic)
    setViewMode('questions')
    setShowAddForm(false)
    setSaveSuccess(false)
    await loadQuestions(subtopic.id)
    const id = await generateQuestionId(subjectId, subjectName)
    setQuestionId(id)
    setIdStatus('ok')
    setForm({ ...blankForm })
  }

  const goToTopics = () => {
    setViewMode('topics')
    setSelectedTopic(null)
    setSelectedSubtopic(null)
  }

  const goToSubtopics = () => {
    setViewMode('subtopics')
    setSelectedSubtopic(null)
    setShowAddForm(false)
  }

  // ── Add question ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedTopic || !selectedSubtopic || !form.question_text.trim() || idStatus !== 'ok') return
    setSaving(true)
    const { error } = await supabaseAdmin.from('questions').insert({
      subject_id:       subjectId,
      topic_id:         selectedTopic.id,
      subtopic_id:      selectedSubtopic.id,
      question_id:      questionId || null,
      question_text:    form.question_text,
      option_a:         form.option_a,
      option_b:         form.option_b,
      option_c:         form.option_c || null,
      option_d:         form.option_d || null,
      correct_option:   form.correct_option,
      explanation:      form.explanation || null,
      difficulty_level: form.difficulty_level,
      render_type:      'text',
      question_type:    'mcq',
      status:           form.status,
      year:             null,
    })
    setSaving(false)
    if (!error) {
      setSaveSuccess(true)
      setForm({ ...blankForm })
      setTimeout(() => setSaveSuccess(false), 3000)
      await loadQuestions(selectedSubtopic.id)
      await loadAll()
      const nextId = await generateQuestionId(subjectId, subjectName)
      setQuestionId(nextId)
      setIdStatus('ok')
    }
  }

  const handleIdChange = async (val: string) => {
    setQuestionId(val)
    if (!val.trim()) return
    setIdStatus('loading')
    setIdStatus((await isQuestionIdTaken(val.trim())) ? 'taken' : 'ok')
  }

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-xs flex-wrap">
      <button onClick={goToTopics}
        className={`font-bold transition-colors ${viewMode === 'topics' ? 'text-black' : 'text-gray-400 hover:text-black underline'}`}>
        Topics
      </button>
      {selectedTopic && (
        <>
          <span className="text-gray-300">/</span>
          <button onClick={goToSubtopics}
            className={`font-bold transition-colors ${viewMode === 'subtopics' ? 'text-black' : 'text-gray-400 hover:text-black underline'}`}>
            {selectedTopic.name}
          </button>
        </>
      )}
      {selectedSubtopic && (
        <>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-black">{selectedSubtopic.name}</span>
        </>
      )}
    </div>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (dataLoading) return (
    <div className="bg-white border border-gray-200 px-6 py-16 text-center">
      <p className="text-xs text-gray-400 animate-pulse tracking-widest uppercase">Loading...</p>
    </div>
  )

  if (dbTopics.length === 0) return (
    <div className="bg-white border border-gray-200 p-8 text-center">
      <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">No Topics Found</p>
      <p className="text-xs text-gray-400">Run <code className="bg-gray-100 px-1">npx tsx scripts/seed-topics.ts</code></p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: TOPICS
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'topics') {
    const totalQ = Object.values(topicCounts).reduce((s, n) => s + n, 0)
    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="bg-white border border-gray-200 p-5 flex items-center gap-6 flex-wrap">
          {[
            ['Topics',    dbTopics.length],
            ['Subtopics', dbSubtopics.length],
            ['Questions', totalQ],
          ].map(([label, value], i, arr) => (
            <div key={label as string} className="flex items-center gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">{label}</p>
                <p className="text-2xl font-black">{value}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-10 bg-gray-100" />}
            </div>
          ))}
        </div>

        {/* Topic list */}
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {dbTopics.map(topic => {
            const subtopicCount = dbSubtopics.filter(s => s.topic_id === topic.id).length
            const qCount        = topicCounts[topic.id] || 0
            return (
              <button key={topic.id} onClick={() => openTopic(topic)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 group transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-black group-hover:text-blue-700 transition-colors">{topic.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {subtopicCount} subtopic{subtopicCount !== 1 ? 's' : ''}
                    {topic.objectives && topic.objectives.length > 0 && ` · ${topic.objectives.length} objectives`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 ${
                    qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 10 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
                  }`}>{qCount} Q</span>
                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: SUBTOPICS
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'subtopics' && selectedTopic) {
    const topicSubs = dbSubtopics.filter(s => s.topic_id === selectedTopic.id)
    const topicQCount = topicCounts[selectedTopic.id] || 0

    return (
      <div className="space-y-4">
        <Breadcrumb />

        {/* Topic header */}
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-lg font-black text-black">{selectedTopic.name}</p>
          <p className="text-xs text-gray-400 mt-1">
            {topicSubs.length} subtopics · {topicQCount} questions
          </p>

          {/* Objectives */}
          {selectedTopic.objectives && selectedTopic.objectives.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Learning Objectives</p>
              <ul className="space-y-1">
                {selectedTopic.objectives.map((o, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-300 flex-shrink-0">{i + 1}.</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Subtopic list */}
        {topicSubs.length === 0 ? (
          <div className="bg-white border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No subtopics for this topic.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 divide-y divide-gray-100">
            <div className="px-5 py-2.5 bg-gray-50">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Subtopics</p>
            </div>
            {topicSubs.map(sub => {
              const qCount = subtopicCounts[sub.id] || 0
              return (
                <button key={sub.id} onClick={() => openSubtopic(sub)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 group transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 group-hover:text-blue-700 transition-colors">{sub.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-bold tabular-nums px-2 py-0.5 ${
                      qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 5 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
                    }`}>{qCount} Q</span>
                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: QUESTIONS IN SUBTOPIC
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'questions' && selectedTopic && selectedSubtopic) {
    const qCount = subtopicCounts[selectedSubtopic.id] || 0

    return (
      <div className="space-y-4">
        <Breadcrumb />

        {/* Subtopic header */}
        <div className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{selectedTopic.name}</p>
            <p className="text-lg font-black text-black">{selectedSubtopic.name}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 ${
            qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 5 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
          }`}>{qCount} questions</span>
        </div>

        {/* Add question panel */}
        <div className="bg-white border border-gray-200">
          <button onClick={() => setShowAddForm(p => !p)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-xs font-black tracking-widest text-gray-500 uppercase text-left">+ Add Question</p>
              <p className="text-xs text-gray-400 text-left mt-0.5">Tagged to: {selectedTopic.name} → {selectedSubtopic.name}</p>
            </div>
            <span className="text-gray-400 text-sm">{showAddForm ? '▲' : '▼'}</span>
          </button>

          {showAddForm && (
            <div className="border-t border-gray-100 px-5 py-5 space-y-4">
              {/* Question ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls} style={{ marginBottom: 0 }}>Question ID</label>
                  <span className={`text-xs font-medium ${idStatus === 'ok' ? 'text-green-600' : idStatus === 'taken' ? 'text-red-500' : 'text-gray-400'}`}>
                    {idStatus === 'ok' ? '✓ Available' : idStatus === 'taken' ? '✗ Taken' : 'Checking...'}
                  </span>
                </div>
                <input type="text" className={`${inputCls} font-mono text-xs ${idStatus === 'taken' ? 'border-red-300' : ''}`}
                  value={questionId} onChange={e => handleIdChange(e.target.value)} />
              </div>

              {/* Question text */}
              <div>
                <label className={labelCls}>Question</label>
                <textarea className={`${inputCls} resize-none`} rows={3}
                  value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })}
                  placeholder="Enter question text..." />
              </div>

              {/* Options */}
              <div>
                <label className={labelCls}>Options — click letter to mark correct</label>
                <div className="space-y-2">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => (
                    <div key={opt} className={`flex items-center gap-2 px-3 py-2 border transition-colors ${
                      form.correct_option === opt ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                      <button type="button" onClick={() => setForm({ ...form, correct_option: opt })}
                        className={`w-7 h-7 flex-shrink-0 text-xs font-black border transition-colors ${
                          form.correct_option === opt ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>
                        {opt.toUpperCase()}
                      </button>
                      <input type="text" className="flex-1 text-sm focus:outline-none bg-transparent"
                        placeholder={`Option ${opt.toUpperCase()}${opt === 'c' || opt === 'd' ? ' (optional)' : ''}`}
                        value={form[`option_${opt}` as keyof typeof form] as string}
                        onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })} />
                      {form.correct_option === opt && <span className="text-xs font-bold text-green-600">✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className={labelCls}>Explanation <span className="font-normal normal-case text-gray-300">(optional)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Why is this correct?"
                  value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
              </div>

              {/* Difficulty + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select className={inputCls} value={form.difficulty_level} onChange={e => setForm({ ...form, difficulty_level: e.target.value })}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="floating">Floating</option><option value="approved">Approved</option>
                  </select>
                </div>
              </div>

              {saveSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">✓ Question saved.</div>
              )}

              <button onClick={handleSave} disabled={saving || !form.question_text.trim() || idStatus !== 'ok'}
                className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
                {saving ? 'Saving...' : `Save → ${form.status === 'approved' ? 'Approved' : 'Floating Queue'}`}
              </button>
            </div>
          )}
        </div>

        {/* Question list */}
        <div className="bg-white border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Questions</p>
            {qLoading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
          </div>
          {questions.length === 0 && !qLoading ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No questions yet.</p>
              <button onClick={() => setShowAddForm(true)} className="text-xs text-blue-500 underline mt-2">Add the first one →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {questions.map((q, i) => (
                <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-300 mt-0.5 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 ${STATUS_COLOR[q.status] || 'bg-gray-100 text-gray-500'}`}>
                        {q.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {q.question_id && <span className="text-xs text-gray-400 font-mono">{q.question_id}</span>}
                      <span className="text-xs text-gray-400">→ {q.correct_option?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}