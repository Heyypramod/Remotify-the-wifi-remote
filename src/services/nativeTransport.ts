import { RemoteTransport } from './remoteCommandDispatcher';
import { ConnectionState, RemoteDevice, SocketMessageWrapper, DeviceType } from '../types/remote';
import RemotifyNative from './native/RemotifyNative';

type ConnectionStateListener = (state: ConnectionState) => void;
type DeviceListListener = (devices: RemoteDevice[]) => void;
type AppListListener = (apps: { packageName: string; name: string; isActive?: boolean }[]) => void;
type ErrorListener = (error: Error) => void;

class NativeTransport implements RemoteTransport {
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private deviceListListeners: Set<DeviceListListener> = new Set();
  private appListListeners: Set<AppListListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  
  private discoveredDevices = new Map<string, RemoteDevice>();

  constructor() {
    this.setupListeners();
  }

  private async setupListeners() {
    await RemotifyNative.addListener('connectionStateChanged', (event) => {
      this.updateState(event.state as ConnectionState);
    });

    await RemotifyNative.addListener('deviceDiscovered', (event) => {
      const id = event.id || `${event.ip}:${event.port}`; // Fallback if id is missing
      this.discoveredDevices.set(id, {
        id,
        ipAddress: event.ip,
        name: event.name,
        type: DeviceType.AndroidTV,
        isConnected: false
      });
      this.notifyDeviceList();
    });
    
    await RemotifyNative.addListener('deviceRemoved', (event) => {
      // Find and remove by id or IP
      if (event.id && this.discoveredDevices.has(event.id)) {
          this.discoveredDevices.delete(event.id);
      } else {
        for (const [key, device] of this.discoveredDevices.entries()) {
          if (device.ipAddress === event.ip) {
            this.discoveredDevices.delete(key);
          }
        }
      }
      this.notifyDeviceList();
    });
  }

  private notifyDeviceList() {
    const devices = Array.from(this.discoveredDevices.values());
    this.deviceListListeners.forEach(l => l(devices));
  }

  private updateState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach(listener => listener(newState));
    }
  }

  public setUrl(url: string): void {}
  
  public setAutoReconnect(enabled: boolean): void {
     // TODO: pass to plugin
  }

  public async startDiscovery(): Promise<void> {
    this.discoveredDevices.clear();
    this.notifyDeviceList();
    await RemotifyNative.startDiscovery();
  }

  public async connectToDevice(ip: string): Promise<void> {
    await RemotifyNative.connectToDevice({ ip });
  }

  public async providePin(pin: string): Promise<void> {
    await RemotifyNative.pairDevice({ pin });
  }

  public async disconnect(intentional: boolean = true): Promise<void> {
    await RemotifyNative.disconnect();
  }

  public async send(wrapper: SocketMessageWrapper): Promise<void> {
    const { type, payload } = wrapper.message;
    if (type === 'COMMAND') {
      const command = payload as any; // Cast to access type safely
      if (command.type === 'POINTER') {
        const ptr = command.payload;
        if ((ptr.direction === 'DOWN' || ptr.direction === 'UP') && ptr.deltaX === 0 && ptr.deltaY === 0) {
          await RemotifyNative.sendTouchState({
            down: ptr.direction === 'DOWN'
          });
        } else {
          await RemotifyNative.sendPointer({
            deltaX: ptr.deltaX,
            deltaY: ptr.deltaY,
            direction: ptr.direction,
            velocity: 0,
            gestureType: 'swipe'
          });
        }
      } else {
        console.log("Native sending command (unimplemented in transport): ", wrapper);
      }
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
    // Send existing immediately
    listener(Array.from(this.discoveredDevices.values()));
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

export const nativeTransport = new NativeTransport();
