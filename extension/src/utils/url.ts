/** Strips hash + trailing slash so near-identical URLs compare equal. */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    let result = parsed.toString();
    if (result.endsWith("/") && parsed.pathname === "/" && !parsed.search) {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return url;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function fallbackFavicon(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${domainOf(url)}&sz=64`;
}

export function isSavableUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
