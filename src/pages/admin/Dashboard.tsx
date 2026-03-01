import { useNavigate } from 'react-router-dom'
import { useAdminData } from '../../hooks/useAdminData'
import SubjectCard from '../../components/admin/SubjectCard'

export default function Dashboard() {
  const navigate = useNavigate()
  const { subjects, loading } = useAdminData()

  const totalQuestions = subjects.reduce((sum, s) => sum + s.question_count, 0)
  const totalApproved = subjects.reduce((sum, s) => sum + s.approved_count, 0)
  const totalFloating = subjects.reduce((sum, s) => sum + s.floating_count, 0)

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
          <a href="/" className="text-xs text-gray-400 underline hover:text-black">
            View Simulator →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Questions', value: totalQuestions, color: 'text-black' },
            { label: 'Approved / Live', value: totalApproved, color: 'text-green-700' },
            { label: 'Floating', value: totalFloating, color: totalFloating > 0 ? 'text-yellow-600' : 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 p-5">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} tabular-nums`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subject grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Subjects — {subjects.length}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Good coverage</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Needs work</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Empty</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map(s => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  onClick={() => navigate(`/admin/subject/${s.id}`, { state: { subjectName: s.name } })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
