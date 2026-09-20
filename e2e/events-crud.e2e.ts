import { test, expect, type Page } from '@playwright/test';
import {
  API_URL,
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

// Todo lo que se asierta apunta a eventos con este título (único por corrida)
const STAMP = Date.now();
const titleOf = (label: string) => `[E2E] ${STAMP} ${label}`;
const DEFAULT_CENTER = { lat: -36.8261, lng: -73.0493 }; // centro inicial del formulario

let user: ApiUser;

test.beforeAll(async () => {
  await assertBackendAvailable();
  user = await createUserViaApi('crud');
});

// cada test parte sin eventos previos del usuario
test.afterEach(async () => {
  if (user) await deleteAllMyEvents(user);
});

test.afterAll(async () => {
  if (user) await cleanupUser(user);
});

const field = (page: Page, name: string) => page.locator(`[name="${name}"]`);

// Las peticiones POST que el navegador dirige al backend
function watchBackendPosts(page: Page): string[] {
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().startsWith(API_URL)) posts.push(request.url());
  });
  return posts;
}

async function openCreateForm(page: Page) {
  await stubExternalServices(page);
  await signIn(page, user, '/events/create');
  await expect(page.getByRole('heading', { name: 'Crear Nuevo Evento' })).toBeVisible();
}

test.describe('Formulario de creación: validación', () => {
  test('un formulario vacío no se envía (validación nativa del navegador)', async ({ page }) => {
    const posts = watchBackendPosts(page);
    await openCreateForm(page);

    await page.getByRole('button', { name: 'Crear Evento' }).click();

    // los campos obligatorios vacíos bloquean el envío antes de que la app lo procese
    expect(await field(page, 'title').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/events\/create$/);
    expect(posts).toEqual([]);
  });

  // Hoy este test FALLA: al hacer mousedown en "Crear Evento", el campo "Hora Fin" pierde el foco,
  // su error de horario aparece y desplaza el botón ~23 px hacia abajo; el mouseup cae fuera y
  // el clic se pierde (el evento submit nunca se dispara). Ver informe.
  test('datos inválidos muestran los errores de la app y no envían ninguna petición POST', async ({ page }) => {
    const posts = watchBackendPosts(page);
    await openCreateForm(page);

    await field(page, 'title').fill('ab');
    await field(page, 'description').fill('corta');
    await field(page, 'date').fill('2031-05-05');
    await field(page, 'startTime').fill('22:00');
    await field(page, 'endTime').fill('20:00');
    await page.getByRole('button', { name: 'Crear Evento' }).click();

    await expect(page.getByText('El título debe tener al menos 3 caracteres')).toBeVisible();
    await expect(page.getByText('La descripción debe tener al menos 10 caracteres')).toBeVisible();
    await expect(page.getByText('La ubicación debe tener al menos 3 caracteres')).toBeVisible();
    await expect(page.getByText('La hora de fin debe ser posterior a la hora de inicio')).toBeVisible();

    await expect(page).toHaveURL(/\/events\/create$/);
    expect(posts).toEqual([]);
  });

  test('sin horario, los datos inválidos muestran los errores de la app y no envían ninguna petición POST', async ({ page }) => {
    const posts = watchBackendPosts(page);
    await openCreateForm(page);

    await field(page, 'title').fill('ab');
    await field(page, 'description').fill('corta');
    await field(page, 'date').fill('2031-05-05');
    await page.getByRole('button', { name: 'Crear Evento' }).click();

    await expect(page.getByText('El título debe tener al menos 3 caracteres')).toBeVisible();
    await expect(page.getByText('La descripción debe tener al menos 10 caracteres')).toBeVisible();
    await expect(page.getByText('La ubicación debe tener al menos 3 caracteres')).toBeVisible();

    await expect(page).toHaveURL(/\/events\/create$/);
    expect(posts).toEqual([]);
  });

  test('con el error de horario ya visible, un clic en "Crear Evento" valida y no envía nada', async ({ page }) => {
    const posts = watchBackendPosts(page);
    await openCreateForm(page);

    await field(page, 'title').fill('Título válido');
    await field(page, 'description').fill('Descripción suficientemente larga');
    await field(page, 'date').fill('2031-05-05');
    await field(page, 'startTime').fill('22:00');
    await field(page, 'endTime').fill('20:00');
    // se quita el foco antes: así el error de horario ya está en pantalla y el botón no se mueve
    await field(page, 'endTime').blur();
    await expect(page.getByText('La hora de fin debe ser posterior a la hora de inicio')).toBeVisible();

    await page.getByRole('button', { name: 'Crear Evento' }).click();

    await expect(page.getByText('La ubicación debe tener al menos 3 caracteres')).toBeVisible();
    await expect(page).toHaveURL(/\/events\/create$/);
    expect(posts).toEqual([]);
  });
});

