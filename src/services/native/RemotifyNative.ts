import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface DeviceDiscoveredEvent {
  id: string;
  ip: string;
  name: string;
  port: number;
  serviceType: string;
}

export interface ConnectionStateChangeEvent {
  state: 'DISCONNECTED' | 'DISCOVERING' | 'CONNECTING' | 'PAIRING' | 'WAITING_FOR_PAIRING_PIN' | 'CONNECTED' | 'FAILED' | 'RECONNECTING';
}

export interface RemotifyNativePlugin {
  sendPointer(options: { deltaX: number; deltaY: number; direction: 'DOWN' | 'UP' | 'MOVE'; velocity?: number; gestureType?: string }): Promise<void>;
  sendTouchState(options: { down: boolean; isTap?: boolean; isLongPress?: boolean }): Promise<void>;
  sendKey(options: { key: string; direction: 'SHORT' | 'DOWN' | 'UP' }): Promise<void>;
  startDiscovery(): Promise<{ status: string }>;
  stopDiscovery(): Promise<{ status: string }>;
  
  connectToDevice(options: { ip: string }): Promise<{ status: string; ip: string }>;
  pairDevice(options: { pin: string }): Promise<{ status: string }>;
  disconnect(): Promise<{ status: string }>;
  
  getConnectionState(): Promise<{ state: string }>;
  
  addListener(
    eventName: 'deviceDiscovered',
    listenerFunc: (event: DeviceDiscoveredEvent) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  
  addListener(
    eventName: 'deviceRemoved',
    listenerFunc: (event: { ip: string, id: string }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  
  addListener(
    eventName: 'connectionStateChanged',
    listenerFunc: (event: ConnectionStateChangeEvent) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  
  addListener(
    eventName: 'pairingRequested',
    listenerFunc: (event: { ip: string }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  
  removeAllListeners(): Promise<void>;
}

const RemotifyNative = registerPlugin<RemotifyNativePlugin>('RemotifyNative');

export default RemotifyNative;
