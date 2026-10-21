/**
 * Educational articles. Only published here when the content is real and
 * useful — drafts stay out of this file and out of sitemap.xml.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "formula"; label: string; text: string }
  | { type: "sources"; items: { label: string; url: string; note: string }[] };

export interface Article {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  published: string; // ISO date
  intro: string;
  blocks: Block[];
}

export const ARTICLES: Record<string, Article> = {
  "how-to-calculate-rto-costs": {
    slug: "how-to-calculate-rto-costs",
    title: "How to Calculate RTO Costs for an Indian D2C Brand",
    metaTitle: "How to Calculate RTO Costs for an Indian D2C Brand — RTO Leak",
    metaDescription:
      "The RTO rate formula, what each returned order really costs, and a worked example with real numbers. Free RTO calculator included.",
    published: "2026-10-19",
    intro:
      "Return to Origin (RTO) is when a dispatched COD order comes back undelivered. You pay shipping both ways and earn nothing on that order. For Indian D2C brands running heavy COD, RTO is often the single largest controllable logistics leak. Here is how to measure it properly.",
    blocks: [
      { type: "h2", text: "Step 1 — Calculate your RTO rate" },
      {
        type: "p",
        text: "The industry-standard definition (used by GoKwik) is:",
      },
      {
        type: "formula",
        label: "RTO rate",
        text: "RTO rate = (RTO orders ÷ COD orders dispatched) × 100",
      },
      {
        type: "p",
        text: "Example: you dispatch 1,000 COD orders in a month and 250 return undelivered. Your RTO rate is 25%. One warning: some dashboards divide by all orders instead of COD orders, which understates the rate. Always check which denominator your dashboard uses before comparing.",
      },
      { type: "h2", text: "Step 2 — Know what one RTO event costs" },
      {
        type: "p",
        text: "Every RTO event carries, at minimum:",
      },
      {
        type: "list",
        items: [
          "Forward shipping — paid whether or not the order is delivered.",
          "Reverse logistics — the courier charges again to bring it back.",
          "Operational costs — warehouse receiving, QA, repackaging the returned unit.",
        ],
      },
      {
        type: "p",
        text: "GoKwik's published breakdown puts this at ₹200–250 per event for a ₹1,000 order. Treat that as a shipping floor: it excludes blocked inventory, extra working-capital lockup, ad spend wasted on the order, and the strain a high RTO rate puts on courier relationships.",
      },
      { type: "h2", text: "Step 3 — Worked example" },
      {
        type: "p",
        text: "A brand doing 1,000 orders a month, with 60% COD, a 30% RTO rate, and ₹225 per event:",
      },
      {
        type: "list",
        items: [
          "COD orders: 1,000 × 60% = 600 per month.",
          "RTO events: 600 × 30% = 180 per month (2,160 per year).",
          "Monthly logistics cost: 180 × ₹225 = ₹40,500.",
          "Annual logistics cost: ₹40,500 × 12 = ₹4,86,000.",
        ],
      },
      {
        type: "p",
        text: "These are the exact defaults in the RTO Leak calculator — change any input and every dependent figure updates immediately.",
      },
      { type: "h2", text: "Step 4 — Compare against a target" },
      {
        type: "p",
        text: "A single number rarely drives action. Pick a realistic target rate — say 20% instead of 30% — and compute the gap. In the example above, dropping from 30% to 20% removes 60 RTOs a month, worth about ₹1.62 lakh a year in shipping alone. That gap is your what-if scenario: a planning input, not a promise, because actual savings depend on your courier contracts and execution.",
      },
      { type: "h2", text: "What this math does not cover" },
      {
        type: "list",
        items: [
          "Resale recovery — returned goods can usually be resold, so order value (GMV) passing through RTO is tied-up capital, not lost money.",
          "Category effects — fashion and high-consideration categories run hotter RTO rates than the average.",
          "Pin-code concentration — a small set of pin codes often drives most RTOs; the average hides that.",
          "Prepaid orders — these carry a far lower RTO rate (around 2–3% per Shiprocket), so shifting mix toward prepaid is usually the highest-leverage move.",
        ],
      },
      {
        type: "sources",
        items: [
          {
            label: "GoKwik — How to reduce RTO in e-commerce",
            url: "https://www.gokwik.co/blog/how-to-reduce-rto-in-e-commerce",
            note: "Opened and read 2026-10-19. Source for the RTO formula, the ₹200–250/event figure, and the 20–25% average COD RTO benchmark.",
          },
          {
            label: "Shiprocket — Order value recovery for eCommerce",
            url: "https://www.shiprocket.in/blog/order-value-recovery/",
            note: "Seen via search excerpt 2026-10-19 (page not opened). Source for the 25–30% COD RTO figure and ~2–3% prepaid RTO figure.",
          },
          {
            label: "RTO Leak — How to Calculate RTO Rate",
            url: "https://rto-leak-18j6.vercel.app/guides/how-to-calculate-rto-rate",
            note: "Companion guide: COD RTO rate vs overall RTO rate, with a worked example and the 5 mistakes that make rates incomparable.",
          },
        ],
      },
    ],
  },
  "how-to-calculate-rto-rate": {
    slug: "how-to-calculate-rto-rate",
    title: "How to Calculate RTO Rate for an Indian Ecommerce Brand",
    metaTitle: "How to Calculate RTO Rate for an Indian Ecommerce Brand — RTO Leak",
    metaDescription:
      "RTO rate = RTO orders ÷ orders dispatched × 100 — but which orders? Learn the COD rate vs the overall rate, a worked example, and the 5 mistakes that make rates incomparable.",
    published: "2026-10-21",
    intro:
      "RTO rate is the share of dispatched orders that come back undelivered. The formula is one line, but it hides one decision that changes the answer: what you divide by. Two brands can report different rates for the same underlying problem simply because one divides by COD orders and the other by all orders. State your denominator every time, or your rate cannot be compared to anything.",
    blocks: [
      { type: "h2", text: "What RTO rate actually measures" },
      {
        type: "p",
        text: "An order counts toward RTO when it is dispatched, fails delivery, and returns to your warehouse. It happens before or at the delivery stage. It is not a post-delivery return: once a customer accepts and pays for an order and later sends it back, that is a customer return (RTV), a different metric with different causes and costs.",
      },
      { type: "h2", text: "The formula — and the denominator decision" },
      {
        type: "formula",
        label: "RTO rate",
        text: "RTO rate = (RTO orders ÷ orders dispatched) × 100",
      },
      {
        type: "p",
        text: "There are two standard versions, and you should always say which one you mean. The COD RTO rate divides by COD orders dispatched only — this is GoKwik's definition, and it answers 'how risky is my COD book?' The overall RTO rate divides by all orders dispatched, and it answers 'how much of my whole business comes back?' Both are legitimate; they answer different questions.",
      },
      { type: "h2", text: "Worked example — one business, two rates" },
      {
        type: "p",
        text: "A brand dispatches 3,000 orders in a month, 60% of them COD, and 450 orders come back as RTO:",
      },
      {
        type: "list",
        items: [
          "COD orders dispatched: 3,000 × 60% = 1,800 per month.",
          "COD RTO rate: 450 ÷ 1,800 × 100 = 25%.",
          "Overall RTO rate: 450 ÷ 3,000 × 100 = 15%.",
        ],
      },
      {
        type: "p",
        text: "Same business, same 450 failed orders — 25% one way, 15% the other. Neither number is wrong, but quoting one against the other's benchmark is meaningless. For the cost side, at the calculator's default assumption of ₹225 per event, 450 events × ₹225 = ₹1,01,250 a month, or about ₹12.15 lakh a year if that month repeats — in shipping alone; the companion cost guide shows that math in full.",
      },
      { type: "h2", text: "5 mistakes that make RTO rates incomparable" },
      {
        type: "list",
        items: [
          "Mixing denominators — comparing your overall rate to someone else's COD rate, or vice versa.",
          "Counting orders still in transit or in NDR follow-up as RTO — count only orders that actually reached RTO status.",
          "Counting post-delivery returns as RTO — returns after acceptance belong to the returns rate, not RTO.",
          "Dividing by delivered orders — the base is orders dispatched, not orders that made it. A delivered-only denominator inflates the rate.",
          "Mixing periods — dividing this month's returns by last month's dispatches, or ignoring that returns lag dispatches by days. Use one period's dispatched base and note the lag.",
        ],
      },
      { type: "h2", text: "What counts as a good rate?" },
      {
        type: "p",
        text: "There is no single universal good rate: it moves with payment mix, category, and geography, and every published figure uses its own definition and sample. What others report, with those caveats attached: GoKwik puts the average RTO rate in Indian e-commerce at 20–25% (their formula uses COD orders dispatched as the denominator). Qikink's 2026 order data (1 Jan–31 Aug 2026, 4,16,887 domestic orders from fashion-focused sellers — their sample, not the whole Indian market) reports COD 30.1%, prepaid 1.5%, and 12.4% overall. Treat these as context, not targets: the most useful comparison is your own rate, measured the same way, month on month.",
      },
      { type: "h2", text: "From rate to rupees" },
      {
        type: "p",
        text: "A rate alone does not tell you what RTO costs. Multiply your RTO events by your cost per event, or run the free RTO Leak calculator with your orders, COD share, and rate — it uses this exact method and shows the annual cost plus a what-if target scenario.",
      },
      {
        type: "sources",
        items: [
          {
            label: "GoKwik — How to reduce RTO in e-commerce",
            url: "https://www.gokwik.co/blog/how-to-reduce-rto-in-e-commerce",
            note: "Opened and read 2026-10-21. Source for the RTO formula with COD orders dispatched as the denominator, and the 20–25% average RTO rate in Indian e-commerce.",
          },
          {
            label: "Qikink — What is RTO and how does it affect online businesses?",
            url: "https://qikink.com/blog/what-is-return-to-origin-how-it-affects-online-businesses/",
            note: "Opened and read 2026-10-21. Data: 1 Jan–31 Aug 2026, 4,16,887 domestic shipped orders; RTO orders = orders that reached 'RTO initiated'; in-transit orders excluded; fashion-focused sellers (apparel, accessories, home decor) — Qikink's sample, not the whole Indian market. Page published 2025-10-18; data last updated 12 Oct 2026.",
          },
          {
            label: "RTO Leak — How to Calculate RTO Costs",
            url: "https://rto-leak-18j6.vercel.app/guides/how-to-calculate-rto-costs",
            note: "Companion guide: turn this rate into an annual cost with a worked example.",
          },
        ],
      },
    ],
  },
};

export const ARTICLE_LIST = Object.values(ARTICLES);
