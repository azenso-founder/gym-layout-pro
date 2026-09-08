// ==========================================
// Sanitización de inputs
// Prevención de XSS para contenido renderizado
// ==========================================

import DOMPurify from 'dompurify';

/**
 * Sanitizar HTML potencialmente peligroso.
 * Uso: cuando se renderea contenido que proviene del usuario.
 */
export function sanitizeHtml(dirty: string): string {
  // DOMPurify requiere window (browser-only)
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
      ALLOWED_ATTR: [],
    });
  }
  // Fallback server-side: strip all HTML tags
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizar string plano (sin HTML).
 * Uso: nombres de proyecto, descripciones, etc.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')  // Remover tags HTML
    .replace(/[<>'"]/g, '')    // Remover caracteres peligrosos
    .trim();
}

/**
 * Validar que un string sea un UUID v4 válido.
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}
