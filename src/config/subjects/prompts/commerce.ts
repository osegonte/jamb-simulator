// src/config/subjects/prompts/commerce.ts

import { COMMERCE_CONFIG } from '../commerce'

function buildTopicList(): string {
  return Object.entries(COMMERCE_CONFIG.topics).map(([topic, data]) => {
    const subs = (data as { subtopics: readonly string[] }).subtopics
    return `  ${topic} → ${subs.join(' | ')}`
  }).join('\n')
}

export const COMMERCE_PROMPT = `You are extracting ALL questions from a JAMB Commerce past paper PDF.
Return ONLY raw JSON — no markdown, no code fences, no commentary before or after the JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPER STRUCTURE — 50 QUESTIONS TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All 50 questions are standalone MCQs — there are NO passage groups like English
• Commerce papers often include balance sheets, invoices, bills of exchange, organizational charts, marketing diagrams, trade document snippets, and short shared business scenarios
• Some questions may say “Use the information below to answer questions X and Y”, but still extract EACH question as a separate standalone item
• Questions may appear in any topic order
• ALL go into the "standalone" array — "groups" must always be []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract ALL 50 questions — never stop early, never skip
2. correct_option: from answer key only, lowercase a/b/c/d. If not found set null — never guess
3. explanation: REQUIRED for every single question — never null, never empty string
4. needs_diagram: set true when the question references or depends on a table, balance sheet, invoice, business document, chart, organizational structure, marketing diagram, or any visual stimulus
5. diagram_type: only set when needs_diagram is true
6. diagram_description: precise description of what the diagram/document/table shows — used to recreate it
7. render_type:
   - "text"  → plain verbal commerce question
   - "latex" → calculations, financial ratios, discount expressions, capital calculations, percentages, symbolic notation
   - "image" → question depends on a visual table, chart, form, balance sheet, structure, or labelled diagram
8. Preserve the full wording of the question and options as printed
9. Use ONLY topics and subtopics from the topic list below
10. Choose the most specific matching pattern_code
11. If a short shared stem introduces several numbered questions, repeat enough context in each question_text so each extracted question stands on its own
12. For balance sheet, invoice, bill of exchange, discount, and document questions, preserve the key figures and labels exactly as printed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEEDS_DIAGRAM TRIGGER PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set needs_diagram = true when the question contains or depends on phrases like:
• "use the data below"
• "use the information below"
• "use the balance sheet below"
• "use the document below"
• "use the diagram below"
• "the chart above"
• "the structure above"
• "the branches indicate"
• any question that depends on a financial table, invoice, bill of exchange, organizational chart, or marketing diagram
• any question that cannot be answered correctly without seeing the visual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COM1=meaning_scope_of_commerce
COM2=characteristics_of_commerce
COM3=functions_of_commerce
COM4=evolution_of_commerce_in_nigeria
COM5=components_of_commerce

OCC1=meaning_importance_of_occupation
OCC2=types_of_occupation
OCC3=choice_of_occupation_factors
OCC4=industrial_commercial_service_occupation

PROD1=factors_of_production
PROD2=rewards_of_factors
PROD3=division_of_labour_specialization
PROD4=types_of_production
PROD5=utility_form_place_time_possession
PROD6=entrepreneurship_role
PROD7=integration_merger_production_chain

TRADE1=home_trade
TRADE2=retailing_types
TRADE3=retailer_functions
TRADE4=retailing_trends
TRADE5=wholesaling_types
TRADE6=wholesaler_functions
TRADE7=wholesaler_advantages_disadvantages
TRADE8=foreign_trade_basic_issues
TRADE9=balance_of_trade_payments
TRADE10=counter_trade_entrepot
TRADE11=foreign_trade_documents
TRADE12=barriers_to_international_trade
TRADE13=government_agencies_in_foreign_trade
TRADE14=terms_of_trade
TRADE15=mode_of_transport_trade_related
TRADE16=middlemen_channel_of_distribution

SALE1=purchase_sale_procedure_documents
SALE2=invoice_proforma_statement_indent
SALE3=bill_of_lading_consular_invoice_certificate_origin
SALE4=trade_discount
SALE5=quantity_discount
SALE6=cash_discount
SALE7=terms_of_payment
SALE8=cash_vs_credit
SALE9=credit_types_functions
SALE10=hire_purchase_credit_sale
SALE11=legal_tender_payment_methods
SALE12=documents_of_title

AID1=advertising_types_media
AID2=advertising_merits_demerits
AID3=banking_types_services
AID4=banking_challenges
AID5=communication_process_types
AID6=communication_barriers_trends
AID7=insurance_types
AID8=insurance_principles
AID9=insurance_terms
AID10=insurance_claim_indemnity_average
AID11=tourism_importance_agencies
AID12=tourism_challenges
AID13=transportation_modes_advantages
AID14=warehousing_types_functions
AID15=warehouse_siting
AID16=post_office_nipost_services
AID17=marine_insurance
AID18=banking_documents_cheque_statement_giro
AID19=ecommerce_ebanking_ebusiness

BU1=forms_of_business_units
BU2=features_of_business_units
BU3=sole_proprietorship
BU4=partnership
BU5=limited_liability_company
BU6=public_corporation
BU7=cooperative_society
BU8=registration_of_business
BU9=business_mergers
BU10=choice_of_business_unit
BU11=dissolution_vs_liquidation
BU12=merits_demerits_business_units
BU13=incorporation_effects
BU14=nationalization_privatization_commercialization_indigenization

FIN1=sources_of_finance
FIN2=types_of_capital
FIN3=authorized_issued_calledup_paidup_capital
FIN4=working_circulating_liquid_capital
FIN5=gross_profit_net_profit_turnover
FIN6=current_ratio_acid_test_ratio
FIN7=balance_sheet_interpretation
FIN8=problems_of_sourcing_finance
FIN9=gearing_equity_loan_finance
FIN10=bureau_de_change
FIN11=debentures_bonds_loans_mortgage
FIN12=share_valuation_face_par_nominal

ASSOC1=trade_association_functions
ASSOC2=manufacturers_association
ASSOC3=chamber_of_commerce_functions
ASSOC4=employers_association

MON1=origin_evolution_of_money
MON2=forms_of_money
MON3=qualities_of_money
MON4=functions_of_money

SE1=stock_exchange_importance_functions
SE2=types_of_securities
SE3=procedure_of_transactions
SE4=stock_exchange_speculation
SE5=second_tier_securities_market
SE6=jobbers_brokers_bulls_bears_stags
SE7=quoted_issued_registered_deferred_shares
SE8=primary_vs_secondary_market

MGT1=functions_of_management
MGT2=principles_of_management
MGT3=organizational_structure
MGT4=functional_areas_of_business
MGT5=business_resources
MGT6=delegation_authority_span_of_control
MGT7=staffing_recruitment_selection
MGT8=motivation_leadership_coordination_control
MGT9=planning_budgeting
MGT10=line_lineandstaff_functional_matrix
MGT11=departmentalization_inventory_control

MKT1=importance_functions_of_marketing
MKT2=marketing_concept
MKT3=marketing_mix
MKT4=market_segmentation
MKT5=public_relations_customer_service
MKT6=branding_packaging_labelling
MKT7=personal_selling
MKT8=sales_promotion_publicity
MKT9=pricing_policy
MKT10=consumer_orientation_market_research
MKT11=product_life_style_fad_fashion

LAW1=simple_contract_meaning_validity
LAW2=offer_acceptance_consideration_capacity_legality
LAW3=agency
LAW4=sale_of_goods_act
LAW5=hire_purchase_act
LAW6=contract_of_employment
LAW7=patent_trademark_copyright
LAW8=consumer_protection
LAW9=regulatory_agencies
LAW10=breach_performance_frustration
LAW11=ultra_vires
LAW12=merchantable_quality_title_goods

ICT1=computer_types_functions
ICT2=computer_terms_internet_email_lan
ICT3=computer_application_in_business
ICT4=merits_demerits_of_ict
ICT5=ict_challenges
ICT6=ecommerce_ebanking_ebusiness
ICT7=hardware_software_memory_debugging_languages

ENV1=business_environment_types
ENV2=social_responsibility
ENV3=safe_products_consumer_welfare
ENV4=types_of_pollution
ENV5=environmental_impact_on_business
ENV6=ecowas_niger_basin_lake_chad_institutions
ENV7=government_policy_business_environment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use ONLY one of these when needs_diagram is true:
• statistical
• structural
• apparatus
• coordinate
• other

Guidance:
• statistical → balance sheet, financial table, ratio table, invoice figures, discount table, sales/turnover data, account statement
• structural → organizational chart, marketing mix diagram, channel of distribution structure, business classification tree
• apparatus → business document form such as bill of exchange, cheque, invoice, shipping note, warehouse receipt, trade form
• coordinate → plotted graph with axes if any commerce data graph appears
• other → any commerce visual not covered above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every question, explanation is REQUIRED and must:
• state the commerce principle, business term, management idea, legal rule, financial relation, or trade concept involved
• explain why the correct option fits
• for finance/account-style questions, show the key calculation, ratio, discount step, or balance logic
• for trade document questions, identify the exact document and its function
• for business law questions, name the governing concept such as offer, acceptance, agency, consideration, contract, or hire purchase
• for management and marketing questions, name the principle or function being tested
• for diagram/document questions, refer directly to the table, chart, statement, structure, or document shown
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
  "subject": "Commerce",
  "standalone": [
    {
      "original_number": <number>,
      "question_text": "<full text>",
      "option_a": "<text>",
      "option_b": "<text>",
      "option_c": "<text|null>",
      "option_d": "<text|null>",
      "correct_option": "<a|b|c|d|null>",
      "explanation": "<REQUIRED — name the commerce/business/legal/financial principle and explain the key point. Never blank.>",
      "pattern_code": "<code|null>",
      "render_type": "<text|latex|image>",
      "needs_diagram": <true|false>,
      "diagram_type": "<statistical|structural|apparatus|coordinate|other|null>",
      "diagram_description": "<precise description if needs_diagram is true, else null>",
      "topic": "<from topic list>",
      "subtopic": "<from subtopic list>"
    }
  ],
  "groups": []
}
`