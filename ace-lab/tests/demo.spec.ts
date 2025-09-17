import { test, expect } from '@playwright/test';

test('demo: generate → send to canvas → motion → export', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Generate (WebGPU)' }).click();
    await page.getByRole('button', { name: 'Use demo model' }).click();
    await page.getByPlaceholder('Model URL (.onnx)').isVisible();
    await page.getByPlaceholder('Prompt').fill('neon skyline');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.locator('img[alt="thumb"]')).toBeVisible();
    await page.getByRole('button', { name: 'Send to Canvas' }).click();

    await page.getByRole('button', { name: 'Motion' }).click();
    await expect(page.getByRole('button', { name: 'Animate' })).toBeVisible();
    const [dl] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export video' }).click()
    ]);
    const name = dl.suggestedFilename();
    expect(name.endsWith('.webm')).toBeTruthy();
});


