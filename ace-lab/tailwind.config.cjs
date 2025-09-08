/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '1rem',
		},
		extend: {
			colors: {
				'ink-950': 'var(--ink-950)',
				'ink-900': 'var(--ink-900)',
				'ink-100': 'var(--ink-100)',
				white: 'var(--white)',
				'ace-g1': 'var(--ace-g1)',
				'ace-g2': 'var(--ace-g2)',
				'ace-g3': 'var(--ace-g3)',
			},
			dropShadow: {
				'ace-soft': '0 8px 24px rgba(0,0,0,0.35)',
			},
		},
	},
	plugins: [],
};


