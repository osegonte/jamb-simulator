// src/config/subjects/prompts/mathematics.ts

import { MATHEMATICS_CONFIG } from '../mathematics'

function buildTopicList(): string {
  return Object.entries(MATHEMATICS_CONFIG.topics).map(([topic, data]) => {
    const subs = (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const MATHEMATICS_PROMPT = `You are extracting ALL questions from a JAMB Mathematics past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 50 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All 50 questions are standalone MCQs — there are NO passages or grouped sections
• Questions may include diagrams, graphs, tables, charts, constructions, solids, bearings, or labelled figures
• Questions may appear in any topic order
• ALL go into the "standalone" array — "groups" must always be []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 50 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
4. needs_diagram: set true when the question references or depends on a figure, graph, chart, table, or labelled geometry/statistics object
5. diagram_type: only set when needs_diagram is true
6. diagram_description: precise description of what the diagram shows — used to recreate it
7. render_type:
   - "text"  → plain verbal question
   - "latex" → expressions, equations, logs, surds, matrices, determinants, trig, calculus, probability notation
   - "image" → question depends on a visual figure, graph, chart, or table
8. Preserve the full wording of the question and options as printed
9. Use ONLY topics and subtopics from the topic list below
10. Choose the most specific matching pattern_code
11. If an old paper contains more than four printed options, still preserve the visible question faithfully, but the schema stores option_a to option_d only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEEDS_DIAGRAM TRIGGER PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set needs_diagram = true when the question contains or depends on phrases like:
• "in the figure"
• "in the diagram"
• "the graph above"
• "the table below"
• "the chart above"
• "from the figure"
• "refer to the diagram"
• labelled points/angles/vertices tied to a drawing
• any geometric construction, circle theorem figure, tangent/chord/secant figure, bearing sketch, solid shape, or statistical chart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE1=base_conversion  BASE2=base_arithmetic  BASE3=fractional_base_conversion
FDAP1=fractions_decimals_operations  FDAP2=significant_figures_decimal_places  FDAP3=percentage_error  FDAP4=simple_interest  FDAP5=profit_loss_discount  FDAP6=ratio_proportion_rate  FDAP7=shares_vat
ILS1=laws_of_indices  ILS2=indices_equation  ILS3=standard_form  ILS4=log_laws_evaluation  ILS5=change_of_base  ILS6=indices_log_relationship  ILS7=surd_simplification  ILS8=surd_rationalization
SET1=set_types_notation  SET2=set_algebra  SET3=venn_diagram_cardinality
POLY1=change_of_subject  POLY2=polynomial_operations  POLY3=factorization  POLY4=roots_of_polynomial  POLY5=factor_remainder_theorem  POLY6=simultaneous_linear_quadratic  POLY7=polynomial_graph  POLY8=partial_fractions
VAR1=direct_variation  VAR2=inverse_variation  VAR3=joint_variation  VAR4=partial_variation  VAR5=percentage_change
INEQ1=linear_inequality  INEQ2=quadratic_inequality  INEQ3=graphical_inequality
PROG1=ap_nth_term  PROG2=ap_sum  PROG3=gp_nth_term  PROG4=gp_sum  PROG5=sum_to_infinity
BOP1=closure_commutative_associative_distributive  BOP2=identity_element  BOP3=inverse_element  BOP4=custom_binary_operation
MAT1=matrix_operations  MAT2=determinant  MAT3=inverse_of_2x2  MAT4=matrix_equation
EUG1=angles_lines  EUG2=triangle_properties  EUG3=quadrilateral_polygon_properties  EUG4=circle_theorems  EUG5=construction
MEN1=plane_perimeter_area  MEN2=arc_chord_sector_segment  MEN3=surface_area_volume  MEN4=composite_solids_figures  MEN5=earth_longitude_latitude
LOC1=locus_lines_curves
COORD1=midpoint_gradient  COORD2=distance_between_points  COORD3=parallel_perpendicular_lines  COORD4=equation_of_straight_line
TRIG1=trig_ratios  TRIG2=angles_of_elevation_depression  TRIG3=bearings  TRIG4=triangle_solution_area  TRIG5=sine_cosine_graph  TRIG6=sine_cosine_rule  TRIG7=special_angles
DIFF1=limit_of_function  DIFF2=differentiate_algebraic  DIFF3=differentiate_trig
APPDIFF1=rate_of_change  APPDIFF2=maxima_minima
INT1=integrate_algebraic  INT2=integrate_trig  INT3=area_under_curve
REPDATA1=frequency_table  REPDATA2=histogram_bar_pie  REPDATA3=graph_table_interpretation
LOCSTAT1=mean  LOCSTAT2=median  LOCSTAT3=mode  LOCSTAT4=cumulative_frequency_ogive
DISP1=range  DISP2=mean_deviation  DISP3=variance  DISP4=standard_deviation
PC1=linear_permutation  PC2=circular_permutation  PC3=repeated_objects  PC4=combination_selection
PROB1=coin_dice_basic  PROB2=addition_probability  PROB3=multiplication_probability  PROB4=probability_from_sets  PROB5=probability_from_tables_or_cards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY one of these when needs_diagram is true:
• triangle
• circle
• polygon
• solid
• coordinate
• statistical
• bearing
• shaded
• construction
• venn
• other

Guidance:
• triangle → triangle or trig triangle figure
• circle → circle theorems, chords, tangents, secants, cyclic quadrilateral
• polygon → quadrilateral, hexagon, rhombus, trapezium, general polygon
• solid → cube, cuboid, cone, cylinder, prism, pyramid, sphere, composite solids
• coordinate → cartesian graph, straight-line graph, plotted curve
• statistical → table, bar chart, histogram, pie chart, cumulative frequency graph
• bearing → navigation or compass bearing sketch
• shaded → shaded region or area figure
• construction → ruler-and-compass construction or locus construction
• venn → Venn diagram
• other → any visual not covered above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every question, explanation is REQUIRED and must:
• state the formula, theorem, identity, or rule used
• show the key substitution or logical step
• include the simplified reasoning to the answer
• mention units where relevant
• for geometry/trigonometry, name the theorem or ratio used
• for statistics/probability, state the counting or formula method used
• for calculus, state the derivative/integral rule used

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPICS — use ONLY these, pick the most specific match
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildTopicList()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "year": <number|null>,
  "subject": "Mathematics",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — state the formula/theorem/rule and show the key step. Never blank.>",
      "pattern_code": "<code|null>",
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<triangle|circle|polygon|solid|coordinate|statistical|bearing|shaded|construction|venn|other|null>",
      "diagram_description": "<precise description if needs_diagram is true, else null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": []
}
`