import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../src/lib/api';
import { TRIP_DATA_STALE_TIME } from '../../../../src/lib/hooks/tripData';
import { useTripTravellers } from '../../../../src/lib/hooks/useTripTravellers';
import { createQueryWrapper, createTestQueryClient } from '../../helpers/queryClient';

import type { TravellerProfile, Trip } from '../../../../src/types/trips';

vi.mock('../../../../src/lib/api', () => ({
  listTripTravellerProfiles: vi.fn(),
}));

const trip = { id: 'trip-1', name: 'Test Trip', travellers: ['traveller-1', 'traveller-2'] } as unknown as Trip;

const travellers = [
  { id: 'traveller-1', email: 'jane@example.com', legalName: 'Jane Doe' },
  { id: 'traveller-2', email: 'john@example.com', legalName: 'John Doe' },
] as TravellerProfile[];

describe('useTripTravellers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listTripTravellerProfiles).mockResolvedValue(travellers);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty list while the travellers are loading', async () => {
    const { result } = renderHook(() => useTripTravellers(trip), { wrapper: createQueryWrapper() });

    expect(result.current).toEqual([]);

    await waitFor(() => expect(result.current).toEqual(travellers));
  });

  it('loads the profiles of the travellers of the trip', async () => {
    const { result } = renderHook(() => useTripTravellers(trip), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current).toEqual(travellers));
    expect(api.listTripTravellerProfiles).toHaveBeenCalledWith(['traveller-1', 'traveller-2']);
  });

  it('does not fetch anything until the trip is available', () => {
    const { result } = renderHook(() => useTripTravellers(undefined), { wrapper: createQueryWrapper() });

    expect(result.current).toEqual([]);
    expect(api.listTripTravellerProfiles).not.toHaveBeenCalled();
  });

  it('reads the travellers from the ["listTripTravellerProfiles", tripId] cache entry', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['listTripTravellerProfiles', 'trip-1'], travellers);

    const { result } = renderHook(() => useTripTravellers(trip), { wrapper: createQueryWrapper(queryClient) });

    expect(result.current).toEqual(travellers);
    expect(api.listTripTravellerProfiles).not.toHaveBeenCalled();
  });

  it('does not fetch again when another consumer mounts right after the data was loaded', async () => {
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripTravellers(trip), { wrapper });
    await waitFor(() => expect(first.result.current).not.toHaveLength(0));

    renderHook(() => useTripTravellers(trip), { wrapper });

    expect(api.listTripTravellerProfiles).toHaveBeenCalledTimes(1);
  });

  it('fetches again when another consumer mounts once the data is outdated', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripTravellers(trip), { wrapper });
    await waitFor(() => expect(first.result.current).not.toHaveLength(0));

    vi.setSystemTime(Date.now() + TRIP_DATA_STALE_TIME + 1);
    renderHook(() => useTripTravellers(trip), { wrapper });

    await waitFor(() => expect(api.listTripTravellerProfiles).toHaveBeenCalledTimes(2));
  });
});
