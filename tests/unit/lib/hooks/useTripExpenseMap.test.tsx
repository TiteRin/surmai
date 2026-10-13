import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../src/lib/api';
import { TRIP_DATA_STALE_TIME } from '../../../../src/lib/hooks/tripData';
import { useTripExpenseMap } from '../../../../src/lib/hooks/useTripExpenseMap';
import { createQueryWrapper, createTestQueryClient } from '../../helpers/queryClient';

import type { Expense } from '../../../../src/types/trips';

vi.mock('../../../../src/lib/api', () => ({
  listExpenses: vi.fn(),
}));

const expenses = [
  { id: 'expense-1', name: 'Louvre', trip: 'trip-1', cost: { value: 42.5, currency: 'EUR' } },
  { id: 'expense-2', name: 'Hotel', trip: 'trip-1', cost: { value: 300, currency: 'EUR' } },
] as Expense[];

describe('useTripExpenseMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listExpenses).mockResolvedValue(expenses);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty map while the expenses are loading', async () => {
    const { result } = renderHook(() => useTripExpenseMap('trip-1'), { wrapper: createQueryWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.expenseMap.size).toBe(0);

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('indexes the expenses of the trip by id', async () => {
    const { result } = renderHook(() => useTripExpenseMap('trip-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.expenseMap.size).toBe(2));

    expect(api.listExpenses).toHaveBeenCalledWith('trip-1');
    expect(result.current.expenseMap.get('expense-1')).toEqual(expenses[0]);
    expect(result.current.expenseMap.get('expense-2')).toEqual(expenses[1]);
    expect(result.current.expenseMap.get('unknown')).toBeUndefined();
  });

  it('keeps the same map between renders when the expenses did not change', async () => {
    const { result, rerender } = renderHook(() => useTripExpenseMap('trip-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.expenseMap.size).toBe(2));
    const firstMap = result.current.expenseMap;

    rerender();

    expect(result.current.expenseMap).toBe(firstMap);
  });

  it('shares the ["listExpenses", tripId] cache entry used by the expenses panel', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['listExpenses', 'trip-1'], expenses);

    const { result } = renderHook(() => useTripExpenseMap('trip-1'), { wrapper: createQueryWrapper(queryClient) });

    expect(result.current.isPending).toBe(false);
    expect(result.current.expenseMap.get('expense-2')).toEqual(expenses[1]);
    expect(api.listExpenses).not.toHaveBeenCalled();
  });

  it('does not fetch again when another consumer mounts right after the data was loaded', async () => {
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripExpenseMap('trip-1'), { wrapper });
    await waitFor(() => expect(first.result.current.expenseMap.size).toBe(2));

    renderHook(() => useTripExpenseMap('trip-1'), { wrapper });

    expect(api.listExpenses).toHaveBeenCalledTimes(1);
  });

  it('fetches again when another consumer mounts once the data is outdated', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripExpenseMap('trip-1'), { wrapper });
    await waitFor(() => expect(first.result.current.expenseMap.size).toBe(2));

    vi.setSystemTime(Date.now() + TRIP_DATA_STALE_TIME + 1);
    renderHook(() => useTripExpenseMap('trip-1'), { wrapper });

    await waitFor(() => expect(api.listExpenses).toHaveBeenCalledTimes(2));
  });
});
