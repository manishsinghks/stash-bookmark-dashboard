"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Sparkles, Star } from "lucide-react";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/shared/tag-input";
import { getIcon } from "@/lib/icons";
import { createBookmarkSchema, urlSchema, type CreateBookmarkInput } from "@/lib/validations";
import { useCreateBookmark, useUpdateBookmark } from "@/hooks/use-bookmarks";
import { useCategories, useCollections } from "@/hooks/use-taxonomies";
import { api } from "@/services/api";
import { useUiStore } from "@/stores/ui-store";

const NONE = "__none__";

export function BookmarkDialog() {
  const open = useUiStore((state) => state.bookmarkDialogOpen);
  const editing = useUiStore((state) => state.editingBookmark);
  const prefillUrl = useUiStore((state) => state.prefillUrl);
  const close = useUiStore((state) => state.closeBookmarkDialog);

  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const createBookmark = useCreateBookmark();
  const updateBookmark = useUpdateBookmark();

  const [fetchingMeta, setFetchingMeta] = useState(false);
  const lastFetchedUrl = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<CreateBookmarkInput>({
    resolver: zodResolver(createBookmarkSchema),
    defaultValues: {
      url: "",
      name: "",
      description: "",
      notes: "",
      tags: [],
      isFavorite: false,
      categoryId: null,
      collectionId: null,
      faviconUrl: null,
      ogImageUrl: null,
      themeColor: null,
    },
  });

  useEffect(() => {
    if (!open) return;
    lastFetchedUrl.current = editing?.url ?? null;
    form.reset({
      url: editing?.url ?? prefillUrl ?? "",
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      notes: editing?.notes ?? "",
      tags: editing?.tags.map((tag) => tag.name) ?? [],
      isFavorite: editing?.isFavorite ?? false,
      categoryId: editing?.categoryId ?? null,
      collectionId: editing?.collectionId ?? null,
      faviconUrl: editing?.faviconUrl ?? null,
      ogImageUrl: editing?.ogImageUrl ?? null,
      themeColor: editing?.themeColor ?? null,
    });
  }, [open, editing, prefillUrl, form]);

  const fetchMetadata = useCallback(
    async (url: string) => {
      if (url === lastFetchedUrl.current) return;
      lastFetchedUrl.current = url;
      setFetchingMeta(true);
      try {
        const metadata = await api.metadata(url);
        const values = form.getValues();
        // Fill only what the user hasn't typed, so autofetch never
        // overwrites intentional edits.
        if (!values.name && metadata.title) form.setValue("name", metadata.title);
        if (!values.description && metadata.description) {
          form.setValue("description", metadata.description);
        }
        form.setValue("faviconUrl", metadata.faviconUrl);
        form.setValue("ogImageUrl", metadata.ogImageUrl);
        form.setValue("themeColor", metadata.themeColor);
      } catch {
        // Metadata is a convenience; the form still works without it.
      } finally {
        setFetchingMeta(false);
      }
    },
    [form]
  );

  const handleUrlChange = (url: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) return;
    debounceTimer.current = setTimeout(() => fetchMetadata(parsed.data), 500);
  };

  const onSubmit = form.handleSubmit(async (input) => {
    const payload = {
      ...input,
      categoryId: input.categoryId || null,
      collectionId: input.collectionId || null,
    };
    if (editing) {
      await updateBookmark.mutateAsync({ id: editing.id, input: payload });
    } else {
      await createBookmark.mutateAsync(payload);
    }
    close();
  });

  const pending = createBookmark.isPending || updateBookmark.isPending;
  const faviconUrl = form.watch("faviconUrl");
  const ogImageUrl = form.watch("ogImageUrl");
  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit bookmark" : "Add bookmark"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this bookmark."
              : "Paste a URL and we'll fetch the details for you."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookmark-url">
              URL <span aria-hidden className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="bookmark-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com"
                autoFocus={!editing}
                className="pl-9"
                {...form.register("url", {
                  onChange: (event) => handleUrlChange(event.target.value),
                })}
                aria-invalid={Boolean(errors.url)}
              />
              {fetchingMeta && (
                <span
                  className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 text-xs text-primary"
                  role="status"
                >
                  <Sparkles className="size-3.5 animate-pulse" />
                  Fetching…
                </span>
              )}
            </div>
            {errors.url && (
              <p role="alert" className="text-xs text-destructive">
                {errors.url.message}
              </p>
            )}
          </div>

          {ogImageUrl && (
            <div className="relative h-28 overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImageUrl}
                alt="Link preview"
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bookmark-name">
              Name <span aria-hidden className="text-destructive">*</span>
            </Label>
            <div className="relative">
              {faviconUrl && (
                <Image
                  src={faviconUrl}
                  alt=""
                  width={16}
                  height={16}
                  unoptimized
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 rounded-sm"
                />
              )}
              <Input
                id="bookmark-name"
                placeholder="Bookmark name"
                className={faviconUrl ? "pl-9" : undefined}
                {...form.register("name")}
                aria-invalid={Boolean(errors.name)}
              />
            </div>
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookmark-description">Description</Label>
            <Textarea
              id="bookmark-description"
              rows={2}
              placeholder="What is this page about?"
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bookmark-category">Category</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(next) => field.onChange(next === NONE ? null : next)}
                  >
                    <SelectTrigger id="bookmark-category" className="w-full">
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No category</SelectItem>
                      {categories?.map((category) => {
                        const Icon = getIcon(category.icon);
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <Icon className="size-4" style={{ color: category.color }} />
                            {category.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-collection">Collection</Label>
              <Controller
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(next) => field.onChange(next === NONE ? null : next)}
                  >
                    <SelectTrigger id="bookmark-collection" className="w-full">
                      <SelectValue placeholder="Pick a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No collection</SelectItem>
                      {collections?.map((collection) => {
                        const Icon = getIcon(collection.icon);
                        return (
                          <SelectItem key={collection.id} value={collection.id}>
                            <Icon className="size-4" style={{ color: collection.color }} />
                            {collection.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookmark-tags">Tags</Label>
            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <TagInput id="bookmark-tags" value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookmark-notes">Notes</Label>
            <Textarea
              id="bookmark-notes"
              rows={2}
              placeholder="Private notes, only visible to you"
              {...form.register("notes")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="bookmark-favorite" className="flex items-center gap-2 font-normal">
              <Star className="size-4 text-amber-500" />
              Add to favorites
            </Label>
            <Controller
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <Switch
                  id="bookmark-favorite"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {editing ? "Save changes" : "Add bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
