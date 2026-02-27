import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExam } from '../hooks/useExam'

export default function Exam() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const {
    status, questions, currentIndex, currentQuestion,
    answers, timeLeft, formattedTime, totalAnswered,
    startExam, selectAnswer, goTo, submitExam,
    scorePercent, topicResults, errorMsg
  } = useExam()

  useEffect(() => {
    if (subjectId) startExam(subjectId)
  }, [subjectId])

  useEffect(() => {
    if (status === 'submitted') {
      navigate('/results', { state: { answers, questions, scorePercent, topicResults } })
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <p className="text-sm text-gray-500 tracking-widest uppercase animate-pulse">
          Loading questions...
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
          <button onClick={() => navigate('/')} className="text-sm underline text-gray-600">
            Return to home
          </button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  const isLowTime = timeLeft <= 300
  const isCriticalTime = timeLeft <= 60
  const currentAnswer = answers[currentQuestion.id]
  const unanswered = questions.length - totalAnswered

  const options = [
    { key: 'a' as const, text: currentQuestion.option_a },
    { key: 'b' as const, text: currentQuestion.option_b },
    { key: 'c' as const, text: currentQuestion.option_c },
    { key: 'd' as const, text: currentQuestion.option_d },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Question
            </span>
            <span className="text-sm font-black text-black">
              {currentIndex + 1}
              <span className="text-gray-400 font-normal"> / {questions.length}</span>
            </span>
          </div>

          <div className={`font-mono text-xl font-black tracking-widest tabular-nums ${
            isCriticalTime ? 'text-red-600 animate-pulse' :
            isLowTime ? 'text-orange-500' : 'text-black'
          }`}>
            {formattedTime}
          </div>

          <div className="text-xs text-gray-400">
            <span className="text-black font-bold">{totalAnswered}</span> answered
          </div>
        </div>

        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="bg-white border border-gray-200 p-8 mb-6">

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-black tracking-widest text-gray-400 uppercase">
              Question {currentIndex + 1}
            </span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="text-xs text-gray-400 capitalize">
              {currentQuestion.difficulty_level}
            </span>
            {currentQuestion.topics?.name && (
              <>
                <span className="w-px h-3 bg-gray-200" />
                <span className="text-xs text-gray-400">{currentQuestion.topics.name}</span>
              </>
            )}
          </div>

          {currentQuestion.render_type === 'image' && !currentQuestion.question_image_url && (
            <div className="border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 mb-6">
              [ Diagram pending ]
            </div>
          )}

          {currentQuestion.question_image_url && (
            <img
              src={currentQuestion.question_image_url}
              alt="Question diagram"
              className="w-full max-h-64 object-contain mb-6 bg-gray-50 p-2"
            />
          )}

          <p className="text-gray-900 text-base leading-relaxed font-medium mb-8">
            {currentQuestion.question_text}
          </p>

          <div className="space-y-2">
            {options.map(({ key, text }) => {
              const isSelected = currentAnswer?.selected_option === key
              return (
                <button
                  key={key}
                  onClick={() => selectAnswer(currentQuestion.id, key)}
                  className={`w-full text-left flex items-start gap-4 p-4 border transition-all ${
                    isSelected
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-gray-400'
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 border text-xs font-black flex items-center justify-center uppercase mt-0.5 ${
                    isSelected ? 'border-white text-white' : 'border-gray-300 text-gray-500'
                  }`}>
                    {key}
                  </span>
                  <span className="text-sm leading-relaxed">{text}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 disabled:opacity-30 hover:border-gray-500 hover:text-black transition-colors"
          >
            ← Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="px-8 py-2.5 bg-black text-white text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Question Grid */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Navigator</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => {
              const answered = !!answers[q.id]
              const isCurrent = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  className={`w-8 h-8 text-xs font-bold transition-all ${
                    isCurrent ? 'bg-black text-white' :
                    answered ? 'bg-gray-800 text-white' :
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 max-w-sm w-full">
            <h2 className="text-lg font-black text-black mb-2">Submit Exam?</h2>
            <p className="text-sm text-gray-500 mb-1">
              You have answered <strong className="text-black">{totalAnswered}</strong> of{' '}
              <strong className="text-black">{questions.length}</strong> questions.
            </p>
            {unanswered > 0 && (
              <p className="text-sm text-orange-600 mb-6">
                {unanswered} question{unanswered > 1 ? 's' : ''} left unanswered.
              </p>
            )}
            {unanswered === 0 && <div className="mb-6" />}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-3 border border-gray-300 text-sm font-medium text-gray-600 hover:border-gray-500"
              >
                Continue
              </button>
              <button
                onClick={() => { setConfirmSubmit(false); submitExam() }}
                className="flex-1 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}