// src/pages/admin/SubjectWorkspace.tsx
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSubjectData } from '../../hooks/useAdminData'
import QuestionTable from '../../components/admin/QuestionTable'
import FloatingQueue from '../../components/admin/FloatingQueue'
import PassageBuilder from '../../components/admin/PassageBuilder'
import TopicsView from '../../components/admin/TopicsView'

type Tab = 'all' | 'floating' | 'passages' | 'topics'

import { useState } from 'react'

export default function SubjectWorkspace() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const subjectName = (location.state as { subjectName?: string })?.subjectName || 'Subject'
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const {
    questions, floatingQuestions, passages, livePassages, topics, loading,
    statusFilter, setStatusFilter,
    search, setSearch,
    reload: _reload, reloadPassages,
    getOrCreateTopic, createPassage,
    updateQuestion, deleteQuestion, addQuestion,
  } = useSubjectData(subjectId!)

  const totalApproved = questions.filter(q => q.status === 'approved').length
  const totalFloating  = floatingQuestions.length
  const approvedGroupedCount = questions.filter(q => q.passage_id && q.status === 'approved').length

  const tabs: { key: Tab; label: string; count?: number; highlight?: boolean }[] = [
    { key: 'all',      label: 'All Questions',    count: questions.length },
    { key: 'floating', label: 'Floating Queue',   count: totalFloating, highlight: totalFloating > 0 },
    { key: 'passages', label: 'Grouped Questions', count: livePassages.length },
    { key: 'topics',   label: 'Topics' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-xs text-gray-400 hover:text-black transition-colors">
              ← Admin
            </button>
            <span className="text-gray-200">/</span>
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <span className="text-white text-xs font-black">J</span>
            </div>
            <span className="text-sm font-black text-black uppercase tracking-wide">{subjectName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 tabular-nums">
              <span className="text-green-700 font-bold">{totalApproved}</span> approved
              {totalFloating > 0 && <> · <span className="text-yellow-600 font-bold">{totalFloating}</span> floating</>}
              {' · '}<span className="font-bold text-orange-500">{approvedGroupedCount}</span> grouped
            </span>
            <a href="/" className="text-xs text-gray-400 underline hover:text-black">View Simulator →</a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex items-end gap-0">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-xs font-bold tracking-widest uppercase transition-colors border-b-2 ${
                activeTab === tab.key ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 text-xs font-black tabular-nums ${
                  tab.highlight ? 'text-yellow-600' :
                  tab.key === 'passages' ? 'text-purple-500' : 'text-gray-400'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading && activeTab === 'all' ? (
          <div className="bg-white border border-gray-200 px-6 py-16 text-center">
            <p className="text-xs text-gray-400 animate-pulse tracking-widest uppercase">Loading questions...</p>
          </div>
        ) : (
          <>
            {activeTab === 'all' && (
              <QuestionTable
                questions={questions} topics={topics}
                statusFilter={statusFilter} search={search}
                onStatusFilterChange={setStatusFilter} onSearchChange={setSearch}
                onUpdate={(id, updates) => updateQuestion(id, updates)}
                onDelete={(id) => deleteQuestion(id)}
              />
            )}

            {activeTab === 'floating' && (
              <FloatingQueue
                questions={floatingQuestions} passages={passages} topics={topics}
                onUpdate={(id, updates) => updateQuestion(id, updates)}
                onDelete={(id) => deleteQuestion(id)}
              />
            )}

            {activeTab === 'passages' && (
              <>
                {floatingQuestions.some(q => !!q.passage_id) && (
                  <div className="bg-yellow-50 border border-yellow-200 px-5 py-3 mb-4 flex items-center justify-between">
                    <p className="text-xs text-yellow-700">
                      <span className="font-bold">{floatingQuestions.filter(q => !!q.passage_id).length} grouped questions</span> pending approval — review in Floating Queue.
                    </p>
                    <button onClick={() => setActiveTab('floating')} className="text-xs font-bold text-yellow-700 underline">Go to Floating Queue →</button>
                  </div>
                )}
                <PassageBuilder
                  subjectId={subjectId!} subjectName={subjectName}
                  topics={topics} passages={passages}
                  onGetOrCreateTopic={getOrCreateTopic}
                  onCreatePassage={createPassage}
                  onAddQuestion={addQuestion}
                  onUpdateQuestion={(id: string, updates) => updateQuestion(id, updates)}
                  onDeleteQuestion={(id: string) => deleteQuestion(id)}
                  onReloadPassages={reloadPassages}
                />
              </>
            )}

            {activeTab === 'topics' && (
              <TopicsView subjectId={subjectId!} subjectName={subjectName} />
            )}
          </>
        )}
      </div>
    </div>
  )
}