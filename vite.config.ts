import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * Dev middleware to serve /api/* directly from dist/api/
 * Keeps the public/ directory completely clean of generated icon files.
 */
function serveDistApi(): Plugin {
  return {
    name: 'serve-dist-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const cleanUrl = req.url.split('?')[0] || '';
          const filePath = join(process.cwd(), 'dist', cleanUrl);

          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const ext = extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.svg': 'image/svg+xml; charset=utf-8',
              '.json': 'application/json; charset=utf-8',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveDistApi()],
  server: {
    port: 5173,
    open: false,
  },
  resolve: {
    alias: {
      '@evetry/icon': join(process.cwd(), 'packages', 'icon', 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Keep dist/api generated files intact during frontend bundling
    sourcemap: true,
  },
});
