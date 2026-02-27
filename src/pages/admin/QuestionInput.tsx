import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Subject = { id: string; name: string }
type Topic = { id: string; name: string }
type Subtopic = { id: string; name: string }
type RenderType = 'text' | 'latex' | 'image' | 'chart'
type Difficulty = 'easy' | 'medium' | 'hard'
type Option = 'a' | 'b' | 'c' | 'd'

const defaultForm = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a' as Option,
  explanation: '',
  difficulty_level: 'medium' as Difficulty,
  render_type: 'text' as RenderType,
  question_image_url: '',
}

export default function QuestionInput() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])

  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [newSubtopicName, setNewSubtopicName] = useState('')
  const [isNewSubtopic, setIsNewSubtopic] = useState(false)

  const [form, setForm] = useState(defaultForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Load subjects on mount
  useEffect(() => {
    supabase
      .from('subjects')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSubjects(data || []))
  }, [])

  // Load topics when subject changes
  useEffect(() => {
    if (!selectedSubject) return
    setSelectedTopic('')
    setSelectedSubtopic('')
    setSubtopics([])
    supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', selectedSubject)
      .order('name')
      .then(({ data }) => setTopics(data || []))
  }, [selectedSubject])

  // Load subtopics when topic changes
  useEffect(() => {
    if (!selectedTopic) return
    setSelectedSubtopic('')
    supabase
      .from('subtopics')
      .select('id, name')
      .eq('topic_id', selectedTopic)
      .order('name')
      .then(({ data }) => setSubtopics(data || []))
  }, [selectedTopic])

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error } = await supabase.storage
      .from('question-images')
      .upload(fileName, imageFile)
    if (error) throw new Error('Image upload failed')
    const { data } = supabase.storage
      .from('question-images')
      .getPublicUrl(fileName)
    return data.publicUrl
  }

  const getOrCreateSubtopic = async (): Promise<string | null> => {
    if (!selectedTopic) return null

    // User picked an existing subtopic
    if (!isNewSubtopic && selectedSubtopic) return selectedSubtopic

    // User typed a new subtopic
    if (isNewSubtopic && newSubtopicName.trim()) {
      const { data, error } = await supabase
        .from('subtopics')
        .insert({
          topic_id: selectedTopic,
          subject_id: selectedSubject,
          name: newSubtopicName.trim(),
        })
        .select('id')
        .single()
      if (error) throw new Error('Failed to create subtopic')
      return data.id
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject || !selectedTopic) {
      setErrorMsg('Please select a subject and topic')
      setStatus('error')
      return
    }

    setUploading(true)
    setStatus('idle')

    try {
      const imageUrl = await handleImageUpload()
      const subtopicId = await getOrCreateSubtopic()

      const { error } = await supabase.from('questions').insert({
        subject_id: selectedSubject,
        topic_id: selectedTopic,
        subtopic_id: subtopicId,
        question_text: form.question_text,
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_option: form.correct_option,
        explanation: form.explanation,
        difficulty_level: form.difficulty_level,
        render_type: form.render_type,
        question_image_url: imageUrl || form.question_image_url || null,
      })

      if (error) throw error

      setStatus('success')
      setForm(defaultForm)
      setImageFile(null)
      setSelectedSubtopic('')
      setNewSubtopicName('')
      setIsNewSubtopic(false)

      // Reset subtopics list in case new one was added
      const { data } = await supabase
        .from('subtopics')
        .select('id, name')
        .eq('topic_id', selectedTopic)
        .order('name')
      setSubtopics(data || [])

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    } finally {
      setUploading(false)
    }
  }

  const inputClass = 'w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-500'
  const labelClass = 'block text-sm font-medium text-gray-400 mb-1'
  const sectionClass = 'bg-gray-900 rounded-xl p-6 space-y-4'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Add Question</h1>
          <p className="text-gray-400 text-sm mt-1">
            Tag carefully — this drives the weakness analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* SECTION 1: Classification */}
          <div className={sectionClass}>
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Classification
            </h2>

            {/* Subject */}
            <div>
              <label className={labelClass}>Subject</label>
              <select
                className={inputClass}
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                required
              >
                <option value="">Select subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className={labelClass}>Topic</label>
              <select
                className={inputClass}
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
                required
              >
                <option value="">Select topic...</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Subtopic */}
            {selectedTopic && (
              <div>
                <label className={labelClass}>Subtopic <span className="text-gray-600">(optional)</span></label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewSubtopic(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!isNewSubtopic ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Pick existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewSubtopic(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isNewSubtopic ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Create new
                    </button>
                  </div>

                  {!isNewSubtopic ? (
                    <select
                      className={inputClass}
                      value={selectedSubtopic}
                      onChange={e => setSelectedSubtopic(e.target.value)}
                    >
                      <option value="">No subtopic</option>
                      {subtopics.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Hydrocarbons, Quadratic Equations..."
                      value={newSubtopicName}
                      onChange={e => setNewSubtopicName(e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Difficulty + Render Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Difficulty</label>
                <select
                  className={inputClass}
                  value={form.difficulty_level}
                  onChange={e => setForm({ ...form, difficulty_level: e.target.value as Difficulty })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Question Type</label>
                <select
                  className={inputClass}
                  value={form.render_type}
                  onChange={e => setForm({ ...form, render_type: e.target.value as RenderType })}
                >
                  <option value="text">Plain Text</option>
                  <option value="latex">LaTeX / Math</option>
                  <option value="image">Has Diagram</option>
                  <option value="chart">Has Chart</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Question */}
          <div className={sectionClass}>
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Question
            </h2>

            <div>
              <label className={labelClass}>Question Text</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Type the question here..."
                value={form.question_text}
                onChange={e => setForm({ ...form, question_text: e.target.value })}
                required
              />
            </div>

            {/* Image upload — only shows if render type is image */}
            {form.render_type === 'image' && (
              <div>
                <label className={labelClass}>Diagram / Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className={`${inputClass} file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-indigo-600 file:text-white cursor-pointer`}
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
            )}
          </div>

          {/* SECTION 3: Options */}
          <div className={sectionClass}>
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Answer Options
            </h2>

            {(['a', 'b', 'c', 'd'] as Option[]).map(opt => (
              <div key={opt} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, correct_option: opt })}
                  className={`w-8 h-8 rounded-full text-xs font-bold uppercase flex-shrink-0 transition-colors ${
                    form.correct_option === opt
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {opt}
                </button>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={`Option ${opt.toUpperCase()}`}
                  value={form[`option_${opt}` as keyof typeof form] as string}
                  onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                  required
                />
              </div>
            ))}
            <p className="text-xs text-gray-500">Click the letter to mark the correct answer</p>
          </div>

          {/* SECTION 4: Explanation */}
          <div className={sectionClass}>
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Explanation <span className="text-gray-600 normal-case font-normal">(optional but recommended)</span>
            </h2>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Explain why the correct answer is right..."
              value={form.explanation}
              onChange={e => setForm({ ...form, explanation: e.target.value })}
            />
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-green-400 text-sm">
              ✅ Question saved successfully. You can add another.
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">
              ❌ {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {uploading ? 'Saving...' : 'Save Question'}
          </button>

        </form>
      </div>
    </div>
  )
}