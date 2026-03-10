// src/components/admin/TopicsView.tsx
import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { getConfig } from '../../config/manifest'
import { generateQuestionId, isQuestionIdTaken, subjectPrefix } from '../../hooks/useAdminData'

interface Props { subjectId: string; subjectName: string }
type SeedState = 'idle' | 'seeding' | 'done' | 'error'
type ViewMode = 'topics' | 'questions' // topics = topic tree, questions = drill-down into a topic

interface TopicRow { id: string; name: string; objectives: string[] | null }
interface SubtopicRow { id: string; name: string; topic_id: string }
interface QuestionRow {
  id: string; question_id: string | null; question_text: string
  option_a: string; option_b: string; option_c: string | null; option_d: string | null
  correct_option: string; status: string; difficulty_level: string
  subtopics?: { name: string } | null
}
interface CountMap { [id: string]: number }

const inputCls = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
const labelCls = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'

const blankForm = {
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'a', explanation: '', difficulty_level: 'medium', status: 'floating',
}

export default function TopicsView({ subjectId, subjectName }: Props) {
  const config = getConfig(subjectName)
  const [viewMode, setViewMode] = useState<ViewMode>('topics')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedTopicName, setSelectedTopicName] = useState<string>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [seedState, setSeedState] = useState<SeedState>('idle')
  const [seedLog, setSeedLog] = useState<string[]>([])

  // DB state
  const [dbTopics, setDbTopics] = useState<TopicRow[]>([])
  const [dbSubtopics, setDbSubtopics] = useState<SubtopicRow[]>([])
  const [topicCounts, setTopicCounts] = useState<CountMap>({})
  const [subtopicCounts, setSubtopicCounts] = useState<CountMap>({})

  // Question drill-down state
  const [drillQuestions, setDrillQuestions] = useState<QuestionRow[]>([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSubtopicId, setAddSubtopicId] = useState('')
  const [form, setForm] = useState({ ...blankForm })
  const [questionId, setQuestionId] = useState('')
  const [idStatus, setIdStatus] = useState<'ok' | 'taken' | 'loading'>('ok')
  const [addSaving, setAddSaving] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  const loadCounts = useCallback(async () => {
    const [topicsRes, subtopicsRes, questionsRes] = await Promise.all([
      supabaseAdmin.from('topics').select('id, name, objectives').eq('subject_id', subjectId),
      supabaseAdmin.from('subtopics').select('id, name, topic_id').eq('subject_id', subjectId),
      supabaseAdmin.from('questions').select('topic_id, subtopic_id').eq('subject_id', subjectId),
    ])
    const topics: TopicRow[] = topicsRes.data || []
    const subtopics: SubtopicRow[] = subtopicsRes.data || []
    const questions = questionsRes.data || []
    const tCounts: CountMap = {}
    const sCounts: CountMap = {}
    for (const q of questions) {
      if (q.topic_id) tCounts[q.topic_id] = (tCounts[q.topic_id] || 0) + 1
      if (q.subtopic_id) sCounts[q.subtopic_id] = (sCounts[q.subtopic_id] || 0) + 1
    }
    setDbTopics(topics)
    setDbSubtopics(subtopics)
    setTopicCounts(tCounts)
    setSubtopicCounts(sCounts)
  }, [subjectId])

  useEffect(() => { loadCounts() }, [loadCounts])

  // Load questions when drilling into a topic
  const loadDrillQuestions = useCallback(async (topicId: string) => {
    setDrillLoading(true)
    const { data } = await supabaseAdmin
      .from('questions')
      .select('id, question_id, question_text, option_a, option_b, option_c, option_d, correct_option, status, difficulty_level, subtopics(name)')
      .eq('subject_id', subjectId)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
    setDrillQuestions((data || []) as QuestionRow[])
    setDrillLoading(false)
  }, [subjectId])

  const openDrill = async (topic: TopicRow) => {
    setSelectedTopicId(topic.id)
    setSelectedTopicName(topic.name)
    setViewMode('questions')
    setShowAddForm(false)
    setAddSuccess(false)
    await loadDrillQuestions(topic.id)
    // Pre-generate a question ID
    const id = await generateQuestionId(subjectId, subjectName)
    setQuestionId(id)
    setIdStatus('ok')
    // Default subtopic to first available
    const topicSubs = dbSubtopics.filter(s => s.topic_id === topic.id)
    setAddSubtopicId(topicSubs[0]?.id || '')
    setForm({ ...blankForm })
  }

  const closeDrill = () => {
    setViewMode('topics')
    setSelectedTopicId(null)
    setShowAddForm(false)
  }

  // Add question to selected topic
  const handleAddQuestion = async () => {
    if (!selectedTopicId || !form.question_text.trim() || idStatus !== 'ok') return
    setAddSaving(true)
    const { error } = await supabaseAdmin.from('questions').insert({
      subject_id: subjectId,
      topic_id: selectedTopicId,
      subtopic_id: addSubtopicId || null,
      question_id: questionId || null,
      question_text: form.question_text,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c || null,
      option_d: form.option_d || null,
      correct_option: form.correct_option,
      explanation: form.explanation || null,
      difficulty_level: form.difficulty_level,
      render_type: 'text',
      question_type: 'mcq',
      status: form.status,
      year: null,
    })
    setAddSaving(false)
    if (!error) {
      setAddSuccess(true)
      setForm({ ...blankForm })
      setTimeout(() => setAddSuccess(false), 3000)
      // Reload and generate next ID
      await loadDrillQuestions(selectedTopicId)
      await loadCounts()
      const nextId = await generateQuestionId(subjectId, subjectName)
      setQuestionId(nextId)
      setIdStatus('ok')
    }
  }

  const handleIdChange = async (val: string) => {
    setQuestionId(val)
    if (!val.trim()) return
    setIdStatus('loading')
    const taken = await isQuestionIdTaken(val.trim())
    setIdStatus(taken ? 'taken' : 'ok')
  }

  // Seed topics from config
  const seedTopics = async () => {
    if (!config) return
    setSeedState('seeding'); setSeedLog([])
    const log = (msg: string) => setSeedLog(prev => [...prev, msg])
    try {
      for (const [topicName, data] of Object.entries(config.topics)) {
        const objectives = Array.isArray(data) ? [] : (data as { objectives: string[] }).objectives || []
        const subtopics = Array.isArray(data) ? data : (data as { subtopics: string[] }).subtopics
        const { data: existing } = await supabaseAdmin.from('topics').select('id').eq('subject_id', subjectId).ilike('name', topicName).maybeSingle()
        let topicId: string
        if (existing) {
          topicId = (existing as { id: string }).id
          await supabaseAdmin.from('topics').update({ objectives }).eq('id', topicId)
          log(`✓ ${topicName} (updated)`)
        } else {
          const { data: created } = await supabaseAdmin.from('topics').insert({ subject_id: subjectId, name: topicName, objectives }).select('id').single()
          topicId = (created as { id: string }).id
          log(`+ ${topicName}`)
        }
        for (const subName of subtopics) {
          const { data: exSub } = await supabaseAdmin.from('subtopics').select('id').eq('topic_id', topicId).ilike('name', subName).maybeSingle()
          if (!exSub) await supabaseAdmin.from('subtopics').insert({ subject_id: subjectId, topic_id: topicId, name: subName })
        }
        log(`  └ ${subtopics.length} subtopics · ${objectives.length} objectives`)
      }
      setSeedState('done')
      loadCounts()
    } catch (e) {
      log(`✗ ${e instanceof Error ? e.message : 'Unknown error'}`)
      setSeedState('error')
    }
  }

  // ── Question drill-down view ──────────────────────────────────────────────
  if (viewMode === 'questions' && selectedTopicId) {
    const topicSubs = dbSubtopics.filter(s => s.topic_id === selectedTopicId)
    const qCount = topicCounts[selectedTopicId] || 0

    const STATUS_COLOR: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      floating: 'bg-yellow-100 text-yellow-700',
      in_review: 'bg-blue-100 text-blue-700',
    }

    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <button onClick={closeDrill}
            className="text-xs text-gray-400 hover:text-black underline transition-colors">
            ← All Topics
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-black text-black">{selectedTopicName}</span>
          <span className={`text-xs font-bold px-2 py-0.5 ml-auto ${
            qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 10 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
          }`}>{qCount} questions</span>
        </div>

        {/* Add question toggle */}
        <div className="bg-white border border-gray-200">
          <button onClick={() => setShowAddForm(p => !p)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-xs font-black tracking-widest text-gray-500 uppercase text-left">
                + Add Question to {selectedTopicName}
              </p>
              <p className="text-xs text-gray-400 text-left mt-0.5">Manually add one question tagged to this topic</p>
            </div>
            <span className="text-gray-400 text-sm">{showAddForm ? '▲' : '▼'}</span>
          </button>

          {showAddForm && (
            <div className="border-t border-gray-100 px-5 py-5 space-y-4">

              {/* Subtopic selector */}
              {topicSubs.length > 0 && (
                <div>
                  <label className={labelCls}>Subtopic</label>
                  <select className={inputCls} value={addSubtopicId}
                    onChange={e => setAddSubtopicId(e.target.value)}>
                    <option value="">— no subtopic —</option>
                    {topicSubs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Question ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls} style={{ marginBottom: 0 }}>Question ID</label>
                  <span className={`text-xs font-medium ${
                    idStatus === 'ok' ? 'text-green-600' : idStatus === 'taken' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {idStatus === 'ok' ? '✓ Available' : idStatus === 'taken' ? '✗ Taken' : 'Checking...'}
                  </span>
                </div>
                <input type="text" className={`${inputCls} font-mono text-xs ${idStatus === 'taken' ? 'border-red-300' : ''}`}
                  value={questionId} onChange={e => handleIdChange(e.target.value)} />
              </div>

              {/* Question text */}
              <div>
                <label className={labelCls}>Question Text</label>
                <textarea className={`${inputCls} resize-none`} rows={3}
                  value={form.question_text}
                  onChange={e => setForm({ ...form, question_text: e.target.value })}
                  placeholder="Enter question text..." />
              </div>

              {/* Options with correct_option toggle */}
              <div>
                <label className={labelCls}>Options — click letter to mark correct</label>
                <div className="space-y-2">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => (
                    <div key={opt} className={`flex items-center gap-2 px-3 py-2 border transition-colors ${
                      form.correct_option === opt ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    }`}>
                      <button type="button" onClick={() => setForm({ ...form, correct_option: opt })}
                        className={`w-7 h-7 flex-shrink-0 text-xs font-black border transition-colors ${
                          form.correct_option === opt
                            ? 'bg-green-600 text-white border-green-600'
                            : 'border-gray-300 text-gray-400 hover:border-gray-500'
                        }`}>
                        {opt.toUpperCase()}
                      </button>
                      <input type="text"
                        className="flex-1 text-sm focus:outline-none bg-transparent"
                        placeholder={`Option ${opt.toUpperCase()}${opt === 'c' || opt === 'd' ? ' (optional)' : ''}`}
                        value={form[`option_${opt}` as keyof typeof form] as string}
                        onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                      />
                      {form.correct_option === opt && (
                        <span className="text-xs font-bold text-green-600 flex-shrink-0">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className={labelCls}>Explanation <span className="font-normal normal-case text-gray-300">(optional)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={2}
                  placeholder="Why is this the correct answer?"
                  value={form.explanation}
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                />
              </div>

              {/* Difficulty + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select className={inputCls} value={form.difficulty_level}
                    onChange={e => setForm({ ...form, difficulty_level: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="floating">Floating</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>

              {addSuccess && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                  ✓ Question saved. Next ID ready.
                </div>
              )}

              <button onClick={handleAddQuestion}
                disabled={addSaving || !form.question_text.trim() || idStatus !== 'ok'}
                className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
                {addSaving ? 'Saving...' : `Save → ${form.status === 'approved' ? 'Approved' : 'Floating Queue'}`}
              </button>
            </div>
          )}
        </div>

        {/* Question list */}
        <div className="bg-white border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Questions in this topic</p>
            {drillLoading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
          </div>

          {drillQuestions.length === 0 && !drillLoading ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No questions yet for this topic.</p>
              <button onClick={() => setShowAddForm(true)}
                className="text-xs text-blue-500 underline mt-2">Add the first one →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {drillQuestions.map((q, i) => (
                <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-300 mt-0.5 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 ${STATUS_COLOR[q.status] || 'bg-gray-100 text-gray-500'}`}>
                        {q.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {q.subtopics?.name && (
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100">{q.subtopics.name}</span>
                      )}
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

  // ── Topic tree view (default) ─────────────────────────────────────────────
  if (!config) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">No Config Found</p>
        <p className="text-xs text-gray-400">{subjectName} has no TS config file in the manifest yet.</p>
      </div>
    )
  }

  const topicEntries = Object.entries(config.topics)
  const totalConfigTopics = topicEntries.length
  const totalQuestions = Object.values(topicCounts).reduce((s, n) => s + n, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Topics</p>
            <p className="text-2xl font-black">{totalConfigTopics}</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Questions</p>
            <p className="text-2xl font-black">{totalQuestions}</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Per Paper</p>
            <p className="text-2xl font-black text-gray-400">{config.totalQuestions}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {seedState === 'done' && <span className="text-xs font-bold text-green-600">✓ Seeded</span>}
          {seedState === 'error' && <span className="text-xs font-bold text-red-500">✗ Error</span>}
          <button onClick={seedTopics} disabled={seedState === 'seeding'}
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
            {seedState === 'seeding' ? 'Seeding...' : 'Seed → DB'}
          </button>
        </div>
      </div>

      {/* Seed log */}
      {seedLog.length > 0 && (
        <div className="bg-gray-900 text-gray-300 font-mono text-xs p-4 max-h-40 overflow-y-auto space-y-0.5">
          {seedLog.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}

      {/* Topic list */}
      <div className="bg-white border border-gray-200 divide-y divide-gray-100">
        {topicEntries.map(([topicName, data]) => {
          const subtopics = Array.isArray(data) ? data as string[] : (data as { subtopics: string[]; objectives: string[] }).subtopics
          const objectives = Array.isArray(data) ? [] : (data as { subtopics: string[]; objectives: string[] }).objectives
          const dbTopic = dbTopics.find(t => t.name.toLowerCase() === topicName.toLowerCase())
          const qCount = dbTopic ? (topicCounts[dbTopic.id] || 0) : 0
          const isOpen = expanded === topicName
          const topicSubtopics = dbTopic ? dbSubtopics.filter(s => s.topic_id === dbTopic.id) : []

          return (
            <div key={topicName}>
              <div className="flex items-center">
                {/* Click topic name → drill down */}
                <button onClick={() => dbTopic && openDrill(dbTopic)}
                  className={`flex-1 px-5 py-3.5 flex items-center gap-3 text-left transition-colors ${
                    dbTopic ? 'hover:bg-blue-50 group' : 'opacity-50 cursor-not-allowed'
                  }`}
                  disabled={!dbTopic}
                  title={dbTopic ? 'Click to view/add questions' : 'Seed topics to DB first'}>
                  <span className="text-sm font-black text-black group-hover:text-blue-700 transition-colors">{topicName}</span>
                  {dbTopic && <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View questions →</span>}
                </button>

                {/* Count badge + expand toggle */}
                <div className="flex items-center gap-3 px-5 flex-shrink-0">
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 ${
                    qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 10 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
                  }`}>{qCount} Q</span>
                  <button onClick={() => setExpanded(prev => prev === topicName ? null : topicName)}
                    className="text-gray-300 text-xs hover:text-gray-500 transition-colors px-1">
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Subtopics</p>
                  <div className="space-y-1.5">
                    {subtopics.map((subName, i) => {
                      const dbSub = topicSubtopics.find(s => s.name.toLowerCase() === subName.toLowerCase())
                      const sCount = dbSub ? (subtopicCounts[dbSub.id] || 0) : 0
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-100">
                          <span className="text-xs text-gray-700">{subName}</span>
                          <span className={`text-xs font-bold tabular-nums ${
                            sCount === 0 ? 'text-red-300' : sCount < 5 ? 'text-yellow-500' : 'text-green-600'
                          }`}>{sCount}</span>
                        </div>
                      )
                    })}
                  </div>
                  {objectives.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Objectives</p>
                      <ul className="space-y-1">
                        {objectives.map((o, i) => (
                          <li key={i} className="text-xs text-gray-500 flex gap-2">
                            <span className="text-gray-300 flex-shrink-0 mt-0.5">→</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dbTopic && (
                    <button onClick={() => openDrill(dbTopic)}
                      className="text-xs font-bold text-blue-500 hover:text-blue-700 underline mt-2">
                      View / Add Questions →
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}