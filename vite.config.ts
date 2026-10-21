import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { ARTICLES } from './src/content/articles.js'
import { buildGuideHtml } from './src/lib/prerender.js'

/**
 * Build-time prerender for guide routes (no new dependencies).
 * Generates dist/guides/<slug>/index.html from the built index.html with
 * article-specific <title>, meta description, canonical, OG/Twitter tags,
 * Article JSON-LD and the article body in the initial HTML, so crawlers
 * and social-preview bots (which don't run JS) see the correct page.
 * The same JS bundle boots on the page and renders the article for visitors.
 */
function prerenderGuides() {
  return {
    name: 'prerender-guides',
    closeBundle() {
      const dist = path.resolve('dist')
      const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      for (const a of Object.values(ARTICLES)) {
        const dir = path.join(dist, 'guides', a.slug)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), buildGuideHtml(template, a))
        console.log(`[prerender-guides] wrote guides/${a.slug}/index.html`)
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
