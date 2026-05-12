import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionState, RemoteDevice } from '../types/remote';
import { wsTransport, WebSocketTransport } from '../services/websocketTransport';
import { remoteDispatcher } from '../services/remoteCommandDispatcher';

export function useRemoteSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [devices, setDevices] = useState<RemoteDevice[]>([]);
  const [apps, setApps] = useState<{ packageName: string; name: string; isActive?: boolean }[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to ensure we only set the transport once on mount
  const transportSetRef = useRef(false);

  useEffect(() => {
    // Inject the transport into the dispatcher
    if (!transportSetRef.current) {
      remoteDispatcher.setTransport(wsTransport);
      transportSetRef.current = true;
    }

    // Subscribe to state changes
    const unsubscribeState = wsTransport.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    const unsubscribeDeviceList = wsTransport.onDeviceList((deviceList) => {
      setDevices(deviceList);
    });

    const unsubscribeAppList = wsTransport.onAppList((appList) => {
      setApps(appList);
    });

    const unsubscribeError = wsTransport.onError((err) => {
      setError(err);
      console.error('WebSocket Error:', err);
    });

    // Auto-connect on mount if not connected
    if (wsTransport.getConnectionState() === ConnectionState.DISCONNECTED) {
      wsTransport.connect();
    }

    return () => {
      unsubscribeState();
      unsubscribeDeviceList();
      unsubscribeAppList();
      unsubscribeError();
      // Only disconnect if we want to cleanup on unmount completely (e.g., leaving the app)
      // For Remotify, we might want to keep the connection alive in background,
      // but typical pattern is cleanup. 
      // We'll leave it running for global state or just abstract it here:
      // wsTransport.disconnect(true);
    };
  }, []);

  const reconnect = useCallback(() => {
    wsTransport.disconnect(true);
    wsTransport.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsTransport.disconnect(true);
  }, []);

  return {
    connectionState,
    devices,
    apps,
    error,
    transport: wsTransport,
    reconnect,
    disconnect
  };
}
