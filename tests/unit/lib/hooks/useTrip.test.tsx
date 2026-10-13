import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../src/lib/api';
import { useTrip } from '../../../../src/lib/hooks/useTrip';
import { createQueryWrapper, createTestQueryClient } from '../../helpers/queryClient';

import type { Trip } from '../../../../src/types/trips';

vi.mock('../../../../src/lib/api', () => ({
  getTrip: vi.fn(),
}));

const trip = { id: 'trip-1', name: 'Test Trip' } as unknown as Trip;

describe('useTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTrip).mockResolvedValue(trip);
  });

  it('is pending until the trip is loaded', async () => {
    const { result } = renderHook(() => useTrip('trip-1'), { wrapper: createQueryWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.data).toEqual(trip));
    expect(result.current.isPending).toBe(false);
    expect(api.getTrip).toHaveBeenCalledWith('trip-1');
  });

  it('stores the trip under the ["trip", tripId] query key', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useTrip('trip-1'), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(queryClient.getQueryData(['trip', 'trip-1'])).toEqual(trip);
  });

  it('exposes the error when the trip cannot be loaded', async () => {
    const failure = new Error('not found');
    vi.mocked(api.getTrip).mockRejectedValue(failure);

    const { result } = renderHook(() => useTrip('trip-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(failure);
  });
});
