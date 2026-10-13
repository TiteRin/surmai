import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../src/lib/api';
import { TRIP_DATA_STALE_TIME } from '../../../../src/lib/hooks/tripData';
import { useTripAttachments } from '../../../../src/lib/hooks/useTripAttachments';
import { createQueryWrapper, createTestQueryClient } from '../../helpers/queryClient';

import type { Attachment } from '../../../../src/types/trips';

vi.mock('../../../../src/lib/api', () => ({
  getTripAttachments: vi.fn(),
}));

const attachments: Attachment[] = [
  { id: 'att-1', name: 'ticket.pdf', file: 'ticket_abc.pdf' },
  { id: 'att-2', name: 'other.png', file: 'other_abc.png' },
];

describe('useTripAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTripAttachments).mockResolvedValue(attachments);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty list while the attachments are loading', async () => {
    const { result } = renderHook(() => useTripAttachments('trip-1'), { wrapper: createQueryWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.tripAttachments).toEqual([]);

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('returns the attachments of the trip', async () => {
    const { result } = renderHook(() => useTripAttachments('trip-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.tripAttachments).toEqual(attachments));
    expect(api.getTripAttachments).toHaveBeenCalledWith('trip-1');
  });

  it('reads the attachments from the cache without fetching them again', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['getTripAttachments', 'trip-1'], attachments);

    const { result } = renderHook(() => useTripAttachments('trip-1'), { wrapper: createQueryWrapper(queryClient) });

    expect(result.current.isPending).toBe(false);
    expect(result.current.tripAttachments).toEqual(attachments);
    expect(api.getTripAttachments).not.toHaveBeenCalled();
  });

  it('shares a single request between several consumers', async () => {
    const wrapper = createQueryWrapper();
    const { result } = renderHook(
      () => {
        const first = useTripAttachments('trip-1');
        const second = useTripAttachments('trip-1');
        return { first, second };
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.second.tripAttachments).toEqual(attachments));
    expect(result.current.first.tripAttachments).toEqual(attachments);
    expect(api.getTripAttachments).toHaveBeenCalledTimes(1);
  });

  it('does not fetch again when another consumer mounts right after the data was loaded', async () => {
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripAttachments('trip-1'), { wrapper });
    await waitFor(() => expect(first.result.current.tripAttachments).not.toHaveLength(0));

    renderHook(() => useTripAttachments('trip-1'), { wrapper });

    expect(api.getTripAttachments).toHaveBeenCalledTimes(1);
  });

  it('fetches again when another consumer mounts once the data is outdated', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const wrapper = createQueryWrapper();
    const first = renderHook(() => useTripAttachments('trip-1'), { wrapper });
    await waitFor(() => expect(first.result.current.tripAttachments).not.toHaveLength(0));

    vi.setSystemTime(Date.now() + TRIP_DATA_STALE_TIME + 1);
    renderHook(() => useTripAttachments('trip-1'), { wrapper });

    await waitFor(() => expect(api.getTripAttachments).toHaveBeenCalledTimes(2));
  });

  it('fetches again when refetch is called', async () => {
    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useTripAttachments('trip-1'), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    await act(() => result.current.refetch());

    expect(api.getTripAttachments).toHaveBeenCalledTimes(2);
  });
});
