import type { Category } from "@/types";

interface CategoryBadgeProps {
  category?: Category;
  size?: "sm" | "xs";
}

export function CategoryBadge({ category, size = "xs" }: CategoryBadgeProps) {
  if (!category) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === "xs" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs"
      }`}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
