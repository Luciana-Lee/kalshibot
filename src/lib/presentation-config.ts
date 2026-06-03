export type SourceKey = 'jpmMarkets' | 'isgOutlook' | 'msGic' | 'gsKickstart'

export interface SlideSpec {
  source: SourceKey
  page: number
  label: string
  sourceCaption: string
}

export interface Section {
  id: string
  title: string
  sectionNumber: string
  slides: SlideSpec[]
}

export const VALOR_NAVY  = '0D1B3E'
export const VALOR_GOLD  = 'C9A84C'
export const VALOR_CREAM = 'FAFAF8'
export const VALOR_GRAY  = 'F2F2EF'

export const SOURCE_LABELS: Record<SourceKey, string> = {
  jpmMarkets:  'J.P. Morgan Asset Management — Guide to the Markets',
  isgOutlook:  'Goldman Sachs Investment Strategy Group — 2026 Outlook',
  msGic:       'Morgan Stanley Global Investment Committee Weekly',
  gsKickstart: 'Goldman Sachs — US Weekly Kickstart',
}

export const SOURCE_PATTERNS: Record<SourceKey, RegExp[]> = {
  jpmMarkets:  [/guide.to.the.market/i, /gtmus/i, /jpm.*market/i],
  isgOutlook:  [/isg/i, /goldman.*outlook/i, /2026.*outlook/i],
  msGic:       [/morgan.stanley/i, /ms.*gic/i, /gic.*weekly/i],
  gsKickstart: [/kickstart/i, /gs.*weekly/i],
}

