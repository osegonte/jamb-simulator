import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExam } from '../hooks/useExam'
import type { Passage } from '../hooks/useExam'

// ─── Passage panel: comprehension + stimulus ──────────────────────────────────
function PassagePanel({ passage }: { passage: Passage }) {
  return (
    <div className="bg-[#fafaf8] border border-gray-200 border-l-4 border-l-gray-400 mb-4">
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
          {passage.passage_type === 'stimulus'
            ? 'Study the diagram / data and answer the question below'
            : 'Read the passage and answer the questions that follow'}
        </p>
      </div>
      <div className="px-5 py-4">
        {passage.passage_image_url && (
          <img src={passage.passage_image_url} alt="Stimulus"
            className="w-full max-h-72 object-contain mb-4 bg-white p-2 border border-gray-100" />
        )}
        {passage.passage_text && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
            {passage.passage_text}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Cloze passage: highlights the active blank ───────────────────────────────
function ClozePassagePanel({ passage, activeBlank }: { passage: Passage; activeBlank: number | null }) {
  if (!passage.passage_text) return null

  const parts = passage.passage_text.split(/(\(\d+\)\s*___)/g)

  return (
    <div className="bg-[#fafaf8] border border-gray-200 border-l-4 border-l-blue-400 mb-4 lg:mb-0 lg:sticky lg:top-20">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
          Cloze Passage
        </p>
        {activeBlank != null && (
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200">
            Answering blank ({activeBlank})
          </span>
        )}
      </div>
      <div className="px-5 py-4 max-h-96 overflow-y-auto">
        <p className="text-sm text-gray-800 leading-loose">
          {parts.map((part, i) => {
            const match = part.match(/^\((\d+)\)\s*___$/)
            if (match) {
              const num = parseInt(match[1])
              const isActive = num === activeBlank
              return (
                <span key={i} className={`inline-flex items-center gap-0.5 mx-0.5 px-2 py-0.5 font-bold border transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}>
                  ({num}) ___
                </span>
              )
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      </div>
    </div>
  )
}

// ─── Group mini-navigator ─────────────────────────────────────────────────────
function GroupNav({
  siblings, currentId, answers, onGoTo, allQuestions,
}: {
  siblings: { id: string }[]
  currentId: string
  answers: Record<string, { selected_option: string | null } | undefined>
  onGoTo: (index: number) => void
  allQuestions: { id: string }[]
}) {
  if (siblings.length <= 1) return null
  return (
    <div className="flex items-center gap-2 mb-4 bg-white border border-gray-200 px-4 py-2.5">
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mr-1">
        Passage questions:
      </span>
      {siblings.map((q, i) => {
        const isCurrent = q.id === currentId
        const isAnswered = !!answers[q.id]
        const globalIndex = allQuestions.findIndex(aq => aq.id === q.id)
        return (
          <button key={q.id} onClick={() => onGoTo(globalIndex)}
            className={`w-7 h-7 text-xs font-bold border transition-colors ${
              isCurrent ? 'bg-blue-600 text-white border-blue-600' :
              isAnswered ? 'bg-gray-700 text-white border-gray-700' :
              'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
            }`}>
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────
function QuestionCard({
  currentIndex, currentQuestion, questionImageUrl, options, currentAnswer, onSelectAnswer,
}: {
  currentIndex: number
  currentQuestion: any
  questionImageUrl: string | null | undefined
  options: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
  currentAnswer: { selected_option: string | null } | undefined
  onSelectAnswer: (id: string, opt: 'a' | 'b' | 'c' | 'd') => void
}) {
  return (
    <div className="bg-white border border-gray-200 p-6 md:p-8 mb-4">
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className="text-xs font-black tracking-widest text-gray-400 uppercase">
          Question {currentIndex + 1}
        </span>
        <span className="w-px h-3 bg-gray-200" />
        <span className="text-xs text-gray-400 capitalize">{currentQuestion.difficulty_level}</span>
        {currentQuestion.topics?.name && (
          <>
            <span className="w-px h-3 bg-gray-200" />
            <span className="text-xs text-gray-400">{currentQuestion.topics.name}</span>
          </>
        )}
        {currentQuestion.section && (
          <>
            <span className="w-px h-3 bg-gray-200" />
            <span className="text-xs text-gray-400 capitalize">{currentQuestion.section}</span>
          </>
        )}
      </div>

      {questionImageUrl && (
        <img src={questionImageUrl} alt="Diagram"
          className="w-full max-h-64 object-contain mb-6 bg-gray-50 p-2 border border-gray-100" />
      )}

      <p className="text-gray-900 text-base leading-relaxed font-medium mb-7">
        {currentQuestion.question_text}
      </p>

      <div className="space-y-2">
        {options.map(({ key, text }) => {
          const isSelected = currentAnswer?.selected_option === key
          return (
            <button key={key}
              onClick={() => onSelectAnswer(currentQuestion.id, key)}
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
  )
}

// ─── Main Exam page ───────────────────────────────────────────────────────────
export default function Exam() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const {
    status, questions, currentIndex, currentQuestion,
    answers, timeLeft, formattedTime, totalAnswered,
    startExam, selectAnswer, goTo, submitExam,
    scorePercent, topicResults, errorMsg,
    currentPassage, siblingsInGroup,
  } = useExam()

  useEffect(() => { if (subjectId) startExam(subjectId) }, [subjectId])

  useEffect(() => {
    if (status === 'submitted') {
      navigate('/results', { state: { answers, questions, scorePercent, topicResults } })
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <p className="text-sm text-gray-500 tracking-widest uppercase animate-pulse">Loading questions...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
          <button onClick={() => navigate('/')} className="text-sm underline text-gray-600">Return to home</button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  const isLowTime = timeLeft <= 300
  const isCriticalTime = timeLeft <= 60
  const currentAnswer = answers[currentQuestion.id]
  const unanswered = questions.length - totalAnswered

  const qType = (currentQuestion as any).question_type as string | null
  const isCloze = qType === 'cloze'
  const isGrouped = !!currentPassage
  const activeBlank = isCloze ? ((currentQuestion as any).position_in_passage as number | null) : null
  const questionImageUrl = currentQuestion.question_image_url

  const options = [
    { key: 'a' as const, text: currentQuestion.option_a },
    { key: 'b' as const, text: currentQuestion.option_b },
    { key: 'c' as const, text: currentQuestion.option_c },
    { key: 'd' as const, text: currentQuestion.option_d },
  ].filter(opt => !!opt.text?.trim())

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Question</span>
            <span className="text-sm font-black text-black">
              {currentIndex + 1}
              <span className="text-gray-400 font-normal"> / {questions.length}</span>
            </span>
            {isGrouped && currentPassage && (
              <span className={`text-xs font-bold px-2 py-0.5 ${
                isCloze ? 'bg-blue-100 text-blue-700' :
                currentPassage.passage_type === 'stimulus' ? 'bg-orange-100 text-orange-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {isCloze ? `CLOZE · BLANK ${activeBlank}` : currentPassage.passage_type.toUpperCase()}
              </span>
            )}
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
          <div className="h-full bg-black transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">

        {/* Group navigator */}
        {isGrouped && siblingsInGroup.length > 1 && (
          <GroupNav
            siblings={siblingsInGroup}
            currentId={currentQuestion.id}
            answers={answers}
            onGoTo={goTo}
            allQuestions={questions}
          />
        )}

        {/* CLOZE: two-column on large screens */}
        {isCloze && currentPassage ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            <ClozePassagePanel passage={currentPassage} activeBlank={activeBlank} />
            <div>
              <QuestionCard
                currentIndex={currentIndex}
                currentQuestion={currentQuestion}
                questionImageUrl={questionImageUrl}
                options={options}
                currentAnswer={currentAnswer}
                onSelectAnswer={selectAnswer}
              />
            </div>
          </div>
        ) : (
          <>
            {/* COMPREHENSION / STIMULUS: passage pinned above */}
            {isGrouped && currentPassage && (
              <PassagePanel passage={currentPassage} />
            )}
            <QuestionCard
              currentIndex={currentIndex}
              currentQuestion={currentQuestion}
              questionImageUrl={questionImageUrl}
              options={options}
              currentAnswer={currentAnswer}
              onSelectAnswer={selectAnswer}
            />
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}
            className="px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 disabled:opacity-30 hover:border-gray-500 hover:text-black transition-colors">
            ← Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button onClick={() => setConfirmSubmit(true)}
              className="px-8 py-2.5 bg-black text-white text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
              Submit Exam
            </button>
          ) : (
            <button onClick={() => goTo(currentIndex + 1)}
              className="px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Navigator grid */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Navigator</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => {
              const answered = !!answers[q.id]
              const isCurrent = i === currentIndex
              const hasPassage = !!(q as any).passage_id
              return (
                <button key={q.id} onClick={() => goTo(i)}
                  className={`w-8 h-8 text-xs font-bold transition-all relative ${
                    isCurrent ? 'bg-black text-white' :
                    answered ? 'bg-gray-800 text-white' :
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {i + 1}
                  {hasPassage && (
                    <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                      isCurrent ? 'bg-white' : 'bg-blue-400'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            passage / grouped question
          </p>
        </div>
      </div>

      {/* Submit modal */}
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
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-3 border border-gray-300 text-sm font-medium text-gray-600 hover:border-gray-500">
                Continue
              </button>
              <button onClick={() => { setConfirmSubmit(false); submitExam() }}
                className="flex-1 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}