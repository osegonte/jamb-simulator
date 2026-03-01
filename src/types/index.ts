export interface Subject {
  id: string
  name: string
}

export interface Topic {
  id: string
  subject_id: string
  name: string
}

export interface Subtopic {
  id: string
  topic_id: string
  subject_id: string
  name: string
}

export interface Question {
  id: string
  subject_id: string
  topic_id: string
  subtopic_id?: string
  question_id?: string
  question_text: string
  passage_text?: string | null
  question_image_url?: string | null
  passage_image_url?: string | null
  render_type: 'text' | 'latex' | 'image' | 'chart'
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation?: string
  difficulty_level: string
  status?: string
  topics?: { name: string }
  subtopics?: { name: string }
}

export interface Answer {
  question_id: string
  topic_id: string
  subtopic_id?: string
  selected_option: 'a' | 'b' | 'c' | 'd' | null
  is_correct: boolean
}

export interface TopicResult {
  topic_id: string
  topic_name: string
  total: number
  correct: number
  accuracy: number
}

export interface Attempt {
  id: string
  user_id: string
  subject_id: string
  total_questions: number
  total_correct: number
  score_percent: number
  time_taken_seconds: number
  completed_at: string
}

export interface AttemptAnswer {
  attempt_id: string
  question_id: string
  topic_id: string
  subtopic_id?: string
  selected_option: 'a' | 'b' | 'c' | 'd' | null
  is_correct: boolean
}

export type ExamStatus = 'idle' | 'loading' | 'active' | 'submitted' | 'error'
export type RenderType = 'text' | 'latex' | 'image' | 'chart'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Option = 'a' | 'b' | 'c' | 'd'