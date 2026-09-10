import { useSettings as useSettingsBase } from '../contexts/SettingsContext';

/**
 * Hook for managing application settings.
 */
export default function useSettings() {
  return useSettingsBase();
}
