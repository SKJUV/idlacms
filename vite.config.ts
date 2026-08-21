import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dns from 'dns';
import { defineConfig, loadEnv } from 'vite';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resendApiKey = env.RESEND_API_KEY || '';

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'vite-plugin-local-api-routes',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            const urlPath = req.url ? req.url.split('?')[0] : '';
            if (urlPath.startsWith('/api/')) {
              // Reload env from .env dynamically on each local request
              const loadedEnv = loadEnv(mode, process.cwd(), '');
              Object.assign(process.env, loadedEnv);

              const parseJsonBody = (r: any): Promise<any> =>
                new Promise((resolve) => {
                  if (r.body) return resolve(r.body);
                  let body = '';
                  r.on('data', (chunk: any) => { body += chunk; });
                  r.on('end', () => {
                    try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
                  });
                });

              const mockRes = (r: any) => {
                r.status = (code: number) => {
                  r.statusCode = code;
                  return r;
                };
                r.json = (data: any) => {
                  r.setHeader('Content-Type', 'application/json');
                  r.end(JSON.stringify(data));
                  return r;
                };
                return r;
              };

              try {
                if (urlPath === '/api/resend') {
                  req.body = await parseJsonBody(req);
                  const { default: handler } = await server.ssrLoadModule('/api/resend.ts');
                  return await handler(req, mockRes(res));
                }
                if (urlPath === '/api/send-otp') {
                  req.body = await parseJsonBody(req);
                  const { default: handler } = await server.ssrLoadModule('/api/send-otp.ts');
                  return await handler(req, mockRes(res));
                }
                if (urlPath === '/api/send-credentials') {
                  req.body = await parseJsonBody(req);
                  const { default: handler } = await server.ssrLoadModule('/api/send-credentials.ts');
                  return await handler(req, mockRes(res));
                }
              } catch (err: any) {
                console.error(`[Local API Error] ${urlPath}:`, err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message || 'Local API handler error' }));
              }
            }
            next();
          });
        },
      },
    ],
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
