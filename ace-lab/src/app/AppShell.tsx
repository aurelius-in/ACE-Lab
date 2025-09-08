import { PropsWithChildren, useState } from 'react';
import { clsx } from 'clsx';

const tabs = ['Lab', 'Agents', 'Library'] as const;
type TabKey = typeof tabs[number];

export function AppShell({ children }: PropsWithChildren) {
	const [active, setActive] = useState<TabKey>('Lab');

	return (
		<div className="min-h-screen text-[var(--ink-100)] bg-[var(--ink-950)]">
			<header className="sticky top-0 z-10 backdrop-blur-sm">
				<div className="container mx-auto flex items-center justify-between py-4">
					<div className="relative flex items-center gap-3">
						<div className="relative">
							<div className="ace-glow absolute inset-0" />
							<div className="w-9 h-9 rounded-2xl border border-white/10 grid place-items-center">
								<BeakerIcon />
							</div>
						</div>
						<h1 className="text-xl font-bold ace-gradient-text">ACE Lab</h1>
					</div>
					<nav className="flex items-center gap-2">
						{tabs.map(t => (
							<button key={t} className={clsx('px-3 py-1.5 rounded-2xl border border-white/10 text-sm', active===t ? 'ace-gradient-text' : 'text-white/70 hover:text-white')} onClick={() => setActive(t)}>
								{t}
							</button>
						))}
					</nav>
					<div className="flex items-center gap-2">
						<button className="btn-primary">Export</button>
						<button className="btn-primary">Record 3s</button>
						<button className="btn-primary">Record 6s</button>
					</div>
				</div>
			</header>
			<main className="container mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
				<section className="lg:col-span-8 relative card-dark p-2">
					{children}
				</section>
				<aside className="lg:col-span-4 card-dark p-4">Right panel</aside>
			</main>
		</div>
	);
}

function BeakerIcon() {
	return (
		<svg viewBox="0 0 24 24" className="w-6 h-6">
			<defs>
				<linearGradient id="ace-g" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="var(--ace-g1)" />
					<stop offset="50%" stopColor="var(--ace-g2)" />
					<stop offset="100%" stopColor="var(--ace-g3)" />
				</linearGradient>
			</defs>
			<path d="M8 2h8v2l-1 2v6.5l3.47 5.78A2 2 0 0 1 16.72 22H7.28a2 2 0 0 1-1.75-3.72L9 12.5V6L8 4z" fill="none" stroke="url(#ace-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export default AppShell;


