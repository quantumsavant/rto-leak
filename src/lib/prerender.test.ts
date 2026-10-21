import { describe, expect, it } from "vitest";
import { ARTICLES } from "../content/articles";
import { buildGuideHtml, buildHomeHtml, escapeAttr, escapeHtml } from "./prerender";

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

  it("adds one Article JSON-LD block with author and publisher for every guide", () => {
    const expectedOrg = {
      "@type": "Organization",
      name: "RTO Leak",
      url: "https://rto-leak-18j6.vercel.app",
    };
    for (const article of Object.values(ARTICLES)) {
      const html = buildGuideHtml(TEMPLATE, article);
      // Exactly one Article block: no duplication with the template's WebApplication block.
      expect(html.match(/"@type":"Article"/g)).toHaveLength(1);
      const match = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      );
      expect(match).not.toBeNull();
      const data = JSON.parse(match![1]);
      expect(data["@type"]).toBe("Article");
      expect(data.headline).toBe(article.title);
      expect(data.datePublished).toBe(article.published);
      expect(data.mainEntityOfPage).toBe(
        `https://rto-leak-18j6.vercel.app/guides/${article.slug}`,
      );
      expect(data.author).toEqual(expectedOrg);
      expect(data.publisher).toEqual(expectedOrg);
    }
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

describe("buildHomeHtml", () => {
  it("injects the homepage H1, intro, RTO definition, formula and both guide links", () => {
    const html = buildHomeHtml(TEMPLATE);
    expect(html).toContain("<h1>How much is RTO costing you?</h1>");
    expect(html).toContain("COD RTO rates in India run 20–30% (GoKwik, Shiprocket)");
    expect(html).toContain("RTO — Return to Origin — is when a dispatched order comes back undelivered.");
    expect(html).toContain("RTO rate = RTO orders ÷ COD orders dispatched (GoKwik's definition).");
    expect(html).toContain('href="/guides/how-to-calculate-rto-costs"');
    expect(html).toContain('href="/guides/how-to-calculate-rto-rate"');
    expect(html).not.toContain('<div id="root"></div>');
  });

  it("contains no interactive controls, so there are no dead elements pre-JS", () => {
    const html = buildHomeHtml(TEMPLATE);
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<select");
  });

  it("preserves the template head metadata and keeps the SPA bundle script", () => {
    const html = buildHomeHtml(TEMPLATE);
    expect(html).toContain("<title>Home title</title>");
    expect(html).toContain('<link rel="canonical" href="https://rto-leak-18j6.vercel.app/" />');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('<script src="/assets/index.js"></script>');
  });

  it("returns the template unchanged when the #root placeholder is missing", () => {
    const noRoot = TEMPLATE.replace('<div id="root"></div>', "<div></div>");
    expect(buildHomeHtml(noRoot)).toBe(noRoot);
  });
});
