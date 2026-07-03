import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { SettingsContent } from "./settings-content";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Make Stash feel like yours."
    >
      <SettingsContent />
    </PageShell>
  );
}
