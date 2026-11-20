import { useSyncExternalStore } from 'react';

// A page's search text lives outside the page shell so a keystroke re-renders
// only the parts that read it (search box, document list), never the shell.
export interface QueryStore { get: () => string; set: (value: string) => void; subscribe: (listener: () => void) => () => void }

export function createQueryStore(initial = ''): QueryStore {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: next => { if (next === value) return; value = next; listeners.forEach(listener => listener()); },
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}

export function useQuery(store: QueryStore) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
