import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        name: 'Form Safe',
        description: 'A second chance before you leave an unfinished form. Warns on page unload after a form edit.',
        version: '1.0.0',
        permissions: [],
        icons: {
            16: "/icon-16.png",
            32: "/icon-32.png",
            48: "/icon-48.png",
            128: "/icon-128.png",
            256: "/icon-256.png",
            512: "/icon-512.png",
        },
    },
});
