import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page static build. Every page below becomes its own HTML file in dist/,
// ready to drop straight into Hostinger's public_html.
export default defineConfig({
  // Relative base so the built site works whether it lives at the domain root
  // or in a sub-folder on shared hosting.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        why: resolve(__dirname, 'why-arkand.html'),
        contact: resolve(__dirname, 'contact.html'),
        join: resolve(__dirname, 'join-us.html'),
      },
    },
  },
});
