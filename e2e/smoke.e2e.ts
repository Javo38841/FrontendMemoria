import { test, expect } from '@playwright/test';

test.describe('Rutas protegidas sin sesión', () => {
  for (const ruta of ['/events', '/my-events', '/events/create']) {
    test(`${ruta} redirige a /login`, async ({ page }) => {
      await page.goto(ruta);

      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
      await expect(page.getByLabel('Username')).toBeVisible();
    });
  }
});
