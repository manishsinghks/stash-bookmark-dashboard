"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function Favicon({
  src,
  alt = "",
  className,
}: {
  src: string | null;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          className
        )}
        aria-hidden
      >
        <Globe className="size-1/2" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("rounded-md object-contain", className)}
    />
  );
}
