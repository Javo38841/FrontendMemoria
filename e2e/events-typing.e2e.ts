import { test, expect, type Page } from '@playwright/test';
import {
  REVERSE_GEOCODE_ADDRESS,
  assertBackendAvailable,
  cleanupUser,
  createEventViaApi,
  createUserViaApi,
  deleteAllMyEvents,
  handleDialogs,
  myEventsViaApi,
  signIn,
  stubExternalServices,
  type ApiUser,
} from './support';

// Estas pruebas TECLEAN con pressSequentially (tecla por tecla, como un usuario) en vez de fill():
// fill() pone el valor completo de una vez y no reproduce lo que pasa en cada pulsación, que es
// donde el formulario recortaba y codificaba el texto ("Noche de jazz" quedaba "Nochedejazz").
const STAMP = Date.now();

// Espacios, guion, apóstrofe y barra
const TITLE = `[E2E] ${STAMP} Noche de jazz - Rock's AC/DC`;
// Espacios, comillas, apóstrofe, barra, & y etiquetas HTML escritas como texto
const DESCRIPTION = `Noche con "invitados" y <b>negrita</b> en AC/DC, Rock's & más`;

let user: ApiUser;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('tecleo');
});

// cada test parte sin eventos previos del usuario
test.afterEach(async () => {
  if (user) await deleteAllMyEvents(user);
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

const field = (page: Page, name: string) => page.locator(`[name="${name}"]`);

async function openCreateForm(page: Page) {
  await stubExternalServices(page);
  await signIn(page, user, '/events/create');
  await expect(page.getByRole('heading', { name: 'Crear Nuevo Evento' })).toBeVisible();
}

// Ubicación con un clic en el mapa (la dirección la devuelve el geocodificador simulado)
async function pickLocation(page: Page) {
  await page.locator('.leaflet-container').click({ position: { x: 80, y: 90 } });
  await expect(page.getByPlaceholder(/Busca una dirección/)).toHaveValue(REVERSE_GEOCODE_ADDRESS);
}

test.describe('Escribir en el formulario de creación con el teclado', () => {
  test('el título y la descripción tecleados se conservan tal cual en el campo', async ({ page }) => {
    await openCreateForm(page);

    await field(page, 'title').pressSequentially(TITLE);
    await field(page, 'description').pressSequentially(DESCRIPTION);

    await expect(field(page, 'title')).toHaveValue(TITLE);
    await expect(field(page, 'description')).toHaveValue(DESCRIPTION);
    // los contadores cuentan lo tecleado, no una versión codificada
    await expect(page.getByText(`${TITLE.length}/100 caracteres`)).toBeVisible();
    await expect(page.getByText(`${DESCRIPTION.length}/500 caracteres`)).toBeVisible();
  });

  test('crea el evento: el backend guarda título y descripción idénticos a lo tecleado y la tarjeta los muestra bien', async ({ page }) => {
    const dialogs = handleDialogs(page);
    await openCreateForm(page);

    await field(page, 'title').pressSequentially(TITLE);
    await field(page, 'description').pressSequentially(DESCRIPTION);
    await pickLocation(page);
    await field(page, 'date').fill('2031-06-15');
    await page.getByRole('button', { name: 'Crear Evento' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toEqual([{ type: 'alert', message: 'Evento creado exitosamente!' }]);

    // en el backend: idénticos a lo tecleado, sin entidades HTML ni espacios perdidos
    const saved = (await myEventsViaApi(user)).filter((e) => e.title === TITLE);
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe(TITLE);
    expect(saved[0].description).toBe(DESCRIPTION);
    expect(saved[0].title).not.toMatch(/&#x|&lt;|&gt;|&quot;/);
    expect(saved[0].description).not.toMatch(/&#x|&lt;|&gt;|&quot;/);

    // en la tarjeta: el texto tal cual, y las etiquetas tecleadas se ven como texto (React escapa)
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();
    await expect(page.getByText(DESCRIPTION, { exact: true })).toBeVisible();
    await expect(page.locator('b')).toHaveCount(0); // "<b>negrita</b>" no se interpretó como HTML
  });

  test('el popup del marcador y la pantalla de detalle también lo muestran bien', async ({ page }) => {
    await createEventViaApi(user, {
      title: TITLE,
      description: DESCRIPTION,
      date: '2031-06-15',
      location: 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile',
      latitude: -36.827,
      longitude: -73.0503,
    });
    await stubExternalServices(page);
    await signIn(page, user, '/events');
    await page.getByLabel('Buscar').fill(TITLE);

    await page.locator('.leaflet-marker-icon').click();
    await expect(page.locator('.leaflet-popup').getByRole('heading', { name: TITLE })).toBeVisible();

    await page.locator('.leaflet-popup').getByRole('button', { name: 'Ver Detalles' }).click();
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expect(page.getByText(DESCRIPTION, { exact: true })).toBeVisible();
    await expect(page.locator('b')).toHaveCount(0);
  });

  test('los espacios al inicio y al final se conservan mientras se escribe y se recortan solo al enviar', async ({ page }) => {
    const dialogs = handleDialogs(page);
    const typed = `  [E2E] ${STAMP} espacios en los bordes  `;
    await openCreateForm(page);

    await field(page, 'title').pressSequentially(typed);
    await expect(field(page, 'title')).toHaveValue(typed); // no se recorta al teclear

    await field(page, 'description').pressSequentially('Descripción con espacios en los bordes');
    await pickLocation(page);
    await field(page, 'date').fill('2031-06-15');
    await page.getByRole('button', { name: 'Crear Evento' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toHaveLength(1);
    expect((await myEventsViaApi(user)).map((e) => e.title)).toEqual([typed.trim()]);
  });
});

test.describe('Editar un evento con texto especial', () => {
  test('el formulario precarga el título y la descripción tal cual, y al seguir tecleando no se codifican', async ({ page }) => {
    const dialogs = handleDialogs(page);
    await createEventViaApi(user, {
      title: TITLE,
      description: DESCRIPTION,
      date: '2031-06-15',
      location: 'Plaza Independencia, Concepción, Provincia de Concepción, Región del Biobío, Chile',
      latitude: -36.827,
      longitude: -73.0503,
      startTime: undefined,
      endTime: undefined,
    });
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');

    await page.getByRole('button', { name: /Editar/ }).click();
    await expect(field(page, 'title')).toHaveValue(TITLE);
    await expect(field(page, 'description')).toHaveValue(DESCRIPTION);

    // se agrega texto al final, tecleando
    await field(page, 'title').press('End');
    await field(page, 'title').pressSequentially(" & Cía/2");
    await page.getByRole('button', { name: 'Actualizar Evento' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toEqual([{ type: 'alert', message: 'Evento actualizado exitosamente!' }]);
    const saved = await myEventsViaApi(user);
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe(`${TITLE} & Cía/2`);
    expect(saved[0].description).toBe(DESCRIPTION);
  });
});
