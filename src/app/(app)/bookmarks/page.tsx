import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";

export const metadata: Metadata = { title: "All Bookmarks" };

export default function BookmarksPage() {
  return (
    <PageShell
      title="All Bookmarks"
      description="Everything you've saved, in one place."
    >
      <BookmarksView />
    </PageShell>
  );
}