export const SECTIONS: Section[] = [
  {
    id: 'principles',
    title: 'Investment Principles',
    sectionNumber: '01',
    slides: [
      { source: 'isgOutlook', page: 10, label: 'ISG Investment Philosophy — Six Pillars (Exhibit 55)', sourceCaption: 'Source: Goldman Sachs ISG 2026 Outlook, p.10, Exhibit 55. Investment Strategy Group.' },
      { source: 'jpmMarkets', page: 4,  label: 'S&P 500 Index — Long-Term Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.4. FactSet, Standard & Poors.' },
      { source: 'jpmMarkets', page: 9,  label: 'Magnificent 7 vs. S&P 493', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.9. FactSet, Standard & Poors.' },
      { source: 'jpmMarkets', page: 10, label: 'Top 10 S&P 500 Companies by Decade', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.10. Bloomberg, FactSet.' },
      { source: 'jpmMarkets', page: 11, label: 'AI & Technology Investment Landscape', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.11. FactSet, MSCI.' },
      { source: 'jpmMarkets', page: 15, label: 'Returns & Valuations by Style', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.15. FactSet, FTSE Russell.' },
      { source: 'jpmMarkets', page: 16, label: 'Returns & Valuations by Sector', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.16. FactSet, FTSE Russell.' },
      { source: 'jpmMarkets', page: 17, label: 'Volatility Is Normal — Intra-Year Declines', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.17. FactSet, Standard & Poors.' },
      { source: 'msGic',      page: 1,  label: 'MS GIC — Investment Principles', sourceCaption: 'Source: Morgan Stanley Global Investment Committee Weekly. Morgan Stanley Wealth Management.' },
    ],
  },
  {
    id: 'economy',
    title: 'Economy',
    sectionNumber: '02',
    slides: [
      { source: 'jpmMarkets', page: 18, label: 'GDP Growth Components', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.18. BEA, FactSet.' },
      { source: 'jpmMarkets', page: 19, label: 'Labor Market', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.19. BLS, FactSet.' },
      { source: 'jpmMarkets', page: 21, label: 'Federal Reserve Policy', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.21. Federal Reserve, FactSet.' },
      { source: 'jpmMarkets', page: 22, label: 'Inflation — CPI Components', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.22. BLS, FactSet.' },
      { source: 'jpmMarkets', page: 28, label: 'Consumer & Business Confidence', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.28. Conference Board, FactSet.' },
      { source: 'jpmMarkets', page: 29, label: 'Housing Market', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.29. NAR, FactSet.' },
      { source: 'isgOutlook', page: 28, label: 'US Debt-to-GDP Outlook (Exhibit 34)', sourceCaption: 'Source: Goldman Sachs ISG 2026 Outlook, Exhibit 34. Congressional Budget Office, Bloomberg.' },
      { source: 'isgOutlook', page: 35, label: 'Valuations in Context (Exhibit 42)', sourceCaption: 'Source: Goldman Sachs ISG 2026 Outlook, Exhibit 42. Bloomberg, Investment Strategy Group.' },
      { source: 'msGic',      page: 2,  label: 'MS GIC — Economic Outlook', sourceCaption: 'Source: Morgan Stanley Global Investment Committee Weekly. Morgan Stanley Wealth Management.' },
    ],
  },
  {
    id: 'equity',
    title: 'Equity Markets',
    sectionNumber: '03',
    slides: [
      { source: 'jpmMarkets', page: 44, label: 'International Equity Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.44. MSCI, FactSet.' },
      { source: 'jpmMarkets', page: 46, label: 'Emerging Markets', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.46. MSCI, FactSet.' },
      { source: 'jpmMarkets', page: 58, label: 'Global Equity Valuations', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.58. MSCI, FactSet.' },
      { source: 'jpmMarkets', page: 59, label: 'Equity Allocation & Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.59. MSCI, FactSet.' },
      { source: 'jpmMarkets', page: 60, label: 'Global Portfolio Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.60. MSCI, FactSet.' },
      { source: 'msGic',      page: 4,  label: 'MS GIC — Equity', sourceCaption: 'Source: Morgan Stanley Global Investment Committee Weekly. Morgan Stanley Wealth Management.' },
    ],
  },
  {
    id: 'fixedIncome',
    title: 'Fixed Income',
    sectionNumber: '04',
    slides: [
      { source: 'isgOutlook', page: 105, label: 'High Valuations Have Not Stopped the Rally (Exhibit 152)', sourceCaption: 'Source: Goldman Sachs ISG 2026 Outlook, Exhibit 152. Bloomberg, Investment Strategy Group.' },
      { source: 'jpmMarkets', page: 40, label: 'Fixed Income Sector Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.40. Bloomberg, FactSet.' },
      { source: 'jpmMarkets', page: 41, label: 'Treasury Yield Curve', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.41. Federal Reserve, FactSet.' },
      { source: 'jpmMarkets', page: 42, label: 'Credit Spreads & Default Rates', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.42. Bloomberg, FactSet.' },
      { source: 'msGic',      page: 5,  label: 'MS GIC — Fixed Income', sourceCaption: 'Source: Morgan Stanley Global Investment Committee Weekly. Morgan Stanley Wealth Management.' },
    ],
  },
  {
    id: 'appendix',
    title: 'Appendix',
    sectionNumber: '05',
    slides: [
      { source: 'jpmMarkets', page: 24, label: 'Asset Class Returns', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.24. Bloomberg, FactSet.' },
      { source: 'jpmMarkets', page: 25, label: 'Portfolio Returns by Allocation', sourceCaption: 'Source: J.P. Morgan Asset Management, Guide to the Markets, p.25. Bloomberg, FactSet.' },
      { source: 'isgOutlook', page: 49, label: 'AI as GDP Driver (Exhibit 61)', sourceCaption: 'Source: Goldman Sachs ISG 2026 Outlook, Exhibit 61. Goldman Sachs GIR, Investment Strategy Group.' },
      { source: 'msGic',      page: 6,  label: 'MS GIC — Additional Charts', sourceCaption: 'Source: Morgan Stanley Global Investment Committee Weekly. Morgan Stanley Wealth Management.' },
    ],
  },
]
