import { useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "./config";
import ArticlePage from "./ArticlePage";
import { ARTICLES } from "./content/articles";
import { parseRoute, type Route } from "./lib/route";
import { isSafeHttpUrl } from "./lib/url";
import {
  DEFAULT_INPUTS,
  calculate,
  formatCompact,
  formatINR,
  validateInputs,
  type Inputs,
  type Results,
} from "./lib/calc";

/* ---------------------------------- inputs ----------------------------------- */

function NumberField({
  id,
  value,
  min,
  max,
  onCommit,
  prefix,
  suffix,
  label,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (draft.trim() !== "" && Number.isFinite(n)) {
        onCommit(Math.min(max, Math.max(min, n)));
      }
      setDraft(null);
    }
  };

  return (
    <span className="inline-flex items-center rounded-lg border border-line bg-card px-2.5 py-1.5 focus-within:border-accent">
      {prefix && <span className="text-sm text-smoke mr-1">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={label}
        className="w-20 bg-transparent text-right text-base font-bold text-ink tabular-nums outline-none"
        value={shown}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(null);
        }}
      />
      {suffix && <span className="text-sm text-smoke ml-1">{suffix}</span>}
    </span>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-num`} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <NumberField
          id={`${id}-num`}
          label={label}
          value={value}
          min={min}
          max={max}
          onCommit={onChange}
          prefix={prefix}
          suffix={suffix}
        />
      </div>
      {hint && <p className="text-xs text-smoke mt-1 leading-relaxed">{hint}</p>}
      <input
        type="range"
        aria-label={`${label} slider`}
        className="leak-slider mt-2"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* --------------------------------- share card -------------------------------- */

interface CardData {
  annualBurn: string;
  annualRtos: string;
  rtoPct: number;
  codPct: number;
  costPerRto: string;
  targetRtoPct: number;
  scenarioSavings: string;
  cutPoints: number;
}

function drawShareCard(canvas: HTMLCanvasElement, d: CardData) {
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#14181d");
  bg.addColorStop(1, "#0b0e12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.36, 50, W / 2, H * 0.36, 520);
  glow.addColorStop(0, "rgba(229,72,77,0.20)");
  glow.addColorStop(1, "rgba(229,72,77,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  ctx.fillStyle = "#e5484d";
  ctx.font = "700 32px Inter, system-ui, sans-serif";
  ctx.fillText("RTO  LEAK", W / 2, 88);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 138px Inter, system-ui, sans-serif";
  ctx.fillText(d.annualBurn, W / 2, 248);

  ctx.fillStyle = "#9aa3af";
  ctx.font = "500 40px Inter, system-ui, sans-serif";
  ctx.fillText("burned on RTO every year", W / 2, 312);

  ctx.fillStyle = "#9aa3af";
  ctx.font = "500 30px Inter, system-ui, sans-serif";
  ctx.fillText(
    `${d.annualRtos} RTOs/yr  ·  ${d.rtoPct}% of COD orders  ·  ${d.costPerRto}/event`,
    W / 2,
    378
  );

  ctx.fillStyle = "#6ee7a0";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillText(
    `What-if: ${d.targetRtoPct}% target saves ${d.scenarioSavings}/yr (${d.cutPoints} pts, scenario)`,
    W / 2,
    432
  );

  ctx.fillStyle = "#e5484d";
  ctx.font = "700 28px Inter, system-ui, sans-serif";
  const cta = CONFIG.siteUrl ? `Calculate your leak — ${CONFIG.siteUrl}` : "Calculate your leak — free";
  ctx.fillText(cta, W / 2, 516);

  ctx.fillStyle = "#6b7280";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  ctx.fillText("Assumptions shown: cost/event as set · RTO = % of COD orders · estimates only", W / 2, 572);
}

/* ------------------------------------ app ------------------------------------ */

const fmtPct = (n: number) => `${n}%`;

const HOME_TITLE = "RTO Leak — Free RTO Cost Calculator for Indian D2C Brands";
const HOME_DESC =
  "Calculate your D2C brand's annual RTO cost in 20 seconds. Enter monthly orders, COD share, RTO rate and shipping cost — free, no signup, runs in your browser.";

export default function App() {
  const [route] = useState<Route>(() => parseRoute());

  useEffect(() => {
    if (route.view === "article") {
      const a = ARTICLES[route.slug];
      document.title = a.metaTitle;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", a.metaDescription);
    } else {
      document.title = HOME_TITLE;
      document.querySelector('meta[name="description"]')?.setAttribute("content", HOME_DESC);
    }
    window.scrollTo(0, 0);
  }, [route]);

  if (route.view === "article") return <ArticlePage slug={route.slug} />;
  return <Home />;
}

function Home() {
  const [inputs, setInputs] = useState<Inputs>({ ...DEFAULT_INPUTS });
  const cardRef = useRef<HTMLCanvasElement>(null);

  const set =
    (k: keyof Inputs) =>
    (v: number): void => {
      setInputs((prev) => {
        const next = { ...prev, [k]: v };
        if (k === "rtoPct" && next.targetRtoPct > v) next.targetRtoPct = v;
        return next;
      });
    };

  const reset = () => setInputs({ ...DEFAULT_INPUTS });

  const problems = validateInputs(inputs);
  const r: Results | null = useMemo(
    () => (problems.length === 0 ? calculate(inputs) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs.monthlyOrders, inputs.aov, inputs.codPct, inputs.rtoPct, inputs.costPerRto, inputs.targetRtoPct]
  );
  // Target-side comparison reuses the same pure module — no duplicated logic.
  const t: Results | null = useMemo(
    () =>
      problems.length === 0
        ? calculate({ ...inputs, rtoPct: inputs.targetRtoPct, targetRtoPct: inputs.targetRtoPct })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs.monthlyOrders, inputs.aov, inputs.codPct, inputs.targetRtoPct, inputs.costPerRto]
  );

  useEffect(() => {
    if (!r) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !cardRef.current) return;
      drawShareCard(cardRef.current, {
        annualBurn: formatCompact(r.annualBurn),
        annualRtos: Math.round(r.annualRtos).toLocaleString("en-IN"),
        rtoPct: inputs.rtoPct,
        codPct: inputs.codPct,
        costPerRto: formatINR(inputs.costPerRto),
        targetRtoPct: inputs.targetRtoPct,
        scenarioSavings: formatCompact(r.scenarioAnnualSavings),
        cutPoints: r.scenarioCutPoints,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [r, inputs]);

  const downloadCard = () => {
    const canvas = cardRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rto-leak-report.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const upiLink = CONFIG.upiId
    ? `upi://pay?pa=${encodeURIComponent(CONFIG.upiId)}&pn=${encodeURIComponent("RTO Leak")}&cu=INR`
    : "";
  const hasDonation = Boolean(CONFIG.razorpayLink || upiLink);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    if (!showQr) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowQr(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showQr]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-burn inline-block" aria-hidden="true" />
            <span className="font-extrabold tracking-tight text-lg">RTO Leak</span>
          </div>
          <span className="text-xs font-semibold text-smoke border border-line rounded-full px-3 py-1">
            Free · No signup · No tracking
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 pb-20">
        {/* Hero */}
        <section className="pt-10 pb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-2xl">
            How much is RTO costing you?
          </h1>
          <p className="text-smoke mt-3 max-w-2xl">
            COD RTO rates in India run 20–30% (GoKwik, Shiprocket). Enter your numbers — the
            logistics cost, the tied-up capital, and a what-if scenario update immediately.
          </p>
        </section>

        {/* Calculator + results */}
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-line bg-card p-6">
            <h2 className="text-base font-bold mb-5">Your numbers</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="f-orders" label="Monthly orders" value={inputs.monthlyOrders}
                min={0} max={20000} step={100} onChange={set("monthlyOrders")} />
              <Field id="f-aov" label="Average order value" value={inputs.aov}
                min={0} max={10000} step={100} prefix="₹" onChange={set("aov")}
                hint="Feeds the GMV metric only — never the shipping cost." />
              <Field id="f-cod" label="COD share" value={inputs.codPct}
                min={0} max={100} step={5} suffix="%" onChange={set("codPct")} />
              <Field id="f-rto" label="RTO rate" value={inputs.rtoPct}
                min={0} max={60} step={1} suffix="%" onChange={set("rtoPct")}
                hint="% of COD orders that return undelivered (GoKwik's definition). Some dashboards show RTO over all orders — adjust accordingly." />
              <Field id="f-cost" label="Cost per RTO" value={inputs.costPerRto}
                min={50} max={1000} step={25} prefix="₹" onChange={set("costPerRto")}
                hint={`Your assumption. Starting point ₹${DEFAULT_INPUTS.costPerRto} — GoKwik cites ₹200–250/event (forward + return shipping).`} />
              <Field id="f-target" label="Target RTO rate" value={inputs.targetRtoPct}
                min={0} max={inputs.rtoPct} step={1} suffix="%" onChange={set("targetRtoPct")}
                hint="Your what-if goal, compared against the current rate below." />
            </div>
            {problems.length > 0 && (
              <div className="mt-5 rounded-xl border border-burn/40 bg-red-50 p-4 text-sm text-burn-deep" role="alert">
                {problems.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-line bg-card p-6 lg:sticky lg:top-6">
              <h2 className="text-base font-bold">Results</h2>
              <p className="text-xs text-smoke mt-1 mb-4">Assumptions shown below — edit them on the left.</p>
              <div className="text-xs font-medium uppercase tracking-wider text-smoke">
                Estimated RTO logistics cost / year
              </div>
              <div className="text-5xl font-extrabold text-burn-deep tabular-nums mt-1" aria-live="polite">
                {r ? formatCompact(r.annualBurn) : "—"}
              </div>
              {r && (
                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between"><dt className="text-smoke">Per month</dt><dd className="font-bold tabular-nums">{formatCompact(r.monthlyBurn)}</dd></div>
                  <div className="flex justify-between"><dt className="text-smoke">Per day</dt><dd className="font-bold tabular-nums">{formatCompact(r.dailyBurn)}</dd></div>
                  <div className="flex justify-between"><dt className="text-smoke">RTOs / month</dt><dd className="font-bold tabular-nums">{Math.round(r.monthlyRtos).toLocaleString("en-IN")}</dd></div>
                  <div className="flex justify-between"><dt className="text-smoke">RTOs / year</dt><dd className="font-bold tabular-nums">{Math.round(r.annualRtos).toLocaleString("en-IN")}</dd></div>
                </dl>
              )}
              <div className="border-t border-line mt-5 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-smoke mb-2">Assumptions</h3>
                <ul className="text-xs text-smoke space-y-1.5 leading-relaxed">
                  <li>₹{inputs.costPerRto} per RTO event (your input — forward + return shipping).</li>
                  <li>RTO rate = % of COD orders (GoKwik's definition).</li>
                  <li>Shipping-only floor: excludes repackaging, QA, blocked inventory, ad spend.</li>
                </ul>
              </div>
              <button
                onClick={reset}
                className="mt-5 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper transition"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </section>

        {/* What is RTO */}
        <section className="mt-10 max-w-3xl" aria-labelledby="rto-h">
          <h2 id="rto-h" className="text-xl font-extrabold tracking-tight">What is RTO?</h2>
          <p className="text-smoke text-sm leading-relaxed mt-2">
            RTO — Return to Origin — is when a dispatched order comes back undelivered. In Indian
            ecommerce it is overwhelmingly a COD problem: the buyer is not available, refuses the
            parcel, or the address was never serviceable. You pay forward shipping plus return
            shipping, and earn nothing on that order. COD RTO rates in India run 20–30% (GoKwik,
            Shiprocket), against roughly 2–3% for prepaid orders.
          </p>
          <h3 className="font-bold text-sm mt-5 mb-2">How to use this calculator</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-smoke leading-relaxed">
            <li>Enter your monthly orders, average order value, and COD share from your dashboard.</li>
            <li>Enter your RTO rate (as % of COD orders) and what one returned order costs you in shipping.</li>
            <li>Read the annual logistics cost, compare it against a target rate, and export the report card.</li>
          </ol>
          <p className="text-sm mt-4">
            <a href="/guides/how-to-calculate-rto-costs" className="font-semibold text-ink underline">
              Read the step-by-step guide: how to calculate RTO costs for an Indian D2C brand
            </a>
          </p>
        </section>

        {/* Current vs target comparison */}
        {r && t && (
          <section className="mt-10" aria-labelledby="cmp-h">
            <h2 id="cmp-h" className="text-xl font-extrabold tracking-tight">Current vs target</h2>
            <p className="text-sm text-smoke mt-1 mb-4">
              Same inputs, two RTO rates — computed by the same formula, no separate logic.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-smoke">Metric</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Current ({fmtPct(inputs.rtoPct)})</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Target ({fmtPct(inputs.targetRtoPct)})</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <tr className="border-b border-line">
                    <th scope="row" className="px-5 py-3 font-medium text-left">RTOs / month</th>
                    <td className="px-5 py-3 text-right">{Math.round(r.monthlyRtos).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right">{Math.round(t.monthlyRtos).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right text-save font-semibold">−{Math.round(r.monthlyRtos - t.monthlyRtos).toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="border-b border-line">
                    <th scope="row" className="px-5 py-3 font-medium text-left">Logistics cost / month</th>
                    <td className="px-5 py-3 text-right">{formatCompact(r.monthlyBurn)}</td>
                    <td className="px-5 py-3 text-right">{formatCompact(t.monthlyBurn)}</td>
                    <td className="px-5 py-3 text-right text-save font-semibold">−{formatCompact(r.monthlyBurn - t.monthlyBurn)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-5 py-3 font-medium text-left">Logistics cost / year</th>
                    <td className="px-5 py-3 text-right font-bold">{formatCompact(r.annualBurn)}</td>
                    <td className="px-5 py-3 text-right font-bold">{formatCompact(t.annualBurn)}</td>
                    <td className="px-5 py-3 text-right text-save font-bold">−{formatCompact(r.annualBurn - t.annualBurn)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-smoke mt-2">
              A scenario, not a promise — actual savings depend on courier contracts, product category, and execution.
            </p>
          </section>
        )}

        {/* Definitions */}
        <section className="mt-10" aria-labelledby="def-h">
          <h2 id="def-h" className="text-xl font-extrabold tracking-tight">What each number means</h2>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="font-bold text-sm mb-1.5">Logistics expense</h3>
              <p className="text-sm text-smoke leading-relaxed">
                Forward + return shipping on every RTO. This is sunk cost — {r ? formatCompact(r.annualBurn) : "—"}/year
                at your current inputs.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="font-bold text-sm mb-1.5">Returned-order GMV</h3>
              <p className="text-sm text-smoke leading-relaxed">
                Order value that passed through RTO ({r ? formatCompact(r.gmvInReturnedOrdersAnnual) : "—"}/year) —
                working capital tied up in transit, <em>not</em> money lost. Goods can usually be resold.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-5">
              <h3 className="font-bold text-sm mb-1.5">Scenario savings</h3>
              <p className="text-sm text-smoke leading-relaxed">
                The gap between current and target logistics cost ({r ? formatCompact(r.scenarioAnnualSavings) : "—"}/year).
                A what-if, not a guarantee.
              </p>
            </div>
          </div>
        </section>

        {/* Export */}
        <section className="mt-10" aria-labelledby="exp-h">
          <h2 id="exp-h" className="text-xl font-extrabold tracking-tight">Export report</h2>
          <p className="text-sm text-smoke mt-1 mb-4">
            PNG card with your current figures and the assumptions baked in — ready to post or forward.
          </p>
          <div className="rounded-2xl border border-line bg-card p-4 sm:p-6">
            <canvas ref={cardRef} className="w-full rounded-xl" style={{ aspectRatio: "1200 / 630" }} role="img"
              aria-label="Shareable report card showing your annual RTO cost" />
            <button
              onClick={downloadCard}
              className="mt-4 rounded-xl bg-ink text-white font-bold px-8 py-3 hover:opacity-90 transition"
            >
              Download report (PNG)
            </button>
          </div>
        </section>

        {/* Donation — only when a real payment link is configured */}
        {hasDonation && (
          <section className="mt-10 rounded-2xl bg-ink text-white p-8 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">This just found you lakhs.</h2>
            <p className="text-white/70 mt-2 max-w-md mx-auto text-sm">
              RTO Leak is free forever. If it shocked you into action, fuel the next free tool.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {CONFIG.razorpayLink && isSafeHttpUrl(CONFIG.razorpayLink) && (
                <a href={CONFIG.razorpayLink} target="_blank" rel="noreferrer"
                  className="bg-burn-deep hover:opacity-90 transition text-white font-bold rounded-xl px-8 py-3">
                  Donate via Razorpay
                </a>
              )}
              {upiLink && (
                <a href={upiLink}
                  className="bg-white text-ink font-bold rounded-xl px-8 py-3 hover:bg-white/90 transition">
                  Donate via UPI
                </a>
              )}
              {upiLink && (
                <button type="button" onClick={() => setShowQr(true)}
                  className="bg-white/10 border border-white/30 text-white font-bold rounded-xl px-8 py-3 hover:bg-white/20 transition">
                  QR code dikhao
                </button>
              )}
            </div>
            {showQr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setShowQr(false)} role="dialog" aria-modal="true" aria-label="UPI QR code">
                <div className="relative rounded-2xl bg-white p-4 max-w-sm w-full"
                  onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => setShowQr(false)} aria-label="Band karein"
                    className="absolute top-2 right-2 rounded-full bg-ink text-white w-8 h-8 font-bold">✕</button>
                  <img src="/upi-qr.png" alt="UPI QR code — scan karke donate karein"
                    className="w-full rounded-xl" />
                  <p className="text-ink/70 text-sm text-center mt-3">QR scan karein — kisi bhi UPI app se</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Transparency */}
        <section className="mt-10 text-sm text-smoke leading-relaxed max-w-3xl">
          <h2 className="font-bold text-ink mb-2 text-base">How the math works</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>RTO rate = RTO orders ÷ COD orders dispatched (GoKwik's definition).</li>
            <li>
              Monthly RTOs = orders × COD % × RTO %. Monthly logistics cost = RTOs × your
              cost-per-RTO assumption. Annual = monthly × 12.
            </li>
            <li>
              Default cost ₹{DEFAULT_INPUTS.costPerRto}: GoKwik cites ₹200–250 per event for a
              ₹1,000 order (forward + reverse logistics) — a <em>shipping floor</em> excluding
              repackaging, QA, blocked inventory, and ad spend.
            </li>
            <li>Benchmarks: GoKwik 20–25% average COD RTO (up to 40% high-risk); Shiprocket 25–30% for COD.</li>
            <li>Estimates only — not financial advice. Your numbers never leave this browser.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-6 text-center text-sm text-smoke">
          {CONFIG.creatorName ? (
            <span>
              Built by{" "}
              {isSafeHttpUrl(CONFIG.creatorLink) ? (
                <a href={CONFIG.creatorLink} className="font-semibold text-ink underline">
                  {CONFIG.creatorName}
                </a>
              ) : (
                <span className="font-semibold text-ink">{CONFIG.creatorName}</span>
              )}{" "}
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
