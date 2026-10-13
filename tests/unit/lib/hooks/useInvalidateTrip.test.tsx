import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInvalidateTrip } from '../../../../src/lib/hooks/useInvalidateTrip';
import { createQueryWrapper } from '../../helpers/queryClient';

// Mounts one observer per query key so that an invalidation triggers a refetch
const useObservedQueries = (fetchers: Record<string, () => Promise<string>>, tripId: string) => {
  const trip = useQuery({ queryKey: ['trip', tripId], queryFn: fetchers.trip });
  const attachments = useQuery({ queryKey: ['getTripAttachments', tripId], queryFn: fetchers.attachments });
  const expenses = useQuery({ queryKey: ['listExpenses', tripId], queryFn: fetchers.expenses });
  const activities = useQuery({ queryKey: ['listActivities', tripId], queryFn: fetchers.activities });
  const otherTrip = useQuery({ queryKey: ['trip', 'trip-2'], queryFn: fetchers.otherTrip });
  const invalidateTrip = useInvalidateTrip(tripId);

  return {
    invalidateTrip,
    loaded: [trip, attachments, expenses, activities, otherTrip].every((query) => query.isSuccess),
  };
};

const createFetchers = () => ({
  trip: vi.fn().mockResolvedValue('trip'),
  attachments: vi.fn().mockResolvedValue('attachments'),
  expenses: vi.fn().mockResolvedValue('expenses'),
  activities: vi.fn().mockResolvedValue('activities'),
  otherTrip: vi.fn().mockResolvedValue('other trip'),
});

describe('useInvalidateTrip', () => {
  it('refetches the trip, its attachments and its expenses', async () => {
    const fetchers = createFetchers();
    const { result } = renderHook(() => useObservedQueries(fetchers, 'trip-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(() => result.current.invalidateTrip());

    expect(fetchers.trip).toHaveBeenCalledTimes(2);
    expect(fetchers.attachments).toHaveBeenCalledTimes(2);
    expect(fetchers.expenses).toHaveBeenCalledTimes(2);
  });

  it('leaves the other queries and the other trips untouched', async () => {
    const fetchers = createFetchers();
    const { result } = renderHook(() => useObservedQueries(fetchers, 'trip-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(() => result.current.invalidateTrip());

    expect(fetchers.activities).toHaveBeenCalledTimes(1);
    expect(fetchers.otherTrip).toHaveBeenCalledTimes(1);
  });

  it('resolves once the refetched data is available', async () => {
    const fetchers = createFetchers();
    const { result } = renderHook(() => useObservedQueries(fetchers, 'trip-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    let resolveExpenses: (value: string) => void = () => {};
    fetchers.expenses.mockReturnValue(new Promise<string>((resolve) => (resolveExpenses = resolve)));

    let settled = false;
    let invalidation: Promise<void> = Promise.resolve();
    act(() => {
      invalidation = result.current.invalidateTrip().then(() => {
        settled = true;
      });
    });

    await waitFor(() => expect(fetchers.trip).toHaveBeenCalledTimes(2));
    expect(settled).toBe(false);

    await act(async () => {
      resolveExpenses('expenses');
      await invalidation;
    });
    expect(settled).toBe(true);
  });

  it('keeps the same function between renders', async () => {
    const fetchers = createFetchers();
    const { result, rerender } = renderHook(() => useObservedQueries(fetchers, 'trip-1'), {
      wrapper: createQueryWrapper(),
    });
    const first = result.current.invalidateTrip;

    rerender();

    expect(result.current.invalidateTrip).toBe(first);
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });
});
