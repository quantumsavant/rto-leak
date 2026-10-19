/**
 * RTO Leak math — pure functions, no UI.
 *
 * Model (sources: GoKwik, Shiprocket):
 * - Every RTO event costs ~₹200–250 (forward + return shipping). Default ₹225.
 * - India's e-commerce RTO rate: 25–35% (Shiprocket) vs 8–12% globally.
 */

export const COST_PER_RTO = 225; // ₹ per RTO event (forward + return shipping)
export const COST_RANGE = "₹200–250";

export interface Inputs {
  monthlyOrders: number;
  codPct: number; // % of orders that are COD
  rtoPct: number; // % of COD orders that become RTO
}

export interface Results {
  monthlyCodOrders: number;
  monthlyRtos: number;
  annualRtos: number;
  monthlyBurn: number;
  annualBurn: number;
  /** Savings if RTO rate drops by 10 percentage points */
  savings10pt: number;
  dailyBurn: number;
}

export function calculate(i: Inputs): Results {
  const monthlyCodOrders = i.monthlyOrders * (i.codPct / 100);
  const monthlyRtos = monthlyCodOrders * (i.rtoPct / 100);
  const monthlyBurn = monthlyRtos * COST_PER_RTO;
  return {
    monthlyCodOrders,
    monthlyRtos,
    annualRtos: monthlyRtos * 12,
    monthlyBurn,
    annualBurn: monthlyBurn * 12,
    savings10pt: i.monthlyOrders * (i.codPct / 100) * 0.1 * COST_PER_RTO * 12,
    dailyBurn: monthlyBurn / 30,
  };
}

/** ₹4,86,000 -> "₹4,86,000" (Indian grouping) */
export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Compact: 486000 -> "₹4.86L", 40500 -> "₹40.5K", 900 -> "₹900" */
export function formatCompact(n: number): string {
  const r = Math.round(n);
  if (r >= 100000) {
    const l = r / 100000;
    return "₹" + (l >= 100 ? Math.round(l) : l.toFixed(l >= 10 ? 1 : 2)) + "L";
  }
  if (r >= 1000) {
    const k = r / 1000;
    return "₹" + (k >= 100 ? Math.round(k) : k.toFixed(1)) + "K";
  }
  return "₹" + r;
}

/** Self-check: GoKwik's published figure — 500 RTOs/month ≈ ₹1–1.25L/month. */
export function selfCheck(): boolean {
  const r = calculate({ monthlyOrders: 500 / 0.6 / 0.3, codPct: 60, rtoPct: 30 });
  // 500 RTOs/month * ₹225 = ₹112,500 — inside GoKwik's ₹1–1.25L band
  return r.monthlyBurn >= 100000 && r.monthlyBurn <= 125000;
}
