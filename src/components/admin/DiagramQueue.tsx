// src/components/admin/DiagramQueue.tsx
// Handles diagram approval for both questions and passage/group-level diagrams.
// Shows only unresolved items: status = 'pending' | 'auto_generated' | 'manual_uploaded'
// Resolution flow: pending → (auto_generated | manual_uploaded) → approved | skipped

import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin } from '../../lib/supabase'

interface DiagramItem {
  kind: 'question' | 'passage'
  id: string
  label: string        // question_id or group_id
  preview: string      // question_text or passage_text snippet
  diagram_description: string | null
  diagram_type: string | null
  diagram_status: string
  diagram_url: string | null
  subject_id: string
}

interface Props {
  subjectId: string
}

// Types that Claude can reasonably auto-generate as clean SVGs
const AUTO_GENERATABLE = ['triangle', 'circle', 'polygon', 'coordinate', 'venn', 'shaded', 'construction']

const STATUS_LABEL: Record<string, string> = {
  pending:         'Pending',
  auto_generated:  'Generated — needs approval',
  manual_uploaded: 'Uploaded — needs approval',
}

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-red-50 text-red-600 border-red-200',
  auto_generated:  'bg-amber-50 text-amber-600 border-amber-200',
  manual_uploaded: 'bg-blue-50 text-blue-600 border-blue-200',
}

const TYPE_COLOR: Record<string, string> = {
  triangle:     'bg-purple-100 text-purple-700',
  circle:       'bg-blue-100 text-blue-700',
  polygon:      'bg-indigo-100 text-indigo-700',
  solid:        'bg-orange-100 text-orange-700',
  coordinate:   'bg-green-100 text-green-700',
  statistical:  'bg-teal-100 text-teal-700',
  bearing:      'bg-cyan-100 text-cyan-700',
  shaded:       'bg-pink-100 text-pink-700',
  construction: 'bg-yellow-100 text-yellow-700',
  venn:         'bg-rose-100 text-rose-700',
  other:        'bg-gray-100 text-gray-600',
}

