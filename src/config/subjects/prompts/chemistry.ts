// src/config/subjects/prompts/chemistry.ts

import { CHEMISTRY_CONFIG } from '../chemistry'

function buildTopicList(): string {
  return Object.entries(CHEMISTRY_CONFIG.topics).map(([topic, data]) => {
    const subs = (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const CHEMISTRY_PROMPT = `You are extracting ALL questions from a JAMB Chemistry past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 50 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All 50 questions are standalone MCQs — there are NO passage groups like English
• Chemistry papers often include labelled apparatus, energy profile diagrams, electrolysis cells, structural formulae, solubility curves, periodic table fragments, graphs, and tables
• Some questions may say “Questions 8–10 are based on the following” or share one short chemistry stimulus, but still extract EACH question as a separate standalone item
• Questions may appear in any topic order
• ALL go into the "standalone" array — "groups" must always be []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 50 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
4. needs_diagram: set true when the question references or depends on a figure, apparatus, graph, structural formula, energy profile, table, periodic table section, or any visual stimulus
5. diagram_type: only set when needs_diagram is true
6. diagram_description: precise description of what the diagram shows — used to recreate it
7. render_type:
   - "text"  → plain verbal chemistry question
   - "latex" → equations, ionic equations, formulae, oxidation numbers, stoichiometric expressions, structural shorthand, symbols, subscripts, superscripts
   - "image" → question depends on a visual figure, apparatus, graph, chart, table, structure, or labelled set-up
8. Preserve the full wording of the question and options as printed
9. Use ONLY topics and subtopics from the topic list below
10. Choose the most specific matching pattern_code
11. If a short shared stem introduces several numbered questions, repeat enough context in each question_text so each extracted question stands on its own
12. If a structural formula or apparatus image is essential to answering, set needs_diagram = true even if the printed question text is short

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEEDS_DIAGRAM TRIGGER PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set needs_diagram = true when the question contains or depends on phrases like:
• "the figure above"
• "the diagram above"
• "the apparatus shown"
• "fig. 1", "fig. 2", "fig. 3"
• "the graph illustrates"
• "the energy profile"
• "the solubility curve"
• "the structure above"
• "the periodic table below"
• "use the information in the table"
• labelled parts, electrodes, tubes, flasks, beakers, or structural positions
• any question that cannot be answered correctly without seeing the visual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STR1=states_of_matter_particle_theory
STR2=kinetic_theory_brownian_motion
STR3=gas_laws_pressure_volume_temperature
STR4=diffusion_grahams_law
STR5=vapour_density_relative_molecular_mass
STR6=heating_cooling_curve_phase_change
STR7=melting_boiling_sublimation

ATM1=atomic_structure_subatomic_particles
ATM2=isotopes_relative_atomic_mass
ATM3=electronic_configuration
ATM4=periodic_table_group_period
ATM5=ionization_energy_electronegativity
ATM6=chemical_bonding_ionic_covalent
ATM7=hybridization_shape_polarity
ATM8=allotropy

STO1=empirical_molecular_formula
STO2=mole_concept_avogadro
STO3=chemical_equation_balancing
STO4=mass_volume_stoichiometry
STO5=percentage_composition
STO6=gas_volume_stoichiometry
STO7=limiting_reagent
STO8=water_of_crystallization

CHEQ1=acids_bases_salts
CHEQ2=pH_pOH_indicators
CHEQ3=neutralization_titration
CHEQ4=hydrolysis_of_salts
CHEQ5=solubility_solubility_product
CHEQ6=qualitative_analysis_cations
CHEQ7=qualitative_analysis_anions
CHEQ8=flame_test
CHEQ9=hardness_of_water
CHEQ10=standard_solution_preparation

RED1=oxidation_reduction
RED2=oxidizing_reducing_agents
RED3=oxidation_numbers
RED4=electrolysis_products
RED5=faradays_laws
RED6=electrochemical_series
RED7=corrosion_prevention
RED8=electroplating_purification
RED9=cell_reaction_half_equation

ENG1=enthalpy_change
ENG2=heat_of_neutralization
ENG3=heat_of_solution
ENG4=heat_of_formation_combustion
ENG5=energy_profile_activation_energy
ENG6=entropy_spontaneity

EQ1=reversible_reaction_equilibrium
EQ2=le_chatelier_principle
EQ3=equilibrium_constant
EQ4=effect_of_temperature_pressure_concentration
EQ5=catalyst_effect
EQ6=industrial_equilibrium_process

RATE1=reaction_rate_collision_theory
RATE2=factors_affecting_rate
RATE3=catalyst_and_rate_graph
RATE4=temperature_time_data

INORG1=hydrogen_oxygen_water
INORG2=nitrogen_ammonia_nitric_acid
INORG3=halogens_hydrogen_halides
INORG4=sulphur_sulphur_oxides_sulphuric_acid
INORG5=carbon_carbon_oxides_carbonates
INORG6=metals_and_their_compounds
INORG7=extraction_of_metals
INORG8=alloys_uses_properties
INORG9=glass_cement_lime
INORG10=industrial_chemicals
INORG11=air_pollution_water_pollution
INORG12=laboratory_preparation_of_gases
INORG13=drying_agents_gas_tests

ORG1=homologous_series_general_formula
ORG2=alkanes_properties_reactions
ORG3=alkenes_properties_reactions
ORG4=alkynes_properties_reactions
ORG5=aromatic_hydrocarbons
ORG6=petroleum_fractional_distillation_cracking
ORG7=alkanols_properties_reactions
ORG8=alkanoic_acids_properties_reactions
ORG9=esters_esterification_hydrolysis
ORG10=fats_oils_soap_detergents
ORG11=polymers_polymerization
ORG12=functional_group_identification
ORG13=isomerism_naming_iupac
ORG14=carbohydrates_fermentation
ORG15=amines_amides
ORG16=aldehydes_ketones_tests
ORG17=hydrogenation_vulcanization
ORG18=organic_qualitative_analysis

APP1=apparatus_identification
APP2=separation_techniques
APP3=chromatography
APP4=laboratory_safety
APP5=environmental_chemistry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY one of these when needs_diagram is true:
• apparatus
• structural
• reaction
• periodic
• statistical
• coordinate
• other

Guidance:
• apparatus → lab set-up, gas preparation, drying tower, electrolysis cell, titration setup, eudiometer, funnel, delivery tube
• structural → structural formula, displayed formula, dot-and-cross diagram, organic skeleton, molecular shape drawing
• reaction → energy profile, reaction pathway, equilibrium schematic, heating/cooling curve
• periodic → periodic table fragment or block classification diagram
• statistical → table, data table, bar/line chart, solubility table
• coordinate → plotted graph with axes, pressure-volume graph, solubility curve, rate graph
• other → any chemistry visual not covered above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every question, explanation is REQUIRED and must:
• state the chemical principle, law, rule, definition, or reaction type involved
• explain why the correct option fits
• for calculations, show the key mole ratio, formula, substitution, and unit
• for acids/bases, mention the neutralization, pH, ion, or salt principle involved
• for redox/electrolysis, state what is oxidized/reduced and identify the electrode or electron change where relevant
• for equilibrium/rates, name the factor and its effect
• for organic chemistry, identify the functional group, homologous series, mechanism type, or naming rule
• for diagram questions, refer directly to the apparatus, graph trend, labelled part, or structure shown
• be concise but complete — never blank

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPICS — use ONLY these, pick the most specific match
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildTopicList()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "year": <number|null>,
  "subject": "Chemistry",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — name the chemical principle/reaction/rule and explain the key point. Never blank.>",
      "pattern_code": "<code|null>",
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<apparatus|structural|reaction|periodic|statistical|coordinate|other|null>",
      "diagram_description": "<precise description if needs_diagram is true, else null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": []
}
`