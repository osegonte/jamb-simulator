// src/pages/admin/Dashboard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminData } from '../../hooks/useAdminData'
import SubjectCard from '../../components/admin/SubjectCard'
import type { Subject } from '../../hooks/useAdminData'

const CATEGORY_ORDER = ['science', 'arts', 'commercial'] as const
const CATEGORY_LABEL: Record<string, string> = { science: 'Science', arts: 'Arts', commercial: 'Commercial' }

// Priority order within each category (by subject name)
const PRIORITY: Record<string, Record<string, number>> = {
  science: {
    'Use of English': 0, 'Mathematics': 1, 'Biology': 2, 'Chemistry': 3,
    'Physics': 4, 'Agriculture': 5, 'Computer Studies': 6, 'Home Economics': 7,
    'Physical & Health Education': 8,
  },
  arts: {
    'Use of English': 0, 'Literature in English': 1, 'Government': 2, 'History': 3,
    'Christian Religious Studies': 4, 'Islamic Studies': 5, 'Geography': 6,
    'Art': 7, 'Music': 8, 'French': 9, 'Arabic': 10, 'Hausa': 11, 'Igbo': 12, 'Yoruba': 13,
  },
  commercial: {
    'Use of English': 0, 'Mathematics': 1, 'Economics': 2, 'Commerce': 3,
    'Principles of Account': 4, 'Government': 5,
  },
}

const SCIENCE_SUBJECTS = new Set(['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Agriculture', 'Computer Studies', 'Home Economics', 'Physical & Health Education'])
const ARTS_SUBJECTS = new Set(['Literature in English', 'Government', 'History', 'Christian Religious Studies', 'Islamic Studies', 'Geography', 'Art', 'Music', 'French', 'Arabic', 'Hausa', 'Igbo', 'Yoruba'])
const COMMERCIAL_SUBJECTS = new Set(['Economics', 'Commerce', 'Principles of Account'])
const COMPULSORY = new Set(['Use of English'])

function categorise(subjects: Subject[]): Record<string, Subject[]> {
  const cats: Record<string, Subject[]> = { science: [], arts: [], commercial: [] }
  for (const s of subjects) {
    if (COMPULSORY.has(s.name)) { cats.science.push(s); cats.arts.push(s); cats.commercial.push(s) }
    else if (SCIENCE_SUBJECTS.has(s.name)) cats.science.push(s)
    else if (ARTS_SUBJECTS.has(s.name)) cats.arts.push(s)
    else if (COMMERCIAL_SUBJECTS.has(s.name)) cats.commercial.push(s)
    else cats.science.push(s) // fallback
  }
  for (const cat of CATEGORY_ORDER) {
    cats[cat].sort((a, b) => (PRIORITY[cat][a.name] ?? 99) - (PRIORITY[cat][b.name] ?? 99))
  }
  return cats
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { subjects, loading } = useAdminData()
  const [open, setOpen] = useState<Record<string, boolean>>({ science: true, arts: false, commercial: false })

  const totalQuestions = subjects.reduce((s, x) => s + x.question_count, 0)
  const totalApproved  = subjects.reduce((s, x) => s + x.approved_count, 0)
  const totalFloating  = subjects.reduce((s, x) => s + x.floating_count, 0)
  const categorised = categorise(subjects)

  const toggle = (cat: string) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }))

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
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
          <a href="/" className="text-xs text-gray-400 underline hover:text-black">View Simulator →</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Questions', value: totalQuestions, color: 'text-black' },
            { label: 'Approved / Live', value: totalApproved,  color: 'text-green-700' },
            { label: 'Floating',        value: totalFloating,  color: totalFloating > 0 ? 'text-yellow-600' : 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">{s.label}</p>
              <p className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Category groups */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white border border-gray-200 p-5 h-32 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {CATEGORY_ORDER.map(cat => {
              const list = categorised[cat]
              const isOpen = open[cat]
              const catTotal = list.reduce((s, x) => s + x.question_count, 0)
              const catFloating = list.reduce((s, x) => s + x.floating_count, 0)
              return (
                <div key={cat} className="bg-white border border-gray-200">
                  {/* Category header */}
                  <button
                    onClick={() => toggle(cat)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black uppercase tracking-widest">{CATEGORY_LABEL[cat]}</span>
                      <span className="text-xs text-gray-400">{list.length} subjects</span>
                      {catFloating > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-yellow-100 text-yellow-700">{catFloating} floating</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 tabular-nums">{catTotal} questions</span>
                      <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Subject grid */}
                  {isOpen && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {list.map(s => (
                          <SubjectCard
                            key={`${cat}-${s.id}`}
                            subject={s}
                            onClick={() => navigate(`/admin/subject/${s.id}`, { state: { subjectName: s.name } })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}