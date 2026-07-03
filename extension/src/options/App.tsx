import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  Bug,
  Check,
  CloudOff,
  Download,
  Keyboard,
  Loader2,
  RefreshCw,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/api/client";
import { clearLogs, getLogs } from "@/services/logger";
import { onQueueChanged, queueCount } from "@/services/queue";
import { useSettings, useTheme } from "@/hooks/use-settings";
import { sendRuntimeMessage, type SyncNowResponse } from "@/types/messages";
import { cn } from "@/utils/cn";

const IS_MAC = navigator.platform.toUpperCase().includes("MAC");

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border bg-card p-5 shadow-soft"
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted-foreground">{description}</p>
      {children}
    </motion.section>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(next === true)} />
    </div>
  );
}

export function OptionsApp() {
  const { settings, loaded, update } = useSettings();
  useTheme(settings.theme);

  const [urlDraft, setUrlDraft] = useState("");
  const [urlStatus, setUrlStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) setUrlDraft(settings.dashboardUrl);
  }, [loaded, settings.dashboardUrl]);

  useEffect(() => {
    void queueCount().then(setPending);
    return onQueueChanged(setPending);
  }, []);

  const saveDashboardUrl = async () => {
    setUrlStatus("testing");
    let url: URL;
    try {
      url = new URL(urlDraft.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      setUrlStatus("fail");
      return;
    }

    // Custom origins need a runtime host-permission grant (MV3).
    const origin = `${url.origin}/*`;
    const alreadyGranted = await chrome.permissions.contains({ origins: [origin] });
    if (!alreadyGranted) {
      const granted = await chrome.permissions.request({ origins: [origin] });
      if (!granted) {
        setUrlStatus("fail");
        return;
      }
    }

    await update({ dashboardUrl: url.origin });
    setUrlStatus((await api.isReachable()) ? "ok" : "fail");
  };

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await sendRuntimeMessage<SyncNowResponse>({ type: "sync-now" });
      setSyncMessage(
        result.ok
          ? result.synced > 0
            ? `Synced ${result.synced} bookmark${result.synced > 1 ? "s" : ""}.`
            : result.remaining > 0
              ? "Dashboard unreachable — will retry automatically."
              : "Nothing to sync."
          : (result.error ?? "Sync failed.")
      );
    } catch {
      setSyncMessage("Sync failed — try reloading the extension.");
    } finally {
      setSyncing(false);
    }
  };

  const exportLogs = async () => {
    const logs = await getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stash-extension-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!loaded) return null;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="glass sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-soft">
            <Bookmark className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Stash Extension</h1>
            <p className="text-xs text-muted-foreground">Settings</p>
          </div>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            v{chrome.runtime.getManifest().version}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <Section
          title="Dashboard connection"
          description="Where your bookmarks are saved. Custom URLs ask for permission once."
        >
          <div className="flex gap-2">
            <Input
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                setUrlStatus("idle");
              }}
              placeholder="http://localhost:3000"
              aria-label="Dashboard URL"
              spellCheck={false}
            />
            <Button onClick={() => void saveDashboardUrl()} disabled={urlStatus === "testing"}>
              {urlStatus === "testing" && <Loader2 className="animate-spin" />}
              Save & test
            </Button>
          </div>
          {urlStatus !== "idle" && urlStatus !== "testing" && (
            <p
              className={cn(
                "mt-2 flex items-center gap-1.5 text-xs",
                urlStatus === "ok" ? "text-emerald-500" : "text-destructive"
              )}
              role="status"
            >
              {urlStatus === "ok" ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {urlStatus === "ok"
                ? "Connected to your dashboard."
                : "Couldn't reach the dashboard at that URL."}
            </p>
          )}
        </Section>

        <Section
          title="Sync"
          description="Bookmarks saved while offline wait in a local queue and sync automatically."
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                pending > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"
              )}
            >
              {pending > 0 ? (
                <CloudOff className="size-4.5 text-amber-500" />
              ) : (
                <Wifi className="size-4.5 text-emerald-500" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium tabular-nums">
                {pending > 0 ? `${pending} bookmark${pending > 1 ? "s" : ""} pending` : "All synced"}
              </p>
              <p className="text-xs text-muted-foreground">
                {syncMessage ?? "The queue is checked every 2 minutes."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void syncNow()} disabled={syncing}>
              {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Sync now
            </Button>
          </div>
        </Section>

        <Section title="Behavior" description="How saving works day to day.">
          <div className="divide-y">
            <ToggleRow
              id="auto-save"
              label="Auto Save Mode"
              hint="Clicking the toolbar icon saves instantly — no popup."
              checked={settings.autoSave}
              onChange={(autoSave) => void update({ autoSave })}
            />
            <ToggleRow
              id="notifications"
              label="Notifications"
              hint="Show a system notification after saves and syncs."
              checked={settings.notifications}
              onChange={(notifications) => void update({ notifications })}
            />
            <ToggleRow
              id="offline-queue"
              label="Offline mode"
              hint="Queue saves locally when the dashboard is unreachable."
              checked={settings.offlineQueue}
              onChange={(offlineQueue) => void update({ offlineQueue })}
            />
          </div>
        </Section>

        <Section title="Appearance" description="Theme for the popup and this page.">
          <Select
            value={settings.theme}
            onValueChange={(theme) =>
              void update({ theme: theme as typeof settings.theme })
            }
          >
            <SelectTrigger className="w-48" aria-label="Theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        <Section title="Keyboard shortcut" description="Save the current page from anywhere.">
          <div className="flex items-center gap-3">
            <kbd className="rounded-lg border bg-muted px-2.5 py-1.5 font-sans text-xs font-medium">
              {IS_MAC ? "⌘ ⇧ S" : "Ctrl + Shift + S"}
            </kbd>
            <p className="text-xs text-muted-foreground">Saves instantly, without the popup.</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void chrome.tabs.create({ url: "chrome://extensions/shortcuts" })}
            >
              <Keyboard /> Customize
            </Button>
          </div>
        </Section>

        <Section title="Developer" description="Diagnostics for debugging the extension.">
          <div className="divide-y">
            <ToggleRow
              id="developer-mode"
              label="Developer mode"
              hint="Keep verbose event logs for troubleshooting."
              checked={settings.developerMode}
              onChange={(developerMode) => void update({ developerMode })}
            />
            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="outline" size="sm" onClick={() => void exportLogs()}>
                <Download /> Export logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => void clearLogs()}>
                <Trash2 /> Clear logs
              </Button>
              <Badge variant="outline" className="ml-auto gap-1 self-center text-muted-foreground">
                <Bug className="size-3" /> Logs never include page content
              </Badge>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
