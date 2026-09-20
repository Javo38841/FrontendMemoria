import { test, expect } from '@playwright/test';
import {
  assertBackendAvailable,
  cleanupUser,
  cleanupUserIfExists,
  createEventViaApi,
  createUserViaApi,
  credentialsFor,
  loginViaApi,
  signIn,
  stubExternalServices,
  type ApiEvent,
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

  // Contrato correcto: con un token inválido el backend responde 401 y el interceptor de la app
  // (api.interceptor.ts) debe limpiar la sesión y mandar a /login.
  //
  // DEFECTO CONOCIDO DEL BACKEND: sus respuestas 401 no traen Access-Control-Allow-Origin. Con el
  // frontend en otro origen (localhost:5173 -> localhost:8000) el navegador las bloquea por CORS
  // (net::ERR_FAILED), axios recibe un error sin `response` y el interceptor nunca ve el 401: la
  // app se queda en /events con el token inválido y muestra "Error al cargar eventos".
  // test.fail() pasa mientras el assert falle y avisa (falla) cuando el backend se corrija:
  // entonces hay que quitar el .fail.
  test.fail('un token inválido en localStorage redirige a /login y limpia la sesión (interceptor 401) [defecto conocido del backend: el 401 no trae cabeceras CORS]', async ({ page }) => {
    await signIn(page, { id: user.id, username: user.username, token: 'token.invalido.abc' }, '/login');

    // La app cree que hay sesión y pide los eventos con ese token
    await page.goto('/events');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    const saved = await storage(page);
    expect(saved.token).toBeNull();
    expect(saved.user).toBeNull();
  });
});

test.describe('Cierre de sesión desde cada pantalla protegida', () => {
  let event: ApiEvent;

  test.beforeAll(async () => {
    // cleanupUser (afterAll de arriba) borra este evento junto con el usuario
    event = await createEventViaApi(user, {
      title: `[E2E] ${Date.now()} cierre de sesión`,
      date: '2031-06-15',
      location: 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile',
      latitude: -36.827,
      longitude: -73.0503,
    });
  });

  const pantallas: { nombre: string; abrir: (page: import('@playwright/test').Page) => Promise<void> }[] = [
    { nombre: '/events', abrir: (page) => signIn(page, user, '/events') },
    { nombre: '/my-events', abrir: (page) => signIn(page, user, '/my-events') },
    { nombre: '/events/create', abrir: (page) => signIn(page, user, '/events/create') },
    { nombre: '/events/:id', abrir: (page) => signIn(page, user, `/events/${event.id}`) },
    {
      nombre: '/events/edit/:id',
      abrir: async (page) => {
        await signIn(page, user, '/my-events');
        await page.getByRole('button', { name: /Editar/ }).click();
        await expect(page.getByRole('heading', { name: 'Editar Evento' })).toBeVisible();
      },
    },
  ];

  for (const { nombre, abrir } of pantallas) {
    test(`cerrar sesión desde ${nombre} limpia la sesión y no se puede volver atrás`, async ({ page }) => {
      await stubExternalServices(page);
      await abrir(page);

      await page.getByRole('button', { name: 'Cerrar Sesión' }).click();

      await expect(page).toHaveURL(/\/login$/);
      const saved = await storage(page);
      expect(saved.token).toBeNull();
      expect(saved.user).toBeNull();

      await page.goBack();
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
