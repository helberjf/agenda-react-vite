import { ref, push, update, get, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";
import type { Category } from "@/types";

const categoriesRef = (uid: string) => ref(database, `categories/${uid}`);
const categoryRef = (uid: string, catId: string) =>
  ref(database, `categories/${uid}/${catId}`);

export async function createCategory(
  uid: string,
  input: Omit<Category, "id">
): Promise<Category> {
  const listRef = categoriesRef(uid);
  const newRef = push(listRef);
  const category: Category = { id: newRef.key!, ...input };
  await update(ref(database), { [`categories/${uid}/${newRef.key}`]: category });
  return category;
}

export async function deleteCategory(uid: string, catId: string): Promise<void> {
  await update(ref(database), { [`categories/${uid}/${catId}`]: null });
}

export function subscribeCategories(
  uid: string,
  callback: (categories: Category[]) => void
): () => void {
  const r = categoriesRef(uid);
  const unsubscribe = onValue(
    r,
    (snap) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      callback(Object.values(snap.val()) as Category[]);
    },
    () => callback([])
  );
  return unsubscribe;
}

export async function getCategories(uid: string): Promise<Category[]> {
  const snap = await get(categoriesRef(uid));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as Category[];
}

/** Categorias padrão criadas no primeiro login */
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Trabalho", color: "#3B82F6", type: "both" },
  { name: "Pessoal", color: "#10B981", type: "both" },
  { name: "Saúde", color: "#F59E0B", type: "both" },
  { name: "Estudos", color: "#8B5CF6", type: "both" },
  { name: "Projetos", color: "#EF4444", type: "both" },
];
