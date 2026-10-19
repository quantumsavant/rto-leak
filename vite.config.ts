import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { ARTICLES } from './src/content/articles.js'

const SITE = 'https://rto-leak-18j6.vercel.app'

type GuideMeta = { metaTitle: string; metaDescription: string }

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Build-time prerender for guide routes (no new dependencies).
 * Generates dist/guides/<slug>/index.html from the built index.html with
 * article-specific <title>, meta description, OG/Twitter tags and canonical,
 * so crawlers and social-preview bots (which don't run JS) see correct
 * metadata. The same JS bundle boots on the page and renders the article.
 */
function prerenderGuides() {
  return {
    name: 'prerender-guides',
    closeBundle() {
      const dist = path.resolve('dist')
      const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      const entries = Object.entries(ARTICLES) as Array<[string, GuideMeta]>
      for (const [slug, a] of entries) {
        let page = template
        const swaps: Array<[RegExp, string, string]> = [
          [/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(a.metaTitle)}</title>`, 'title'],
          [
            /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
            `$1${escapeAttr(a.metaDescription)}$2`,
            'meta description',
          ],
          [
            /(<meta\s+property="og:title"\s+content=")[\s\S]*?(")/,
            `$1${escapeAttr(a.metaTitle)}$2`,
            'og:title',
          ],
          [
            /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
            `$1${escapeAttr(a.metaDescription)}$2`,
            'og:description',
          ],
          [
            /(<meta\s+property="og:url"\s+content=")[\s\S]*?(")/,
            `$1${SITE}/guides/${slug}$2`,
            'og:url',
          ],
          [
            /(<meta\s+name="twitter:title"\s+content=")[\s\S]*?(")/,
            `$1${escapeAttr(a.metaTitle)}$2`,
            'twitter:title',
          ],
          [
            /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
            `$1${escapeAttr(a.metaDescription)}$2`,
            'twitter:description',
          ],
          [
            /(<link\s+rel="canonical"\s+href=")[\s\S]*?(")/,
            `$1${SITE}/guides/${slug}$2`,
            'canonical',
          ],
        ]
        for (const [re, replacement, label] of swaps) {
          if (!re.test(page)) {
            console.warn(`[prerender-guides] pattern not found for ${label} (${slug})`)
          }
          page = page.replace(re, replacement)
        }
        const dir = path.join(dist, 'guides', slug)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), page)
        console.log(`[prerender-guides] wrote guides/${slug}/index.html`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderGuides()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
})
