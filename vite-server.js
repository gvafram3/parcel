import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const app = await createServer({
    plugins: [react()],
    server: {
        middlewareMode: true,
    },
});

// SPA fallback middleware
app.middlewares.use((req, res, next) => {
    if (req.method === 'GET' && req.url !== '/' && !req.url.includes('.')) {
        req.url = '/index.html';
    }
    next();
});

export { app };
