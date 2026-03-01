import type { Subject } from '../../hooks/useAdminData'

interface Props {
  subject: Subject
  onClick: () => void
}

function CoverageIndicator({ count, approved }: { count: number; approved: number }) {
  const pct = count === 0 ? 0 : Math.round((approved / count) * 100)
  const color =
    count === 0 ? 'bg-red-500' :
    pct < 40 ? 'bg-red-400' :
    pct < 70 ? 'bg-yellow-400' :
    'bg-green-500'

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400 tabular-nums">
        {count === 0 ? 'Empty' : `${pct}% approved`}
      </span>
    </div>
  )
}

export default function SubjectCard({ subject, onClick }: Props) {
  const hasFloating = subject.floating_count > 0

  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 p-5 text-left hover:border-gray-400 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-black text-black uppercase tracking-wide leading-tight group-hover:text-gray-700 transition-colors">
          {subject.name}
        </h3>
        {hasFloating && (
          <span className="flex-shrink-0 ml-2 text-xs font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200">
            {subject.floating_count} floating
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-3xl font-black text-black tabular-nums">
            {subject.question_count}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Questions</p>
        </div>

        <div className="h-px bg-gray-100" />

        <CoverageIndicator count={subject.question_count} approved={subject.approved_count} />
      </div>
    </button>
  )
}
