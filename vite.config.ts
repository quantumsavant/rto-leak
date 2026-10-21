import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { ARTICLES } from './src/content/articles.js'
import { buildGuideHtml, buildHomeHtml } from './src/lib/prerender.js'

/**
 * Build-time prerender (no new dependencies).
 * - Guide routes: dist/guides/<slug>/index.html from the built index.html
 *   with article-specific <title>, meta description, canonical, OG/Twitter
 *   tags, Article JSON-LD and the article body in the initial HTML, so
 *   crawlers and social-preview bots (which don't run JS) see the right page.
 * - Homepage: the same built index.html gets a text-only static block
 *   (H1, intro, RTO definition, formula, guide links) injected into #root,
 *   so the homepage is no longer an empty shell before JavaScript runs.
 *   Guides are generated FIRST from the pristine template, then the
 *   homepage is rewritten — reversing the order would break the guides'
 *   #root replacement.
 * The same JS bundle boots on every page and renders the app for visitors.
 */
function prerender() {
  return {
    name: 'prerender',
    closeBundle() {
      const dist = path.resolve('dist')
      const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      for (const a of Object.values(ARTICLES)) {
        const dir = path.join(dist, 'guides', a.slug)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), buildGuideHtml(template, a))
        console.log(`[prerender] wrote guides/${a.slug}/index.html`)
      }
      fs.writeFileSync(path.join(dist, 'index.html'), buildHomeHtml(template))
      console.log('[prerender] wrote homepage static block into index.html')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), prerender()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
})
