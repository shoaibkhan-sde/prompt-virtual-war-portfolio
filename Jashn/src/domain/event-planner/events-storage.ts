import { GeneratedEventPlan } from './types';

export const STORAGE_KEY_ACTIVE = 'jashn.pure_event_plan';
export const STORAGE_KEY_LIST = 'jashn.events_list';

export function getStoredEvents(): GeneratedEventPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawList = localStorage.getItem(STORAGE_KEY_LIST);
    if (rawList) {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Migration: check if a single plan exists in legacy active key
    const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (rawActive) {
      const active = JSON.parse(rawActive);
      if (active && active.id && active.input) {
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify([active]));
        return [active];
      }
    }
  } catch {
    // LocalStorage unavailable
  }
  return [];
}

export function saveStoredEvent(plan: GeneratedEventPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredEvents();
    const existingIndex = list.findIndex((e) => e.id === plan.id);
    let updatedList: GeneratedEventPlan[];
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = plan;
    } else {
      updatedList = [plan, ...list];
    }
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(plan));
  } catch {
    // Quota exceeded
  }
}

export function deleteStoredEvent(id: string): GeneratedEventPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getStoredEvents();
    const updated = list.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));

    const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (rawActive) {
      const active = JSON.parse(rawActive);
      if (active?.id === id) {
        if (updated.length > 0) {
          localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(updated[0]));
        } else {
          localStorage.removeItem(STORAGE_KEY_ACTIVE);
        }
      }
    }
    return updated;
  } catch {
    return [];
  }
}

export function selectActiveEvent(id: string): GeneratedEventPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const list = getStoredEvents();
    const found = list.find((e) => e.id === id);
    if (found) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(found));
      return found;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function clearActiveEvent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  } catch {
    // Ignore
  }
}

