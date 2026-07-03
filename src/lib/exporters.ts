import type { Bookmark, Category, Collection, Tag } from "@prisma/client";

export type ExportableBookmark = Bookmark & {
  category: Category | null;
  collection: Collection | null;
  tags: Tag[];
};

export type ExportFormat = "json" | "csv" | "html" | "markdown";

function csvEscape(value: string | null | undefined): string {
  const text = value ?? "";
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toJSON(bookmarks: ExportableBookmark[]): string {
  return JSON.stringify(
    bookmarks.map((b) => ({
      url: b.url,
      name: b.name,
      description: b.description,
      notes: b.notes,
      domain: b.domain,
      category: b.category?.name ?? null,
      collection: b.collection?.name ?? null,
      tags: b.tags.map((t) => t.name),
      isFavorite: b.isFavorite,
      visitCount: b.visitCount,
      createdAt: b.createdAt.toISOString(),
    })),
    null,
    2
  );
}

export function toCSV(bookmarks: ExportableBookmark[]): string {
  const header = "name,url,description,category,collection,tags,favorite,visits,added";
  const rows = bookmarks.map((b) =>
    [
      csvEscape(b.name),
      csvEscape(b.url),
      csvEscape(b.description),
      csvEscape(b.category?.name),
      csvEscape(b.collection?.name),
      csvEscape(b.tags.map((t) => t.name).join(";")),
      String(b.isFavorite),
      String(b.visitCount),
      b.createdAt.toISOString(),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

/** Netscape bookmark file format — importable by every major browser. */
export function toHTML(bookmarks: ExportableBookmark[]): string {
  const items = bookmarks
    .map((b) => {
      const added = Math.floor(b.createdAt.getTime() / 1000);
      const tags = b.tags.map((t) => t.name).join(",");
      return `        <DT><A HREF="${htmlEscape(b.url)}" ADD_DATE="${added}"${tags ? ` TAGS="${htmlEscape(tags)}"` : ""}>${htmlEscape(b.name)}</A>${b.description ? `\n        <DD>${htmlEscape(b.description)}` : ""}`;
    })
    .join("\n");
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>Stash Export</H3>
    <DL><p>
${items}
    </DL><p>
</DL><p>
`;
}

export function toMarkdown(bookmarks: ExportableBookmark[]): string {
  const byCategory = new Map<string, ExportableBookmark[]>();
  for (const bookmark of bookmarks) {
    const key = bookmark.category?.name ?? "Uncategorized";
    const list = byCategory.get(key) ?? [];
    list.push(bookmark);
    byCategory.set(key, list);
  }

  const sections = [...byCategory.entries()].map(([category, items]) => {
    const lines = items.map((b) => {
      const tags = b.tags.length ? ` — ${b.tags.map((t) => `\`${t.name}\``).join(" ")}` : "";
      const description = b.description ? ` — ${b.description}` : "";
      return `- [${b.name}](${b.url})${description}${tags}`;
    });
    return `## ${category}\n\n${lines.join("\n")}`;
  });

  return `# Bookmarks\n\nExported ${new Date().toISOString().slice(0, 10)} · ${bookmarks.length} bookmarks\n\n${sections.join("\n\n")}\n`;
}

export const EXPORTERS: Record<
  ExportFormat,
  { serialize: (b: ExportableBookmark[]) => string; mime: string; extension: string }
> = {
  json: { serialize: toJSON, mime: "application/json", extension: "json" },
  csv: { serialize: toCSV, mime: "text/csv", extension: "csv" },
  html: { serialize: toHTML, mime: "text/html", extension: "html" },
  markdown: { serialize: toMarkdown, mime: "text/markdown", extension: "md" },
};
