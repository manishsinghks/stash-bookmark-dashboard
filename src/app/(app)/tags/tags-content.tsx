"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkGrid } from "@/components/bookmarks/bookmark-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { useTags } from "@/hooks/use-taxonomies";
import { cn } from "@/lib/utils";

export function TagsContent() {
  const reducedMotion = useReducedMotion();
  const { data: tags, isLoading } = useTags();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="No tags yet"
        description="Tags you add to bookmarks will appear here as a browsable cloud."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tags">
        {tags.map((tag, index) => {
          const isSelected = selected === tag.name;
          return (
            <motion.button
              key={tag.id}
              type="button"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: Math.min(index, 20) * 0.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              onClick={() => setSelected(isSelected ? null : tag.name)}
              aria-pressed={isSelected}
              className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Badge
                variant={isSelected ? "default" : "secondary"}
                className={cn(
                  "px-3 py-1.5 text-sm font-normal transition-colors",
                  !isSelected && "hover:bg-accent"
                )}
              >
                {tag.name}
                <span
                  className={cn(
                    "ml-1 tabular-nums",
                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {tag.count}
                </span>
              </Badge>
            </motion.button>
          );
        })}
      </div>

      {selected ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground uppercase">
            Tagged “{selected}”
          </h2>
          <BookmarkGrid
            params={{ tag: selected }}
            emptyTitle={`Nothing tagged "${selected}"`}
            emptyDescription="Bookmarks with this tag will appear here."
            showAddOnEmpty={false}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a tag to see its bookmarks.
        </p>
      )}
    </div>
  );
}
