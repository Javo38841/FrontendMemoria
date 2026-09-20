// Lee el claim `exp` (segundos desde epoch, RFC 7519) del payload de un JWT, sin verificar la firma.
// La verificación de la firma y la autorización siguen siendo responsabilidad del backend.
const decodePayload = (token: string): Record<string, unknown> | null => {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

// true solo si el token trae `exp` y ya pasó. Si no se puede leer, se deja decidir al backend.
export const isTokenExpired = (token: string, nowMs: number = Date.now()): boolean => {
  const exp = decodePayload(token)?.exp;
  return typeof exp === 'number' && exp * 1000 <= nowMs;
};
