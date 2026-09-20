import { test, expect } from '@playwright/test';
import {
  assertBackendAvailable,
  cleanupUser,
  cleanupUserIfExists,
  createUserViaApi,
  credentialsFor,
  loginViaApi,
  signIn,
  type ApiUser,
} from './support';

let user: ApiUser;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('auth');
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

const storage = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
  }));

test.describe('Registro', () => {
  test('un usuario nuevo se registra desde la interfaz y queda con sesión iniciada', async ({ page }) => {
    const credentials = credentialsFor('registro');
    try {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'Únete a BeatMap' })).toBeVisible();

      await page.getByLabel('Username').fill(credentials.username);
      await page.getByLabel('Email').fill(credentials.email);
      await page.getByLabel('Password').fill(credentials.password);
      await page.getByRole('button', { name: 'Registrarse' }).click();

      // el registro hace login automático y lleva a /events
      await expect(page).toHaveURL(/\/events$/);
      await expect(page.getByText(credentials.username, { exact: true })).toBeVisible();

      const saved = await storage(page);
      expect(saved.token?.split('.')).toHaveLength(3);
      expect(JSON.parse(saved.user!)).toMatchObject({ username: credentials.username });

      // el usuario existe de verdad en el backend
      await expect(loginViaApi(credentials.username, credentials.password)).resolves.toMatchObject({
        id: expect.any(Number),
      });
    } finally {
      await cleanupUserIfExists(credentials);
    }
  });

  test('un username repetido muestra el error del backend y no inicia sesión', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(`otro_${user.email}`);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(page.getByText('Username already in use')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
    expect((await storage(page)).token).toBeNull();
  });
});

test.describe('Login', () => {
  test('con credenciales válidas entra a /events y guarda la sesión', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();

    const saved = await storage(page);
    expect(saved.token?.split('.')).toHaveLength(3);
    expect(JSON.parse(saved.user!)).toEqual({ id: user.id, username: user.username });
  });

  test('con contraseña incorrecta muestra un error y no guarda sesión', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page.getByText('Error al iniciar sesión')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    const saved = await storage(page);
    expect(saved.token).toBeNull();
    expect(saved.user).toBeNull();
  });
});

test.describe('Sesión', () => {
  test('cerrar sesión limpia el almacenamiento y vuelve a exigir login', async ({ page }) => {
    await signIn(page, user, '/events');
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();
    expect((await storage(page)).token).not.toBeNull();

    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
    const saved = await storage(page);
    expect(saved.token).toBeNull();
    expect(saved.user).toBeNull();

    // sin sesión, una ruta protegida ya no se puede abrir
    await page.goto('/events');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('una sesión guardada sobrevive a recargar la página', async ({ page }) => {
    await signIn(page, user, '/events');
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();
  });

  test('un token inválido en localStorage redirige a /login y limpia la sesión (interceptor 401)', async ({ page }) => {
    await signIn(page, { id: user.id, username: user.username, token: 'token.invalido.abc' }, '/login');

    // La app cree que hay sesión, pide los eventos con ese token y el backend responde 401;
    // el interceptor debe limpiar la sesión y mandar a /login.
    // Hoy este test FALLA: el backend no envía Access-Control-Allow-Origin en las respuestas
    // 401, el navegador las bloquea por CORS y axios nunca ve el status (ver informe).
    await page.goto('/events');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    const saved = await storage(page);
    expect(saved.token).toBeNull();
    expect(saved.user).toBeNull();
  });
});
