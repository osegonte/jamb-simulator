// src/components/admin/PDFImport.tsx
import { useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { ENGLISH_PROMPT, MATHS_PROMPT, genericPrompt } from '../../config/subjects/prompts'
import { isMathsSubject, isEnglishSubject, getPrefix } from '../../config/manifest'

interface Props { subjectId: string; subjectName: string; onDone: () => void }

interface ExtractedQ {
  original_number?: number | null; section?: string
  question_text: string; option_a: string; option_b: string
  option_c?: string | null; option_d?: string | null
  correct_option: 'a'|'b'|'c'|'d'|null; explanation?: string | null
  pattern_code?: string | null; topic: string; subtopic: string
  render_type?: 'text'|'latex'|'image'; needs_diagram?: boolean
  diagram_description?: string | null; position?: number | null
}
interface ExtractedGroup { type: 'comprehension'|'summary'|'cloze'|'reading_text'; passage_text: string; questions: ExtractedQ[] }
interface Extracted { year: number|null; subject: string; standalone: ExtractedQ[]; groups: ExtractedGroup[] }

// ── DB helpers ────────────────────────────────────────────────────────────────
async function upsertTopic(subjectId: string, name: string) {
  if (!name?.trim()) return null
  const { data: ex } = await supabaseAdmin.from('topics').select('id').eq('subject_id', subjectId).ilike('name', name.trim()).maybeSingle()
  if (ex) return (ex as {id:string}).id
  const { data } = await supabaseAdmin.from('topics').insert({ subject_id: subjectId, name: name.trim() }).select('id').single()
  return (data as {id:string}|null)?.id || null
}
async function upsertSubtopic(topicId: string, subjectId: string, name: string) {
  if (!name?.trim() || !topicId) return null
  const { data: ex } = await supabaseAdmin.from('subtopics').select('id').eq('topic_id', topicId).ilike('name', name.trim()).maybeSingle()
  if (ex) return (ex as {id:string}).id
  const { data } = await supabaseAdmin.from('subtopics').insert({ topic_id: topicId, subject_id: subjectId, name: name.trim() }).select('id').single()
  return (data as {id:string}|null)?.id || null
}
async function nextQId(subjectId: string, prefix: string) {
  const { data } = await supabaseAdmin.from('questions').select('question_id').eq('subject_id', subjectId).not('question_id','is',null)
  const nums = (data||[]).map((r:{question_id:string})=>r.question_id).filter((id:string)=>id?.startsWith(prefix+'_')).map((id:string)=>parseInt(id.split('_').pop()||'0',10)).filter((n:number)=>!isNaN(n))
  return `${prefix}_${String(nums.length ? Math.max(...nums)+1 : 1).padStart(3,'0')}`
}
function groupId(type: string, prefix: string, year: number|null, existing: string[]) {
  const code = ({comprehension:'COMP',summary:'SUM',cloze:'CLOZE',reading_text:'READ'} as Record<string,string>)[type]||'GRP'
  const base = `${code}_${prefix}${year?`_${year}`:''}`
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') { const c=`${base}_${l}`; if (!existing.includes(c)) return c }
  return `${base}_${Date.now()}`
}

// ── Partial recovery ──────────────────────────────────────────────────────────
function recover(raw: string, subject: string): Extracted {
  const r: Extracted = { year: null, subject, standalone: [], groups: [] }
  const ym = raw.match(/"year"\s*:\s*(\d{4})/); if (ym) r.year = parseInt(ym[1])
  const objs = (str: string) => { const out:string[]=[]; let d=0,s=-1; for(let i=0;i<str.length;i++){if(str[i]==='{'){if(!d)s=i;d++}else if(str[i]==='}'){d--;if(!d&&s!==-1){out.push(str.slice(s,i+1));s=-1}}} return out }
  const sa = raw.match(/"standalone"\s*:\s*\[([\s\S]*?)(?=\]\s*,\s*"groups"|\]\s*}|$)/)
  if (sa) for (const o of objs(sa[1])) { try { const q=JSON.parse(o); if(q.question_text) r.standalone.push(q) } catch{} }
  const gr = raw.match(/"groups"\s*:\s*\[([\s\S]*?)(?=\]\s*}|$)/)
  if (gr) for (const o of objs(gr[1])) { try { const g=JSON.parse(o); if(g.passage_text&&Array.isArray(g.questions)) r.groups.push(g) } catch{} }
  return r
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PDFImport({ subjectId, subjectName, onDone }: Props) {
  const mathsMode = isMathsSubject(subjectName)
  const prefix = getPrefix(subjectName)
  const prompt = isEnglishSubject(subjectName) ? ENGLISH_PROMPT : mathsMode ? MATHS_PROMPT : genericPrompt(subjectName)

  const [file, setFile] = useState<File|null>(null)
  const [year, setYear] = useState('')
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState<Extracted|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [inserting, setInserting] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<{questions:number;groups:number;diagrams:number}|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => { setFile(f); setExtracted(null); setError(null); setResult(null); const m=f.name.match(/20\d{2}/); if(m) setYear(m[0]) }

  const extract = async () => {
    if (!file) return
    setProcessing(true); setError(null); setExtracted(null)
    try {
      const base64 = await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(',')[1]); r.onerror=()=>rej(new Error('Read failed')); r.readAsDataURL(file) })
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key':import.meta.env.VITE_ANTHROPIC_API_KEY||'', 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:32000, system:prompt,
          messages:[{role:'user',content:[{type:'document',source:{type:'base64',media_type:'application/pdf',data:base64}},{type:'text',text:year?`JAMB ${subjectName} ${year}. Extract ALL questions. Return complete JSON.`:`JAMB ${subjectName}. Extract ALL questions. Return complete JSON.`}]}] })
      })
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error((e as{error?:{message?:string}})?.error?.message||`API ${res.status}`) }
      const data = await res.json()
      const text = data.content?.map((c:{type:string;text?:string})=>c.type==='text'?c.text:'').join('')||''
      const cleaned = text.replace(/```json|```/g,'').trim()
      let parsed: Extracted
      try { parsed = JSON.parse(cleaned) } catch {
        parsed = recover(cleaned, subjectName)
        if (!parsed.standalone.length && !parsed.groups.length) throw new Error(data.stop_reason==='max_tokens'?'Response cut off — try again or split upload.':'Invalid JSON — check PDF quality.')
        setError(`⚠ Truncated — got ${parsed.standalone.length} questions before cutoff.`)
      }
      if (year) parsed.year = parseInt(year)
      setExtracted(parsed)
    } catch(e) { setError(e instanceof Error ? e.message : 'Unknown error') }
    finally { setProcessing(false) }
  }

  const insert = async () => {
    if (!extracted) return
    setInserting(true); let qCount=0, gCount=0, dCount=0
    for (let i=0; i<extracted.standalone.length; i++) {
      const q = extracted.standalone[i]; setProgress(`Question ${i+1} / ${extracted.standalone.length}`)
      const topicId = await upsertTopic(subjectId, q.topic)
      const subtopicId = topicId && q.subtopic ? await upsertSubtopic(topicId, subjectId, q.subtopic) : null
      const qId = q.original_number ? `${prefix}_${extracted.year||'XX'}_${String(q.original_number).padStart(3,'0')}` : await nextQId(subjectId, prefix)
      let rt = q.render_type||'text'
      if (mathsMode && rt==='text') { if(/\$|\\frac|\\sqrt|\\sin|\\cos/.test(q.question_text+(q.option_a||'')+(q.option_b||''))) rt='latex'; else if(q.needs_diagram) rt='image' }
      if (q.needs_diagram) dCount++
      const {error:err} = await supabaseAdmin.from('questions').insert({ subject_id:subjectId, topic_id:topicId, subtopic_id:subtopicId, question_id:qId, question_text:q.question_text, option_a:q.option_a||'', option_b:q.option_b||'', option_c:q.option_c||null, option_d:q.option_d||null, correct_option:q.correct_option||null, explanation:q.explanation||null, difficulty_level:'medium', render_type:rt, section:q.section||null, question_type:'mcq', pattern_code:q.pattern_code||null, year:extracted.year, status:'floating', passage_id:null, diagram_description:q.diagram_description||null })
      if (!err) qCount++
    }
    if (extracted.groups.length > 0) {
      const {data:ep} = await supabaseAdmin.from('passages').select('group_id').eq('subject_id',subjectId)
      const eIds = (ep||[]).map((p:{group_id:string})=>p.group_id)
      for (let gi=0; gi<extracted.groups.length; gi++) {
        const g = extracted.groups[gi]; setProgress(`Passage ${gi+1} / ${extracted.groups.length}`)
        const gId = groupId(g.type, prefix, extracted.year, eIds); eIds.push(gId)
        const {data:pd,error:pe} = await supabaseAdmin.from('passages').insert({ group_id:gId, subject_id:subjectId, passage_type:g.type, passage_text:g.passage_text, passage_image_url:null, year:extracted.year }).select('id').single()
        if (pe||!pd) continue; gCount++
        for (let qi=0; qi<g.questions.length; qi++) {
          const q=g.questions[qi]; const topicId=await upsertTopic(subjectId,q.topic); const subtopicId=topicId&&q.subtopic?await upsertSubtopic(topicId,subjectId,q.subtopic):null; const qId=await nextQId(subjectId,prefix)
          await supabaseAdmin.from('questions').insert({ subject_id:subjectId, topic_id:topicId, subtopic_id:subtopicId, question_id:qId, question_text:q.question_text, option_a:q.option_a||'', option_b:q.option_b||'', option_c:q.option_c||null, option_d:q.option_d||null, correct_option:q.correct_option||null, explanation:q.explanation||null, difficulty_level:'medium', render_type:'text', section:g.type, question_type:g.type==='cloze'?'cloze':'passage', year:extracted.year, status:'floating', passage_id:(pd as {id:string}).id, position_in_passage:q.position??qi+1 })
          qCount++
        }
      }
    }
    setProgress(''); setInserting(false)
    setResult({questions:qCount,groups:gCount,diagrams:dCount})
    setExtracted(null); setFile(null); setYear(''); onDone()
  }

  const totalQ = extracted ? extracted.standalone.length + extracted.groups.reduce((s,g)=>s+g.questions.length,0) : 0
  const diagrams = extracted?.standalone.filter(q=>q.needs_diagram).length??0
  const GC: Record<string,string> = { comprehension:'bg-purple-100 text-purple-700', summary:'bg-teal-100 text-teal-700', cloze:'bg-blue-100 text-blue-700', reading_text:'bg-amber-100 text-amber-700' }
  const SC: Record<string,string> = { sentence_interpretation:'bg-purple-100 text-purple-700', antonym:'bg-red-100 text-red-700', synonym:'bg-blue-100 text-blue-700', grammar:'bg-green-100 text-green-700', vowel:'bg-yellow-100 text-yellow-700', consonant:'bg-yellow-100 text-yellow-700', rhyme:'bg-orange-100 text-orange-700', word_stress:'bg-orange-100 text-orange-700', emphatic_stress:'bg-orange-100 text-orange-700' }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-xs font-black tracking-widest text-gray-500 uppercase">AI PDF Import</p>
          {mathsMode && <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700">MATHS MODE</span>}
        </div>
        <p className="text-xs text-gray-400">Topics tagged from official JAMB syllabus. All questions land in Floating Queue.</p>
      </div>

      <div className="bg-white border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Year</label>
          <input type="text" className="w-32 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" placeholder="2020" value={year} onChange={e=>setYear(e.target.value)} />
        </div>
        <div className="border-2 border-dashed border-gray-200 px-6 py-10 text-center cursor-pointer hover:border-gray-400 transition-colors" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f)}}>
          {file ? <div><p className="text-sm font-black">{file.name}</p><p className="text-xs text-gray-400 mt-1">{(file.size/1024).toFixed(0)} KB · click to change</p></div> : <><p className="text-sm font-black text-gray-700">Drop PDF or click to upload</p><p className="text-xs text-gray-400 mt-1">One year per upload</p></>}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f)}} />
        </div>
        <button onClick={extract} disabled={!file||processing} className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {processing ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Reading PDF...</span> : 'Extract Questions →'}
        </button>
      </div>

      {error && <div className={`border px-5 py-3 ${error.startsWith('⚠')?'bg-orange-50 border-orange-200':'bg-red-50 border-red-200'}`}><p className={`text-xs font-mono ${error.startsWith('⚠')?'text-orange-600':'text-red-600'}`}>{error}</p></div>}

      {result && (
        <div className="bg-green-50 border border-green-200 px-5 py-3 flex items-center gap-4 flex-wrap text-sm">
          <span><span className="font-black text-green-700">{result.questions}</span> <span className="text-gray-500">inserted</span></span>
          {result.groups>0 && <span><span className="font-black text-purple-700">{result.groups}</span> <span className="text-gray-500">passages</span></span>}
          {result.diagrams>0 && <span><span className="font-black text-blue-600">{result.diagrams}</span> <span className="text-gray-500">diagrams flagged</span></span>}
          <span className="text-xs text-gray-400 ml-auto">→ Floating Queue</span>
        </div>
      )}

      {extracted && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 px-5 py-4 flex gap-6 flex-wrap text-sm">
            <div><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total</p><p className="text-2xl font-black">{totalQ}</p></div>
            {extracted.year && <><div className="w-px bg-gray-100"/><div><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Year</p><p className="text-xl font-black">{extracted.year}</p></div></>}
            {diagrams>0 && <><div className="w-px bg-gray-100"/><div><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Diagrams</p><p className="text-xl font-black text-blue-600">{diagrams}</p></div></>}
          </div>

          {extracted.standalone.length>0 && (
            <div className="bg-white border border-gray-200">
              <p className="px-5 py-3 text-xs font-black tracking-widest text-gray-500 uppercase border-b border-gray-100">Questions — {extracted.standalone.length}</p>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {extracted.standalone.map((q,i)=>(
                  <div key={i} className="px-5 py-2 flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-300 w-5 flex-shrink-0">{q.original_number??i+1}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {q.section && <span className={`text-xs font-bold px-1.5 py-0.5 flex-shrink-0 ${SC[q.section]||'bg-gray-100 text-gray-500'}`}>{q.section.replace('_',' ')}</span>}
                      {q.needs_diagram && <span className="text-xs flex-shrink-0">📐</span>}
                      <span className="text-xs text-gray-600 truncate">{q.question_text}</span>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${q.correct_option?'text-gray-400':'text-red-400'}`}>{q.correct_option?`→${q.correct_option.toUpperCase()}`:'?'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extracted.groups.length>0 && (
            <div className="bg-white border border-gray-200">
              <p className="px-5 py-3 text-xs font-black tracking-widest text-gray-500 uppercase border-b border-gray-100">Passages — {extracted.groups.length}</p>
              <div className="divide-y divide-gray-100">
                {extracted.groups.map((g,i)=>(
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 flex-shrink-0 ${GC[g.type]||'bg-gray-100 text-gray-600'}`}>{g.type.replace('_',' ').toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{g.questions.length} questions</span>
                    <span className="text-xs text-gray-500 truncate flex-1">{g.passage_text.slice(0,80)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-400 mb-3">All {totalQ} questions insert as <span className="font-bold text-yellow-600">floating</span>.</p>
            {inserting && <p className="text-xs font-mono text-gray-400 mb-3 animate-pulse">{progress}</p>}
            <button onClick={insert} disabled={inserting} className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {inserting ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Inserting...</span> : `Insert All ${totalQ} → Floating Queue`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}