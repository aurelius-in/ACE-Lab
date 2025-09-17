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

test('open Generate panel and create thumbnail', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Generate (WebGPU)' }).click();
    await page.getByPlaceholder('Prompt').fill('neon skyline');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.locator('img[alt="thumb"]')).toBeVisible();
});

test('open Motion panel and see controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Motion' }).click();
    await expect(page.getByRole('button', { name: 'Animate' })).toBeVisible();
});

test('open Style Transfer panel and see controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Style Transfer' }).click();
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();
});

test('open Generative Fill panel and see controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Generative Fill' }).click();
    await expect(page.getByRole('button', { name: 'Select Area' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fill', exact: true })).toBeVisible();
});

test('export flow after generate', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Generate (WebGPU)' }).click();
    await page.getByRole('button', { name: 'Use demo model' }).click();
    await page.getByPlaceholder('Prompt').fill('retro neon skyline');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.locator('img[alt="thumb"]')).toBeVisible();
    await page.getByRole('button', { name: 'Send to Canvas' }).click();
    const [dl] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export video' }).click()
    ]);
    const name = dl.suggestedFilename();
    expect(name.endsWith('.webm')).toBeTruthy();
});