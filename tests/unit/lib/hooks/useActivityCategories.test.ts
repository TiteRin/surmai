import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/src/lib/api';
import { useActivityCategories } from '@/src/lib/hooks/useActivityCategories.ts';

import type { ActivityCategory } from '@/src/types/trips.ts';
import type { ReactNode } from 'react';

// Mock the API module
vi.mock('@/src/lib/api', () => ({
  listActivityCategories: vi.fn(),
}));

// Wrapper function to render hooks with a fresh QueryClient (no retry, no shared cache)
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useActivityCategories', () => {
  const mockCategories = [
    { id: 'c1', key: 'coffee', name: 'Coffee', emoji: '☕', color: 'yellow', order: 1 },
    { id: 'c2', key: 'restaurant', name: 'Restaurant', emoji: '🍽️', color: 'grape', order: 2 },
  ] as ActivityCategory[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listActivityCategories).mockResolvedValue(mockCategories);
  });

  it('returns an empty list while the categories are loading', () => {
    const { result } = renderHook(() => useActivityCategories(), { wrapper: createWrapper() });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isPending).toBe(true);
  });

  it('returns the categories fetched from the api', async () => {
    const { result } = renderHook(() => useActivityCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(api.listActivityCategories).toHaveBeenCalledTimes(1);
    expect(result.current.categories).toEqual(mockCategories);
  });

  it('exposes the error and keeps an empty list when the api call fails', async () => {
    vi.mocked(api.listActivityCategories).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useActivityCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.categories).toEqual([]);
  });

  it('keeps the api order in the options', async ()=> {
    const { result } = renderHook(() => useActivityCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(
      result.current.categories
        .map((activityCategory) => activityCategory.key)
    ).toEqual(['coffee', 'restaurant']);
  });
});
