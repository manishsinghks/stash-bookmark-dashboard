"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker, IconPicker } from "@/components/shared/icon-color-pickers";
import { collectionSchema, type CollectionInput } from "@/lib/validations";
import { useCreateCollection, useUpdateCollection } from "@/hooks/use-taxonomies";
import type { CollectionDto } from "@/types";

export function CollectionDialog({
  open,
  onOpenChange,
  collection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: CollectionDto;
}) {
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const isEditing = Boolean(collection);

  const form = useForm<CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "folder",
      color: "#6E56CF",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: collection?.name ?? "",
        description: collection?.description ?? "",
        icon: collection?.icon ?? "folder",
        color: collection?.color ?? "#6E56CF",
      });
    }
  }, [open, collection, form]);

  const onSubmit = form.handleSubmit(async (input) => {
    if (isEditing && collection) {
      await updateCollection.mutateAsync({ id: collection.id, input });
    } else {
      await createCollection.mutateAsync(input);
    }
    onOpenChange(false);
  });

  const pending = createCollection.isPending || updateCollection.isPending;
  const icon = form.watch("icon");
  const color = form.watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit collection" : "New collection"}</DialogTitle>
          <DialogDescription>
            Group related bookmarks into a named collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">
              Name <span aria-hidden className="text-destructive">*</span>
            </Label>
            <Input
              id="collection-name"
              placeholder="e.g. AI Tools"
              autoFocus
              {...form.register("name")}
              aria-invalid={Boolean(form.formState.errors.name)}
            />
            {form.formState.errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              placeholder="What goes in here?"
              rows={2}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              value={icon ?? "folder"}
              onChange={(next) => form.setValue("icon", next, { shouldDirty: true })}
              color={color}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker
              value={color ?? "#6E56CF"}
              onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEditing ? "Save changes" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
