import { useQuery } from '@tanstack/react-query';

import { TRIP_DATA_STALE_TIME } from './tripData.ts';
import { getTripAttachments } from '../api';

import type { Attachment } from '../../types/trips.ts';

export const useTripAttachments = (tripId?: string) => {
  const { data, isPending } = useQuery<Attachment[]>({
    queryKey: ['getTripAttachments', tripId],
    queryFn: () => getTripAttachments(tripId || ''),
    staleTime: TRIP_DATA_STALE_TIME,
  });

  return { tripAttachments: data || [], isPending };
};
