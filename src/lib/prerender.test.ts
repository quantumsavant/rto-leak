import { describe, expect, it } from "vitest";
import { ARTICLES } from "../content/articles";
import { buildGuideHtml, escapeAttr, escapeHtml } from "./prerender";

const TEMPLATE = `<!doctype html><html><head>
<title>Home title</title>
<meta name="description" content="Home description" />
<meta property="og:title" content="Home title" />
<meta property="og:description" content="Home description" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://rto-leak-18j6.vercel.app/" />
<meta property="og:image" content="https://rto-leak-18j6.vercel.app/og-image.jpg" />
<meta name="twitter:title" content="Home title" />
<meta name="twitter:description" content="Home description" />
<link rel="canonical" href="https://rto-leak-18j6.vercel.app/" />
</head><body><div id="root"></div><script src="/assets/index.js"></script></body></html>`;

const ARTICLE = ARTICLES["how-to-calculate-rto-costs"];

describe("buildGuideHtml", () => {
  it("uses the article title, description and self-referencing canonical", () => {
    const html = buildGuideHtml(TEMPLATE, ARTICLE);
    expect(html).toContain(`<title>${ARTICLE.metaTitle}</title>`);
    expect(html).toContain(
      `<link rel="canonical" href="https://rto-leak-18j6.vercel.app/guides/how-to-calculate-rto-costs" />`,
    );
    expect(html).not.toContain('content="Home description"');
  });

  it("sets article Open Graph/Twitter metadata and og:type=article", () => {
    const html = buildGuideHtml(TEMPLATE, ARTICLE);
    expect(html).toContain(`property="og:url" content="https://rto-leak-18j6.vercel.app/guides/how-to-calculate-rto-costs"`);
    expect(html).toContain(`property="og:type" content="article"`);
    expect(html).toContain(`name="twitter:title" content="${ARTICLE.metaTitle}"`);
    // Shared homepage image is kept, not blanked.
    expect(html).toContain("og-image.jpg");
  });

  it("embeds the article body in the initial HTML", () => {
    const html = buildGuideHtml(TEMPLATE, ARTICLE);
    expect(html).toContain(`<h1>${ARTICLE.title}</h1>`);
    expect(html).toContain(ARTICLE.intro.slice(0, 60));
    expect(html).toContain("RTO rate = (RTO orders ÷ COD orders dispatched) × 100");
    expect(html).toContain("GoKwik — How to reduce RTO in e-commerce");
    expect(html).toContain('"@type":"Article"');
  });

  it("keeps the SPA bundle script so the page still boots", () => {
    const html = buildGuideHtml(TEMPLATE, ARTICLE);
    expect(html).toContain('<script src="/assets/index.js"></script>');
  });

  it("escapes special characters in article text", () => {
    expect(escapeHtml(`a & b <c> "d"`)).toBe(`a &amp; b &lt;c&gt; "d"`);
    expect(escapeAttr(`a "b" & <c>`)).toBe(`a &quot;b&quot; &amp; &lt;c&gt;`);
  });
});
