"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Bookmark,
  Clock,
  LayoutDashboard,
  Library,
  Moon,
  Plus,
  Settings,
  Star,
  Sun,
  Tags,
  Upload,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Favicon } from "@/components/bookmarks/favicon";
import { useFuseSearch } from "@/hooks/use-fuse-search";
import { useVisitBookmark } from "@/hooks/use-bookmarks";
import { useUiStore } from "@/stores/ui-store";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "All Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Recent", href: "/recent", icon: Clock },
  { label: "Collections", href: "/collections", icon: Library },
  { label: "Tags", href: "/tags", icon: Tags },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);
  const setImportOpen = useUiStore((state) => state.setImportOpen);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const visitBookmark = useVisitBookmark();
  const [query, setQuery] = useState("");
  const { results } = useFuseSearch(query, 10);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const runAndClose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search bookmarks, navigate, or run a quick action"
    >
      <Command shouldFilter={query.trim().length === 0}>
      <CommandInput
        placeholder="Search bookmarks or type a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results for “{query}”.</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Bookmarks">
            {results.map((bookmark) => (
              <CommandItem
                key={bookmark.id}
                value={bookmark.id}
                onSelect={() =>
                  runAndClose(() => {
                    visitBookmark.mutate(bookmark.id);
                    window.open(bookmark.url, "_blank", "noopener,noreferrer");
                  })
                }
              >
                <Favicon src={bookmark.faviconUrl} className="size-5 p-0.5" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{bookmark.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {bookmark.domain}
                  </span>
                </div>
                {bookmark.isFavorite && (
                  <Star className="ml-auto size-3.5 fill-amber-500 text-amber-500" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAndClose(() => openAddBookmark())}>
            <Plus /> Add bookmark
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runAndClose(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            Toggle {resolvedTheme === "dark" ? "light" : "dark"} mode
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAndClose(() => setImportOpen(true))}>
            <Upload /> Import bookmarks
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runAndClose(() => router.push(item.href))}
            >
              <item.icon /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
