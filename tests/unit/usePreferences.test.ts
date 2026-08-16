import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferences } from '../../src/hooks/usePreferences';

describe('usePreferences', () => {
  beforeEach(() => localStorage.clear());

  it('migrates existing players to sound on once, then remembers their choice', async () => {
    localStorage.setItem('daily-routine-preferences', JSON.stringify({ sound: false }));

    const first = renderHook(() => usePreferences());
    expect(first.result.current[0].sound).toBe(true);

    act(() => first.result.current[1]((current) => ({ ...current, sound: false })));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('daily-routine-preferences') ?? '{}').sound).toBe(
        false,
      ),
    );
    first.unmount();

    const returning = renderHook(() => usePreferences());
    expect(returning.result.current[0].sound).toBe(false);
  });
});
