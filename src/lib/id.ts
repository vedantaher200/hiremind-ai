/** Browser-safe identifier for client-only fallback records. Database records use Supabase IDs. */
export function createClientId(prefix = 'local'): string {
  const browserCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (browserCrypto?.randomUUID) return `${prefix}-${browserCrypto.randomUUID()}`;
  if (browserCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    browserCrypto.getRandomValues(bytes);
    return `${prefix}-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
