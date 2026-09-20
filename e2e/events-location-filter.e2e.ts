import { test, expect, type Page } from '@playwright/test';
import {
  assertBackendAvailable,
  cleanupUser,
  createEventViaApi,
  createUserViaApi,
  signIn,
  stubExternalServices,
  type ApiUser,
} from './support';

// Dos eventos en comunas DISTINTAS que comparten "Provincia de Concepción" y "Región del Biobío".
// Antes del arreglo, filtrar por "Concepción" traía también el de Talcahuano por su provincia.
// Todo se aísla con un token único en el título; no se mira el total de la base.
const STAMP = Date.now();
const TOKEN = `[E2E] ${STAMP}`;
const CENTRO = `${TOKEN} Centro`; // comuna de Concepción
const PUERTO = `${TOKEN} Puerto`; // comuna de Talcahuano

const SEED = [
  {
    title: CENTRO,
    date: '2031-03-10',
    location: 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile',
    latitude: -36.827,
    longitude: -73.0503,
  },
  {
    title: PUERTO,
    date: '2031-03-12',
    location: 'Plaza de Armas de Talcahuano, Talcahuano, Provincia de Concepción, Región del Biobío, Chile',
    latitude: -36.7249,
    longitude: -73.1168,
  },
];

const CONCEPCION = { latitude: -36.827, longitude: -73.0503 };

let user: ApiUser;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('ubicacion');
  for (const event of SEED) await createEventViaApi(user, event);
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

const title = (page: Page, text: string) => page.getByRole('heading', { name: text, exact: true });
const markers = (page: Page) => page.locator('.leaflet-marker-icon');
const comuna = (page: Page) => page.getByRole('combobox', { name: 'Ciudad o comuna' });

async function openIsolated(page: Page) {
  await stubExternalServices(page);
  await signIn(page, user, '/events');
  await page.getByLabel('Buscar').fill(TOKEN);
  await expect(title(page, CENTRO)).toBeVisible();
  await expect(title(page, PUERTO)).toBeVisible();
  await expect(markers(page)).toHaveCount(2);
}

async function expectOnly(page: Page, visible: string) {
  const other = visible === CENTRO ? PUERTO : CENTRO;
  await expect(title(page, visible)).toBeVisible();
  await expect(title(page, other)).toHaveCount(0);
  await expect(markers(page)).toHaveCount(1);
}

test.describe('Filtro de ubicación: la comuna exacta, no la provincia ni la región', () => {
  test('"Concepción" deja solo el evento de esa comuna, no el de Talcahuano de su misma provincia', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Concepción');

    await expectOnly(page, CENTRO);
  });

  test('"Talcahuano" deja solo el evento de Talcahuano', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Talcahuano');

    await expectOnly(page, PUERTO);
  });

  test('elegir la comuna en la lista del combo aplica la misma regla', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('concepcion');
    await page.getByRole('option', { name: /^Concepción/ }).click();

    await expect(comuna(page)).toHaveValue('Concepción');
    await expectOnly(page, CENTRO);
  });

  test('sin distinguir mayúsculas ni tildes', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('CONCEPCION');

    await expectOnly(page, CENTRO);
  });

  test('cambiar de una comuna a la otra cambia el resultado', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Concepción');
    await expectOnly(page, CENTRO);

    await comuna(page).fill('Talcahuano');
    await expectOnly(page, PUERTO);
  });

  test('un texto libre que no es una comuna sigue buscando por subcadena: la provincia trae ambos', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Provincia de Concepción');

    await expect(title(page, CENTRO)).toBeVisible();
    await expect(title(page, PUERTO)).toBeVisible();
    await expect(markers(page)).toHaveCount(2);
  });

  test('la región también se busca como texto libre y trae ambos', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Biobío');

    await expect(title(page, CENTRO)).toBeVisible();
    await expect(title(page, PUERTO)).toBeVisible();
  });

  test('el filtro de texto ("Buscar") no cambia: sigue buscando en toda la dirección', async ({ page }) => {
    await openIsolated(page);

    await page.getByLabel('Buscar').fill(`${TOKEN} Provincia de Concepción`);
    // ningún título lleva ese texto, pero sí la dirección de ambos eventos
    await expect(title(page, CENTRO)).toHaveCount(0);
    await expect(title(page, PUERTO)).toHaveCount(0);

    await page.getByLabel('Buscar').fill('Provincia de Concepción');
    await expect(title(page, CENTRO)).toBeVisible();
    await expect(title(page, PUERTO)).toBeVisible();
  });
});

test.describe('"Cerca de mí" aplica la misma regla', () => {
  test.use({ permissions: ['geolocation'], geolocation: CONCEPCION });

  test('en Concepción trae solo el evento de la comuna de Concepción', async ({ page }) => {
    await openIsolated(page);

    await page.getByRole('button', { name: /Cerca de mí/ }).click();

    await expect(page.getByRole('status')).toHaveText('Comuna más cercana: Concepción');
    await expectOnly(page, CENTRO);
  });
});
