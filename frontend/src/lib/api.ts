// Base URL of the VoltchainHub backend API. Empty by default (backend not yet
// published); set NEXT_PUBLIC_API_URL at build time to enable live data.
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export const API_CONFIGURED = API_BASE.length > 0;