export default function DiagramQueue({ subjectId }: Props) {
  const [items, setItems]       = useState<DiagramItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<DiagramItem | null>(null)

  const [generating, setGenerating]     = useState(false)
  const [svgPreview, setSvgPreview]     = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [saving, setSaving]             = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const UNRESOLVED = ['pending', 'auto_generated', 'manual_uploaded']

    const [qRes, pRes] = await Promise.all([
      supabaseAdmin
        .from('questions')
        .select('id, question_id, question_text, diagram_description, diagram_type, diagram_status, diagram_url, subject_id')
        .eq('subject_id', subjectId)
        .eq('needs_diagram', true)
        .in('diagram_status', UNRESOLVED)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('passages')
        .select('id, group_id, passage_text, diagram_description, diagram_type, diagram_status, diagram_url, subject_id')
        .eq('subject_id', subjectId)
        .eq('needs_diagram', true)
        .in('diagram_status', UNRESOLVED)
        .order('created_at', { ascending: false }),
    ])

    const questionItems: DiagramItem[] = (qRes.data || []).map(q => ({
      kind:                'question',
      id:                  q.id,
      label:               q.question_id || q.id.slice(0, 8),
      preview:             q.question_text,
      diagram_description: q.diagram_description,
      diagram_type:        q.diagram_type,
      diagram_status:      q.diagram_status,
      diagram_url:         q.diagram_url,
      subject_id:          q.subject_id,
    }))

    const passageItems: DiagramItem[] = (pRes.data || []).map(p => ({
      kind:                'passage',
      id:                  p.id,
      label:               p.group_id || p.id.slice(0, 8),
      preview:             (p.passage_text || '').slice(0, 200) + ((p.passage_text?.length || 0) > 200 ? '…' : ''),
      diagram_description: p.diagram_description,
      diagram_type:        p.diagram_type,
      diagram_status:      p.diagram_status,
      diagram_url:         p.diagram_url,
      subject_id:          p.subject_id,
    }))

    const all = [...passageItems, ...questionItems]
    setItems(all)
    setSelected(prev => prev ? (all.find(i => i.id === prev.id) || null) : null)
    setLoading(false)
  }, [subjectId])

  useEffect(() => { load() }, [load])

  // ── Auto-generate SVG via Claude ──────────────────────────────────────────
  const handleAutoGenerate = async () => {
    if (!selected?.diagram_description) return
    setGenerating(true)
    setSvgPreview(null)
    setGenerateError(null)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Generate an SVG diagram for this JAMB mathematics question.

Description: ${selected.diagram_description}
Diagram type: ${selected.diagram_type}

Rules:
- Return ONLY the raw SVG element, nothing else — no explanation, no markdown, no code fences
- viewBox must be exactly "0 0 400 300"
- width="400" height="300"
- Clean black strokes on white background
- Label all points, angles, and lengths mentioned in the description
- font-family="Arial" font-size="13"
- stroke-width="1.5" for main lines, "1" for construction/helper lines
- No fills unless shading is required by the diagram type`
          }]
        })
      })

      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || ''
      const match = text.match(/<svg[\s\S]*<\/svg>/)
      if (match) {
        setSvgPreview(match[0])
      } else {
        setGenerateError('Claude did not return a valid SVG. Try manual upload instead.')
      }
    } catch {
      setGenerateError('Generation failed. Check your connection and try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Accept generated SVG → upload to storage ──────────────────────────────
  const handleAcceptGenerated = async () => {
    if (!selected || !svgPreview) return
    setSaving(true)
    const blob = new Blob([svgPreview], { type: 'image/svg+xml' })
    const path = `${subjectId}/${selected.kind}s/${selected.id}.svg`

    const { error: upErr } = await supabaseAdmin.storage
      .from('diagrams').upload(path, blob, { upsert: true })
    if (upErr) { setSaving(false); return }

    const { data: urlData } = supabaseAdmin.storage.from('diagrams').getPublicUrl(path)
    await updateItem(selected, { diagram_url: urlData.publicUrl, diagram_status: 'auto_generated' })
    setSvgPreview(null)
    setSaving(false)
  }

  // ── Manual file upload ────────────────────────────────────────────────────
  const handleManualUpload = async (file: File) => {
    if (!selected) return
    setUploading(true)
    const ext  = file.name.split('.').pop() || 'png'
    const path = `${subjectId}/${selected.kind}s/${selected.id}.${ext}`

    const { error: upErr } = await supabaseAdmin.storage
      .from('diagrams').upload(path, file, { upsert: true })
    if (upErr) { setUploading(false); return }

    const { data: urlData } = supabaseAdmin.storage.from('diagrams').getPublicUrl(path)
    await updateItem(selected, { diagram_url: urlData.publicUrl, diagram_status: 'manual_uploaded' })
    setUploading(false)
  }

  // ── Approve (diagram exists, mark live) ───────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return
    setSaving(true)
    await updateItem(selected, { diagram_status: 'approved' })
    setSaving(false)
  }

  // ── Skip ──────────────────────────────────────────────────────────────────
  const handleSkip = async () => {
    if (!selected) return
    setSaving(true)
    await updateItem(selected, { diagram_status: 'skipped' })
    setSaving(false)
  }

  // ── Shared DB update ──────────────────────────────────────────────────────
  const updateItem = async (item: DiagramItem, updates: Record<string, unknown>) => {
    const table = item.kind === 'question' ? 'questions' : 'passages'
    await supabaseAdmin.from(table).update(updates).eq('id', item.id)
    await load()
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 px-6 py-20 text-center">
        <p className="text-2xl font-black text-green-600 mb-2">✓ All diagrams resolved</p>
        <p className="text-sm text-gray-400">No pending diagrams for this subject.</p>
      </div>
    )
  }

  const canAutoGenerate    = selected && AUTO_GENERATABLE.includes(selected.diagram_type || '')
  const hasExistingDiagram = selected && ['auto_generated', 'manual_uploaded'].includes(selected.diagram_status)

  return (
    <div className="flex gap-4 items-start">

      {/* ── Left: queue list ─────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-1">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
          {loading ? 'Loading...' : `${items.length} unresolved`}
        </p>

        {items.map(item => (
          <button
            key={item.id}
            onClick={() => { setSelected(item); setSvgPreview(null); setGenerateError(null) }}
            className={`w-full text-left px-4 py-3 border transition-colors ${
              selected?.id === item.id
                ? 'border-black bg-white'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {item.kind === 'passage' ? '📄 Group' : '❓ Q'}
              </span>
              {item.diagram_type && (
                <span className={`text-xs font-bold px-1.5 py-0.5 capitalize ${TYPE_COLOR[item.diagram_type] || TYPE_COLOR.other}`}>
                  {item.diagram_type}
                </span>
              )}
              <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 border ${STATUS_COLOR[item.diagram_status] || ''}`}>
                {item.diagram_status === 'pending' ? '🔴' : '🟡'}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-500 mb-1">{item.label}</p>
            <p className="text-xs text-gray-700 leading-relaxed" style={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>{item.preview}</p>
          </button>
        ))}
      </div>

      {/* ── Right: detail panel ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="bg-white border border-gray-200 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">Select an item from the list to resolve its diagram.</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white border border-gray-200 px-5 py-4 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{selected.label}</span>
              <span className="text-xs font-bold text-gray-500 uppercase">
                {selected.kind === 'passage' ? 'Passage / Group Diagram' : 'Question Diagram'}
              </span>
              {selected.diagram_type && (
                <span className={`text-xs font-bold px-2 py-0.5 capitalize ${TYPE_COLOR[selected.diagram_type] || TYPE_COLOR.other}`}>
                  {selected.diagram_type}
                </span>
              )}
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 border ${STATUS_COLOR[selected.diagram_status] || ''}`}>
                {STATUS_LABEL[selected.diagram_status] || selected.diagram_status}
              </span>
            </div>

            {/* Content preview */}
            <div className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  {selected.kind === 'passage' ? 'Passage text' : 'Question'}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{selected.preview}</p>
              </div>
            </div>

            {/* Diagram description */}
            {selected.diagram_description && (
              <div className="bg-gray-50 border border-gray-200 px-5 py-4">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Diagram description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.diagram_description}</p>
              </div>
            )}

            {/* Existing diagram preview */}
            {selected.diagram_url && (
              <div className="bg-white border border-gray-200 px-5 py-4">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Current diagram</p>
                <div className="border border-gray-100 bg-gray-50 flex items-center justify-center p-4">
                  <img src={selected.diagram_url} alt="Current diagram" className="max-w-full max-h-64 object-contain" />
                </div>
              </div>
            )}

            {/* SVG preview from auto-generate */}
            {svgPreview && (
              <div className="bg-white border border-gray-200 px-5 py-4">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
                  Generated SVG — review before accepting
                </p>
                <div
                  className="border border-gray-100 bg-gray-50 flex items-center justify-center p-4"
                  dangerouslySetInnerHTML={{ __html: svgPreview }}
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setSvgPreview(null)}
                    className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest hover:border-gray-400 transition-colors">
                    Discard
                  </button>
                  <button onClick={handleAcceptGenerated} disabled={saving}
                    className="flex-1 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors">
                    {saving ? 'Saving...' : '✓ Accept & Upload'}
                  </button>
                </div>
              </div>
            )}

            {generateError && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
                {generateError}
              </div>
            )}

            {/* Actions */}
            <div className="bg-white border border-gray-200 px-5 py-4 space-y-3">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Resolve diagram</p>

              <div className="grid grid-cols-2 gap-3">

                {canAutoGenerate && !svgPreview && (
                  <button onClick={handleAutoGenerate} disabled={generating}
                    className="col-span-2 py-3 border-2 border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-40">
                    {generating ? 'Generating SVG...' : '✦ Auto-generate SVG'}
                  </button>
                )}

                <label className={`${canAutoGenerate && !svgPreview ? '' : 'col-span-2'} py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-600 text-center cursor-pointer hover:border-gray-500 transition-colors`}>
                  {uploading ? 'Uploading...' : '↑ Upload image'}
                  <input type="file" accept="image/*,.svg" className="hidden"
                    onChange={e => e.target.files?.[0] && handleManualUpload(e.target.files[0])} />
                </label>

                {hasExistingDiagram && !svgPreview && (
                  <button onClick={handleApprove} disabled={saving}
                    className="py-2.5 bg-green-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-800 disabled:opacity-40 transition-colors">
                    {saving ? 'Saving...' : '✓ Approve'}
                  </button>
                )}

                <button onClick={handleSkip} disabled={saving}
                  className={`${hasExistingDiagram && !svgPreview ? '' : 'col-span-2'} py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors`}>
                  ⏭ Skip (no diagram needed)
                </button>
              </div>

              {!canAutoGenerate && (
                <p className="text-xs text-gray-400 mt-1">
                  Auto-generate is not available for <span className="font-bold capitalize">{selected.diagram_type}</span> diagrams — upload manually or skip.
                </p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}