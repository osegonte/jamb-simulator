import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Subject { id: string; name: string }
interface Topic { id: string; name: string; subject_id: string }
interface Question {
  id: string
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
  difficulty_level: string
  render_type: string
  status: string
  subject_id: string
  topic_id: string
  topics?: { name: string }
  subjects?: { name: string }
}

interface Stats {
  total: number
  approved: number
  floating: number
  in_review: number
}

type StatusFilter = 'all' | 'floating' | 'in_review' | 'approved'

export default function QuestionBank() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, floating: 0, in_review: 0 })
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})

  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [newSubject, setNewSubject] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newTopics, setNewTopics] = useState<Topic[]>([])
  const [newForm, setNewForm] = useState({
    question_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'a',
    explanation: '',
    difficulty_level: 'medium',
    render_type: 'text',
    status: 'approved',
  })

  const loadAll = useCallback(async () => {
    const [subjectsRes, topicsRes] = await Promise.all([
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('topics').select('id, name, subject_id').order('name'),
    ])
    setSubjects(subjectsRes.data || [])
    setTopics(topicsRes.data || [])

    const { data: statsData } = await supabase
      .from('questions')
      .select('id, status, subject_id')

    if (statsData) {
      const total = statsData.length
      const approved = statsData.filter(q => q.status === 'approved').length
      const floating = statsData.filter(q => !q.status || q.status === 'floating').length
      const in_review = statsData.filter(q => q.status === 'in_review').length
      setStats({ total, approved, floating, in_review })

      const counts: Record<string, number> = {}
      statsData.forEach(q => {
        counts[q.subject_id] = (counts[q.subject_id] || 0) + 1
      })
      setSubjectCounts(counts)
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    let query = supabase
      .from('questions')
      .select('*, topics(name), subjects(name)')
      .order('created_at', { ascending: false })

    if (selectedSubject !== 'all') query = query.eq('subject_id', selectedSubject)
    if (selectedTopic !== 'all') query = query.eq('topic_id', selectedTopic)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`)

    const { data } = await query.limit(100)
    setQuestions(data || [])
  }, [selectedSubject, selectedTopic, statusFilter, search])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { loadQuestions() }, [loadQuestions])

  useEffect(() => {
    if (!newSubject) return
    setNewTopic('')
    setNewTopics(topics.filter(t => t.subject_id === newSubject))
  }, [newSubject, topics])

  const filteredTopics = topics.filter(t => t.subject_id === selectedSubject)

  const handleStatusChange = async (questionId: string, newStatus: string) => {
    await supabase.from('questions').update({ status: newStatus }).eq('id', questionId)
    loadAll()
    loadQuestions()
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    await supabase.from('questions').delete().eq('id', questionId)
    loadAll()
    loadQuestions()
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion) return
    setSaving(true)
    const { error } = await supabase
      .from('questions')
      .update({
        question_text: editingQuestion.question_text,
        option_a: editingQuestion.option_a,
        option_b: editingQuestion.option_b,
        option_c: editingQuestion.option_c,
        option_d: editingQuestion.option_d,
        correct_option: editingQuestion.correct_option,
        explanation: editingQuestion.explanation,
        difficulty_level: editingQuestion.difficulty_level,
        status: editingQuestion.status,
      })
      .eq('id', editingQuestion.id)
    setSaving(false)
    if (!error) {
      setSaveStatus('success')
      setEditingQuestion(null)
      loadQuestions()
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('error')
    }
  }

  const handleAddQuestion = async () => {
    if (!newSubject || !newTopic || !newForm.question_text) return
    setSaving(true)
    const { error } = await supabase.from('questions').insert({
      subject_id: newSubject,
      topic_id: newTopic,
      question_id: newForm.question_id || null,
      question_text: newForm.question_text,
      option_a: newForm.option_a,
      option_b: newForm.option_b,
      option_c: newForm.option_c,
      option_d: newForm.option_d,
      correct_option: newForm.correct_option,
      explanation: newForm.explanation,
      difficulty_level: newForm.difficulty_level,
      render_type: newForm.render_type,
      status: newForm.status,
    })
    setSaving(false)
    if (!error) {
      setAddingQuestion(false)
      setNewForm({
        question_id: '', question_text: '', option_a: '', option_b: '',
        option_c: '', option_d: '', correct_option: 'a',
        explanation: '', difficulty_level: 'medium', render_type: 'text', status: 'approved',
      })
      setNewSubject('')
      setNewTopic('')
      loadAll()
      loadQuestions()
    }
  }

  const statusBadge = (status: string) => {
    const s = status || 'floating'
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      floating: 'bg-yellow-100 text-yellow-700',
      in_review: 'bg-blue-100 text-blue-700',
    }
    return (
      <span className={`text-xs font-bold px-2 py-0.5 ${styles[s] || 'bg-gray-100 text-gray-500'}`}>
        {s.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const inputClass = 'w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'
  const labelClass = 'block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1'

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <span className="text-white text-xs font-black">J</span>
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Admin</span>
              <span className="text-gray-300 mx-2">·</span>
              <span className="text-sm font-black text-black">Question Bank</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="text-xs text-green-600 font-medium">Saved ✓</span>
            )}
            <a href="/" className="text-xs text-gray-400 underline hover:text-black">
              View Simulator
            </a>
            <button
              onClick={() => setAddingQuestion(true)}
              className="px-4 py-2 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              + Add Question
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Questions', value: stats.total, color: 'text-black' },
            { label: 'Approved / Live', value: stats.approved, color: 'text-green-700' },
            { label: 'Floating', value: stats.floating, color: 'text-yellow-600' },
            { label: 'In Review', value: stats.in_review, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subject Overview */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              Questions per Subject
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {subjects.map(s => {
              const count = subjectCounts[s.id] || 0
              const maxCount = Math.max(...Object.values(subjectCounts), 1)
              return (
                <div
                  key={s.id}
                  className="px-5 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => { setSelectedSubject(s.id); setSelectedTopic('all') }}
                >
                  <span className="text-sm text-gray-700 w-52 flex-shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-8 text-right tabular-nums ${count === 0 ? 'text-red-400' : 'text-gray-900'}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Subject</label>
              <select
                className={inputClass}
                value={selectedSubject}
                onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('all') }}
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Topic</label>
              <select
                className={inputClass}
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                disabled={selectedSubject === 'all'}
              >
                <option value="all">All Topics</option>
                {filteredTopics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="floating">Floating</option>
                <option value="in_review">In Review</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Search</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Search question text..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              Questions ({questions.length})
            </p>
            <p className="text-xs text-gray-400">Showing up to 100 results</p>
          </div>

          {questions.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              No questions match your filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {questions.map(q => (
                <div key={q.id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 text-xs font-mono text-gray-400 mt-0.5 w-24">
                      {q.question_id || '—'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 mb-2 leading-relaxed">
                        {q.question_text}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {statusBadge(q.status)}
                        <span className="text-xs text-gray-400">
                          {(q.subjects as any)?.name || '—'}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">
                          {(q.topics as any)?.name || '—'}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400 capitalize">
                          {q.difficulty_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <select
                        className="text-xs border border-gray-200 px-2 py-1 text-gray-600 focus:outline-none"
                        value={q.status || 'approved'}
                        onChange={e => handleStatusChange(q.id, e.target.value)}
                      >
                        <option value="floating">Floating</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Approved</option>
                      </select>
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs px-3 py-1 border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-xs px-3 py-1 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-black">Edit Question</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-gray-400 hover:text-black text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className={labelClass}>Question Text</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={4}
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                />
              </div>
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div key={opt}>
                  <label className={labelClass}>Option {opt.toUpperCase()}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correct_option: opt })}
                      className={`w-8 h-9 text-xs font-black border flex-shrink-0 transition-colors ${
                        editingQuestion.correct_option === opt
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {opt.toUpperCase()}
                    </button>
                    <input
                      type="text"
                      className={inputClass}
                      value={editingQuestion[`option_${opt}` as keyof Question] as string || ''}
                      onChange={e => setEditingQuestion({ ...editingQuestion, [`option_${opt}`]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className={labelClass}>Explanation</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select
                    className={inputClass}
                    value={editingQuestion.difficulty_level}
                    onChange={e => setEditingQuestion({ ...editingQuestion, difficulty_level: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    className={inputClass}
                    value={editingQuestion.status || 'approved'}
                    onChange={e => setEditingQuestion({ ...editingQuestion, status: e.target.value })}
                  >
                    <option value="floating">Floating</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {addingQuestion && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-black">Add Question</h2>
              <button onClick={() => setAddingQuestion(false)} className="text-gray-400 hover:text-black text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Subject</label>
                  <select
                    className={inputClass}
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Topic</label>
                  <select
                    className={inputClass}
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    disabled={!newSubject}
                  >
                    <option value="">Select topic...</option>
                    {newTopics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Question ID</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. ENG_016"
                    value={newForm.question_id}
                    onChange={e => setNewForm({ ...newForm, question_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select
                    className={inputClass}
                    value={newForm.difficulty_level}
                    onChange={e => setNewForm({ ...newForm, difficulty_level: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Question Text</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={newForm.question_text}
                  onChange={e => setNewForm({ ...newForm, question_text: e.target.value })}
                />
              </div>
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div key={opt}>
                  <label className={labelClass}>Option {opt.toUpperCase()}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewForm({ ...newForm, correct_option: opt })}
                      className={`w-8 h-9 text-xs font-black border flex-shrink-0 transition-colors ${
                        newForm.correct_option === opt
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {opt.toUpperCase()}
                    </button>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder={`Option ${opt.toUpperCase()}`}
                      value={newForm[`option_${opt}` as keyof typeof newForm] as string}
                      onChange={e => setNewForm({ ...newForm, [`option_${opt}`]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className={labelClass}>Explanation</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Why is the correct answer right?"
                  value={newForm.explanation}
                  onChange={e => setNewForm({ ...newForm, explanation: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={newForm.status}
                  onChange={e => setNewForm({ ...newForm, status: e.target.value })}
                >
                  <option value="approved">Approved (live immediately)</option>
                  <option value="floating">Floating (needs review)</option>
                  <option value="in_review">In Review</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setAddingQuestion(false)}
                className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={saving || !newSubject || !newTopic || !newForm.question_text}
                className="flex-1 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}