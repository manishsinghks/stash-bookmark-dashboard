"use client";

import { Download, Plus, Search, Settings, Upload, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useUiStore } from "@/stores/ui-store";
import { ExportMenu } from "@/components/import-export/export-menu";

export function TopBar() {
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);
  const setImportOpen = useUiStore((state) => state.setImportOpen);

  return (
    <header className="glass sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3 sm:px-4">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="mr-1 h-5!" />

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 w-full max-w-xs min-w-0 shrink cursor-pointer items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Search bookmarks"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search bookmarks…</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          onClick={() => openAddBookmark()}
          size="sm"
          className="shadow-soft"
        >
          <Plus />
          <span className="hidden sm:inline">Add Bookmark</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Import bookmarks"
          onClick={() => setImportOpen(true)}
          className="hidden sm:inline-flex"
        >
          <Upload className="size-4" />
        </Button>

        <ExportMenu>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Export bookmarks"
            className="hidden sm:inline-flex"
          >
            <Download className="size-4" />
          </Button>
        </ExportMenu>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
              <Avatar className="size-7">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-[11px] font-semibold text-primary-foreground">
                  M
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">My Stash</p>
              <p className="text-xs font-normal text-muted-foreground">Local library</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <Upload /> Import bookmarks
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings#backup">
                <User /> Backup & restore
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
