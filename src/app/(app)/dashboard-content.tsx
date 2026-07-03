"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bookmark, Library, Plus, Star, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/analytics/stat-card";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkGridSkeleton } from "@/components/bookmarks/bookmark-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useBookmarksInfinite } from "@/hooks/use-bookmarks";
import { useStats } from "@/hooks/use-taxonomies";
import { useSettingsStore } from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
        {title}
      </h2>
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link href={href}>
          View all <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

export function DashboardContent() {
  const reducedMotion = useReducedMotion();
  const { data: stats } = useStats();
  const density = useSettingsStore((state) => state.density);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);

  const favorites = useBookmarksInfinite({ filter: "favorites", limit: 4 });
  const recent = useBookmarksInfinite({ sort: "newest", limit: 8 });

  const favoriteItems = useMemo(
    () => favorites.data?.pages[0]?.items ?? [],
    [favorites.data]
  );
  const recentItems = useMemo(
    () => recent.data?.pages[0]?.items ?? [],
    [recent.data]
  );

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {greeting()}
          </h1>
        </div>
        <Button onClick={() => openAddBookmark()} className="shadow-soft">
          <Plus /> Add Bookmark
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total bookmarks" value={stats?.total} icon={Bookmark} tint="#6E56CF" index={0} />
        <StatCard label="Favorites" value={stats?.favorites} icon={Star} tint="#F59E0B" index={1} />
        <StatCard label="Collections" value={stats?.collections} icon={Library} tint="#3B82F6" index={2} />
        <StatCard label="Tags" value={stats?.tags} icon={Tags} tint="#10B981" index={3} />
      </div>

      {favoriteItems.length > 0 && (
        <section className="mb-8" aria-label="Favorites">
          <SectionHeader title="Favorites" href="/favorites" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {favoriteItems.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} density={density} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Recently added">
        <SectionHeader title="Recently added" href="/bookmarks" />
        {recent.isLoading ? (
          <BookmarkGridSkeleton
            density={density}
            count={4}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          />
        ) : recentItems.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Your stash is empty"
            description="Add your first bookmark or import from your browser to get started."
            action={
              <Button onClick={() => openAddBookmark()}>
                <Plus /> Add bookmark
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentItems.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} density={density} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
