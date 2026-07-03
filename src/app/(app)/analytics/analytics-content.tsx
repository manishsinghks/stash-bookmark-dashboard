"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  Library,
  MousePointerClick,
  Star,
  Tags,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/analytics/stat-card";
import { WeeklyChart, MonthlyChart } from "@/components/analytics/activity-charts";
import { Favicon } from "@/components/bookmarks/favicon";
import { EmptyState } from "@/components/shared/empty-state";
import { useAnalytics } from "@/hooks/use-taxonomies";
import { useVisitBookmark } from "@/hooks/use-bookmarks";
import type { BookmarkDto } from "@/types";

function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border bg-card p-4 shadow-soft sm:p-5"
      aria-label={title}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </motion.section>
  );
}

function BookmarkRow({
  bookmark,
  meta,
}: {
  bookmark: BookmarkDto;
  meta: string;
}) {
  const visitBookmark = useVisitBookmark();
  return (
    <button
      type="button"
      onClick={() => {
        visitBookmark.mutate(bookmark.id);
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Favicon src={bookmark.faviconUrl} className="size-6 shrink-0 p-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{bookmark.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {bookmark.domain}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{meta}</span>
    </button>
  );
}

export function AnalyticsContent() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[74px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Couldn't load analytics"
        description="Try refreshing the page."
      />
    );
  }

  const maxCategory = Math.max(...data.categoryBreakdown.map((entry) => entry.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total bookmarks" value={data.totals.total} icon={Bookmark} tint="#6E56CF" index={0} />
        <StatCard label="Favorites" value={data.totals.favorites} icon={Star} tint="#F59E0B" index={1} />
        <StatCard label="Categories" value={data.totals.categories} icon={BarChart3} tint="#EC4899" index={2} />
        <StatCard label="Collections" value={data.totals.collections} icon={Library} tint="#3B82F6" index={3} />
        <StatCard label="Tags" value={data.totals.tags} icon={Tags} tint="#10B981" index={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Weekly activity" subtitle="Saves, visits, and edits over the last 7 days" delay={0.05}>
          <WeeklyChart data={data.weekly} />
        </ChartCard>
        <ChartCard title="Monthly activity" subtitle="Your last 30 days at a glance" delay={0.1}>
          <MonthlyChart data={data.monthly} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Most visited" subtitle="The bookmarks you open the most" delay={0.15}>
          {data.mostVisited.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Open a few bookmarks to see them ranked here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {data.mostVisited.map((bookmark) => (
                <BookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  meta={`${bookmark.visitCount} visits`}
                />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Recently opened" subtitle="Where you've been lately" delay={0.2}>
          {data.recentlyOpened.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Bookmarks you open will appear here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {data.recentlyOpened.map((bookmark) => (
                <BookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  meta={
                    bookmark.lastVisitedAt
                      ? formatDistanceToNowStrict(new Date(bookmark.lastVisitedAt), {
                          addSuffix: true,
                        })
                      : ""
                  }
                />
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Categories" subtitle="How your library is organized" delay={0.25}>
          {data.categoryBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Assign categories to see the breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((category) => (
                <div key={category.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground tabular-nums">{category.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(category.count / maxCategory) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top tags" subtitle="Your most used tags" delay={0.3}>
          {data.topTags.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tags you use will be ranked here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag) => (
                <Badge key={tag.name} variant="secondary" className="px-3 py-1.5 font-normal">
                  {tag.name}
                  <span className="ml-1 text-muted-foreground tabular-nums">{tag.count}</span>
                </Badge>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground shadow-soft">
        <MousePointerClick className="size-3.5 shrink-0" />
        Activity counts saves, opens, favorites, and deletions across your library.
      </div>
    </div>
  );
}
