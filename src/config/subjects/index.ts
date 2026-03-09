// src/config/subjects/index.ts
export { ENGLISH_CONFIG } from './english'
export { MATHEMATICS_CONFIG } from './mathematics'
export { ENGLISH_PROMPT, MATHS_PROMPT, genericPrompt } from './prompts'

export function isMathsSubject(n: string) { return n.toLowerCase().includes('mathematics') || n.toLowerCase() === 'maths' }
export function isEnglishSubject(n: string) { return n.toLowerCase().includes('english') }

export function getPrefix(name: string): string {
  if (isEnglishSubject(name)) return 'ENG'
  if (isMathsSubject(name)) return name.toLowerCase().includes('further') ? 'FMTH' : 'MTH'
  return name.slice(0, 3).toUpperCase()
}