import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { TagsContent } from "./tags-content";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  return (
    <PageShell title="Tags" description="Browse your library by tag.">
      <TagsContent />
    </PageShell>
  );
}
