import { useState } from 'react'
import type { AdminQuestion, Topic } from '../../hooks/useAdminData'
import EditQuestionModal from './EditQuestionModal'

interface Props {
  questions: AdminQuestion[]
  topics: Topic[]
  statusFilter: string
  search: string
  onStatusFilterChange: (v: string) => void
  onSearchChange: (v: string) => void
  onUpdate: (id: string, updates: Partial<AdminQuestion>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  floating: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-blue-100 text-blue-700',
}

const DIFF_STYLES: Record<string, string> = {
  easy: 'text-green-600',
  medium: 'text-orange-500',
  hard: 'text-red-600',
}

export default function QuestionTable({
  questions, topics, statusFilter, search,
  onStatusFilterChange, onSearchChange,
  onUpdate, onDelete,
}: Props) {
  const [editing, setEditing] = useState<AdminQuestion | null>(null)
  const inputClass = 'bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400'

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    await onDelete(id)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          className={`${inputClass} w-40`}
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="floating">Floating</option>
          <option value="in_review">In Review</option>
        </select>
        <input
          type="text"
          className={`${inputClass} flex-1`}
          placeholder="Search question text..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        {questions.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            No questions match your filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map(q => (
              <div key={q.id} className="px-5 py-4 flex items-start gap-4">
                <span className="flex-shrink-0 text-xs font-mono text-gray-300 mt-0.5 w-20 truncate">
                  {q.question_id || '—'}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 mb-2 leading-relaxed line-clamp-2">
                    {q.question_text}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 ${STATUS_STYLES[q.status || 'floating'] || 'bg-gray-100 text-gray-500'}`}>
                      {(q.status || 'floating').replace('_', ' ').toUpperCase()}
                    </span>
                    {q.topics?.name && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-medium">
                        {q.topics.name}
                      </span>
                    )}
                    <span className={`text-xs font-medium capitalize ${DIFF_STYLES[q.difficulty_level] || 'text-gray-400'}`}>
                      {q.difficulty_level}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  <select
                    className="text-xs border border-gray-200 px-2 py-1 text-gray-600 focus:outline-none cursor-pointer"
                    value={q.status || 'floating'}
                    onChange={e => onUpdate(q.id, { status: e.target.value })}
                  >
                    <option value="floating">Floating</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                  </select>
                  <button
                    onClick={() => setEditing(q)}
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
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditQuestionModal
          question={editing}
          topics={topics}
          onSave={updates => onUpdate(editing.id, updates)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
