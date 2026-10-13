import { useQuery } from '@tanstack/react-query';

import { TRIP_DATA_STALE_TIME } from './tripData.ts';
import { listTripTravellerProfiles } from '../api';

import type { TravellerProfile, Trip } from '../../types/trips.ts';

export const useTripTravellers = (trip?: Trip) => {
  const { data: tripTravellers = [] } = useQuery<TravellerProfile[]>({
    queryKey: ['listTripTravellerProfiles', trip?.id],
    queryFn: () => listTripTravellerProfiles(trip?.travellers || []),
    staleTime: TRIP_DATA_STALE_TIME,
    enabled: !!trip,
  });

  return { tripTravellers };
};
