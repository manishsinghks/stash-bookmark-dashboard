import { useEffect, useState } from "react";
import { collectTabMetadata } from "@/services/save";
import { isSavableUrl } from "@/utils/url";
import type { PageMetadata } from "@/types";

interface CurrentTabState {
  page: PageMetadata | null;
  tab: chrome.tabs.Tab | null;
  savable: boolean;
  loading: boolean;
}

/** Active tab + in-page metadata, extracted once when the popup opens. */
export function useCurrentTab(): CurrentTabState {
  const [state, setState] = useState<CurrentTabState>({
    page: null,
    tab: null,
    savable: true,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        if (mounted) setState({ page: null, tab: null, savable: false, loading: false });
        return;
      }
      const savable = isSavableUrl(tab.url);
      const page = savable ? await collectTabMetadata(tab) : null;
      if (mounted) setState({ page, tab, savable, loading: false });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
