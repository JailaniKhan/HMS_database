import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
      laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      refresh: true,
    }),
    react({
      babel: {
        plugins: [
          // Only run React Compiler in production for stability
          ...(process.env.NODE_ENV === 'production' ? [['babel-plugin-react-compiler', {}]] : []),
        ],
      },
    }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: {
            host: '192.168.43.189',
            port: 5173,
            overlay: true,
            timeout: 30000,
        },
        cors: true, // Enable CORS for all origins
        origin: 'http://192.168.43.189:5173', // Set the origin for generated URLs
        watch: {
            // Reduce file watching overhead
            ignored: ['**/node_modules/**', '**/storage/**', '**/vendor/**'],
        },
    },
    esbuild: {
        jsx: 'automatic',
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            '@radix-ui/react-slot',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
        ],
    },
});