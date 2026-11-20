import { describe, expect, it } from 'vitest';
import { createQueryStore } from '@/lib/query-store';

describe('query store', () => {
  it('notifies subscribers only when the search text changes', () => {
    const store = createQueryStore();
    let calls = 0;
    const stop = store.subscribe(() => { calls += 1; });
    store.set('math');
    store.set('math');
    expect(store.get()).toBe('math');
    expect(calls).toBe(1);
    stop();
    store.set('');
    expect(calls).toBe(1);
  });
});
