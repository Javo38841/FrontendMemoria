import { test, expect, type Page } from '@playwright/test';
import {
  assertBackendAvailable,
  cleanupUser,
  createEventViaApi,
  createUserViaApi,
  signIn,
  stubExternalServices,
  type ApiEvent,
  type ApiUser,
} from './support';

// Título único por corrida: todas las aserciones apuntan a este evento
const STAMP = Date.now();
const TITLE = `[E2E] ${STAMP} detalle`;
const DESCRIPTION = `Descripción del evento de detalle ${STAMP}`;
const LOCATION = 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile';

let user: ApiUser;
let event: ApiEvent;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('detalle');
  event = await createEventViaApi(user, {
    title: TITLE,
    description: DESCRIPTION,
    date: '2031-06-15',
    location: LOCATION,
    latitude: -36.827,
    longitude: -73.0503,
  });
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

// Deja en /events solo mi evento (filtrando por su título único)
async function openEventsIsolated(page: Page) {
  await stubExternalServices(page);
  await signIn(page, user, '/events');
  await page.getByLabel('Buscar').fill(TITLE);
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
}

async function expectDetailsOfMyEvent(page: Page) {
  await expect(page).toHaveURL(new RegExp(`/events/${event.id}$`));
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
  await expect(page.getByText(DESCRIPTION)).toBeVisible();
  await expect(page.getByText(LOCATION)).toBeVisible();
  await expect(page.getByText('2031-06-15')).toBeVisible();
}

test.describe('Detalle de un evento', () => {
  test('desde el popup del marcador ("Ver Detalles") se llega a /events/<id>', async ({ page }) => {
    await openEventsIsolated(page);

    await page.locator('.leaflet-marker-icon').click();
    await page.locator('.leaflet-popup').getByRole('button', { name: 'Ver Detalles' }).click();

    await expectDetailsOfMyEvent(page);
  });

  test('desde la tarjeta se llega a /events/<id>', async ({ page }) => {
    await openEventsIsolated(page);

    await page.getByRole('heading', { name: TITLE, exact: true }).click();

    await expectDetailsOfMyEvent(page);
  });

  test('el detalle muestra el mapa con la ubicación del evento', async ({ page }) => {
    await stubExternalServices(page);
    await signIn(page, user, `/events/${event.id}`);

    await expect(page.getByText('Ubicación en el Mapa')).toBeVisible();
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  });

  test('"Volver a Eventos" regresa a /events', async ({ page }) => {
    await stubExternalServices(page);
    await signIn(page, user, `/events/${event.id}`);

    await page.getByRole('button', { name: /Volver a Eventos/ }).click();

    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByRole('heading', { name: 'Todos los Eventos' })).toBeVisible();
  });

  test('la ruta es protegida: sin sesión redirige a /login', async ({ page }) => {
    await page.goto(`/events/${event.id}`);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
  });

  test('un id que no existe no muestra ningún evento y permite volver a /events', async ({ page }) => {
    await stubExternalServices(page);
    await signIn(page, user, '/events/2000000000');

    // el texto del error lo pone el backend (hoy un 500 genérico), así que no se asierta
    const back = page.getByRole('button', { name: /Volver a Eventos/ });
    await expect(back).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    await expect(page.getByText('Ubicación en el Mapa')).toHaveCount(0);

    await back.click();
    await expect(page).toHaveURL(/\/events$/);
  });
});

test.describe('La nueva ruta no captura a las demás rutas de /events', () => {
  test('/events/create sigue abriendo el formulario de creación', async ({ page }) => {
    await stubExternalServices(page);
    await signIn(page, user, '/events/create');

    await expect(page).toHaveURL(/\/events\/create$/);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Evento' })).toBeVisible();
  });

  test('/events/edit/<id> sigue abriendo el formulario de edición', async ({ page }) => {
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');

    await page.getByRole('button', { name: /Editar/ }).click();

    await expect(page).toHaveURL(new RegExp(`/events/edit/${event.id}$`));
    await expect(page.getByRole('heading', { name: 'Editar Evento' })).toBeVisible();
  });
});
