import { useProgression } from '../contexts/ProgressionContext';

/**
 * Hook for managing user progression logic.
 * Now consumes global ProgressionContext to keep state in sync across the app.
 */
export default function useXP() {
  return useProgression();
}
