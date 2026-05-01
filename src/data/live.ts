/**
 * Mastery Live · cohort data
 * ─────────────────────────────────────────────────────────────────────
 * This file populates the /live/dashboard surface for cohort members.
 * It is course-specific (not shared with /dashboard which serves the
 * Multifamily Mastery course) and imports nothing from `courses.ts` —
 * Live is its own product.
 *
 * Data shape today: hard-coded mock data so the page renders end-to-end.
 * Real data sources (in subsequent waves):
 *   • coaching call    → Calendly integration
 *   • deal workspace   → new `deals` table + Netlify Function
 *   • deal memos       → Notion / CMS surface
 *   • weekly reads     → tuesday-multifamily-articles scheduled task output
 */

export interface LiveModule {
  id: string;
  num: number;
  title: string;
  duration: string;
  description: string;
}

export interface CoachingCall {
  /** ISO date for the next call. */
  whenISO: string;
  /** Human-formatted date+time copy (used until Calendly wires in). */
  whenHuman: string;
  /** Topic / focus for the call. */
  focus: string;
  /** Call-prep blurb shown under the date. */
  preBrief: string;
  /** "Add to calendar" deep link. */
  icsHref?: string;
  /** "Submit a question" mailto / form link. */
  questionHref?: string;
}

export interface DealWorkspace {
  /** Deal nickname. */
  name: string;
  /** "Garland 142-unit Class B" — long form. */
  longForm: string;
  status: string;
  yoc: string;
  irr: string;
  coachingFocus: string;
}

export interface DealMemo {
  date: string;
  marketTag: string;
  title: string;
  href?: string;
}

export interface WeeklyRead {
  source: string;
  date: string;
  title: string;
  why: string;
  href?: string;
}

/**
 * The 12 Live-cohort modules. Mirrors the existing Multifamily Mastery
 * curriculum (Mastery course is the curriculum substrate for Live) but
 * stays in this file so Live can evolve independently — e.g. add a
 * dedicated Asset Management module (#11) that doesn't exist in the
 * 12-week course.
 */
export const liveModules: LiveModule[] = [
  { id: 'submarket', num: 1, title: 'Submarket Intelligence', duration: '2.5 hrs', description: 'Identify markets where the math actually works for the next 24 months.' },
  { id: 'sourcing',  num: 2, title: 'Deal Sourcing',           duration: '2.5 hrs', description: 'Build the broker relationships and deal flow that surface real opportunities.' },
  { id: 'underwriting', num: 3, title: 'Underwriting',          duration: '3 hrs',   description: 'Build the model. Defend the assumptions. Walk away when the numbers say so.' },
  { id: 'stress',    num: 4, title: 'Stress Testing & CapEx',  duration: '2.5 hrs', description: 'Sensitize for the bad case. Price the deferred maintenance accurately.' },
  { id: 'debt',      num: 5, title: 'Debt Sourcing',           duration: '3 hrs',   description: 'Agency, bank, bridge — match the debt structure to the deal.' },
  { id: 'loi',       num: 6, title: 'LOI',                     duration: '2 hrs',   description: 'Write the LOI that gets accepted and protects your downside.' },
  { id: 'capital',   num: 7, title: 'Capital Raising',         duration: '2.5 hrs', description: 'Get to "yes" with LPs without losing the economics.' },
  { id: 'ppm',       num: 8, title: 'PPM & Legal',             duration: '2 hrs',   description: 'The securities work. What to delegate, what to read carefully.' },
  { id: 'psa',       num: 9, title: 'PSA & DD',                duration: '2.5 hrs', description: 'Negotiate the PSA. Run a DD that surfaces the surprises before close.' },
  { id: 'pm',        num: 10, title: 'Property Management',    duration: '2 hrs',   description: 'Hire it, fire it, hold it accountable.' },
  { id: 'asset',     num: 11, title: 'Asset Management',       duration: '2 hrs',   description: 'Run the deal week-over-week. Variance reports, KPIs, course corrections.' },
  { id: 'exit',      num: 12, title: 'Exit',                   duration: '2.5 hrs', description: 'Refinance, recapitalize, sell. Time the exit to the cycle.' },
];

/**
 * Mock cohort state — replaced by per-user state when the Live cohort
 * data backend is built. For now everyone (read: Lou) sees the same
 * snapshot below.
 */
export const mockCohortState = {
  cohortName: 'Cohort 2026',
  monthOfTwelve: 2,
  modulesCompleteIds: ['submarket', 'sourcing'],
  moduleInProgressId: 'underwriting',
  moduleInProgressPct: 60,
};

export const mockCoachingCall: CoachingCall = {
  whenISO: '2026-05-05T15:00:00-05:00',
  whenHuman: 'Tuesday, May 5 · 3:00 PM CT',
  focus: 'Garland 142-unit underwriting review',
  preBrief:
    "Diva and Lou will walk your stress test on the rent comps and pressure-test your debt structure. Send any specific questions ahead of the call.",
  icsHref: '#', // Calendly link goes here in the next wave
  questionHref: 'mailto:lou@resciaproperties.com?subject=Coaching%20call%20question',
};

export const mockDeal: DealWorkspace = {
  name: 'Garland · 142-unit Class B',
  longForm: 'Garland, TX · 142 units · Class B value-add',
  status: 'LOI drafted',
  yoc: '7.4%',
  irr: '17.2%',
  coachingFocus: 'This week',
};

export const mockMemos: DealMemo[] = [
  {
    date: 'Apr 28',
    marketTag: 'DFW · Class C',
    title: "Why we passed on the Plano 88-unit — the cap rate didn't reflect the deferred CapEx we surfaced in DD",
  },
  {
    date: 'Apr 22',
    marketTag: 'Phoenix · Class B',
    title: "Submarket read · how we're underwriting West Valley going into Q3 with rent concessions normalizing",
  },
  {
    date: 'Apr 15',
    marketTag: 'Operations',
    title: 'What we changed in our property-management contract this quarter — and why',
  },
];

/**
 * Placeholder weekly reads. Will be replaced each Tuesday by the output
 * of the `tuesday-multifamily-articles` scheduled task once it is wired
 * into a CMS surface.
 */
export const mockWeeklyReads: WeeklyRead[] = [
  {
    source: 'CBRE',
    date: 'Apr 29',
    title: 'Multifamily Cap Rates Compress in Sun Belt Submarkets',
    why: "Worth a 10-min read before Tuesday's call — the Garland comps cite this band.",
  },
  {
    source: 'Multifamily Executive',
    date: 'Apr 27',
    title: 'Bridge Lender Spreads Tighten 35bp Across Q1',
    why: "If you're financing in the next 90 days, this changes your debt math.",
  },
  {
    source: 'Bisnow Multifamily',
    date: 'Apr 26',
    title: 'Texas Property Tax Reform — What Operators Should Watch in 2026',
    why: 'DFW exposure means this is your tax line on every model.',
  },
];
