# Guia Para Rodar Localmente E Fazer Deploy Na Vercel

Este guia foi escrito para o estado atual deste projeto.
Ele cobre:

- configuracao do Firebase
- configuracao de `.env` e `.env.local`
- execucao local
- deploy na Vercel
- problemas mais comuns

## 1. Visao Rapida Da Arquitetura

- Frontend: Vite + React
- API local: `dev-server.mjs` na porta `3001`
- Proxy local: o Vite envia `/api/*` para `http://localhost:3001`
- Producao: a Vercel atende o frontend e as rotas em `api/index.ts`

Ponto importante deste repositorio:

- o frontend usa variaveis `VITE_*`
- o Vite le `.env` e `.env.local`
- a API local (`dev-server.mjs`) le `.env`

Por isso, para desenvolvimento local sem surpresa, mantenha `.env` e `.env.local` com os mesmos valores principais.

## 2. Pre-Requisitos

Voce precisa ter:

- Node.js 20 ou superior
- npm
- uma conta na Vercel
- um projeto Firebase

No Firebase, ative:

- Authentication
- Realtime Database

Em Authentication, habilite pelo menos:

- Email/Password
- Google

## 3. Configurar O Firebase

### 3.1 Criar o projeto

1. Acesse o Firebase Console.
2. Crie um projeto.
3. Em `Project Settings`, crie um Web App.
4. Copie os dados do app web:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

5. Em `Realtime Database`, crie o banco.
6. Guarde a URL do banco, por exemplo:

```text
https://seu-projeto-default-rtdb.firebaseio.com
```

### 3.2 Criar a service account

1. No Firebase Console, abra `Project Settings`.
2. Entre em `Service Accounts`.
3. Clique em `Generate new private key`.
4. Salve o arquivo JSON.

Esse JSON sera usado na variavel `FIREBASE_SERVICE_ACCOUNT`.

### 3.3 Publicar as regras do Realtime Database

Se voce tiver o Firebase CLI instalado:

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

As regras usadas por este projeto estao em `database.rules.json`.

## 4. Configurar As Variaveis De Ambiente

### 4.1 Criar os arquivos

No PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.local
```

### 4.2 Preencher os valores

Preencha os arquivos com os dados do seu projeto Firebase.

Variaveis do frontend:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_EMULATORS=false
```

Variaveis da API local e da Vercel:

```text
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
FRONTEND_URL=*
```

### 4.3 Como gerar `FIREBASE_SERVICE_ACCOUNT` em uma linha

Se voce baixou um arquivo `service-account.json`, rode no PowerShell:

```powershell
Get-Content -Raw .\service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress
```

O resultado sera um JSON em uma unica linha.

Nos arquivos `.env` e `.env.local`, use assim:

```text
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'
```

Observacoes:

- em `.env` e `.env.local`, mantenha aspas simples ao redor do JSON
- na Vercel, cole o JSON compacto sem precisar dessas aspas simples

### 4.4 Valor recomendado para `FRONTEND_URL`

Em desenvolvimento local:

```text
FRONTEND_URL=*
```

Em producao na Vercel:

```text
FRONTEND_URL=https://seu-projeto.vercel.app
```

## 5. Rodar O Sistema Localmente

### 5.1 Instalar dependencias

```powershell
npm install
```

### 5.2 Subir frontend + API local

```powershell
npm run dev
```

Esse comando sobe:

- frontend Vite em `http://localhost:5173`
- API local em `http://localhost:3001`

O frontend usa proxy para chamar `/api/*`, entao voce acessa apenas:

```text
http://localhost:5173
```

### 5.3 Rodar cada parte separadamente

Se quiser depurar separado:

```powershell
npm run dev:api
```

```powershell
npm run dev:vite
```

### 5.4 Testar build local do frontend

```powershell
npm run build
npm run preview
```

Observacao:

- `npm run preview` mostra a build do frontend
- para testar a API junto, continue usando `npm run dev` ou use `vercel dev`

### 5.5 Testar o runtime da Vercel localmente

Se quiser simular o comportamento da Vercel mais de perto:

```powershell
npx vercel dev
```

## 6. Fluxo Opcional Com Emuladores Do Firebase

