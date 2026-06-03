import { useState, useCallback, useRef } from 'react'
import { SECTIONS, SOURCE_LABELS, SOURCE_PATTERNS } from '@/lib/presentation-config'
import type { SourceKey } from '@/lib/presentation-config'
import { loadPdf, renderPageToDataUrl, getPdfPageCount } from '@/lib/pdf-extractor'
import { buildPresentation } from '@/lib/pptx-builder'
import type { RenderedSlide } from '@/lib/pptx-builder'
import * as pdfjsLib from 'pdfjs-dist'
import { summarizeSlide } from '@/lib/ai-summarizer'

type UploadState = 'idle' | 'loading' | 'ready' | 'error'

interface PdfDoc {
  file: File
  pdf: pdfjsLib.PDFDocumentProxy
  pageCount: number
  state: UploadState
  error?: string
}

type Docs = Partial<Record<SourceKey, PdfDoc>>

function detectSource(filename: string): SourceKey | null {
  const name = filename.toLowerCase()
  for (const [key, patterns] of Object.entries(SOURCE_PATTERNS) as [SourceKey, RegExp[]][]) {
    if (patterns.some((p) => p.test(name))) return key
  }
  return null
}

const SOURCE_ORDER: SourceKey[] = ['jpmMarkets', 'jpmView', 'isgOutlook', 'msGic', 'gsKickstart']

function UploadCard({ sourceKey, doc, onFile, onClear, onSourceChange }: {
  sourceKey: SourceKey
  doc?: PdfDoc
  onFile: (key: SourceKey, file: File) => void
  onClear: (key: SourceKey) => void
  onSourceChange: (oldKey: SourceKey, newKey: SourceKey) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700">{SOURCE_LABELS[sourceKey]}</span>
        {doc && (
          <select className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-500"
            value={sourceKey} onChange={(e) => onSourceChange(sourceKey, e.target.value as SourceKey)}>
            {SOURCE_ORDER.map((k) => <option key={k} value={k}>{SOURCE_LABELS[k]}</option>)}
          </select>
        )}
      </div>
      {!doc ? (
        <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${drag ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onFile(sourceKey, f) }}
          onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(sourceKey, f) }} />
          <p className="text-sm text-slate-400">Drop PDF or click to browse</p>
        </div>
      ) : (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${doc.state === 'error' ? 'border-red-200 bg-red-50' : doc.state === 'loading' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{doc.state === 'loading' ? '⏳' : doc.state === 'error' ? '❌' : '✅'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{doc.file.name}</p>
              {doc.state === 'ready' && <p className="text-xs text-slate-400">{doc.pageCount} pages</p>}
              {doc.state === 'error' && <p className="text-xs text-red-500">{doc.error}</p>}
            </div>
          </div>
          <button className="text-slate-300 hover:text-red-400 text-xl flex-shrink-0" onClick={() => onClear(sourceKey)}>×</button>
        </div>
      )}
    </div>
  )
}

