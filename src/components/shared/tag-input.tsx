"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTags } from "@/hooks/use-taxonomies";

export function TagInput({
  value,
  onChange,
  id,
  placeholder = "Add a tag and press Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: existingTags } = useTags();

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/,+$/, "");
    if (tag && !value.includes(tag) && value.length < 20) {
      onChange([...value, tag]);
    }
    setDraft("");
  };

  const suggestions = (existingTags ?? [])
    .filter(
      (tag) =>
        draft.length > 0 &&
        tag.name.toLowerCase().includes(draft.toLowerCase()) &&
        !value.includes(tag.name)
    )
    .slice(0, 5);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              onClick={(event) => {
                event.stopPropagation();
                onChange(value.filter((existing) => existing !== tag));
              }}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) addTag(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && addTag(draft)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          aria-label="Add tags"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lifted">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-accent"
              onMouseDown={(event) => {
                event.preventDefault();
                addTag(tag.name);
              }}
            >
              <span>{tag.name}</span>
              <span className="text-xs text-muted-foreground">{tag.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
