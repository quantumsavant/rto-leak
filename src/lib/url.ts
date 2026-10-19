/**
 * URL safety helpers. Treat all external/config-supplied URLs as untrusted:
 * only http(s) navigation is ever allowed from rendered links.
 */
export function isSafeHttpUrl(u: string): boolean {
  try {
    const url = new URL(u.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
