import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Subject { id: string; name: string }

const PRIORITY_SUBJECTS = [
  'Use of English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
]

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<Subject | null>(null)
  const [showAll, setShowAll] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('name')
      .then(({ data }) => setSubjects(data || []))
  }, [])

  const prioritySubjects = subjects.filter(s => PRIORITY_SUBJECTS.includes(s.name))
    .sort((a, b) => PRIORITY_SUBJECTS.indexOf(a.name) - PRIORITY_SUBJECTS.indexOf(b.name))
  const otherSubjects = subjects.filter(s => !PRIORITY_SUBJECTS.includes(s.name))
  const displaySubjects = showAll ? [...prioritySubjects, ...otherSubjects] : prioritySubjects

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <span className="text-white text-xs font-black">J</span>
            </div>
            <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
              JAMB Simulator
            </span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight leading-tight">
            Unified Tertiary<br />Matriculation Exam
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            40 questions · 40 minutes · Topic diagnostic report
          </p>
        </div>

        <div className="border-t border-gray-300 mb-8" />

        {/* Subject Selection */}
        <div className="mb-2">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
            Select Subject
          </p>

          <div className="grid grid-cols-2 gap-2">
            {displaySubjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`p-3.5 text-left text-sm font-medium border transition-all ${
                  selected?.id === s.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400'
                }`}
              >
                {s.name}
              </button>
            ))}

            {/* More / Less toggle */}
            {!showAll ? (
              <button
                onClick={() => setShowAll(true)}
                className="p-3.5 text-left text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all"
              >
                More subjects →
              </button>
            ) : (
              <button
                onClick={() => setShowAll(false)}
                className="p-3.5 text-left text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all col-span-2"
              >
                ← Show less
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-300 my-8" />

        {/* Instructions */}
        <div className="mb-8 space-y-2">
          {[
            'You will be presented with 40 questions.',
            'Each question has one correct answer.',
            'You may navigate between questions freely.',
            'The exam ends when time expires or you submit.',
            'Your topic performance report is shown after submission.',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs text-gray-400 font-mono mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm text-gray-600">{rule}</span>
            </div>
          ))}
        </div>

        {/* Start */}
        <button
          onClick={() => selected && navigate(`/exam/${selected.id}`)}
          disabled={!selected}
          className="w-full py-4 bg-black text-white font-bold text-sm tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
        >
          {selected ? `Begin — ${selected.name}` : 'Select a Subject to Begin'}
        </button>

      </div>
    </div>
  )
}