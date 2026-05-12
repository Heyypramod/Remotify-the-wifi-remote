import { RemoteTransport } from './remoteCommandDispatcher';
import {
  ConnectionState,
  SocketMessage,
  SocketMessageWrapper,
  SocketMessageType,
  RemoteDevice
} from '../types/remote';

// Event listener definitions
type ConnectionStateListener = (state: ConnectionState) => void;
type DeviceListListener = (devices: RemoteDevice[]) => void;
type AppListListener = (apps: { packageName: string; name: string; isActive?: boolean }[]) => void;
type ErrorListener = (error: Error) => void;

interface QueuedMessage {
  wrapper: SocketMessageWrapper;
  resolve: () => void;
  reject: (error: Error) => void;
}

export class WebSocketTransport implements RemoteTransport {
  private url: string;
  private socket: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  
  // Reconnection logic
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelayMs = 1000;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private autoReconnectEnabled: boolean = true;
  
  // Heartbeat
  private readonly heartbeatIntervalMs = 10000;
  private readonly heartbeatTimeoutMs = 5000;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Queue
  private messageQueue: QueuedMessage[] = [];
  
  // Pending ACKs mapped by message ID
  private pendingAcks = new Map<string, { resolve: () => void; reject: (err: Error) => void; timeout: ReturnType<typeof setTimeout> }>();

  // Event Listeners
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private deviceListListeners: Set<DeviceListListener> = new Set();
  private appListListeners: Set<AppListListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  public setAutoReconnect(enabled: boolean) {
    this.autoReconnectEnabled = enabled;
  }

