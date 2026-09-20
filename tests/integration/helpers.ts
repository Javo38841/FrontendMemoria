import axios from 'axios';
import type { AxiosError } from 'axios';
import { api, setAuthToken } from '../../src/services/api.config';
import { authService } from '../../src/features/auth/services/auth.services';
import { eventsService } from '../../src/features/events/services/events.services';
import type { Event, EventRequest } from '../../src/features/events/types/events.types';

export const TEST_PASSWORD = 'Test12345!';

export interface TestUser {
  id: number;
  username: string;
  email: string;
  password: string;
  token: string;
}

// URL efectiva: la misma que usan los servicios (VITE_API_BASE_URL o http://localhost:8000)
export const baseUrl = (): string => api.defaults.baseURL as string;

// Falla con un mensaje claro si el backend no está disponible
export async function assertBackendAvailable(): Promise<void> {
  const url = `${baseUrl()}/events/allEvents`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    if (res.status >= 500) {
      throw new Error(`respondió HTTP ${res.status}`);
    }
  } catch (error) {
    const code = axios.isAxiosError(error) && error.code ? `${error.code}: ` : '';
    const reason = `${code}${error instanceof Error ? error.message : String(error)}`;
    throw new Error(
      `El backend no está disponible en ${baseUrl()} (${reason}). ` +
        'Levántalo o define VITE_API_BASE_URL con la URL correcta antes de correr npm run test:integration.'
    );
  }
}

// Usuario único por corrida (timestamp + sufijo aleatorio)
export function uniqueCredentials(label: string) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const username = `it_${label}_${suffix}`;
  return { username, email: `${username}@example.com`, password: TEST_PASSWORD };
}

// Registra un usuario nuevo con authService y hace login. Deja el token en axios.
export async function registerAndLogin(label: string): Promise<TestUser> {
  const credentials = uniqueCredentials(label);
  await authService.register(credentials);
  const session = await authService.login({
    username: credentials.username,
    password: credentials.password,
  });
  setAuthToken(session.token);
  return { ...credentials, id: session.id, token: session.token };
}

// Evento de prueba: el título siempre empieza con "[TEST]"
export function buildEvent(label: string, overrides: Partial<EventRequest> = {}): EventRequest {
  return {
    title: `[TEST] ${label}`,
    description: 'Evento creado por las pruebas de integración',
    date: '2030-01-15',
    location: 'Plaza de Armas, Santiago, Chile',
    startTime: '20:00:00',
    endTime: '22:00:00',
    latitude: -33.4378,
    longitude: -70.6505,
    ...overrides,
  };
}

// Espera que la promesa falle con un error HTTP y devuelve ese error (falla si tuvo éxito)
export async function rejectionOf(promise: Promise<unknown>): Promise<AxiosError> {
  try {
    await promise;
  } catch (error) {
    if (axios.isAxiosError(error)) return error;
    throw error;
  }
  throw new Error('Se esperaba que la petición fallara, pero tuvo éxito');
}

// Crea eventos de prueba y recuerda sus ids para borrarlos al final
export class TestData {
  private eventIds = new Set<number>();
  private user: TestUser;

  constructor(user: TestUser) {
    this.user = user;
  }

  async createEvent(label: string, overrides: Partial<EventRequest> = {}): Promise<Event> {
    setAuthToken(this.user.token);
    const created = await eventsService.create(this.user.id, buildEvent(label, overrides));
    this.eventIds.add(created.id);
    return created;
  }

  // Borra los eventos creados y el usuario de prueba. Lanza un error si algo queda sin borrar.
  async cleanup(): Promise<void> {
    const leftovers: string[] = [];
    setAuthToken(this.user.token);

    for (const id of this.eventIds) {
      try {
        await eventsService.delete(id, this.user.id);
      } catch {
        // un test pudo haberlo borrado ya: si sigue en el listado, es un resto real
        const remaining = await eventsService.getAll().catch(() => []);
        if (remaining.some((e) => e.id === id)) leftovers.push(`evento ${id}`);
      }
    }

    try {
      // authService no tiene borrado de usuario: se usa el endpoint directamente
      await api.delete(`/users/${this.user.id}`, {
        headers: { Authorization: `Bearer ${this.user.token}` },
      });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : 'error de red';
      leftovers.push(`usuario ${this.user.username} (DELETE /users/${this.user.id} -> ${status})`);
    }

    setAuthToken(null);
    if (leftovers.length) {
      throw new Error(`No se pudo limpiar: ${leftovers.join(', ')}. Bórralos a mano.`);
    }
  }
}
