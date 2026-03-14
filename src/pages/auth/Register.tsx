import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

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

export function Register() {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);

    try {
      await registerUser(data);
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/email-already-in-use") {
        toast.error("Este email ja esta em uso");
      } else {
        toast.error("Erro ao criar conta");
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Comece a organizar seu tempo</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: "displayName" as const, label: "Nome", type: "text", placeholder: "Seu nome" },
              { name: "email" as const, label: "Email", type: "email", placeholder: "seu@email.com" },
              { name: "password" as const, label: "Senha", type: "password", placeholder: "Minimo 8 caracteres" },
              { name: "confirm" as const, label: "Confirmar senha", type: "password", placeholder: "********" },
            ].map((field) => (
              <div key={field.name}>
                <label className="text-xs font-medium text-foreground block mb-1.5">{field.label}</label>
                <input
                  {...register(field.name)}
                  type={field.type}
                  placeholder={field.placeholder}
                  className={cn(
                    "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                    errors[field.name] && "border-destructive"
                  )}
                />
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-destructive">{errors[field.name]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
