import PptxGenJS from 'pptxgenjs'
import { SECTIONS, VALOR_NAVY, VALOR_GOLD, VALOR_LIGHT, SOURCE_LABELS } from './presentation-config'
import type { SlideSpec } from './presentation-config'

export interface RenderedSlide extends SlideSpec {
  dataUrl: string
  pageWidth: number
  pageHeight: number
  available: boolean // false if the source PDF wasn't uploaded or page doesn't exist
}

interface SectionResult {
  sectionId: string
  sectionTitle: string
  slides: RenderedSlide[]
}

function addCoverSlide(pptx: PptxGenJS, weekLabel: string) {
  const slide = pptx.addSlide()
  slide.background = { color: VALOR_NAVY }

  // Valor Advisors wordmark area
  slide.addText('VALOR ADVISORS', {
    x: '5%',
    y: '35%',
    w: '90%',
    h: '15%',
    fontSize: 40,
    bold: true,
    color: VALOR_GOLD,
    align: 'center',
    fontFace: 'Calibri',
  })

  slide.addText('Weekly Investment Review', {
    x: '5%',
    y: '52%',
    w: '90%',
    h: '8%',
    fontSize: 22,
    color: VALOR_LIGHT,
    align: 'center',
    fontFace: 'Calibri',
  })

  slide.addText(weekLabel, {
    x: '5%',
    y: '63%',
    w: '90%',
    h: '7%',
    fontSize: 16,
    color: 'AAAAAA',
    align: 'center',
    fontFace: 'Calibri',
  })

  // Thin gold rule
  slide.addShape(pptx.ShapeType.rect, {
    x: '20%',
    y: '60%',
    w: '60%',
    h: '0.5%',
    fill: { color: VALOR_GOLD },
    line: { color: VALOR_GOLD },
  })

  slide.addText('Confidential — For Authorized Recipients Only', {
    x: '5%',
    y: '88%',
    w: '90%',
    h: '5%',
    fontSize: 9,
    color: '888888',
    align: 'center',
    fontFace: 'Calibri',
  })
}

function addSectionDividerSlide(pptx: PptxGenJS, title: string, color: string, index: number) {
  const slide = pptx.addSlide()
  slide.background = { color }

  slide.addText(String(index).padStart(2, '0'), {
    x: '5%',
    y: '20%',
    w: '90%',
    h: '20%',
    fontSize: 72,
    bold: true,
    color: VALOR_GOLD + '44',
    align: 'center',
    fontFace: 'Calibri',
  })

  slide.addText(title.toUpperCase(), {
    x: '5%',
    y: '42%',
    w: '90%',
    h: '16%',
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    fontFace: 'Calibri',
  })

  slide.addShape(pptx.ShapeType.rect, {
    x: '25%',
    y: '58%',
    w: '50%',
    h: '0.4%',
    fill: { color: VALOR_GOLD },
    line: { color: VALOR_GOLD },
  })

  slide.addText('VALOR ADVISORS', {
    x: '5%',
    y: '88%',
    w: '90%',
    h: '5%',
    fontSize: 9,
    color: VALOR_GOLD,
    align: 'center',
    fontFace: 'Calibri',
    bold: true,
  })
}

function addContentSlide(
  pptx: PptxGenJS,
  rendered: RenderedSlide,
  sectionTitle: string,
  weekLabel: string,
) {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }

  // Thin navy top bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: '4%',
    fill: { color: VALOR_NAVY },
    line: { color: VALOR_NAVY },
  })

  // Section label in top bar
  slide.addText(`${sectionTitle.toUpperCase()}  |  VALOR ADVISORS`, {
    x: '1%',
    y: '0.2%',
    w: '60%',
    h: '3.5%',
    fontSize: 7,
    color: VALOR_GOLD,
    bold: true,
    fontFace: 'Calibri',
  })

  slide.addText(weekLabel, {
    x: '60%',
    y: '0.2%',
    w: '39%',
    h: '3.5%',
    fontSize: 7,
    color: 'CCCCCC',
    align: 'right',
    fontFace: 'Calibri',
  })

  if (rendered.available) {
    // Source label
    const sourceLabel = SOURCE_LABELS[rendered.source]
    slide.addText(`Source: ${sourceLabel}`, {
      x: '1%',
      y: '94%',
      w: '98%',
      h: '4%',
      fontSize: 6,
      color: '888888',
      fontFace: 'Calibri',
    })

    // Content image — fills the body below the header bar and above the footer
    slide.addImage({
      data: rendered.dataUrl,
      x: '0.5%',
      y: '4.5%',
      w: '99%',
      h: '88.5%',
      sizing: { type: 'contain', w: '99%', h: '88.5%' },
    })
  } else {
    // Placeholder for missing source
    slide.addText(
      [
        { text: rendered.label || `Page ${rendered.page}`, options: { bold: true, breakLine: true } },
        { text: '\n', options: {} },
        { text: `Source: ${SOURCE_LABELS[rendered.source]}\n`, options: { breakLine: true } },
        { text: 'Upload this document to populate this slide.', options: { color: 'CC4444' } },
      ],
      {
        x: '10%',
        y: '25%',
        w: '80%',
        h: '50%',
        fontSize: 16,
        color: '444444',
        align: 'center',
        fontFace: 'Calibri',
      },
    )
  }
}

export async function buildPresentation(
  sections: SectionResult[],
  weekLabel: string,
): Promise<Blob> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 16:9

  // Slide 1: Cover
  addCoverSlide(pptx, weekLabel)

  let sectionIndex = 1
  for (const section of sections) {
    const config = SECTIONS.find((s) => s.id === section.sectionId)!

    // Section divider
    addSectionDividerSlide(pptx, section.sectionTitle, config.color, sectionIndex)
    sectionIndex++

    // Content slides
    for (const rendered of section.slides) {
      addContentSlide(pptx, rendered, section.sectionTitle, weekLabel)
    }
  }

  const blob = await pptx.write({ outputType: 'blob' })
  return blob as Blob
}
