"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderInput, Star, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagInput } from "@/components/shared/tag-input";
import { getIcon } from "@/lib/icons";
import { useBulkAction } from "@/hooks/use-bookmarks";
import { useCollections } from "@/hooks/use-taxonomies";
import { useUiStore } from "@/stores/ui-store";

export function BulkActionBar() {
  const selectedIds = useUiStore((state) => state.selectedIds);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const bulkAction = useBulkAction();
  const { data: collections } = useCollections();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const run = (action: Parameters<typeof bulkAction.mutate>[0]) => {
    bulkAction.mutate(action, { onSuccess: () => clearSelection() });
  };

  return (
    <>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border p-1.5 shadow-lifted"
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="px-2.5 text-sm font-medium tabular-nums">
              {selectedIds.length} selected
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => run({ ids: selectedIds, action: "favorite" })}
            >
              <Star /> Favorite
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FolderInput /> Move
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {collections?.map((collection) => {
                  const Icon = getIcon(collection.icon);
                  return (
                    <DropdownMenuItem
                      key={collection.id}
                      onClick={() =>
                        run({ ids: selectedIds, action: "move", collectionId: collection.id })
                      }
                    >
                      <Icon style={{ color: collection.color }} />
                      {collection.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem
                  onClick={() => run({ ids: selectedIds, action: "move", collectionId: null })}
                >
                  Remove from collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Tag /> Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="center" side="top">
                <p className="text-sm font-medium">Add tags to {selectedIds.length} bookmarks</p>
                <TagInput value={tags} onChange={setTags} />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={tags.length === 0}
                  onClick={() => {
                    run({ ids: selectedIds, action: "tag", tags });
                    setTags([]);
                    setTagPopoverOpen(false);
                  }}
                >
                  Apply tags
                </Button>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 /> Delete
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={clearSelection}
            >
              <X />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} bookmark{selectedIds.length > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be removed from your library. You can undo this right after from the
              toast notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => run({ ids: selectedIds, action: "delete" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
