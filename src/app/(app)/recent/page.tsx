import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";

export const metadata: Metadata = { title: "Recent" };

export default function RecentPage() {
  return (
    <PageShell
      title="Recent"
      description="Bookmarks you've added in the last 30 days."
    >
      <BookmarksView
        baseParams={{ filter: "recent" }}
        emptyIcon="clock"
        emptyTitle="Nothing added recently"
        emptyDescription="Bookmarks you save in the next 30 days will show up here."
      />
    </PageShell>
  );
}