O projeto possui configuracao para emuladores:

- Auth: `9099`
- Database: `9000`
- Hosting: `5000`
- UI: `4000`

Para usar:

1. ajuste `VITE_USE_EMULATORS=true`
2. inicie os emuladores
3. rode a aplicacao

Exemplo:

```powershell
firebase emulators:start
```

Em outro terminal:

```powershell
$env:VITE_USE_EMULATORS="true"
npm run dev
```

Se preferir fixar no arquivo, troque `VITE_USE_EMULATORS=false` para `true`.

## 7. Deploy Na Vercel

### 7.1 Opcao via GitHub

1. Envie o projeto para um repositorio GitHub.
2. No painel da Vercel, clique em `Add New Project`.
3. Importe o repositorio.
4. A Vercel vai detectar o projeto Vite automaticamente.

Este repositorio ja possui `vercel.json` com:

- `buildCommand: npm run build`
- `outputDirectory: dist`
- rewrite de `/api/:path*` para `api/index`

A versao do Node usada no deploy fica em `package.json`:

- `"engines": { "node": "20.x" }`

### 7.2 Opcao via CLI

```powershell
npm install -g vercel
vercel login
vercel
```

Para publicar em producao:

```powershell
vercel --prod
```

### 7.3 Variaveis de ambiente na Vercel

No painel da Vercel, abra:

`Project -> Settings -> Environment Variables`

Cadastre estas variaveis:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT
FIREBASE_DATABASE_URL
FRONTEND_URL
VITE_USE_EMULATORS
```

Valores recomendados em producao:

- `FRONTEND_URL=https://seu-projeto.vercel.app`
- `VITE_USE_EMULATORS=false`
- `FIREBASE_SERVICE_ACCOUNT` como JSON compacto em uma linha

### 7.4 Ajustes no Firebase para a Vercel

Depois de subir na Vercel:

1. abra `Firebase Console -> Authentication -> Settings -> Authorized domains`
2. adicione o dominio da Vercel, por exemplo:

```text
seu-projeto.vercel.app
```

Se voce usar dominio customizado, adicione esse dominio tambem.

## 8. Checklist Pos-Deploy

Depois do deploy, valide:

- a pagina abre sem erro
- login com email/senha funciona
- login com Google funciona
- criacao de tarefa funciona
- criacao de evento funciona
- leitura e escrita no Realtime Database funcionam
- chamadas para `/api/*` retornam sucesso

## 9. Problemas Comuns

### 9.1 `Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL`

Causa comum:

- `.env` nao foi preenchido
- a API local esta lendo `.env`, nao `.env.local`

Correcao:

- confirme que `.env` contem `FIREBASE_SERVICE_ACCOUNT`
- confirme que `.env` contem `FIREBASE_DATABASE_URL`

### 9.2 Erro de `JSON.parse` na service account

Causa comum:

- o JSON da service account foi colado quebrado
- faltaram aspas
- houve quebra de linha incorreta

Correcao:

- gere um JSON compacto em uma linha
- em `.env`, use aspas simples ao redor do valor inteiro

### 9.3 Google Login falha

Verifique:

- `localhost` e o dominio da Vercel em `Authorized domains`
- Google provider habilitado no Firebase Authentication

### 9.4 Erro de CORS em producao

Verifique:

- `FRONTEND_URL` na Vercel
- se o valor bate exatamente com a URL publicada

### 9.5 A API funciona localmente, mas falha na Vercel

Verifique:

- se `FIREBASE_SERVICE_ACCOUNT` foi colado corretamente na Vercel
- se `FIREBASE_DATABASE_URL` esta correto
- se o deploy recebeu todas as variaveis de ambiente

## 10. Comandos Rapidos

Instalar dependencias:

```powershell
npm install
```

Rodar local:

```powershell
npm run dev
```

Rodar so a API:

```powershell
npm run dev:api
```

Rodar so o frontend:

```powershell
npm run dev:vite
```

Gerar build:

```powershell
npm run build
```

Preview da build:

```powershell
npm run preview
```

Deploy de regras do Firebase:

```powershell
firebase deploy --only database
```

Deploy na Vercel:

```powershell
vercel --prod
```
