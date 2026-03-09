// src/components/admin/TopicsView.tsx
import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { getConfig } from '../../config/manifest'

interface Props { subjectId: string; subjectName: string }
type SeedState = 'idle' | 'seeding' | 'done' | 'error'

interface TopicRow { id: string; name: string; objectives: string[] | null }
interface SubtopicRow { id: string; name: string; topic_id: string }
interface CountMap { [id: string]: number }

export default function TopicsView({ subjectId, subjectName }: Props) {
  const config = getConfig(subjectName)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [seedState, setSeedState] = useState<SeedState>('idle')
  const [seedLog, setSeedLog] = useState<string[]>([])

  // DB state for counts
  const [dbTopics, setDbTopics] = useState<TopicRow[]>([])
  const [dbSubtopics, setDbSubtopics] = useState<SubtopicRow[]>([])
  const [topicCounts, setTopicCounts] = useState<CountMap>({})
  const [subtopicCounts, setSubtopicCounts] = useState<CountMap>({})

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

  const toggle = (topic: string) => setExpanded(prev => prev === topic ? null : topic)

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
          log(`✓ ${topicName} (objectives updated)`)
        } else {
          const { data: created } = await supabaseAdmin.from('topics').insert({ subject_id: subjectId, name: topicName, objectives }).select('id').single()
          topicId = (created as { id: string }).id
          log(`+ ${topicName} created`)
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
  const uncategorised = (dbTopics.length > 0)
    ? totalQuestions - Object.entries(topicCounts).reduce((s, [,n]) => s + n, 0)
    : 0

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
              <button onClick={() => toggle(topicName)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-black text-black">{topicName}</span>
                  <span className="text-xs text-gray-400">{subtopics.length} subtopics</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 ${
                    qCount === 0 ? 'bg-red-50 text-red-400' : qCount < 10 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-700'
                  }`}>
                    {qCount} Q
                  </span>
                  <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {/* Subtopics with counts */}
                  <div className="px-5 py-4 space-y-3">
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

                    {/* Objectives */}
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
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Uncategorised warning */}
      {uncategorised > 0 && (
        <div className="bg-orange-50 border border-orange-200 px-5 py-3">
          <p className="text-xs text-orange-600"><span className="font-bold">{uncategorised} questions</span> have no topic assigned — re-import or manually tag them.</p>
        </div>
      )}
    </div>
  )
}