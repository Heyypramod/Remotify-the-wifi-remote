import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';
import { sessionManager } from './sessionManager';
import { commandRouter } from './router';
import { DeviceType } from '../src/types/remote';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function createWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });
  
  server.on('upgrade', (request, socket, head) => {
    // Vite intercepts upgrades too, so filter by path to be safe
    if (request.url === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const sessionId = crypto.randomUUID();
    console.log(`[WSS] Client connected. Session ID: ${sessionId} IP: ${req.socket.remoteAddress}`);
    
    // Create new session
    const session = sessionManager.createSession(ws, sessionId);

    ws.on('message', (message: Buffer) => {
      // Validate incoming format
      const rawMessage = message.toString();

      // Route through central command router
      commandRouter.handleMessage(ws, rawMessage);
    });

    ws.on('close', () => {
      console.log(`[WSS] Client disconnected. Session ID: ${sessionId}`);
      sessionManager.removeSession(sessionId);
    });

    ws.on('error', (error) => {
      console.error(`[WSS] Socket error for Session ID: ${sessionId}`, error);
      sessionManager.removeSession(sessionId);
    });
  });

  // Start heartbeat interval to clean up stale connections
  const interval = setInterval(() => {
    const sessions = sessionManager.getAllSessions();
    for (const session of sessions) {
      if (!session.isAlive) {
        console.log(`[WSS] Terminating stale session: ${session.id}`);
        session.ws.terminate();
        sessionManager.removeSession(session.id);
        continue;
      }

      session.isAlive = false;
      // Note: ping handles client-side pongs as well if the client is sending PING natively, 
      // but standard approach is server ping
      session.ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[WSS] WebSocket Server initialized on /ws');
  return wss;
}
