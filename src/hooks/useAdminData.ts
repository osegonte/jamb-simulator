import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../lib/supabase'

export interface Subject {
  id: string
  name: string
  question_count: number
  approved_count: number
  floating_count: number
}

export interface Topic {
  id: string
  name: string
  subject_id: string
}

export interface Subtopic {
  id: string
  name: string
  topic_id: string
  subject_id: string
}

export interface Passage {
  id: string
  group_id: string
  subject_id: string
  passage_type: 'comprehension' | 'cloze' | 'stimulus' | 'data_response' | 'summary' | 'reading_text'
  passage_text: string
  passage_image_url?: string | null
  year: number | null
  created_at: string
  // Diagram fields — present on passages table
  needs_diagram?: boolean
  diagram_status?: 'none' | 'pending' | 'auto_generated' | 'manual_uploaded' | 'skipped'
  diagram_url?: string | null
  diagram_type?: string | null
  diagram_description?: string | null
}

export interface AdminQuestion {
  id: string
  question_id: string | null
  question_text: string
  passage_text: string | null
  passage_image_url: string | null
  question_image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string | null
  difficulty_level: string
  render_type: string
  status: string
  subject_id: string
  topic_id: string | null
  passage_id: string | null
  position_in_passage: number | null
  question_type: string | null
  section: string | null
  year: number | null
  pattern_code: string | null
  // ── Diagram fields ──────────────────────────────
  needs_diagram?: boolean
  diagram_status?: 'none' | 'pending' | 'auto_generated' | 'manual_uploaded' | 'skipped'
  diagram_url?: string | null
  diagram_description?: string | null
  diagram_type?: string | null
  // ── Joins ───────────────────────────────────────
  topics?: { name: string } | null
  passages?: { group_id: string } | null
}

// ─── Subject prefix map ───────────────────────────────────────────────────────
const PREFIX_MAP: Record<string, string> = {
  'Use of English': 'ENG', 'Mathematics': 'MATH', 'Further Mathematics': 'FMATH',
  'Physics': 'PHY', 'Chemistry': 'CHEM', 'Biology': 'BIO',
  'Agricultural Science': 'AGRIC', 'Economics': 'ECON', 'Government': 'GOVT',
  'Literature in English': 'LIT', 'Geography': 'GEO', 'History': 'HIST',
  'Christian Religious Studies': 'CRS', 'Islamic Studies': 'ISL',
  'Civic Education': 'CIVIC', 'Commerce': 'COMM', 'Accounting': 'ACCT',
  'Business Studies': 'BUS', 'Technical Drawing': 'TECH', 'Computer Studies': 'COMP',
  'Music': 'MUS', 'Fine Art': 'ART', 'Home Economics': 'HOME',
  'French': 'FRN', 'Yoruba': 'YOR', 'Igbo': 'IGB', 'Hausa': 'HAU',
}

export function subjectPrefix(name: string): string {
  return PREFIX_MAP[name] || name.split(' ')[0].slice(0, 4).toUpperCase()
}

