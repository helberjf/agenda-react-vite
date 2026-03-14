/**
 * lib/api.ts
 *
 * Cliente HTTP para as Vercel API Routes.
 * Injeta automaticamente o token Firebase no header Authorization.
 * O servidor verifica o token antes de executar qualquer operacao.
 */

import { auth } from "@/lib/firebase";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario nao autenticado.");
  return user.getIdToken();
}

function parseApiResponse(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text } as const;
  }
}

function extractApiError(data: unknown, status: number) {
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }

    if ("raw" in data && typeof data.raw === "string") {
      return data.raw;
    }
  }

  return `HTTP ${status}`;
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
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  const data = parseApiResponse(text);

  if (!response.ok) {
    throw new Error(extractApiError(data, response.status));
  }

  return (data ?? {}) as T;
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
