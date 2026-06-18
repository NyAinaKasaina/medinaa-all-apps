import { test, expect } from '@playwright/test';

for (const locale of ['fr', 'mg', 'en']) {
  test(`charge /${locale} sans erreur console`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/${locale}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('le CTA app web pointe vers le bon domaine', async ({ page }) => {
  await page.goto('/fr');
  const cta = page.getByRole('link', { name: /app web/i }).first();
  await expect(cta).toHaveAttribute('href', /medinaa\.mg|app\./);
});
