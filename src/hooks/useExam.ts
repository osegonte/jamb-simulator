import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Question, Answer, TopicResult } from '../types'

export type ExamStatus = 'idle' | 'loading' | 'active' | 'submitted' | 'error'

export interface Passage {
  id: string
  group_id: string
  passage_type: 'comprehension' | 'cloze' | 'stimulus'
  passage_text: string | null
  passage_image_url: string | null
}

export interface ExamQuestion extends Question {
  passage_id?: string | null
  position_in_passage?: number | null
  question_type?: string | null
  section?: string | null
  passages?: Passage | null
}

// Sort so grouped questions cluster by passage (cloze ordered by position), standalone after
function sortQuestions(questions: ExamQuestion[]): ExamQuestion[] {
  const grouped = questions.filter(q => !!q.passage_id)
  const standalone = questions.filter(q => !q.passage_id)

  const passageGroupMap = new Map<string, ExamQuestion[]>()
  for (const q of grouped) {
    const pid = q.passage_id!
    if (!passageGroupMap.has(pid)) passageGroupMap.set(pid, [])
    passageGroupMap.get(pid)!.push(q)
  }

  const sortedGrouped: ExamQuestion[] = []
  for (const [, group] of passageGroupMap) {
    group.sort((a, b) => (a.position_in_passage ?? 0) - (b.position_in_passage ?? 0))
    sortedGrouped.push(...group)
  }

  return [...sortedGrouped, ...standalone]
}

export function useExam() {
  const [status, setStatus] = useState<ExamStatus>('idle')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [passages, setPassages] = useState<Map<string, Passage>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [timeLeft, setTimeLeft] = useState(40 * 60)
  const [scorePercent, setScorePercent] = useState(0)
  const [topicResults, setTopicResults] = useState<TopicResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const calculateResults = useCallback((qs: ExamQuestion[], ans: Record<string, Answer>) => {
    const total = qs.length
    const correct = Object.values(ans).filter(a => a.is_correct).length
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0
    setScorePercent(percent)

    const topicMap = new Map<string, { name: string; total: number; correct: number }>()
    for (const q of qs) {
      const topicId = q.topic_id || 'uncategorised'
      const topicName = (q as any).topics?.name || 'Uncategorised'
      if (!topicMap.has(topicId)) topicMap.set(topicId, { name: topicName, total: 0, correct: 0 })
      const entry = topicMap.get(topicId)!
      entry.total++
      if (ans[q.id]?.is_correct) entry.correct++
    }

    const results: TopicResult[] = []
    for (const [topicId, data] of topicMap) {
      results.push({
        topic_id: topicId,
        topic_name: data.name,
        total: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      })
    }
    results.sort((a, b) => a.accuracy - b.accuracy)
    setTopicResults(results)
    return percent
  }, [])

  const submitExam = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    clearTimer()
    setAnswers(prev => { calculateResults(questions, prev); return prev })
    setStatus('submitted')
  }, [questions, calculateResults])

  const startExam = useCallback(async (subjectId: string) => {
    setStatus('loading')
    setAnswers({})
    setCurrentIndex(0)
    submittedRef.current = false

    try {
      // Fetch approved questions (no join on passages — fetch separately)
      const { data, error } = await supabase
        .from('questions')
        .select('*, topics(name)')
        .eq('subject_id', subjectId)
        .eq('status', 'approved')
        .limit(80)

      if (error) throw error
      if (!data || data.length === 0) {
        setErrorMsg('No approved questions found for this subject.')
        setStatus('error')
        return
      }

      // Collect unique passage IDs and fetch them separately
      const passageIds = [...new Set(
        (data as ExamQuestion[]).map(q => q.passage_id).filter(Boolean) as string[]
      )]

      const passagesMap = new Map<string, Passage>()
      if (passageIds.length > 0) {
        const { data: passageData } = await supabase
          .from('passages')
          .select('id, group_id, passage_type, passage_text, passage_image_url')
          .in('id', passageIds)
        for (const p of passageData || []) {
          passagesMap.set(p.id, p as Passage)
        }
      }

      // Separate grouped and standalone, sample up to 40 keeping groups intact
      const grouped = (data as ExamQuestion[]).filter(q => !!q.passage_id)
      const standalone = (data as ExamQuestion[]).filter(q => !q.passage_id)

      const passageGroupMap = new Map<string, ExamQuestion[]>()
      for (const q of grouped) {
        const pid = q.passage_id!
        if (!passageGroupMap.has(pid)) passageGroupMap.set(pid, [])
        passageGroupMap.get(pid)!.push(q)
      }

      const passageGroups = Array.from(passageGroupMap.values()).sort(() => Math.random() - 0.5)
      const shuffledStandalone = standalone.sort(() => Math.random() - 0.5)

      const selected: ExamQuestion[] = []
      for (const group of passageGroups) {
        if (selected.length + group.length <= 40) selected.push(...group)
      }
      for (const q of shuffledStandalone) {
        if (selected.length >= 40) break
        selected.push(q)
      }

      const sorted = sortQuestions(selected.slice(0, 40))

      setQuestions(sorted)
      setPassages(passagesMap)
      setTimeLeft(40 * 60)
      setStatus('active')

      clearTimer()
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearTimer(); submitExam(); return 0 }
          return t - 1
        })
      }, 1000)
    } catch {
      setErrorMsg('Failed to load questions. Please try again.')
      setStatus('error')
    }
  }, [submitExam])

  const selectAnswer = useCallback((questionId: string, option: 'a' | 'b' | 'c' | 'd') => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        topic_id: question.topic_id || '',
        selected_option: option,
        is_correct: question.correct_option === option,
      }
    }))
  }, [questions])

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) setCurrentIndex(index)
  }, [questions.length])

  useEffect(() => () => clearTimer(), [])

  const currentQuestion = questions[currentIndex] ?? null
  const totalAnswered = Object.keys(answers).length

  const formattedTime = (() => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
    const s = (timeLeft % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })()

  const currentPassage = currentQuestion?.passage_id
    ? passages.get(currentQuestion.passage_id) ?? null
    : null

  const siblingsInGroup = currentQuestion?.passage_id
    ? questions.filter(q => q.passage_id === currentQuestion.passage_id)
    : []

  return {
    status, questions, currentIndex, currentQuestion,
    answers, timeLeft, formattedTime, totalAnswered,
    scorePercent, topicResults, errorMsg,
    passages, currentPassage, siblingsInGroup,
    startExam, selectAnswer, goTo, submitExam,
  }
}