// Datos de un evento tal como los guarda la app: con horas, que el backend devuelve como HH:mm:ss
const ubicacion = { location: 'Plaza Independencia, Concepción, Chile', latitude: -36.827, longitude: -73.0503 };

test.describe('Crear un evento', () => {
  test('crea un evento eligiendo la ubicación con un clic en el mapa', async ({ page }) => {
    const TITLE = titleOf('crear');
    const dialogs = handleDialogs(page);
    const { reverseRequests } = await stubExternalServices(page);
    await signIn(page, user, '/events/create');

    await field(page, 'title').fill(TITLE);
    await field(page, 'description').fill('Evento creado por la prueba E2E de creación');

    // ubicación: clic en el mapa (no se usa la búsqueda de direcciones)
    await page.locator('.leaflet-container').click({ position: { x: 80, y: 90 } });
    await expect(page.getByPlaceholder(/Busca una dirección/)).toHaveValue(REVERSE_GEOCODE_ADDRESS);
    expect(reverseRequests).toHaveLength(1);

    await field(page, 'date').fill('2031-06-15');
    await field(page, 'startTime').fill('20:00');
    await field(page, 'endTime').fill('22:00');

    const request = page.waitForRequest(
      (r) => r.method() === 'POST' && r.url().startsWith(`${API_URL}/events`)
    );
    await page.getByRole('button', { name: 'Crear Evento' }).click();
    const sent = (await request).postDataJSON();

    // el formulario envía lo escrito y las coordenadas del clic (no las iniciales)
    expect(sent).toMatchObject({ title: TITLE, date: '2031-06-15', location: REVERSE_GEOCODE_ADDRESS });
    expect(sent.latitude).not.toBe(DEFAULT_CENTER.lat);
    expect(sent.longitude).not.toBe(DEFAULT_CENTER.lng);
    expect(Math.abs(sent.latitude - DEFAULT_CENTER.lat)).toBeLessThan(0.05);
    expect(Math.abs(sent.longitude - DEFAULT_CENTER.lng)).toBeLessThan(0.05);
    // la dirección se pidió al geocodificador con las mismas coordenadas del clic
    expect(reverseRequests[0]).toContain(`lat=${sent.latitude}`);
    expect(reverseRequests[0]).toContain(`lon=${sent.longitude}`);

    // la app avisa y lleva a "Mis eventos", donde aparece el evento
    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toEqual([{ type: 'alert', message: 'Evento creado exitosamente!' }]);
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();

    // quedó guardado en el backend
    const saved = (await myEventsViaApi(user)).filter((e) => e.title === TITLE);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      description: 'Evento creado por la prueba E2E de creación',
      date: '2031-06-15',
      location: REVERSE_GEOCODE_ADDRESS,
      userId: user.id,
    });
    expect(saved[0].latitude).toBe(sent.latitude);
    expect(saved[0].longitude).toBe(sent.longitude);

    // y en /events aparece como tarjeta y como marcador (se aísla con su título único)
    await page.goto('/events');
    await page.getByLabel('Buscar').fill(TITLE);
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  });
});

test.describe('Marcador del mapa', () => {
  test('el marcador del evento abre un popup con su título, dirección y "Ver Detalles"', async ({ page }) => {
    const TITLE = titleOf('marcador');
    await createEventViaApi(user, { title: TITLE, date: '2031-06-15', ...ubicacion });
    await stubExternalServices(page);
    await signIn(page, user, '/events');
    await page.getByLabel('Buscar').fill(TITLE);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
    await page.locator('.leaflet-marker-icon').click();

    const popup = page.locator('.leaflet-popup');
    await expect(popup.getByRole('heading', { name: TITLE })).toBeVisible();
    await expect(popup.getByText(ubicacion.location)).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Ver Detalles' })).toBeVisible();
  });
});

