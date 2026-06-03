import PptxGenJS from 'pptxgenjs'
import { SECTIONS, VALOR_NAVY, VALOR_GOLD, VALOR_CREAM, VALOR_GRAY, SOURCE_LABELS } from './presentation-config'
import type { SlideSpec } from './presentation-config'

export interface RenderedSlide extends SlideSpec {
  dataUrl: string
  available: boolean
  summary?: string[]
}

interface SectionResult {
  sectionId: string
  sectionTitle: string
  sectionNumber: string
  slides: RenderedSlide[]
}

const FOOTER_TEXT = 'For Informational Purposes Only  |  Not Investment Advice'
const DISCLAIMER = 'Valor Advisors  |  For Informational Purposes Only'

function addLogo(slide: PptxGenJS.Slide) {
  slide.addText('VALOR', {
    x: '1.5%', y: '1%', w: '8%', h: '4%',
    fontSize: 8, bold: true, color: VALOR_NAVY, fontFace: 'Calibri',
  })
  slide.addText('ADVISORS', {
    x: '1.5%', y: '3.2%', w: '8%', h: '3%',
    fontSize: 5.5, bold: false, color: VALOR_GOLD, fontFace: 'Calibri', charSpacing: 2,
  })
  slide.addShape('rect' as any, {
    x: '1.5%', y: '5.5%', w: '6%', h: '0.3%',
    fill: { color: VALOR_GOLD }, line: { color: VALOR_GOLD },
  })
}

function addCoverSlide(pptx: PptxGenJS, weekLabel: string) {
  const slide = pptx.addSlide()
  slide.background = { color: VALOR_CREAM }
  slide.addShape('rect' as any, {
    x: 0, y: 0, w: '1.2%', h: '100%',
    fill: { color: VALOR_NAVY }, line: { color: VALOR_NAVY },
  })
  slide.addShape('rect' as any, {
    x: '5%', y: '38%', w: '90%', h: '0.4%',
    fill: { color: VALOR_GOLD }, line: { color: VALOR_GOLD },
  })
  addLogo(slide)
  slide.addText('Weekly Market Review', {
    x: '5%', y: '42%', w: '90%', h: '12%',
    fontSize: 36, bold: true, color: VALOR_NAVY, align: 'center', fontFace: 'Calibri',
  })
  slide.addText('Investment Strategy & Market Outlook', {
    x: '5%', y: '55%', w: '90%', h: '8%',
    fontSize: 18, color: '444444', align: 'center', fontFace: 'Calibri',
  })
  slide.addText(weekLabel, {
    x: '5%', y: '65%', w: '90%', h: '7%',
    fontSize: 16, color: VALOR_GOLD, align: 'center', fontFace: 'Calibri', bold: true,
  })
  slide.addText('For Valor Advisor Clients', {
    x: '5%', y: '74%', w: '90%', h: '5%',
    fontSize: 11, color: '444444', align: 'center', fontFace: 'Calibri',
  })
  slide.addText(FOOTER_TEXT, {
    x: '5%', y: '92%', w: '90%', h: '4%',
    fontSize: 7, color: '888888', align: 'center', fontFace: 'Calibri',
  })
}

function addAgendaSlide(pptx: PptxGenJS, weekLabel: string) {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  slide.addShape('rect' as any, {
    x: 0, y: 0, w: '100%', h: '14%',
    fill: { color: VALOR_NAVY }, line: { color: VALOR_NAVY },
  })
  addLogo(slide)
  slide.addText('Agenda', {
    x: '5%', y: '2%', w: '90%', h: '10%',
    fontSize: 24, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Calibri',
  })
  SECTIONS.forEach((section, i) => {
    const y = 18 + i * 15
    slide.addShape('rect' as any, {
      x: '4%', y: `${y}%`, w: '6%', h: '11%',
      fill: { color: VALOR_GOLD }, line: { color: VALOR_GOLD },
    })
    slide.addText(section.sectionNumber, {
      x: '4%', y: `${y}%`, w: '6%', h: '11%',
      fontSize: 14, bold: true, color: VALOR_NAVY, align: 'center', valign: 'middle', fontFace: 'Calibri',
    })
    slide.addText(section.title, {
      x: '12%', y: `${y}%`, w: '80%', h: '11%',
      fontSize: 13, bold: true, color: VALOR_NAVY, valign: 'middle', fontFace: 'Calibri',
    })
    if (i < SECTIONS.length - 1) {
      slide.addShape('rect' as any, {
        x: '4%', y: `${y + 12.5}%`, w: '92%', h: '0.2%',
        fill: { color: 'DDDDDD' }, line: { color: 'DDDDDD' },
      })
    }
  })
  slide.addText(`${weekLabel}  |  ${FOOTER_TEXT}`, {
    x: '4%', y: '95%', w: '92%', h: '4%',
    fontSize: 6.5, color: '888888', align: 'center', fontFace: 'Calibri',
  })
}

