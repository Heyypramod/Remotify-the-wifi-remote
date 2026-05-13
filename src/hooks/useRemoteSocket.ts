import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionState, RemoteDevice } from '../types/remote';
import { atrpTransport } from '../services/atrpTransport';
import { remoteDispatcher } from '../services/remoteCommandDispatcher';

export function useRemoteAdapter() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [devices, setDevices] = useState<RemoteDevice[]>([]);
  const [apps, setApps] = useState<{ packageName: string; name: string; isActive?: boolean }[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const transportSetRef = useRef(false);

  useEffect(() => {
    if (!transportSetRef.current) {
      remoteDispatcher.setTransport(atrpTransport as any);
      transportSetRef.current = true;
    }

    const unsubscribeState = atrpTransport.onConnectionStateChange((state) => setConnectionState(state));
    const unsubscribeDeviceList = atrpTransport.onDeviceList((deviceList) => setDevices(deviceList));
    const unsubscribeAppList = atrpTransport.onAppList((appList) => setApps(appList));
    const unsubscribeError = atrpTransport.onError((err) => {
      setError(err);
      console.error('Transport Error:', err);
    });

    return () => {
      unsubscribeState();
      unsubscribeDeviceList();
      unsubscribeAppList();
      unsubscribeError();
    };
  }, []);

  const reconnect = useCallback(() => {
    atrpTransport.disconnect(true);
  }, []);

  const disconnect = useCallback(() => {
    atrpTransport.disconnect(true);
  }, []);

  const providePin = useCallback((pin: string) => {
    atrpTransport.providePin(pin);
  }, []);

  const connectToDevice = useCallback((ip: string) => {
    atrpTransport.connectToDevice(ip);
  }, []);

  return {
    connectionState,
    devices,
    apps,
    error,
    transport: atrpTransport,
    reconnect,
    disconnect,
    providePin,
    connectToDevice
  };
}
