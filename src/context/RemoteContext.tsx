import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRemoteSocket } from '../hooks/useRemoteSocket';
import { remoteDispatcher } from '../services/remoteCommandDispatcher';
import { RemoteDevice, RemoteCommand, ConnectionState, RemoteCommandType } from '../types/remote';
import { useSettings } from './SettingsContext';

interface RemoteContextType {
  devices: RemoteDevice[];
  apps: { packageName: string; name: string; isActive?: boolean }[];
  selectedDevice: RemoteDevice | null;
  connectionState: ConnectionState;
  error: Error | null;
  getApps: () => void;
  launchApp: (packageName: string) => void;
  dispatch: (command: RemoteCommand) => Promise<void>;
  selectDevice: (deviceId: string | null) => void;
  listDevices: () => void;
  reconnect: () => void;
  disconnect: () => void;
  transport: any;
}

const RemoteContext = createContext<RemoteContextType | undefined>(undefined);

export function RemoteProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { connectionState, devices, apps, error, reconnect, disconnect, transport } = useRemoteSocket();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  useEffect(() => {
    if (transport && typeof transport.setUrl === 'function' && settings.serverUrl) {
       transport.setUrl(settings.serverUrl);
    }
  }, [settings.serverUrl, transport]);

  // Automatically request device list when connected
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      remoteDispatcher.dispatch({
        type: RemoteCommandType.DEVICE_LIST_REQUEST,
      }).catch(err => console.error("Failed to request device list", err));
    }
  }, [connectionState]);

  useEffect(() => {
    if (transport && typeof transport.setAutoReconnect === 'function') {
      transport.setAutoReconnect(settings.autoReconnect);
    }
  }, [settings.autoReconnect, transport]);

  // Auto-select first available device if none is selected and user hasn't manually changed it, OR use last saved
  useEffect(() => {
    if (devices.length > 0 && selectedDeviceId === null && !hasManuallySelected) {
      let initialDeviceParams = devices[0].id;
      
      if (settings.rememberLastDevice && settings.lastDeviceId) {
        const savedExists = devices.find(d => d.id === settings.lastDeviceId);
        if (savedExists) initialDeviceParams = settings.lastDeviceId;
      }

      setSelectedDeviceId(initialDeviceParams);
      
      remoteDispatcher.dispatch({
        type: RemoteCommandType.DEVICE_SELECT,
        payload: { deviceId: initialDeviceParams }
      }).catch(err => console.error("Failed to select device on backend", err));
    }
  }, [devices, selectedDeviceId, hasManuallySelected, settings.rememberLastDevice, settings.lastDeviceId]);

  const selectDevice = useCallback((deviceId: string | null) => {
    setSelectedDeviceId(deviceId);
    setHasManuallySelected(true);
    if (deviceId) {
      if (settings.rememberLastDevice) updateSettings({ lastDeviceId: deviceId });
      remoteDispatcher.dispatch({
          type: RemoteCommandType.DEVICE_SELECT,
          payload: { deviceId }
      }).catch(err => console.error("Failed to notify backend of device selection", err));
    }
  }, [settings.rememberLastDevice, updateSettings]);

  const listDevices = useCallback(() => {
    remoteDispatcher.dispatch({
      type: RemoteCommandType.DEVICE_LIST_REQUEST,
    }).catch(err => console.error("Failed to request device list", err));
  }, []);

  const getApps = useCallback(() => {
    remoteDispatcher.dispatch({
      type: RemoteCommandType.APP_LIST_REQUEST,
    }).catch(err => console.error("Failed to request app list", err));
  }, []);

  const launchApp = useCallback((packageName: string) => {
    remoteDispatcher.dispatch({
      type: RemoteCommandType.APP_LAUNCH,
      payload: { appId: packageName }
    }).catch(err => console.error("Failed to launch app", err));
  }, []);

  const dispatch = useCallback((command: RemoteCommand) => {
    return remoteDispatcher.dispatch(command);
  }, []);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;

  return (
    <RemoteContext.Provider value={{
      devices,
      apps,
      selectedDevice,
      connectionState,
      error,
      getApps,
      launchApp,
      dispatch,
      selectDevice,
      listDevices,
      reconnect,
      disconnect,
      transport
    }}>
      {children}
    </RemoteContext.Provider>
  );
}

export function useRemote(): RemoteContextType {
  const context = useContext(RemoteContext);
  if (context === undefined) {
    throw new Error('useRemote must be used within a RemoteProvider');
  }
  return context;
}
