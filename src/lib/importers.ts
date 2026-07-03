import Papa from "papaparse";

export interface ImportItem {
  url: string;
  name: string;
  description?: string | null;
  tags?: string[];
  folder?: string | null;
  createdAt?: string | null;
  isFavorite?: boolean;
}

export type ImportFormat = "html" | "json" | "csv";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Netscape bookmark file format — what Chrome, Edge, Firefox, Brave,
 * and Safari all produce from their "export bookmarks" feature.
 * Runs in the browser (DOMParser) so users get an instant preview.
 */
export function parseNetscapeHtml(html: string): ImportItem[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchors = doc.querySelectorAll("a[href]");
  const items: ImportItem[] = [];

  for (const anchor of anchors) {
    const url = anchor.getAttribute("href") ?? "";
    if (!isValidUrl(url)) continue;

    const addDate = anchor.getAttribute("add_date");
    const tags = anchor.getAttribute("tags");
    // The folder is the nearest preceding <h3> in the parent <dl> chain.
    const folder = anchor.closest("dl")?.previousElementSibling
      ?.querySelector?.("h3")?.textContent
      ?? anchor.closest("dt")?.parentElement?.closest("dl")
        ?.parentElement?.querySelector(":scope > dt > h3")?.textContent
      ?? null;

    items.push({
      url,
      name: anchor.textContent?.trim() || new URL(url).hostname,
      tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
      folder,
      createdAt: addDate ? new Date(Number(addDate) * 1000).toISOString() : null,
    });
  }
  return items;
}

export function parseJson(text: string): ImportItem[] {
  const parsed: unknown = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { bookmarks?: unknown[] }).bookmarks)
      ? (parsed as { bookmarks: unknown[] }).bookmarks
      : [];

  const items: ImportItem[] = [];
  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const url = String(record.url ?? record.href ?? record.link ?? "");
    if (!isValidUrl(url)) continue;
    items.push({
      url,
      name: String(record.name ?? record.title ?? new URL(url).hostname),
      description: record.description ? String(record.description) : null,
      tags: Array.isArray(record.tags) ? record.tags.map(String) : undefined,
      folder: record.collection ? String(record.collection) : null,
      createdAt: record.createdAt ? String(record.createdAt) : null,
      isFavorite: record.isFavorite === true,
    });
  }
  return items;
}

export function parseCsv(text: string): ImportItem[] {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const items: ImportItem[] = [];
  for (const row of data) {
    const url = row.url ?? row.href ?? row.link ?? "";
    if (!isValidUrl(url)) continue;
    items.push({
      url,
      name: row.name ?? row.title ?? new URL(url).hostname,
      description: row.description || null,
      tags: row.tags ? row.tags.split(/[;|]/).map((tag) => tag.trim()).filter(Boolean) : undefined,
      folder: row.collection || row.folder || null,
      createdAt: row.added || row.createdat || null,
      isFavorite: (row.favorite ?? "").toLowerCase() === "true",
    });
  }
  return items;
}

export function detectFormat(filename: string, text: string): ImportFormat {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "json") return "json";
  if (extension === "csv") return "csv";
  if (extension === "html" || extension === "htm") return "html";
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("<")) return "html";
  return "csv";
}

export function parseImportFile(filename: string, text: string): {
  format: ImportFormat;
  items: ImportItem[];
} {
  const format = detectFormat(filename, text);
  const parsers: Record<ImportFormat, (text: string) => ImportItem[]> = {
    html: parseNetscapeHtml,
    json: parseJson,
    csv: parseCsv,
  };
  return { format, items: parsers[format](text) };
}
