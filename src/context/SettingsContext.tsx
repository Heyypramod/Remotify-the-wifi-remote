import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type MotionIntensity = 'reduced' | 'normal' | 'expressive';

export interface AppSettings {
  ambientBackground: boolean;
  motionIntensity: MotionIntensity;
  hapticFeedback: boolean;
  serverUrl: string;
  autoReconnect: boolean;
  rememberLastDevice: boolean;
  lastDeviceId?: string;
}

const defaultSettings: AppSettings = {
  ambientBackground: true,
  motionIntensity: 'expressive',
  hapticFeedback: true,
  serverUrl: '', 
  autoReconnect: true,
  rememberLastDevice: true,
  lastDeviceId: undefined,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('remotify_settings');
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem('remotify_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
