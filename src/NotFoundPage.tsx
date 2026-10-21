import { ARTICLE_LIST } from "./content/articles";

export default function NotFoundPage({ slug }: { slug: string }) {
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
      <main className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Page not found</h1>
        <p className="text-ink/90 leading-relaxed mt-4">
          There is no guide at <span className="font-mono text-sm">/guides/{slug}</span>.
          It may have been moved, or the link may have a typo.
        </p>
        <a
          href="/"
          className="inline-block mt-8 bg-ink text-white font-bold rounded-xl px-8 py-3 hover:opacity-90 transition"
        >
          Open the calculator
        </a>
        {ARTICLE_LIST.length > 0 && (
          <div className="mt-12 text-left">
            <h2 className="font-bold mb-3">Available guides</h2>
            <ul className="space-y-2">
              {ARTICLE_LIST.map((a) => (
                <li key={a.slug}>
                  <a href={`/guides/${a.slug}`} className="font-semibold text-ink underline">
                    {a.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
