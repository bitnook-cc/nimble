// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Nimble RPG Vault',
			description: 'Complete documentation and reference for the Nimble RPG system',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }
			],
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: '📖 Getting Started',
					items: [
						{ label: 'Welcome to Nimble', slug: 'index' },
					],
				},
				{
					label: '⚔️ Heroes',
					collapsed: true,
					autogenerate: { directory: 'Heroes' },
				},
				{
					label: '✨ Magic',
					collapsed: true,
					autogenerate: { directory: 'Magic' },
				},
				{
					label: '🛡️ Items & Equipment',
					collapsed: true,
					autogenerate: { directory: 'Items' },
				},
				{
					label: '👹 Foes & Monsters',
					collapsed: true,
					autogenerate: { directory: 'Foes' },
				},
				{
					label: '⚙️ Game System',
					collapsed: true,
					autogenerate: { directory: 'System' },
				},
				{
					label: '🏠 Homebrew Content',
					collapsed: true,
					autogenerate: { directory: 'Homebrew (Optional)' },
				},
			],
		}),
	],
});
