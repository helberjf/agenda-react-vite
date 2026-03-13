import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { Category } from "@/types";

export async function createCategory(_uid: string, input: Omit<Category, "id">): Promise<Category> {
  const { category } = await api.post<{ category: Category }>("/categories", input);
  return category;
}

export async function updateCategory(_uid: string, categoryId: string, input: Partial<Omit<Category, "id">>): Promise<Category> {
  const { category } = await api.patch<{ category: Category }>(`/categories/${categoryId}`, input);
  return category;
}

export async function deleteCategory(_uid: string, categoryId: string): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}

export function subscribeCategories(
  uid: string,
  callback: (categories: Category[]) => void
): () => void {
  return onValue(
    ref(database, `categories/${uid}`),
    (snap) => callback(snap.exists() ? Object.values(snap.val()) as Category[] : []),
    () => callback([])
  );
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Trabalho", color: "#3B82F6", type: "both" },
  { name: "Pessoal", color: "#10B981", type: "both" },
  { name: "Saúde", color: "#F59E0B", type: "both" },
  { name: "Estudos", color: "#8B5CF6", type: "both" },
  { name: "Projetos", color: "#EF4444", type: "both" },
];
