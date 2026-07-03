import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { AnalyticsContent } from "./analytics-content";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PageShell
      title="Analytics"
      description="Insights into how you save and revisit your bookmarks."
    >
      <AnalyticsContent />
    </PageShell>
  );
}
