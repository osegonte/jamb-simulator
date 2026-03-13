/**
 * scripts/seed-biology.ts
 * Seeds ~60 JAMB-style Biology questions across all 5 topics.
 * Run: VITE_SUPABASE_URL=... VITE_SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-biology.ts
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.VITE_SUPABASE_SERVICE_KEY!
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

// ─── Raw questions (topic name → subtopic name → questions) ───────────────────

const RAW: Array<{
  topic: string
  subtopic: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation: string
}> = [
  // ── Variety of organisms ──────────────────────────────────────────────────
  {
    topic: 'Variety of organisms', subtopic: 'Cell structure and functions of cell components',
    question_text: 'Which of the following organelles is responsible for the synthesis of proteins in a cell?',
    option_a: 'Mitochondria', option_b: 'Ribosome', option_c: 'Golgi apparatus', option_d: 'Lysosome',
    correct_option: 'b',
    explanation: 'Ribosomes are the sites of protein synthesis. They translate mRNA into polypeptide chains using amino acids.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Cell structure and functions of cell components',
    question_text: 'The cell organelle that controls the entry and exit of substances in and out of the cell is the',
    option_a: 'Cell wall', option_b: 'Nucleus', option_c: 'Cell membrane', option_d: 'Vacuole',
    correct_option: 'c',
    explanation: 'The cell membrane (plasma membrane) is selectively permeable and regulates what enters and exits the cell.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Cell structure and functions of cell components',
    question_text: 'Which of the following is NOT found in a plant cell?',
    option_a: 'Cell wall', option_b: 'Chloroplast', option_c: 'Centriole', option_d: 'Vacuole',
    correct_option: 'c',
    explanation: 'Centrioles are found in animal cells and help in cell division. Plant cells do not have centrioles.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Living organisms',
    question_text: 'Which of the following is a characteristic of living organisms that non-living things do not exhibit?',
    option_a: 'Movement', option_b: 'Reproduction', option_c: 'Combustion', option_d: 'Reaction to heat',
    correct_option: 'b',
    explanation: 'Reproduction is unique to living organisms. While non-living things may move or react to stimuli, only living things can reproduce.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Protista (protozoans and protophyta), e.g. Amoeba, Euglena and Paramecium',
    question_text: 'Euglena is classified under Protista because it',
    option_a: 'Has a nucleus and can photosynthesize', option_b: 'Is multicellular with flagella',
    option_c: 'Is unicellular and exhibits both plant and animal characteristics', option_d: 'Has chlorophyll and a cell wall',
    correct_option: 'c',
    explanation: 'Euglena is a unicellular organism that has chloroplasts (plant-like) and can move using a flagellum and ingest food (animal-like), placing it in Protista.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Arthropoda e.g. mosquito, cockroach, housefly, bee, butterfly',
    question_text: 'The main distinguishing feature of arthropods is',
    option_a: 'Soft unsegmented body', option_b: 'Jointed appendages and exoskeleton',
    option_c: 'Presence of notochord', option_d: 'Radial symmetry',
    correct_option: 'b',
    explanation: 'Arthropods are characterized by jointed appendages (legs, antennae) and a hard exoskeleton made of chitin.'
  },
  {
    topic: 'Variety of organisms', subtopic: 'Structural adaptations in organisms',
    question_text: 'The flat, broad shape of the desert cactus stem is an adaptation that helps the plant to',
    option_a: 'Absorb more sunlight for photosynthesis', option_b: 'Store more water and reduce water loss',
    option_c: 'Attract pollinators', option_d: 'Increase respiration rate',
    correct_option: 'b',
    explanation: 'The flattened, thick stem of cacti stores water and minimizes surface area exposed to heat, reducing transpiration in arid environments.'
  },

  // ── Form and functions ─────────────────────────────────────────────────────
  {
    topic: 'Form and functions', subtopic: 'Photosynthesis',
    question_text: 'Which of the following is the correct equation for photosynthesis?',
    option_a: 'CO₂ + H₂O → C₆H₁₂O₆ + O₂', option_b: 'C₆H₁₂O₆ + O₂ → CO₂ + H₂O + Energy',
    option_c: 'CO₂ + O₂ → C₆H₁₂O₆ + H₂O', option_d: 'H₂O + O₂ → CO₂ + C₆H₁₂O₆',
    correct_option: 'a',
    explanation: 'Photosynthesis converts carbon dioxide and water into glucose and oxygen using light energy: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.'
  },
  {
    topic: 'Form and functions', subtopic: 'Photosynthesis',
    question_text: 'The part of the chloroplast where the light-dependent reactions of photosynthesis occur is the',
    option_a: 'Stroma', option_b: 'Thylakoid membrane', option_c: 'Matrix', option_d: 'Outer membrane',
    correct_option: 'b',
    explanation: 'The light-dependent reactions occur in the thylakoid membranes where chlorophyll absorbs light. The Calvin cycle (light-independent) occurs in the stroma.'
  },
  {
    topic: 'Form and functions', subtopic: 'Aerobic respiration',
    question_text: 'The net gain of ATP molecules from the complete oxidation of one molecule of glucose during aerobic respiration is',
    option_a: '2', option_b: '8', option_c: '36 – 38', option_d: '12',
    correct_option: 'c',
    explanation: 'Complete aerobic respiration of one glucose molecule yields approximately 36–38 ATP molecules through glycolysis, the Krebs cycle, and oxidative phosphorylation.'
  },
  {
    topic: 'Form and functions', subtopic: 'Anaerobic respiration',
    question_text: 'The end products of anaerobic respiration in yeast are',
    option_a: 'Carbon dioxide and water', option_b: 'Lactic acid and ATP',
    option_c: 'Ethanol, carbon dioxide and ATP', option_d: 'Glucose and oxygen',
    correct_option: 'c',
    explanation: 'In yeast, anaerobic respiration (fermentation) produces ethanol (ethyl alcohol), carbon dioxide, and a small amount of ATP.'
  },
  {
    topic: 'Form and functions', subtopic: 'Mammalian circulatory system (heart, arteries, vein and capillaries)',
    question_text: 'Blood is pumped to the lungs from the heart through the',
    option_a: 'Pulmonary vein', option_b: 'Aorta', option_c: 'Pulmonary artery', option_d: 'Vena cava',
    correct_option: 'c',
    explanation: 'The pulmonary artery carries deoxygenated blood from the right ventricle to the lungs for oxygenation. The pulmonary vein returns oxygenated blood to the heart.'
  },
  {
    topic: 'Form and functions', subtopic: 'Mammalian circulatory system (heart, arteries, vein and capillaries)',
    question_text: 'Which blood vessel has the thickest muscular wall?',
    option_a: 'Vein', option_b: 'Capillary', option_c: 'Artery', option_d: 'Venule',
    correct_option: 'c',
    explanation: 'Arteries carry blood under high pressure from the heart, so they have thick, muscular, elastic walls to withstand and maintain blood pressure.'
  },
  {
    topic: 'Form and functions', subtopic: 'Kidneys',
    question_text: 'The functional unit of the kidney is the',
    option_a: 'Nephron', option_b: 'Glomerulus', option_c: 'Bowman\'s capsule', option_d: 'Loop of Henle',
    correct_option: 'a',
    explanation: 'The nephron is the basic structural and functional unit of the kidney. Each kidney contains about one million nephrons.'
  },
  {
    topic: 'Form and functions', subtopic: 'Nutrition process (ingestion, digestion, absorption, and assimilation of digested food)',
    question_text: 'Which enzyme is responsible for the breakdown of proteins in the stomach?',
    option_a: 'Amylase', option_b: 'Pepsin', option_c: 'Lipase', option_d: 'Maltase',
    correct_option: 'b',
    explanation: 'Pepsin is a protease enzyme secreted by the stomach lining. It works in the acidic environment of the stomach to break down proteins into peptides.'
  },
  {
    topic: 'Form and functions', subtopic: 'Classes of food substances; carbohydrates, proteins, fats and oils, vitamins, mineral salts and water',
    question_text: 'The deficiency disease caused by lack of Vitamin C is',
    option_a: 'Rickets', option_b: 'Pellagra', option_c: 'Scurvy', option_d: 'Kwashiorkor',
    correct_option: 'c',
    explanation: 'Scurvy results from Vitamin C (ascorbic acid) deficiency. Symptoms include bleeding gums, poor wound healing, and joint pain.'
  },
  {
    topic: 'Form and functions', subtopic: 'Food tests (e.g. starch, reducing sugar, protein, oil, fat etc.)',
    question_text: 'Benedict\'s solution is used to test for the presence of',
    option_a: 'Starch', option_b: 'Protein', option_c: 'Reducing sugars', option_d: 'Fat',
    correct_option: 'c',
    explanation: 'Benedict\'s solution turns brick-red/orange when heated with reducing sugars (e.g. glucose, maltose). Starch is tested with iodine solution.'
  },
  {
    topic: 'Form and functions', subtopic: 'Plant vascular system (phloem and xylem)',
    question_text: 'Which vascular tissue is responsible for the transport of water and mineral salts in plants?',
    option_a: 'Phloem', option_b: 'Xylem', option_c: 'Cambium', option_d: 'Cortex',
    correct_option: 'b',
    explanation: 'Xylem transports water and dissolved mineral salts from roots to leaves. Phloem transports manufactured food (sucrose) from leaves to other parts.'
  },
  {
    topic: 'Form and functions', subtopic: 'Sexual reproduction in flowering plants',
    question_text: 'The transfer of pollen grains from the anther to the stigma of the same flower is called',
    option_a: 'Cross-pollination', option_b: 'Fertilization', option_c: 'Self-pollination', option_d: 'Germination',
    correct_option: 'c',
    explanation: 'Self-pollination occurs when pollen is transferred to the stigma of the same flower or another flower on the same plant. Cross-pollination involves different plants.'
  },
  {
    topic: 'Form and functions', subtopic: 'Reproduction in mammals',
    question_text: 'The structure in mammals that provides nutrients and removes waste products for the developing fetus is the',
    option_a: 'Amnion', option_b: 'Placenta', option_c: 'Chorion', option_d: 'Allantois',
    correct_option: 'b',
    explanation: 'The placenta is a disc-shaped organ connecting the mother and fetus. It allows exchange of nutrients, oxygen, and waste products between maternal and fetal blood.'
  },
  {
    topic: 'Form and functions', subtopic: 'Reflex action',
    question_text: 'A reflex arc consists of which of the following components in the correct order?',
    option_a: 'Effector → motor neuron → spinal cord → sensory neuron → receptor',
    option_b: 'Receptor → sensory neuron → spinal cord → motor neuron → effector',
    option_c: 'Receptor → motor neuron → brain → sensory neuron → effector',
    option_d: 'Effector → sensory neuron → brain → motor neuron → receptor',
    correct_option: 'b',
    explanation: 'A reflex arc follows the path: receptor detects stimulus → sensory neuron carries impulse to spinal cord → relay neuron → motor neuron → effector produces response.'
  },
  {
    topic: 'Form and functions', subtopic: 'Eye (sight)',
    question_text: 'The part of the eye responsible for controlling the amount of light entering the eye is the',
    option_a: 'Cornea', option_b: 'Retina', option_c: 'Iris', option_d: 'Lens',
    correct_option: 'c',
    explanation: 'The iris is the coloured part of the eye containing muscles that control the size of the pupil, thereby regulating how much light enters the eye.'
  },
  {
    topic: 'Form and functions', subtopic: 'Body temperature regulation',
    question_text: 'When body temperature rises above normal, the body responds by',
    option_a: 'Constricting blood vessels near the skin', option_b: 'Increasing metabolic rate',
    option_c: 'Sweating and dilating skin blood vessels', option_d: 'Shivering and reducing blood flow',
    correct_option: 'c',
    explanation: 'When too hot, sweat glands produce sweat (evaporative cooling) and skin arterioles dilate (vasodilation) to lose more heat through the skin surface.'
  },
  {
    topic: 'Form and functions', subtopic: 'Types of excretory structures',
    question_text: 'The excretory organ in insects that is analogous to the kidney in mammals is the',
    option_a: 'Flame cell', option_b: 'Contractile vacuole', option_c: 'Nephridium', option_d: 'Malpighian tubule',
    correct_option: 'd',
    explanation: 'Malpighian tubules in insects extract nitrogenous waste (uric acid) from the haemolymph and pass it to the hindgut for excretion, functioning like kidneys.'
  },
  {
    topic: 'Form and functions', subtopic: 'Tropic, tactic, nastic and sleep movements in plants',
    question_text: 'The bending of a plant shoot towards a light source is known as',
    option_a: 'Geotropism', option_b: 'Phototropism', option_c: 'Thigmotropism', option_d: 'Hydrotropism',
    correct_option: 'b',
    explanation: 'Phototropism is the growth movement of a plant in response to light. Shoots are positively phototropic (grow towards light) due to unequal distribution of auxins.'
  },
  {
    topic: 'Form and functions', subtopic: 'Asexual reproduction',
    question_text: 'Which of the following is an example of vegetative propagation?',
    option_a: 'Budding in yeast', option_b: 'Binary fission in Amoeba',
    option_c: 'Formation of rhizomes in ginger', option_d: 'Spore formation in ferns',
    correct_option: 'c',
    explanation: 'Rhizomes are underground stems that grow horizontally and give rise to new plants — a form of natural vegetative propagation, as seen in ginger, grass and ferns.'
  },

  // ── Ecology ───────────────────────────────────────────────────────────────
  {
    topic: 'Ecology', subtopic: 'Energy flow in the ecosystem: food chains, food webs and trophic levels',
    question_text: 'In a food chain, the organisms that fix energy from the sun are called',
    option_a: 'Primary consumers', option_b: 'Secondary consumers', option_c: 'Producers', option_d: 'Decomposers',
    correct_option: 'c',
    explanation: 'Producers (autotrophs), mainly green plants, capture solar energy through photosynthesis and form the base of every food chain.'
  },
  {
    topic: 'Ecology', subtopic: 'Energy flow in the ecosystem: food chains, food webs and trophic levels',
    question_text: 'The percentage of energy transferred from one trophic level to the next in a food chain is approximately',
    option_a: '100%', option_b: '50%', option_c: '10%', option_d: '1%',
    correct_option: 'c',
    explanation: 'On average, only about 10% of energy is transferred from one trophic level to the next. The rest is lost as heat, used in respiration, or remains in undigested matter.'
  },
  {
    topic: 'Ecology', subtopic: 'Nutrient cycling in nature',
    question_text: 'Bacteria that convert nitrates back to free nitrogen in the nitrogen cycle are called',
    option_a: 'Nitrifying bacteria', option_b: 'Denitrifying bacteria', option_c: 'Nitrogen-fixing bacteria', option_d: 'Decomposers',
    correct_option: 'b',
    explanation: 'Denitrifying bacteria (e.g. Pseudomonas) convert nitrates (NO₃⁻) in soil back to nitrogen gas (N₂), completing the nitrogen cycle.'
  },
  {
    topic: 'Ecology', subtopic: 'Symbiotic interactions of plants and animals',
    question_text: 'The relationship between nitrogen-fixing bacteria (Rhizobium) and leguminous plants is an example of',
    option_a: 'Parasitism', option_b: 'Commensalism', option_c: 'Mutualism', option_d: 'Predation',
    correct_option: 'c',
    explanation: 'Mutualism is a relationship where both organisms benefit. Rhizobium fixes atmospheric nitrogen for the plant; the plant provides carbohydrates for the bacteria.'
  },
  {
    topic: 'Ecology', subtopic: 'Factors affecting the distribution of Organisms',
    question_text: 'Which of the following is an abiotic factor affecting the distribution of organisms?',
    option_a: 'Predation', option_b: 'Competition', option_c: 'Temperature', option_d: 'Parasitism',
    correct_option: 'c',
    explanation: 'Abiotic factors are non-living physical and chemical factors. Temperature, rainfall, pH, light, and salinity are abiotic factors. Predation, competition, and parasitism are biotic.'
  },
  {
    topic: 'Ecology', subtopic: 'SOIL',
    question_text: 'Which type of soil has the best water retention and is most suitable for agriculture?',
    option_a: 'Sandy soil', option_b: 'Loamy soil', option_c: 'Clayey soil', option_d: 'Rocky soil',
    correct_option: 'b',
    explanation: 'Loamy soil is a mixture of sand, silt, and clay with good drainage, water retention, aeration, and humus content, making it ideal for plant growth.'
  },
  {
    topic: 'Ecology', subtopic: 'Humans and Environment',
    question_text: 'The disease caused by Plasmodium and transmitted by the female Anopheles mosquito is',
    option_a: 'Cholera', option_b: 'Tuberculosis', option_c: 'Malaria', option_d: 'Schistosomiasis',
    correct_option: 'c',
    explanation: 'Malaria is caused by Plasmodium parasites, transmitted through the bite of infected female Anopheles mosquitoes. It remains one of Nigeria\'s most common endemic diseases.'
  },
  {
    topic: 'Ecology', subtopic: 'Pollution and its control',
    question_text: 'Which of the following is a major cause of water pollution in rivers near industrial areas?',
    option_a: 'Afforestation', option_b: 'Discharge of industrial effluents', option_c: 'Use of cover crops', option_d: 'Contour ridging',
    correct_option: 'b',
    explanation: 'Industrial effluents contain toxic chemicals, heavy metals, and organic waste. When discharged into rivers, they deplete oxygen, kill aquatic life, and contaminate water sources.'
  },
  {
    topic: 'Ecology', subtopic: 'The Ecology of Populations',
    question_text: 'The number of individuals of a species per unit area is known as',
    option_a: 'Population size', option_b: 'Population density', option_c: 'Biomass', option_d: 'Carrying capacity',
    correct_option: 'b',
    explanation: 'Population density = number of individuals ÷ unit area (or volume). It is a key measure used to study the ecology of populations.'
  },
  {
    topic: 'Ecology', subtopic: 'Conservation of Natural Resources',
    question_text: 'Which of the following best describes the purpose of game reserves in Nigeria?',
    option_a: 'To allow unrestricted hunting of wild animals', option_b: 'To protect and conserve wildlife and their habitats',
    option_c: 'To provide land for agriculture', option_d: 'To extract timber from forests',
    correct_option: 'b',
    explanation: 'Game reserves and national parks are established to protect wildlife from poaching and habitat destruction, conserving biodiversity for present and future generations.'
  },

  // ── Heredity and variations ────────────────────────────────────────────────
  {
    topic: 'Heredity and variations', subtopic: 'Chromosomes – the basis of heredity',
    question_text: 'The genetic material in chromosomes is made up of',
    option_a: 'RNA', option_b: 'Protein only', option_c: 'DNA', option_d: 'Lipids',
    correct_option: 'c',
    explanation: 'Chromosomes are composed of DNA (deoxyribonucleic acid) and proteins (histones). DNA carries the genetic information in sequences called genes.'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Probability in genetics and sex determination',
    question_text: 'In humans, the sex of an offspring is determined by',
    option_a: 'The egg cell of the mother', option_b: 'The sex chromosome in the sperm',
    option_c: 'The temperature at conception', option_d: 'The blood group of the father',
    correct_option: 'b',
    explanation: 'All eggs carry an X chromosome. Sperm carry either X or Y. If X sperm fertilizes the egg, the offspring is XX (female). If Y sperm, the offspring is XY (male).'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Sex – linked characters e.g. baldness, haemophilia, colour blindness, etc.',
    question_text: 'Colour blindness is more common in males than females because',
    option_a: 'Males have two X chromosomes', option_b: 'The gene is on the Y chromosome',
    option_c: 'Males have only one X chromosome and cannot mask the recessive allele', option_d: 'Females have one X chromosome',
    correct_option: 'c',
    explanation: 'The colour blindness gene is X-linked recessive. Males (XY) only need one copy of the recessive allele on their single X to express the condition. Females (XX) need two copies.'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Morphological variations in the physical appearance of individuals',
    question_text: 'Which of the following is an example of continuous variation?',
    option_a: 'Blood groups in humans', option_b: 'Ability to roll the tongue',
    option_c: 'Height in humans', option_d: 'Presence or absence of horns in cattle',
    correct_option: 'c',
    explanation: 'Continuous variation shows a range of phenotypes with no distinct categories — height, weight, and skin colour are examples. Blood group is discontinuous (distinct categories).'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Inheritance of characters in organisms',
    question_text: 'If two heterozygous tall plants (Tt) are crossed, the ratio of tall to short plants in the offspring will be',
    option_a: '1:3', option_b: '3:1', option_c: '1:1', option_d: '2:1',
    correct_option: 'b',
    explanation: 'Tt × Tt gives TT : Tt : tt = 1:2:1 genotype ratio. TT and Tt are both tall, tt is short, giving phenotype ratio 3 tall : 1 short.'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Application of the principles of heredity in',
    question_text: 'Sickle cell anaemia is caused by',
    option_a: 'A dominant allele on chromosome 1', option_b: 'A recessive allele that alters the structure of haemoglobin',
    option_c: 'A sex-linked gene on the X chromosome', option_d: 'An extra chromosome 21',
    correct_option: 'b',
    explanation: 'Sickle cell anaemia is an autosomal recessive condition caused by a point mutation in the beta-globin gene, producing abnormal haemoglobin S that deforms red blood cells.'
  },
  {
    topic: 'Heredity and variations', subtopic: 'Blood groups',
    question_text: 'A person with blood group AB can receive blood from',
    option_a: 'Group A only', option_b: 'Group O only',
    option_c: 'Groups A, B, AB and O (universal recipient)', option_d: 'Groups A and B only',
    correct_option: 'c',
    explanation: 'People with blood group AB have both A and B antigens on their red blood cells and no antibodies against A or B in their plasma, making them universal recipients.'
  },

  // ── Evolution ─────────────────────────────────────────────────────────────
  {
    topic: 'Evolution', subtopic: 'Theories of evolution',
    question_text: 'Darwin\'s theory of evolution by natural selection is based on which of the following key ideas?',
    option_a: 'Organisms acquire new traits during their lifetime and pass them on',
    option_b: 'Organisms with favourable variations survive and reproduce more successfully',
    option_c: 'Evolution is driven only by mutation',
    option_d: 'All species were created simultaneously and are unchanging',
    correct_option: 'b',
    explanation: 'Darwin proposed that natural selection favours individuals with beneficial heritable variations. These individuals survive and reproduce more, passing on their traits to offspring.'
  },
  {
    topic: 'Evolution', subtopic: 'Lamarck\'s theory',
    question_text: 'Lamarck\'s theory of evolution suggested that',
    option_a: 'Evolution occurs by natural selection of random mutations',
    option_b: 'Organisms pass on characteristics acquired during their lifetime to offspring',
    option_c: 'Species are fixed and never change',
    option_d: 'The fossil record proves evolution',
    correct_option: 'b',
    explanation: 'Lamarck proposed the "inheritance of acquired characteristics" — traits developed by use or disuse during an organism\'s life are passed to offspring. This was later disproved.'
  },
  {
    topic: 'Evolution', subtopic: 'Evidence of evolution',
    question_text: 'Homologous structures in different organisms are evidence for evolution because they suggest',
    option_a: 'The organisms perform exactly the same functions', option_b: 'The organisms evolved from a common ancestor',
    option_c: 'The organisms live in the same habitat', option_d: 'The structures are made of different tissues',
    correct_option: 'b',
    explanation: 'Homologous structures (e.g. human arm, whale flipper, bat wing) share similar bone arrangements suggesting descent from a common ancestor, though they may serve different functions.'
  },
  {
    topic: 'Evolution', subtopic: 'Evidence of evolution',
    question_text: 'Which of the following provides the most direct evidence of evolution over time?',
    option_a: 'Comparative anatomy', option_b: 'Fossil records', option_c: 'Embryology', option_d: 'Blood serology',
    correct_option: 'b',
    explanation: 'Fossil records provide direct physical evidence of organisms that lived in the past, showing how species have changed over time and the existence of transitional forms.'
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔬 Biology seed — looking up Biology subject...')

  // 1. Get subject ID
  const { data: subject } = await sb.from('subjects').select('id').eq('name', 'Biology').single()
  if (!subject) { console.error('Biology subject not found'); process.exit(1) }
  console.log('  Subject id:', subject.id)

  // 2. Get all topics for Biology
  const { data: topics } = await sb.from('topics').select('id, name').eq('subject_id', subject.id)
  if (!topics) { console.error('No topics found'); process.exit(1) }
  const topicMap = new Map(topics.map(t => [t.name, t.id]))
  console.log(`  Found ${topics.length} topics`)

  // 3. Get all subtopics for Biology
  const { data: subtopics } = await sb.from('subtopics').select('id, name, topic_id').eq('subject_id', subject.id)
  if (!subtopics) { console.error('No subtopics found'); process.exit(1) }
  // key: `topicId::subtopicName`
  const subtopicMap = new Map(subtopics.map(s => [`${s.topic_id}::${s.name}`, s.id]))
  console.log(`  Found ${subtopics.length} subtopics`)

  // 4. Insert questions
  let ok = 0; let skip = 0
  for (const q of RAW) {
    const topicId = topicMap.get(q.topic)
    if (!topicId) { console.warn(`  ⚠ Topic not found: "${q.topic}"`); skip++; continue }

    const subtopicId = subtopicMap.get(`${topicId}::${q.subtopic}`)
    if (!subtopicId) { console.warn(`  ⚠ Subtopic not found: "${q.subtopic}"`); skip++; continue }

    const { error } = await sb.from('questions').insert({
      subject_id:       subject.id,
      topic_id:         topicId,
      subtopic_id:      subtopicId,
      question_text:    q.question_text,
      option_a:         q.option_a,
      option_b:         q.option_b,
      option_c:         q.option_c,
      option_d:         q.option_d,
      correct_option:   q.correct_option,
      explanation:      q.explanation,
      difficulty_level: 'medium',
      render_type:      'text',
      question_type:    'mcq',
      status:           'approved',
      year:             null,
    })

    if (error) { console.error(`  ✗ Insert failed: ${error.message}`); skip++ }
    else { console.log(`  ✓ "${q.question_text.slice(0, 55)}..."`); ok++ }
  }

  console.log(`\n✅ Done — ${ok} inserted, ${skip} skipped`)
}

main()