import { useHearts as useHeartsBase } from '../contexts/HeartsContext';

/**
 * Hook for managing user hearts/lives logic.
 */
export default function useHearts() {
  return useHeartsBase();
}
