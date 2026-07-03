import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <PageShell
      title="Favorites"
      description="Your starred bookmarks, pinned for quick access."
    >
      <BookmarksView
        baseParams={{ filter: "favorites" }}
        emptyIcon="star"
        emptyTitle="No favorites yet"
        emptyDescription="Star any bookmark and it will appear here for quick access."
      />
    </PageShell>
  );
}
