import { RemoteTransport } from './remoteCommandDispatcher';
import {
  ConnectionState,
  SocketMessageWrapper,
  RemoteCommandType,
  RemoteDevice,
  DeviceType
} from '../types/remote';
import { AndroidTVProtocolClient, RemoteKeyCode, KeyAction } from './protocol/androidtv-protocol';
import { ATRPPairingFlow } from './pairing/pairing-flow';
import { MDNSDiscovery, DiscoveredDevice } from './discovery/mdns-discovery';

type ConnectionStateListener = (state: ConnectionState) => void;
type DeviceListListener = (devices: RemoteDevice[]) => void;
type AppListListener = (apps: { packageName: string; name: string; isActive?: boolean }[]) => void;
type ErrorListener = (error: Error) => void;

class ATRPTransport implements RemoteTransport {
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private deviceListListeners: Set<DeviceListListener> = new Set();
  private appListListeners: Set<AppListListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();

  private discovery = new MDNSDiscovery();
  private protocolClient: AndroidTVProtocolClient | null = null;
  public pairingFlow: ATRPPairingFlow | null = null;
  private currentIp: string | null = null;
  
  private autoReconnectEnabled = false;
  private reconnectInterval: any = null;

  constructor() {
    this.discovery.onDevicesChanged((discovered) => {
      const devices = discovered.map(d => ({
        id: `${d.ip}:${d.port}`,
        name: d.name,
        type: DeviceType.AndroidTV,
        ipAddress: d.ip,
        isConnected: this.currentIp === d.ip
      }));
      this.deviceListListeners.forEach(listener => listener(devices));

      // Attempt auto-reconnect if we have trusted credentials
      if (this.autoReconnectEnabled && this.state === ConnectionState.DISCONNECTED) {
        for (const device of devices) {
          if (this.hasTrustedCredentials(device.ipAddress)) {
            console.log(`[ATRP] Found trusted device ${device.ipAddress}, attempting auto-reconnect...`);
            this.connectToDevice(device.ipAddress);
            break; // Try only one for now
          }
        }
      }
    });
  }

  public setUrl(url: string) {}

  public setAutoReconnect(enabled: boolean) {
    this.autoReconnectEnabled = enabled;
  }

  public startDiscovery() {
    this.updateState(ConnectionState.DISCOVERING);
    this.discovery.startScan();
    // Simulate finding a device immediately for validation phase
    setTimeout(() => {
      const simulated: DiscoveredDevice = {
        id: '192.168.1.100:6466',
        name: 'Android TV',
        ip: '192.168.1.100',
        port: 6466,
        type: 'AndroidTV'
      };
      (this.discovery as any).notify([simulated]);
    }, 1000);
  }

  private hasTrustedCredentials(ip: string): boolean {
    const creds = localStorage.getItem(`atrp_trusted_${ip}`);
    return creds !== null;
  }

  private saveTrustedCredentials(ip: string) {
    localStorage.setItem(`atrp_trusted_${ip}`, JSON.stringify({ trusted: true, timestamp: Date.now() }));
  }

  private clearTrustedCredentials(ip: string) {
    localStorage.removeItem(`atrp_trusted_${ip}`);
  }

  public async connectToDevice(ip: string) {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.currentIp = ip;
    this.updateState(ConnectionState.CONNECTING);
    
    // Check persistence
    if (this.hasTrustedCredentials(ip)) {
      console.log(`[ATRP] Found existing credentials for ${ip}. Skipping pairing...`);
      await this.establishTLSConnection(ip);
      return;
    }
    
    this.pairingFlow = new ATRPPairingFlow({
      clientName: 'Remotify Web',
      serviceName: 'Remotify'
    });

    try {
      this.updateState(ConnectionState.PAIRING);
      await this.pairingFlow.initiatePairing(ip);
      this.updateState(ConnectionState.WAITING_FOR_PAIRING_PIN);
    } catch (err: any) {
      this.updateState(ConnectionState.FAILED);
      this.errorListeners.forEach(l => l(err));
    }
  }

  public async providePin(pin: string) {
    if (!this.pairingFlow || !this.currentIp) return;

    try {
      this.updateState(ConnectionState.PAIRING);
      const success = await this.pairingFlow.provideSecretCode(pin);
      if (success && this.currentIp) {
        this.saveTrustedCredentials(this.currentIp);
        await this.establishTLSConnection(this.currentIp);
      } else {
        this.updateState(ConnectionState.FAILED);
      }
    } catch (err: any) {
      this.updateState(ConnectionState.FAILED);
      this.errorListeners.forEach(l => l(err));
    }
  }

  private async establishTLSConnection(ip: string) {
    try {
      this.protocolClient = new AndroidTVProtocolClient(ip);
      this.protocolClient.onDisconnect = () => {
        this.handleUnexpectedDisconnect();
      };
      await this.protocolClient.connect(15000); // 15 sec timeout
      this.updateState(ConnectionState.CONNECTED);
    } catch (err: any) {
      console.error(`[ATRP] TLS Connection failed for ${ip}:`, err);
      this.updateState(ConnectionState.FAILED);
      this.errorListeners.forEach(l => l(err));
      this.scheduleReconnect();
    }
  }

  private handleUnexpectedDisconnect() {
    if (this.state === ConnectionState.DISCONNECTED) return; // Intentional
    console.warn(`[ATRP] Unexpected disconnect. Initiating retry flow...`);
    this.updateState(ConnectionState.RECONNECTING);
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (!this.autoReconnectEnabled || !this.currentIp) return;
    if (this.reconnectInterval) return;

    console.log(`[ATRP] Scheduling auto-reconnect backoff for ${this.currentIp}...`);
    let attempt = 0;
    
    this.reconnectInterval = setInterval(async () => {
      if (!this.currentIp) {
         clearInterval(this.reconnectInterval);
         return;
      }
      attempt++;
      console.log(`[ATRP] Auto-reconnect attempt ${attempt} for ${this.currentIp}...`);
      try {
        await this.establishTLSConnection(this.currentIp);
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      } catch (e) {
        // Continue retrying
        if (attempt > 5) {
           console.log(`[ATRP] Max reconnect attempts reached. Giving up.`);
           clearInterval(this.reconnectInterval);
           this.reconnectInterval = null;
           this.updateState(ConnectionState.DISCONNECTED);
        }
      }
    }, 5000); // Retry every 5s
  }

  public disconnect(intentional: boolean = true) {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (intentional && this.protocolClient) {
      this.protocolClient.onDisconnect = null; 
    }
    if (this.protocolClient) {
      this.protocolClient.disconnect();
      this.protocolClient = null;
    }
    this.currentIp = null;
    this.pairingFlow = null;
    this.updateState(ConnectionState.DISCONNECTED);
  }

  public async send(wrapper: SocketMessageWrapper): Promise<void> {
    const { message } = wrapper;
    if (message.type !== 'COMMAND') return;
    
    const command = message.payload;

    if (command.type === RemoteCommandType.DEVICE_LIST_REQUEST) {
      this.startDiscovery();
      return;
    }

    if (!this.protocolClient) {
      throw new Error("No protocol client");
    }

    if (command.type === RemoteCommandType.KEY) {
      if (command.payload.key === 'HOME') {
        await this.protocolClient.sendHome();
      }
      // other keys would map here
    }
  }

  // --- External Interface ---
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

export const atrpTransport = new ATRPTransport();
