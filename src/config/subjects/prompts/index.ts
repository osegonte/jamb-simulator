// src/config/subjects/prompts/index.ts
// Single source of truth for all 25 subject prompts.
// Registry keys come from CONFIG.name — stays in sync with manifest.ts automatically.
//
// WORKFLOW: When you finish a subject's real prompt analysis:
//   1. Replace the body of its .ts file in this folder (keep the export name)
//   2. No changes needed here — it auto-picks up

// ── Subject configs (for .name keys) ─────────────────────────────────────────
import { ENGLISH_CONFIG }                      from '../english'
import { MATHEMATICS_CONFIG }                  from '../mathematics'
import { BIOLOGY_CONFIG }                      from '../biology'
import { CHEMISTRY_CONFIG }                    from '../chemistry'
import { PHYSICS_CONFIG }                      from '../physics'
import { AGRICULTURE_CONFIG }                  from '../agriculture'
import { COMPUTER_STUDIES_CONFIG }             from '../computer-studies'
import { HOME_ECONOMICS_CONFIG }               from '../home-economics'
import { PHYSICAL_HEALTH_EDUCATION_CONFIG }    from '../physical-health-education'
import { LITERATURE_IN_ENGLISH_CONFIG }        from '../literature-in-english'
import { GOVERNMENT_CONFIG }                   from '../government'
import { HISTORY_CONFIG }                      from '../history'
import { CHRISTIAN_RELIGIOUS_STUDIES_CONFIG }  from '../christian-religious-studies'
import { ISLAMIC_STUDIES_CONFIG }              from '../islamic-studies'
import { GEOGRAPHY_CONFIG }                    from '../geography'
import { ART_CONFIG }                          from '../art'
import { MUSIC_CONFIG }                        from '../music'
import { FRENCH_CONFIG }                       from '../french'
import { ARABIC_CONFIG }                       from '../arabic'
import { HAUSA_CONFIG }                        from '../hausa'
import { IGBO_CONFIG }                         from '../igbo'
import { YORUBA_CONFIG }                       from '../yoruba'
import { ECONOMICS_CONFIG }                    from '../economics'
import { COMMERCE_CONFIG }                     from '../commerce'
import { PRINCIPLES_OF_ACCOUNT_CONFIG }        from '../principles-of-account'

// ── Prompts ───────────────────────────────────────────────────────────────────
import { ENGLISH_PROMPT }                      from './english'
import { MATHEMATICS_PROMPT }                  from './mathematics'
import { BIOLOGY_PROMPT }                      from './biology'
import { CHEMISTRY_PROMPT }                    from './chemistry'
import { PHYSICS_PROMPT }                      from './physics'
import { AGRICULTURE_PROMPT }                  from './agriculture'
import { COMPUTER_STUDIES_PROMPT }             from './computer-studies'
import { HOME_ECONOMICS_PROMPT }               from './home-economics'
import { PHYSICAL_HEALTH_EDUCATION_PROMPT }    from './physical-health-education'
import { LITERATURE_IN_ENGLISH_PROMPT }        from './literature-in-english'
import { GOVERNMENT_PROMPT }                   from './government'
import { HISTORY_PROMPT }                      from './history'
import { CHRISTIAN_RELIGIOUS_STUDIES_PROMPT }  from './christian-religious-studies'
import { ISLAMIC_STUDIES_PROMPT }              from './islamic-studies'
import { GEOGRAPHY_PROMPT }                    from './geography'
import { ART_PROMPT }                          from './art'
import { MUSIC_PROMPT }                        from './music'
import { FRENCH_PROMPT }                       from './french'
import { ARABIC_PROMPT }                       from './arabic'
import { HAUSA_PROMPT }                        from './hausa'
import { IGBO_PROMPT }                         from './igbo'
import { YORUBA_PROMPT }                       from './yoruba'
import { ECONOMICS_PROMPT }                    from './economics'
import { COMMERCE_PROMPT }                     from './commerce'
import { PRINCIPLES_OF_ACCOUNT_PROMPT }        from './principles-of-account'

// ── Registry ──────────────────────────────────────────────────────────────────
// Keyed by CONFIG.name — same strings the DB uses for subject names
const PROMPT_REGISTRY: Record<string, string> = {
  [ENGLISH_CONFIG.name]:                      ENGLISH_PROMPT,
  [MATHEMATICS_CONFIG.name]:                  MATHEMATICS_PROMPT,
  [BIOLOGY_CONFIG.name]:                      BIOLOGY_PROMPT,
  [CHEMISTRY_CONFIG.name]:                    CHEMISTRY_PROMPT,
  [PHYSICS_CONFIG.name]:                      PHYSICS_PROMPT,
  [AGRICULTURE_CONFIG.name]:                  AGRICULTURE_PROMPT,
  [COMPUTER_STUDIES_CONFIG.name]:             COMPUTER_STUDIES_PROMPT,
  [HOME_ECONOMICS_CONFIG.name]:               HOME_ECONOMICS_PROMPT,
  [PHYSICAL_HEALTH_EDUCATION_CONFIG.name]:    PHYSICAL_HEALTH_EDUCATION_PROMPT,
  [LITERATURE_IN_ENGLISH_CONFIG.name]:        LITERATURE_IN_ENGLISH_PROMPT,
  [GOVERNMENT_CONFIG.name]:                   GOVERNMENT_PROMPT,
  [HISTORY_CONFIG.name]:                      HISTORY_PROMPT,
  [CHRISTIAN_RELIGIOUS_STUDIES_CONFIG.name]:  CHRISTIAN_RELIGIOUS_STUDIES_PROMPT,
  [ISLAMIC_STUDIES_CONFIG.name]:              ISLAMIC_STUDIES_PROMPT,
  [GEOGRAPHY_CONFIG.name]:                    GEOGRAPHY_PROMPT,
  [ART_CONFIG.name]:                          ART_PROMPT,
  [MUSIC_CONFIG.name]:                        MUSIC_PROMPT,
  [FRENCH_CONFIG.name]:                       FRENCH_PROMPT,
  [ARABIC_CONFIG.name]:                       ARABIC_PROMPT,
  [HAUSA_CONFIG.name]:                        HAUSA_PROMPT,
  [IGBO_CONFIG.name]:                         IGBO_PROMPT,
  [YORUBA_CONFIG.name]:                       YORUBA_PROMPT,
  [ECONOMICS_CONFIG.name]:                    ECONOMICS_PROMPT,
  [COMMERCE_CONFIG.name]:                     COMMERCE_PROMPT,
  [PRINCIPLES_OF_ACCOUNT_CONFIG.name]:        PRINCIPLES_OF_ACCOUNT_PROMPT,
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the extraction prompt for a subject.
 * Throws a clear error if the subject isn't registered — never falls back to generic.
 */
export function getPromptForSubject(subjectName: string): string {
  const prompt = PROMPT_REGISTRY[subjectName]
  if (!prompt) {
    throw new Error(
      `No prompt registered for "${subjectName}". ` +
      `Check that the subject name exactly matches CONFIG.name in its .ts file.`
    )
  }
  return prompt
}

/** True for all 25 subjects — every subject has a prompt file (dedicated or placeholder). */
export function hasPromptForSubject(subjectName: string): boolean {
  return subjectName in PROMPT_REGISTRY
}

/** Returns all registered subject names in registry order. */
export function getSubjectsWithPrompts(): string[] {
  return Object.keys(PROMPT_REGISTRY)
}
