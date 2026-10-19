import { describe, expect, it } from "vitest";
import { resolveDraft } from "./number-draft";

const BASE = { min: 0, max: 20000 };

describe("resolveDraft", () => {
  it("commits a normal edit", () => {
    expect(resolveDraft({ draft: "7777", cancelled: false, ...BASE })).toEqual({ commit: 7777 });
  });

  it("reverts when not editing (draft null)", () => {
    expect(resolveDraft({ draft: null, cancelled: false, ...BASE })).toEqual({ commit: null });
  });

  it("never commits a cancelled edit, even with a stale draft (Escape then blur)", () => {
    expect(resolveDraft({ draft: "9999", cancelled: true, ...BASE })).toEqual({ commit: null });
    expect(resolveDraft({ draft: null, cancelled: true, ...BASE })).toEqual({ commit: null });
  });

  it("reverts empty, whitespace-only, and invalid input", () => {
    for (const draft of ["", "   ", "abc", "12a", "NaN", "Infinity", "-Infinity"]) {
      expect(resolveDraft({ draft, cancelled: false, ...BASE })).toEqual({ commit: null });
    }
  });

  it("clamps negative values to min and oversize values to max", () => {
    expect(resolveDraft({ draft: "-5", cancelled: false, ...BASE })).toEqual({ commit: 0 });
    expect(resolveDraft({ draft: "999999", cancelled: false, ...BASE })).toEqual({ commit: 20000 });
  });

  it("accepts boundary values and decimals", () => {
    expect(resolveDraft({ draft: "0", cancelled: false, ...BASE })).toEqual({ commit: 0 });
    expect(resolveDraft({ draft: "20000", cancelled: false, ...BASE })).toEqual({ commit: 20000 });
    expect(resolveDraft({ draft: "1500.5", cancelled: false, ...BASE })).toEqual({ commit: 1500.5 });
  });
});
