import { test, expect } from '@playwright/test';

test('load app and open settings', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('ACE Lab')).toBeVisible();
	// open Presets tab
	await page.getByRole('button', { name: 'Presets' }).click();
	await expect(page.getByText('Your Presets')).toBeVisible();
	// open Settings in right panel
	await page.getByRole('button', { name: 'Settings' }).click();
	await expect(page.getByText('Settings')).toBeVisible();
});
