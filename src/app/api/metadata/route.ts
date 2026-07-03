import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { fail, ok, withErrorHandling } from "@/lib/api-utils";
import { metadataRequestSchema } from "@/lib/validations";
import type { UrlMetadata } from "@/types";

const PRIVATE_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[::1\])|\.local$/i;

function absolutize(value: string | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { url } = metadataRequestSchema.parse(await request.json());
  const target = new URL(url);

  if (PRIVATE_HOST.test(target.hostname)) {
    return fail("Cannot fetch metadata for private or local addresses.", 422);
  }

  const domain = target.hostname.replace(/^www\./, "");
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const fallback: UrlMetadata = {
    title: null,
    description: null,
    faviconUrl: fallbackFavicon,
    ogImageUrl: null,
    themeColor: null,
    domain,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 BookmarkDashboard/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok || !response.headers.get("content-type")?.includes("html")) {
      return ok(fallback);
    }

    // Only parse the head-ish portion; meta tags live at the top.
    const html = (await response.text()).slice(0, 500_000);
    const $ = cheerio.load(html);
    const meta = (selector: string) => $(selector).attr("content")?.trim();

    const iconHref =
      $('link[rel="apple-touch-icon"]').attr("href") ??
      $('link[rel="icon"]').attr("href") ??
      $('link[rel="shortcut icon"]').attr("href");

    const metadata: UrlMetadata = {
      title:
        meta('meta[property="og:title"]') ??
        meta('meta[name="twitter:title"]') ??
        $("title").first().text().trim() ??
        null,
      description:
        meta('meta[property="og:description"]') ??
        meta('meta[name="description"]') ??
        meta('meta[name="twitter:description"]') ??
        null,
      faviconUrl: absolutize(iconHref, target) ?? fallbackFavicon,
      ogImageUrl:
        absolutize(
          meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]'),
          target
        ) ?? null,
      themeColor: meta('meta[name="theme-color"]') ?? null,
      domain,
    };

    return ok(metadata);
  } catch {
    // Site unreachable or blocked server-side fetches — still give the
    // caller a usable favicon + domain so the form can proceed.
    return ok(fallback);
  }
});
