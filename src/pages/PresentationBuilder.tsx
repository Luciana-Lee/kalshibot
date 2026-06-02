import { useState, useCallback, useRef } from 'react'
import { SECTIONS, SOURCE_LABELS, SOURCE_PATTERNS } from '@/lib/presentation-config'
import type { SourceKey } from '@/lib/presentation-config'
import { loadPdf, renderPageToDataUrl, getPdfPageCount } from '@/lib/pdf-extractor'
import { buildPresentation } from '@/lib/pptx-builder'
import type { RenderedSlide } from '@/lib/pptx-builder'
import * as pdfjsLib from 'pdfjs-dist'

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

function UploadZone({
  sourceKey,
  doc,
  onFile,
  onClear,
  onSourceChange,
}: {
  sourceKey: SourceKey
  doc?: PdfDoc
  onFile: (key: SourceKey, file: File) => void
  onClear: (key: SourceKey) => void
  onSourceChange: (oldKey: SourceKey, newKey: SourceKey) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') onFile(sourceKey, file)
  }

  const SOURCE_KEYS = Object.keys(SOURCE_LABELS) as SourceKey[]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{SOURCE_LABELS[sourceKey]}</label>
        {doc && (
          <select
            className="text-xs border border-slate-200 rounded px-2 py-0.5 text-slate-600"
            value={sourceKey}
            onChange={(e) => onSourceChange(sourceKey, e.target.value as SourceKey)}
          >
            {SOURCE_KEYS.map((k) => (
              <option key={k} value={k}>
                {SOURCE_LABELS[k]}
              </option>
            ))}
          </select>
        )}
      </div>

      {!doc ? (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-amber-400 bg-amber-50'
              : 'border-slate-200 hover:border-slate-400 bg-slate-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(sourceKey, f) }}
          />
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm text-slate-500">Drop PDF here or click to browse</p>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
          doc.state === 'error' ? 'border-red-300 bg-red-50' :
          doc.state === 'loading' ? 'border-amber-300 bg-amber-50' :
          'border-emerald-300 bg-emerald-50'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">
              {doc.state === 'loading' ? '⏳' : doc.state === 'error' ? '❌' : '✅'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{doc.file.name}</p>
              {doc.state === 'ready' && (
                <p className="text-xs text-slate-500">{doc.pageCount} pages</p>
              )}
              {doc.state === 'error' && (
                <p className="text-xs text-red-600">{doc.error}</p>
              )}
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-red-500 text-lg flex-shrink-0"
            onClick={() => onClear(sourceKey)}
            title="Remove"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function SectionPreview({ section, docs }: {
  section: typeof SECTIONS[number]
  docs: Docs
}) {
  const available = section.slides.filter((s) => docs[s.source]?.state === 'ready').length
  const total = section.slides.length

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-800">{section.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          available === total ? 'bg-emerald-100 text-emerald-700' :
          available === 0 ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {available}/{total} slides ready
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {section.slides.map((slide, i) => {
          const ready = docs[slide.source]?.state === 'ready'
          return (
            <span
              key={i}
              title={`${SOURCE_LABELS[slide.source]} — pg ${slide.page}${slide.label ? ` (${slide.label})` : ''}`}
              className={`text-xs px-2 py-0.5 rounded border ${
                ready
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              {slide.label || `pg ${slide.page}`}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function PresentationBuilder() {
  const [docs, setDocs] = useState<Docs>({})
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [weekLabel, setWeekLabel] = useState(() => {
    const d = new Date()
    return `Week of ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  })
  const [error, setError] = useState<string | null>(null)

  const SOURCE_KEYS = Object.keys(SOURCE_LABELS) as SourceKey[]

  const handleFile = useCallback(async (key: SourceKey, file: File) => {
    setDocs((prev) => ({ ...prev, [key]: { file, pdf: undefined as any, pageCount: 0, state: 'loading' } }))
    try {
      const pdf = await loadPdf(file)
      setDocs((prev) => ({
        ...prev,
        [key]: { file, pdf, pageCount: getPdfPageCount(pdf), state: 'ready' },
      }))
    } catch (e: any) {
      setDocs((prev) => ({
        ...prev,
        [key]: { file, pdf: undefined as any, pageCount: 0, state: 'error', error: e.message },
      }))
    }
  }, [])

  const handleClear = useCallback((key: SourceKey) => {
    setDocs((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleSourceChange = useCallback((oldKey: SourceKey, newKey: SourceKey) => {
    setDocs((prev) => {
      const next = { ...prev }
      const doc = next[oldKey]
      delete next[oldKey]
      if (doc) next[newKey] = doc
      return next
    })
  }, [])

  const handleFileDrop = useCallback((files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') continue
      const detected = detectSource(file.name)
      const key = detected ?? SOURCE_KEYS.find((k) => !docs[k]) ?? SOURCE_KEYS[0]
      handleFile(key, file)
    }
  }, [docs, handleFile])

  const readyCount = SOURCE_KEYS.filter((k) => docs[k]?.state === 'ready').length
  const totalSlides = SECTIONS.reduce((acc, s) => acc + s.slides.length, 0) + SECTIONS.length + 1 // content + dividers + cover

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const sectionResults = []

      for (const section of SECTIONS) {
        setProgress(`Rendering: ${section.title}...`)
        const rendered: RenderedSlide[] = []

        for (const spec of section.slides) {
          const doc = docs[spec.source]
          if (!doc || doc.state !== 'ready') {
            rendered.push({ ...spec, dataUrl: '', pageWidth: 0, pageHeight: 0, available: false })
            continue
          }
          try {
            const dataUrl = await renderPageToDataUrl(doc.pdf, spec.page, 2.0)
            rendered.push({ ...spec, dataUrl, pageWidth: 0, pageHeight: 0, available: true })
          } catch {
            rendered.push({ ...spec, dataUrl: '', pageWidth: 0, pageHeight: 0, available: false })
          }
        }

        sectionResults.push({
          sectionId: section.id,
          sectionTitle: section.title,
          slides: rendered,
        })
      }

      setProgress('Building PowerPoint file...')
      const blob = await buildPresentation(sectionResults, weekLabel)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      a.download = `Valor_Advisors_Weekly_Review_${dateStr}.pptx`
      a.click()
      URL.revokeObjectURL(url)

      setProgress('Done!')
      setTimeout(() => setProgress(''), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0D1B3E] text-white px-8 py-5 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-[#C9A84C] font-bold text-xl tracking-widest">VALOR ADVISORS</div>
          <div className="text-slate-300 text-sm mt-0.5">Weekly Presentation Builder</div>
        </div>
        <div className="text-slate-400 text-sm">For Internal Use Only</div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Week label */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Presentation Details</h2>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-600 w-32">Week Label</label>
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g. Week of June 2, 2026"
            />
          </div>
        </div>

        {/* Document uploads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Upload Source Documents</h2>
          <p className="text-sm text-slate-500 mb-5">
            Upload the four weekly research PDFs. The system auto-detects which is which from the filename.
            You can reassign using the dropdown on each card.
          </p>

          {/* Global drop zone */}
          <div
            className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-5 text-center mb-6 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFileDrop(e.dataTransfer.files) }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.pdf'
              input.multiple = true
              input.onchange = (e) => handleFileDrop((e.target as HTMLInputElement).files!)
              input.click()
            }}
          >
            <div className="text-2xl mb-1">📂</div>
            <p className="text-sm text-amber-700 font-medium">Drop all 4 PDFs here at once — or click to browse</p>
            <p className="text-xs text-amber-600 mt-0.5">Files are processed locally in your browser. Nothing is uploaded to a server.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCE_KEYS.map((key) => (
              <UploadZone
                key={key}
                sourceKey={key}
                doc={docs[key]}
                onFile={handleFile}
                onClear={handleClear}
                onSourceChange={handleSourceChange}
              />
            ))}
          </div>
        </div>

        {/* Slide plan preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Slide Plan</h2>
            <span className="text-sm text-slate-500">~{totalSlides} slides total (incl. cover & section dividers)</span>
          </div>
          <div className="space-y-3">
            {SECTIONS.map((section) => (
              <SectionPreview key={section.id} section={section} docs={docs} />
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Generate Presentation</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {readyCount === 0
                  ? 'Upload at least one PDF to get started.'
                  : `${readyCount} of 4 source documents loaded. Missing slides will show placeholders.`}
              </p>
            </div>
            <button
              className="bg-[#0D1B3E] hover:bg-[#1a2f5e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 shadow"
              disabled={readyCount === 0 || generating}
              onClick={generate}
            >
              {generating ? (
                <>
                  <span className="animate-spin">⟳</span>
                  {progress || 'Building...'}
                </>
              ) : (
                <>📊 Download .pptx</>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {progress && !generating && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              ✅ {progress}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-[#0D1B3E] rounded-2xl p-6 text-slate-300 text-sm space-y-2">
          <h3 className="text-[#C9A84C] font-semibold text-base mb-3">How It Works</h3>
          <p>1. Upload the four weekly PDFs each week (JPM Guide to Markets, JPM View, MS GIC Weekly, GS Kickstart).</p>
          <p>2. The system extracts the configured pages from each document and renders them as high-resolution images.</p>
          <p>3. A branded PowerPoint (.pptx) is built client-side and downloaded automatically.</p>
          <p>4. All processing happens in your browser — no data leaves your device.</p>
          <p className="pt-2 text-slate-500 text-xs">
            Slide configuration: Investment Principles (JPM pg 4,9,10,11,15,16,17 + MS) ·
            Economy (JPM pg 18,19,21,22,28,29,33,36 + MS) ·
            Equity (JPM pg 44,46,58,59,60 + MS) ·
            Fixed Income (JPM pg 40,41,42 + MS) ·
            Appendix (JPM pg 24,25 + GS)
          </p>
        </div>
      </div>
    </div>
  )
}
