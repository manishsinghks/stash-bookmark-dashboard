"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import {
  BarChart3,
  Bookmark,
  Clock,
  LayoutDashboard,
  Library,
  Plus,
  Settings,
  Star,
  Tags,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCollections, useStats } from "@/hooks/use-taxonomies";
import { getIcon } from "@/lib/icons";
import { useUiStore } from "@/stores/ui-store";
import { CollectionDialog } from "@/components/collections/collection-dialog";
import { useState } from "react";

function CollectionDropTarget({
  collectionId,
  collectionName,
  children,
}: {
  collectionId: string;
  collectionName: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `collection-${collectionId}`,
    data: { collectionId, collectionName },
  });
  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? "rounded-md bg-primary/10 ring-2 ring-primary/40 transition-colors"
          : "rounded-md transition-colors"
      }
    >
      {children}
    </div>
  );
}

const MAIN_NAV = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "All Bookmarks", href: "/bookmarks", icon: Bookmark, stat: "total" as const },
  { title: "Favorites", href: "/favorites", icon: Star, stat: "favorites" as const },
  { title: "Recent", href: "/recent", icon: Clock },
  { title: "Collections", href: "/collections", icon: Library },
  { title: "Tags", href: "/tags", icon: Tags },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: stats } = useStats();
  const { data: collections } = useCollections();
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);

  const closeOnMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="px-3 pt-4">
        <Link
          href="/"
          onClick={closeOnMobile}
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Stash home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-soft">
            <Bookmark className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Stash
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const count = item.stat && stats ? stats[item.stat] : null;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href} onClick={closeOnMobile}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {count !== null && count !== undefined && (
                      <SidebarMenuBadge className="tabular-nums text-muted-foreground">
                        {count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupAction
            title="New collection"
            onClick={() => setCollectionDialogOpen(true)}
          >
            <Plus />
            <span className="sr-only">New collection</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections?.map((collection) => {
                const Icon = getIcon(collection.icon);
                const href = `/collections/${collection.id}`;
                return (
                  <SidebarMenuItem key={collection.id}>
                    <CollectionDropTarget
                      collectionId={collection.id}
                      collectionName={collection.name}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        tooltip={collection.name}
                      >
                        <Link href={href} onClick={closeOnMobile}>
                          <Icon style={{ color: collection.color }} />
                          <span>{collection.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="tabular-nums text-muted-foreground">
                        {collection.count}
                      </SidebarMenuBadge>
                    </CollectionDropTarget>
                  </SidebarMenuItem>
                );
              })}
              {collections && collections.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  No collections yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                openAddBookmark();
                closeOnMobile();
              }}
              tooltip="Add bookmark"
              className="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            >
              <Plus />
              <span>Add Bookmark</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
            >
              <Link href="/settings" onClick={closeOnMobile}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <CollectionDialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
      />
    </Sidebar>
  );
}
