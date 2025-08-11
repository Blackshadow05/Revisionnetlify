/**
 * Upstash Cache wrapper (REST) - Archivo creado para resolver importaciones faltantes
 *
 * Soporta las siguientes variables de entorno (prioridad en este orden):
 * - NEXT_PUBLIC_UPSTASH_REDIS_URL
 * - UPSTASH_REDIS_REST_URL
 *
 * - NEXT_PUBLIC_UPSTASH_REDIS_TOKEN
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Proporciona:
 * - UpstashCache class con métodos get, set, del
 * - createUpstashCache() que devuelve una instancia o null si no hay configuración
 */

export class UpstashCache {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Obtener clave desde Upstash (intenta parsear JSON)
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.url}/get?key=${encodeURIComponent(key)}`, {
        headers: this.headers()
      });

      if (!res.ok) {
        return null;
      }

      const payload = await res.json();
      const raw = payload?.result ?? payload?.value ?? null;

      if (raw === null || raw === undefined) return null;

      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }

      return raw as T;
    } catch (err) {
      // No propagar errores de cache al caller
      console.error('Upstash GET error:', err);
      return null;
    }
  }

  // Establecer clave con TTL en segundos (opcional)
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    let url = `${this.url}/set?key=${encodeURIComponent(key)}&value=${encodeURIComponent(
      toStore
    )}`;
    if (ttlSeconds) url += `&ttl=${ttlSeconds}`;

    const res = await fetch(url, {
      headers: this.headers()
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upstash set failed: ${text}`);
    }
  }

  // Eliminar clave
  async del(key: string): Promise<void> {
    const res = await fetch(`${this.url}/del?key=${encodeURIComponent(key)}`, {
      headers: this.headers()
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upstash del failed: ${text}`);
    }
  }
}

// Creador de instancia que soporta múltiples nombres de variable de entorno
export function createUpstashCache(): UpstashCache | null {
  const url =
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_URL;

  const token =
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;
  return new UpstashCache(url, token);
}

export default UpstashCache;