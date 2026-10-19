import { describe, expect, it } from "vitest";
import { parseRoute } from "./route";

describe("parseRoute", () => {
  it("maps / to home", () => {
    expect(parseRoute("/")).toEqual({ view: "home" });
  });
  it("maps a known guide slug to the article view", () => {
    expect(parseRoute("/guides/how-to-calculate-rto-costs")).toEqual({
      view: "article",
      slug: "how-to-calculate-rto-costs",
    });
  });
  it("ignores trailing slashes", () => {
    expect(parseRoute("/guides/how-to-calculate-rto-costs/")).toEqual({
      view: "article",
      slug: "how-to-calculate-rto-costs",
    });
  });
  it("falls back to home for unknown slugs", () => {
    expect(parseRoute("/guides/does-not-exist")).toEqual({ view: "home" });
  });
  it("falls back to home for unknown paths", () => {
    expect(parseRoute("/random")).toEqual({ view: "home" });
  });
});
