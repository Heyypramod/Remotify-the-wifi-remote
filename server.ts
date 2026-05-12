import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import path from 'path';
import { createWebSocketServer } from './server/index';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Create HTTP server to share between Express and WebSocket
  const server = http.createServer(app);

  // Initialize WebSocket backend architecture
  createWebSocketServer(server);

  // API Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Vite integration for development and static build behavior
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTP] Server running on http://localhost:${PORT}`);
    console.log(`[WSS] WebSocket transport fully attached on ws://localhost:${PORT}/api/ws`);
  });
}

startServer();
