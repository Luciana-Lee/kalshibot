import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker via URL constructor so Vite handles it
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export async function loadPdf(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const buffer = await file.arrayBuffer()
  return pdfjsLib.getDocument({ data: buffer }).promise
}

/**
 * Renders a single 1-based page number to a base64 PNG data URL.
 * Scale controls resolution — 2.0 gives 2x for retina / crisp slides.
 */
export async function renderPageToDataUrl(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 2.0,
): Promise<string> {
  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} out of range (1–${pdf.numPages})`)
  }
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas.toDataURL('image/png')
}

/** Returns the total number of pages in a PDF */
export function getPdfPageCount(pdf: pdfjsLib.PDFDocumentProxy): number {
  return pdf.numPages
}
