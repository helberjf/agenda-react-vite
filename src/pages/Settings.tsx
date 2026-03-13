import { useState } from "react";
import { Download, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useExportAllEvents } from "@/hooks/useEvents";
import { eventsToICS, downloadICS } from "@/lib/utils/ics";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
      <div>{children}</div>
    </div>
  );
}

export function Settings() {
  const { user, logout } = useAuth();
  const exportEvents = useExportAllEvents();
  const [exporting, setExporting] = useState(false);

  async function handleExportICS() {
    setExporting(true);
    try {
      const events = await exportEvents.mutateAsync();
      if (events.length === 0) {
        toast.info("Nenhum evento para exportar");
        return;
      }
      const ics = eventsToICS(events);
      downloadICS(ics, `agenda-${new Date().toISOString().split("T")[0]}.ics`);
      toast.success(`${events.length} evento(s) exportado(s)`);
    } catch {
      toast.error("Erro ao exportar eventos");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Perfil, preferências e integrações</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
            {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </Section>

      {/* Exportação */}
      <Section title="Exportação">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Exporte seus eventos no formato .ics compatível com Apple Calendar, Google Calendar e Outlook.
          </p>
          <button
            onClick={handleExportICS}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exportando..." : "Baixar agenda.ics"}
          </button>
        </div>
      </Section>

      {/* Integração iPhone Calendar */}
      <Section title="Integração com iPhone Calendar">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Opção 1 — Exportação pontual (.ics)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Exporte o arquivo .ics acima e envie para seu iPhone por e-mail ou AirDrop. O iPhone abrirá automaticamente com a opção de adicionar os eventos ao Calendário.
            </p>
            <InfoBox>
              Limitação: não é sincronização automática. Novos eventos não aparecem no iPhone automaticamente.
            </InfoBox>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Opção 2 — CalDAV (em desenvolvimento)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Sincronização bidirecional real com Apple Calendar requer um servidor CalDAV. Isso exige backend adicional (Cloud Functions + bibliotecas caldav) e está planejado para o próximo ciclo.
            </p>
            <InfoBox>
              <strong>Por que não está disponível agora:</strong> Firebase Realtime Database não expõe endpoint CalDAV nativamente. É necessário um servidor intermediário que implemente o protocolo CalDAV/WebDAV sobre os dados do Firebase. Custo estimado: 1–2 semanas de desenvolvimento + hospedagem.
            </InfoBox>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Opção 3 — Google Calendar (em desenvolvimento)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Integração via Google Calendar API v3 com OAuth 2.0. Permitirá sincronização de eventos criados nesta agenda para o Google Calendar, que por sua vez sincroniza com o iPhone via iCloud/Google Account.
            </p>
            <InfoBox>
              Requer configuração de OAuth no Google Cloud Console + Cloud Functions para manter token de acesso seguro.
            </InfoBox>
          </div>
        </div>
      </Section>

      {/* Conta */}
      <Section title="Conta">
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          Sair da conta
        </button>
      </Section>
    </div>
  );
}
