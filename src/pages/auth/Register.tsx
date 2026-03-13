import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

export function Register() {
  const { register: registerUser } = useAuth();
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
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        toast.error("Este email já está em uso");
      } else {
        toast.error("Erro ao criar conta");
      }
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
              { name: "password" as const, label: "Senha", type: "password", placeholder: "Mínimo 8 caracteres" },
              { name: "confirm" as const, label: "Confirmar senha", type: "password", placeholder: "••••••••" },
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
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
