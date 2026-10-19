/**
 * RTO Leak financial model — pure functions, no UI, no side effects.
 *
 * Definitions (also stated in the UI):
 * - RTO rate = RTO orders / COD orders dispatched (GoKwik's definition:
 *   https://www.gokwik.co/blog/how-to-reduce-rto-in-e-commerce).
 * - Cost per RTO = forward + return shipping per returned order.
 *   User-editable; DEFAULT_COST_PER_RTO is a starting assumption, not a fact.
 * - AOV feeds ONLY the "GMV in returned orders" metric, never the
 *   logistics-cost math. Shipping cost and order value are separate metrics.
 *
 * Rounding policy: Results carry exact floats; rounding happens only at
 * display time (formatINR / formatCompact). No division by zero is possible:
 * zero orders simply yields zero everywhere.
 */

export const DEFAULT_COST_PER_RTO = 225; // INR — editable starting assumption

/** Defaults shown on first load and restored by "Reset". */
export const DEFAULT_INPUTS: Inputs = {
  monthlyOrders: 1000,
  aov: 800,
  codPct: 60,
  rtoPct: 30,
  costPerRto: DEFAULT_COST_PER_RTO,
  targetRtoPct: 20,
};

/** Hard bounds for validation. UI sliders stay well inside these. */
const BOUNDS = {
  monthlyOrders: [0, 1_000_000],
  aov: [0, 10_000_000],
  codPct: [0, 100],
  rtoPct: [0, 100],
  costPerRto: [0, 100_000],
  targetRtoPct: [0, 100],
} as const;

export interface Inputs {
  monthlyOrders: number;
  aov: number; // INR, average order value
  codPct: number; // 0..100 — share of orders that are COD
  rtoPct: number; // 0..100 — % of COD orders that return undelivered
  costPerRto: number; // INR per RTO event (user assumption)
  targetRtoPct: number; // 0..rtoPct — what-if target for the scenario
}

export interface Results {
  monthlyCodOrders: number;
  monthlyRtos: number;
  annualRtos: number;
  /** Logistics cost only: forward + return shipping. */
  monthlyBurn: number;
  annualBurn: number;
  dailyBurn: number;
  /** What-if scenario vs target rate. A scenario, NOT guaranteed savings. */
  scenarioCutPoints: number;
  scenarioAnnualSavings: number;
  /**
   * Order value that passed through RTO in a year (annualRtos * aov).
   * This is capital tied up, NOT money lost — goods can usually be resold.
   * Displayed as a separate metric, never added to the burn.
   */
  gmvInReturnedOrdersAnnual: number;
}

/** Returns a list of human-readable problems; empty means valid. */
export function validateInputs(i: Inputs): string[] {
  const errs: string[] = [];
  const check = (name: keyof typeof BOUNDS, label: string) => {
    const v = i[name];
    const [min, max] = BOUNDS[name];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      errs.push(`${label} must be a finite number`);
    } else if (v < min || v > max) {
      errs.push(`${label} must be between ${min} and ${max}`);
    }
  };
  check("monthlyOrders", "Monthly orders");
  check("aov", "Average order value");
  check("codPct", "COD share");
  check("rtoPct", "RTO rate");
  check("costPerRto", "Cost per RTO");
  check("targetRtoPct", "Target RTO rate");
  if (
    Number.isFinite(i.targetRtoPct) &&
    Number.isFinite(i.rtoPct) &&
    i.targetRtoPct > i.rtoPct
  ) {
    errs.push("Target RTO rate must not exceed the current RTO rate (the scenario is a reduction)");
  }
  return errs;
}

export function calculate(i: Inputs): Results {
  const errs = validateInputs(i);
  if (errs.length > 0) {
    throw new Error("Invalid inputs: " + errs.join("; "));
  }
  const monthlyCodOrders = (i.monthlyOrders * i.codPct) / 100;
  const monthlyRtos = (monthlyCodOrders * i.rtoPct) / 100;
  const monthlyBurn = monthlyRtos * i.costPerRto;
  const monthlyTargetRtos = (monthlyCodOrders * i.targetRtoPct) / 100;
  const scenarioMonthlySavings = (monthlyRtos - monthlyTargetRtos) * i.costPerRto;
  return {
    monthlyCodOrders,
    monthlyRtos,
    annualRtos: monthlyRtos * 12,
    monthlyBurn,
    annualBurn: monthlyBurn * 12,
    dailyBurn: monthlyBurn / 30,
    scenarioCutPoints: i.rtoPct - i.targetRtoPct,
    scenarioAnnualSavings: scenarioMonthlySavings * 12,
    gmvInReturnedOrdersAnnual: monthlyRtos * 12 * i.aov,
  };
}

/** ₹4,86,000 -> "₹4,86,000" (Indian digit grouping), rounded to whole rupees. */
export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Compact: 486000 -> "₹4.86L", 40500 -> "₹40.5K", 900 -> "₹900". */
export function formatCompact(n: number): string {
  const r = Math.round(n);
  if (r >= 99950) return "₹" + parseFloat((r / 100000).toFixed(2)) + "L";
  if (r >= 1000) return "₹" + parseFloat((r / 1000).toFixed(1)) + "K";
  return "₹" + r;
}

/**
 * Internal consistency check against GoKwik's published example:
 * 500 RTO events/month at ~₹225 each = ₹1.12L/month, inside their
 * stated ₹1–1.25L band. Checks the model's arithmetic, not external truth.
 */
export function selfCheck(): boolean {
  const r = calculate({
    monthlyOrders: 500 / 0.6 / 0.3,
    aov: 1000,
    codPct: 60,
    rtoPct: 30,
    costPerRto: 225,
    targetRtoPct: 20,
  });
  return r.monthlyBurn >= 100000 && r.monthlyBurn <= 125000;
}
