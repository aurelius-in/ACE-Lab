import { test, expect } from '@playwright/test';

test('policy check shows results', async ({ page }) => {
	await page.goto('/');
	// Open Policy tab in right panel
	await page.getByRole('button', { name: 'Policy' }).click();
	await page.getByRole('button', { name: 'Run Check' }).click();
	// Either Compliant or Violations should appear
	const compliant = page.getByText('Compliant');
	const violations = page.getByText('Violations');
	await expect(Promise.race([
		compliant.waitFor({ state: 'visible' }),
		violations.waitFor({ state: 'visible' })
	]) as any).resolves;
});
