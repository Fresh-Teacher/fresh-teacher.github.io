import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrentYear } from '@/hooks/use-current-year';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Automatic footer year', () => {
  it('uses the current calendar year rather than a fixed value', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6));
    const { result } = renderHook(useCurrentYear);
    expect(result.current).toBe(2026);
  });

  it('updates across New Year without requiring a reload or manual edit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 30));
    const { result } = renderHook(useCurrentYear);
    expect(result.current).toBe(2026);
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe(2027);
  });
});