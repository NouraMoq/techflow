// Helpers for JSON-in-String fields (portable across SQLite & PostgreSQL).
// On PostgreSQL these can be promoted to native Json/array columns later.

export function parseArr(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function parseObj<T = Record<string, unknown>>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const toJson = (v: unknown): string => JSON.stringify(v);
