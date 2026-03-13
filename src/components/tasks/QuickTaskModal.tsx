import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useCreateTask } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import { toDateKey, toWeekKey } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export function QuickTaskModal() {
  const { quickTaskOpen, closeQuickTask } = useUIStore();
  const createTask = useCreateTask();
  const { categories } = useCategories();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
      isDaily: true,
      isWeekly: false,
      date: toDateKey(),
      weekKey: toWeekKey(),
    },
  });

  const isDaily = watch("isDaily");
  const isWeekly = watch("isWeekly");

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);
      toast.success("Tarefa criada");
      reset({ priority: "medium", isDaily: true, isWeekly: false, date: toDateKey(), weekKey: toWeekKey() });
      closeQuickTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar tarefa");
    }
  }

  if (!quickTaskOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={closeQuickTask} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Nova tarefa</h2>
          <button onClick={closeQuickTask} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {/* Título */}
          <div>
            <input
              {...register("title")}
              placeholder="O que precisa ser feito?"
              className={cn(
                "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.title && "border-destructive"
              )}
              autoFocus
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Descrição */}
          <textarea
            {...register("description")}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />

          {/* Linha: Prioridade + Categoria */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Prioridade</label>
              <select
                {...register("priority")}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Categoria</label>
              <select
                {...register("categoryId")}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isDaily}
                onChange={(e) => setValue("isDaily", e.target.checked)}
                className="rounded border-border"
              />
              Tarefa do dia
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isWeekly}
                onChange={(e) => setValue("isWeekly", e.target.checked)}
                className="rounded border-border"
              />
              Tarefa da semana
            </label>
          </div>
          {errors.isDaily && <p className="text-xs text-destructive">{errors.isDaily.message}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeQuickTask} className="px-4 py-2 text-sm rounded-lg hover:bg-accent text-muted-foreground">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createTask.isPending ? "Criando..." : "Criar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
