/**
 * MULTIFAMILY FOUNDATIONS — course data file.
 *
 * Foundations is the top of the Rescia Properties learning ladder. It serves
 * a reader who is still deciding whether multifamily is the right vehicle and,
 * if so, which path (GP / LP / Co-GP / small multifamily). Voiced primarily
 * by Diva, with Lou contributing recurring "From Lou's chair" sidebars.
 *
 * The schema below mirrors the Mastery shape (Course → Module → Topic) but
 * extends it with Foundations-specific elements:
 *   - moduleIntro     — Diva-narrated 1-2 paragraph opener per module
 *   - heroVideoUrl    — reserved video slot per module (v1.1)
 *   - sidebars        — "From Lou's chair" callouts inline within a topic
 *   - myths           — replaces Mastery's "mistakes" (beginners absorb myths,
 *                       not mistakes); each myth has the claim + the reality
 *   - takeawayPdf     — branded one-page printable per module
 *   - selfAssessment  — Module 6 only; scored questionnaire that outputs a
 *                       recommended path and next move
 *
 * v1 ships text + quiz only. Hero videos slot in for v1.1 without rebuilding.
 *
 * STATUS (April 2026):
 *   - Module 1 Topic 1 — populated from the voice-calibration sample as a
 *     working draft. Awaiting Diva sign-off before the rest of Module 1
 *     is written in this voice.
 *   - Modules 1 (Topics 2-5) and 2-6 — structural scaffold only (titles,
 *     summaries, topic IDs, myth premises, quiz topic-IDs). Body content
 *     is empty pending voice calibration.
 *   - Quizzes — topic and difficulty placeholders only; choice writing
 *     follows the same MC pattern as Mastery once content lands.
 */

// ─── Schema ─────────────────────────────────────────────────────────────────

/**
 * A single inline callout from one of the partners, embedded in a Diva-led
 * topic. In v1, all sidebars are authored by Lou ("From Lou's chair"); the
 * `author` field is kept open for future Diva-led sidebars in Mastery.
 */
export interface Sidebar {
  author: 'Lou' | 'Diva';
  /** Optional callout title. Defaults to "From Lou's chair" / "From Diva's chair". */
  title?: string;
  /** 80-120 words of partner-voiced commentary. Markdown supported. */
  body: string;
}

/**
 * Foundations Topic — long-form prose section within a module. Mirrors the
 * Mastery Topic shape with the addition of `videoUrl` (per-topic future
 * expansion) and inline `sidebars`.
 */
export interface FoundationsTopic {
  id: string;
  title: string;
  /** 1-2 sentences shown when the accordion is closed. */
  summary: string;
  /**
   * Long-form Diva-led prose. Markdown supported via the same lightweight
   * renderer as Mastery: `**bold**`, `_italic_`, line breaks, and `> blockquote`
   * for inline sidebars when the schema-level `sidebars` array isn't a fit.
   * 400-700 words is the target band; some topics run shorter.
   */
  body: string;
  /** Reserved per-topic video slot. v1.1+. */
  videoUrl?: string;
  /** Inline "From Lou's chair" callouts. 1-2 per topic in v1. */
  sidebars?: Sidebar[];
  /** Optional worked example, rendered in a highlighted callout. */
  example?: string;
  /** Optional related-topic ids for in-page navigation. */
  related?: string[];
}

/**
 * A single myth + reality pairing. Foundations readers haven't made
 * mistakes yet — they've absorbed myths from forums, social media, and
 * dinner-party conversations. The teaching shape is "you've heard this; here
 * is what is actually true."
 */
export interface Myth {
  /** The myth as the reader has likely heard it. */
  claim: string;
  /** The reality, with operator-grounded reasoning. */
  reality: string;
  /** Optional source topic id for in-page backlink to the deep dive. */
  topicId?: string;
}

/** Same QuizItem shape as Mastery — re-exported for downstream consumers. */
export interface FoundationsQuizItem {
  q: string;
  a: string;
  why?: string;
  trap?: string;
  topicId?: string;
  difficulty?: 'foundation' | 'application' | 'operator';
  choices?: string[];
  correctIndex?: number;
}

/** Branded one-page printable per module. */
export interface TakeawayPdf {
  title: string;
  /**
   * Public-asset path, e.g. `/foundations/takeaways/m1-four-vehicles.pdf`.
   * Empty string until the PDF is produced; the UI hides the download
   * button when the path is empty.
   */
  path: string;
  /** Short blurb shown next to the download button. */
  blurb: string;
}

/**
 * Module 6 self-assessment. Scored questionnaire that outputs a recommended
 * path (GP / LP / Co-GP / small multifamily) plus a next-move blurb.
 */
