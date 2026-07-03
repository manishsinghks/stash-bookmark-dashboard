"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  index = 0,
}: {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  tint: string;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-soft"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full opacity-[0.07]"
        style={{ background: `radial-gradient(circle, ${tint}, transparent 70%)` }}
      />
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklab, ${tint} 12%, transparent)` }}
        >
          <Icon className="size-4.5" style={{ color: tint }} aria-hidden />
        </span>
        <div className="min-w-0">
          {value === undefined ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}