// ─── Auto question ID ─────────────────────────────────────────────────────────
export async function generateQuestionId(subjectId: string, subjectName: string): Promise<string> {
  const prefix = subjectPrefix(subjectName)
  const { data } = await supabaseAdmin
    .from('questions')
    .select('question_id')
    .eq('subject_id', subjectId)
    .not('question_id', 'is', null)

  const existing = (data || [])
    .map(q => q.question_id as string)
    .filter(id => id?.startsWith(prefix + '_'))
    .map(id => parseInt(id.split('_')[1] || '0', 10))
    .filter(n => !isNaN(n))

  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${prefix}_${String(nextNum).padStart(3, '0')}`
}

export async function isQuestionIdTaken(questionId: string, excludeId?: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from('questions').select('id').eq('question_id', questionId)
  if (!data || data.length === 0) return false
  if (excludeId) return data.some(q => q.id !== excludeId)
  return true
}

// ─── Passage group ID generator ───────────────────────────────────────────────
export function generateGroupId(
  type: 'comprehension' | 'cloze' | 'stimulus',
  subjectName: string,
  year: number | null,
  existingIds: string[]
): string {
  const prefix = type === 'comprehension' ? 'COMP' : type === 'cloze' ? 'CLOZE' : 'STIM'
  const sub = subjectPrefix(subjectName)
  const yearPart = year ? `_${year}` : ''
  const base = `${prefix}_${sub}${yearPart}`
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const candidate = `${base}_${letter}`
    if (!existingIds.includes(candidate)) return candidate
  }
  return `${base}_${Date.now()}`
}

// ─── Section definitions ──────────────────────────────────────────────────────
export interface SectionDef {
  key: string
  label: string
  type: string
  grouped: boolean
}

const ENGLISH_SECTIONS: SectionDef[] = [
  { key: 'comprehension', label: 'Comprehension',                  type: 'passage',     grouped: true  },
  { key: 'cloze',         label: 'Cloze Test',                     type: 'cloze',       grouped: true  },
  { key: 'grammar',       label: 'Grammar / Structure',            type: 'mcq',         grouped: false },
  { key: 'vocab',         label: 'Vocabulary (Synonym / Antonym)', type: 'mcq',         grouped: false },
  { key: 'oral',          label: 'Oral English / Phonetics',       type: 'oral',        grouped: false },
  { key: 'idiom',         label: 'Idioms / Sentence Interp.',      type: 'mcq',         grouped: false },
  { key: 'literature',    label: 'Literature',                     type: 'literature',  grouped: false },
]

const SUBJECT_SECTIONS: Record<string, SectionDef[]> = {
  'Use of English': ENGLISH_SECTIONS,
}

export function getSectionsForSubject(subjectName: string): SectionDef[] {
  return SUBJECT_SECTIONS[subjectName] || []
}

export function getStandaloneSections(subjectName: string): SectionDef[] {
  return getSectionsForSubject(subjectName).filter(s => !s.grouped)
}

export function getGroupedSections(subjectName: string): SectionDef[] {
  return getSectionsForSubject(subjectName).filter(s => s.grouped)
}

// ─── Pattern codes ────────────────────────────────────────────────────────────
export const PATTERN_CODES: Record<string, { code: string; label: string }[]> = {
  comprehension: [
    { code: 'C1', label: 'Main idea'           },
    { code: 'C2', label: 'Inference'           },
    { code: 'C3', label: 'Vocabulary in context' },
    { code: 'C4', label: 'Tone / attitude'     },
    { code: 'C5', label: 'Specific detail'     },
  ],
  cloze: [
    { code: 'CL1', label: 'Verb / tense fill'  },
    { code: 'CL2', label: 'Noun / pronoun fill' },
    { code: 'CL3', label: 'Preposition fill'   },
    { code: 'CL4', label: 'Connector fill'     },
  ],
  grammar: [
    { code: 'G1', label: 'Subject-verb agreement' },
    { code: 'G2', label: 'Tense'               },
    { code: 'G3', label: 'Concord'             },
    { code: 'G4', label: 'Sentence correction' },
    { code: 'G5', label: 'Clause / phrase'     },
  ],
  vocab: [
    { code: 'V1', label: 'Synonym'             },
    { code: 'V2', label: 'Antonym'             },
    { code: 'V3', label: 'Word in context'     },
  ],
  oral: [
    { code: 'O1', label: 'Vowel sound match'   },
    { code: 'O2', label: 'Consonant sound'     },
    { code: 'O3', label: 'Rhyme'               },
    { code: 'O4', label: 'Stress pattern'      },
    { code: 'O5', label: 'Emphatic stress'     },
  ],
  idiom: [
    { code: 'I1', label: 'Idiom meaning'       },
    { code: 'I2', label: 'Sentence interpretation' },
    { code: 'I3', label: 'Figurative language' },
  ],
  literature: [
    { code: 'L1', label: 'Character'           },
    { code: 'L2', label: 'Theme'               },
    { code: 'L3', label: 'Plot'                },
    { code: 'L4', label: 'Style / language'    },
  ],
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useAdminData() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const loadSubjects = useCallback(async () => {
    setLoading(true)
    const subjectsRes = await supabaseAdmin.from('subjects').select('id, name').order('name')
    const subjectList = subjectsRes.data || []

    const enriched: Subject[] = await Promise.all(subjectList.map(async s => {
      const [totalRes, approvedRes, floatingRes] = await Promise.all([
        supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }).eq('subject_id', s.id),
        supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }).eq('subject_id', s.id).eq('status', 'approved'),
        supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }).eq('subject_id', s.id).eq('status', 'floating'),
      ])
      return {
        ...s,
        question_count: totalRes.count ?? 0,
        approved_count: approvedRes.count ?? 0,
        floating_count: floatingRes.count ?? 0,
      }
    }))

    setSubjects(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { loadSubjects() }, [loadSubjects])
  return { subjects, loading, reload: loadSubjects }
}

export function useSubjectData(subjectId: string) {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [passages, setPassages] = useState<Passage[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const loadTopics = useCallback(async () => {
    if (!subjectId) return
    const { data } = await supabaseAdmin
      .from('topics').select('id, name, subject_id')
      .eq('subject_id', subjectId).order('name')
    setTopics(data || [])
  }, [subjectId])

  const loadSubtopics = useCallback(async () => {
    if (!subjectId) return
    const { data } = await supabaseAdmin
      .from('subtopics').select('id, name, topic_id, subject_id')
      .eq('subject_id', subjectId).order('name')
    setSubtopics(data || [])
  }, [subjectId])

  const loadPassages = useCallback(async () => {
    if (!subjectId) return
    const { data } = await supabaseAdmin
      .from('passages').select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })
    setPassages(data || [])
  }, [subjectId])

  const loadQuestions = useCallback(async () => {
    if (!subjectId) return
    setLoading(true)
    let query = supabaseAdmin
      .from('questions')
      .select('*, needs_diagram, diagram_status, diagram_url, diagram_description, diagram_type, topics(name)')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (sectionFilter !== 'all') query = query.eq('section', sectionFilter)
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`)

    const { data } = await query.limit(1000)
    setQuestions(data || [])
    setLoading(false)
  }, [subjectId, statusFilter, sectionFilter, search])

  useEffect(() => {
    loadTopics()
    loadSubtopics()
    loadPassages()
    loadQuestions()
  }, [loadTopics, loadSubtopics, loadPassages, loadQuestions])

  // ─── Derived: only passages that have at least one approved question ───────
  const livePassages = (() => {
    const approvedPassageIds = new Set(
      questions
        .filter(q => q.status === 'approved' && q.passage_id)
        .map(q => q.passage_id!)
    )
    return passages.filter(p => approvedPassageIds.has(p.id))
  })()

  // ─── Derived: floating questions ──────────────────────────────────────────
  const floatingQuestions = questions.filter(q => !q.status || q.status === 'floating')

  const getOrCreateTopic = async (topicName: string): Promise<string | null> => {
    if (!topicName.trim()) return null
    const name = topicName.trim()
    const { data: existing } = await supabaseAdmin
      .from('topics').select('id')
      .eq('subject_id', subjectId).ilike('name', name)
      .maybeSingle()
    if (existing) return existing.id
    const { data: created } = await supabaseAdmin
      .from('topics').insert({ subject_id: subjectId, name })
      .select('id').single()
    if (created) { await loadTopics(); return created.id }
    return null
  }

  const getOrCreateSubtopic = async (subtopicName: string, topicId: string): Promise<string | null> => {
    if (!subtopicName.trim() || !topicId) return null
    const name = subtopicName.trim()
    const { data: existing } = await supabaseAdmin
      .from('subtopics').select('id')
      .eq('topic_id', topicId).ilike('name', name)
      .maybeSingle()
    if (existing) return existing.id
    const { data: created } = await supabaseAdmin
      .from('subtopics').insert({ subject_id: subjectId, topic_id: topicId, name })
      .select('id').single()
    if (created) { await loadSubtopics(); return created.id }
    return null
  }

  const createPassage = async (data: Omit<Passage, 'id' | 'created_at'>): Promise<Passage | null> => {
    const { data: created, error } = await supabaseAdmin
      .from('passages').insert(data).select('*').single()
    if (error || !created) return null
    await loadPassages()
    return created
  }

  const updateQuestion = async (id: string, updates: Partial<AdminQuestion>) => {
    const { error } = await supabaseAdmin.from('questions').update(updates).eq('id', id)
    if (!error) loadQuestions()
    return !error
  }

  const deleteQuestion = async (id: string) => {
    const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)
    if (!error) loadQuestions()
    return !error
  }

  const addQuestion = async (data: Record<string, unknown>) => {
    const { error } = await supabaseAdmin.from('questions').insert(data)
    if (!error) loadQuestions()
    return !error
  }

  return {
    questions,
    floatingQuestions,
    passages,
    livePassages,
    topics,
    subtopics,
    loading,
    statusFilter, setStatusFilter,
    sectionFilter, setSectionFilter,
    search, setSearch,
    reload: loadQuestions,
    reloadPassages: loadPassages,
    getOrCreateTopic,
    getOrCreateSubtopic,
    createPassage,
    updateQuestion,
    deleteQuestion,
    addQuestion,
  }
}