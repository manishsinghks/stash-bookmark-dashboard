"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Live refresh when the Stash browser extension saves a bookmark: the
 * extension posts a window message into any open dashboard tab, and we
 * invalidate every query so the new bookmark appears without a reload.
 */
export function useExtensionSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.source === "stash-extension" &&
        event.data?.type === "bookmark-saved"
      ) {
        queryClient.invalidateQueries();
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [queryClient]);
}
