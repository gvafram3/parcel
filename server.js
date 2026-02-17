import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
    const app = express();

    // Create Vite server in middleware mode
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // SPA fallback - serve index.html for non-file requests
    app.use('*', async (req, res) => {
        try {
            const url = req.originalUrl;
            const html = await vite.transformIndexHtml(url, `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Parcel Delivery System</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
            vite.ssrFixStacktrace(e);
            res.status(500).end(e.stack);
        }
    });

    const port = 5173;
    return { app, vite, port };
}

createServer().then(({ app, port }) => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
