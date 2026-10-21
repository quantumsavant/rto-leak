import type { Article, Block } from "../content/articles.js";

/**
 * Build-time guide prerendering (pure, unit-testable).
 *
 * Takes the built homepage HTML template and returns a guide page whose
 * initial HTML already contains the article's title, meta description,
 * canonical, Open Graph/Twitter metadata, Article JSON-LD, and the article
 * body — so crawlers and social-preview bots that do not run JavaScript
 * still see the right page. The SPA bundle still boots on the page and
 * takes over rendering for visitors.
 */

export const SITE_URL = "https://rto-leak-18j6.vercel.app";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function isSafeHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function renderBlockHtml(b: Block): string {
  switch (b.type) {
    case "h2":
      return `<h2>${escapeHtml(b.text)}</h2>`;
    case "p":
      return `<p>${escapeHtml(b.text)}</p>`;
    case "list":
      return `<ul>${b.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`;
    case "formula":
      return `<div><div>${escapeHtml(b.label)}</div><div>${escapeHtml(b.text)}</div></div>`;
    case "sources":
      return `<h2>Sources</h2><ul>${b.items
        .map(
          (s) =>
            `<li>${isSafeHttpsUrl(s.url) ? `<a href="${escapeAttr(s.url)}">${escapeHtml(s.label)}</a>` : escapeHtml(s.label)}<div>${escapeHtml(s.note)}</div></li>`,
        )
        .join("")}</ul>`;
    default:
      return "";
  }
}

export function renderArticleBodyHtml(a: Article): string {
  const readMins = Math.max(3, Math.round(a.blocks.length / 2));
  return [
    `<header><a href="/">RTO Leak</a> · <a href="/">Open the calculator</a></header>`,
    `<nav><a href="/">RTO Leak</a> / Guides</nav>`,
    `<h1>${escapeHtml(a.title)}</h1>`,
    `<p>Published ${escapeHtml(a.published)} · ${readMins} min read</p>`,
    `<p>${escapeHtml(a.intro)}</p>`,
    `<article>${a.blocks.map(renderBlockHtml).join("")}</article>`,
    `<section><h2>Run your own numbers</h2><p>The free RTO Leak calculator uses this exact method.</p><a href="/">Calculate your RTO cost</a></section>`,
  ].join("");
}

function swapMeta(
  page: string,
  pattern: RegExp,
  replacement: string,
  label: string,
  slug: string,
): string {
  if (!pattern.test(page)) {
    console.warn(`[prerender] pattern not found for ${label} (${slug})`);
    return page;
  }
  return page.replace(pattern, replacement);
}

/** Build the full static HTML for one guide from the homepage template. */
export function buildGuideHtml(template: string, a: Article, site: string = SITE_URL): string {
  const url = `${site}/guides/${a.slug}`;
  let page = template;
  const swaps: Array<[RegExp, string, string]> = [
    [/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(a.metaTitle)}</title>`, "title"],
    [
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${escapeAttr(a.metaDescription)}$2`,
      "meta description",
    ],
    [
      /(<meta\s+property="og:title"\s+content=")[\s\S]*?(")/,
      `$1${escapeAttr(a.metaTitle)}$2`,
      "og:title",
    ],
    [
      /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
      `$1${escapeAttr(a.metaDescription)}$2`,
      "og:description",
    ],
    [
      /(<meta\s+property="og:type"\s+content=")[\s\S]*?(")/,
      `$1article$2`,
      "og:type",
    ],
    [
      /(<meta\s+property="og:url"\s+content=")[\s\S]*?(")/,
      `$1${url}$2`,
      "og:url",
    ],
    [
      /(<meta\s+name="twitter:title"\s+content=")[\s\S]*?(")/,
      `$1${escapeAttr(a.metaTitle)}$2`,
      "twitter:title",
    ],
    [
      /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
      `$1${escapeAttr(a.metaDescription)}$2`,
      "twitter:description",
    ],
    [
      /(<link\s+rel="canonical"\s+href=")[\s\S]*?(")/,
      `$1${url}$2`,
      "canonical",
    ],
  ];
  for (const [re, replacement, label] of swaps) {
    page = swapMeta(page, re, replacement, label, a.slug);
  }
  const org = { "@type": "Organization", name: "RTO Leak", url: site };
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.metaDescription,
    mainEntityOfPage: url,
    datePublished: a.published,
    author: org,
    publisher: org,
  })}</script>`;
  if (page.includes("</head>")) {
    page = page.replace("</head>", `${jsonLd}</head>`);
  }
  if (page.includes('<div id="root"></div>')) {
    page = page.replace(
      '<div id="root"></div>',
      `<div id="root">${renderArticleBodyHtml(a)}</div>`,
    );
  } else {
    console.warn(`[prerender] #root placeholder not found (${a.slug})`);
  }
  return page;
}

/**
 * Static homepage block for the initial HTML (Week 2).
 *
 * Every string below is copied verbatim from the app's own hero and
 * "What is RTO?" sections in src/App.tsx — no new copy is invented here.
 * Text-only on purpose: no inputs, sliders, or buttons, so there are no
 * dead controls for a visitor whose JavaScript never runs. The SPA bundle
 * still boots on the page and replaces this block with the interactive
 * calculator for visitors; crawlers and no-JS readers see the meaning.
 * Head metadata (title, description, canonical, OG, WebApplication
 * JSON-LD) is left exactly as the template provides it.
 */
export function renderHomeStaticHtml(): string {
  return [
    `<header><a href="/">RTO Leak</a></header>`,
    `<h1>How much is RTO costing you?</h1>`,
    `<p>COD RTO rates in India run 20–30% (GoKwik, Shiprocket). Enter your numbers — the logistics cost, the tied-up capital, and a what-if scenario update immediately.</p>`,
    `<h2>What is RTO?</h2>`,
    `<p>RTO — Return to Origin — is when a dispatched order comes back undelivered. In Indian ecommerce it is overwhelmingly a COD problem: the buyer is not available, refuses the parcel, or the address was never serviceable. You pay forward shipping plus return shipping, and earn nothing on that order. COD RTO rates in India run 20–30% (GoKwik, Shiprocket), against roughly 2–3% for prepaid orders.</p>`,
    `<p>RTO rate = RTO orders ÷ COD orders dispatched (GoKwik's definition).</p>`,
    `<nav><a href="/guides/how-to-calculate-rto-costs">How to Calculate RTO Costs for an Indian D2C Brand</a> · <a href="/guides/how-to-calculate-rto-rate">How to Calculate RTO Rate for an Indian Ecommerce Brand</a></nav>`,
  ].join("");
}

/** Inject the static homepage block into the built index.html. */
export function buildHomeHtml(template: string): string {
  if (template.includes('<div id="root"></div>')) {
    return template.replace(
      '<div id="root"></div>',
      `<div id="root">${renderHomeStaticHtml()}</div>`,
    );
  }
  console.warn("[prerender] #root placeholder not found (homepage)");
  return template;
}
