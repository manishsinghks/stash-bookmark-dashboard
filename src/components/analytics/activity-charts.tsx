"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { ActivityPoint } from "@/types";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
  boxShadow: "var(--shadow-lifted)",
};

export function WeeklyChart({ data }: { data: ActivityPoint[] }) {
  const formatted = data.map((point) => ({
    ...point,
    label: format(parseISO(point.date), "EEE"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--accent)", opacity: 0.5 }}
          contentStyle={tooltipStyle}
          labelFormatter={(label, payload) => {
            const date = payload?.[0]?.payload?.date;
            return date ? format(parseISO(date), "EEEE, MMM d") : label;
          }}
          formatter={(value) => [`${value} events`, "Activity"]}
        />
        <Bar
          dataKey="count"
          fill="var(--chart-1)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
          isAnimationActive
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({ data }: { data: ActivityPoint[] }) {
  const formatted = data.map((point) => ({
    ...point,
    label: format(parseISO(point.date), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={6}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={tooltipStyle}
          labelFormatter={(label, payload) => {
            const date = payload?.[0]?.payload?.date;
            return date ? format(parseISO(date), "EEEE, MMM d") : label;
          }}
          formatter={(value) => [`${value} events`, "Activity"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#monthlyGradient)"
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
