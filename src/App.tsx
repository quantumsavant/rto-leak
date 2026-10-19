import { useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "./config";
import {
  DEFAULT_COST_PER_RTO,
  calculate,
  formatCompact,
  formatINR,
  validateInputs,
} from "./lib/calc";

/* ---------------------------------- UI atoms --------------------------------- */

function Slider({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-smoke">
          {label}
        </label>
        <span className="text-lg font-bold text-ink tabular-nums">{format(value)}</span>
      </div>
      {hint && <p className="text-xs text-smoke mb-2 leading-relaxed">{hint}</p>}
      <input
        id={id}
        type="range"
        className="leak-slider"
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

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-smoke mb-1">{label}</div>
      <div className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums">{value}</div>
      {sub && <div className="text-xs text-smoke mt-1">{sub}</div>}
    </div>
  );
}

/* --------------------------------- Share card -------------------------------- */

function drawShareCard(
  canvas: HTMLCanvasElement,
  annualBurn: string,
  annualRtos: string,
  rtoPct: number,
  codPct: number
) {
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

  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.42, 520);
  glow.addColorStop(0, "rgba(229,72,77,0.22)");
  glow.addColorStop(1, "rgba(229,72,77,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  ctx.fillStyle = "#e5484d";
  ctx.font = "700 34px Inter, system-ui, sans-serif";
  ctx.fillText("RTO  LEAK", W / 2, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 150px Inter, system-ui, sans-serif";
  ctx.fillText(annualBurn, W / 2, 300);

  ctx.fillStyle = "#9aa3af";
  ctx.font = "500 44px Inter, system-ui, sans-serif";
  ctx.fillText("burned on RTO every year", W / 2, 372);

  ctx.fillStyle = "#6b7280";
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillText(`${annualRtos} RTOs  ·  ${rtoPct}% RTO rate  ·  ${codPct}% COD`, W / 2, 448);

  ctx.fillStyle = "#e5484d";
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  const cta = CONFIG.siteUrl ? `Calculate your leak — ${CONFIG.siteUrl}` : "Calculate your leak — free";
  ctx.fillText(cta, W / 2, 548);
}

/* ------------------------------------ App ------------------------------------ */

export default function App() {
  const [orders, setOrders] = useState(1000);
  const [aov, setAov] = useState(800);
  const [codPct, setCodPct] = useState(60);
  const [rtoPct, setRtoPct] = useState(30);
  const [costPerRto, setCostPerRto] = useState(DEFAULT_COST_PER_RTO);
  const [targetRtoPct, setTargetRtoPct] = useState(20);
  const cardRef = useRef<HTMLCanvasElement>(null);

  const onRtoChange = (v: number) => {
    setRtoPct(v);
    if (targetRtoPct > v) setTargetRtoPct(v); // target can never exceed current
  };

  const inputs = useMemo(
    () => ({ monthlyOrders: orders, aov, codPct, rtoPct, costPerRto, targetRtoPct }),
    [orders, aov, codPct, rtoPct, costPerRto, targetRtoPct]
  );
  const problems = validateInputs(inputs);
  const r = useMemo(() => (problems.length === 0 ? calculate(inputs) : null), [inputs, problems]);

  useEffect(() => {
    if (!r) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !cardRef.current) return;
      drawShareCard(
        cardRef.current,
        formatCompact(r.annualBurn),
        Math.round(r.annualRtos).toLocaleString("en-IN"),
        rtoPct,
        codPct
      );
    });
    return () => {
      cancelled = true;
    };
  }, [r, rtoPct, codPct]);

  const downloadCard = () => {
    const canvas = cardRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rto-leak.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const upiLink = CONFIG.upiId
    ? `upi://pay?pa=${encodeURIComponent(CONFIG.upiId)}&pn=${encodeURIComponent("RTO Leak")}&cu=INR`
    : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-burn inline-block" />
            <span className="font-extrabold tracking-tight text-lg">RTO Leak</span>
          </div>
          <span className="text-xs font-semibold text-smoke border border-line rounded-full px-3 py-1">
            Free · No signup
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pb-20">
        <section className="pt-12 pb-8 text-center animate-pop-in">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Your RTO is silently burning
            <br />
            <span className="text-burn tabular-nums">{r ? formatCompact(r.annualBurn) : "—"}</span> every
            year
          </h1>
          <p className="text-smoke mt-4 max-w-xl mx-auto text-base">
            COD RTO rates in India run 20–30% (GoKwik, Shiprocket). Move the sliders to your numbers —
            see the leak in 20 seconds.
          </p>
        </section>

        <section className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-sm">
          <div className="grid gap-7 sm:grid-cols-2">
            <Slider id="s-orders" label="Monthly orders" value={orders} min={0} max={20000} step={100}
              format={(n) => n.toLocaleString("en-IN")} onChange={setOrders} />
            <Slider id="s-aov" label="Average order value" value={aov} min={0} max={10000} step={100}
              format={(n) => formatINR(n)} onChange={setAov}
              hint="Used only for the GMV metric below — never for shipping cost." />
            <Slider id="s-cod" label="COD orders" value={codPct} min={0} max={100} step={5}
              format={(n) => `${n}%`} onChange={setCodPct} />
            <Slider id="s-rto" label="RTO rate (% of COD orders)" value={rtoPct} min={0} max={60} step={1}
              format={(n) => `${n}%`} onChange={onRtoChange}
              hint="Definition used here: of every 100 COD orders shipped, how many return undelivered (GoKwik's definition). Some dashboards show RTO over all orders — adjust accordingly." />
            <Slider id="s-cost" label="Cost per RTO (your assumption)" value={costPerRto} min={50} max={1000} step={25}
              format={(n) => formatINR(n)} onChange={setCostPerRto}
              hint={`Starting point ₹${DEFAULT_COST_PER_RTO} — GoKwik cites ₹200–250 per event (forward + return shipping). Edit to match your courier bills.`} />
            <Slider id="s-target" label="Target RTO rate" value={targetRtoPct} min={0} max={rtoPct} step={1}
              format={(n) => `${n}%`} onChange={setTargetRtoPct}
              hint="Your what-if goal. The scenario below compares this against your current rate." />
          </div>

          {problems.length > 0 && (
            <div className="mt-6 rounded-2xl border border-burn/40 bg-red-50 p-4 text-sm text-burn-deep">
              {problems.map((p) => (
                <div key={p}>⚠ {p}</div>
              ))}
            </div>
          )}

          {r && (
            <>
              <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-smoke">
                RTO logistics cost
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Stat label="Burn / month" value={formatCompact(r.monthlyBurn)} sub="forward + return shipping" />
                <Stat label="Burn / day" value={formatCompact(r.dailyBurn)} />
                <Stat label="RTOs / month" value={Math.round(r.monthlyRtos).toLocaleString("en-IN")} />
                <Stat label="RTOs / year" value={Math.round(r.annualRtos).toLocaleString("en-IN")} />
              </div>

              <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-smoke">
                Capital in returned orders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Stat
                  label="GMV in returned orders / year"
                  value={formatCompact(r.gmvInReturnedOrdersAnnual)}
                  sub="Order value that passed through RTO — not money lost"
                />
                <div className="rounded-2xl border border-line bg-paper p-4 sm:p-5 text-sm text-smoke leading-relaxed">
                  Shipping cost above is sunk. The goods themselves can usually be resold — this
                  number is working capital tied up in transit, shown separately on purpose.
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] p-5">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🔭</div>
                  <div className="font-bold text-save text-lg">What-if scenario</div>
                </div>
                <p className="mt-2 text-ink">
                  If your RTO drops from <strong>{rtoPct}%</strong> to{" "}
                  <strong>{targetRtoPct}%</strong> ({r.scenarioCutPoints} points), logistics cost
                  falls by about <strong>{formatCompact(r.scenarioAnnualSavings)}/year</strong>.
                </p>
                <p className="text-sm text-smoke mt-2">
                  A scenario, not a promise — actual savings depend on your courier contracts,
                  product category, and execution.
                </p>
              </div>
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-center">Founders share their leak 📣</h2>
          <p className="text-smoke text-center mt-2 mb-6">
            Download your card. Post it. Tag a founder friend who needs this shock.
          </p>
          <div className="rounded-3xl border border-line bg-card p-4 sm:p-6">
            <canvas ref={cardRef} className="w-full rounded-2xl" style={{ aspectRatio: "1200 / 630" }} />
            <button
              onClick={downloadCard}
              className="mt-4 w-full sm:w-auto mx-auto block bg-ink text-white font-bold rounded-full px-8 py-3.5 hover:opacity-90 transition"
            >
              ⬇ Download share card (PNG)
            </button>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-ink text-white p-8 sm:p-10 text-center">
          <div className="text-4xl mb-3">☕</div>
          <h2 className="text-2xl font-extrabold tracking-tight">This just found you lakhs.</h2>
          <p className="text-white/70 mt-2 max-w-md mx-auto">
            RTO Leak is free forever. If it shocked you into action, fuel the next free tool.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {CONFIG.razorpayLink && (
              <a href={CONFIG.razorpayLink} target="_blank" rel="noreferrer"
                className="bg-burn hover:bg-burn-deep transition text-white font-bold rounded-full px-8 py-3.5">
                Donate via Razorpay
              </a>
            )}
            {upiLink && (
              <a href={upiLink}
                className="bg-white text-ink font-bold rounded-full px-8 py-3.5 hover:bg-white/90 transition">
                Donate via UPI
              </a>
            )}
            {!CONFIG.razorpayLink && !upiLink && (
              <span className="text-white/50 text-sm border border-white/20 rounded-full px-6 py-3">
                Donation links open at launch
              </span>
            )}
          </div>
        </section>

        <section className="mt-10 text-sm text-smoke leading-relaxed">
          <h3 className="font-bold text-ink mb-2">How the math works (no black box)</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-ink">RTO rate</strong> = RTO orders ÷ COD orders dispatched
              (GoKwik's definition).
            </li>
            <li>
              Monthly RTOs = monthly orders × COD % × RTO %. Monthly logistics cost = monthly RTOs ×
              your cost-per-RTO assumption. Annual = monthly × 12.
            </li>
            <li>
              Cost-per-RTO default ₹{DEFAULT_COST_PER_RTO}: GoKwik cites ₹200–250 per event for a
              ₹1,000 order (forward + reverse logistics). This is a <em>shipping floor</em> — it
              excludes repackaging, QA, blocked inventory, and ad spend, so real total cost is
              higher. Edit the assumption to match your bills.
            </li>
            <li>
              Benchmark: GoKwik reports average COD RTO of 20–25% in India (up to 40% in high-risk
              categories); Shiprocket cites 25–30% for COD orders.
            </li>
            <li>Estimates only — not financial advice.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-4xl mx-auto px-5 py-6 text-center text-sm text-smoke">
          {CONFIG.creatorName ? (
            <span>
              Built by{" "}
              <a href={CONFIG.creatorLink || "#"} className="font-semibold text-ink underline">
                {CONFIG.creatorName}
              </a>{" "}
              for D2C India
            </span>
          ) : (
            <span>Made for D2C India · Free forever</span>
          )}
        </div>
      </footer>
    </div>
  );
}
