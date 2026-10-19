/** Branded not-found page for unknown guide slugs (client-side routing). */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-burn inline-block" aria-hidden="true" />
            <span className="font-extrabold tracking-tight text-lg">RTO Leak</span>
          </a>
          <span className="text-xs font-semibold text-smoke border border-line rounded-full px-3 py-1">
            Free · No signup · No tracking
          </span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-24 text-center">
        <p className="text-sm font-extrabold tracking-widest text-burn">404</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2">Page not found</h1>
        <p className="text-smoke mt-3">
          This guide doesn&apos;t exist. The calculator and the published guides are one click away.
        </p>
        <a
          href="/"
          className="inline-block mt-8 rounded-xl bg-ink text-white font-bold px-6 py-3 hover:opacity-90"
        >
          Back to the calculator
        </a>
      </main>
    </div>
  );
}
