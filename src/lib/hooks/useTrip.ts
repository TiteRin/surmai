import { useQuery } from '@tanstack/react-query';

import { getTrip } from '../api';

import type { Trip } from '../../types/trips.ts';

export const useTrip = (tripId?: string) => {
  return useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  });
};