  public setUrl(url: string) {
    if (this.url !== url) {
      this.url = url;
      // Reconnect if we were manually connected or auto-reconnecting
      if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
        this.disconnect(false);
        this.connect();
      }
    }
  }

  public connect() {
    if (
      this.state === ConnectionState.CONNECTED ||
      this.state === ConnectionState.CONNECTING
    ) {
      return;
    }

    this.updateState(ConnectionState.CONNECTING);
    this.clearHeartbeat();
    
    try {
      console.log('Connecting to WebSocket URL:', this.url);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      this.scheduleReconnect();
    }
  }

  public disconnect(intentional: boolean = true) {
    this.clearHeartbeat();
    this.clearReconnect();
    
    if (this.socket) {
      this.socket.close(1000, 'Intentional disconnect');
      this.socket = null;
    }
    
    if (intentional) {
      this.updateState(ConnectionState.DISCONNECTED);
      this.rejectAllPending(new Error('Transport intentionally disconnected'));
    }
  }

  public async send(wrapper: SocketMessageWrapper): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state !== ConnectionState.CONNECTED || !this.socket) {
        // Queue if disconnected
        this.messageQueue.push({ wrapper, resolve, reject });
        return;
      }

      this.executeSend(wrapper, resolve, reject);
    });
  }

  private executeSend(wrapper: SocketMessageWrapper, resolve: () => void, reject: (error: Error) => void) {
    try {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        throw new Error('Socket not open');
      }

      const payload = JSON.stringify(wrapper);
      this.socket.send(payload);

      // We wait for an ACK
      const timeoutId = setTimeout(() => {
        if (this.pendingAcks.has(wrapper.id)) {
          this.pendingAcks.delete(wrapper.id);
          reject(new Error(`ACK Timeout for message ${wrapper.id}`));
        }
      }, 15000); // 15 sec timeout for ACK

      this.pendingAcks.set(wrapper.id, {
        resolve,
        reject,
        timeout: timeoutId
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // --- Internals ---

  private handleOpen() {
    this.reconnectAttempts = 0;
    this.updateState(ConnectionState.CONNECTED);
    this.startHeartbeat();
    this.flushQueue();
  }

  private handleClose(event: CloseEvent) {
    this.clearHeartbeat();
    this.socket = null;
    
    // Reject pending ACKs
    this.rejectAllPending(new Error('Connection closed temporarily'));
    
    // Normal closure (1000) check
    if (event.code === 1000) {
      this.updateState(ConnectionState.DISCONNECTED);
    } else {
      this.updateState(ConnectionState.RECONNECTING);
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event | Error) {
    const err = event instanceof Error ? event : new Error('WebSocket Error');
    this.errorListeners.forEach(listener => listener(err));
  }

  private handleMessage(event: MessageEvent) {
    // If it's a raw string 'pong', handle heartbeat
    if (typeof event.data === 'string' && event.data === 'PONG') {
      this.handlePong();
      return;
    }

    try {
      const wrapper = JSON.parse(event.data) as SocketMessageWrapper;
      
      if (!wrapper || !wrapper.message) return;

      const { message } = wrapper;

      switch (message.type) {
        case SocketMessageType.ACK:
          this.handleAck(message.payload.messageId, message.payload.status);
          break;
        case SocketMessageType.DEVICE_LIST:
          this.deviceListListeners.forEach(listener => listener(message.payload.devices));
          break;
        case SocketMessageType.APP_LIST:
          this.appListListeners.forEach(listener => listener(message.payload.apps));
          break;
        case SocketMessageType.EVENT:
          // Handle specific incoming events if needed
          break;
        case SocketMessageType.ERROR:
          this.errorListeners.forEach(l => l(new Error(`Server Error [${message.payload.code}]: ${message.payload.message}`)));
          break;
      }
    } catch (error) {
      console.error('Failed to parse incoming WebSocket message', error);
    }
  }

  private handleAck(messageId: string, status: 'success' | 'failure') {
    const pending = this.pendingAcks.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(messageId);
      
      if (status === 'success') {
        pending.resolve();
      } else {
        pending.reject(new Error(`Message ${messageId} failed on server`));
      }
    }
  }

  private rejectAllPending(error: Error) {
    for (const [id, pending] of this.pendingAcks.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingAcks.clear();
  }

  private flushQueue() {
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const item of queue) {
      this.executeSend(item.wrapper, item.resolve, item.reject);
    }
  }

  // --- Heartbeat ---

  private startHeartbeat() {
    this.clearHeartbeat();
    this.pingIntervalId = setInterval(() => {
      this.sendPing();
    }, this.heartbeatIntervalMs);
  }

  private sendPing() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send('PING');
      
      // Expect a PONG within timeout
      this.pongTimeoutId = setTimeout(() => {
        // Did not receive PONG
        console.warn('Heartbeat timeout, reconnecting...');
        if (this.socket) {
          this.socket.close(4000, 'Heartbeat Timeout');
        }
      }, this.heartbeatTimeoutMs);
    }
  }

  private handlePong() {
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  private clearHeartbeat() {
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    if (this.pongTimeoutId) clearTimeout(this.pongTimeoutId);
    this.pingIntervalId = null;
    this.pongTimeoutId = null;
  }

  // --- Reconnection ---

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) return;

    if (!this.autoReconnectEnabled) {
      this.updateState(ConnectionState.DISCONNECTED);
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateState(ConnectionState.ERROR);
      this.errorListeners.forEach(l => l(new Error('Max reconnect attempts reached.')));
      return;
    }

    // Exponential backoff
    const delay = this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  // --- Subscription & State ---

  private updateState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach(listener => listener(newState));
    }
  }

  public getConnectionState(): ConnectionState {
    return this.state;
  }

  public onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    // Emit current state immediately
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public onDeviceList(listener: DeviceListListener): () => void {
    this.deviceListListeners.add(listener);
    return () => this.deviceListListeners.delete(listener);
  }

  public onAppList(listener: AppListListener): () => void {
    this.appListListeners.add(listener);
    return () => this.appListListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }
}

// Optionally export a singleton instance, though hook manages it well.
export const wsTransport = new WebSocketTransport(
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
    : 'ws://localhost:3000/api/ws'
);
