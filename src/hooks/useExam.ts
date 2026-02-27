import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Question, Answer, TopicResult, ExamStatus } from '../types'

export type { Question, Answer, TopicResult, ExamStatus }

export function useExam() {
  const [status, setStatus] = useState<ExamStatus>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [topicResults, setTopicResults] = useState<TopicResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answersRef = useRef<Record<string, Answer>>({})
  const questionsRef = useRef<Question[]>([])

  const EXAM_DURATION = 40 * 60

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { questionsRef.current = questions }, [questions])

  const calculateResults = useCallback((qs: Question[], ans: Record<string, Answer>) => {
    const topicMap: Record<string, TopicResult> = {}
    qs.forEach(q => {
      const answer = ans[q.id]
      const topicName = q.topics?.name || 'Unknown Topic'
      if (!topicMap[q.topic_id]) {
        topicMap[q.topic_id] = {
          topic_id: q.topic_id,
          topic_name: topicName,
          total: 0,
          correct: 0,
          accuracy: 0
        }
      }
      topicMap[q.topic_id].total++
      if (answer?.is_correct) topicMap[q.topic_id].correct++
    })
    return Object.values(topicMap)
      .map(t => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy)
  }, [])

  const startExam = useCallback(async (subjectId: string) => {
    setStatus('loading')
    setAnswers({})
    answersRef.current = {}
    setCurrentIndex(0)
    setTopicResults([])

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*, topics(name), subtopics(name)')
        .eq('subject_id', subjectId)
        .eq('status', 'approved')
        .limit(200)

      if (error) throw error
      if (!data || data.length === 0) {
        setErrorMsg('No questions available for this subject yet.')
        setStatus('error')
        return
      }

      const shuffled = [...data].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(40, shuffled.length))

      setQuestions(selected)
      questionsRef.current = selected
      setTimeLeft(EXAM_DURATION)
      setStatus('active')

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            const results = calculateResults(questionsRef.current, answersRef.current)
            setTopicResults(results)
            setStatus('submitted')
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load questions')
      setStatus('error')
    }
  }, [calculateResults])

  const selectAnswer = useCallback((questionId: string, option: 'a' | 'b' | 'c' | 'd') => {
    const question = questionsRef.current.find(q => q.id === questionId)
    if (!question) return
    const answer: Answer = {
      question_id: questionId,
      topic_id: question.topic_id,
      subtopic_id: question.subtopic_id,
      selected_option: option,
      is_correct: option === question.correct_option
    }
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    answersRef.current = { ...answersRef.current, [questionId]: answer }
  }, [])

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, questionsRef.current.length - 1)))
  }, [])

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const results = calculateResults(questionsRef.current, answersRef.current)
    setTopicResults(results)
    setStatus('submitted')
  }, [calculateResults])

  const totalCorrect = Object.values(answers).filter(a => a.is_correct).length
  const scorePercent = questions.length > 0
    ? Math.round((totalCorrect / questions.length) * 100) : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return {
    status,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    answers,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    totalAnswered: Object.keys(answers).length,
    totalCorrect,
    scorePercent,
    topicResults,
    errorMsg,
    startExam,
    selectAnswer,
    goTo,
    submitExam,
  }
}