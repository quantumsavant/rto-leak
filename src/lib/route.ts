import { ARTICLES } from "../content/articles";

export type Route = { view: "home" } | { view: "article"; slug: string };

/** Pure and testable: pass a pathname, get the route. Defaults to the live URL. */
export function parseRoute(pathname?: string): Route {
  const raw = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const clean = raw.replace(/\/+$/, "") || "/";
  if (clean.startsWith("/guides/")) {
    const slug = clean.slice("/guides/".length);
    if (slug && ARTICLES[slug]) return { view: "article", slug };
  }
  return { view: "home" };
}
