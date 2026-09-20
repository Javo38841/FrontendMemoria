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

// Token único por corrida: aísla los 3 eventos sembrados del resto de la base.
// Todas las aserciones apuntan a estos eventos, nunca al total ni al contador global.
const STAMP = Date.now();
const TOKEN = `[E2E] ${STAMP}`;
const ALFA = `${TOKEN} Alfa`;
const BETA = `${TOKEN} Beta`;
const GAMMA = `${TOKEN} Gamma`;

// Tres comunas distintas, cuyo nombre no coincide con el de su provincia ni región,
// y fechas lejanas (2031) para que ningún atajo de fecha ("Hoy", "Esta semana") las incluya.
const SEED = [
  {
    title: ALFA,
    description: `Descripción E2E ${STAMP} con jazz en vivo`,
    date: '2031-03-10',
    location: 'Plaza de Armas, Providencia, Provincia de Santiago, Región Metropolitana de Santiago, Chile',
    latitude: -33.4257,
    longitude: -70.6108,
  },
  {
    title: BETA,
    description: `Descripción E2E ${STAMP} con rock nacional`,
    date: '2031-03-20',
    location: 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile',
    latitude: -36.827,
    longitude: -73.0503,
  },
  {
    title: GAMMA,
    description: `Descripción E2E ${STAMP} con cumbia porteña`,
    date: '2031-04-05',
    location: 'Plaza Vergara, Viña del Mar, Provincia de Valparaíso, Región de Valparaíso, Chile',
    latitude: -33.0245,
    longitude: -71.5518,
  },
];

const CONCEPCION = { latitude: -36.827, longitude: -73.0503 };
const VINA_DEL_MAR = { latitude: -33.0245, longitude: -71.5518 };
const MENDOZA = { latitude: -32.8895, longitude: -68.8458 }; // Argentina

let user: ApiUser;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('filtros');
  for (const event of SEED) await createEventViaApi(user, event);
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

// --- helpers de página -----------------------------------------------------
const title = (page: Page, text: string) => page.getByRole('heading', { name: text, exact: true });
const markers = (page: Page) => page.locator('.leaflet-marker-icon');
const buscar = (page: Page) => page.getByLabel('Buscar');
const comuna = (page: Page) => page.getByRole('combobox', { name: 'Ciudad o comuna' });
const desde = (page: Page) => page.getByLabel('Desde');
const hasta = (page: Page) => page.getByLabel('Hasta');
const limpiar = (page: Page) => page.getByRole('button', { name: 'Limpiar filtros' });

// Deja a la vista solo los 3 eventos sembrados y espera a que se pinten
async function openIsolated(page: Page) {
  await stubExternalServices(page);
  await signIn(page, user, '/events');
  await buscar(page).fill(TOKEN);
  await expect(title(page, ALFA)).toBeVisible();
  await expect(markers(page)).toHaveCount(3);
}

// Afirma cuáles de MIS tres eventos se ven en la lista y cuántos marcadores quedan
async function expectMine(page: Page, visible: string[]) {
  for (const name of [ALFA, BETA, GAMMA]) {
    if (visible.includes(name)) await expect(title(page, name)).toBeVisible();
    else await expect(title(page, name)).toHaveCount(0);
  }
  await expect(markers(page)).toHaveCount(visible.length);
}

const localToday = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------------------------------------------------------------------------
test.describe('Filtro de texto', () => {
  test('el token único deja solo mis 3 eventos, en la lista y en el mapa', async ({ page }) => {
    await openIsolated(page);
    await expectMine(page, [ALFA, BETA, GAMMA]);
  });

  test('filtra por título, sin distinguir mayúsculas', async ({ page }) => {
    await openIsolated(page);

    await buscar(page).fill(`${TOKEN} BETA`);

    await expectMine(page, [BETA]);
  });

  test('filtra por descripción', async ({ page }) => {
    await openIsolated(page);

    await buscar(page).fill(`${STAMP} con jazz`);

    await expectMine(page, [ALFA]);
  });

  test('filtra por la ubicación del evento', async ({ page }) => {
    await openIsolated(page);

    await buscar(page).fill('Plaza Vergara');

    // el texto coincide con la dirección de Gamma; se comprueba solo lo mío
    await expect(title(page, GAMMA)).toBeVisible();
    await expect(title(page, ALFA)).toHaveCount(0);
    await expect(title(page, BETA)).toHaveCount(0);
  });

  test('sin coincidencias avisa y mantiene visible la barra de filtros', async ({ page }) => {
    await openIsolated(page);

    await buscar(page).fill(`${TOKEN} zzzz-sin-coincidencias`);

    await expectMine(page, []);
    await expect(page.getByText('Ningún evento coincide con los filtros.')).toBeVisible();
    await expect(buscar(page)).toBeVisible(); // la barra sigue ahí para corregir el filtro
    await expect(limpiar(page)).toBeEnabled();
  });
});

test.describe('Filtro de comuna', () => {
  test('escribir el nombre de una comuna deja solo el evento de esa comuna', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Viña del Mar');
    await expectMine(page, [GAMMA]);

    await comuna(page).fill('Concepción');
    await expectMine(page, [BETA]);

    await comuna(page).fill('Providencia');
    await expectMine(page, [ALFA]);
  });

  test('el combo sugiere comunas sin distinguir tildes y al elegir una filtra', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('vina');
    const option = page.getByRole('option', { name: /^Viña del Mar/ });
    await expect(option).toBeVisible();
    await option.click();

    await expect(comuna(page)).toHaveValue('Viña del Mar');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expectMine(page, [GAMMA]);
  });

  test('acepta texto libre que no es una comuna', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Plaza Independencia');

    await expect(page.getByText(/Sin comunas coincidentes/)).toBeVisible();
    await expectMine(page, [BETA]);
  });
});

