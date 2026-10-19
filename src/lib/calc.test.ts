/**
 * Unit tests for the RTO Leak financial model.
 * Expected values below were hand-computed independently of the implementation.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_INPUTS,
  calculate,
  formatCompact,
  formatINR,
  selfCheck,
  validateInputs,
  type Inputs,
} from "./calc";

const base: Inputs = {
  monthlyOrders: 1000,
  aov: 800,
  codPct: 60,
  rtoPct: 30,
  costPerRto: 225,
  targetRtoPct: 20,
};

describe("calculate — normal values (hand-computed)", () => {
  it("defaults: 1000 orders, 60% COD, 30% RTO, ₹225/event, target 20%", () => {
    const r = calculate(base);
    // 1000 * 0.60 = 600 COD orders; 600 * 0.30 = 180 RTOs
    expect(r.monthlyCodOrders).toBe(600);
    expect(r.monthlyRtos).toBe(180);
    expect(r.annualRtos).toBe(2160);
    // 180 * 225 = 40500/mo; *12 = 486000/yr; /30 = 1350/day
    expect(r.monthlyBurn).toBe(40500);
    expect(r.annualBurn).toBe(486000);
    expect(r.dailyBurn).toBe(1350);
    // (30-20) = 10 points; (180-120) * 225 * 12 = 162000
    expect(r.scenarioCutPoints).toBe(10);
    expect(r.scenarioAnnualSavings).toBe(162000);
    // 2160 * 800 = 1728000
    expect(r.gmvInReturnedOrdersAnnual).toBe(1728000);
  });

  it("custom cost per RTO flows through the whole model", () => {
    const r = calculate({ ...base, costPerRto: 300 });
    expect(r.monthlyBurn).toBe(180 * 300);
    expect(r.annualBurn).toBe(180 * 300 * 12);
    expect(r.scenarioAnnualSavings).toBe(60 * 300 * 12);
  });

  it("AOV affects only the GMV metric, never the logistics cost", () => {
    const a = calculate({ ...base, aov: 800 });
    const b = calculate({ ...base, aov: 5000 });
    expect(b.annualBurn).toBe(a.annualBurn);
    expect(b.monthlyBurn).toBe(a.monthlyBurn);
    expect(b.gmvInReturnedOrdersAnnual).toBe(2160 * 5000);
  });
});

describe("calculate — boundaries", () => {
  it("zero orders yields zero everywhere without throwing", () => {
    const r = calculate({ ...base, monthlyOrders: 0, targetRtoPct: 0, rtoPct: 0 });
    expect(r.monthlyBurn).toBe(0);
    expect(r.annualBurn).toBe(0);
    expect(r.annualRtos).toBe(0);
    expect(r.scenarioAnnualSavings).toBe(0);
    expect(r.gmvInReturnedOrdersAnnual).toBe(0);
  });

  it("low RTO (5%): scenario savings can never exceed the burn (audit bug B1)", () => {
    const r = calculate({ ...base, rtoPct: 5, targetRtoPct: 0 });
    // 1000*0.6*0.05 = 30 RTOs/mo; 30*225*12 = 81000/yr
    expect(r.annualBurn).toBe(81000);
    expect(r.scenarioCutPoints).toBe(5);
    expect(r.scenarioAnnualSavings).toBe(81000);
    expect(r.scenarioAnnualSavings).toBeLessThanOrEqual(r.annualBurn);
  });

  it("target equals current rate: zero cut, zero scenario savings", () => {
    const r = calculate({ ...base, targetRtoPct: 30 });
    expect(r.scenarioCutPoints).toBe(0);
    expect(r.scenarioAnnualSavings).toBe(0);
  });

  it("100% COD and 100% RTO", () => {
    const r = calculate({
      monthlyOrders: 1000, aov: 800, codPct: 100, rtoPct: 100,
      costPerRto: 225, targetRtoPct: 0,
    });
    expect(r.monthlyRtos).toBe(1000);
    expect(r.monthlyBurn).toBe(225000);
    expect(r.annualBurn).toBe(2700000);
  });

  it("accepts boundary values 0 and 100 without throwing", () => {
    expect(() =>
      calculate({ monthlyOrders: 0, aov: 0, codPct: 0, rtoPct: 0, costPerRto: 0, targetRtoPct: 0 })
    ).not.toThrow();
    expect(() =>
      calculate({ monthlyOrders: 1000000, aov: 10000000, codPct: 100, rtoPct: 100, costPerRto: 100000, targetRtoPct: 100 })
    ).not.toThrow();
  });
});

describe("validateInputs / calculate — invalid values throw", () => {
  it("rejects NaN, Infinity, negatives, and out-of-range", () => {
    expect(() => calculate({ ...base, monthlyOrders: NaN })).toThrow(/finite/);
    expect(() => calculate({ ...base, aov: Infinity })).toThrow(/finite/);
    expect(() => calculate({ ...base, monthlyOrders: -1 })).toThrow(/between/);
    expect(() => calculate({ ...base, codPct: 101 })).toThrow(/between/);
    expect(() => calculate({ ...base, rtoPct: -0.5 })).toThrow(/between/);
    expect(() => calculate({ ...base, costPerRto: -10 })).toThrow(/between/);
  });

  it("rejects a target above the current rate", () => {
    expect(() => calculate({ ...base, rtoPct: 20, targetRtoPct: 25 })).toThrow(/must not exceed/);
  });

  it("validateInputs returns messages instead of throwing", () => {
    const errs = validateInputs({ ...base, monthlyOrders: -5, codPct: 120 });
    expect(errs.length).toBe(2);
    expect(validateInputs(base)).toEqual([]);
  });
});

describe("formatting", () => {
  it("formatINR uses Indian digit grouping", () => {
    expect(formatINR(486000)).toBe("₹4,86,000");
    expect(formatINR(1350.6)).toBe("₹1,351");
  });

  it("formatCompact boundaries", () => {
    expect(formatCompact(486000)).toBe("₹4.86L");
    expect(formatCompact(162000)).toBe("₹1.62L");
    expect(formatCompact(40500)).toBe("₹40.5K");
    expect(formatCompact(1350)).toBe("₹1.4K");
    expect(formatCompact(900)).toBe("₹900");
    expect(formatCompact(99999)).toBe("₹1L");
    expect(formatCompact(100000)).toBe("₹1L");
    expect(formatCompact(12345678)).toBe("₹123.46L");
    expect(formatCompact(0)).toBe("₹0");
  });
});

describe("selfCheck", () => {
  it("GoKwik band consistency holds", () => {
    expect(selfCheck()).toBe(true);
  });
});

describe("DEFAULT_INPUTS", () => {
  it("is valid and matches the documented defaults", () => {
    expect(validateInputs(DEFAULT_INPUTS)).toEqual([]);
    const r = calculate(DEFAULT_INPUTS);
    expect(r.annualBurn).toBe(486000);
    expect(r.scenarioAnnualSavings).toBe(162000);
  });
});
