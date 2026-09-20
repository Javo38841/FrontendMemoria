import type { Page } from '@playwright/test';

// Backend real: mismo VITE_API_BASE_URL que usa la app (por defecto http://localhost:8000)
export const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const PASSWORD = 'E2e12345!';

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  password: string;
  token: string;
}

interface ApiResult {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export async function apiCall(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; params?: Record<string, string | number> } = {}
): Promise<ApiResult> {
  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

// Falla con un mensaje claro si el backend no responde
export async function assertBackendAvailable(): Promise<void> {
  try {
    const { status } = await apiCall('GET', '/events/allEvents');
    if (status >= 500) throw new Error(`respondió HTTP ${status}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `El backend no está disponible en ${API_URL} (${reason}). ` +
        'Levántalo o define VITE_API_BASE_URL antes de correr npm run test:e2e.'
    );
  }
}

// Nombre único por corrida (timestamp + sufijo aleatorio)
export function uniqueName(label: string): string {
  return `e2e_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function credentialsFor(label: string) {
  const username = uniqueName(label);
  return { username, email: `${username}@example.com`, password: PASSWORD };
}

export async function loginViaApi(username: string, password: string) {
  const { status, data } = await apiCall('POST', '/auth/login', { body: { username, password } });
  if (status !== 200) throw new Error(`login de ${username} falló con HTTP ${status}`);
  return { id: data.id as number, token: data.token as string };
}

// Crea un usuario único por API (registro + login)
export async function createUserViaApi(label: string): Promise<ApiUser> {
  const credentials = credentialsFor(label);
  const { status } = await apiCall('POST', '/users', { body: credentials });
  if (status !== 200) throw new Error(`registro de ${credentials.username} falló con HTTP ${status}`);
  const { id, token } = await loginViaApi(credentials.username, credentials.password);
  return { ...credentials, id, token };
}

// Borra todos los eventos del usuario y luego el usuario (DELETE /users/{id}).
// Verifica que no quede nada; si queda algo, lanza un error que lo dice claramente.
export async function cleanupUser(user: ApiUser): Promise<void> {
  const leftovers: string[] = [];

  const mine = await apiCall('GET', '/events/my-events', { token: user.token, params: { userId: user.id } });
  if (mine.status === 200) {
    for (const event of mine.data as { id: number; title: string }[]) {
      const result = await apiCall('DELETE', `/events/${event.id}`, {
        token: user.token,
        params: { userId: user.id },
      });
      if (result.status >= 300) leftovers.push(`evento ${event.id} "${event.title}" (DELETE -> ${result.status})`);
    }
    const after = await apiCall('GET', '/events/my-events', { token: user.token, params: { userId: user.id } });
    for (const event of after.data as { id: number; title: string }[]) {
      if (!leftovers.some((l) => l.startsWith(`evento ${event.id} `))) {
        leftovers.push(`evento ${event.id} "${event.title}" (sigue existiendo)`);
      }
    }
  } else {
    leftovers.push(`no se pudieron listar los eventos de ${user.username} (HTTP ${mine.status})`);
  }

  const removed = await apiCall('DELETE', `/users/${user.id}`, { token: user.token });
  if (removed.status >= 300) {
    leftovers.push(`usuario ${user.username} (DELETE /users/${user.id} -> ${removed.status})`);
  } else {
    const stillLogs = await apiCall('POST', '/auth/login', {
      body: { username: user.username, password: user.password },
    });
    if (stillLogs.status === 200) leftovers.push(`usuario ${user.username} (aún puede iniciar sesión)`);
  }

  if (leftovers.length) {
    throw new Error(`E2E: quedaron datos sin borrar, bórralos a mano: ${leftovers.join('; ')}`);
  }
}

// Borra un usuario creado desde la interfaz (solo se conocen sus credenciales).
// Si no puede iniciar sesión, el usuario no llegó a crearse y no hay nada que borrar.
export async function cleanupUserIfExists(credentials: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  const login = await apiCall('POST', '/auth/login', {
    body: { username: credentials.username, password: credentials.password },
  });
  if (login.status !== 200) return;
  await cleanupUser({ ...credentials, id: login.data.id, token: login.data.token });
}

// Deja una sesión iniciada en el navegador sin pasar por la pantalla de login.
// Escribe el localStorage UNA vez (no usa addInitScript, que lo reescribiría en cada
// navegación y ocultaría el logout o la limpieza del interceptor 401).
export async function signIn(page: Page, user: Pick<ApiUser, 'id' | 'username' | 'token'>, target: string) {
  await page.goto('/login'); // ruta pública: no redirige
  await page.evaluate(
    ({ token, id, username }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, username }));
    },
    { token: user.token, id: user.id, username: user.username }
  );
  await page.goto(target);
}
