// src/config/subjects/manifest.ts
// Central registry — the rest of the app imports from here only.

import { ENGLISH_CONFIG } from './subjects/english'
import { MATHEMATICS_CONFIG } from './subjects/mathematics'
import { BIOLOGY_CONFIG } from './subjects/biology'
import { CHEMISTRY_CONFIG } from './subjects/chemistry'
import { PHYSICS_CONFIG } from './subjects/physics'
import { AGRICULTURE_CONFIG } from './subjects/agriculture'
import { COMPUTER_STUDIES_CONFIG } from './subjects/computer-studies'
import { HOME_ECONOMICS_CONFIG } from './subjects/home-economics'
import { PHYSICAL_HEALTH_EDUCATION_CONFIG } from './subjects/physical-health-education'
import { LITERATURE_IN_ENGLISH_CONFIG } from './subjects/literature-in-english'
import { GOVERNMENT_CONFIG } from './subjects/government'
import { HISTORY_CONFIG } from './subjects/history'
import { CHRISTIAN_RELIGIOUS_STUDIES_CONFIG } from './subjects/christian-religious-studies'
import { ISLAMIC_STUDIES_CONFIG } from './subjects/islamic-studies'
import { GEOGRAPHY_CONFIG } from './subjects/geography'
import { ART_CONFIG } from './subjects/art'
import { MUSIC_CONFIG } from './subjects/music'
import { FRENCH_CONFIG } from './subjects/french'
import { ARABIC_CONFIG } from './subjects/arabic'
import { HAUSA_CONFIG } from './subjects/hausa'
import { IGBO_CONFIG } from './subjects/igbo'
import { YORUBA_CONFIG } from './subjects/yoruba'
import { ECONOMICS_CONFIG } from './subjects/economics'
import { COMMERCE_CONFIG } from './subjects/commerce'
import { PRINCIPLES_OF_ACCOUNT_CONFIG } from './subjects/principles-of-account'

// ─── Shape ────────────────────────────────────────────────────────────────────
export interface SubjectTopic {
  subtopics: readonly string[]
  objectives: readonly string[]
}

export interface SubjectConfig {
  name: string
  prefix: string
  category: 'science' | 'arts' | 'commercial' | 'compulsory'
  priority: number
  totalQuestions: number
  topics: Record<string, SubjectTopic>
}

// ─── Registry ─────────────────────────────────────────────────────────────────
// English appears in all three categories — treated as compulsory in code
// Mathematics appears in science + commercial — primary is science
// Government appears in arts + commercial — primary is arts

export const ALL_SUBJECTS: SubjectConfig[] = [
  // Compulsory
  { ...ENGLISH_CONFIG as unknown as SubjectConfig,     category: 'compulsory', priority: 1 },

  // Science (priority 1 = most important)
  { ...MATHEMATICS_CONFIG as unknown as SubjectConfig, category: 'science',    priority: 1 },
  { ...BIOLOGY_CONFIG as unknown as SubjectConfig,     category: 'science',    priority: 2 },
  { ...CHEMISTRY_CONFIG as unknown as SubjectConfig,   category: 'science',    priority: 3 },
  { ...PHYSICS_CONFIG as unknown as SubjectConfig,     category: 'science',    priority: 4 },
  { ...AGRICULTURE_CONFIG as unknown as SubjectConfig, category: 'science',    priority: 5 },
  { ...COMPUTER_STUDIES_CONFIG as unknown as SubjectConfig, category: 'science', priority: 6 },
  { ...HOME_ECONOMICS_CONFIG as unknown as SubjectConfig,   category: 'science', priority: 7 },
  { ...PHYSICAL_HEALTH_EDUCATION_CONFIG as unknown as SubjectConfig, category: 'science', priority: 8 },

  // Arts
  { ...LITERATURE_IN_ENGLISH_CONFIG as unknown as SubjectConfig, category: 'arts', priority: 1 },
  { ...GOVERNMENT_CONFIG as unknown as SubjectConfig,  category: 'arts',       priority: 2 },
  { ...HISTORY_CONFIG as unknown as SubjectConfig,     category: 'arts',       priority: 3 },
  { ...CHRISTIAN_RELIGIOUS_STUDIES_CONFIG as unknown as SubjectConfig, category: 'arts', priority: 4 },
  { ...ISLAMIC_STUDIES_CONFIG as unknown as SubjectConfig, category: 'arts',   priority: 5 },
  { ...GEOGRAPHY_CONFIG as unknown as SubjectConfig,   category: 'arts',       priority: 6 },
  { ...ART_CONFIG as unknown as SubjectConfig,         category: 'arts',       priority: 7 },
  { ...MUSIC_CONFIG as unknown as SubjectConfig,       category: 'arts',       priority: 8 },
  { ...FRENCH_CONFIG as unknown as SubjectConfig,      category: 'arts',       priority: 9 },
  { ...ARABIC_CONFIG as unknown as SubjectConfig,      category: 'arts',       priority: 10 },
  { ...HAUSA_CONFIG as unknown as SubjectConfig,       category: 'arts',       priority: 11 },
  { ...IGBO_CONFIG as unknown as SubjectConfig,        category: 'arts',       priority: 12 },
  { ...YORUBA_CONFIG as unknown as SubjectConfig,      category: 'arts',       priority: 13 },

  // Commercial
  { ...ECONOMICS_CONFIG as unknown as SubjectConfig,   category: 'commercial', priority: 1 },
  { ...COMMERCE_CONFIG as unknown as SubjectConfig,    category: 'commercial', priority: 2 },
  { ...PRINCIPLES_OF_ACCOUNT_CONFIG as unknown as SubjectConfig, category: 'commercial', priority: 3 },
]

// ─── Lookups ──────────────────────────────────────────────────────────────────
export function getConfig(subjectName: string): SubjectConfig | null {
  return ALL_SUBJECTS.find(s => s.name.toLowerCase() === subjectName.toLowerCase().trim()) || null
}

export function getTopics(subjectName: string): string[] {
  return Object.keys(getConfig(subjectName)?.topics || {})
}

export function getSubtopics(subjectName: string, topic: string): string[] {
  return [...(getConfig(subjectName)?.topics[topic]?.subtopics || [])]
}

export function getObjectives(subjectName: string, topic: string): string[] {
  return [...(getConfig(subjectName)?.topics[topic]?.objectives || [])]
}

export function getByCategory(category: SubjectConfig['category']): SubjectConfig[] {
  return ALL_SUBJECTS
    .filter(s => s.category === category)
    .sort((a, b) => a.priority - b.priority)
}

// ─── Subject type helpers (used by PDFImport) ─────────────────────────────────
export function getPrefix(subjectName: string): string {
  return getConfig(subjectName)?.prefix || subjectName.split(' ')[0].slice(0, 4).toUpperCase()
}

export function isEnglishSubject(subjectName: string): boolean {
  return subjectName.toLowerCase().includes('english') && !subjectName.toLowerCase().includes('literature')
}

export function isMathsSubject(subjectName: string): boolean {
  return subjectName.toLowerCase().includes('mathematics') || subjectName.toLowerCase().includes('maths')
}