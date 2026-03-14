import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { cn } from "@/lib/utils/cn";

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: "Agenda clara",
    description: "Visual rapido das tarefas e dos agendamentos do dia.",
  },
  {
    icon: ShieldCheck,
    title: "Fluxo confiavel",
    description: "Tudo centralizado em uma experiencia simples e segura.",
  },
  {
    icon: Sparkles,
    title: "Ritmo leve",
    description: "Menos atrito para comecar e mais clareza para continuar.",
  },
];

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c6.9 0 9.5-4.8 9.5-7.3 0-.5-.1-.9-.1-1.3H12Z"
      />
      <path
        fill="#34A853"
        d="M2.2 7.4 5.4 9.8C6.3 7.4 8.9 5.7 12 5.7c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2c-3.8 0-7.1 2.2-8.8 5.2Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.8c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.9 0-5.2-2.6-5.5-3.9l-3.1 2.4c1.7 3.1 5 5.3 8.6 5.3Z"
      />
      <path
        fill="#4285F4"
        d="M21.5 14.5c0-.5-.1-.9-.1-1.3H12v3.9h5.5c-.3 1.2-1 2.1-2.1 2.9l3 2.4c1.8-1.7 3.1-4.2 3.1-7.9Z"
      />
    </svg>
  );
}

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
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-md flex-col justify-center">
        <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_28px_80px_-40px_rgba(15,23,42,0.55)]">
          <div className="bg-background/70 p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">Entrar</p>
              <h2 className="text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Entre para ver tarefas, agenda e diario em um unico fluxo.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground transition-colors",
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
                    "w-full rounded-2xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground transition-colors",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                    errors.password && "border-destructive"
                  )}
                />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Nao tem conta?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </div>

          <div className="relative border-t border-border/70 p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.10),_transparent_32%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Agenda
              </div>

              <div className="mt-4 space-y-2">
                <h1 className="max-w-[14ch] text-3xl font-semibold leading-tight text-foreground">
                  Produtividade e controle em suas maos
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Organize tarefas, agendamentos e registros do dia em um so lugar.
                </p>
              </div>

              <div className="mt-5 grid gap-2.5">
                {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-3 rounded-3xl border border-border/60 bg-background/70 p-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
