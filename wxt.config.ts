import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        name: 'form-safe',
        description: 'Prevents accidental tab/window close when filling out forms.',
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
