/**
 * components/shared/CategoryTabs.tsx
 *
 * Abas dinâmicas geradas pelas categorias do usuário.
 * "Todas" sempre aparece primeiro. Uma aba por categoria cadastrada.
 */

import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null; // null = "Todas"
  onChange: (categoryId: string | null) => void;
  counts?: Record<string, number>; // categoryId → quantidade de tasks
}

export function CategoryTabs({ categories, activeId, onChange, counts }: CategoryTabsProps) {
  const allCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {/* Aba "Todas" */}
      <button
        onClick={() => onChange(null)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          activeId === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        Todas
        {allCount !== undefined && (
          <span className={cn(
            "text-xs rounded-full px-1.5 py-0.5",
            activeId === null ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
          )}>
            {allCount}
          </span>
        )}
      </button>

      {/* Uma aba por categoria */}
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        const count = counts?.[cat.id];

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isActive
                ? "text-white"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            style={isActive ? { backgroundColor: cat.color } : undefined}
          >
            <span
              className={cn("h-2 w-2 rounded-full shrink-0", !isActive && "opacity-70")}
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
            {count !== undefined && (
              <span className={cn(
                "text-xs rounded-full px-1.5 py-0.5",
                isActive ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
