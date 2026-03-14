import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { cn } from "@/lib/utils/cn";

const HIGHLIGHTS = [
  "Tarefas, agenda e diario em um unico fluxo",
  "Prioridades do dia com visual rapido",
  "Sincronizacao pensada para uso pessoal",
];

export function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setLoading(true);

    try {
      await login(data);
      navigate("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Email ou senha incorretos");
      } else {
        toast.error("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate("/");
    } catch {
      toast.error("Erro ao entrar com Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.10),_transparent_34%)]" />
      <div className="pointer-events-none absolute -left-16 top-14 h-32 w-32 rounded-full bg-primary/10 blur-3xl sm:h-40 sm:w-40" />
      <div className="pointer-events-none absolute -right-12 bottom-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl sm:h-48 sm:w-48" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-4 sm:px-6 sm:py-6 lg:items-center lg:px-8">
        <div className="grid w-full gap-3 sm:gap-4 lg:grid-cols-[0.96fr_1.04fr] lg:gap-6">
          <section className="order-1 rounded-[28px] border border-border/70 bg-card/95 p-4 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.75)] backdrop-blur sm:p-6 lg:order-2 lg:rounded-[32px] lg:p-8">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">Entrar</p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Produtividade e controle em suas mãos</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Acesse sua agenda e retome o que precisa de atencao hoje com clareza, ritmo e organizacao.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4 sm:mt-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground transition-colors",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                    errors.email && "border-destructive"
                  )}
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Senha</label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Sua senha"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground transition-colors",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                    errors.password && "border-destructive"
                  )}
                />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Continuar com Google
            </button>

            <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
              Não tem conta?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </section>

          <section className="order-2 rounded-[28px] border border-border/70 bg-card/85 p-4 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.7)] backdrop-blur-sm sm:p-6 lg:order-1 lg:rounded-[32px] lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Agenda pessoal
            </div>

            <div className="mt-4 space-y-3 sm:mt-5">
              <h2 className="max-w-[16ch] text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">
                Sua rotina com menos ruido e mais direcao
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Planeje o dia, organize compromissos e acompanhe o que importa em uma experiencia pensada primeiro para o celular.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">Dia organizado</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Visual rapido das tarefas e dos agendamentos importantes.</p>
              </div>

              <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">Fluxo confiavel</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Seu planejamento fica centralizado em um ambiente simples e seguro.</p>
              </div>

              <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">Ritmo leve</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Menos atrito para comecar e mais clareza para continuar.</p>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-primary/15 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">O que voce encontra</p>
                  <p className="mt-2 text-sm font-medium text-foreground">Uma tela inicial pronta para orientar sua rotina desde o primeiro minuto.</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              </div>

              <div className="mt-4 space-y-2.5">
                {HIGHLIGHTS.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
