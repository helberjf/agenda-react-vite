# Deploy na Vercel

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com) (gratuita)
2. Projeto Firebase com **Realtime Database** criado
3. Firebase Authentication com **Email/Password** e **Google** habilitados

---

## 1. Obter Service Account do Firebase

1. Firebase Console → Project Settings (engrenagem) → **Service Accounts**
2. Clique em **Generate new private key**
3. Salve o arquivo JSON — você vai precisar do conteúdo completo

---

## 2. Deploy na Vercel

### Via CLI (recomendado)

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Via GitHub

1. Faça push do projeto para um repositório GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório
4. Clique em **Deploy** (as configurações já estão no `vercel.json`)

---

## 3. Configurar variáveis de ambiente na Vercel

Acesse: **Vercel Dashboard → seu projeto → Settings → Environment Variables**

| Nome | Valor |
|------|-------|
| `VITE_FIREBASE_API_KEY` | Valor do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `seu-projeto.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://seu-projeto-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `seu-projeto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Valor do Firebase |
| `VITE_FIREBASE_APP_ID` | Valor do Firebase |
| `FIREBASE_SERVICE_ACCOUNT` | **JSON inteiro** da service account (como string) |
| `FIREBASE_DATABASE_URL` | `https://seu-projeto-default-rtdb.firebaseio.com` |
| `FRONTEND_URL` | URL do seu projeto na Vercel (ex: `https://agenda.vercel.app`) |

> **Atenção:** O `FIREBASE_SERVICE_ACCOUNT` deve ser o JSON completo em uma linha.
> Para converter: `cat service-account.json | tr -d '\n'`

---

## 4. Security Rules do Firebase Database

Cole isso em **Firebase Console → Realtime Database → Regras**:

```json
{
  "rules": {
    "tasks":       { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "dailyTasks":  { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "weeklyTasks": { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "dailyLogs":   { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "events":      { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid", ".indexOn": ["startAt"] } },
    "weeklyGoals": { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "categories":  { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "users":       { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } }
  }
}
```

---

## 5. Domínio autorizado no Firebase Auth

Firebase Console → Authentication → Settings → **Authorized domains**

Adicione o domínio da Vercel: `seu-projeto.vercel.app`

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar .env.local com as variáveis do .env.example
cp .env.example .env.local
# Edite .env.local com seus valores

# Rodar frontend + API routes localmente
npm run dev
```

Para testar as API routes localmente com autenticação real, use a Vercel CLI:

```bash
vercel dev
```
