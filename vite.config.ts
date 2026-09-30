import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html'),
          ranges: path.resolve(import.meta.dirname, 'ranges.html'),
          custom: path.resolve(import.meta.dirname, 'custom.html'),
          edu: path.resolve(import.meta.dirname, 'edu.html'),
          services: path.resolve(import.meta.dirname, 'services.html'),
          contract: path.resolve(import.meta.dirname, 'contract.html'),
          exam: path.resolve(import.meta.dirname, 'exam.html'),
          result: path.resolve(import.meta.dirname, 'result.html'),
          contest: path.resolve(import.meta.dirname, 'contest.html'),
          profile: path.resolve(import.meta.dirname, 'profile.html'),
          'profile-settings': path.resolve(import.meta.dirname, 'profile-settings.html'),
          rules: path.resolve(import.meta.dirname, 'rules.html'),
          rating: path.resolve(import.meta.dirname, 'rating.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
