import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	retries: 0,
	use: { baseURL: 'http://localhost:5173' },
	webServer: {
		command: 'vite --port 5173 --strictPort',
		port: 5173,
		reuseExistingServer: true,
		stdout: 'ignore',
		stderr: 'pipe'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
});
