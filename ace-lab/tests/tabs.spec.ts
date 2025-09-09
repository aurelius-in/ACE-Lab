import { test, expect } from '@playwright/test';

test('switch tabs and open keyboard overlay', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('ACE Lab')).toBeVisible();
	await page.getByRole('tab', { name: 'Agents' }).click();
	await expect(page.getByText('Architect proposals')).toBeVisible();
	await page.keyboard.press('h');
	await expect(page.getByLabel('Keyboard shortcuts overlay')).toBeVisible();
});
