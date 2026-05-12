import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export function useHaptics() {
  const { settings } = useSettings();

  const vibrate = useCallback((pattern: VibratePattern) => {
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [settings.hapticFeedback]);

  return { vibrate };
}
