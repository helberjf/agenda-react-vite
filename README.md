# Agenda

Aplicação full-stack de agenda pessoal com foco em produtividade diária. O projeto reúne tarefas, agendamentos, diário, histórico e organização por categorias em uma única interface, com autenticação, API protegida e deploy pronto para Vercel.

## Visão rápida

- Tipo de projeto: aplicação full-stack de produtividade
- Escopo: autenticação, modelagem de dados, frontend React, API Node, integração com Firebase e deploy
- Objetivo técnico: demonstrar construção de produto real, não apenas um CRUD básico
- Stack principal: React 19, TypeScript, Vite, Node.js, Firebase Auth, Realtime Database e Vercel Functions

## Para recrutadores

Este projeto foi estruturado para demonstrar competências de engenharia em ponta a ponta:

- desenvolvimento de interface moderna com React, roteamento protegido e gerenciamento de estado
- integração segura com Firebase Auth e Realtime Database
- desenho de API autenticada com validação de token via `firebase-admin`
- modelagem orientada a performance no Realtime Database, com índice `tasksByDate`
- organização de código por domínio, hooks, services, stores e utilitários
- preocupação com entrega real: ambiente local, build, deploy e documentação operacional

Documentação complementar:

- `GUIA_LOCAL_E_DEPLOY.md`: passo a passo mais detalhado para ambiente local e Vercel
- `DEPLOY.md`: resumo rápido de deploy

## O que existe hoje

- Autenticação com Firebase Auth por email/senha e Google
- Dashboard com resumo do dia e da semana
- Tela "Hoje" com tarefas, agendamentos, filtros e registro do dia
- Visão semanal com progresso e agrupamento por data
- Calendário com FullCalendar nos modos mês, semana e lista
- Histórico por dia para revisar tarefas e registros anteriores
- Diário com visualização por dia, mês e lista
- Cadastro e edição de categorias para tarefas e eventos
- Exportação de eventos em `.ics`

## Competências demonstradas

- Frontend moderno: React 19, TypeScript, React Router, TanStack Query, Zustand e formulários com validação
- Backend e segurança: API em Node/Express no desenvolvimento e Vercel Functions em produção, com autenticação via bearer token
- Arquitetura: separação clara entre páginas, componentes, hooks, services, stores e camada de utilidades
- Dados e performance: modelagem no Realtime Database com índice por data para evitar scans desnecessários
- Produto e UX: dashboard, agenda diária/semanal, calendário, histórico, diário e categorias em um fluxo coeso
- Operação: configuração por ambiente, regras de banco, proxy local, build e deploy documentados

## Arquitetura atual

O projeto não está mais em um modelo 100% cliente direto no Firebase.

- Frontend: React + Vite
- Autenticação: Firebase Auth no cliente
- Banco principal: Firebase Realtime Database
- API local: `dev-server.mjs` com Express na porta `3001`
- Produção: rotas serverless em `api/index.ts`, publicadas na Vercel

Fluxo de dados atual:

- `tasks`, `events`, `dailyLogs` e mutações de `categories` passam pela API autenticada (`/api/*`)
- `categories` e `weeklyGoals` ainda usam leitura em tempo real no cliente em alguns fluxos
- o frontend envia o token do Firebase no header `Authorization`
- a API valida o token com `firebase-admin` antes de acessar o banco

Isso permite manter regras mais restritivas no Realtime Database para dados críticos enquanto o app continua com boa experiência em tempo real.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 6, TypeScript |
| UI | Tailwind CSS, Radix UI, Lucide |
| Estado assíncrono | TanStack Query |
| Estado local | Zustand |
| Formulários | React Hook Form + Zod |
| Calendário | FullCalendar |
| Auth e banco | Firebase Auth + Realtime Database |
| Backend | Node.js, Express, `firebase-admin`, Vercel Functions |

## Estrutura do projeto

