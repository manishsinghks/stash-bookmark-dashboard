import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { CategoryDto, CollectionDto, TagDto } from "@/types";

interface TaxonomiesState {
  categories: CategoryDto[];
  collections: CollectionDto[];
  tags: TagDto[];
  offline: boolean;
  loading: boolean;
}

/**
 * Categories/collections/tags for the popup selects. One parallel fetch;
 * if the dashboard is unreachable the popup still works (offline save).
 */
export function useTaxonomies(): TaxonomiesState {
  const [state, setState] = useState<TaxonomiesState>({
    categories: [],
    collections: [],
    tags: [],
    offline: false,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([api.categories(), api.collections(), api.tags()])
      .then(([categories, collections, tags]) => {
        if (mounted) setState({ categories, collections, tags, offline: false, loading: false });
      })
      .catch(() => {
        if (mounted)
          setState({ categories: [], collections: [], tags: [], offline: true, loading: false });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
