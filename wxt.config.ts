import { defineConfig } from 'wxt';

export default defineConfig({
    zip: {
        includeSources: [
            'entrypoints/**', 'public/**', 'scripts/*.mjs',
            'package.json', 'bun.lock', 'tsconfig.json', 'wxt.config.ts',
            'README.md', 'RELEASING.md', 'PRIVACY.md', 'LICENSE', 'CHANGELOG.md',
        ],
        excludeSources: ['release/**', '**/*.pem', '**/*.key', '**/.env', '**/.env.*'],
    },
    manifest: ({ browser }) => ({
        name: 'Form Safe',
        description: 'A second chance before you leave an unfinished form. Warns on page unload after a form edit.',
        permissions: [],
        ...(browser === 'firefox' ? {
            browser_specific_settings: {
                gecko: {
                    id: 'form-safe@mikr13.com',
                    data_collection_permissions: { required: ['none'] },
                },
            },
        } : {}),
        icons: {
            16: "/icon-16.png",
            32: "/icon-32.png",
            48: "/icon-48.png",
            128: "/icon-128.png",
            256: "/icon-256.png",
            512: "/icon-512.png",
        },
    }),
});
