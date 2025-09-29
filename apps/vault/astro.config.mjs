// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: vercel(),
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
						{ label: 'Welcome to the Nimble Vault', slug: 'index' },
					],
				},
				{
					label: '🌍 Public Content',
					collapsed: false,
					autogenerate: { directory: 'public' },
				},
				{
					label: '🔒 Patron Content',
					collapsed: true,
					autogenerate: { directory: 'patreon' },
				},
			],
		}),
		mdx(),
	],
});
