import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	retries: 0,
	use: { baseURL: 'http://localhost:5173' },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
});