function addSectionDivider(pptx: PptxGenJS, sectionNumber: string, title: string, weekLabel: string) {
  const slide = pptx.addSlide()
  slide.background = { color: VALOR_GRAY }
  slide.addShape('rect' as any, {
    x: 0, y: 0, w: '1.2%', h: '100%',
    fill: { color: VALOR_NAVY }, line: { color: VALOR_NAVY },
  })
  addLogo(slide)
  slide.addText(sectionNumber, {
    x: '5%', y: '18%', w: '90%', h: '25%',
    fontSize: 80, bold: true, color: 'DDDDDD', align: 'center', fontFace: 'Calibri',
  })
  slide.addText(title.toUpperCase(), {
    x: '5%', y: '45%', w: '90%', h: '18%',
    fontSize: 30, bold: true, color: VALOR_NAVY, align: 'center', fontFace: 'Calibri',
  })
  slide.addShape('rect' as any, {
    x: '25%', y: '64%', w: '50%', h: '0.5%',
    fill: { color: VALOR_GOLD }, line: { color: VALOR_GOLD },
  })
  slide.addText(weekLabel, {
    x: '5%', y: '68%', w: '90%', h: '6%',
    fontSize: 10, color: '888888', align: 'center', fontFace: 'Calibri',
  })
  slide.addText(FOOTER_TEXT, {
    x: '5%', y: '92%', w: '90%', h: '4%',
    fontSize: 6.5, color: 'AAAAAA', align: 'center', fontFace: 'Calibri',
  })
}

function addContentSlide(pptx: PptxGenJS, rendered: RenderedSlide, sectionTitle: string, weekLabel: string) {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  slide.addShape('rect' as any, {
    x: 0, y: 0, w: '100%', h: '7%',
    fill: { color: VALOR_NAVY }, line: { color: VALOR_NAVY },
  })
  addLogo(slide)
  slide.addText(`${sectionTitle.toUpperCase()}  |  ${weekLabel}`, {
    x: '55%', y: '0.5%', w: '44%', h: '5.5%',
    fontSize: 7, color: VALOR_GOLD, align: 'right', fontFace: 'Calibri', bold: true,
  })
  if (rendered.available) {
        if (rendered.summary && rendered.summary.length > 0) {
      slide.addImage({
        data: rendered.dataUrl,
        x: '0.5%', y: '7.5%', w: '62%', h: '83%',
        sizing: { type: 'contain', w: '62%', h: '83%' },
      })
      slide.addShape('rect' as any, {
        x: '63%', y: '7.5%', w: '36%', h: '83%',
        fill: { color: VALOR_NAVY }, line: { color: VALOR_NAVY },
      })
      slide.addText(rendered.summary.map((b) => '  ' + b).join('\n\n'), {
        x: '64%', y: '10%', w: '34%', h: '78%',
        fontSize: 11, color: 'FFFFFF', fontFace: 'Calibri', valign: 'top',
        bullet: { type: 'bullet', code: '2022', color: VALOR_GOLD },
      })
    } else {
      slide.addImage({
        data: rendered.dataUrl,
        x: '0.5%', y: '7.5%', w: '99%', h: '83%',
        sizing: { type: 'contain', w: '99%', h: '83%' },
      })
    }
  } else {
    slide.addShape('rect' as any, {
      x: '10%', y: '20%', w: '80%', h: '55%',
      fill: { color: 'F8F8F8' }, line: { color: 'DDDDDD', width: 1 },
    })
    slide.addText(
      [
        { text: rendered.label + '\n', options: { bold: true, breakLine: true } },
        { text: `\nUpload "${SOURCE_LABELS[rendered.source]}" to populate this slide.\n`, options: { breakLine: true } },
        { text: `Expected: ${rendered.sourceCaption}`, options: { color: '888888' } },
      ],
      { x: '12%', y: '25%', w: '76%', h: '45%', fontSize: 11, color: '555555', align: 'center', fontFace: 'Calibri' },
    )
  }
  slide.addText(rendered.sourceCaption, {
    x: '1%', y: '91%', w: '98%', h: '4%',
    fontSize: 5.5, color: '888888', fontFace: 'Calibri', italic: true,
  })
  slide.addShape('rect' as any, {
    x: 0, y: '95.5%', w: '100%', h: '4.5%',
    fill: { color: VALOR_GRAY }, line: { color: VALOR_GRAY },
  })
  slide.addText(`${DISCLAIMER}  |  ${FOOTER_TEXT}`, {
    x: '1%', y: '96%', w: '98%', h: '4%',
    fontSize: 6, color: '888888', align: 'center', fontFace: 'Calibri',
  })
}

export async function buildPresentation(sections: SectionResult[], weekLabel: string): Promise<Blob> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  addCoverSlide(pptx, weekLabel)
  addAgendaSlide(pptx, weekLabel)
  for (const section of sections) {
    addSectionDivider(pptx, section.sectionNumber, section.sectionTitle, weekLabel)
    for (const rendered of section.slides) {
      addContentSlide(pptx, rendered, section.sectionTitle, weekLabel)
    }
  }
  const blob = await pptx.write({ outputType: 'blob' })
  return blob as Blob
}