```text
src/
  components/       componentes de layout, tarefas, eventos e UI compartilhada
  hooks/            hooks de auth, tasks, events, categories, daily logs e weekly goals
  lib/              cliente HTTP, Firebase, validadores e utilitários
  pages/            Dashboard, Today, Week, Calendar, History, Journal, Settings, Auth
  router/           definição de rotas públicas e protegidas
  services/         acesso a API e ao Firebase
  store/            stores Zustand
  types/            tipos de domínio

api/
  index.ts          handler serverless usado em produção

dev-server.mjs      API Express usada no desenvolvimento local
database.rules.json regras do Realtime Database
vercel.json         rewrites e build da Vercel
```

## Pré-requisitos

- Node.js 20.x
- npm
- um projeto Firebase com:
  - Authentication habilitado
  - Realtime Database criado
  - provider de Email/Password habilitado
  - provider Google habilitado, se quiser login social

## Configuração local

### 1. Instale as dependências

```powershell
npm install
```

### 2. Crie os arquivos de ambiente

O `dev-server.mjs` lê `.env`. O Vite lê `.env` e `.env.local`. Para evitar diferenças entre frontend e API local, o caminho mais seguro é manter os dois arquivos com os mesmos valores principais:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.local
```

### 3. Preencha as variáveis

Variáveis do frontend:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Variáveis usadas pela API local e pela Vercel:

```text
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'
FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
FRONTEND_URL=*
```

Observações importantes:

- em ambiente local, `FIREBASE_SERVICE_ACCOUNT` deve ser um JSON compacto em uma linha
- no `.env`, usar aspas simples ao redor do JSON evita problemas de parsing
- `FRONTEND_URL=*` é suficiente para desenvolvimento local
- `VITE_API_URL` é opcional e só faz sentido se frontend e API rodarem em origens diferentes

Se você tiver o arquivo da service account salvo no disco, este comando gera a versão compacta em uma linha:

```powershell
Get-Content -Raw .\service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress
```

### 4. Publique as regras do banco

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

As regras usadas pelo projeto estão em `database.rules.json`.

### 5. Rode o projeto

```powershell
npm run dev
```

Esse comando sobe:

- frontend Vite em `http://localhost:5173`
- API local em `http://localhost:3001`

Durante o desenvolvimento, o Vite faz proxy de `/api/*` para a API local.

## Scripts disponíveis

```bash
npm run dev         # frontend + API local
npm run dev:vite    # apenas frontend
npm run dev:api     # apenas API local
npm run build       # build de produção do frontend
npm run preview     # preview da build
npm run lint        # lint em src
npm run type-check  # checagem de tipos
```

## Rotas da API

As rotas protegidas ficam em `/api/*` e exigem token Firebase:

- `/api/tasks`
- `/api/events`
- `/api/logs`
- `/api/categories`

Em produção, essas rotas são atendidas por `api/index.ts`. Em desenvolvimento, por `dev-server.mjs`.

## Modelo de dados

Principais caminhos do Realtime Database:

```text
tasks/{uid}/{taskId}
tasksByDate/{uid}/{yyyy-MM-dd}/{taskId}
events/{uid}/{eventId}
dailyLogs/{uid}/{yyyy-MM-dd}
weeklyGoals/{uid}/{yyyy-Www}/{goalId}
categories/{uid}/{categoryId}
users/{uid}/profile
users/{uid}/settings
```

O índice `tasksByDate` existe para evitar varrer todas as tarefas do usuário ao consultar um dia específico.

## Deploy

O deploy alvo é a Vercel.

- o frontend é gerado em `dist`
- `vercel.json` redireciona `/api/:path*` para `api/index`
- a versão do Node esperada está em `package.json` como `20.x`

Checklist mínimo de produção:

1. cadastrar todas as variáveis de ambiente no projeto da Vercel
2. incluir o domínio publicado em `Firebase Auth > Authorized domains`
3. manter `FRONTEND_URL` com a URL exata do frontend publicado
4. validar login, criação de tarefa, criação de evento e leitura via `/api/*`

Para instruções completas, consulte `GUIA_LOCAL_E_DEPLOY.md`.
