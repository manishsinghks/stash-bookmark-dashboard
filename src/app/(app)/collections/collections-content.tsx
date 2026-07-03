"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Library, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionDialog } from "@/components/collections/collection-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { getIcon } from "@/lib/icons";
import { useCollections, useDeleteCollection } from "@/hooks/use-taxonomies";
import type { CollectionDto, WithCount } from "@/types";

export function CollectionsContent() {
  const reducedMotion = useReducedMotion();
  const { data: collections, isLoading } = useCollections();
  const deleteCollection = useDeleteCollection();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WithCount<CollectionDto> | undefined>();
  const [deleting, setDeleting] = useState<WithCount<CollectionDto> | null>(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus /> New collection
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : collections && collections.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No collections yet"
          description="Collections group related bookmarks — like AI Tools, Travel, or Interview prep."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus /> Create collection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections?.map((collection, index) => {
            const Icon = getIcon(collection.icon);
            return (
              <motion.div
                key={collection.id}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                whileHover={reducedMotion ? undefined : { y: -2 }}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-soft transition-shadow hover:shadow-lifted"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: collection.color }}
                />
                <Link
                  href={`/collections/${collection.id}`}
                  className="flex h-full flex-col gap-3 p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${collection.color} 12%, transparent)`,
                      }}
                    >
                      <Icon className="size-5" style={{ color: collection.color }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{collection.name}</h3>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {collection.count} bookmark{collection.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </Link>

                <div className="absolute top-3 right-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Options for ${collection.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(collection);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(collection)}
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <CollectionDialog open={dialogOpen} onOpenChange={setDialogOpen} collection={editing} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The {deleting?.count ?? 0} bookmark{deleting?.count === 1 ? "" : "s"} inside will not
              be deleted — they&apos;ll just leave this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleting) deleteCollection.mutate(deleting.id);
                setDeleting(null);
              }}
            >
              Delete collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
