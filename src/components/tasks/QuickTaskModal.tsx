import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Tag, Check, ChevronDown } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui.store";
import { useCreateTask } from "@/hooks/useTasks";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import { toDateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

function DateQuickPicks({ onSelect }: { onSelect: (date: string) => void }) {
  const today = new Date();
  const picks = [
    { label: "Hoje", date: today },
    { label: "Amanha", date: addDays(today, 1) },
    { label: "Em 3 dias", date: addDays(today, 3) },
    { label: "Semana que vem", date: addDays(today, 7) },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {picks.map(({ label, date }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(toDateKey(date))}
          className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function InlineCategoryForm({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const createCategory = useCreateCategory();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const category = await createCategory.mutateAsync({ name: trimmed, color, type: "both" });
      toast.success(`Categoria "${trimmed}" criada`);
      onCreated(category.id);
    } catch {
      toast.error("Erro ao criar categoria");
    }
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-primary/30 bg-secondary/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Tag className="h-3.5 w-3.5 text-primary" />
        Nova categoria
      </p>
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleCreate()}
        placeholder="Nome..."
        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {PALETTE.map((colorOption) => (
          <button
            key={colorOption}
            type="button"
            onClick={() => setColor(colorOption)}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
              color === colorOption ? "scale-110 border-white" : "border-transparent"
            )}
            style={{ backgroundColor: colorOption }}
          />
        ))}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim() || createCategory.isPending}
          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {createCategory.isPending ? "..." : "Criar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function QuickTaskModal() {
  const { quickTaskOpen, closeQuickTask } = useUIStore();
  const createTask = useCreateTask();
  const { categories } = useCategories();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const today = toDateKey();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
      date: today,
      deadline: undefined,
    },
  });

  const currentDate = watch("date");
  const currentDeadline = watch("deadline");

  function handleClose() {
    reset({
      priority: "medium",
      date: today,
      deadline: undefined,
    });
    setShowNewCategory(false);
    closeQuickTask();
  }

  function formatDateDisplay(value?: string) {
    if (!value) return "Selecionar data";

    try {
      return format(new Date(`${value}T12:00:00`), "EEE, d 'de' MMM", { locale: ptBR });
    } catch {
      return value;
    }
  }

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);
      toast.success("Tarefa adicionada");
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar tarefa");
    }
  }

  if (!quickTaskOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative mx-0 w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl sm:mx-4 sm:rounded-xl">
        <div className="flex justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between border-border px-4 pb-3 pt-3 sm:border-b">
          <h2 className="text-sm font-semibold text-foreground">Nova tarefa</h2>
          <button onClick={handleClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-6">
          <div>
            <input
              {...register("title")}
              placeholder="O que precisa ser feito?"
              autoFocus
              className={cn(
                "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.title && "border-destructive"
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <textarea
            {...register("description")}
            placeholder="Descricao (opcional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <DateQuickPicks onSelect={(value) => setValue("date", value, { shouldDirty: true, shouldValidate: true })} />
            <input
              type="date"
              {...register("date")}
              className={cn(
                "w-full cursor-pointer rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.date && "border-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground">Data da tarefa: {formatDateDisplay(currentDate)}</p>
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-muted-foreground">Prazo opcional</label>
              {currentDeadline && (
                <button
                  type="button"
                  onClick={() => setValue("deadline", undefined, { shouldDirty: true, shouldValidate: true })}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <input
              type="date"
              min={currentDate || undefined}
              {...register("deadline")}
              className={cn(
                "w-full cursor-pointer rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.deadline && "border-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground">
              {currentDeadline ? `Prazo: ${formatDateDisplay(currentDeadline)}` : "Se preferir, deixe sem prazo."}
            </p>
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(["low", "medium", "high", "urgent"] as const).map((priority) => {
              const labels = { low: "Baixa", medium: "Media", high: "Alta", urgent: "Urgente" };
              const colors = {
                low: "border-slate-500 text-slate-400",
                medium: "border-blue-500 text-blue-400",
                high: "border-orange-500 text-orange-400",
                urgent: "border-red-500 text-red-400",
              };
              const active = watch("priority") === priority;

              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setValue("priority", priority, { shouldDirty: true })}
                  className={cn(
                    "rounded-lg border py-1.5 text-xs transition-all",
                    active ? `${colors[priority]} bg-secondary` : "border-border text-muted-foreground hover:border-border/60"
                  )}
                >
                  {labels[priority]}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              {!showNewCategory && (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Nova
                </button>
              )}
            </div>

            {showNewCategory ? (
              <InlineCategoryForm
                onCreated={(id) => {
                  setValue("categoryId", id, { shouldDirty: true });
                  setShowNewCategory(false);
                }}
                onCancel={() => setShowNewCategory(false)}
              />
            ) : (
              <div className="relative">
                <select
                  {...register("categoryId")}
                  className="w-full appearance-none rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createTask.isPending}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {createTask.isPending ? "Adicionando..." : "Adicionar tarefa"}
          </button>
        </form>
      </div>
    </div>
  );
}
