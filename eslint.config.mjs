import js from '@eslint/js';
import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		plugins: {
			'@n8n/community-nodes': n8nCommunityNodesPlugin,
		},
		rules: {
			'@n8n/community-nodes/node-usable-as-tool': 'warn',
			'@n8n/community-nodes/no-http-request-with-manual-auth': 'off',
		},
	},
);
