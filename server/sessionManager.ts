import { WebSocket } from 'ws';
import { RemoteDevice } from '../src/types/remote';

export interface ClientSession {
  id: string;
  ws: WebSocket;
  selectedDeviceId: string | null;
  lastPing: number;
  isAlive: boolean;
}

export class SessionManager {
  private sessions = new Map<string, ClientSession>();
  private devices = new Map<string, RemoteDevice>(); // Device registry

  public createSession(ws: WebSocket, sessionId: string): ClientSession {
    const session: ClientSession = {
      id: sessionId,
      ws,
      selectedDeviceId: null,
      lastPing: Date.now(),
      isAlive: true,
    };
    this.sessions.set(sessionId, session);
    console.log(`[SessionManager] Created session ${sessionId}`);
    return session;
  }

  public getSession(sessionId: string): ClientSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionByWs(ws: WebSocket): ClientSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.ws === ws) return session;
    }
    return undefined;
  }

  public removeSession(sessionId: string) {
    this.sessions.delete(sessionId);
    console.log(`[SessionManager] Removed session ${sessionId}`);
  }

  public getAllSessions(): ClientSession[] {
    return Array.from(this.sessions.values());
  }

  // --- Device Registry Methods ---

  public updateDevice(device: RemoteDevice) {
    this.devices.set(device.id, device);
  }

  public getDevice(deviceId: string): RemoteDevice | undefined {
    return this.devices.get(deviceId);
  }

  public removeDevice(deviceId: string) {
    this.devices.delete(deviceId);
  }

  public getAllDevices(): RemoteDevice[] {
    return Array.from(this.devices.values());
  }
}

export const sessionManager = new SessionManager();
