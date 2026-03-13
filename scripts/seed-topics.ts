/**
 * scripts/seed-topics.ts
 *
 * Seeds subjects, topics, and subtopics from the TypeScript config files.
 * Run with:  npx tsx scripts/seed-topics.ts
 *
 * Requires .env.local with:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_SERVICE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(__dirname, '../.env.local') })
config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Import all subject configs ───────────────────────────────────────────────

import { AGRICULTURE_CONFIG }            from '../src/config/subjects/agriculture.js'
import { ARABIC_CONFIG }                 from '../src/config/subjects/arabic.js'
import { ART_CONFIG }                    from '../src/config/subjects/art.js'
import { BIOLOGY_CONFIG }                from '../src/config/subjects/biology.js'
import { CHEMISTRY_CONFIG }              from '../src/config/subjects/chemistry.js'
import { CHRISTIAN_RELIGIOUS_STUDIES_CONFIG } from '../src/config/subjects/christian-religious-studies.js'
import { COMMERCE_CONFIG }               from '../src/config/subjects/commerce.js'
import { COMPUTER_STUDIES_CONFIG }       from '../src/config/subjects/computer-studies.js'
import { ECONOMICS_CONFIG }              from '../src/config/subjects/economics.js'
import { ENGLISH_CONFIG }                from '../src/config/subjects/english.js'
import { FRENCH_CONFIG }                 from '../src/config/subjects/french.js'
import { GEOGRAPHY_CONFIG }              from '../src/config/subjects/geography.js'
import { GOVERNMENT_CONFIG }             from '../src/config/subjects/government.js'
import { HAUSA_CONFIG }                  from '../src/config/subjects/hausa.js'
import { HISTORY_CONFIG }                from '../src/config/subjects/history.js'
import { HOME_ECONOMICS_CONFIG }         from '../src/config/subjects/home-economics.js'
import { IGBO_CONFIG }                   from '../src/config/subjects/igbo.js'
import { ISLAMIC_STUDIES_CONFIG }        from '../src/config/subjects/islamic-studies.js'
import { LITERATURE_IN_ENGLISH_CONFIG }  from '../src/config/subjects/literature-in-english.js'
import { MATHEMATICS_CONFIG }            from '../src/config/subjects/mathematics.js'
import { MUSIC_CONFIG }                  from '../src/config/subjects/music.js'
import { PHYSICAL_HEALTH_EDUCATION_CONFIG } from '../src/config/subjects/physical-health-education.js'
import { PHYSICS_CONFIG }                from '../src/config/subjects/physics.js'
import { PRINCIPLES_OF_ACCOUNT_CONFIG }  from '../src/config/subjects/principles-of-account.js'
import { YORUBA_CONFIG }                 from '../src/config/subjects/yoruba.js'

// ── Types ────────────────────────────────────────────────────────────────────

type SubjectConfig = {
  name: string
  topics: Record<string, { subtopics: readonly string[]; objectives?: readonly string[] }>
}

const ALL_SUBJECTS: SubjectConfig[] = [
  AGRICULTURE_CONFIG,
  ARABIC_CONFIG,
  ART_CONFIG,
  BIOLOGY_CONFIG,
  CHEMISTRY_CONFIG,
  CHRISTIAN_RELIGIOUS_STUDIES_CONFIG,
  COMMERCE_CONFIG,
  COMPUTER_STUDIES_CONFIG,
  ECONOMICS_CONFIG,
  ENGLISH_CONFIG,
  FRENCH_CONFIG,
  GEOGRAPHY_CONFIG,
  GOVERNMENT_CONFIG,
  HAUSA_CONFIG,
  HISTORY_CONFIG,
  HOME_ECONOMICS_CONFIG,
  IGBO_CONFIG,
  ISLAMIC_STUDIES_CONFIG,
  LITERATURE_IN_ENGLISH_CONFIG,
  MATHEMATICS_CONFIG,
  MUSIC_CONFIG,
  PHYSICAL_HEALTH_EDUCATION_CONFIG,
  PHYSICS_CONFIG,
  PRINCIPLES_OF_ACCOUNT_CONFIG,
  YORUBA_CONFIG,
]

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Starting seed...\n')

  // 1. Detach questions from topics (preserve all questions)
  console.log('Step 1: Detaching questions from topics...')
  const { error: detachErr } = await db
    .from('questions')
    .update({ topic_id: null, subtopic_id: null })
    .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows

  if (detachErr) {
    console.error('❌  Failed to detach questions:', detachErr.message)
    process.exit(1)
  }
  console.log('   ✓ Questions detached\n')

  // 2. Clear topics and subtopics
  console.log('Step 2: Clearing subtopics and topics...')
  const { error: delSubErr } = await db.from('subtopics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delSubErr) { console.error('❌  subtopics delete failed:', delSubErr.message); process.exit(1) }

  const { error: delTopErr } = await db.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delTopErr) { console.error('❌  topics delete failed:', delTopErr.message); process.exit(1) }
  console.log('   ✓ Cleared\n')

  // 3. Load all subjects from DB (they already exist)
  console.log('Step 3: Loading subjects...')
  const { data: existingSubjects, error: subErr } = await db.from('subjects').select('id, name')
  if (subErr) { console.error('❌  subjects fetch failed:', subErr.message); process.exit(1) }

  const subjectMap = new Map<string, string>() // name → id
  for (const s of existingSubjects ?? []) subjectMap.set(s.name, s.id)

  // Insert any missing subjects
  for (const cfg of ALL_SUBJECTS) {
    if (!subjectMap.has(cfg.name)) {
      const { data, error } = await db.from('subjects').insert({ name: cfg.name }).select('id').single()
      if (error) { console.error(`❌  Insert subject "${cfg.name}":`, error.message); process.exit(1) }
      subjectMap.set(cfg.name, data.id)
      console.log(`   + Created missing subject: ${cfg.name}`)
    }
  }
  console.log(`   ✓ ${subjectMap.size} subjects ready\n`)

  // 4. Insert topics and subtopics
  console.log('Step 4: Inserting topics and subtopics...')
  let totalTopics = 0
  let totalSubtopics = 0

  for (const cfg of ALL_SUBJECTS) {
    const subjectId = subjectMap.get(cfg.name)!
    const topicEntries = Object.entries(cfg.topics)

    process.stdout.write(`   ${cfg.name}: ${topicEntries.length} topics`)

    for (const [topicName, topicData] of topicEntries) {
      // Insert topic (with objectives)
      const objectives = Array.from(topicData.objectives ?? [])
      const { data: topicRow, error: topicErr } = await db
        .from('topics')
        .insert({ subject_id: subjectId, name: topicName, objectives })
        .select('id')
        .single()

      if (topicErr) {
        console.error(`\n❌  Insert topic "${topicName}":`, topicErr.message)
        process.exit(1)
      }

      totalTopics++
      const topicId = topicRow.id

      // Insert subtopics — deduplicate within topic first
      const seen = new Set<string>()
      const subtopics = topicData.subtopics
        .filter(s => s.trim())
        .filter(s => { if (seen.has(s)) return false; seen.add(s); return true })

      if (subtopics.length > 0) {
        const rows = subtopics.map(name => ({
          topic_id: topicId,
          subject_id: subjectId,
          name,
        }))

        const { error: subErr } = await db
          .from('subtopics')
          .upsert(rows, { onConflict: 'topic_id,name', ignoreDuplicates: true })
        if (subErr) {
          console.error(`\n❌  Insert subtopics for "${topicName}":`, subErr.message)
          process.exit(1)
        }
        totalSubtopics += subtopics.length
      }
    }

    console.log(` ✓`)
  }

  // 5. Summary
  console.log(`\n✅  Seed complete!`)
  console.log(`   Topics inserted:    ${totalTopics}`)
  console.log(`   Subtopics inserted: ${totalSubtopics}`)

  const { count: qCount } = await db.from('questions').select('*', { count: 'exact', head: true })
  console.log(`   Questions preserved: ${qCount}`)
}

seed().catch(err => {
  console.error('❌  Unexpected error:', err)
  process.exit(1)
})