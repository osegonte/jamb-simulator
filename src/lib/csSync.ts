// src/lib/csSync.ts
import { supabaseAdmin } from './supabase'

async function getCsId(externalId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('cs_structure')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle()
  return data?.id ?? null
}

export async function syncSubject(
  subjectId: string,
  subjectName: string,
  order = 0
): Promise<string | null> {
  const payload = {
    type:        'subject',
    name:        subjectName,
    parent_id:   null,
    subject_id:  null,
    objectives:  null,
    external_id: subjectId,
    order,
    is_active:   true,
  }
  console.log('[csSync] syncSubject →', payload)

  const { data, error } = await supabaseAdmin
    .from('cs_structure')
    .upsert(payload, { onConflict: 'external_id' })
    .select('id')
    .single()

  if (error) {
    console.error('[csSync] syncSubject FAILED:', error.code, error.message, error.details)
    return null
  }

  console.log('[csSync] syncSubject OK → cs id:', data.id)

  await supabaseAdmin
    .from('cs_structure')
    .update({ subject_id: data.id })
    .eq('id', data.id)

  return data.id
}

export async function syncTopic(
  topicId: string,
  topicName: string,
  subjectId: string,
  objectives: string[] | null,
  order = 0
): Promise<string | null> {
  const csSubjectId = await getCsId(subjectId)
  if (!csSubjectId) {
    console.warn('[csSync] syncTopic: parent subject not in cs_structure, skipping', topicId)
    return null
  }

  const { data, error } = await supabaseAdmin
    .from('cs_structure')
    .upsert({
      type:        'topic',
      name:        topicName,
      parent_id:   csSubjectId,
      subject_id:  csSubjectId,
      objectives:  objectives,
      external_id: topicId,
      order,
      is_active:   true,
    }, { onConflict: 'external_id' })
    .select('id')
    .single()

  if (error) {
    console.error('[csSync] syncTopic FAILED:', error.code, error.message)
    return null
  }

  return data.id
}

export async function syncSubtopic(
  subtopicId: string,
  subtopicName: string,
  topicId: string,
  subjectId: string,
  order = 0
): Promise<string | null> {
  const [csTopicId, csSubjectId] = await Promise.all([
    getCsId(topicId),
    getCsId(subjectId),
  ])

  if (!csTopicId || !csSubjectId) {
    console.warn('[csSync] syncSubtopic: parent not in cs_structure, skipping', subtopicId)
    return null
  }

  const { data, error } = await supabaseAdmin
    .from('cs_structure')
    .upsert({
      type:        'subtopic',
      name:        subtopicName,
      parent_id:   csTopicId,
      subject_id:  csSubjectId,
      objectives:  null,
      external_id: subtopicId,
      order,
      is_active:   true,
    }, { onConflict: 'external_id' })
    .select('id')
    .single()

  if (error) {
    console.error('[csSync] syncSubtopic FAILED:', error.code, error.message)
    return null
  }

  return data.id
}

export async function deactivateStructure(externalId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cs_structure')
    .update({ is_active: false })
    .eq('external_id', externalId)

  if (error) console.error('[csSync] deactivateStructure failed:', error.message)
}

export async function runInitialSync(): Promise<{
  subjects: number
  topics: number
  subtopics: number
  errors: string[]
}> {
  const errors: string[] = []
  let subjectCount = 0
  let topicCount = 0
  let subtopicCount = 0

  const { data: subjects, error: sErr } = await supabaseAdmin
    .from('subjects')
    .select('id, name')
    .order('name')

  if (sErr || !subjects) {
    return { subjects: 0, topics: 0, subtopics: 0, errors: ['Failed to load subjects: ' + sErr?.message] }
  }

  console.log('[csSync] Starting sync —', subjects.length, 'subjects')

  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i]
    const id = await syncSubject(s.id, s.name, i)
    if (id) subjectCount++
    else errors.push(`Subject failed: ${s.name}`)
  }

  console.log('[csSync] Subjects done:', subjectCount, '— now syncing topics')

  const { data: topics, error: tErr } = await supabaseAdmin
    .from('topics')
    .select('id, name, subject_id, objectives')
    .order('name')

  if (tErr || !topics) {
    return { subjects: subjectCount, topics: 0, subtopics: 0, errors: [...errors, 'Failed to load topics: ' + tErr?.message] }
  }

  for (let i = 0; i < topics.length; i++) {
    const t = topics[i]
    const id = await syncTopic(t.id, t.name, t.subject_id, t.objectives ?? null, i)
    if (id) topicCount++
    else errors.push(`Topic failed: ${t.name}`)
  }

  console.log('[csSync] Topics done:', topicCount, '— now syncing subtopics')

  // Paginate subtopics — Supabase default limit is 1000 rows per request
  const PAGE_SIZE = 1000
  let page = 0
  let globalIndex = 0
  while (true) {
    const from = page * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data: subtopics, error: stErr } = await supabaseAdmin
      .from('subtopics')
      .select('id, name, topic_id, subject_id')
      .order('name')
      .range(from, to)

    if (stErr) {
      errors.push('Failed to load subtopics page ' + page + ': ' + stErr.message)
      break
    }
    if (!subtopics || subtopics.length === 0) break  // no more rows

    console.log(`[csSync] Subtopics page ${page + 1} — ${subtopics.length} rows (offset ${from})`)

    for (const st of subtopics) {
      const id = await syncSubtopic(st.id, st.name, st.topic_id, st.subject_id, globalIndex++)
      if (id) subtopicCount++
      else errors.push(`Subtopic failed: ${st.name}`)
    }

    if (subtopics.length < PAGE_SIZE) break  // last page
    page++
  }

  console.log('[csSync] Sync complete — subjects:', subjectCount, 'topics:', topicCount, 'subtopics:', subtopicCount)
  if (errors.length) console.warn('[csSync] Errors:', errors)

  return { subjects: subjectCount, topics: topicCount, subtopics: subtopicCount, errors }
}