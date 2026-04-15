const BASE = "/api";

let apiKey = localStorage.getItem("aabo_key") ?? "";

export const setApiKey = (key: string): void => {
  apiKey = key;
  localStorage.setItem("aabo_key", key);
};

export const getApiKey = (): string => apiKey;

const headers = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "x-api-key": apiKey,
});

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
};

// API helpers

export const fetchMetrics = () =>
  request<{
    total_requests: number;
    blocked_requests: number;
    success_rate: number;
    requests_per_min: number;
    top_routes: { route: string; count: number; blocked: number }[];
    redis_memory: string;
  }>("/metrics");

export const fetchKeys = () =>
  request<
    {
      id: string;
      name: string | null;
      is_active: boolean;
      created_at: string;
    }[]
  >("/keys");

export const createKey = (name: string) =>
  request<{ id: string; name: string; key: string; created_at: string }>(
    "/keys",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );

export const revokeKey = (id: string) =>
  request<{ revoked: boolean }>(`/keys/${id}`, { method: "DELETE" });

export const fetchLogs = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<
    {
      id: string;
      ip: string;
      route: string;
      method: string;
      status_code: number;
      blocked: boolean;
      response_ms: number;
      created_at: string;
    }[]
  >(`/logs${qs}`);
};

export const fetchBlocks = () =>
  request<
    {
      id: string;
      entity_type: string;
      entity_value: string;
      reason: string;
      blocked_by: string;
      expires_at: string | null;
    }[]
  >("/blocks");

export const unblock = (type: string, value: string) =>
  request<{ unblocked: boolean }>(`/blocks/${type}/${value}`, {
    method: "DELETE",
  });
