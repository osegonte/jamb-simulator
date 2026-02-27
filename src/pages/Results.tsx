import { useLocation, useNavigate } from 'react-router-dom'
import type { Question, Answer, TopicResult } from '../types'

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { answers, questions, topicResults } = location.state as {
    answers: Record<string, Answer>
    questions: Question[]
    scorePercent: number
    topicResults: TopicResult[]
  }

  const totalCorrect = Object.values(answers).filter(a => a.is_correct).length
  const totalQuestions = questions.length
  const scorePercent = Math.round((totalCorrect / totalQuestions) * 100)
  const unanswered = questions.filter(q => !answers[q.id]?.selected_option).length

  const weakTopics = topicResults.filter(t => t.accuracy < 50)
  const strongTopics = topicResults.filter(t => t.accuracy >= 70)

  const grade = scorePercent >= 70 ? 'Pass' : scorePercent >= 50 ? 'Borderline' : 'Fail'
  const gradeColor = scorePercent >= 70 ? 'text-green-700' : scorePercent >= 50 ? 'text-orange-600' : 'text-red-600'

  return (
    <div className="min-h-screen bg-[#f5f5f0] px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
              Examination Report
            </p>
            <h1 className="text-2xl font-black text-black">Performance Analysis</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs tracking-widest uppercase text-gray-500 underline hover:text-black"
          >
            New Exam
          </button>
        </div>

        {/* Score */}
        <div className="bg-white border border-gray-200 p-8 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">Total Score</p>
            <div className="text-6xl font-black text-black tabular-nums">{scorePercent}%</div>
            <p className="text-sm text-gray-500 mt-1">
              {totalCorrect} correct · {totalQuestions - totalCorrect - unanswered} wrong · {unanswered} skipped
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${gradeColor}`}>{grade}</p>
            <p className="text-xs text-gray-400 mt-1">{totalQuestions} questions</p>
          </div>
        </div>

        {/* Weak Areas */}
        {weakTopics.length > 0 && (
          <div className="bg-white border-l-4 border-red-500 border-y border-r border-gray-200 p-6">
            <p className="text-xs font-black tracking-widest text-red-600 uppercase mb-4">
              Weak Areas — Requires Revision
            </p>
            <div className="space-y-3">
              {weakTopics.map(t => (
                <div key={t.topic_id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-800">{t.topic_name}</span>
                    <span className="text-sm font-black text-red-600">{t.accuracy}%</span>
                  </div>
                  <div className="h-1 bg-gray-100">
                    <div className="h-full bg-red-500" style={{ width: `${t.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Breakdown */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              Topic Breakdown
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {topicResults.map(t => {
              const barColor = t.accuracy >= 70 ? 'bg-green-500' : t.accuracy >= 50 ? 'bg-orange-400' : 'bg-red-500'
              return (
                <div key={t.topic_id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{t.topic_name}</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {t.correct}/{t.total}
                      <span className="text-gray-400 font-normal ml-1.5">({t.accuracy}%)</span>
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100">
                    <div className={`h-full ${barColor}`} style={{ width: `${t.accuracy}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strong Areas */}
        {strongTopics.length > 0 && (
          <div className="bg-white border-l-4 border-green-500 border-y border-r border-gray-200 p-6">
            <p className="text-xs font-black tracking-widest text-green-700 uppercase mb-4">
              Strong Areas
            </p>
            <div className="space-y-1">
              {strongTopics.map(t => (
                <div key={t.topic_id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t.topic_name}</span>
                  <span className="text-sm font-bold text-green-700">{t.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Review */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">
              Answer Review
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {questions.map((q, i) => {
              const answer = answers[q.id]
              const isCorrect = answer?.is_correct
              const isSkipped = !answer?.selected_option
              return (
                <div key={q.id} className="px-6 py-4 flex items-start gap-4">
                  <span className={`flex-shrink-0 w-5 h-5 text-xs font-black flex items-center justify-center mt-0.5 ${
                    isSkipped ? 'bg-gray-100 text-gray-400' :
                    isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {isSkipped ? '—' : isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="text-gray-400 mr-1.5 font-mono text-xs">{i + 1}.</span>
                      {q.question_text}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      {!isSkipped && !isCorrect && (
                        <span className="text-red-500">
                          Your answer: <strong className="uppercase">{answer.selected_option}</strong>
                        </span>
                      )}
                      {!isCorrect && (
                        <span className="text-green-700">
                          Correct: <strong className="uppercase">{q.correct_option}</strong>
                        </span>
                      )}
                      {isSkipped && (
                        <span className="text-gray-400">Skipped</span>
                      )}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{q.explanation}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-10">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-500 hover:text-black transition-colors"
          >
            Try Another Subject
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Retake
          </button>
        </div>

      </div>
    </div>
  )
}