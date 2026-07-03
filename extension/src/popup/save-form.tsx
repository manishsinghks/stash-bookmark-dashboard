import { useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/popup/tag-input";
import type { CategoryDto, CollectionDto, TagDto } from "@/types";

const NONE = "__none__";

export interface SaveFormValues {
  name: string;
  description: string;
  notes: string;
  categoryId: string | null;
  collectionId: string | null;
  tags: string[];
  isFavorite: boolean;
}

export function SaveForm({
  values,
  onChange,
  categories,
  collections,
  tagSuggestions,
  suggestedCategoryId,
  nameError,
}: {
  values: SaveFormValues;
  onChange: (values: SaveFormValues) => void;
  categories: CategoryDto[];
  collections: CollectionDto[];
  tagSuggestions: TagDto[];
  suggestedCategoryId: string | null;
  nameError?: string;
}) {
  const [showNotes, setShowNotes] = useState(Boolean(values.notes));
  const set = <K extends keyof SaveFormValues>(key: K, value: SaveFormValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="save-name">Name</Label>
        <Input
          id="save-name"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          aria-invalid={Boolean(nameError)}
          placeholder="Bookmark name"
        />
        {nameError && (
          <p role="alert" className="text-xs text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="save-description">Description</Label>
        <Textarea
          id="save-description"
          rows={2}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="What is this page about?"
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <Label htmlFor="save-category" className="flex items-center gap-1">
            Category
            {suggestedCategoryId && values.categoryId === suggestedCategoryId && (
              <Badge variant="secondary" className="gap-0.5 px-1.5 py-0 text-[10px] text-primary">
                <Sparkles className="size-2.5" /> suggested
              </Badge>
            )}
          </Label>
          <Select
            value={values.categoryId ?? NONE}
            onValueChange={(next) => set("categoryId", next === NONE ? null : next)}
          >
            <SelectTrigger id="save-category">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="save-collection">Collection</Label>
          <Select
            value={values.collectionId ?? NONE}
            onValueChange={(next) => set("collectionId", next === NONE ? null : next)}
          >
            <SelectTrigger id="save-collection">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No collection</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="save-tags">Tags</Label>
        <TagInput
          id="save-tags"
          value={values.tags}
          onChange={(tags) => set("tags", tags)}
          suggestions={tagSuggestions}
        />
      </div>

      {showNotes ? (
        <div className="space-y-1.5">
          <Label htmlFor="save-notes">Notes</Label>
          <Textarea
            id="save-notes"
            rows={2}
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Private notes"
            className="resize-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          + Add notes
        </button>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <Label htmlFor="save-favorite" className="flex cursor-pointer items-center gap-2 font-normal">
          <Star className="size-3.5 text-amber-500" />
          Add to favorites
        </Label>
        <Switch
          id="save-favorite"
          checked={values.isFavorite}
          onCheckedChange={(checked) => set("isFavorite", checked === true)}
        />
      </div>
    </div>
  );
}