test.describe('Filtro de fecha', () => {
  test('un rango desde-hasta deja solo los eventos dentro del rango', async ({ page }) => {
    await openIsolated(page);

    await desde(page).fill('2031-03-15');
    await hasta(page).fill('2031-03-31');

    await expectMine(page, [BETA]);
  });

  test('solo "Desde" o solo "Hasta" filtran por un lado', async ({ page }) => {
    await openIsolated(page);

    await desde(page).fill('2031-03-15');
    await expectMine(page, [BETA, GAMMA]);

    await desde(page).fill('');
    await hasta(page).fill('2031-03-15');
    await expectMine(page, [ALFA]);
  });

  test('las fechas límite son inclusivas', async ({ page }) => {
    await openIsolated(page);

    await desde(page).fill('2031-03-10');
    await hasta(page).fill('2031-03-10');
    await expectMine(page, [ALFA]);

    await desde(page).fill('2031-04-05');
    await hasta(page).fill('2031-04-05');
    await expectMine(page, [GAMMA]);
  });

  test('"Próximos" incluye mis eventos futuros y fija la fecha de hoy', async ({ page }) => {
    await openIsolated(page);

    await page.getByRole('button', { name: 'Próximos' }).click();

    await expect(desde(page)).toHaveValue(localToday());
    await expect(hasta(page)).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Próximos' })).toHaveAttribute('aria-pressed', 'true');
    await expectMine(page, [ALFA, BETA, GAMMA]);
  });

  test('"Hoy" y "Esta semana" excluyen mis eventos de 2031', async ({ page }) => {
    await openIsolated(page);

    await page.getByRole('button', { name: 'Hoy' }).click();
    await expect(desde(page)).toHaveValue(localToday());
    await expect(hasta(page)).toHaveValue(localToday());
    await expectMine(page, []);
    await expect(page.getByText('Ningún evento coincide con los filtros.')).toBeVisible();

    await page.getByRole('button', { name: 'Esta semana' }).click();
    await expect(page.getByRole('button', { name: 'Esta semana' })).toHaveAttribute('aria-pressed', 'true');
    await expectMine(page, []);
  });
});

test.describe('Filtros combinados y limpieza', () => {
  test('los filtros se combinan con AND', async ({ page }) => {
    await openIsolated(page);

    await comuna(page).fill('Concepción');
    await desde(page).fill('2031-03-01');
    await hasta(page).fill('2031-03-31');
    await expectMine(page, [BETA]);

    // misma comuna, pero un rango en el que Beta no cae: no queda ninguno de mis eventos
    await desde(page).fill('2031-04-01');
    await hasta(page).fill('2031-04-30');
    await expectMine(page, []);
  });

  test('"Limpiar filtros" restablece los campos y devuelve mis eventos a la lista y al mapa', async ({ page }) => {
    await openIsolated(page);
    await expect(limpiar(page)).toBeEnabled();

    await comuna(page).fill('Viña del Mar');
    await desde(page).fill('2031-04-01');
    await expectMine(page, [GAMMA]); // Alfa y Beta desaparecen

    await limpiar(page).click();

    await expect(buscar(page)).toHaveValue('');
    await expect(comuna(page)).toHaveValue('');
    await expect(desde(page)).toHaveValue('');
    await expect(hasta(page)).toHaveValue('');
    await expect(limpiar(page)).toBeDisabled();

    // sin filtros, mis tres eventos vuelven (junto con el resto de la base, que no se cuenta)
    for (const name of [ALFA, BETA, GAMMA]) await expect(title(page, name)).toBeVisible();
    await expect.poll(() => markers(page).count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe('"Cerca de mí" con la geolocalización de Playwright', () => {
  test.use({ permissions: ['geolocation'], geolocation: CONCEPCION });

  test('con la ubicación en Concepción selecciona la comuna y filtra por ella', async ({ page }) => {
    await openIsolated(page);

    await page.getByRole('button', { name: /Cerca de mí/ }).click();

    await expect(page.getByRole('status')).toHaveText('Comuna más cercana: Concepción');
    await expect(comuna(page)).toHaveValue('Concepción');
    await expectMine(page, [BETA]);
  });

  test('si la ubicación cambia, elige otra comuna', async ({ page, context }) => {
    await openIsolated(page);

    await context.setGeolocation(VINA_DEL_MAR);
    await page.getByRole('button', { name: /Cerca de mí/ }).click();

    await expect(page.getByRole('status')).toHaveText('Comuna más cercana: Viña del Mar');
    await expect(comuna(page)).toHaveValue('Viña del Mar');
    await expectMine(page, [GAMMA]);
  });

  test('fuera de Chile avisa y no cambia el filtro', async ({ page, context }) => {
    await openIsolated(page);

    await context.setGeolocation(MENDOZA);
    await page.getByRole('button', { name: /Cerca de mí/ }).click();

    await expect(page.getByRole('alert')).toHaveText('No encontré una comuna cerca de tu ubicación. ¿Estás fuera de Chile?');
    await expect(comuna(page)).toHaveValue('');
    await expectMine(page, [ALFA, BETA, GAMMA]);
  });
});

test.describe('"Cerca de mí" sin permiso de ubicación', () => {
  test.use({ permissions: [] });

  test('muestra el mensaje de permiso denegado y no cambia el filtro', async ({ page }) => {
    await openIsolated(page);

    await page.getByRole('button', { name: /Cerca de mí/ }).click();

    await expect(page.getByRole('alert')).toContainText('Permiso de ubicación denegado');
    await expect(comuna(page)).toHaveValue('');
    await expectMine(page, [ALFA, BETA, GAMMA]);
  });
});