export interface SelfAssessmentQuestion {
  id: string;
  prompt: string;
  /** Each answer carries weights toward each of the four paths. */
  options: Array<{
    label: string;
    weights: { gp: number; lp: number; coGp: number; smallMf: number };
  }>;
}

export interface SelfAssessmentPathOutput {
  path: 'gp' | 'lp' | 'coGp' | 'smallMf';
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface SelfAssessment {
  /** Diva-narrated intro paragraph for the assessment screen. */
  intro: string;
  questions: SelfAssessmentQuestion[];
  outputs: SelfAssessmentPathOutput[];
}

export interface FoundationsModule {
  id: string;
  title: string;
  /** One-line subtitle shown on cards. */
  description: string;
  /** Estimated reading time, e.g. "~45 min". */
  duration: string;
  /** Reserved hero-video slot per module. v1.1+. */
  heroVideoUrl?: string;
  /**
   * Diva's opening — 1-2 paragraphs that set the question the module
   * answers and warm the reader into the prose.
   */
  moduleIntro: string;
  topics: FoundationsTopic[];
  myths: Myth[];
  quiz: FoundationsQuizItem[];
  takeaway: TakeawayPdf;
  /** Module 6 only. */
  selfAssessment?: SelfAssessment;
}

export interface FoundationsCourse {
  id: string;
  title: string;
  /** Marketing tagline used on the landing page and dashboard tile. */
  tagline: string;
  /** Two-sentence positioning paragraph used on the dashboard. */
  description: string;
  /** USD price for the English edition. Spanish held open. */
  priceUsd: number;
  modules: FoundationsModule[];
}

// ─── Authoring placeholders ─────────────────────────────────────────────────

/**
 * Marker string used in any `body` field that is still awaiting
 * voice-calibrated authoring. The course-page UI renders this as a
 * "Coming soon" notice rather than showing a blank section.
 */
export const PENDING_VOICE: string =
  '__PENDING_VOICE__: This section is awaiting voice-calibrated authoring.';

// ─── Course data ────────────────────────────────────────────────────────────

export const FOUNDATIONS_COURSE: FoundationsCourse = {
  id: 'multifamily-foundations',
  title: 'Multifamily Foundations',
  tagline: 'Decide whether multifamily is right for you — and how to participate.',
  description:
    'A self-paced course for readers who are still deciding whether multifamily belongs in their wealth-building plan. Six modules, roughly six hours of reading, designed to leave you with clarity on the vehicle, the math, and the path that fits your capital, time, and temperament.',
  priceUsd: 99,
  modules: [
    // ─── Module 1 ───────────────────────────────────────────────────────────
    {
      id: 'm1-why-multifamily',
      title: 'Module 1 · Why Multifamily',
      description:
        'The four wealth vehicles a beginner is comparing — and where multifamily wins, loses, and fits.',
      duration: '~45 min',
      heroVideoUrl: '',
      moduleIntro:
        "Welcome to Foundations. I'm so glad you're here.\n\nBefore we begin, a small confession. The first time someone explained multifamily to me, I nodded along and pretended I understood about half of it. Cap rates, NOI, agency debt, GP, LP — the words came at me faster than I could absorb them, and I walked away from that conversation thinking _maybe this isn't for me_.\n\nIt turned out it was for me. I just hadn't been given the room to learn it at my own pace.\n\nThis module is exactly that room. Over the next forty-five minutes we're going to slow down and look at multifamily honestly — what makes it different from other ways of building wealth, where its real edge comes from, and, just as importantly, where it loses to the alternatives. Because there _are_ alternatives. The question is not whether multifamily is good. The question is whether multifamily is the right fit for you, right now.\n\nBy the end of this module you'll be able to answer that question for yourself. Not through a sales pitch. Through math, structure, and a few honest comparisons.\n\nLet's begin.",
      topics: [
        {
          id: 'm1-t1-four-vehicles',
          title: 'The four wealth vehicles a beginner is comparing',
          summary:
            'Single-family rental, REIT, LP investment, and direct multifamily ownership — five dimensions, very different shapes.',
          body:
            "Most readers who arrive at multifamily are not arriving from a blank page. You are already doing _something_ with your money. Maybe you own a single-family rental. Maybe you have a brokerage account with a few REITs in it. Maybe a friend has invited you to put money into a deal as a passive investor and you are trying to decide if that is wise. Maybe you have a 401(k) and a feeling that there is more out there.\n\nWhatever brought you here, you are comparing — even if you have not named the comparison yet. So let's name it.\n\nThere are four wealth vehicles a beginner most often weighs against multifamily. Each one is real. Each one works for _somebody_. And each one has a different shape — different capital required, different time required, different control over the outcome, different tax treatment, and a meaningfully different ten-year wealth math.\n\nThe four are these.\n\n**The single-family rental.** One house, one tenant, one mortgage. You own it directly, you operate it directly, and the math fits on a single piece of paper.\n\n**The publicly-traded REIT.** You buy shares in a real-estate investment trust on the stock exchange. The diversification is built in, the liquidity is total, the control is zero.\n\n**The LP investment in someone else's multifamily deal.** You write a check into a deal that another operator has put together. You receive distributions and a share of the exit. You do not run anything; you choose well, and then you wait.\n\n**Direct multifamily ownership.** What most of this course will introduce. You — usually with partners — buy and operate an apartment community with the intention of improving its income and value over time.\n\nEach of these vehicles can build wealth. They build it differently. And the differences are not subtle.\n\nThe honest comparison across these four vehicles runs along five dimensions. Hold them in mind for the rest of the module: capital required at entry, time you must give it each week, how much control you have over the outcome, how the IRS treats your gains, and what the actual ten-year wealth math looks like under realistic assumptions.\n\nSome of these dimensions favor multifamily decisively. Some of them do not. By the end of Topic 4 we will have walked through the head-to-head numbers, and you will have a much clearer view of which vehicle deserves your next dollar.\n\nBefore we go there, though, we need to understand one thing about multifamily that explains _why_ it shows up so well on certain dimensions: the source of its returns is fundamentally different from the others on the list. We turn to that next.",
          sidebars: [
            {
              author: 'Lou',
              title: "From Lou's chair",
              body:
                "I'll cut in here, because Diva is being generous and I want to be specific.\n\nOf the four vehicles she just listed, the dimension I care about most is _control over outcome_. Single-family ownership gives you control but the math is small — one tenant, one rent, one slow improvement at a time. REITs give you no control, and the returns reflect that; they trade like equities and they perform like equities. LP investment trades control for passivity, which is fine if you choose your operator well — the work just shifts from operating the deal to vetting the operator. Direct multifamily ownership is the only one of the four where you can _manufacture_ value through operations. You change the income, you change the value. That is the whole game, and it is the reason I do this for a living.\n\nIf control over outcome matters less to you than it does to me, you may land somewhere different on this comparison. Both answers are legitimate. Module 3 walks through the four ways to participate so you can find your fit honestly.",
            },
          ],
          related: ['m1-t2-edge-source', 'm3-t1-gp-path'],
        },
        {
          id: 'm1-t2-edge-source',
          title: "Where multifamily's edge actually comes from",
          summary:
            'Forced appreciation through NOI improvement vs. market appreciation — why returns become operator-controlled rather than market-controlled.',
          body: PENDING_VOICE,
          related: ['m1-t1-four-vehicles', 'm1-t4-ten-year-math', 'm5-t1-noi'],
        },
        {
          id: 'm1-t3-where-it-loses',
          title: 'Where multifamily loses',
          summary:
            'Illiquidity, operator dependence, personal-guarantee risk on debt, and the limits of LP passivity. The honest list.',
          body: PENDING_VOICE,
          related: ['m1-t5-fit', 'm3-t2-lp-path'],
        },
        {
          id: 'm1-t4-ten-year-math',
          title: 'The 10-year math',
          summary:
            "$200K invested in single-family vs. multifamily LP vs. operating one's own multifamily — realistic returns, side-by-side.",
          body: PENDING_VOICE,
          related: ['m1-t1-four-vehicles', 'm5-t5-irr'],
        },
        {
          id: 'm1-t5-fit',
          title: "Who multifamily is right for, who it isn't",
          summary:
            'Self-assessment criteria: capital, time horizon, risk tolerance, operator inclination. Reader leaves Module 1 knowing whether to continue.',
          body: PENDING_VOICE,
          related: ['m6-t1-self-assessment'],
        },
      ],
      myths: [
        {
          claim: 'Multifamily is for the rich.',
          reality:
            'LP entry can be $25K-$50K with the right operator. Operator entry needs more capital and credit, but is reachable through partnerships — which Module 3 covers.',
          topicId: 'm1-t1-four-vehicles',
        },
        {
          claim: 'You need to be in real estate full-time.',
          reality:
            'Many operators are professionals with day jobs. The structure that supports this is what Multifamily Mastery teaches — Foundations is the orientation step before that decision.',
          topicId: 'm1-t5-fit',
        },
        {
          claim: 'Cash flow is the point.',
          reality:
            'Equity growth dominates returns over a typical hold. Cash flow is the byproduct that makes the wait tolerable, not the destination.',
          topicId: 'm1-t2-edge-source',
        },
        {
          claim: 'Cap rates are the most important number.',
          reality:
            'Cap rate is the headline number, not the whole story. DSCR, leverage, and exit assumptions matter more for actual returns. Module 5 introduces the full vocabulary.',
          topicId: 'm5-t2-cap-rate',
        },
        {
          claim: 'It is too late — all the deals are gone.',
          reality:
            'Markets cycle. The deal pipeline is always relative to capital and patience. Operators who wait through dry spells outperform operators who chase activity.',
          topicId: 'm1-t3-where-it-loses',
        },
        {
          claim: 'Real estate always goes up.',
          reality:
            'It does not, and sophisticated investors expect this. Stress-testing for downside scenarios is what Module 5 of Mastery covers in detail; we touch it in this course at Module 5.',
          topicId: 'm1-t3-where-it-loses',
        },
      ],
      quiz: [
        // Voice-calibrated quiz items follow the same MC schema as Mastery.
        // Authoring deferred until module body content is finalized.
        {
          q: '',
          a: '',
          topicId: 'm1-t1-four-vehicles',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm1-t2-edge-source',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm1-t2-edge-source',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm1-t3-where-it-loses',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm1-t5-fit',
          difficulty: 'application',
        },
      ],
      takeaway: {
        title: 'The Four Wealth Vehicles, Compared',
        path: '',
        blurb:
          'A one-page side-by-side of the four wealth vehicles across the five dimensions that matter for a beginner.',
      },
    },

    // ─── Module 2 ───────────────────────────────────────────────────────────
    {
      id: 'm2-five-million-deal',
      title: 'Module 2 · The $5M Deal Walkthrough',
      description:
        'A real (anonymized) Rescia deal walked end-to-end — purchase, capital stack, year 1, year 3, projected exit.',
      duration: '~50 min',
      heroVideoUrl: '',
      moduleIntro: PENDING_VOICE,
      topics: [
        {
          id: 'm2-t1-meet-the-deal',
          title: 'Meet the deal',
          summary:
            "A 50-80 unit garden-style multifamily in a target submarket. Anonymized but real. Why we bought it.",
          body: PENDING_VOICE,
          related: ['m2-t2-capital-stack'],
        },
        {
          id: 'm2-t2-capital-stack',
          title: 'The capital stack',
          summary:
            'How a $5M deal is funded: $3.75M debt at 75% LTV, $1.25M equity from LPs, plus closing costs and reserves.',
          body: PENDING_VOICE,
          related: ['m2-t1-meet-the-deal', 'm2-t3-year-one', 'm5-t4-leverage'],
        },
        {
          id: 'm2-t3-year-one',
          title: 'Year 1 performance',
          summary:
            'Rents at acquisition vs. month 12. Operating expenses normalized. NOI achieved. DSCR check. Distributions.',
          body: PENDING_VOICE,
          related: ['m2-t4-year-three', 'm5-t1-noi', 'm5-t3-dscr'],
        },
        {
          id: 'm2-t4-year-three',
          title: "Year 3 — what's working, what isn't",
          summary:
            'Honest mid-hold update. Some assumptions hit, some missed, renovations that ran long. No victory lap.',
          body: PENDING_VOICE,
          related: ['m2-t3-year-one', 'm2-t5-exit'],
        },
        {
          id: 'm2-t5-exit',
          title: 'Projected exit',
          summary:
            'Year 5 sale at projected NOI × exit cap. IRR to LPs. IRR to GP. What changes the picture: cap movement, refi-and-hold, hold extension.',
          body: PENDING_VOICE,
          related: ['m2-t4-year-three', 'm5-t5-irr'],
        },
      ],
      myths: [
        {
          claim: "The seller's pro forma is the right number.",
          reality:
            'Operator underwriting is independent. The seller writes the proforma to maximize price; the buyer writes the underwrite to defend the basis. They are different documents with different jobs.',
          topicId: 'm2-t1-meet-the-deal',
        },
        {
          claim: 'If it cash flows on day one, it is a good deal.',
          reality:
            'Day-one cash flow is necessary but not sufficient. The question is whether the deal cash-flows under stress and whether it appreciates in value over the hold. Many deals cash-flow on day one and still lose money over five years.',
          topicId: 'm2-t3-year-one',
        },
        {
          claim: 'All deals work out.',
          reality:
            'They do not. Deals fail for predictable reasons — bad market read, optimistic underwriting, debt that does not survive a rate move, capex that runs over. Module 5 of Mastery is built around the deals that do not work.',
          topicId: 'm2-t4-year-three',
        },
        {
          claim: 'GP and LP make the same returns.',
          reality:
            'They do not. The GP earns a promote and shares the upside through a waterfall. The LP earns a pref and a smaller share of the upside in exchange for not doing any work.',
          topicId: 'm2-t2-capital-stack',
        },
        {
          claim: 'Bigger is always better.',
          reality:
            'Bigger means agency-debt access and operational economies of scale, but also more complexity and a smaller buyer pool at exit. Many of the best deals sit in the 50-150 unit "middle market" precisely because the big shops cannot be bothered with them.',
          topicId: 'm2-t1-meet-the-deal',
        },
      ],
      quiz: [
        {
          q: '',
          a: '',
          topicId: 'm2-t2-capital-stack',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm2-t3-year-one',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm2-t1-meet-the-deal',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm2-t2-capital-stack',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm2-t4-year-three',
          difficulty: 'operator',
        },
      ],
      takeaway: {
        title: 'The Anatomy of a $5M Deal',
        path: '',
        blurb:
          'A one-page deal summary visual — capital stack, year 1, year 3, exit, with operator commentary. Show this to a partner and explain a deal in 60 seconds.',
      },
    },

    // ─── Module 3 ───────────────────────────────────────────────────────────
    {
      id: 'm3-four-paths',
      title: 'Module 3 · The Four Ways to Participate',
      description:
        'GP, LP, Co-GP, and self-managed small multifamily — four distinct paths with different capital, time, and control profiles.',
      duration: '~45 min',
      heroVideoUrl: '',
      moduleIntro: PENDING_VOICE,
      topics: [
        {
          id: 'm3-t1-gp-path',
          title: 'Path 1: GP / Operator',
          summary:
            'You source, underwrite, raise, close, and operate. Highest control, highest upside, highest workload. The path Mastery teaches.',
          body: PENDING_VOICE,
          related: ['m3-t3-cogp-path', 'm6-t3-mastery-route'],
        },
        {
          id: 'm3-t2-lp-path',
          title: 'Path 2: LP / Passive Investor',
          summary:
            "You write a check into someone else's deal, receive distributions and a share of exit, and do no operating work.",
          body: PENDING_VOICE,
          related: ['m3-t3-cogp-path', 'm6-t2-lp-route'],
        },
        {
          id: 'm3-t3-cogp-path',
          title: 'Path 3: JV / Co-GP',
          summary:
            "You partner with an experienced operator — capital plus a specialized skill. The bridge from LP to GP.",
          body: PENDING_VOICE,
          related: ['m3-t1-gp-path', 'm6-t4-bespoke-route'],
        },
        {
          id: 'm3-t4-small-mf-path',
          title: 'Path 4: Self-managed small multifamily',
          summary:
            "2-4 units, often owner-occupied, conventional financing. Hands-on, accessible, and a fundamentally different game from institutional multifamily.",
          body: PENDING_VOICE,
          related: ['m6-t5-small-mf-route'],
        },
      ],
      myths: [
        {
          claim: 'LP is fully passive.',
          reality:
            'Selecting operators IS the work. The LP who chooses operators well outperforms the LP who chooses operators poorly by far more than any operator chooses one deal over another. Diligence is the active part of "passive."',
          topicId: 'm3-t2-lp-path',
        },
        {
          claim: 'GP is just for full-time real estate people.',
          reality:
            'A meaningful share of operators we know got their start while holding a day job. The structure is the answer — partnerships, third-party property management, and disciplined deal pacing make GP work for someone with limited weekly hours.',
          topicId: 'm3-t1-gp-path',
        },
        {
          claim: 'Co-GP does not require capital.',
          reality:
            'Almost always does, just less than going it alone. Co-GP economics depend on what you bring — capital, capital-raising network, asset-management experience, broker relationships — and the split reflects the contribution.',
          topicId: 'm3-t3-cogp-path',
        },
        {
          claim: 'Small multifamily scales naturally to large multifamily.',
          reality:
            'It does not. The financing is different, the operations are different, the capital sources are different. Operators who scale from a duplex to a 100-unit deal usually do so by abandoning the duplex playbook entirely.',
          topicId: 'm3-t4-small-mf-path',
        },
        {
          claim: 'You should pick a path and stick to it.',
          reality:
            'Many operators move through paths over a career — start as an LP, become a Co-GP, become a GP, return to LP positions later for diversification. The path is not a tattoo.',
          topicId: 'm3-t1-gp-path',
        },
      ],
      quiz: [
        {
          q: '',
          a: '',
          topicId: 'm3-t1-gp-path',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm3-t2-lp-path',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm3-t2-lp-path',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm3-t3-cogp-path',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm3-t4-small-mf-path',
          difficulty: 'operator',
        },
      ],
      takeaway: {
        title: 'The Four Paths Decision Tree',
        path: '',
        blurb:
          'A flowchart that takes capital, hours-per-week, and control preference inputs and surfaces the right path. The lead-in for the Module 6 self-assessment.',
      },
    },

    // ─── Module 4 ───────────────────────────────────────────────────────────
    {
      id: 'm4-reading-the-market',
      title: 'Module 4 · Reading the Market',
      description:
        'Four demand drivers — wages, jobs, households, supply — explain almost everything that matters for rent growth.',
      duration: '~45 min',
      heroVideoUrl: '',
      moduleIntro: PENDING_VOICE,
      topics: [
        {
          id: 'm4-t1-four-drivers',
          title: 'The four demand drivers',
          summary:
            'Why these four and not a longer list. What each one tells you. Which one matters most when.',
          body: PENDING_VOICE,
          related: ['m4-t2-where-to-find', 'm4-t3-good-market'],
        },
        {
          id: 'm4-t2-where-to-find',
          title: 'Where to find each one — free and low-cost sources',
          summary:
            'BLS for jobs. Census ACS for wages and households. Public permitting and free supply trackers. The actual links and how to read the dashboards.',
          body: PENDING_VOICE,
          related: ['m4-t1-four-drivers', 'm4-t4-costar-myth'],
        },
        {
          id: 'm4-t3-good-market',
          title: 'What "a good market" looks like',
          summary:
            'Numeric thresholds as orientation, not absolutes. Wage above national average, job diversity, positive household formation, supply pipeline below 2% of stock.',
          body: PENDING_VOICE,
          related: ['m4-t1-four-drivers'],
        },
        {
          id: 'm4-t4-costar-myth',
          title: "Why CoStar isn't the answer",
          summary:
            'It is expensive and many beginners think they need it. They do not. Free sources cover 80% of what matters at the orientation stage.',
          body: PENDING_VOICE,
          related: ['m4-t2-where-to-find'],
        },
      ],
      myths: [
        {
          claim: 'Sun Belt always wins.',
          reality:
            'Pre-2022, Sun Belt rent growth was extreme. Post-2022, supply pipelines in many Sun Belt MSAs swung the picture sharply. The driver math still works — but the answer in 2024 is not the answer in 2021.',
          topicId: 'm4-t3-good-market',
        },
        {
          claim: 'Population growth is enough.',
          reality:
            'Population growth without wage growth means lower-income arrivals — students, retirees, service-sector migration. None of those translate cleanly into higher-rent-paying tenants.',
          topicId: 'm4-t1-four-drivers',
        },
        {
          claim: 'Supply does not matter if demand is strong.',
          reality:
            'Supply absorbs demand. A market with strong demand but a 5% delivery pipeline still sees concessions climb and pricing power shrink during the absorption period. Both matter.',
          topicId: 'm4-t1-four-drivers',
        },
        {
          claim: 'Cap rates predict the future.',
          reality:
            'Cap rates reflect today\'s price for today\'s NOI. Future returns depend on future NOI and future cap rate — both of which are functions of demand drivers, not the cap rate itself.',
          topicId: 'm5-t2-cap-rate',
        },
        {
          claim: 'Big cities are safer.',
          reality:
            'Many big cities have weak fundamentals (high rent-to-income, slowing wage growth, restrictive regulation), and many secondary cities have strong ones. The driver math does not care about city size.',
          topicId: 'm4-t3-good-market',
        },
      ],
      quiz: [
        {
          q: '',
          a: '',
          topicId: 'm4-t1-four-drivers',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm4-t1-four-drivers',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm4-t2-where-to-find',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm4-t3-good-market',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm4-t1-four-drivers',
          difficulty: 'operator',
        },
      ],
      takeaway: {
        title: 'The Four Demand Drivers — Free Sources Cheat Sheet',
        path: '',
        blurb:
          'One page. Each driver, the authoritative free source, and how to read the dashboard in under 10 minutes.',
      },
    },

    // ─── Module 5 ───────────────────────────────────────────────────────────
    {
      id: 'm5-underwriting-basics',
      title: 'Module 5 · Underwriting Basics',
      description:
        'Five numbers explain almost everything about a multifamily deal. The vocabulary, not the model.',
      duration: '~45 min',
      heroVideoUrl: '',
      moduleIntro: PENDING_VOICE,
      topics: [
        {
          id: 'm5-t1-noi',
          title: 'NOI — net operating income',
          summary:
            'What it is, what it is not (debt service is below the line; capex is below the line). Why every other number flows from this one.',
          body: PENDING_VOICE,
          related: ['m5-t2-cap-rate', 'm2-t3-year-one'],
        },
        {
          id: 'm5-t2-cap-rate',
          title: 'Cap rate — the relationship between NOI and value',
          summary:
            'value = NOI ÷ cap rate. Low cap = expensive, high cap = cheap, all else equal. What "all else equal" actually means.',
          body: PENDING_VOICE,
          related: ['m5-t1-noi'],
        },
        {
          id: 'm5-t3-dscr',
          title: 'DSCR — debt service coverage ratio',
          summary:
            'Why lenders care. Where the floors are (1.20x, 1.25x typical agency). What happens when DSCR drops below the floor mid-hold.',
          body: PENDING_VOICE,
          related: ['m5-t4-leverage', 'm2-t3-year-one'],
        },
        {
          id: 'm5-t4-leverage',
          title: 'Leverage — and the trap inside it',
          summary:
            'Higher leverage = higher IRR-on-equity in good times, faster wipeout in bad times. The asymmetric risk reader must understand.',
          body: PENDING_VOICE,
          related: ['m5-t3-dscr', 'm5-t5-irr'],
        },
        {
          id: 'm5-t5-irr',
          title: 'IRR — and why it can mislead',
          summary:
            'What IRR is, why operators quote it, why it can be gamed (assumed exit cap, distribution timing). Read IRRs with assumptions visible.',
          body: PENDING_VOICE,
          related: ['m5-t4-leverage', 'm2-t5-exit'],
        },
      ],
      myths: [
        {
          claim: 'Higher IRR = better deal.',
          reality:
            'Not without seeing the assumptions. A 22% IRR built on an aggressive exit cap can be much weaker than a 16% IRR built on a defensible one. The number alone tells you nothing.',
          topicId: 'm5-t5-irr',
        },
        {
          claim: 'Leverage is always good.',
          reality:
            'It is good when things go right. When they do not, leverage compounds the loss the same way it compounds the gain. The IRR uplift from leverage is the price of the asymmetric risk.',
          topicId: 'm5-t4-leverage',
        },
        {
          claim: 'Cash-on-cash is the same as IRR.',
          reality:
            'They are different metrics with different uses. Cash-on-cash is a current-yield measure; IRR is a time-weighted measure that includes appreciation. A deal can have strong cash-on-cash and weak IRR, or vice versa.',
          topicId: 'm5-t5-irr',
        },
        {
          claim: 'Cap rates predict appreciation.',
          reality:
            'Cap rates reflect today\'s price for today\'s NOI. Appreciation is about future NOI growth and future cap-rate movement — both unrelated to where the cap is today.',
          topicId: 'm5-t2-cap-rate',
        },
        {
          claim: 'DSCR does not matter if you can cover the payment.',
          reality:
            'Lenders disagree. Loan covenants typically tie to DSCR thresholds, not actual default — fall below the covenant and the lender has rights even if you are still paying. Covenants are real.',
          topicId: 'm5-t3-dscr',
        },
      ],
      quiz: [
        {
          q: '',
          a: '',
          topicId: 'm5-t1-noi',
          difficulty: 'foundation',
        },
        {
          q: '',
          a: '',
          topicId: 'm5-t2-cap-rate',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm5-t3-dscr',
          difficulty: 'application',
        },
        {
          q: '',
          a: '',
          topicId: 'm5-t4-leverage',
          difficulty: 'operator',
        },
        {
          q: '',
          a: '',
          topicId: 'm5-t5-irr',
          difficulty: 'application',
        },
      ],
      takeaway: {
        title: 'The Five Numbers — A Multifamily Vocabulary Card',
        path: '',
        blurb:
          'One page. Five formulas, plain-English interpretation, and the trap to avoid for each. Members who finish Foundations are expected to have this card memorized.',
      },
    },

    // ─── Module 6 ───────────────────────────────────────────────────────────
    {
      id: 'm6-your-next-step',
      title: 'Module 6 · Your Next Step',
      description:
        'A scored self-assessment plus an honest path map — including the path Rescia is not the right partner for.',
      duration: '~30 min',
      heroVideoUrl: '',
      moduleIntro: PENDING_VOICE,
      topics: [
        {
          id: 'm6-t1-self-assessment',
          title: 'The self-assessment',
          summary:
            "A scored questionnaire that takes capital, hours, risk tolerance, operator inclination, geographic flexibility, and partner availability — and outputs a recommended path and next move.",
          body: PENDING_VOICE,
          related: ['m6-t2-lp-route', 'm6-t3-mastery-route', 'm6-t4-bespoke-route', 'm6-t5-small-mf-route'],
        },
        {
          id: 'm6-t2-lp-route',
          title: 'If you scored toward LP',
          summary:
            'Choosing operators is the work. Diligence questions, red flags, and how to start a conversation with Rescia about LP relationships.',
          body: PENDING_VOICE,
          related: ['m3-t2-lp-path'],
        },
        {
          id: 'm6-t3-mastery-route',
          title: 'If you scored toward GP / Operator',
          summary:
            'Multifamily Mastery is the curriculum that takes you from "I understand the vocabulary" to "I can underwrite a deal, raise capital, and operate." 12 weeks, self-paced.',
          body: PENDING_VOICE,
          related: ['m3-t1-gp-path'],
        },
        {
          id: 'm6-t4-bespoke-route',
          title: 'If you scored toward Co-GP / partnership',
          summary:
            'Bespoke 1:1 coaching with Lou and Diva — twelve months of working alongside two experienced operators while you close your first deal. $20K, cohort-capped.',
          body: PENDING_VOICE,
          related: ['m3-t3-cogp-path'],
        },
        {
          id: 'm6-t5-small-mf-route',
          title: 'If you scored toward small multifamily',
          summary:
            'A great path, but not the one Rescia teaches. Honest hand-off to external resources. Reader trust comes from this exact moment.',
          body: PENDING_VOICE,
          related: ['m3-t4-small-mf-path'],
        },
      ],
      myths: [
        {
          claim: 'You have to commit to a path forever.',
          reality:
            'No — many operators evolve over a career. Start as LP, become Co-GP, become GP, return to LP positions later for diversification. The path is not a tattoo.',
          topicId: 'm6-t1-self-assessment',
        },
        {
          claim: 'Bigger goals require bigger first steps.',
          reality:
            'Often the opposite. The operators who eventually run institutional portfolios usually started by doing one small thing well. Speed of first step is a worse predictor of outcome than thoughtfulness of first step.',
          topicId: 'm6-t1-self-assessment',
        },
        {
          claim: 'If you are not ready for Mastery, you are behind.',
          reality:
            'You are not behind. You are at the right step. Foundations exists precisely because the right next step varies — for some readers it is Mastery, for some it is LP investing, for some it is small multifamily, and for some it is patience.',
          topicId: 'm6-t1-self-assessment',
        },
      ],
      // Module 6's "quiz" IS the self-assessment, handled below.
      quiz: [],
      takeaway: {
        title: 'Your Multifamily Path — A Personalized Next-Step Plan',
        path: '',
        blurb:
          'Generated from the self-assessment scoring. Your name, your score, your recommended path, and your recommended next move. The lead artifact for the conversion conversation.',
      },
      selfAssessment: {
        intro: PENDING_VOICE,
        questions: [
          // Six question slots from the curriculum doc; questions and weights
          // authored once Diva signs off on Module 6 voice.
          { id: 'sa-q1-capital', prompt: '', options: [] },
          { id: 'sa-q2-hours', prompt: '', options: [] },
          { id: 'sa-q3-risk', prompt: '', options: [] },
          { id: 'sa-q4-operator-inclination', prompt: '', options: [] },
          { id: 'sa-q5-geographic-flexibility', prompt: '', options: [] },
          { id: 'sa-q6-partner-availability', prompt: '', options: [] },
        ],
        outputs: [
          {
            path: 'gp',
            headline: 'Your fit is GP / Operator.',
            body: PENDING_VOICE,
            ctaLabel: 'Start Multifamily Mastery',
            ctaHref: 'https://resciapropertiesmentorship.com/pricing',
          },
          {
            path: 'lp',
            headline: 'Your fit is LP / Passive Investor.',
            body: PENDING_VOICE,
            ctaLabel: 'Start a conversation about LP investing with Rescia',
            ctaHref: 'mailto:invest@resciaproperties.com?subject=Foundations%20-%20LP%20conversation',
          },
          {
            path: 'coGp',
            headline: 'Your fit is Co-GP / Partnership.',
            body: PENDING_VOICE,
            ctaLabel: 'Apply for the Bespoke 12-month program',
            ctaHref: 'mailto:hello@resciaproperties.com?subject=Foundations%20-%20Bespoke%20screening',
          },
          {
            path: 'smallMf',
            headline: 'Your fit is self-managed small multifamily.',
            body: PENDING_VOICE,
            ctaLabel: 'Recommended external resources',
            ctaHref: '#',
          },
        ],
      },
    },
  ],
};

export default FOUNDATIONS_COURSE;
