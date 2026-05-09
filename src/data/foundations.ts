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
  title: 'Multifamily 101',
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
        "Welcome to Multifamily 101. I'm so glad you're here.\n\nBefore we begin, a small confession. The first time someone explained multifamily to me, I nodded along and pretended I understood about half of it. Cap rates, NOI, agency debt, GP, LP — the words came at me faster than I could absorb them, and I walked away from that conversation thinking _maybe this isn't for me_.\n\nIt turned out it was for me. I just hadn't been given the room to learn it at my own pace.\n\nThis module is exactly that room. Over the next forty-five minutes we're going to slow down and look at multifamily honestly — what makes it different from other ways of building wealth, where its real edge comes from, and, just as importantly, where it loses to the alternatives. Because there _are_ alternatives. The question is not whether multifamily is good. The question is whether multifamily is the right fit for you, right now.\n\nBy the end of this module you'll be able to answer that question for yourself. Not through a sales pitch. Through math, structure, and a few honest comparisons.\n\nLet's begin.",
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
          body:
            "There is one idea at the heart of multifamily that, once you understand it, makes everything else click. I want to slow down and walk you through it carefully, because the rest of this course depends on it.\n\nMost real estate, most of the time, appreciates because the _market_ appreciates. Single-family houses are the obvious example. You buy a home, you live in it for ten years, and one day you sell it for more than you paid. What happened in those ten years? Mostly: the world around your house changed. The neighborhood improved, or the city grew, or interest rates fell, or new buyers arrived with deeper pockets. You did not personally cause your house to be worth more. You held it while the tide came in.\n\nThat kind of appreciation is real. It builds wealth. But it has a quiet problem: _you do not control it._\n\nMultifamily is different. Multifamily can grow in value the same way single-family does — riding market tides — but it has a second engine that single-family does not. Operators call that second engine **forced appreciation**, and it is the actual reason multifamily attracts the kind of capital it does.\n\nHere is the mechanism, in plain English. Multifamily is valued by a formula. Not by what someone is willing to pay because they like the kitchen. Not by what comparable houses sold for last quarter. By a formula.\n\n> **Value = Net Operating Income ÷ Cap Rate**\n\nLet's not let the words \"net operating income\" and \"cap rate\" intimidate you. We will spend a whole module on them later. For right now, just hold this in your mind: a multifamily property is worth its annual income divided by a small decimal number that the market sets. If the income goes up, the value goes up. If the cap rate goes down (meaning the market is willing to pay more for the same income), the value also goes up. They are levers.\n\n_The first lever is the one you control._\n\nLet me make this concrete with a single example, with very round numbers so the arithmetic stays out of the way.\n\nImagine a small apartment community that earns **$300,000 per year** in net operating income. The market values it at a **6% cap rate**. The property is therefore worth $300,000 ÷ 0.06 = **$5,000,000**.\n\nNow imagine you own that property. Over the next two years, you do the unglamorous work of operating it well. You raise rents to where the submarket actually supports them. You bill back utilities to tenants in the way the lease allows. You renegotiate the property-management contract. You upgrade twenty unit interiors and lift the rents on those units. None of this is a magic trick. It is operations.\n\nAt the end of two years, the property earns **$360,000 per year** in net operating income. That is a $60,000 lift — a 20% improvement in NOI from the work you did, not from the market doing anything.\n\nWhat is the property worth now?\n\n$360,000 ÷ 0.06 = **$6,000,000**.\n\nThe property is worth a million dollars more than it was two years ago, _and the only thing that changed is what is happening inside the property._ The submarket did not move. Cap rates did not move. The buyer and the seller and the appraiser all looked at the same world and saw a property worth more, because the formula they all use to value it produced a bigger number.\n\nThis is forced appreciation. It is not magic. It is not luck. It is operational improvement, run through a valuation formula. And it is the reason multifamily returns can outpace the wealth vehicles we listed in Topic 1, because it lets the operator manufacture appreciation instead of waiting for it.\n\nIt is also the reason multifamily is not for everyone. Forced appreciation requires _someone_ to do the operating. If you choose to be a passive LP, you are paying someone else to do this work, and you share the upside with them. If you choose to be the operator, the upside is larger, and so is the workload. Module 3 will walk through that fork in the road. For now, what matters is that you understand where the value comes from.\n\nIf you take one idea away from this module, take this one: **the engine of multifamily is operations, not the market.**",
          sidebars: [
            {
              author: 'Lou',
              title: "From Lou's chair",
              body:
                "Diva walked you through the math. I want to give you the shape of it from the operator's seat.\n\nWhen we look at a deal, the very first question we ask is _where is the lift?_ Not whether there is a lift — every broker selling you a deal has a story about a lift — but specifically, where it actually comes from and whether we believe we can capture it. Sometimes it is rent: in-place rents are below market and the leases roll. Sometimes it is expenses: the prior owner was paying retail for everything and we know the wholesale price. Sometimes it is income the prior owner was leaving on the table — covered parking, pet rent, RUBS billing for utilities. Each of these maps to a number we have to actually go execute on after we close.\n\nIf I cannot point to a specific operational change worth a specific number of dollars, I will not buy the deal. The market giveth and the market taketh away. The lift we cause ourselves is the only part of the return I am confident in underwriting.",
            },
            {
              author: 'Lou',
              title: "From Lou's chair · the cap rate part",
              body:
                "Diva said the cap rate could move and the value would move with it. She is right, and I will tell you why operators worry about that.\n\nIn the example, the cap rate stayed at 6%. In real life it moves. It can move with you — a falling cap rate (call it 5.5%) makes that same $360K of NOI worth $6.55M instead of $6M. That is the wind at your back. It can also move against you. A rising cap rate (call it 6.5%) makes that same $360K of NOI worth $5.54M. The wind in your face.\n\nWe do not know which way the wind will blow when we sell. So we do two things. We underwrite to a cap rate worse than today's, on purpose, so we are not counting on the wind. And we focus our work on the one lever we control — the NOI. If we are right about the operations, we still win when the wind is in our face. If we are wrong about the operations, no amount of cap rate compression saves the deal.",
            },
          ],
          related: ['m1-t1-four-vehicles', 'm1-t4-ten-year-math', 'm5-t1-noi'],
        },
        {
          id: 'm1-t3-where-it-loses',
          title: 'Where multifamily loses',
          summary:
            'Illiquidity, operator dependence, personal-guarantee risk on debt, and the limits of LP passivity. The honest list.',
          body:
            "I want to take this topic seriously. If we only talked about where multifamily wins, we would be doing the same thing the people who sold you on cryptocurrency in 2021 were doing — selling you a story without the costs. You deserve the costs.\n\nMultifamily is excellent on certain dimensions. On other dimensions it is meaningfully worse than the alternatives we discussed in Topic 1. Below is the honest list. If any of these are dealbreakers for your specific life right now, we want you to know it before Module 6, not after.\n\n**Multifamily is illiquid.**\n\nWhen you own a multifamily property — directly, or through an LP position — your money is not coming back to you on demand. A typical hold is five to seven years. You will receive distributions during the hold, but the principal you put in stays in until the operator sells or refinances. If you suddenly need that money for a medical emergency, a divorce, a family obligation, a new business — it is not there.\n\nA REIT, by contrast, you can sell on Tuesday afternoon and have the cash on Wednesday. A single-family rental you can list and close in roughly ninety days. Multifamily LP investments are at the far illiquid end of the spectrum. Operators sell when the deal calls for it, not when you call them.\n\nIf there is any chance you might need the principal back inside three years, multifamily is not the right home for that money. Use a different bucket.\n\n**Multifamily depends on the operator. Choosing one is the actual work.**\n\nIf you go the LP route — writing a check into someone else's deal — your returns will be a function of one decision more than any other: who you wrote the check to. Two operators looking at the same deal will produce different outcomes. One will execute the value-add plan on schedule, raise rents to actual market, control expenses, and deliver near-projection returns. The other will under-execute, blame the market, and deliver disappointing distributions and a soft exit.\n\nThe LP version of multifamily is sold as \"passive,\" and operationally it is. But the work moves _upstream_ — into the operator-selection step. That work is real, and most first-time LPs underweight it. Module 6 has a section on diligence questions to ask before writing a check; we will get there.\n\n**At the operator tier, debt is personally guaranteed.**\n\nThis is the one most beginners do not see coming. Agency loans on small-to-mid multifamily — the kind of debt the early-career operator will use — typically include what is called a personal guarantee. A personal guarantee means that if the deal goes badly enough, the lender can come after the operator's personal assets, not just the property. House. Other investments. The lot.\n\nLenders structure this carefully — full recourse is rare on stabilized multifamily; what is more common is a \"bad-boy carve-out\" guarantee that triggers only on operator misconduct or fraud. But the line between misconduct and a desperate decision in a bad market is thinner than the loan documents suggest. Operators who close their first deal need to understand what they are signing.\n\nLP investors do not sign personal guarantees. The capital they lose, if a deal fails, is the capital they put in — that is the worst case. Operators carry more risk because they can capture more reward. This is the real cost behind the \"higher-control, higher-upside\" framing of GP ownership.\n\n**Even at the LP level, the work is not zero.**\n\nIf you imagined LP investment as truly hands-off — write a check, never think about it again — the reality is gentler than that. You will receive K-1 tax forms each year that need to flow through your tax return; this is a different filing than a 1099 from a brokerage. You will read quarterly investor letters and decide whether the trajectory is acceptable. You will, occasionally, vote on extraordinary actions like a refinance or a sale. None of this is heavy work — call it three to five hours per deal per year — but it is not zero, and it is not what you may have pictured.\n\n**There is no real-time scoreboard.**\n\nIf you own the same dollar value of stocks, you can refresh your phone any minute of the trading day and see what your money is \"worth.\" Multifamily does not work that way. The property is appraised at acquisition and at sale, and roughly annually for lender purposes. In between, the value is whatever the next buyer will pay, which you will only know when you sell. Operators learn to be patient with this; some investors find it psychologically difficult.\n\n---\n\nThe honest version of multifamily is that it is excellent at growing wealth slowly through operator-controlled appreciation, and it is deficient at returning your money quickly, requiring no work, or telling you what your portfolio is worth this afternoon. Those are the trade-offs. They are not deal-breakers for most readers — but for some readers, they are. Topic 5 will help you decide which group you are in.",
          sidebars: [
            {
              author: 'Lou',
              title: "From Lou's chair",
              body:
                "I want to add to the personal-guarantee point, because Diva said it carefully and I want to say it bluntly.\n\nWhen I closed my first multifamily deal, I signed a stack of documents that included a guarantee my wife had to acknowledge. It was the most uncomfortable hour of my career to that point. The guarantee was scoped — bad-boy carve-outs only, not full recourse — but in that moment, sitting at the closing table, the abstraction collapsed. I was personally on the hook for something that, until that morning, had felt like a corporate transaction.\n\nIf you choose to be an operator, you will eventually do this. Knowing it is coming is the first part of being ready for it. The second part is what Mastery teaches: how to underwrite, structure, and operate a deal in a way that the carve-out lines never get crossed. Done well, the personal guarantee is paperwork. Done badly, it is a life event. Both outcomes are real.",
            },
          ],
          related: ['m1-t5-fit', 'm3-t2-lp-path'],
        },
        {
          id: 'm1-t4-ten-year-math',
          title: 'The 10-year math',
          summary:
            "$200K invested in single-family vs. multifamily LP vs. operating one's own multifamily — realistic returns, side-by-side.",
          body:
            "Numbers, finally. Let's stop talking in concepts and put real arithmetic on the page.\n\nImagine you have **$200,000** to invest. Not a fantasy number — a meaningful number, but one that a sophisticated household might genuinely have available outside their primary home and their retirement accounts. You are choosing among three places to put it. The fourth vehicle from Topic 1, REITs, we will set aside in this comparison — they behave like equities and the wealth math runs through your brokerage, not through real-estate-specific dynamics.\n\nThe three we will compare are the ones whose math actually moves around:\n\n1. **A single-family rental.** Buy a house with $200,000 down on a $500,000 property. Rent it out. Wait ten years.\n2. **An LP investment in someone else's multifamily deal.** Write a $200,000 check into a syndicated deal. Receive distributions. Wait for the operator to sell.\n3. **Operating your own multifamily deal.** Use the $200,000 as your share of the equity (you would raise the rest from LPs) on a small-to-mid multifamily property. Run it.\n\nI am going to use _realistic_ assumptions. Not bull-case, not bear-case. The kinds of numbers an honest operator would put on a page if they were modeling each path for a friend.\n\n---\n\n**Path 1: The single-family rental.**\n\nYou buy a $500,000 house. You put 25% down ($125,000) and have $75,000 left for closing costs, reserves, and minor renovations. You rent the house for $3,000 per month — $36,000 per year of gross income.\n\nAfter you pay the mortgage, taxes, insurance, vacancy, repairs, and a small management fee, your operating cash flow is meaningfully positive but modest — call it about $4,000 per year of distributable cash flow once the dust settles.\n\nOver ten years, two things happen. The mortgage gets paid down — that's roughly $80,000–$100,000 of equity built through paydown. And the house appreciates with the market — at a long-run rate of about 3% per year, the $500,000 house is worth roughly $670,000 at year ten.\n\nWhen you sell at year ten, after paying off the remaining mortgage balance, paying the agent commission, and absorbing transaction costs, you walk away with roughly **$355,000** in net proceeds. Add up the ten years of cash flow (~$40,000) and you are at about **$395,000 of total return on the $200,000**. That works out to a roughly 7% compound annual return on your invested capital.\n\nThat is a real result. It is not embarrassing. It is also not what most beginners imagine when they imagine real estate building wealth.\n\n---\n\n**Path 2: The LP investment in someone else's deal.**\n\nYou write a $200,000 check into a syndicated multifamily deal. The operator's underwriting projects a five-year hold with a 7% cash-on-cash distribution and a 16% IRR to the LP. Two-thirds of the way in, the operator decides to refinance and hold for a few more years instead of selling — common in the real world. So your hold actually runs more like seven years, with the original capital eventually returned plus accumulated upside.\n\nLet's assume the operator delivers, roughly, what they projected — a 14% IRR over a 7-year hold. (Operators who deliver 100% of their projections do exist, but most realized returns come in slightly under the model. We are not punishing the operator; we are being honest about how the model meets the world.) You then redeploy the proceeds into a second deal for the remaining three years, and that second deal also delivers roughly the same.\n\nAt the end of ten years, your $200,000 has grown to roughly **$520,000** in total proceeds. That is about a 10% annualized return — a meaningful step up from the single-family path, with the trade-off being that you did effectively zero operational work and you had to choose your operators well.\n\n---\n\n**Path 3: Operating your own multifamily deal.**\n\nYou put your $200,000 in as your share of the equity on a small-to-mid multifamily property — call it a $5M deal where you and your investors put in $1.25M of equity, and you are 16% of that equity stack as the GP. You also receive what is called a _promote_ — a share of the upside that the LPs accept giving up because you are doing the work.\n\nIn a typical structure, the GP earns a 1.5–2% acquisition fee at close, modest asset-management fees during the hold, and a meaningful share of the upside above a preferred return to LPs. The math here gets layered, and Module 5 of Mastery walks through it carefully. For our purposes today, the important thing is the order of magnitude.\n\nIf you operate well — execute the value-add plan, hit projections within the typical band of operator credibility — your $200,000 over ten years (across two consecutive deals, since multifamily holds are typically 5 years) is reasonably modeled to grow to **$700,000–$900,000** in total proceeds. Call it roughly a 13–16% annualized return on your capital, _plus_ the income you earn from fees and asset management along the way.\n\nThe range is wider than the LP range because operating outcomes have more variance. The same set of decisions that produces $900,000 if executed well could produce $400,000 if executed badly. The asymmetry is real, and the reason most first-time operators do this with a partner who has done it before — the path Module 3 calls _Co-GP_ — is exactly to compress that variance.\n\n---\n\n**Side by side, ten years out:**\n\n| Path | Starting capital | Approx. ending value | Approx. annualized return | What you did |\n| --- | --- | --- | --- | --- |\n| Single-family rental | $200,000 | ~$395,000 | ~7% | Bought, held, light operations |\n| LP / passive multifamily | $200,000 | ~$520,000 | ~10% | Chose operators, waited |\n| GP / direct operator | $200,000 | ~$700,000–$900,000 | ~13–16% | Ran the deal |\n\nNumbers will vary. Markets will vary. Some readers will point at one of these rows and say it is too generous, others will say it is too pessimistic. They are illustrative. What we want you to take away is the _shape_ of the difference — and the fact that the higher-return paths require either more careful operator selection or more direct workload.\n\nThis is the core trade-off Multifamily 101 exists to help you read clearly. Topic 5 will help you decide which row your real life can support.",
          sidebars: [
            {
              author: 'Lou',
              title: "From Lou's chair",
              body:
                "Diva put a 13–16% range on the operator path. I want to give you the operator-honest version of that range.\n\nThe top of the range is what a competent, well-mentored operator does on a deal where the underwriting was conservative and the market was at minimum neutral. The bottom of the range is what happens when the same operator hits a market headwind — a softening submarket, a tax reassessment, an insurance shock — and has to grind through the headwind without making it worse.\n\nThe deals that sit _below_ the bottom of that range are the ones that fail. They get there one of three ways: the operator overpaid going in, the operator over-leveraged, or the operator did not have the patience to hold through the bad year. None of those are market-driven. All three are inside the operator's control if the operator was trained for them.\n\nThis is, by the way, the entire reason we offer the bespoke 1:1 program. Solo first-time operators land below the range too often. Operators who close their first deal alongside someone who has done it before land inside the range almost every time. The mentorship is not a luxury — it is the variance reduction.",
            },
          ],
          related: ['m1-t1-four-vehicles', 'm5-t5-irr'],
        },
        {
          id: 'm1-t5-fit',
          title: "Who multifamily is right for, who it isn't",
          summary:
            'Self-assessment criteria: capital, time horizon, risk tolerance, operator inclination. Reader leaves Module 1 knowing whether to continue.',
          body:
            "Take a breath. We've covered a lot in the last forty minutes.\n\nWe walked through the four wealth vehicles you might be choosing between. We named the engine that makes multifamily different — forced appreciation through operator-controlled NOI improvement. We were honest about where multifamily loses to its alternatives. And we put real ten-year numbers on three different paths.\n\nNow the question we promised at the top of the module: _is this the right vehicle for you?_\n\nThere is no universally correct answer. There is, however, a correct answer for _your_ specific life right now — and figuring it out is the work of this final topic. Module 6 has a full scored self-assessment that produces a recommended path and a personalized next step. What we want to do here, before we move on to Module 2, is help you answer the more basic question: _should I keep going at all?_\n\nLet me give you four lenses to look through. Hold each of them up to your own life and notice what you see.\n\n**Capital available, outside your primary residence and retirement accounts.**\n\nMultifamily makes sense at a meaningful range of capital levels, but it has a floor. As a passive LP, the floor is typically $25,000 to $50,000 minimum check size — some operators set it higher. As an operator with partners, the floor on the equity contribution is meaningfully larger, often $100,000 to $250,000 for your share of a small first deal. Below the LP floor, multifamily is structurally not available to you yet, and the most useful thing you can do is build the capital base in a different vehicle until you cross it.\n\nIf you have $5,000 or $15,000 to deploy and you are wondering whether to put it into a multifamily deal — the answer is that you cannot, yet, at the LP entry, and we want to tell you that honestly rather than sell you something else.\n\n**Time horizon.**\n\nMultifamily money is not coming back inside three years. The honest planning horizon for any multifamily commitment is five to seven years for a single hold, and ten-plus years if you are thinking about compounding across multiple deals. If you might need this money for a defined event inside three years — a down payment on a primary home, a child's college tuition, a planned career transition — multifamily is the wrong home for it.\n\nIf the money is genuinely _patient_ — capital you can let sit and grow without needing to touch it — multifamily becomes one of the strongest vehicles for that capital.\n\n**Risk tolerance, accurately self-assessed.**\n\nMultifamily returns are not market-correlated in the day-to-day way stocks are, but the underlying real estate is exposed to interest rate cycles, regional economic shifts, and operator execution risk. You will go through a quarter where a deal under-distributes. You will read a letter from an operator that says \"the lease-up is taking longer than projected.\" You will, eventually, see a deal break even rather than win.\n\nThe question is not whether you can tolerate risk in the abstract. It is whether you can tolerate it when you read that letter, with no way to sell out of the position and no daily price update to track. Some readers find this stabilizing — they stop checking and let the work happen. Others find it psychologically corrosive. You probably already know which one you are.\n\n**Operator inclination.**\n\nThe last lens, and in many ways the most important. Some readers come into this course energized by the idea of running a deal — sourcing properties, talking to brokers, raising capital, walking units, managing a value-add plan. Others come in energized by the idea of building wealth through real estate without _doing_ real estate. Both are legitimate. They lead to different paths.\n\nIf the operating side excites you, you are looking at the GP path. Multifamily Mastery is the curriculum that takes you from this orientation to deal-ready. If the operating side feels like work you do not want, you are looking at the LP path or, if you want to learn alongside an experienced operator, the Co-GP path that bespoke 1:1 coaching is built for. Module 6 walks you through how to choose between them.\n\n---\n\n**Where this leaves you.**\n\nIf you have read this module carefully and you are now sitting with one of the following thoughts, you are in the right place:\n\n_\"I have meaningful patient capital, and I want to learn to operate.\"_ Continue. Multifamily 101 is the orientation; Mastery is the operator path.\n\n_\"I have patient capital, and I want to invest with operators rather than become one.\"_ Continue. Multifamily 101 will give you the vocabulary to evaluate operators well, and Module 6 will help you take the first steps as an LP.\n\n_\"I have patient capital, and I am not sure which side I am on.\"_ Continue. Most readers feel exactly this on day one. Modules 2 through 6 are designed to help you decide.\n\n_\"My capital is not patient — I might need it inside three years.\"_ Pause. Use a different vehicle for that money. Come back to multifamily when the capital settles.\n\n_\"I do not have $25,000 of investable capital outside my primary needs.\"_ Pause. The most valuable thing you can do is build the base in a vehicle that does not have a floor, and revisit multifamily when you cross the LP entry threshold. We are happy to send you the rest of Multifamily 101 as a reference for that day.\n\nThere is no shame in any of these answers. There is, however, a real cost to forcing a path that doesn't fit your life. Take this honestly.\n\nWhen you're ready, Module 2 walks you through what a real $5M multifamily deal actually looks like, end to end. Whether you arrive at it as a future operator or a future LP, what you learn there will change how you read every other deal you ever see.",
          sidebars: [
            {
              author: 'Lou',
              title: "From Lou's chair",
              body:
                "Diva named operator inclination as one of the four lenses. I want to add a way to test yourself on that one.\n\nWhen you read about a deal — a real deal, not an abstraction — pay attention to what your mind does. Some readers, when they see a value-add property with rent upside, find themselves immediately thinking about which units to renovate first, who they would call about plumbing bids, what the property-management contract should say. They are operationally curious. They cannot help themselves.\n\nOther readers, given the same property, find themselves thinking _good for the operator who buys this; I'll write the check_. That is also a real disposition. There is nothing weaker about it. The LPs we respect most know themselves cleanly enough to stay on the LP side and choose their operators well, instead of dabbling at operations and doing it badly.\n\nBoth groups can win in multifamily. The group that loses is the one that picks the wrong side and then forces themselves to play the other game. Pay attention to which one you naturally are.",
            },
          ],
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
            'Many operators are professionals with day jobs. The structure that supports this is what Multifamily Mastery teaches — Multifamily 101 is the orientation step before that decision.',
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
        {
          q: "A reader has $40,000 of investable capital outside their primary home, a full-time job that they enjoy, and no operator inclination — they want their money to work without becoming a landlord. Which path fits this reader best at this stage?",
          choices: [
            'Buy a single-family rental — start small, learn hands-on.',
            'Become an LP investor in a multifamily syndication.',
            'Operate their own small multifamily deal as the GP.',
            'Wait several years and then go straight to bespoke 1:1 coaching.',
          ],
          correctIndex: 1,
          a: 'Become an LP investor in a multifamily syndication.',
          why: "$40,000 clears the typical $25,000–$50,000 LP entry floor. The reader has no operator inclination, which rules out GP and small-multifamily landlording. LP gives them multifamily exposure without the operating workload — exactly what their stated profile asks for.",
          trap: "Single-family rental looks like the obvious 'beginner' move, but it requires direct landlording — the very thing this reader said they don't want. 'Beginner' isn't the same as 'easy'; the right vehicle matches your stated inclination, not your experience level.",
          topicId: 'm1-t1-four-vehicles',
          difficulty: 'foundation',
        },
        {
          q: "What is the central reason multifamily can produce returns that aren't tied to overall market movement?",
          choices: [
            'Multifamily benefits from leverage in a way single-family does not.',
            'Multifamily is valued by a formula that ties value directly to net operating income — so improving operations forces value up regardless of market direction.',
            'Multifamily attracts institutional capital, which guarantees a floor under prices.',
            'Multifamily has tax advantages that other real estate does not.',
          ],
          correctIndex: 1,
          a: 'Multifamily is valued by a formula that ties value directly to net operating income — so improving operations forces value up regardless of market direction.',
          why: "This is the engine: value = NOI ÷ cap rate. Operators control NOI through rents, expenses, and ancillary income. When NOI rises, value rises by the same proportion (holding cap rate steady), even if no comparable sales have changed. That mechanism is what 'forced appreciation' names.",
          trap: "Leverage and tax advantages are real benefits of multifamily, but neither explains why returns can be operator-controlled rather than market-controlled. The formula is what makes the operator's work matter.",
          topicId: 'm1-t2-edge-source',
          difficulty: 'foundation',
        },
        {
          q: "A multifamily property currently produces $300,000 in net operating income and is valued at a 6% cap rate. Over two years, the operator improves NOI to $360,000. The market cap rate stays at 6%. Roughly how much has the property's value changed, and through what mechanism?",
          choices: [
            "Value rose ~$60,000, through cash flow distributions to investors.",
            "Value rose ~$1,000,000, through forced appreciation (NOI improvement at a constant cap rate).",
            "Value is unchanged because cap rates didn't move.",
            "Value rose ~$1,000,000, through market appreciation as the submarket strengthened.",
          ],
          correctIndex: 1,
          a: 'Value rose ~$1,000,000, through forced appreciation (NOI improvement at a constant cap rate).',
          why: "Apply the formula: value = NOI ÷ cap rate. Before: $300,000 ÷ 0.06 = $5,000,000. After: $360,000 ÷ 0.06 = $6,000,000. The $1M lift comes entirely from the $60K NOI improvement — that is forced appreciation. The market did nothing.",
          trap: "Some readers see the $60,000 NOI lift and assume value rose by $60,000 — that's the cash-flow logic. Multifamily doesn't work that way. Each dollar of permanent NOI improvement creates roughly $16.67 of value at a 6% cap rate (1 ÷ 0.06).",
          topicId: 'm1-t2-edge-source',
          difficulty: 'application',
        },
        {
          q: "Which of these is multifamily NOT a good fit for, even when the reader has plenty of capital?",
          choices: [
            'A reader who wants to build long-term wealth without daily price quotes.',
            "A reader who plans to need the principal back within two years for a planned event.",
            'A reader who wants exposure to real estate without becoming a landlord directly.',
            'A reader who is comfortable choosing operators and waiting on outcomes.',
          ],
          correctIndex: 1,
          a: 'A reader who plans to need the principal back within two years for a planned event.',
          why: "Multifamily commitments — both LP and GP — are illiquid. Typical holds are 5–7 years; a refinance-and-extend pattern is common. Money committed to multifamily is not coming back inside two years on demand. Capital with a defined short-term need belongs in a different vehicle.",
          trap: "Capital alone doesn't make multifamily a fit — time horizon matters at least as much. A reader with $500K who needs it in 18 months is the wrong fit for multifamily despite the dollar amount looking generous.",
          topicId: 'm1-t3-where-it-loses',
          difficulty: 'foundation',
        },
        {
          q: "A reader finishing Module 1 says: 'I have $250K of patient capital, a demanding day job, and when I read about deals I find myself wondering which units I'd renovate first and how I'd negotiate the property-management contract.' What does this self-assessment most strongly suggest?",
          choices: [
            'They should stay LP — the day job rules out everything else.',
            'They have operator inclination and capital, but limited time — the Co-GP / partnership path is the natural fit, not solo GP.',
            "They're not ready for multifamily yet — they should build more capital first.",
            "They should buy a small multifamily property and self-manage it on weekends.",
          ],
          correctIndex: 1,
          a: 'They have operator inclination and capital, but limited time — the Co-GP / partnership path is the natural fit, not solo GP.',
          why: "The reader's instinct (mentally renovating units, thinking about PM contracts) is the operator-inclination signal Module 1 names. But the day job constrains time. Co-GP — partnering with an experienced operator — gives them the GP-side learning and economics without the full solo workload. Module 3 walks through this path; bespoke 1:1 coaching is built for it.",
          trap: "It's tempting to default to LP because of the day job. But LP doesn't match the reader's stated inclination — they're already thinking like an operator. Forcing them to LP would be matching the wrong side of their profile. The Co-GP path is built precisely for this combination.",
          topicId: 'm1-t5-fit',
          difficulty: 'application',
        },
      ],
      takeaway: {
        title: 'The Four Wealth Vehicles, Compared',
        path: '/foundations/takeaways/m1-four-vehicles.pdf',
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
          'One page. Five formulas, plain-English interpretation, and the trap to avoid for each. Members who finish Multifamily 101 are expected to have this card memorized.',
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
            'You are not behind. You are at the right step. Multifamily 101 exists precisely because the right next step varies — for some readers it is Mastery, for some it is LP investing, for some it is small multifamily, and for some it is patience.',
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
            ctaHref: 'mailto:invest@resciaproperties.com?subject=Multifamily%20101%20-%20LP%20conversation',
          },
          {
            path: 'coGp',
            headline: 'Your fit is Co-GP / Partnership.',
            body: PENDING_VOICE,
            ctaLabel: 'Apply for the Bespoke 12-month program',
            ctaHref: 'mailto:hello@resciaproperties.com?subject=Multifamily%20101%20-%20Bespoke%20screening',
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
