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
        ],
      },
    ],
  },
};

export const ARTICLE_LIST = Object.values(ARTICLES);
