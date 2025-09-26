// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Nimble RPG Vault',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }
			],
			sidebar: [
				{
					label: 'Welcome',
					items: [
						{ label: 'Introduction', slug: 'index' },
					],
				},
				{
					label: 'Heroes',
					autogenerate: { directory: 'Heroes' },
				},
				{
					label: 'Magic',
					autogenerate: { directory: 'Magic' },
				},
				{
					label: 'Items',
					autogenerate: { directory: 'Items' },
				},
				{
					label: 'Foes',
					autogenerate: { directory: 'Foes' },
				},
				{
					label: 'System',
					autogenerate: { directory: 'System' },
				},
				{
					label: 'Homebrew (Optional)',
					autogenerate: { directory: 'Homebrew (Optional)' },
				},
			],
		}),
	],
});
