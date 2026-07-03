"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { CategoryInput, CollectionInput } from "@/lib/validations";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: api.categories.list });
}

export function useCollections() {
  return useQuery({ queryKey: ["collections"], queryFn: api.collections.list });
}

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: api.tags.list });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: api.stats });
}

export function useAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: api.analytics });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => api.categories.create(input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`Category "${category.name}" created`);
    },
    onError: (error) => toast.error("Couldn't create category", { description: error.message }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.categories.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Category deleted");
    },
    onError: (error) => toast.error("Couldn't delete category", { description: error.message }),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CollectionInput) => api.collections.create(input),
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(`Collection "${collection.name}" created`);
    },
    onError: (error) => toast.error("Couldn't create collection", { description: error.message }),
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CollectionInput> }) =>
      api.collections.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection updated");
    },
    onError: (error) => toast.error("Couldn't update collection", { description: error.message }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.collections.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Collection deleted");
    },
    onError: (error) => toast.error("Couldn't delete collection", { description: error.message }),
  });
}
