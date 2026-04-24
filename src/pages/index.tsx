/*
 * Multifamily Mastery — Landing page.
 *
 * This page is a faithful port of the original standalone marketing HTML
 * (rescia-multifamily-mastery landing page.html) into a Next.js Pages-router
 * component. Content, structure, copy, Diva Rescia + Lou Lopez bios, FAQ,
 * modal funnel — all preserved. Styling lives in src/styles/landing.css and
 * extends (does not replace) the design tokens in globals.css.
 *
 * Structural differences vs. the static HTML:
 *   - Uses React useState for modal + FAQ accordion instead of inline JS.
 *   - IntersectionObserver .reveal animation ported to a useEffect hook.
 *   - "Book Strategy Call" form POSTs to /api/leads/strategy-call if wired up;
 *     otherwise falls back to the visual "application received" confirmation
 *     identical to the original.
 *   - Logo served from /public/rescia-logo.png (decoded from the original
 *     inline base64 data URI) so the HTML stays lean.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState, FormEvent, MouseEvent } from 'react';
import '@/styles/landing.css';

export default function Home() {
  // ── UI state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form fields — kept in React state so a future /api/leads/strategy-call
  // endpoint can consume them without refactoring.
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    goal: '',
  });

  // ── Modal open/close with body-scroll lock + Escape to dismiss ─────────
  function openModal(e?: MouseEvent) {
    if (e) e.preventDefault();
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSubmitted(false);
  }
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  // ── .reveal fade-in on scroll ──────────────────────────────────────────
  const pageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    root.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Form submission ────────────────────────────────────────────────────
  async function submitForm(e: FormEvent) {
    e.preventDefault();
    // Best-effort POST to a lead-capture endpoint. If the endpoint doesn't
    // exist yet (404) we still show the confirmation state so the funnel
    // doesn't look broken during launch.
    try {
      await fetch('/api/leads/strategy-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {
      /* non-blocking — confirmation state is the source of truth visually */
    }
    setSubmitted(true);
  }

  function toggleFaq(idx: number) {
    setOpenFaq((cur) => (cur === idx ? null : idx));
  }

  // ── Static content arrays (makes the JSX scannable) ─────────────────────
  //
  // Module titles are locked to the module titles used in src/data/courses.ts
  // so that the landing-page curriculum preview matches exactly what a member
  // sees after they enroll. If you rename a module in courses.ts, rename it
  // here too (and bump the total topic count in the hero trust row).
  const modules: Array<[string, string, string, string]> = [
    ['01', 'Week 1 · 4–5 hrs', 'MSA & Market Selection', 'Rank MSAs on population, jobs, wage, and supply fundamentals. Build a top-5 market board using free BLS / BEA / Census data — no $15k CoStar subscription needed.'],
    ['02', 'Week 2 · 4–5 hrs', 'Submarket Intelligence', 'Drill from MSA to zip-code: employment corridors, demographic overlays, crime & school scoring, and the submarket comp sets that actually predict rent.'],
    ['03', 'Week 3 · 4–5 hrs', 'Deal Sourcing', 'Broker relationships, off-market funnels, OM analysis, and rent-roll scrutiny. The 12 red flags that disqualify deals before they eat your earnest money.'],
    ['04', 'Week 4 · 4–5 hrs', 'Underwriting', 'Revenue stack construction, operating expense modeling, NOI derivation, and cap rate defensibility — the base layer of every deal analysis.'],
    ['05', 'Week 5 · 4–5 hrs', 'Stress Testing & CapEx', 'Sensitivity analysis, value-add scenarios, downside modeling, and CapEx scoping. Build deals that still work when assumptions break.'],
    ['06', 'Week 6 · 4–5 hrs', 'Debt Sourcing', 'Agency debt (Fannie, Freddie), bridge loans, CMBS, and LTV/DSCR optimization. Structure capital stacks that maximize IRR without blowing coverage.'],
    ['07', 'Week 7 · 4–5 hrs', 'Letter of Intent', 'LOI drafting, earnest money strategy, contingencies, and negotiation frameworks. Win deals without overpaying — and protect yourself if you do.'],
    ['08', 'Week 8 · 4–5 hrs', 'Capital Raising', 'Reg D 506(b) vs 506(c), preferred returns, waterfall tiers, and GP/LP splits. Raise real capital from accredited investors with confidence.'],
    ['09', 'Week 9 · 4–5 hrs', 'PPM & Legal', 'PPM sections, LLC operating agreements, subscription agreements, and Form D filings. Navigate SEC compliance without paying $40K to an attorney.'],
    ['10', 'Week 10 · 4–5 hrs', 'PSA & Due Diligence', 'PSA review, physical / financial / legal DD, Phase I and II ESA, mechanical inspections. The 30-day sprint between LOI and closing.'],
    ['11', 'Week 11 · 4–5 hrs', 'Property Management', 'PM agreement negotiation, KPI dashboards, and the first 90 days post-close. Execute the value-add plan that actually hits your pro forma.'],
    ['12', 'Week 12 · 4–5 hrs', 'Exit Strategies', 'Disposition, 1031 exchanges, cash-out refis, and tax optimization. Project equity multiples and waterfall final returns to GPs and LPs.'],
  ];

  const moduleTemplates = [
    'Template: MSA Scorecard', 'Template: Submarket Analysis', 'Template: Property Scorecard',
    'Template: Basic Pro Forma', 'Template: Sensitivity Tables', 'Template: Debt Model',
    'Template: LOI Template', 'Template: Pitch Deck', 'Template: PPM Outline',
    'Template: DD Checklist', 'Template: PM Scoring', 'Template: Exit Waterfall',
  ];

  const faq = [
    ['Who is this program designed for?',
     'Multifamily Mastery is built for sophisticated investors, active syndicators, aspiring operators, and high-net-worth individuals serious about building wealth through multifamily real estate. Prerequisites include basic accounting knowledge, familiarity with real estate fundamentals, and at least $100K in investment capital or access to capital sources. The curriculum assumes comfort with Excel modeling and financial analysis.'],
    ['How long does the program take?',
     'The program is structured as 12 modules, recommended at one module per week over 12 weeks. Each module requires 4–5 hours of focused study — reading core concepts, reviewing formulas, working through deep dives, and completing action items using the included templates. Most participants complete the program in 3 months, though you have lifetime access to the materials.'],
    ["What if I've never done a multifamily deal before?",
     'The program is designed to take you from "zero deals closed" to "ready to close your first deal" — assuming you meet the prerequisites. You don\'t need prior multifamily experience, but you should have a foundational understanding of real estate (SFR experience is ideal) and be financially prepared to invest or raise capital.'],
    ["What's included in the strategy call?",
     'Your free 30-minute strategy call covers three things: your current investment position and goals, your specific obstacles to acquiring your first (or next) multifamily asset, and whether the Multifamily Mastery program is the right fit. No sales pressure — the program is selective, and we only move forward if both sides see a clear fit.'],
    ['How is this different from other multifamily courses?',
     'Three key differences. First, it\'s mentorship — not just recorded content. You get direct access to an active operator, not a faceless course library. Second, it\'s comprehensive and sequential — every module builds on the last, following the actual multifamily investment cycle. Third, it comes with the Excel templates and legal documents that are genuinely institutional-grade — the same tools used on live deals.'],
    ["What's the investment for the program?",
     'Tuition is discussed on your free strategy call — it varies based on the tier and whether you\'re enrolling solo or with a partner. The program is designed to pay for itself on your first deal. We only invite candidates in when we\'re confident of that outcome, which is why applications are reviewed individually.'],
  ];

  return (
    <div ref={pageRef} className="landing-root">
      <Head>
        <title>Multifamily Mastery — Rescia Properties | Mentoring Program</title>
        <meta
          name="description"
          content="The complete 12-module multifamily real estate mentoring program. From market identification to exit — the proven system for building wealth through multifamily real estate. Book your free strategy call."
        />
      </Head>

      {/* ========== NAV ========== */}
      <nav>
        <div className="container">
          <a href="#" className="nav-logo">
            <img src="/rescia-logo.png" alt="Rescia Properties" />
            <div className="nav-logo-text">
              <span className="nav-logo-name">Rescia Properties</span>
              <span className="nav-logo-tag">Multifamily Mastery</span>
            </div>
          </a>
          <div className="nav-links">
            <a href="#curriculum">Curriculum</a>
            <a href="#results">Results</a>
            <a href="#mentor">Mentor</a>
            <a href="#faq">FAQ</a>
            <Link href="/login" className="nav-signin">Sign In</Link>
            <a href="#" className="nav-cta" onClick={openModal}>Book Strategy Call</a>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot"></span>
                Now Accepting 2026 Cohort · Limited Seats
              </div>
              <h1 className="hero-title">
                From market identification to <span className="italic">exit.</span>
                <br />The <span className="underline">proven system</span> for multifamily wealth.
              </h1>
              <p className="hero-sub">
                A complete 12-module mentorship for sophisticated investors, syndicators, and operators.
                Master <strong>underwriting, capital raising, due diligence,</strong> and <strong>asset management</strong> —
                with <strong>126 deep-dive topics</strong>, 5 Excel templates, and direct access to a mentor actively closing deals.
              </p>
              <div className="cta-group">
                <a href="#" className="btn-primary" onClick={openModal}>
                  Book Free Strategy Call
                  <span className="arrow">→</span>
                </a>
                <a href="#curriculum" className="btn-secondary">View The Curriculum</a>
              </div>
              <div className="trust-row">
                <div className="trust-stat">
                  <div className="num"><span className="accent">12</span> Modules</div>
                  <div className="lbl">Structured Curriculum</div>
                </div>
                <div className="trust-stat">
                  <div className="num"><span className="accent">126</span> Topics</div>
                  <div className="lbl">Deep-Dive Lessons</div>
                </div>
                <div className="trust-stat">
                  <div className="num"><span className="accent">5</span> Templates</div>
                  <div className="lbl">Excel Models</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card">
                <div className="hero-card-logo">
                  <img src="/rescia-logo.png" alt="" />
                  <div className="hero-card-logo-text">
                    <div className="name">Rescia Properties</div>
                    <div className="tag">Multifamily Mastery</div>
                  </div>
                </div>
                <div className="hero-card-label">// The Mentorship Includes</div>
                <div className="hero-card-title">
                  Everything from <span className="italic">sourcing</span> to exit.
                </div>
                <ul className="hero-card-list">
                  <li><span className="mark">I.</span> MSA analysis &amp; submarket selection</li>
                  <li><span className="mark">II.</span> Full underwriting &amp; stress testing</li>
                  <li><span className="mark">III.</span> Reg D 506(b)/(c) capital raising</li>
                  <li><span className="mark">IV.</span> PPM, PSA &amp; legal documentation</li>
                  <li><span className="mark">V.</span> Operations, KPIs &amp; value-add execution</li>
                  <li><span className="mark">VI.</span> 1031, disposition &amp; waterfall returns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROBLEM ========== */}
      <section className="problem">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">Why Most Investors Never Scale</div>
            <h2>The gap between theory and <span className="italic">a closed deal</span> is wider than you think.</h2>
            <p className="section-sub">
              Reading books, attending conferences, and watching YouTube will not get you to your first 100-unit acquisition.
              This is what actually stops investors from making the jump.
            </p>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="problem-num">01</div>
              <h3>Underwriting feels like guesswork.</h3>
              <p>
                T12 normalization, rent roll stress tests, expense ratios, exit cap defensibility — one flawed assumption on a 40-unit deal wipes out years of SFR gains.
                Most investors don&rsquo;t know where the guardrails are.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-num">02</div>
              <h3>Capital raising is a black box.</h3>
              <p>
                Reg D 506(b) vs 506(c). Preferred returns. Waterfall structures. Form D filings. Without a proven framework — and templates that have actually raised capital — you stall before you ever sign an LOI.
              </p>
            </div>
            <div className="problem-card reveal">
              <div className="problem-num">03</div>
              <h3>Operations kill the pro forma.</h3>
              <p>
                Deals don&rsquo;t fail at acquisition — they fail in the first 90 days post-close. Property management selection, KPI targets, value-add execution.
                Miss these, and your 22% IRR becomes a 6% problem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROGRAM OVERVIEW ========== */}
      <section className="overview">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">Program Overview</div>
            <h2>A cohesive framework for <span className="italic">acquiring, operating,</span> and exiting multifamily properties.</h2>
            <p className="section-sub">
              Each module builds on the last. You&rsquo;ll complete five Excel templates, analyze real market data, and apply frameworks to properties in your target markets.
              When you&rsquo;re done, you have a playbook — not notes from a course.
            </p>
          </div>
          <div className="learn-grid reveal">
            {([
              ['01', <>Analyze metropolitan markets and identify <strong>high-growth submarkets</strong> with superior absorption rates and constrained supply pipelines.</>],
              ['02', <>Evaluate properties using <strong>rent rolls, T12/T3 financials,</strong> and comparative market analysis to qualify deals systematically.</>],
              ['03', <>Build detailed <strong>pro forma underwriting models</strong> with scenario analysis, sensitivity testing, and stress-case modeling.</>],
              ['04', <>Master <strong>agency lending, bridge financing,</strong> and optimize capital structure for maximum risk-adjusted returns.</>],
              ['05', <>Craft compelling <strong>LOIs and PSAs;</strong> navigate negotiation, retrade strategy, and due diligence cycles with confidence.</>],
              ['06', <>Raise capital from accredited investors using <strong>Reg D 506(b) and 506(c)</strong> offerings; structure equity tiers and preferred returns.</>],
              ['07', <>Prepare comprehensive <strong>PPMs, operating agreements, subscription agreements,</strong> and Form D filings without $40K in legal fees.</>],
              ['08', <>Conduct physical, financial, and legal <strong>due diligence;</strong> manage Phase I/II ESA and mechanical inspections.</>],
              ['09', <>Optimize <strong>property management,</strong> set KPI targets, and execute the first 90 days post-close with a proven playbook.</>],
              ['10', <>Implement <strong>cash-out refinances, 1031 exchanges,</strong> and disposition strategies to maximize final investor returns.</>],
              ['11', <>Project investor cash distributions and <strong>equity multiples;</strong> waterfall model returns to GPs and LPs.</>],
              ['12', <>Build an <strong>investment thesis,</strong> source off-market deals, and scale to a multi-property portfolio.</>],
            ] as Array<[string, JSX.Element]>).map(([n, body], i) => (
              <div className="learn-item" key={i}>
                <div className="learn-num">{n}</div>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== INVESTMENT CYCLE ========== */}
      <section className="cycle">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">The Multifamily Investment Cycle</div>
            <h2>Five stages. <span className="italic">One playbook.</span></h2>
            <p className="section-sub">
              Every successful multifamily deal moves through the same lifecycle. The program walks you through each stage with deliverables, templates, and live mentor review.
            </p>
          </div>
          <div className="cycle-timeline reveal">
            <div className="cycle-track"></div>
            <div className="cycle-stages">
              {([
                ['I', 'Identify', '4–8 Weeks', <>Market analysis, submarket selection, property sourcing → <strong>LOI</strong></>],
                ['II', 'Underwrite', '2–4 Weeks', <>Financial modeling, pro forma, stress testing → <strong>Investment Memo</strong></>],
                ['III', 'Capitalize', '4–8 Weeks', <>Capital raise, legal docs, financing → <strong>PPM, Debt Commitment</strong></>],
                ['IV', 'Operate', '5-Year Hold', <>PM selection, KPIs, value-add → <strong>Quarterly Reports</strong></>],
                ['V', 'Exit', '3–6 Months', <>Disposition, 1031, refi, waterfall → <strong>Final Distributions</strong></>],
              ] as Array<[string, string, string, JSX.Element]>).map(([dot, name, dur, activity], i) => (
                <div className="cycle-stage" key={i}>
                  <div className="cycle-dot">{dot}</div>
                  <div className="cycle-name">{name}</div>
                  <div className="cycle-duration">{dur}</div>
                  <div className="cycle-activity">{activity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CURRICULUM / 12 MODULES ========== */}
      <section className="curriculum" id="curriculum">
        <div className="container">
          <div className="curriculum-head reveal">
            <div>
              <div className="section-eyebrow">The 12-Module Curriculum</div>
              <h2>Twelve weeks. <span className="italic">One module at a time.</span></h2>
            </div>
            <div className="curriculum-meta">
              <span className="big">126 topics</span>
              Deep-dive lessons<br />
              5 Excel templates<br />
              Interactive quizzes
            </div>
          </div>

          <div className="modules reveal">
            {modules.map(([num, time, title, copy], i) => (
              <div className="module" key={num}>
                <div className="module-head">
                  <div className="module-num">{num}</div>
                  <div className="module-time">{time}</div>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="module-template">{moduleTemplates[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== RESULTS ========== */}
      <section className="results" id="results">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">What Program Graduates Say</div>
            <h2>Built for <span className="italic">serious investors.</span> Designed for results.</h2>
          </div>

          <div className="results-stats reveal">
            <div className="result-stat">
              <div className="result-num"><span className="accent">12</span></div>
              <div className="result-lbl">Comprehensive Modules</div>
            </div>
            <div className="result-stat">
              <div className="result-num"><span className="accent">126</span></div>
              <div className="result-lbl">Deep-Dive Topics</div>
            </div>
            <div className="result-stat">
              <div className="result-num"><span className="accent">5</span></div>
              <div className="result-lbl">Excel Templates</div>
            </div>
            <div className="result-stat">
              <div className="result-num"><span className="accent">1:1</span></div>
              <div className="result-lbl">Mentor Access</div>
            </div>
          </div>

          <div className="testimonial-grid">
            <div className="testimonial reveal">
              <div className="testimonial-quote">&ldquo;</div>
              <p>
                The underwriting module alone was worth the entire program. I&rsquo;d been &ldquo;about to buy&rdquo; multifamily for three years.
                Ten months into the mentorship, I closed my first 32-unit and raised $1.4M from my own network.
              </p>
              <div className="testimonial-author">
                <div className="avatar">MR</div>
                <div>
                  <div className="author-name">Marcus R.</div>
                  <div className="author-detail">Phoenix, AZ · First syndication</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal">
              <div className="testimonial-quote">&ldquo;</div>
              <p>
                I came in with 14 SFRs and no idea how to scale. The MSA framework and property scorecard alone changed how I evaluate every deal.
                The capital-raising module got me the confidence to actually ask for money.
              </p>
              <div className="testimonial-author">
                <div className="avatar">SK</div>
                <div>
                  <div className="author-name">Sarah K.</div>
                  <div className="author-detail">Atlanta, GA · 24-unit value-add</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal">
              <div className="testimonial-quote">&ldquo;</div>
              <p>
                The PPM and 506(c) templates saved me $30K in legal fees alone. But the real value is the mentorship — weekly deal review,
                real-time answers, and introductions to lenders I couldn&rsquo;t have reached on my own.
              </p>
              <div className="testimonial-author">
                <div className="avatar">DT</div>
                <div>
                  <div className="author-name">David T.</div>
                  <div className="author-detail">Dallas, TX · 68-unit syndication</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== DELIVERABLES ========== */}
      <section className="deliverables">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">What&rsquo;s Included</div>
            <h2>Five Excel templates. <span className="italic">One comprehensive playbook.</span></h2>
            <p className="section-sub">Every tool needed to execute — not just theorize. Templates integrate with your own deal pipeline from day one.</p>
          </div>
          <div className="deliver-grid reveal">
            <div className="deliver-item">
              <div className="deliver-icon">I</div>
              <h3>MSA &amp; Property Scorecards</h3>
              <p>Systematic frameworks for evaluating markets, submarkets, and individual properties. Score 10 MSAs on 6 metrics. Qualify deals before they consume your time.</p>
            </div>
            <div className="deliver-item">
              <div className="deliver-icon">II</div>
              <h3>Full Underwriting Model</h3>
              <p>Multi-tab pro forma with T12 normalization, sensitivity tables, stress-case modeling, and waterfall distributions. The same model used on live deals.</p>
            </div>
            <div className="deliver-item">
              <div className="deliver-icon">III</div>
              <h3>Debt &amp; Capital Stack</h3>
              <p>Agency vs bridge financing comparison, LTV optimization, and DSCR stress testing. Model every capital structure before you commit.</p>
            </div>
            <div className="deliver-item">
              <div className="deliver-icon">IV</div>
              <h3>LOI, PSA &amp; PPM Templates</h3>
              <p>Attorney-reviewed legal templates. LOI formats that win. PPM outlines that hold up. Subscription agreements that close.</p>
            </div>
            <div className="deliver-item">
              <div className="deliver-icon">V</div>
              <h3>Due Diligence &amp; PM Tools</h3>
              <p>60+ point DD checklist, Phase I/II ESA guidance, PM scoring rubric, and first-90-day operations playbook. Close with confidence.</p>
            </div>
            <div className="deliver-item">
              <div className="deliver-icon">VI</div>
              <h3>Exit Waterfall Model</h3>
              <p>Project investor distributions, equity multiples, and IRR across hold periods. Waterfall returns to GPs and LPs with full tax treatment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MENTORS ========== */}
      <section className="mentor" id="mentor">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">Meet Your Lead Mentors</div>
            <h2>You&rsquo;re not buying a course. You&rsquo;re learning from <span className="italic">operators.</span></h2>
            <p className="section-sub">
              Rescia Properties is led by a seasoned partnership with over 45 years of combined experience across multifamily investing, institutional leadership, and large-scale portfolio growth.
            </p>
          </div>

          <div className="firm-stats reveal">
            <div className="firm-stat">
              <div className="n"><span className="accent">$700M+</span></div>
              <div className="l">Closed Transactions</div>
            </div>
            <div className="firm-stat">
              <div className="n"><span className="accent">3,387+</span></div>
              <div className="l">Units Managed</div>
            </div>
            <div className="firm-stat">
              <div className="n"><span className="accent">$989M</span></div>
              <div className="l">Current AUM</div>
            </div>
            <div className="firm-stat">
              <div className="n"><span className="accent">45+</span></div>
              <div className="l">Years Combined Exp.</div>
            </div>
          </div>

          <div className="mentors-grid">
            {/* Diva Rescia */}
            <div className="mentor-card reveal">
              <div className="mentor-header">
                <div className="mentor-monogram">DR</div>
                <div>
                  <div className="mentor-role">Co-Founder · Managing Partner</div>
                  <div className="mentor-name">Diva Rescia</div>
                  <div className="mentor-title">CBRE Multifamily Investment Specialist</div>
                </div>
              </div>
              <p className="mentor-bio">
                A <strong>principal investor in real estate since age 17</strong>, Diva brings over 20 years of experience and institutional-grade expertise to every investor relationship.
                As a Multifamily Investment Specialist at CBRE — a Fortune 150 company and the world&rsquo;s largest commercial real estate brokerage — she doesn&rsquo;t just advise.
                She structures, underwrites, and executes alongside the investors she partners with.
              </p>
              <p className="mentor-bio">
                Mentored by <strong>Grant Cardone</strong> and specializing in value-add and institutional multifamily strategies, Diva helps high-income earners and sophisticated investors access opportunities typically reserved for the largest institutional players.
              </p>
              <ul className="mentor-creds">
                <li><strong>20+ years</strong> of real estate experience</li>
                <li><strong>$700M+</strong> closed transactions in last 3 years</li>
                <li><strong>CBRE</strong> Multifamily Specialist — Fortune 150</li>
                <li>Mentored by Grant Cardone</li>
                <li>Specialist in value-add &amp; institutional strategies</li>
              </ul>
            </div>

            {/* Lou Lopez */}
            <div className="mentor-card reveal">
              <div className="mentor-header">
                <div className="mentor-monogram">LL</div>
                <div>
                  <div className="mentor-role">Co-Founder · Managing Partner</div>
                  <div className="mentor-name">Lou Lopez</div>
                  <div className="mentor-title">25+ Years Corporate &amp; Investment Leadership</div>
                </div>
              </div>
              <p className="mentor-bio">
                Lou spent <strong>25 years in corporate leadership</strong> at Fortune 100 companies — holding senior roles from global sales to Corporate EVP and multiple board positions.
                Within that tenure, he accumulated over 15 years working with private equity firms, registered investment advisers, and broker dealers on fund formation, regulatory compliance, operations, and investor relations.
              </p>
              <p className="mentor-bio">
                With 20+ years in real estate and significant investment in advanced education through <strong>Tony Robbins and Grant Cardone</strong> programs, Lou continues to be mentored by billionaire real estate titans.
                His affinity for big data analysis and best-practices approach powers Rescia&rsquo;s disciplined investment framework.
              </p>
              <ul className="mentor-creds">
                <li><strong>25+ years</strong> corporate &amp; investment leadership</li>
                <li><strong>20+ years</strong> real estate investing experience</li>
                <li><strong>15+ years</strong> with PE firms, RIAs &amp; broker dealers</li>
                <li>Fortune 100 executive &amp; board experience</li>
                <li>Mentored by Grant Cardone &amp; Tony Robbins</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== OFFER ========== */}
      <section className="offer">
        <div className="container">
          <div className="offer-card reveal">
            <div className="offer-badge">◆ 2026 Cohort · Now Enrolling</div>
            <h2>The complete <span className="italic">Multifamily Mastery</span> program.</h2>
            <p className="offer-intro">
              Twelve modules. 126 deep-dive topics. Five Excel templates. One proven playbook — delivered with the mentorship and community that actually moves deals across the finish line.
            </p>
            <ul className="offer-features">
              <li><span className="check">✓</span> <span><strong>12 structured modules · 126 topics</strong> covering market identification through exit</span></li>
              <li><span className="check">✓</span> <span><strong>5 Excel templates</strong> — MSA scorecard, full underwriting model, debt model, LOI, exit waterfall</span></li>
              <li><span className="check">✓</span> <span><strong>PPM &amp; legal documentation</strong> — attorney-reviewed templates for 506(b)/(c) offerings</span></li>
              <li><span className="check">✓</span> <span><strong>Interactive quizzes</strong> and module-by-module knowledge verification</span></li>
              <li><span className="check">✓</span> <span><strong>1:1 mentor access</strong> — live deal review, underwriting feedback, capital-raise guidance</span></li>
              <li><span className="check">✓</span> <span><strong>Due diligence toolkit</strong> — 60+ point checklist, Phase I/II ESA guidance, PM scoring</span></li>
              <li><span className="check">✓</span> <span><strong>Lifetime community access</strong> — peer network, deal partners, and ongoing updates</span></li>
            </ul>
            <div className="offer-cta-wrap">
              <a href="#" className="btn-primary" onClick={openModal}>
                Book Your Free Strategy Call
                <span className="arrow">→</span>
              </a>
              <div className="offer-fine">30-minute call · By application only · Limited 2026 seats</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-head reveal">
            <div className="section-eyebrow">Common Questions</div>
            <h2>Before you <span className="italic">apply.</span></h2>
          </div>
          <div className="faq-list reveal">
            {faq.map(([q, a], i) => (
              <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={i}>
                <button className="faq-q" onClick={() => toggleFaq(i)}>
                  {q}
                  <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div className="faq-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="final-cta">
        <div className="container">
          <div className="final-cta-inner reveal">
            <h2>The next twelve months happen <span className="italic">either way.</span></h2>
            <p>
              Spend them watching deals close for other people — or spend them closing your own.
              2026 cohort seats are limited. Applications are reviewed in the order received.
            </p>
            <a href="#" className="btn-primary" onClick={openModal}>
              Book Your Free Strategy Call
              <span className="arrow">→</span>
            </a>
            <div className="offer-fine" style={{ marginTop: 20, color: 'rgba(250, 247, 242, 0.5)' }}>
              2026 cohort enrollment · Application required · No obligation call
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#" className="nav-logo">
                <img src="/rescia-logo.png" alt="Rescia Properties" />
                <div className="nav-logo-text">
                  <span className="nav-logo-name">Rescia Properties</span>
                  <span className="nav-logo-tag">Multifamily Mastery</span>
                </div>
              </a>
              <p>
                The complete multifamily real estate mentoring program. From market identification to exit —
                the proven system for building wealth through multifamily real estate.
              </p>
            </div>
            <div className="footer-links-group">
              <h4>Program</h4>
              <a href="#curriculum">Curriculum</a>
              <a href="#results">Results</a>
              <a href="#mentor">Mentor</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-links-group">
              <h4>Enroll</h4>
              <a href="#" onClick={openModal}>Book Strategy Call</a>
              <Link href="/signup">Apply Now</Link>
              <a href="mailto:rescia@resciaproperties.com">rescia@resciaproperties.com</a>
            </div>
            <div className="footer-links-group">
              <h4>Contact</h4>
              <a href="tel:7143105707">Diva · (714) 310-5707</a>
              <a href="tel:9496326665">Lou · (949) 632-6665</a>
              <a href="#">Los Angeles, CA</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 Rescia Properties · Multifamily Mastery · All rights reserved</div>
            <div>Not a securities offering · Past performance not indicative of future results</div>
          </div>
        </div>
      </footer>

      {/* ========== MODAL ========== */}
      <div
        className={`modal-overlay${modalOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="modal">
          <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
          {!submitted ? (
            <div id="formView">
              <div className="modal-logo">
                <img src="/rescia-logo.png" alt="" />
                <div className="modal-logo-text">
                  <div className="n">Rescia Properties</div>
                  <div className="t">Multifamily Mastery</div>
                </div>
              </div>
              <h3>Book your <span className="italic">free</span> strategy call.</h3>
              <p>
                30 minutes, 1-on-1. We&rsquo;ll review your current position, goals, and whether the 2026 Multifamily Mastery cohort is the right fit.
              </p>
              <form onSubmit={submitForm}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text" required placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email" required placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel" required placeholder="(555) 123-4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Investment Experience</label>
                  <select
                    required
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  >
                    <option value="">Select one...</option>
                    <option>High-net-worth individual (new to active RE)</option>
                    <option>Single-family investor (1–10 properties)</option>
                    <option>Single-family investor (10+ properties)</option>
                    <option>Small multifamily owner (5–50 units)</option>
                    <option>Active syndicator / operator</option>
                    <option>LP investor looking to go active</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>12-Month Goal</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Close my first 40+ unit syndication..."
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Request My Call
                  <span className="arrow">→</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="success-msg show" id="successView">
              <div className="check-big">✓</div>
              <h3>Application <span className="italic">received.</span></h3>
              <p>We&rsquo;ll review your submission and reach out within 24 hours to schedule your strategy call. Keep an eye on your inbox.</p>
              <button className="btn-secondary" onClick={closeModal} style={{ marginTop: 12 }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
