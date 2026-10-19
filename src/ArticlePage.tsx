import { ARTICLES, type Block } from "./content/articles";
import { CONFIG } from "./config";

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case "h2":
      return (
        <h2 key={i} className="text-xl font-extrabold tracking-tight mt-10 mb-3">
          {b.text}
        </h2>
      );
    case "p":
      return (
        <p key={i} className="text-ink/90 leading-relaxed mb-4">
          {b.text}
        </p>
      );
    case "list":
      return (
        <ul key={i} className="list-disc pl-5 space-y-2 mb-4 text-ink/90 leading-relaxed">
          {b.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
    case "formula":
      return (
        <div key={i} className="rounded-xl border border-line bg-card p-5 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-smoke mb-1">{b.label}</div>
          <div className="text-lg font-bold tabular-nums">{b.text}</div>
        </div>
      );
    case "sources":
      return (
        <div key={i} className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight mb-3">Sources</h2>
          <ul className="space-y-3">
            {b.items.map((s, j) => (
              <li key={j} className="text-sm leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-ink underline"
                >
                  {s.label}
                </a>
                <div className="text-smoke mt-0.5">{s.note}</div>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export default function ArticlePage({ slug }: { slug: string }) {
  const a = ARTICLES[slug];
  if (!a) return null;
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-burn inline-block" aria-hidden="true" />
            <span className="font-extrabold tracking-tight text-lg">RTO Leak</span>
          </a>
          <a href="/" className="text-sm font-semibold text-smoke underline">
            Open the calculator
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-20">
        <nav aria-label="Breadcrumb" className="pt-8 text-sm text-smoke">
          <a href="/" className="underline">RTO Leak</a>
          <span aria-hidden="true"> / </span>
          <span>Guides</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-3">
          {a.title}
        </h1>
        <p className="text-sm text-smoke mt-2">
          Published {a.published} · {Math.max(3, Math.round(a.blocks.length / 2))} min read
        </p>
        <p className="text-lg text-ink/90 leading-relaxed mt-6 mb-2">{a.intro}</p>

        <article>{a.blocks.map(renderBlock)}</article>

        <section className="mt-12 rounded-2xl bg-ink text-white p-8 text-center">
          <h2 className="text-xl font-extrabold tracking-tight">Run your own numbers</h2>
          <p className="text-white/70 mt-2 text-sm max-w-md mx-auto">
            The free RTO Leak calculator uses this exact method — enter your orders, COD share
            and RTO rate, and see the annual cost in 20 seconds.
          </p>
          <a
            href="/"
            className="inline-block mt-5 bg-burn-deep hover:opacity-90 transition text-white font-bold rounded-xl px-8 py-3"
          >
            Calculate your RTO cost
          </a>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-3xl mx-auto px-5 py-6 text-center text-sm text-smoke">
          {CONFIG.creatorName ? (
            <span>
              Built by{" "}
              <a href={CONFIG.creatorLink || "#"} className="font-semibold text-ink underline">
                {CONFIG.creatorName}
              </a>{" "}
              for D2C India
            </span>
          ) : (
            <span>Made for D2C India · Free forever · No tracking, no signup, no data collection</span>
          )}
        </div>
      </footer>
    </div>
  );
}
