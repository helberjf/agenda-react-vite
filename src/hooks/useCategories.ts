import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories.service";
import type { Category } from "@/types";

export function useCategories() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = subscribeCategories(uid, (cats) => {
      setCategories(cats);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { categories, loading };
}

export function useCategoryById(categoryId?: string) {
  const { categories } = useCategories();
  return categories.find((c) => c.id === categoryId);
}

export function useCreateCategory() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: (input: Omit<Category, "id">) => createCategory(uid!, input),
  });
}

export function useUpdateCategory() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Category, "id">> }) =>
      updateCategory(uid!, id, input),
  });
}

export function useDeleteCategory() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: (id: string) => deleteCategory(uid!, id),
  });
}
