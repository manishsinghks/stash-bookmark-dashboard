import type { LabelHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      className={cn("text-xs font-medium text-foreground select-none", className)}
      {...props}
    />
  );
}