test.describe('Editar un evento', () => {
  test('edita un evento sin horas y el cambio se ve en "Mis eventos" y en el backend', async ({ page }) => {
    const TITLE = titleOf('editar sin horas');
    const EDITED = `${TITLE} EDITADO`;
    await createEventViaApi(user, {
      title: TITLE, date: '2031-06-15', ...ubicacion, startTime: undefined, endTime: undefined,
    });
    const dialogs = handleDialogs(page);
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');

    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Editar/ }).click();

    // el formulario de edición llega con los datos actuales
    await expect(page.getByRole('heading', { name: 'Editar Evento' })).toBeVisible();
    await expect(field(page, 'title')).toHaveValue(TITLE);
    await expect(field(page, 'date')).toHaveValue('2031-06-15');

    await field(page, 'title').fill(EDITED);
    await field(page, 'description').fill('Descripción modificada por la prueba E2E');
    await page.getByRole('button', { name: 'Actualizar Evento' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toEqual([{ type: 'alert', message: 'Evento actualizado exitosamente!' }]);
    await expect(page.getByRole('heading', { name: EDITED, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toHaveCount(0);

    const mine = await myEventsViaApi(user);
    expect(mine.find((e) => e.title === EDITED)?.description).toBe('Descripción modificada por la prueba E2E');
    expect(mine.some((e) => e.title === TITLE)).toBe(false);
  });

  // Los eventos creados desde la app llevan horas y el backend las devuelve como HH:mm:ss.
  // Hoy este test FALLA: el formulario las precarga tal cual y validateTime solo acepta HH:mm,
  // así que no deja guardar hasta reescribir las horas (ver informe).
  test('edita un evento con horas sin tener que reescribirlas', async ({ page }) => {
    const TITLE = titleOf('editar con horas');
    const EDITED = `${TITLE} EDITADO`;
    await createEventViaApi(user, { title: TITLE, date: '2031-06-15', ...ubicacion });
    const dialogs = handleDialogs(page);
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');

    await page.getByRole('button', { name: /Editar/ }).click();
    await field(page, 'title').fill(EDITED);
    await page.getByRole('button', { name: 'Actualizar Evento' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    expect(dialogs).toEqual([{ type: 'alert', message: 'Evento actualizado exitosamente!' }]);
    await expect(page.getByRole('heading', { name: EDITED, exact: true })).toBeVisible();
    expect((await myEventsViaApi(user)).some((e) => e.title === EDITED)).toBe(true);
  });
});

test.describe('Eliminar un evento', () => {
  test('cancelar la confirmación no elimina el evento', async ({ page }) => {
    const TITLE = titleOf('cancelar borrado');
    await createEventViaApi(user, { title: TITLE, date: '2031-06-15', ...ubicacion });
    const dialogs = handleDialogs(page, 'dismiss');
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');

    await page.getByRole('button', { name: /Eliminar/ }).click();

    await expect.poll(() => dialogs.length).toBe(1);
    expect(dialogs[0]).toEqual({ type: 'confirm', message: '¿Estás seguro de eliminar este evento?' });
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();
    expect((await myEventsViaApi(user)).some((e) => e.title === TITLE)).toBe(true);
  });

  test('elimina el evento al confirmar: desaparece de la lista y del backend', async ({ page }) => {
    const TITLE = titleOf('borrar');
    await createEventViaApi(user, { title: TITLE, date: '2031-06-15', ...ubicacion });
    const dialogs = handleDialogs(page, 'accept');
    await stubExternalServices(page);
    await signIn(page, user, '/my-events');
    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Eliminar/ }).click();

    await expect(page.getByRole('heading', { name: TITLE, exact: true })).toHaveCount(0);
    // la tarjeta se quita del DOM antes de que la app lance el alert de éxito
    await expect.poll(() => dialogs.length).toBe(2);
    expect(dialogs).toEqual([
      { type: 'confirm', message: '¿Estás seguro de eliminar este evento?' },
      { type: 'alert', message: 'Evento eliminado exitosamente' },
    ]);
    expect((await myEventsViaApi(user)).some((e) => e.title === TITLE)).toBe(false);
    await expect(page.getByText('Aún no has creado ningún evento.')).toBeVisible();
  });
});
