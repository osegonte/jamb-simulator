// src/hooks/useKlassSync.ts
// Realtime subscription: cs_questions (KLASS Studio writes) → Jamsulator floating queue.
// Mount this once at the app level. It runs for the lifetime of the admin session.

import { useEffect, useRef } from 'react'
import { supabaseAdmin } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface CsQuestion {
  id: string
  subtopic_id: string       // cs_structure id (type='subtopic')
  subject_id: string        // cs_structure id (type='subject')
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  explanation: string | null
  type: string
  status: string
}

async function pullQuestion(q: CsQuestion): Promise<void> {
  // 1. Resolve cs_structure subtopic → Jamsulator internal subtopic id
  const { data: csSubtopic } = await supabaseAdmin
    .from('cs_structure')
    .select('external_id, parent_id')
    .eq('id', q.subtopic_id)
    .maybeSingle()

  const jamSubtopicId = csSubtopic?.external_id ?? null

  // 2. Resolve topic from parent_id
  let jamTopicId: string | null = null
  let jamSubjectId: string | null = null

  if (csSubtopic?.parent_id) {
    const { data: csTopic } = await supabaseAdmin
      .from('cs_structure')
      .select('external_id, parent_id')
      .eq('id', csSubtopic.parent_id)
      .maybeSingle()

    jamTopicId = csTopic?.external_id ?? null

    if (csTopic?.parent_id) {
      const { data: csSubject } = await supabaseAdmin
        .from('cs_structure')
        .select('external_id')
        .eq('id', csTopic.parent_id)
        .maybeSingle()

      jamSubjectId = csSubject?.external_id ?? null
    }
  }

  if (!jamSubjectId) {
    console.warn('[useKlassSync] Could not resolve subject for cs_question', q.id)
    return
  }

  // 3. Map KLASS question format → Jamsulator questions table
  // KLASS options: [{ id: 'a', text: '...' }, { id: 'b', text: '...' }, ...]
  const optionA = q.options.find(o => o.id === 'a')?.text ?? ''
  const optionB = q.options.find(o => o.id === 'b')?.text ?? ''
  const optionC = q.options.find(o => o.id === 'c')?.text ?? null
  const optionD = q.options.find(o => o.id === 'd')?.text ?? null

  const { error: insertError } = await supabaseAdmin
    .from('questions')
    .insert({
      subject_id:       jamSubjectId,
      topic_id:         jamTopicId,
      subtopic_id:      jamSubtopicId,
      question_text:    q.question_text,
      option_a:         optionA,
      option_b:         optionB,
      option_c:         optionC,
      option_d:         optionD,
      correct_option:   q.correct_answer,
      explanation:      q.explanation ?? null,
      difficulty_level: 'medium',
      render_type:      'text',
      question_type:    q.type === 'truefalse' ? 'truefalse' : 'mcq',
      status:           'floating',
      year:             null,
    })

  if (insertError) {
    console.error('[useKlassSync] Failed to insert question:', insertError.message)
    return
  }

  // 4. Mark cs_questions row as pulled
  const { error: updateError } = await supabaseAdmin
    .from('cs_questions')
    .update({ status: 'pulled' })
    .eq('id', q.id)

  if (updateError) {
    console.error('[useKlassSync] Failed to mark cs_question as pulled:', updateError.message)
  } else {
    console.log('[useKlassSync] Pulled question from KLASS Studio →', q.id)
  }
}

export function useKlassSync() {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Subscribe to INSERT events on cs_questions
    const channel = supabaseAdmin
      .channel('klass-questions-sync')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'cs_questions',
          filter: 'status=eq.ready',
        },
        async (payload) => {
          const q = payload.new as CsQuestion
          console.log('[useKlassSync] New question from KLASS Studio:', q.id)
          await pullQuestion(q)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useKlassSync] Subscribed to cs_questions')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabaseAdmin.removeChannel(channelRef.current)
      }
    }
  }, [])
}

// ─── Pull any missed questions on mount ──────────────────────────────────────
// In case questions arrived while Jamsulator was offline.
export async function pullPendingKlassQuestions(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('cs_questions')
    .select('*')
    .eq('status', 'ready')

  if (error || !data || data.length === 0) return 0

  for (const q of data) {
    await pullQuestion(q as CsQuestion)
  }

  return data.length
}
