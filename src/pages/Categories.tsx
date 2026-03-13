/**
 * pages/Categories.tsx
 *
 * Gerenciamento completo de categorias.
 * O usuário pode criar, editar e excluir categorias com nome e cor.
 * Categorias aparecem nas abas de Hoje, Semana e no modal de criação de tarefas.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Check, X, Tag } from "lucide-react";
import { z } from "zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { Category } from "@/types";

// ─── Paleta de cores predefinidas ─────────────────────────────────────────────

const COLOR_PALETTE = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#A855F7", // purple
];

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .default("#6B7280"),
  type: z.enum(["task", "event", "both"]).default("both"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
            value === color ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          title={color}
        >
          {value === color && (
            <Check className="h-3.5 w-3.5 text-white mx-auto drop-shadow" />
          )}
        </button>
      ))}
      {/* Input de cor customizada */}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 rounded-full cursor-pointer border-2 border-transparent hover:scale-110 transition-transform"
        title="Cor customizada"
      />
    </div>
  );
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { register, handleSubmit, watch, setValue, reset } = useForm<CategoryFormData>({
    defaultValues: {
      name: category.name,
      color: category.color,
      type: category.type as CategoryFormData["type"],
    },
  });

  const color = watch("color");

  async function onSubmit(data: CategoryFormData) {
    try {
      await updateCategory.mutateAsync({ id: category.id, input: data });
      toast.success("Categoria atualizada");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar categoria");
    }
  }

  function cancelEdit() {
    reset({ name: category.name, color: category.color, type: category.type as CategoryFormData["type"] });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Excluir a categoria "${category.name}"? As tarefas associadas não serão excluídas.`)) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Categoria excluída");
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card border border-primary/40 rounded-xl p-4 space-y-3"
      >
        {/* Nome */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Nome</label>
          <input
            {...register("name")}
            autoFocus
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Cor */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Cor</label>
          <ColorPicker value={color} onChange={(c) => setValue("color", c)} />
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Aplicar em</label>
          <select
            {...register("type")}
            className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="both">Tarefas e Eventos</option>
            <option value="task">Apenas Tarefas</option>
            <option value="event">Apenas Eventos</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateCategory.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {updateCategory.isPending ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-border/80 transition-colors">
      {/* Cor */}
      <span
        className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{category.name}</p>
        <p className="text-xs text-muted-foreground">
          {category.type === "task"
            ? "Tarefas"
            : category.type === "event"
            ? "Eventos"
            : "Tarefas e Eventos"}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteCategory.isPending}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Formulário de criação ────────────────────────────────────────────────────

function CreateCategoryForm({ onDone }: { onDone: () => void }) {
  const createCategory = useCreateCategory();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<CategoryFormData>({
      resolver: zodResolver(categorySchema),
      defaultValues: { name: "", color: "#3B82F6", type: "both" },
    });

  const color = watch("color");

  async function onSubmit(data: CategoryFormData) {
    try {
      await createCategory.mutateAsync(data);
      toast.success(`Categoria "${data.name}" criada`);
      reset({ name: "", color: "#3B82F6", type: "both" });
      onDone();
    } catch {
      toast.error("Erro ao criar categoria");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border border-primary/40 rounded-xl p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-foreground">Nova categoria</h3>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
        <input
          {...register("name")}
          placeholder="Ex: Trabalho, Pessoal, Saúde..."
          autoFocus
          className={cn(
            "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
            errors.name && "border-destructive"
          )}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-2">Cor</label>
        {/* Preview */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="h-6 w-6 rounded-full border-2 border-border"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-muted-foreground font-mono">{color}</span>
        </div>
        <ColorPicker value={color} onChange={(c) => setValue("color", c)} />
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Aplicar em</label>
        <select
          {...register("type")}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        >
          <option value="both">Tarefas e Eventos</option>
          <option value="task">Apenas Tarefas</option>
          <option value="event">Apenas Eventos</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {createCategory.isPending ? "Criando..." : "Criar categoria"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 text-sm rounded-lg hover:bg-accent text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function Categories() {
  const { categories, loading } = useCategories();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize suas tarefas e eventos por categoria
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova
          </button>
        )}
      </div>

      {/* Formulário de criação */}
      {creating && <CreateCategoryForm onDone={() => setCreating(false)} />}

      {/* Lista */}
      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 && !creating ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="Nenhuma categoria"
          description="Crie categorias para organizar suas tarefas por área da vida."
          action={
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Criar primeira categoria
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryRow key={cat.id} category={cat} />
          ))}
        </div>
      )}

      {/* Dica */}
      {categories.length > 0 && (
        <p className="text-xs text-muted-foreground">
          As categorias aparecem como abas nas páginas Hoje e Semana, e como opção ao criar tarefas.
        </p>
      )}
    </div>
  );
}
