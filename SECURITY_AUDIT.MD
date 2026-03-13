# Auditoria de Segurança — Agenda (agenda-react-vite)

**Data:** 2025-03-13

---

## 1. Hash em senha

**Status:** OK (via Firebase Authentication)

O projeto usa Firebase Authentication para login e registro. As senhas nunca chegam ao código da aplicação: o Firebase aplica hash (scrypt) e armazena tudo no servidor da Google.

- Login: `signInWithEmailAndPassword`
- Registro: `createUserWithEmailAndPassword`
- Conclusão: Segurança de senha garantida pelo Firebase. Não há tratamento manual de senha.

---

## 2. Rate limit contra brute force

**Status:** Parcial (apenas proteção padrão do Firebase)

**O que existe hoje:**
- Proteções não documentadas do Firebase (bloqueios automáticos em tráfego suspeito)
- Limite documentado: 100 contas novas por hora por IP
- Comentários no código indicam que rate limiting "pode ser adicionado" — **não está implementado**

**Conclusão:** Não há rate limiting explícito implementado no projeto. O Firebase oferece proteção básica. Recomendável adicionar camada extra para cenários de alto risco.

---

## 3. Backend

**Status:** OK (Cloud Functions)

| Área        | Implementação                                          |
|-------------|--------------------------------------------------------|
| Auth        | Firebase Auth (serviço Google)                         |
| Tasks       | Cloud Functions (create, update, complete, delete)     |
| Events      | Cloud Functions (create, update, delete)               |
| Daily logs  | Cloud Function (upsertDailyLog)                        |

**Arquitetura de segurança:**
- **Escritas:** passam pelas Cloud Functions (token verificado no servidor)
- **Leituras:** direto no Realtime Database (protegidas por `database.rules.json`)
- Todas as regras checam `auth.uid === $uid` (isolamento por usuário)

---

## Resumo

| Item              | Status   | Observação                                    |
|-------------------|----------|-----------------------------------------------|
| Hash em senha     | OK       | Firebase Auth                                 |
| Rate limit        | Parcial  | Só proteção padrão do Firebase                |
| Backend           | OK       | Cloud Functions para tasks, events e logs     |
| Security Rules    | OK       | Isolamento por usuário no Realtime Database   |

---

## Próximos passos (recomendações)

1. **Rate limiting em login:** Cloud Function `onCall` que chame Firebase Auth REST API com rate limit por IP/email antes do login.
2. **Firebase App Check:** Adicionar para dificultar uso por bots e scripts automatizados.
3. **Monitoramento:** Configurar alertas no Firebase Console para tentativas de login suspeitas.
