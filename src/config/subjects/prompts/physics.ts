// src/config/subjects/prompts/physics.ts

import { PHYSICS_CONFIG } from '../physics'

function buildTopicList(): string {
  return Object.entries(PHYSICS_CONFIG.topics).map(([topic, data]) => {
    const subs = (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const PHYSICS_PROMPT = `You are extracting ALL questions from a JAMB Physics past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 50 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All 50 questions are standalone MCQs — there are NO passage groups like English
• Physics papers often include graphs, circuit diagrams, optical/ray diagrams, magnetic field diagrams, manometers, springs, pulleys, waves, thermometers, and labelled apparatus
• Some questions may refer to a shared figure or diagram, but each question must still be extracted as a separate standalone item
• Questions may appear in any topic order
• ALL go into the "standalone" array — "groups" must always be []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 50 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
4. needs_diagram: set true when the question references or depends on a figure, graph, circuit, ray diagram, field pattern, apparatus, chart, table, or any visual stimulus
5. diagram_type: only set when needs_diagram is true
6. diagram_description: precise description of what the diagram shows — used to recreate it
7. render_type:
   - "text"  → plain verbal physics question
   - "latex" → equations, symbols, units, formulae, vectors, subscripts, superscripts, scientific notation, or mathematical expressions
   - "image" → question depends on a visual figure, graph, chart, table, circuit, apparatus, or labelled diagram
8. Preserve the full wording of the question and options as printed
9. Use ONLY topics and subtopics from the topic list below
10. Choose the most specific matching pattern_code
11. If a question refers to Fig. 1, Fig. 2, “diagram above”, “graph below”, or similar, include enough context in question_text for that item to stand alone
12. If multiple consecutive questions use the same figure, repeat the same diagram metadata for each dependent question

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEEDS_DIAGRAM TRIGGER PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set needs_diagram = true when the question contains or depends on phrases like:
• "the figure above"
• "the diagram above"
• "the graph shows"
• "from Fig. 1"
• "use the circuit shown"
• "the ray diagram"
• "the apparatus shown"
• "the field pattern"
• "the diagram illustrates"
• labelled points, resistors, mirrors, poles, nodes, vertices, axes, or components
• any question that cannot be answered correctly without seeing the visual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEAS1=length_area_volume_measurement
MEAS2=vernier_calipers_micrometer
MEAS3=mass_time_measurement
MEAS4=derived_quantities_units_dimensions
MEAS5=errors_accuracy_significant_figures
MEAS6=standard_form
MEAS7=distance_displacement_position
MEAS8=graphical_measurement_interpretation

SV1=scalar_vector_identification
SV2=vector_resolution_resultant
SV3=relative_velocity
SV4=graphical_vector_solution

MOT1=types_of_motion
MOT2=speed_velocity_acceleration
MOT3=equations_of_uniform_acceleration
MOT4=motion_under_gravity
MOT5=distance_time_velocity_time_graph
MOT6=projectile_motion
MOT7=newtons_laws
MOT8=impulse_momentum
MOT9=conservation_of_linear_momentum
MOT10=circular_motion
MOT11=angular_velocity_acceleration
MOT12=centripetal_force
MOT13=simple_harmonic_motion
MOT14=forced_vibration_resonance
MOT15=free_body_dynamics

GRAV1=universal_gravitation
GRAV2=gravitational_potential_field
GRAV3=variation_of_g
GRAV4=mass_vs_weight
GRAV5=escape_velocity_orbit_weightlessness

EQ1=equilibrium_of_particles
EQ2=coplanar_forces
EQ3=triangle_polygon_lami
EQ4=principle_of_moments
EQ5=couple_torque
EQ6=resultant_equilibrant
EQ7=centre_of_gravity_stability

WEP1=work_energy_power
WEP2=conservation_of_energy
WEP3=force_distance_curve
WEP4=efficiency_mechanical_power
WEP5=energy_conversion_system

SOC1=energy_sources_uses
SOC2=renewable_nonrenewable
SOC3=energy_environmental_impact
SOC4=energy_conversion_devices
SOC5=dams_energy_production
SOC6=nuclear_energy
SOC7=solar_energy

FRIC1=static_dynamic_friction
FRIC2=coefficient_of_friction
FRIC3=advantages_disadvantages_of_friction
FRIC4=viscosity_terminal_velocity
FRIC5=stokes_law

MACH1=simple_machines
MACH2=mechanical_advantage_velocity_ratio_efficiency
MACH3=pulley_lever_inclined_plane_wheel_axle_screw_jack
MACH4=hydraulic_press

ELAS1=hookes_law
ELAS2=force_extension_curve
ELAS3=youngs_modulus
ELAS4=spring_balance
ELAS5=elastic_potential_energy

PRES1=atmospheric_pressure
PRES2=barometer_manometer_altimeter
PRES3=pressure_in_liquids
PRES4=pascals_principle
PRES5=pressure_depth_density

REST1=density_relative_density
REST2=upthrust_archimedes
REST3=law_of_flotation
REST4=hydrometer
REST5=floating_and_sinking

TEMP1=temperature_scales_conversion
TEMP2=thermometric_properties
TEMP3=calibration_of_thermometers
TEMP4=types_of_thermometers

THERM1=linear_area_volume_expansion
THERM2=real_apparent_expansion
THERM3=anomalous_expansion_of_water
THERM4=applications_of_expansion

GAS1=boyles_law
GAS2=charles_law
GAS3=pressure_law
GAS4=general_gas_equation
GAS5=ideal_gas_equation
GAS6=real_gas_van_der_waals

HEAT1=heat_capacity_specific_heat_capacity
HEAT2=method_of_mixtures
HEAT3=electrical_heating_calorimetry
HEAT4=newtons_law_of_cooling

STATE1=latent_heat_fusion_vaporization
STATE2=melting_evaporation_boiling
STATE3=effect_of_pressure_on_boiling_melting
STATE4=applications_of_change_of_state

VAP1=saturated_unsaturated_vapour
VAP2=saturated_vapour_pressure
VAP3=dew_point_humidity_relative_humidity
VAP4=hygrometer
VAP5=weather_formation_dew_mist_fog_cloud_rain

MAT1=molecular_nature_of_matter
MAT2=brownian_motion_diffusion
MAT3=surface_tension_capillarity
MAT4=adhesion_cohesion_angle_of_contact
MAT5=kinetic_theory_of_gases

HT1=conduction
HT2=convection
HT3=radiation
HT4=thermal_conductivity_gradient_flux
HT5=thermos_flask
HT6=land_sea_breeze
HT7=engine_heat_transfer_application

WAV1=wave_motion_basic
WAV2=frequency_wavelength_speed
WAV3=phase_wave_number_progressive_wave
WAV4=types_of_waves
WAV5=stationary_vs_progressive_waves
WAV6=reflection_refraction_diffraction_polarization
WAV7=interference_superposition
WAV8=beats
WAV9=doppler_effect

SND1=propagation_of_sound
SND2=speed_of_sound_echo_reverberation
SND3=noise_musical_note
SND4=pitch_quality_intensity_loudness
SND5=harmonics_overtones
SND6=resonance_air_columns
SND7=open_closed_pipe_frequency

LGT1=sources_of_light
LGT2=shadows_eclipse_pin_hole_camera
LGT3=plane_mirror_reflection
LGT4=curved_mirrors_mirror_formula
LGT5=linear_angular_magnification
LGT6=refraction_snells_law
LGT7=real_apparent_depth_lateral_displacement
LGT8=critical_angle_total_internal_reflection
LGT9=prism_minimum_deviation
LGT10=lens_formula_magnification
LGT11=optical_instruments
LGT12=vision_defects_correction
LGT13=dispersion_spectrum_colours_filters
LGT14=electromagnetic_spectrum

EST1=charging_by_friction_contact_induction
EST2=electroscope
EST3=coulombs_law
EST4=electric_field_intensity_potential
EST5=lightning_discharge

CAP1=parallel_plate_capacitor
CAP2=capacitance_factors
CAP3=capacitors_series_parallel
CAP4=energy_stored_in_capacitor

CELL1=simple_voltaic_cell
CELL2=daniel_leclanche_accumulator
CELL3=arrangement_of_cells
CELL4=internal_resistance_efficiency

CUR1=emf_pd_current_internal_resistance
CUR2=ohms_law_resistivity_conductivity
CUR3=metre_bridge_potentiometer
CUR4=resistors_series_parallel_network
CUR5=kirchhoffs_laws
CUR6=electrical_energy_power_cost
CUR7=house_wiring_fuse_heating_effect

MAG1=natural_artificial_magnets
MAG2=magnetic_field_patterns
MAG3=earths_magnetic_field
MAG4=magnetic_flux_density_dip_declination
MAG5=navigation_magnetic_elements

FOR1=force_on_current_carrying_conductor
FOR2=parallel_current_attraction_repulsion
FOR3=force_on_moving_charge
FOR4=dc_motor
FOR5=electromagnets
FOR6=galvanometer_ammeter_voltmeter
FOR7=moving_coil_moving_iron_instruments

EMI1=faradays_laws
EMI2=lenzs_law
EMI3=ac_dc_generator
EMI4=transformer
EMI5=induction_coil
EMI6=eddy_current
EMI7=inductance

AC1=peak_rms_values
AC2=reactance_impedance
AC3=rlc_circuit_phase_power_factor
AC4=resonance_frequency
AC5=ac_vector_diagram

ELEC1=electrolytes_non_electrolytes
ELEC2=electrolysis_faradays_laws
ELEC3=electroplating_and_applications
ELEC4=conduction_through_gases

MOD1=atomic_models_structure
MOD2=energy_levels_spectra
MOD3=thermionic_emission
MOD4=photoelectric_effect
MOD5=einsteins_equation_stopping_potential
MOD6=x_rays
MOD7=radioactivity_alpha_beta_gamma
MOD8=half_life_decay_constant
MOD9=fission_fusion_binding_energy_mass_defect
MOD10=wave_particle_duality_uncertainty

ELECDEV1=conductors_semiconductors_insulators
ELECDEV2=intrinsic_extrinsic_semiconductors
ELECDEV3=diodes_rectification
ELECDEV4=transistors_amplification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY one of these when needs_diagram is true:
• circuit
• ray
• wave
• force
• motion
• apparatus
• coordinate
• statistical
• other

Guidance:
• circuit → electrical circuit, resistor network, capacitor network, galvanometer, cell arrangement, transformer, meter bridge
• ray → mirrors, lenses, prism, optical instruments, reflection/refraction path
• wave → stationary wave, resonance tube, ripple shape, waveform, sound/air column diagram
• force → free-body diagram, Lami’s theorem figure, pulley, lever, equilibrium sketch, magnetic force direction
• motion → velocity-time graph, distance-time graph, projectile, circular motion, pendulum, SHM, displacement graph
• apparatus → barometer, manometer, calorimeter, thermometer, hygrometer, spring balance, sonometer, electrolysis setup
• coordinate → plotted graph with axes where values/slopes matter
• statistical → table, chart, or plotted data summary
• other → any physics visual not covered above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every question, explanation is REQUIRED and must:
• state the physical law, principle, formula, or rule involved
• explain why the correct option fits
• for calculations, show the key substitution, rearrangement, and unit
• for motion/mechanics, mention the relevant equation or force principle
• for heat/thermodynamics, mention the heat law, gas law, or thermal relation involved
• for optics, mention reflection/refraction, mirror/lens formula, or refractive principle
• for electricity/magnetism, identify the governing law or field/current relation
• for modern physics, name the atomic, nuclear, or photoelectric principle involved
• for diagram questions, refer directly to the graph, circuit, figure, ray path, or labelled component shown
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
  "subject": "Physics",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — name the physical law/formula/principle and explain the key point. Never blank.>",
      "pattern_code": "<code|null>",
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<circuit|ray|wave|force|motion|apparatus|coordinate|statistical|other|null>",
      "diagram_description": "<precise description if needs_diagram is true, else null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": []
}
`