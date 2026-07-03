"use client";

import type { ReactNode } from "react";
import { Braces, FileCode, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const FORMATS = [
  { format: "json", label: "JSON", icon: Braces, hint: "Full data, re-importable" },
  { format: "csv", label: "CSV", icon: FileSpreadsheet, hint: "Spreadsheet friendly" },
  { format: "html", label: "HTML", icon: FileCode, hint: "Browser bookmark file" },
  { format: "markdown", label: "Markdown", icon: FileText, hint: "Readable document" },
] as const;

export function ExportMenu({ children }: { children: ReactNode }) {
  const download = (format: string, label: string) => {
    // Anchor-based download keeps the browser's native save behavior.
    const link = document.createElement("a");
    link.href = `/api/export?format=${format}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`Exporting as ${label}…`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Export bookmarks</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FORMATS.map(({ format, label, icon: Icon, hint }) => (
          <DropdownMenuItem key={format} onClick={() => download(format, label)}>
            <Icon />
            <div className="flex flex-col">
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