function SlidePlan({ docs }: { docs: Docs }) {
  return (
    <div className="space-y-2">
      {SECTIONS.map((section) => {
        const ready = section.slides.filter((s) => docs[s.source]?.state === 'ready').length
        const total = section.slides.length
        return (
          <div key={section.id} className="border border-slate-100 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{section.sectionNumber}</span>
                <h3 className="font-semibold text-slate-700 text-sm">{section.title}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ready === total ? 'bg-emerald-100 text-emerald-700' : ready === 0 ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'}`}>
                {ready}/{total} ready
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {section.slides.map((slide, i) => {
                const ok = docs[slide.source]?.state === 'ready'
                return (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded border ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                    {slide.label}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PresentationBuilder() {
  const [docs, setDocs] = useState<Docs>({})
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('valor_api_key') || '')
  const [weekLabel, setWeekLabel] = useState(() => {
    const d = new Date()
    return `${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
  })

  const handleFile = useCallback(async (key: SourceKey, file: File) => {
    setDocs((p) => ({ ...p, [key]: { file, pdf: undefined as any, pageCount: 0, state: 'loading' } }))
    try {
      const pdf = await loadPdf(file)
      setDocs((p) => ({ ...p, [key]: { file, pdf, pageCount: getPdfPageCount(pdf), state: 'ready' } }))
    } catch (e: any) {
      setDocs((p) => ({ ...p, [key]: { file, pdf: undefined as any, pageCount: 0, state: 'error', error: e.message } }))
    }
  }, [])

  const handleClear = useCallback((key: SourceKey) => {
    setDocs((p) => { const n = { ...p }; delete n[key]; return n })
  }, [])

  const handleSourceChange = useCallback((oldKey: SourceKey, newKey: SourceKey) => {
    setDocs((p) => {
      const n = { ...p }
      const doc = n[oldKey]; delete n[oldKey]
      if (doc) n[newKey] = doc
      return n
    })
  }, [])

  const handleDrop = useCallback((files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') continue
      const detected = detectSource(file.name)
      const key = detected ?? SOURCE_ORDER.find((k) => !docs[k]) ?? SOURCE_ORDER[0]
      handleFile(key, file)
    }
  }, [docs, handleFile])

  const readyCount = SOURCE_ORDER.filter((k) => docs[k]?.state === 'ready').length
  const totalContent = SECTIONS.reduce((a, s) => a + s.slides.length, 0)
  const totalSlides = totalContent + SECTIONS.length + 2

  const generate = async () => {
    setGenerating(true); setError(null)
    try {
      const key = apiKey.trim()
      const sectionResults = []
      for (const section of SECTIONS) {
        setProgress(`Rendering: ${section.title}...`)
        const rendered: RenderedSlide[] = []
        for (const spec of section.slides) {
          const doc = docs[spec.source]
          if (!doc || doc.state !== 'ready') {
            rendered.push({ ...spec, dataUrl: '', available: false }); continue
          }
          try {
            const dataUrl = await renderPageToDataUrl(doc.pdf, spec.page, 2.0)
            let summary: string[] = []
            if (key) {
              setProgress(`AI summarizing: ${spec.label}...`)
              try { summary = await summarizeSlide(dataUrl, spec.label, key) } catch (e: any) { console.error('Summary failed:', e) }
            }
            rendered.push({ ...spec, dataUrl, available: true, summary })
          } catch {
            rendered.push({ ...spec, dataUrl: '', available: false })
          }
        }
        sectionResults.push({ sectionId: section.id, sectionTitle: section.title, sectionNumber: section.sectionNumber, slides: rendered })
      }
      setProgress('Building PowerPoint...')
      const blob = await buildPresentation(sectionResults, weekLabel)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Valor_Advisors_Weekly_Review_${weekLabel.replace(/\s+/g, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
      setProgress('Done! File downloaded.')
      setTimeout(() => setProgress(''), 4000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-[#0D1B3E] px-8 py-4 flex items-center justify-between shadow">
        <div>
          <div className="text-white font-bold text-lg tracking-widest">VALOR</div>
          <div className="text-[#C9A84C] text-xs tracking-widest">PRIVATE INVESTMENT OFFICE</div>
        </div>
        <div className="text-slate-400 text-xs">For Internal Use Only</div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-700">Presentation Details</h2>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-600 w-36 flex-shrink-0">Presentation Date</label>
            <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} placeholder="e.g. June 2026" />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-600 w-36 flex-shrink-0">Anthropic API Key</label>
            <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('valor_api_key', e.target.value) }}
              placeholder="sk-ant-..." type="password" />
          </div>
          {apiKey && <p className="text-xs text-emerald-600">AI summaries enabled — Claude will write bullet points for each slide.</p>}
          {!apiKey && <p className="text-xs text-amber-600">No API key — charts only, no AI summaries.</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Upload Source Documents</h2>
          <div className="border-2 border-dashed border-amber-200 bg-amber-50 rounded-xl p-4 text-center mb-5 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleDrop(e.dataTransfer.files) }}
            onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf'; i.multiple = true; i.onchange = (e) => handleDrop((e.target as HTMLInputElement).files!); i.click() }}>
            <p className="text-sm text-amber-700 font-medium">Drop all PDFs here at once — or click to browse</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCE_ORDER.map((key) => (
              <UploadCard key={key} sourceKey={key} doc={docs[key]} onFile={handleFile} onClear={handleClear} onSourceChange={handleSourceChange} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">Slide Plan</h2>
            <span className="text-xs text-slate-400">{totalSlides} slides total</span>
          </div>
          <SlidePlan docs={docs} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-700">Generate Presentation</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {readyCount === 0 ? 'Upload at least one PDF to get started.' : `${readyCount}/5 documents loaded.${apiKey ? ' AI summaries will be generated.' : ''}`}
              </p>
            </div>
            <button
              className="bg-[#0D1B3E] hover:bg-[#1a2f5e] disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 shadow text-sm"
              disabled={readyCount === 0 || generating} onClick={generate}>
              {generating ? <><span className="animate-spin inline-block">⟳</span> {progress || 'Working...'}</> : '📊 Download .pptx'}
            </button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"><strong>Error:</strong> {error}</div>}
          {progress && !generating && <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">✅ {progress}</div>}
        </div>

      </div>
    </div>
  )
}
