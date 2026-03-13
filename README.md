# Agenda — Produtividade pessoal

Sistema de agenda pessoal com foco em produtividade real: tarefas diárias, semanais, log do dia, calendário e integração com calendários externos.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Roteamento | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Formulários | React Hook Form + Zod |
| Calendário | FullCalendar v6 |
| Auth | Firebase Authentication |
| Database | Firebase Realtime Database |

## Decisão arquitetural: frontend direto no Firebase

Para o MVP, o frontend se comunica diretamente com Firebase Auth e Realtime Database, sem backend intermediário. Motivos:

- **Simplicidade**: nenhum servidor para provisionar ou manter
- **Real-time nativo**: `onValue()` sem websocket próprio
- **Segurança real**: Security Rules protegem por usuário no lado do servidor
- **Custo zero para MVP**: free tier do Firebase comporta uso pessoal tranquilamente

Quando adicionar Cloud Functions:
- Envio de notificações por email (não acessível no cliente)
- Sincronização CalDAV com Apple Calendar (requer servidor HTTP)
- Processamento de webhooks de Google Calendar

## Estrutura do projeto

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── tasks/           # TaskCard, QuickTaskModal
│   ├── events/          # NewEventModal
│   └── shared/          # EmptyState, LoadingSpinner
├── pages/
│   ├── auth/            # Login, Register
│   ├── Dashboard.tsx
│   ├── Today.tsx
│   ├── Week.tsx
│   ├── CalendarPage.tsx
│   ├── History.tsx
│   └── Settings.tsx
├── hooks/               # useAuth, useTasks, useEvents, useDailyLog, useWeeklyGoals
├── services/            # tasks.service, events.service, dailyLogs.service...
├── store/               # auth.store, ui.store (Zustand)
├── lib/
│   ├── firebase.ts      # inicialização
│   ├── utils/           # cn, date, ics
│   └── validators/      # Zod schemas
├── types/               # tipos de domínio
├── config/              # sidebar.config
└── router/              # AppRouter
```

## Modelagem Firebase Realtime Database

```
tasks/{uid}/{taskId}              → task completa
dailyTasks/{uid}/{yyyy-MM-dd}/{taskId} = true  → índice diário
weeklyTasks/{uid}/{yyyy-Www}/{taskId} = true   → índice semanal
dailyLogs/{uid}/{yyyy-MM-dd}      → log do dia (upsert)
events/{uid}/{eventId}            → eventos de calendário
weeklyGoals/{uid}/{yyyy-Www}/{goalId}
categories/{uid}/{categoryId}
users/{uid}/profile
users/{uid}/settings
integrations/{uid}/calendar
```

### Por que índices separados para tarefas?

O Realtime Database não suporta queries compostas como SQL. Para buscar "tarefas do dia 2024-01-15", seria necessário varrer todos as tasks do usuário e filtrar por `date` — ineficiente.

A solução é manter índices planos (`dailyTasks/{uid}/{dateKey}/{taskId} = true`) que permitem busca O(1) pelo caminho exato. A tarefa completa fica em `tasks/{uid}/{taskId}`.

Custo: escrita dupla (task + índice). Benefício: leitura O(1) sem scan.

## Setup

### 1. Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Criar projeto no console.firebase.google.com
# Ativar: Authentication (Email/Password + Google) e Realtime Database

# Deploy das Security Rules
firebase deploy --only database
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher com dados do Firebase Console → Project Settings → Web App
```

### 3. Desenvolvimento

```bash
npm install
npm run dev
```

### 4. Emuladores locais (recomendado)

```bash
firebase emulators:start
# Em outro terminal:
VITE_USE_EMULATORS=true npm run dev
```

## Integração com iPhone Calendar

### MVP: Exportação .ics

- Configurações → "Baixar agenda.ics"
- Envie o arquivo por e-mail para o iPhone
- Abra o arquivo no iPhone → "Adicionar ao Calendário"
- **Limitação**: sem sincronização automática

### Próxima fase: CalDAV

Apple Calendar usa o protocolo CalDAV (RFC 4791) para sincronização. Para implementar:

1. Cloud Function que exponha endpoint HTTP com protocolo CalDAV
2. Mapear dados do Firebase → objetos iCalendar
3. Usuário configurar no iPhone: Configurações → Calendário → Contas → CalDAV

Custo estimado: 2 semanas. Dependência: biblioteca `ical.js` ou `node-ical`.

### Por que não WebDAV direto com Firebase?

Firebase não expõe interface WebDAV/CalDAV. Requer servidor intermediário que implemente o protocolo e acesse o Firebase como backend de dados.

## Roadmap

### MVP (atual)
- [x] Auth (email/senha + Google)
- [x] Tarefas diárias e semanais
- [x] Log do dia com mood
- [x] Metas semanais com progresso
- [x] Calendário com FullCalendar
- [x] Dashboard consolidado
- [x] Histórico
- [x] Exportação .ics
- [x] Security Rules por usuário

### Pós-MVP
- [ ] Dark mode toggle
- [ ] Categorias personalizadas na UI
- [ ] Filtros por categoria/prioridade
- [ ] Notificações push (Cloud Functions + FCM)
- [ ] Integração Google Calendar (OAuth + Cloud Functions)
- [ ] CalDAV para Apple Calendar
- [ ] Arrastar tarefas entre dias
- [ ] Recorrência de tarefas
- [ ] Export CSV do histórico

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Limite free tier Firebase (10 GB/mês) | Monitorar no console; uso pessoal é seguro |
| Listeners acumulados sem cleanup | Sempre retornar unsubscribe no useEffect |
| Consistência índice vs task | Escrita atômica via multiPath update |
| Custo de leitura em histórico | Leitura pontual (get()) no histórico, listener só em Today/Week |
| Token Firebase expira | Firebase SDK renova automaticamente |
