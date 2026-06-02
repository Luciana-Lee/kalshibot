// Slide configuration — defines which pages to pull from each source document
// and how they map to presentation sections.

export type SourceKey = 'jpmMarkets' | 'jpmView' | 'msGic' | 'gsKickstart'

export interface SlideSpec {
  source: SourceKey
  page: number // 1-based PDF page number
  label?: string // optional human-readable description
}

export interface Section {
  id: string
  title: string
  color: string // hex, used for section divider slides
  slides: SlideSpec[]
}

// Valor Advisors brand colors
export const VALOR_NAVY = '0D1B3E'
export const VALOR_GOLD = 'C9A84C'
export const VALOR_LIGHT = 'F5F5F0'

// Source document human-readable labels (used in upload UI)
export const SOURCE_LABELS: Record<SourceKey, string> = {
  jpmMarkets: 'JPM Guide to the Markets',
  jpmView: 'JPM The J.P. Morgan View / ISG Outlook',
  msGic: 'Morgan Stanley GIC Weekly',
  gsKickstart: 'Goldman Sachs US Weekly Kickstart',
}

// Filename patterns used for auto-detection when user uploads PDFs
export const SOURCE_PATTERNS: Record<SourceKey, RegExp[]> = {
  jpmMarkets: [/guide.to.the.market/i, /gtmus/i, /gto/i],
  jpmView: [/jp.morgan.view/i, /isg.outlook/i, /jpm.*view/i],
  msGic: [/morgan.stanley/i, /ms.*gic/i, /gic.*weekly/i],
  gsKickstart: [/goldman/i, /gs.*kickstart/i, /weekly.kickstart/i],
}

export const SECTIONS: Section[] = [
  {
    id: 'principles',
    title: 'Investment Principles',
    color: VALOR_NAVY,
    slides: [
      { source: 'jpmMarkets', page: 17, label: 'Market Returns' },
      { source: 'jpmMarkets', page: 4, label: 'Long-Run Capital Market Assumptions' },
      { source: 'jpmMarkets', page: 9, label: 'Asset Class Returns' },
      { source: 'jpmMarkets', page: 10, label: 'Diversification' },
      { source: 'jpmMarkets', page: 11, label: 'Volatility & Returns' },
      { source: 'jpmMarkets', page: 15, label: 'Market Timing vs. Staying Invested' },
      { source: 'jpmMarkets', page: 16, label: 'Investor Behavior' },
      { source: 'msGic', page: 2, label: 'MS GIC — Investment Principles' },
    ],
  },
  {
    id: 'economy',
    title: 'Economy',
    color: '1B4F72',
    slides: [
      { source: 'jpmMarkets', page: 18, label: 'US Economic Growth' },
      { source: 'jpmMarkets', page: 19, label: 'US Labor Market' },
      { source: 'jpmMarkets', page: 21, label: 'US Inflation' },
      { source: 'jpmMarkets', page: 22, label: 'Federal Reserve Policy' },
      { source: 'jpmMarkets', page: 28, label: 'Global Growth' },
      { source: 'jpmMarkets', page: 29, label: 'Global Inflation' },
      { source: 'jpmMarkets', page: 33, label: 'Emerging Markets' },
      { source: 'jpmMarkets', page: 36, label: 'China Economy' },
      { source: 'msGic', page: 4, label: 'MS GIC — Economic Outlook' },
    ],
  },
  {
    id: 'equity',
    title: 'Equity',
    color: '1A5276',
    slides: [
      { source: 'jpmMarkets', page: 46, label: 'S&P 500 Earnings' },
      { source: 'jpmMarkets', page: 44, label: 'US Equity Valuations' },
      { source: 'jpmMarkets', page: 58, label: 'International Equity' },
      { source: 'jpmMarkets', page: 59, label: 'Emerging Market Equity' },
      { source: 'jpmMarkets', page: 60, label: 'Equity Sector Allocation' },
      { source: 'msGic', page: 6, label: 'MS GIC — Equity' },
    ],
  },
  {
    id: 'fixedIncome',
    title: 'Fixed Income',
    color: '154360',
    slides: [
      { source: 'jpmMarkets', page: 40, label: 'Fixed Income Returns' },
      { source: 'jpmMarkets', page: 41, label: 'Treasury Yield Curve' },
      { source: 'jpmMarkets', page: 42, label: 'Credit Spreads' },
      { source: 'msGic', page: 8, label: 'MS GIC — Fixed Income' },
    ],
  },
  {
    id: 'appendix',
    title: 'Appendix — AI & Innovation',
    color: '2C3E50',
    slides: [
      { source: 'jpmMarkets', page: 24, label: 'Technology & AI' },
      { source: 'jpmMarkets', page: 25, label: 'AI Capital Expenditure' },
      { source: 'gsKickstart', page: 2, label: 'GS — Current Investment Themes' },
    ],
  },
]
