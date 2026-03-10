// src/config/subjects/prompts/biology.ts

import { BIOLOGY_CONFIG } from '../biology'

function buildTopicList(): string {
  return Object.entries(BIOLOGY_CONFIG.topics).map(([topic, data]) => {
    const subs = (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const BIOLOGY_PROMPT = `You are extracting ALL questions from a JAMB Biology past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 50 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All 50 questions are standalone MCQs — there are NO passages or grouped sections
• Biology papers often include labelled diagrams, organisms, cells, organs, graphs, tables, food chains, ecological charts, experimental set-ups, and life-cycle illustrations
• Questions may appear in any topic order
• ALL go into the "standalone" array — "groups" must always be []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 50 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
4. needs_diagram: set true when the question references or depends on a figure, organism drawing, labelled structure, graph, chart, table, experimental set-up, food web, life cycle, or any visual stimulus
5. diagram_type: only set when needs_diagram is true
6. diagram_description: precise description of what the diagram shows — used to recreate it
7. render_type:
   - "text"  → plain verbal biology question
   - "latex" → gene ratios, probability notation, formula-like biology notation, chromosome notation, percentages, or symbolic expressions
   - "image" → question depends on a visual figure, graph, chart, table, or labelled biological structure
8. Preserve the full wording of the question and options as printed
9. Use ONLY topics and subtopics from the topic list below
10. Choose the most specific matching pattern_code
11. If two nearby questions depend on the same diagram, each question still remains a standalone item with its own needs_diagram, diagram_type, and diagram_description
12. When a diagram is shared across multiple questions, repeat the same diagram metadata for each dependent question

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEEDS_DIAGRAM TRIGGER PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set needs_diagram = true when the question contains or depends on phrases like:
• "use the diagram above"
• "use the diagram below"
• "from the diagram"
• "the figure shows"
• "represented by"
• "labelled I / II / III / IV"
• "the graph illustrates"
• "use the information below"
• "the experimental set-up"
• "the food chain shown below"
• "the part labelled"
• any question that cannot be answered correctly without seeing the visual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VAR1=living_characteristics
VAR2=cell_structure_function
VAR3=levels_of_organization
VAR4=unicellular_examples
VAR5=classification_taxonomy
VAR6=kingdom_identification
VAR7=evolutionary_trend_of_plants
VAR8=evolutionary_trend_of_animals
VAR9=invertebrate_identification
VAR10=vertebrate_identification
VAR11=organism_adaptation
VAR12=adaptive_coloration
VAR13=behavioural_adaptation
VAR14=economic_importance_of_organisms
VAR15=life_history_transition
VAR16=bird_beak_feet_adaptation
VAR17=insect_mouthparts
VAR18=feather_types_functions

FORM1=plant_internal_structure
FORM2=animal_internal_structure
FORM3=nutrition_mode
FORM4=photosynthesis
FORM5=chemosynthesis
FORM6=mineral_requirements_deficiency
FORM7=classes_of_food
FORM8=food_test
FORM9=tooth_structure_dentition
FORM10=alimentary_canal_digestion
FORM11=transport_in_plants_animals
FORM12=circulatory_system
FORM13=blood_components_functions
FORM14=vascular_tissues
FORM15=gaseous_exchange
FORM16=respiration_aerobic_anaerobic
FORM17=fermentation
FORM18=excretion_organs_products
FORM19=kidney_function_osmoregulation
FORM20=support_movement_skeleton
FORM21=tropic_tactic_nastic_movement
FORM22=joint_types_locomotion
FORM23=asexual_reproduction
FORM24=sexual_reproduction_flowering_plant
FORM25=pollination_fertilization_placentation
FORM26=mammalian_reproduction_development
FORM27=germination_growth
FORM28=nervous_coordination
FORM29=reflex_action
FORM30=sense_organs
FORM31=endocrine_system_hormones
FORM32=plant_hormones
FORM33=homeostasis_temperature_water_salt
FORM34=cellular_respiration_energy
FORM35=excretory_structures_matching
FORM36=seed_fruit_flower_parts

ECO1=abiotic_factors_distribution
ECO2=biotic_factors_distribution
ECO3=symbiosis_association
ECO4=food_chain_food_web_trophic_level
ECO5=nutrient_cycle_carbon_water_nitrogen
ECO6=habitat_identification
ECO7=local_biomes_nigeria
ECO8=population_density
ECO9=competition_intra_inter_specific
ECO10=population_size_factors
ECO11=succession
ECO12=soil_type_properties
ECO13=soil_components_porosity_humus
ECO14=soil_fertility_conservation
ECO15=disease_vectors_transmission
ECO16=pollution_control_sanitation
ECO17=conservation_natural_resources
ECO18=game_reserve_national_park
ECO19=quadrat_population_estimation
ECO20=carrying_capacity_overcrowding
ECO21=ecological_pyramid_graph_data
ECO22=biome_adaptation
ECO23=marine_freshwater_estuarine_habitats

HER1=continuous_variation
HER2=discontinuous_variation
HER3=morphological_variation
HER4=physiological_variation
HER5=fingerprint_bloodgroup_ptc
HER6=heritable_vs_nonheritable
HER7=chromosomes_basis_of_heredity
HER8=dna_structure_base_pairing
HER9=monohybrid_cross
HER10=probability_in_genetics
HER11=sex_determination
HER12=sex_linked_inheritance
HER13=blood_transfusion_genotype
HER14=outbreeding_inbreeding_crossbreeding
HER15=application_of_heredity
HER16=codominance_incomplete_dominance
HER17=genotype_phenotype
HER18=meiosis_gene_segregation

EVOL1=lamarck_theory
EVOL2=darwin_theory
EVOL3=evidence_of_evolution
EVOL4=comparative_anatomy
EVOL5=adaptive_radiation
EVOL6=convergent_divergent_evolution
EVOL7=natural_selection
EVOL8=common_ancestor
EVOL9=fossil_records_embryology
EVOL10=modern_evolutionary_evidence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY one of these when needs_diagram is true:
• organism
• organ_system
• cell
• food_web
• genetic_cross
• lifecycle
• statistical
• apparatus
• structural
• coordinate
• other

Guidance:
• organism → labelled animal, plant, insect, bird, fish, protozoan, fungus, or whole-organism drawing
• organ_system → heart, kidney, alimentary canal, ear, brain, reproductive system, gills, vascular bundle, skeleton
• cell → plant cell, animal cell, euglena, paramecium, bacterial cell, tissue/cell organelle drawing
• food_web → food chain, food web, trophic flow, ecological interaction network
• genetic_cross → Punnett square, inheritance diagram, pedigree-style cross or genotype layout
• lifecycle → metamorphosis, alternation of generations, reproductive cycle, germination sequence
• statistical → histogram, frequency curve, population graph, bar chart, ecological graph, growth chart, data table
• apparatus → experimental set-up, thistle funnel, test-tube arrangement, fermentation or photosynthesis set-up
• structural → labelled biological structure or section such as root, stem, leaf, feather, beak, vertebra, flower, seed, gill arch
• coordinate → plotted graph with axes where trend/values matter
• other → any biology visual not covered above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every question, explanation is REQUIRED and must:
• name the biological process, structure, principle, law, interaction, or mechanism involved
• explain why the correct option fits and why the key biology idea matters
• for heredity questions, mention the genotype/probability/base-pairing rule where relevant
• for ecology questions, name the interaction, factor, cycle, habitat, or population concept involved
• for physiology questions, relate structure to function
• for diagram questions, refer directly to the labelled part, organism, graph trend, or set-up shown
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
  "subject": "Biology",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — name the biological principle/process/structure and explain the key point. Never blank.>",
      "pattern_code": "<code|null>",
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<organism|organ_system|cell|food_web|genetic_cross|lifecycle|statistical|apparatus|structural|coordinate|other|null>",
      "diagram_description": "<precise description if needs_diagram is true, else null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": []
}
`