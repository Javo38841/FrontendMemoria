import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setAuthToken } from '../../src/services/api.config';
import { authService } from '../../src/features/auth/services/auth.services';
import { eventsService } from '../../src/features/events/services/events.services';
import {
  TestData,
  assertBackendAvailable,
  baseUrl,
  buildEvent,
  registerAndLogin,
  rejectionOf,
  uniqueCredentials,
  type TestUser,
} from './helpers';

let user: TestUser;
let data: TestData;

const decodeJwtPayload = (token: string) =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

beforeAll(async () => {
  await assertBackendAvailable();
  user = await registerAndLogin('auth');
  data = new TestData(user);
});

afterAll(async () => {
  if (data) await data.cleanup();
});

beforeEach(() => {
  setAuthToken(null);
});

describe(`Autenticación contra el backend real`, () => {
  it('apunta al backend configurado', () => {
    expect(baseUrl()).toMatch(/^https?:\/\//);
  });

  describe('registro', () => {
    it('registra un usuario nuevo sin error', async () => {
      const credentials = uniqueCredentials('registro');
      await expect(authService.register(credentials)).resolves.toBeUndefined();

      // el usuario recién creado puede iniciar sesión; se borra al terminar
      const session = await authService.login(credentials);
      const cleanup = new TestData({ ...credentials, id: session.id, token: session.token });
      await cleanup.cleanup();
    });

    it('rechaza un username repetido con HTTP 400', async () => {
      const error = await rejectionOf(
        authService.register({
          username: user.username,
          email: `otro_${user.email}`,
          password: user.password,
        })
      );
      expect(error.response?.status).toBe(400);
      expect(error.response?.data).toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('rechaza un email repetido con HTTP 400', async () => {
      const error = await rejectionOf(
        authService.register({
          username: `otro_${user.username}`,
          email: user.email,
          password: user.password,
        })
      );
      expect(error.response?.status).toBe(400);
    });
  });

  describe('login', () => {
    it('devuelve token, id y username', async () => {
      const session = await authService.login({ username: user.username, password: user.password });

      expect(Object.keys(session).sort()).toEqual(['id', 'token', 'username']);
      expect(session.id).toBe(user.id);
      expect(session.username).toBe(user.username);
      expect(typeof session.token).toBe('string');
      expect(session.token.split('.')).toHaveLength(3); // JWT
    });

    it('el JWT identifica al usuario y no está vencido', async () => {
      const { token } = await authService.login({ username: user.username, password: user.password });
      const payload = decodeJwtPayload(token);

      expect(payload.sub).toBe(user.username);
      expect(payload.id).toBe(user.id);
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('rechaza una contraseña incorrecta con HTTP 401', async () => {
      const error = await rejectionOf(
        authService.login({ username: user.username, password: 'contraseña-incorrecta' })
      );
      expect(error.response?.status).toBe(401);
    });

    // Se espera 401 (igual que con contraseña incorrecta). Ver informe: hoy el backend responde 500.
    it('rechaza un usuario inexistente con HTTP 401', async () => {
      const error = await rejectionOf(
        authService.login({ username: `no_existe_${Date.now()}`, password: 'x' })
      );
      expect(error.response?.status).toBe(401);
    });
  });

  describe('rutas protegidas', () => {
    it('sin token: getMyEvents responde HTTP 403', async () => {
      const error = await rejectionOf(eventsService.getMyEvents(user.id));
      expect(error.response?.status).toBe(403);
    });

    it('sin token: crear un evento responde HTTP 403 y no crea nada', async () => {
      const error = await rejectionOf(eventsService.create(user.id, buildEvent('sin token')));
      expect(error.response?.status).toBe(403);

      setAuthToken(user.token);
      const mine = await eventsService.getMyEvents(user.id);
      expect(mine).toEqual([]);
    });

    it('con token inválido: responde HTTP 401', async () => {
      setAuthToken('esto.no.es-un-jwt');
      const error = await rejectionOf(eventsService.getMyEvents(user.id));
      expect(error.response?.status).toBe(401);
    });

    it('con la firma del token alterada: responde HTTP 401', async () => {
      // Se cambia el PRIMER carácter de la firma: el último no sirve, porque en base64url
      // sus bits finales no se usan y algunos cambios producen la misma firma.
      const [header, payload, signature] = user.token.split('.');
      const flipped = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
      setAuthToken(`${header}.${payload}.${flipped}`);
      const error = await rejectionOf(eventsService.getMyEvents(user.id));
      expect(error.response?.status).toBe(401);
    });

    it('con token válido: getMyEvents responde correctamente', async () => {
      setAuthToken(user.token);
      await expect(eventsService.getMyEvents(user.id)).resolves.toEqual([]);
    });

    it('getAll es público: funciona sin token', async () => {
      const events = await eventsService.getAll();
      expect(Array.isArray(events)).toBe(true);
    });

    it('getAll con un token inválido responde HTTP 401 (aunque la ruta sea pública)', async () => {
      setAuthToken('esto.no.es-un-jwt');
      const error = await rejectionOf(eventsService.getAll());
      expect(error.response?.status).toBe(401);
    });
  });
});
