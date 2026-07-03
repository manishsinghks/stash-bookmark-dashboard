"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";
import { CollectionDialog } from "@/components/collections/collection-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { getIcon } from "@/lib/icons";
import { useCollections } from "@/hooks/use-taxonomies";
import { Library } from "lucide-react";

export function CollectionDetail({ id }: { id: string }) {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { data: collections, isLoading } = useCollections();
  const [editOpen, setEditOpen] = useState(false);

  const collection = collections?.find((entry) => entry.id === id);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-12 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={Library}
          title="Collection not found"
          description="It may have been deleted."
          action={
            <Button variant="outline" onClick={() => router.push("/collections")}>
              Back to collections
            </Button>
          }
        />
      </div>
    );
  }

  const Icon = getIcon(collection.icon);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${collection.color} 12%, transparent)`,
            }}
          >
            <Icon className="size-5.5" style={{ color: collection.color }} />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {collection.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {collection.description || `${collection.count} bookmarks`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil /> Edit collection
        </Button>
      </div>

      <BookmarksView
        baseParams={{ collectionId: collection.id }}
        emptyIcon={Icon}
        emptyTitle="This collection is empty"
        emptyDescription="Move bookmarks here from their context menu, or add a new one."
      />

      <CollectionDialog open={editOpen} onOpenChange={setEditOpen} collection={collection} />
    </motion.div>
  );
}
