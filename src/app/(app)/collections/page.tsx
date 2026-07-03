import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CollectionsContent } from "./collections-content";

export const metadata: Metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <PageShell
      title="Collections"
      description="Curated groups of bookmarks for projects, topics, and workflows."
    >
      <CollectionsContent />
    </PageShell>
  );
}
