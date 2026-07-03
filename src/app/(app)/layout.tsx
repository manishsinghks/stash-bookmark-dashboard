import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { GlobalOverlays } from "@/components/layout/global-overlays";
import { DndProvider } from "@/components/dnd/dnd-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DndProvider>
        <AppSidebar />
        <SidebarInset className="min-h-dvh min-w-0">
          <TopBar />
          <div className="flex-1">{children}</div>
        </SidebarInset>
        <GlobalOverlays />
      </DndProvider>
    </SidebarProvider>
  );
}
