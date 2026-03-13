/**
 * lib/api.ts
 *
 * Cliente HTTP para as Vercel API Routes.
 * Injeta automaticamente o token Firebase no header Authorization.
 * O servidor verifica o token antes de executar qualquer operação.
 */

import { auth } from "@/lib/firebase";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");
  return user.getIdToken();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>
): Promise<T> {
  const token = await getToken();

  const url = new URL(`${BASE_URL}/api${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>("GET", path, undefined, params),

  post: <T>(path: string, body: unknown) =>
    request<T>("POST", path, body),

  patch: <T>(path: string, body: unknown) =>
    request<T>("PATCH", path, body),

  put: <T>(path: string, body: unknown) =>
    request<T>("PUT", path, body),

  delete: <T>(path: string) =>
    request<T>("DELETE", path),
};
