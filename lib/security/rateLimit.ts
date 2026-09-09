// ==========================================
// Rate Limiting — Protección contra abuso en API routes
// In-memory rate limiter (por proceso de Vercel)
// ==========================================

const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter simple por clave (userId, IP, etc.)
 * En producción considerar una solución distribuida (Redis, Upstash)
 */
export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Limpiar entradas viejas cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (now > entry.resetAt) {
      rateMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
