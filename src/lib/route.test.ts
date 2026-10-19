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
  it("returns notfound for unknown guide slugs (never silent home)", () => {
    expect(parseRoute("/guides/does-not-exist")).toEqual({
      view: "notfound",
      slug: "does-not-exist",
    });
  });
  it("returns notfound for unknown guide slugs with trailing slash", () => {
    expect(parseRoute("/guides/does-not-exist/")).toEqual({
      view: "notfound",
      slug: "does-not-exist",
    });
  });
  it("rejects malformed guide paths", () => {
    expect(parseRoute("/guides/../etc")).toEqual({ view: "notfound", slug: "../etc" });
    expect(parseRoute("/guides/%2e%2e/x")).toEqual({ view: "notfound", slug: "%2e%2e/x" });
  });
  it("falls back to home for unknown non-guide paths", () => {
    expect(parseRoute("/random")).toEqual({ view: "home" });
  });
  it("maps /guides and /guides/ to home (no guides index)", () => {
    expect(parseRoute("/guides")).toEqual({ view: "home" });
    expect(parseRoute("/guides/")).toEqual({ view: "home" });
  });
  it("maps empty pathname to home", () => {
    expect(parseRoute("")).toEqual({ view: "home" });
  });
});
