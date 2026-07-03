"use client";

import { cn } from "@/lib/utils";
import { getIcon, ICON_NAMES, SWATCH_COLORS } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}) {
  return (
    <ScrollArea className="h-32 rounded-lg border">
      <div
        className="grid grid-cols-8 gap-1 p-2"
        role="radiogroup"
        aria-label="Icon"
      >
        {ICON_NAMES.map((name) => {
          const Icon = getIcon(name);
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={name}
              onClick={() => onChange(name)}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected && "bg-primary/12 ring-1 ring-primary/40"
              )}
            >
              <Icon
                className="size-4"
                style={selected && color ? { color } : undefined}
              />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {SWATCH_COLORS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "size-7 cursor-pointer rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              selected && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}
