/**
 * Runs INSIDE the page via chrome.scripting.executeScript({ func }).
 * It is serialized by Chrome, so it must be fully self-contained:
 * no imports, no closures over module scope.
 */
export function extractPageMetadata() {
  const meta = (selector: string): string | null =>
    document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || null;

  const absolutize = (value: string | null): string | null => {
    if (!value) return null;
    try {
      return new URL(value, location.href).toString();
    } catch {
      return null;
    }
  };

  const iconHref =
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.href ||
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ||
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href ||
    null;

  return {
    url: location.href,
    title:
      meta('meta[property="og:title"]') ||
      meta('meta[name="twitter:title"]') ||
      document.title ||
      location.hostname,
    description:
      meta('meta[property="og:description"]') ||
      meta('meta[name="description"]') ||
      meta('meta[name="twitter:description"]'),
    ogImageUrl: absolutize(
      meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]')
    ),
    themeColor: meta('meta[name="theme-color"]'),
    faviconUrl: iconHref,
    selectionText: window.getSelection()?.toString().slice(0, 500) || null,
  };
}
